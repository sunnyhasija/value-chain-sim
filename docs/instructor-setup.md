# Instructor Manual — Setup and Run

## Purpose
This guide covers how to set up, launch, and run the Value Chain Investment Simulation in a live undergraduate class.

## Learning Goals (Quick Reference)
1. Differentiate value‑creating, value‑supporting, and non‑value‑add activities.
2. Experience tradeoffs under budget and time constraints.
3. Observe how linkages and consistency shape outcomes.

## Pre‑Class Checklist
1. Confirm the app is running and reachable for students.
2. Verify instructor credentials are set.
3. Confirm whether you are using Redis (recommended for multi‑user reliability) or local storage.
4. Decide team count and number of cycles.
5. Decide cycle time limit (suggested 5–7 minutes for undergraduates).

## Environment Configuration (Reference)
Set these environment variables in your deployment.
1. `INSTRUCTOR_USERNAME` (optional, default `admin`).
2. `INSTRUCTOR_PASSWORD` (required).
3. `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` (required for live updates).
4. `REDIS_URL` (optional but recommended for multi‑user or production).

## Create a Session
1. Sign in at the instructor login page.
2. Create a session with team count, cycle time limit, and max cycles.
3. Share team codes with students.

## Student Onboarding Flow
1. Students enter their team code.
2. Students choose a team name.
3. Students land on their team dashboard.

## Start the Game
1. When all teams are ready, click “Start Cycle 1.”
2. The timer begins and teams can submit decisions.

## During Each Cycle
1. Monitor submissions on the instructor dashboard.
2. Optionally inject a shock (after cycle 1 begins).
3. When ready, advance the cycle to process results.

## End the Game
1. When the final cycle completes, click “Complete Game.”
2. Export data for debrief or grading.

## Timing Suggestions for Undergraduate Classes
1. 1–2 minutes: Brief intro and rules.
2. 5 minutes: Cycle 1.
3. 3–5 minutes: Quick debrief.
4. 5 minutes: Cycle 2.
5. 3–5 minutes: Quick debrief.
6. 5 minutes: Cycle 3.
7. 10–15 minutes: Final debrief and discussion.

## Troubleshooting
1. A team can’t join. Verify the team code and session status; regenerate session if needed.
2. Teams don’t receive updates. Check Pusher configuration; verify network stability.
3. Results look frozen. Refresh the instructor page or re‑fetch state.
4. A team missed submission. You can still advance; their allocations default to zero.

## Instructor Notes
1. Students learn more when you pause after each cycle to ask “what changed and why.”
2. Encourage teams to explain their decisions using evidence from the results screen.
3. Keep the debrief focused on reasoning, not just rankings.
