/**
 * Study Planner Worker
 * - POST /api/phone      : 전화번호 저장
 * - GET  /api/phone      : 전화번호 조회
 * - POST /api/sync       : 오늘의 플랜 동기화 (앱 → KV)
 * - GET  /api/status     : 연결 확인
 * - Cron 23:00 UTC       : 매일 8:00 KST SMS 발송
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

export default {
  // ─── HTTP 요청 처리 ──────────────────────────────────────
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // API Key 인증 (GET /api/status 제외)
    if (path !== '/api/status') {
      const apiKey = request.headers.get('X-API-Key');
      if (!apiKey || apiKey !== env.API_KEY) {
        return json({ error: '인증 실패' }, 401);
      }
    }

    // GET /api/status — 연결 확인
    if (path === '/api/status' && request.method === 'GET') {
      return json({ ok: true, message: 'Study Planner Worker 정상 작동 중' });
    }

    // GET /api/phone — 저장된 전화번호 조회
    if (path === '/api/phone' && request.method === 'GET') {
      const phone = await env.KV.get('phone');
      return json({ phone: phone || null });
    }

    // POST /api/phone — 전화번호 저장
    if (path === '/api/phone' && request.method === 'POST') {
      const { phone } = await request.json();
      if (!phone) return json({ error: '전화번호가 없습니다' }, 400);
      await env.KV.put('phone', phone);
      return json({ ok: true });
    }

    // POST /api/sync — 오늘 플랜 동기화
    if (path === '/api/sync' && request.method === 'POST') {
      const body = await request.json();
      const { date, homeTime, homeTime2, homeTime3, homeTime4, studyroomTime, studyroomTime2, studyroomTime3, studyroomTime4, todayNote, tasks, subjects, dday, appUrl, weeklyTimetable, prevDay } = body;
      if (!date) return json({ error: 'date 필드가 필요합니다' }, 400);
      await env.KV.put(`plan:${date}`, JSON.stringify({ homeTime, homeTime2, homeTime3, homeTime4, studyroomTime, studyroomTime2, studyroomTime3, studyroomTime4, todayNote, tasks, subjects, dday, appUrl, weeklyTimetable, prevDay, syncedAt: Date.now() }));
      return json({ ok: true });
    }

    return json({ error: '없는 경로입니다' }, 404);
  },

  // ─── Cron 트리거: 매일 23:00 UTC = 8:00 KST ────────────
  async scheduled(event, env) {
    const phone = await env.KV.get('phone');
    if (!phone) {
      console.log('전화번호가 설정되지 않아 SMS를 건너뜁니다.');
      return;
    }

    // UTC 23:00 + 9시간 = KST 08:00 다음날
    const now = new Date(event.scheduledTime);
    const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const dateStr = kstDate.toISOString().split('T')[0];

    const planJson = await env.KV.get(`plan:${dateStr}`);
    const plan = planJson ? JSON.parse(planJson) : null;

    const message = buildMessage(dateStr, plan);

    try {
      await sendSMS(env, phone, message);
      console.log(`SMS 발송 완료 → ${phone} (${dateStr})`);
    } catch (err) {
      console.error('SMS 발송 실패:', err.message);
    }
  }
};

// ─── SMS 메시지 생성 ─────────────────────────────────────
function buildMessage(dateStr, plan) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const dateLabel = `${y}년 ${m}월 ${d}일 (${weekdays[date.getDay()]})`;

  let msg = `[스터디플래너] ${dateLabel}\n`;

  // 시간 계획
  if (plan?.homeTime || plan?.homeTime2 || plan?.homeTime3 || plan?.homeTime4) {
    const times = [plan.homeTime, plan.homeTime2, plan.homeTime3, plan.homeTime4].filter(Boolean).join(', ');
    msg += `\n🏠 집에 오는 시간: ${times}`;
  }
  if (plan?.studyroomTime || plan?.studyroomTime2 || plan?.studyroomTime3 || plan?.studyroomTime4) {
    const times = [plan.studyroomTime, plan.studyroomTime2, plan.studyroomTime3, plan.studyroomTime4].filter(Boolean).join(', ');
    msg += `\n📚 독서실 가는 시간: ${times}`;
  }
  if (plan?.homeTime || plan?.studyroomTime) msg += '\n';

  // D-Day
  if (plan?.dday?.date && plan?.dday?.title) {
    const t = new Date(dateStr);
    const target = new Date(plan.dday.date);
    const diff = Math.ceil((target - t) / 86400000);
    const ddayLabel = diff === 0 ? 'D-DAY!' : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
    msg += `\n🎯 ${plan.dday.title}: ${ddayLabel}\n`;
  }

  // Tasks 목록
  const tasks = plan?.tasks || [];
  if (tasks.length > 0) {
    msg += `\n📋 할 일 (${tasks.length}개)\n`;
    tasks.forEach(t => {
      const subjects = plan?.subjects || [];
      const subj = subjects.find(s => s.id === t.subjectId);
      const label = subj ? `[${subj.name}] ` : '';
      const statusIcon = t.status === 'completed' ? '✓ ' : t.status === 'failed' ? '✗ ' : '• ';
      msg += `${statusIcon}${label}${t.title}\n`;
    });
  } else {
    msg += '\n오늘 할 일을 앱에서 추가해보세요!\n';
  }

  // 타임테이블 기반 과목별 공부 예정 시간
  const timetable = plan?.weeklyTimetable || {};
  const subjects2 = plan?.subjects || [];
  const jsDay = new Date(y, m - 1, d).getDay();
  const dayIdx = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon~6=Sun

  // 오늘 날짜의 타임테이블 블록만 필터링 후 색상별 시간 집계
  const colorHours = {};
  Object.entries(timetable).forEach(([key, color]) => {
    if (!color) return;
    const [kDay] = key.split('-');
    if (parseInt(kDay) !== dayIdx) return;
    if (isNavyColor(color)) return;
    colorHours[color] = (colorHours[color] || 0) + 1;
  });

  // 색상 → 과목명 매핑
  const timeEntries = Object.entries(colorHours)
    .map(([color, hours]) => {
      const subj = subjects2.find(s => s.color === color);
      const name = subj ? subj.name : null;
      if (!name) return null;
      return `${name}: ${hours}시간`;
    })
    .filter(Boolean);

  if (timeEntries.length > 0) {
    msg += `\n⏱ 공부 예정 시간\n${timeEntries.join(', ')}\n`;
  }

  // 전날 달성률 + 공부 시간
  const prevTasks = plan?.prevDay?.tasks || [];
  if (prevTasks.length > 0) {
    const completed = prevTasks.filter(t => t.status === 'completed').length;
    const total = prevTasks.length;
    const rate = Math.round(completed / total * 100);
    msg += `\n📊 전날 달성률: ${completed}/${total} (${rate}%)`;
  }

  const timetable2 = plan?.weeklyTimetable || {};
  const subjects3 = plan?.subjects || [];
  const prevDate = new Date(y, m - 1, d);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevJsDay = prevDate.getDay();
  const prevDayIdx = prevJsDay === 0 ? 6 : prevJsDay - 1;
  const prevColorHours = {};
  Object.entries(timetable2).forEach(([key, color]) => {
    if (!color) return;
    const [kDay] = key.split('-');
    if (parseInt(kDay) !== prevDayIdx) return;
    if (isNavyColor(color)) return;
    prevColorHours[color] = (prevColorHours[color] || 0) + 1;
  });
  const prevTimeEntries = Object.entries(prevColorHours)
    .map(([color, hours]) => {
      const subj = subjects3.find(s => s.color === color);
      return subj ? `${subj.name}: ${hours}시간` : null;
    })
    .filter(Boolean);
  if (prevTimeEntries.length > 0) {
    msg += `\n⏱ 전날 공부 시간: ${prevTimeEntries.join(', ')}\n`;
  }

  msg += '\n오늘도 화이팅! 💪';
  return msg;
}

// ─── SMS 발송 (Solapi) ───────────────────────────────────
async function sendSMS(env, to, message) {
  return sendSolapi(env, to, message);
}

// Solapi (구 CoolSMS) — https://console.solapi.com
async function sendSolapi(env, to, message) {
  const apiKey = env.SOLAPI_API_KEY;
  const apiSecret = env.SOLAPI_API_SECRET;
  const from = env.SOLAPI_FROM;

  // HMAC-SHA256 서명 생성
  const date = new Date().toISOString();
  const salt = crypto.randomUUID().replace(/-/g, '');
  const sigData = `${date}${salt}`;

  const keyBuffer = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', keyBuffer, new TextEncoder().encode(sigData));
  const signature = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  const res = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
    },
    body: JSON.stringify({
      message: { to, from, text: message, type: 'SMS' }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Solapi 오류: ${res.status} ${err}`);
  }
}


// ─── 헬퍼 ────────────────────────────────────────────────
function isNavyColor(hex) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // 네이비: 파란색 계열이 지배적이고 전체적으로 어두운 색 (예: #1e3a8a → r=30,g=58,b=138)
  return b > r * 1.5 && b > g && b > 80;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}
