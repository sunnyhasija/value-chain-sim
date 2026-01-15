import { LinkageDefinition } from './types';

// Linkage definitions - Strategic connections between support and primary activities
// These are HIDDEN from teams - they must discover them through experimentation
export const LINKAGES: LinkageDefinition[] = [
  {
    id: 'forecasting-inventory',
    supportActivityId: 'demand-forecasting',
    primaryActivityId: 'inventory-replenishment',
    supportThreshold: 60,
    primaryThreshold: 60,
    effectivenessBonus: 0.15,      // +15% effectiveness
    decayReduction: 0.20,          // -20% decay rate
    description: 'Accurate demand forecasting enables optimal inventory levels and reduces stockouts',
  },
  {
    id: 'training-store-ops',
    supportActivityId: 'training-programs',
    primaryActivityId: 'store-operations',
    supportThreshold: 50,
    primaryThreshold: 50,
    effectivenessBonus: 0.10,      // +10% effectiveness
    description: 'Well-trained staff execute store operations more effectively',
  },
  {
    id: 'training-customer-service',
    supportActivityId: 'training-programs',
    primaryActivityId: 'customer-service',
    supportThreshold: 50,
    primaryThreshold: 50,
    effectivenessBonus: 0.10,      // +10% effectiveness
    description: 'Training programs improve customer service quality and consistency',
  },
  {
    id: 'it-checkout',
    supportActivityId: 'it-infrastructure',
    primaryActivityId: 'checkout-experience',
    supportThreshold: 60,
    primaryThreshold: 50,
    effectivenessBonus: 0.12,      // +12% effectiveness
    shockImmunity: true,           // Protects checkout from IT-related shocks
    description: 'Robust IT infrastructure ensures reliable checkout systems',
  },
  {
    id: 'it-distribution',
    supportActivityId: 'it-infrastructure',
    primaryActivityId: 'distribution-throughput',
    supportThreshold: 60,
    primaryThreshold: 50,
    effectivenessBonus: 0.10,      // +10% effectiveness
    shockImmunity: true,           // Protects distribution from IT-related shocks
    description: 'IT systems enable efficient logistics and distribution tracking',
  },
  {
    id: 'supplier-inventory',
    supportActivityId: 'supplier-management',
    primaryActivityId: 'inventory-replenishment',
    supportThreshold: 50,
    primaryThreshold: 50,
    effectivenessBonus: 0.08,
    decayReduction: 0.15,          // -15% decay (stronger supplier relationships = more stable supply)
    description: 'Strong supplier relationships ensure reliable product availability',
  },
  {
    id: 'supplier-pricing',
    supportActivityId: 'supplier-management',
    primaryActivityId: 'pricing-merchandising',
    supportThreshold: 50,
    primaryThreshold: 50,
    effectivenessBonus: 0.08,      // +8% effectiveness
    description: 'Better supplier terms enable more competitive pricing and promotions',
  },
  {
    id: 'workforce-store-ops',
    supportActivityId: 'workforce-systems',
    primaryActivityId: 'store-operations',
    supportThreshold: 50,
    primaryThreshold: 60,
    effectivenessBonus: 0.05,
    decayReduction: 0.10,          // -10% decay rate
    description: 'Effective workforce systems reduce turnover and maintain operational consistency',
  },
];

// Helper functions
export function getLinkageById(id: string): LinkageDefinition | undefined {
  return LINKAGES.find(l => l.id === id);
}

export function getLinkagesForSupportActivity(supportActivityId: string): LinkageDefinition[] {
  return LINKAGES.filter(l => l.supportActivityId === supportActivityId);
}

export function getLinkagesForPrimaryActivity(primaryActivityId: string): LinkageDefinition[] {
  return LINKAGES.filter(l => l.primaryActivityId === primaryActivityId);
}

export function getAllLinkages(): LinkageDefinition[] {
  return LINKAGES;
}

// Check if a linkage is active given activity health values
export function isLinkageActive(
  linkage: LinkageDefinition,
  supportHealth: number,
  primaryHealth: number
): boolean {
  return supportHealth >= linkage.supportThreshold && primaryHealth >= linkage.primaryThreshold;
}

// Get all linkages that would be active given a map of activity health values
export function getActiveLinkages(activityHealth: Record<string, number>): LinkageDefinition[] {
  return LINKAGES.filter(linkage => {
    const supportHealth = activityHealth[linkage.supportActivityId] || 0;
    const primaryHealth = activityHealth[linkage.primaryActivityId] || 0;
    return isLinkageActive(linkage, supportHealth, primaryHealth);
  });
}

// Get linkages that are close to activation (within threshold)
export function getNearActiveLinkages(
  activityHealth: Record<string, number>,
  withinPoints: number = 10
): LinkageDefinition[] {
  return LINKAGES.filter(linkage => {
    const supportHealth = activityHealth[linkage.supportActivityId] || 0;
    const primaryHealth = activityHealth[linkage.primaryActivityId] || 0;

    // Not currently active but within range
    const isActive = isLinkageActive(linkage, supportHealth, primaryHealth);
    if (isActive) return false;

    const supportGap = linkage.supportThreshold - supportHealth;
    const primaryGap = linkage.primaryThreshold - primaryHealth;

    // At least one is close and neither is too far
    return (supportGap <= withinPoints || primaryGap <= withinPoints) &&
           supportGap <= withinPoints * 2 && primaryGap <= withinPoints * 2;
  });
}

// Calculate total linkage bonus for a primary activity
export function calculateLinkageBonus(
  primaryActivityId: string,
  activityHealth: Record<string, number>
): number {
  const relevantLinkages = getLinkagesForPrimaryActivity(primaryActivityId);
  let totalBonus = 0;

  for (const linkage of relevantLinkages) {
    const supportHealth = activityHealth[linkage.supportActivityId] || 0;
    const primaryHealth = activityHealth[primaryActivityId] || 0;

    if (isLinkageActive(linkage, supportHealth, primaryHealth)) {
      totalBonus += linkage.effectivenessBonus;
    }
  }

  return totalBonus;
}

// Get decay rate modifier from active linkages
export function getDecayModifier(
  activityId: string,
  activityHealth: Record<string, number>
): number {
  const relevantLinkages = getLinkagesForPrimaryActivity(activityId);
  let decayReduction = 0;

  for (const linkage of relevantLinkages) {
    if (!linkage.decayReduction) continue;

    const supportHealth = activityHealth[linkage.supportActivityId] || 0;
    const primaryHealth = activityHealth[activityId] || 0;

    if (isLinkageActive(linkage, supportHealth, primaryHealth)) {
      decayReduction += linkage.decayReduction;
    }
  }

  // Return as multiplier (e.g., 0.8 for 20% reduction)
  return Math.max(0, 1 - decayReduction);
}

// Check if activity has shock immunity from any active linkage
export function hasShockImmunity(
  activityId: string,
  activityHealth: Record<string, number>
): boolean {
  const relevantLinkages = getLinkagesForPrimaryActivity(activityId);

  for (const linkage of relevantLinkages) {
    if (!linkage.shockImmunity) continue;

    const supportHealth = activityHealth[linkage.supportActivityId] || 0;
    const primaryHealth = activityHealth[activityId] || 0;

    if (isLinkageActive(linkage, supportHealth, primaryHealth)) {
      return true;
    }
  }

  return false;
}
