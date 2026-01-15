import { ActivityDefinition } from './types';

// Value Creating Activities - Primary activities that directly create customer value
export const VALUE_CREATING_ACTIVITIES: ActivityDefinition[] = [
  {
    id: 'store-operations',
    name: 'Store Operations',
    description: 'Shelf stocking, store cleanliness, floor labor management, and in-store execution',
    category: 'value-creating',
    startingHealth: 60,
    decayRate: 5,
    weight: 1.2,
  },
  {
    id: 'checkout-experience',
    name: 'Checkout Experience',
    description: 'Point-of-sale systems, queue management, payment processing, and customer throughput',
    category: 'value-creating',
    startingHealth: 55,
    decayRate: 4,
    weight: 1.0,
  },
  {
    id: 'inventory-replenishment',
    name: 'Inventory Replenishment',
    description: 'Stock availability, reorder processes, backroom management, and fill rates',
    category: 'value-creating',
    startingHealth: 65,
    decayRate: 6,
    weight: 1.3,
  },
  {
    id: 'pricing-merchandising',
    name: 'Pricing & Merchandising',
    description: 'Pricing strategy, promotional execution, product placement, and category management',
    category: 'value-creating',
    startingHealth: 50,
    decayRate: 4,
    weight: 1.1,
  },
  {
    id: 'distribution-throughput',
    name: 'Distribution Throughput',
    description: 'Warehouse operations, delivery scheduling, logistics efficiency, and distribution network',
    category: 'value-creating',
    startingHealth: 60,
    decayRate: 5,
    weight: 1.0,
  },
  {
    id: 'customer-service',
    name: 'Customer Service',
    description: 'Customer inquiries, complaint resolution, returns processing, and service quality',
    category: 'value-creating',
    startingHealth: 55,
    decayRate: 4,
    weight: 0.9,
  },
];

// Value Supporting Activities - Support activities that enable primary activities
export const VALUE_SUPPORTING_ACTIVITIES: ActivityDefinition[] = [
  {
    id: 'workforce-systems',
    name: 'Workforce Systems',
    description: 'HR processes, scheduling software, payroll systems, and labor planning tools',
    category: 'value-supporting',
    startingHealth: 50,
    decayRate: 3,
  },
  {
    id: 'it-infrastructure',
    name: 'IT Infrastructure',
    description: 'Network systems, hardware maintenance, software platforms, and technology backbone',
    category: 'value-supporting',
    startingHealth: 55,
    decayRate: 4,
  },
  {
    id: 'supplier-management',
    name: 'Supplier Management',
    description: 'Vendor relationships, procurement processes, contract management, and supplier scorecards',
    category: 'value-supporting',
    startingHealth: 50,
    decayRate: 3,
  },
  {
    id: 'training-programs',
    name: 'Training Programs',
    description: 'Employee onboarding, skill development, certification programs, and knowledge management',
    category: 'value-supporting',
    startingHealth: 45,
    decayRate: 3,
  },
  {
    id: 'demand-forecasting',
    name: 'Demand Forecasting',
    description: 'Sales prediction, trend analysis, seasonal planning, and inventory optimization models',
    category: 'value-supporting',
    startingHealth: 50,
    decayRate: 4,
  },
];

// Non-Value-Add Activities - Activities that consume resources but don't add competitive value
export const NON_VALUE_ADD_ACTIVITIES: ActivityDefinition[] = [
  {
    id: 'legacy-inventory-system',
    name: 'Legacy Inventory System',
    description: 'Outdated inventory tracking software requiring manual reconciliation and workarounds',
    category: 'non-value-add',
    startingHealth: 100, // Always "active" until eliminated
    decayRate: 0,
    maintenanceCost: 1.5,    // $1.5M per cycle
    eliminationCost: 3,      // $3M one-time
  },
  {
    id: 'regional-management-layer',
    name: 'Regional Management Layer',
    description: 'Redundant middle management structure creating bureaucracy and slow decision-making',
    category: 'non-value-add',
    startingHealth: 100,
    decayRate: 0,
    maintenanceCost: 2,      // $2M per cycle
    eliminationCost: 4,      // $4M one-time
  },
  {
    id: 'manual-reporting-processes',
    name: 'Manual Reporting Processes',
    description: 'Time-consuming manual data entry and report generation across departments',
    category: 'non-value-add',
    startingHealth: 100,
    decayRate: 0,
    maintenanceCost: 1,      // $1M per cycle
    eliminationCost: 2,      // $2M one-time
  },
  {
    id: 'innovation-lab',
    name: 'Innovation Lab',
    description: 'A shiny new initiative exploring emerging technologies with unclear ROI (trap)',
    category: 'non-value-add',
    startingHealth: 0,       // Not active by default
    decayRate: 0,
    maintenanceCost: 2.5,    // $2.5M per cycle if activated
    eliminationCost: undefined, // Cannot be eliminated once started - it's a trap!
  },
];

// Combined list of all activities
export const ALL_ACTIVITIES: ActivityDefinition[] = [
  ...VALUE_CREATING_ACTIVITIES,
  ...VALUE_SUPPORTING_ACTIVITIES,
  ...NON_VALUE_ADD_ACTIVITIES,
];

// Helper functions
export function getActivityById(id: string): ActivityDefinition | undefined {
  return ALL_ACTIVITIES.find(a => a.id === id);
}

export function getActivitiesByCategory(category: ActivityDefinition['category']): ActivityDefinition[] {
  return ALL_ACTIVITIES.filter(a => a.category === category);
}

export function getValueCreatingActivities(): ActivityDefinition[] {
  return VALUE_CREATING_ACTIVITIES;
}

export function getValueSupportingActivities(): ActivityDefinition[] {
  return VALUE_SUPPORTING_ACTIVITIES;
}

export function getNonValueAddActivities(): ActivityDefinition[] {
  return NON_VALUE_ADD_ACTIVITIES;
}

// Calculate total starting NVA maintenance cost (activities that start active)
export function getStartingNVAMaintenanceCost(): number {
  return NON_VALUE_ADD_ACTIVITIES
    .filter(a => a.startingHealth === 100 && a.maintenanceCost)
    .reduce((sum, a) => sum + (a.maintenanceCost || 0), 0);
}
