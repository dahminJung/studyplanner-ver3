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
      const { date, homeTime, studyroomTime, todayNote, tasks, subjects, dday } = body;
      if (!date) return json({ error: 'date 필드가 필요합니다' }, 400);
      await env.KV.put(`plan:${date}`, JSON.stringify({ homeTime, studyroomTime, todayNote, tasks, subjects, dday, syncedAt: Date.now() }));
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
  if (plan?.homeTime) msg += `\n🏠 집에 오는 시간: ${plan.homeTime}`;
  if (plan?.studyroomTime) msg += `\n📚 독서실 가는 시간: ${plan.studyroomTime}`;
  if (plan?.homeTime || plan?.studyroomTime) msg += '\n';

  // 오늘 할 일 메모
  if (plan?.todayNote) {
    msg += `\n📝 오늘 할 일\n${plan.todayNote}\n`;
  }

  // D-Day
  if (plan?.dday?.date && plan?.dday?.title) {
    const t = new Date(dateStr);
    const target = new Date(plan.dday.date);
    const diff = Math.ceil((target - t) / 86400000);
    const ddayLabel = diff === 0 ? 'D-DAY!' : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
    msg += `\n🎯 ${plan.dday.title}: ${ddayLabel}\n`;
  }

  // 할 일
  const tasks = plan?.tasks || [];
  const pending = tasks.filter(t => (t.status || 'pending') === 'pending');
  if (tasks.length > 0) {
    msg += `\n📝 오늘의 할 일 (${tasks.length}개)\n`;
    tasks.forEach(t => {
      const subjects = plan?.subjects || [];
      const subj = subjects.find(s => s.id === t.subjectId);
      const label = subj ? `[${subj.name}] ` : '';
      msg += `• ${label}${t.title}\n`;
    });
  } else {
    msg += '\n오늘 할 일을 앱에서 추가해보세요!\n';
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
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}
