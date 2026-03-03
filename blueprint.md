# Study Planner - Blueprint (Modern Web Style)

## Overview
A digital study planner designed to replicate the analog "10-minute planner" aesthetic but modernized for the web. It uses `localStorage` for data persistence and offers a seamless Weekly to Daily synchronization workflow.

## Core Features Implemented

### 1. Settings Page (`settings.html`)
- Users can create custom subjects/tasks and assign them a specific pastel color (including a newly added Navy color).
- Subjects are saved to `localStorage` and used globally across the planner.

### 2. Weekly Planner (`weekly.html`)
- Displays the current week's date range automatically (e.g., Mon 3/2 ~ Sun 3/8).
- A 1-hour interval grid (06:00 to 02:00) spanning 7 days.
- **Edit Mode**: Users click "변경하기" to start editing.
- **Drag-to-Select**: Users can click and drag across multiple time blocks to select them.
- **Color Popup**: Upon releasing the mouse, a popup appears showing the user's configured subject colors. Clicking a color paints the selected blocks.
- **Save & Sync**: Clicking "저장" saves the weekly schedule to `localStorage` and records a timestamp to trigger daily sync.

### 3. Daily Dashboard (`index.html`)
- Displays the current date dynamically.
- **Today's Timetable**: Automatically extracts and displays ONLY today's schedule from the Weekly Planner. It synchronizes automatically whenever the Weekly Planner is updated.
- **Task List (To-Do)**: Users can add daily tasks and link them to the subjects created in settings. Tasks show a color-coded badge. Checks update a live completion counter.
- **Reflection**: A text area for daily notes and self-feedback.

## Technical Architecture
- **Vanilla Web Tech**: Built entirely with HTML, CSS (Grid/Flexbox, CSS Variables), and JS (ES Modules). No external frameworks.
- **Data Storage**: `localStorage` (`studyPlannerSubjects`, `studyPlannerTasks`, `studyPlannerWeekly`, `studyPlannerDaily`, `studyPlannerWeeklyLastUpdate`).
- **Deployment**: Continuously integrated and deployed via GitHub Actions / Cloudflare Pages.

## Future Considerations
- Adding multi-week data persistence (currently stores a single active week template).
- Adding actual timers or alarms.
- PWA (Progressive Web App) conversion for mobile app installation.