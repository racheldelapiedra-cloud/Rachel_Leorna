/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ToolStatus = 'available' | 'in_use' | 'under_maintenance' | 'service_required' | 'decommissioned';

export type MaintenanceType = 'routine_inspection' | 'repair' | 'calibration' | 'cleaning' | 'safety_check';

export type MaintenanceStatus = 'completed' | 'pending' | 'in_progress';

export interface LocationChange {
  id: string;
  fromLocation: string;
  toLocation: string;
  changedAt: string;
  updatedBy: string;
}

export interface MaintenanceRecord {
  id: string;
  toolId: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  performedBy: string;
  date: string;
  nextServiceDate?: string;
  status: MaintenanceStatus;
  workOrderNumber?: string;
}

export interface Tool {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  category: string;
  status: ToolStatus;
  currentLocation: string;
  previousLocation: string | null;
  locationHistory: LocationChange[];
  maintenanceHistory: MaintenanceRecord[];
  purchaseDate: string;
  acquisitionCost?: number;
  tagNumber?: string;
  lastInspectedDate: string;
  assignedTo: string | null;
  custodian?: 'RTO' | 'ED' | 'PROJECT OWNED';
  rtoProject?: string;
}
