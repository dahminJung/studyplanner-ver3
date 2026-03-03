# Study Planner - Blueprint (Modern Web Style)

## Overview
A digital study planner that inherits the highly effective structured layout of 10-minute planners (Date, Goal, Tasks, Time Table, Reflection) but presents it in a clean, modern web-native UI.

## New Feature: Settings Page
* **Purpose**: Allow users to define their subjects/categories and assign specific light/pastel colors to them.
* **Storage**: Data is saved to `localStorage` so it persists and can be used in the main planner.
* **UI**: A dedicated `settings.html` page accessible via a button in the main header.

## Layout Components
1. **Top Bar**: Date, D-Day, and a 'Settings' button.
2. **Goal Banner**: High-impact section for the daily objective.
3. **Main Content (Two Columns)**:
   - **Left Column**: Tasks with checkboxes.
   - **Right Column**: 10-Minute Timetable. The color picker now dynamically loads the user's subjects/colors from settings.
4. **Footer**: Total time summary and a large reflection text area.
