/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tool } from './types';

export const INITIAL_TOOLS: Tool[] = [
  {
    id: 'tool-1',
    name: 'DeWalt DCH273B 20V Max XR Rotary Hammer Drill',
    model: 'DCH273B',
    serialNumber: 'DW-XR-82931',
    category: 'Power Tools',
    status: 'available',
    currentLocation: 'Jobsite Alpha - Storage Locker B',
    previousLocation: 'Central Warehouse - Aisle 4B',
    purchaseDate: '2025-02-15',
    acquisitionCost: 349.00,
    tagNumber: 'PT-01',
    lastInspectedDate: '2026-04-10',
    assignedTo: null,
    custodian: 'RTO',
    rtoProject: 'Project Alpha',
    locationHistory: [
      {
        id: 'loc-1-1',
        fromLocation: 'Central Warehouse - Aisle 4B',
        toLocation: 'Jobsite Alpha - Storage Locker B',
        changedAt: '2026-05-12T08:30:00Z',
        updatedBy: 'Sarah Jenkins (Site Mgr)'
      }
    ],
    maintenanceHistory: [
      {
        id: 'maint-1-1',
        toolId: 'tool-1',
        type: 'routine_inspection',
        description: 'Completed biannual brushless motor diagnostic and clutch test. Replaced carbon dust shield.',
        cost: 45.00,
        performedBy: 'Marcus Vance (Senior Tech)',
        date: '2026-04-10',
        nextServiceDate: '2026-10-10',
        status: 'completed',
        workOrderNumber: 'WO-2026-3841'
      }
    ]
  },
  {
    id: 'tool-5',
    name: 'Bosch GWS13-50 High-Performance Angle Grinder',
    model: 'GWS13-50',
    serialNumber: 'BS-AG-11782',
    category: 'Power Tools',
    status: 'service_required',
    currentLocation: 'Jobsite Delta - Storage Locker 1',
    previousLocation: 'Central Warehouse - Aisle 4B',
    purchaseDate: '2025-01-30',
    acquisitionCost: 180.00,
    tagNumber: 'BG-01',
    lastInspectedDate: '2026-05-15',
    assignedTo: 'Carlos Mendoza',
    custodian: 'ED',
    locationHistory: [
      {
        id: 'loc-5-1',
        fromLocation: 'Central Warehouse - Aisle 4B',
        toLocation: 'Jobsite Delta - Storage Locker 1',
        changedAt: '2026-05-10T11:00:00Z',
        updatedBy: 'Robert Chen (Logistics Co.)'
      }
    ],
    maintenanceHistory: [
      {
        id: 'maint-5-1',
        toolId: 'tool-5',
        type: 'safety_check',
        description: 'User reported high vibration and intermittent trigger shutoff during metal cutting. Requires switch terminal assembly inspection.',
        cost: 0,
        performedBy: 'Marcus Vance (Senior Tech)',
        date: '2026-05-15',
        status: 'pending',
        workOrderNumber: 'WO-2026-9051'
      }
    ]
  }
];
export const AVAILABLE_CATEGORIES = [
  'All Categories',
  'Power Tools'
];

export const AVAILABLE_LOCATIONS = [
  'Central Warehouse - Aisle 4B',
  'Central Warehouse - Delicate Storage Cabin B',
  'Jobsite Alpha - Storage Locker B',
  'Jobsite Alpha - North Entrance',
  'Jobsite Beta - Level 3 Electrical Framing',
  'Jobsite Delta - Storage Locker 1',
  'Jobsite Delta - Main Excavation Area',
  'Maintenance Workshop - Repair Bay A',
  'Transit Truck - Unit #4'
];
