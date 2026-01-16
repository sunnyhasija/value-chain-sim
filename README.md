# Value Chain Investment Simulation

This project is a classroom-ready simulation that teaches Porter's Value Chain Analysis through a competitive, time‑boxed decision game. Student teams act as the executive team of a regional grocery chain and allocate limited capital across value‑creating and support activities while deciding which non‑value‑add activities to eliminate.

The simulation runs over multiple cycles (quarters). Each cycle:
- Teams allocate investment across activities to improve operational health.
- Hidden strategic linkages amplify results when certain activity pairs are strong.
- External shocks can be injected by the instructor to test resilience.
- CAS (Competitive Advantage Score) is calculated to rank teams and update budgets.

## What we are trying to do

The goal is to make value‑chain tradeoffs tangible and measurable. Teams must:
- Balance short‑term budget constraints with long‑term capability building.
- Discover which activities create the most leverage.
- Decide when to cut non‑value‑add work without harming core performance.
- Respond to shocks and competitive pressure across cycles.

## Instructor flow

1) Create a game session to generate team codes.  
2) Distribute codes to teams and start the game.  
3) Monitor submissions, advance cycles, and inject shocks.  
4) Review CAS breakdowns and export results for debrief.

## Student flow

1) Join with team code.  
2) Read the company brief and review starting health.  
3) Allocate budget, submit decisions each cycle, and track rank.  

## Getting Started (local)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment variables

Instructor auth:

```
INSTRUCTOR_USERNAME=admin
INSTRUCTOR_PASSWORD=your-password
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
```

Storage (choose one):

```
REDIS_URL=rediss://default:YOUR_PASSWORD@your-host:your-port
```

If `REDIS_URL` is not set, the app falls back to local JSON storage for development.
