# Instructor Manual — Value Chain Investment Simulation

## Purpose
This simulation helps students apply Porter's Value Chain by making strategic investment decisions under constraints. Teams allocate limited capital across activities, experience decays and shocks, and learn how fit between activities compounds results.

## Learning Objectives
- Distinguish between core, enabling, and overhead activities.
- Observe how sustained investment patterns shape competitive advantage.
- Understand how complementarities (linkages) create outsized gains.
- Practice decision‑making under uncertainty and time pressure.

## Quick Setup
1) Instructor signs in and creates a game session.
2) Select number of teams and rounds (manual timing recommended for class).
3) Distribute team codes; students join and set team names.
4) Start Cycle 1 when everyone is ready.

## How to Run in Class
- Run 2–4 rounds for a short session, 4–6 for a longer session.
- Encourage teams to choose a deliberate focus, then stay consistent.
- After each cycle, debrief briefly on outcomes and trends.
- At the end, use the scorecard export for a full debrief.

## Scoring and Mechanics (Reference)

### Health Updates
- **Base investment effectiveness:** 2 health points per $1M invested.
- **Diminishing returns:** If current health ≥ 80, investment gains are halved.
- **Decay:** Each activity loses health each cycle by its decay rate.
- **Linkage effects:** Active linkages modify investment effectiveness and/or decay.

### CAS (Competitive Advantage Score)
CAS per cycle is the sum of:
1) **Base score:** Weighted difference between a team’s primary activity health and the industry average.  
2) **Linkage bonuses:** For each active linkage, CAS bonus = effectivenessBonus × 30.  
3) **Shock effect:** If immune linkage active, +2 bonus; otherwise shock healthImpact × 0.2.  
4) **NVA drag:** Each active non‑value‑add activity applies a penalty of maintenanceCost × 0.5.

### Budget and Margin
- **Base budget:** revenue × 0.05
- **CAS adjustment:** casChange × 0.1
- **NVA maintenance costs:** subtracted each cycle for active NVA activities
- **Margin change:** casChange × 0.05

## Activity Definitions (Reference)

### Value‑Creating Activities (weights apply to CAS base score)
- Store Operations — start 60, decay 5, weight 1.2  
- Checkout Experience — start 55, decay 4, weight 1.0  
- Inventory Replenishment — start 65, decay 6, weight 1.3  
- Pricing & Merchandising — start 50, decay 4, weight 1.1  
- Distribution Throughput — start 60, decay 5, weight 1.0  
- Customer Service — start 55, decay 4, weight 0.9  

### Value‑Supporting Activities
- Workforce Systems — start 50, decay 3  
- IT Infrastructure — start 55, decay 4  
- Supplier Management — start 50, decay 3  
- Training Programs — start 45, decay 3  
- Demand Forecasting — start 50, decay 4  

### Non‑Value‑Add Activities (maintenance and elimination)
- Legacy Inventory System — maintenance 1.5, elimination 3  
- Regional Management Layer — maintenance 2.0, elimination 4  
- Manual Reporting Processes — maintenance 1.0, elimination 2  
- Innovation Lab (trap) — maintenance 2.5, elimination not allowed once active  

## Linkages (Synergy Rules)
Linkages activate when both support and primary thresholds are met.

- Demand Forecasting → Inventory Replenishment  
  Thresholds: 60 / 60  
  Effectiveness bonus: +0.15  
  Decay reduction: 0.20  

- Training Programs → Store Operations  
  Thresholds: 50 / 50  
  Effectiveness bonus: +0.10  

- Training Programs → Customer Service  
  Thresholds: 50 / 50  
  Effectiveness bonus: +0.10  

- IT Infrastructure → Checkout Experience  
  Thresholds: 60 / 50  
  Effectiveness bonus: +0.12  
  Shock immunity: true  

- IT Infrastructure → Distribution Throughput  
  Thresholds: 60 / 50  
  Effectiveness bonus: +0.10  
  Shock immunity: true  

- Supplier Management → Inventory Replenishment  
  Thresholds: 50 / 50  
  Effectiveness bonus: +0.08  
  Decay reduction: 0.15  

- Supplier Management → Pricing & Merchandising  
  Thresholds: 50 / 50  
  Effectiveness bonus: +0.08  

- Workforce Systems → Store Operations  
  Thresholds: 50 / 60  
  Effectiveness bonus: +0.05  
  Decay reduction: 0.10  

## Scoring Interpretations (For Debrief)
- **Consistency**: stable investment patterns typically build health and CAS.
- **Fit**: linkages reward coordinated strengthening of related activities.
- **Efficiency**: high CAS with lower spend indicates strong strategic focus.

## Suggested Debrief Prompts
- What changed from one cycle to the next?
- Which investments had a delayed payoff?
- Where did cuts help or harm performance?
- How did stable vs. scattered allocations compare?
