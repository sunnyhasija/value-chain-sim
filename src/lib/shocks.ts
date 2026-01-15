import { ShockDefinition } from './types';

// External shocks that can be injected by the instructor
// These simulate real-world disruptions that test strategic resilience
export const SHOCKS: ShockDefinition[] = [
  {
    id: 'supply-chain-disruption',
    name: 'Supply Chain Disruption',
    description: 'Major supplier experiences production issues',
    narrative: `BREAKING NEWS: One of your key regional suppliers has experienced a warehouse fire,
    disrupting deliveries for the foreseeable future. Teams with strong supplier relationships
    and robust inventory systems may weather this storm better than others.`,
    affectedActivities: ['inventory-replenishment', 'distribution-throughput'],
    healthImpact: -15,
    immunityLinkages: ['supplier-inventory'],
  },
  {
    id: 'pos-system-outage',
    name: 'POS System Outage',
    description: 'Regional point-of-sale system failure',
    narrative: `SYSTEM ALERT: A critical software bug has caused widespread POS terminal failures
    across the region. Checkout lines are backing up. Teams with robust IT infrastructure
    may have redundant systems in place.`,
    affectedActivities: ['checkout-experience'],
    healthImpact: -20,
    immunityLinkages: ['it-checkout'],
  },
  {
    id: 'labor-shortage',
    name: 'Labor Shortage',
    description: 'Regional labor market tightens significantly',
    narrative: `MARKET UPDATE: A new distribution center opening nearby is aggressively recruiting,
    creating a regional labor shortage. Stores are struggling to maintain staffing levels.
    Teams with strong workforce systems and training programs may retain staff better.`,
    affectedActivities: ['store-operations', 'customer-service'],
    healthImpact: -12,
    immunityLinkages: ['workforce-store-ops', 'training-store-ops'],
  },
  {
    id: 'competitor-price-war',
    name: 'Competitor Price War',
    description: 'Major competitor launches aggressive pricing campaign',
    narrative: `COMPETITIVE ALERT: Your largest competitor has launched a "Price Match Guarantee"
    campaign with significant markdowns. Customers are comparing prices more carefully.
    Teams with strong supplier relationships may have more margin flexibility.`,
    affectedActivities: ['pricing-merchandising'],
    healthImpact: -18,
    immunityLinkages: ['supplier-pricing'],
  },
  {
    id: 'logistics-disruption',
    name: 'Logistics Network Disruption',
    description: 'Transportation delays affect distribution',
    narrative: `OPERATIONS ALERT: Severe weather and road construction have created significant
    delays in your regional distribution network. Delivery windows are being missed.
    Teams with strong IT infrastructure for logistics may route around disruptions.`,
    affectedActivities: ['distribution-throughput', 'inventory-replenishment'],
    healthImpact: -14,
    immunityLinkages: ['it-distribution'],
  },
  {
    id: 'demand-spike',
    name: 'Unexpected Demand Spike',
    description: 'Viral social media trend causes demand surge',
    narrative: `TRENDING NOW: A viral TikTok video featuring products from your stores has created
    unexpected demand surges. Shelves are emptying faster than anticipated. Teams with
    strong demand forecasting and inventory systems may capitalize on this opportunity.`,
    affectedActivities: ['inventory-replenishment', 'store-operations'],
    healthImpact: -10,
    immunityLinkages: ['forecasting-inventory'],
  },
  {
    id: 'customer-service-crisis',
    name: 'Customer Service Crisis',
    description: 'Social media backlash from service incident',
    narrative: `REPUTATION ALERT: A customer service incident at one of your stores has gone viral
    on social media. Customers are demanding better treatment. Teams with strong training
    programs may demonstrate better service recovery skills.`,
    affectedActivities: ['customer-service'],
    healthImpact: -16,
    immunityLinkages: ['training-customer-service'],
  },
  {
    id: 'cybersecurity-incident',
    name: 'Cybersecurity Incident',
    description: 'Attempted data breach detected',
    narrative: `SECURITY ALERT: Your IT team has detected and contained an attempted data breach.
    While no customer data was compromised, system lockdowns are affecting operations.
    Teams with robust IT infrastructure may recover faster.`,
    affectedActivities: ['checkout-experience', 'distribution-throughput'],
    healthImpact: -12,
    immunityLinkages: ['it-checkout', 'it-distribution'],
  },
];

// Helper functions
export function getShockById(id: string): ShockDefinition | undefined {
  return SHOCKS.find(s => s.id === id);
}

export function getAllShocks(): ShockDefinition[] {
  return SHOCKS;
}

export function getRandomShock(): ShockDefinition {
  const index = Math.floor(Math.random() * SHOCKS.length);
  return SHOCKS[index];
}

// Get shocks that affect a specific activity
export function getShocksAffectingActivity(activityId: string): ShockDefinition[] {
  return SHOCKS.filter(s => s.affectedActivities.includes(activityId));
}

// Check if a team has immunity to a shock based on active linkages
export function hasShockImmunity(
  shock: ShockDefinition,
  activeLinkageIds: string[]
): boolean {
  return shock.immunityLinkages.some(linkageId => activeLinkageIds.includes(linkageId));
}

// Calculate the effective health impact of a shock, considering immunities
export function calculateShockImpact(
  shock: ShockDefinition,
  activityId: string,
  activeLinkageIds: string[]
): number {
  // Check if activity is affected
  if (!shock.affectedActivities.includes(activityId)) {
    return 0;
  }

  // Check for immunity
  if (hasShockImmunity(shock, activeLinkageIds)) {
    return 0; // Full immunity
  }

  return shock.healthImpact;
}

// Get suggested shocks for a cycle (varies by cycle number for narrative progression)
export function getSuggestedShocksForCycle(cycle: number): ShockDefinition[] {
  switch (cycle) {
    case 1:
      // Mild shocks for cycle 1 - let teams get started
      return SHOCKS.filter(s => Math.abs(s.healthImpact) <= 12);
    case 2:
      // Medium intensity
      return SHOCKS.filter(s => Math.abs(s.healthImpact) >= 10 && Math.abs(s.healthImpact) <= 16);
    case 3:
      // Higher intensity - test resilience
      return SHOCKS.filter(s => Math.abs(s.healthImpact) >= 14);
    case 4:
      // Final cycle - any shock is fair game
      return SHOCKS;
    default:
      return SHOCKS;
  }
}
