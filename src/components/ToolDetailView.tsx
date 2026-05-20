/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tool, ToolStatus, MaintenanceType, MaintenanceStatus, LocationChange, MaintenanceRecord } from '../types';
import { AVAILABLE_LOCATIONS } from '../initialData';
import { 
  MapPin, Wrench, Clock, Plus, DollarSign, User, Calendar, 
  Send, ListPlus, History, Shield, CheckCircle, HelpCircle, 
  AlertTriangle, Hammer, FileCheck2, ArrowRightLeft, Info, Trash2, Download
} from 'lucide-react';

interface ToolDetailViewProps {
  tool: Tool | null;
  onUpdateTool: (updatedTool: Tool) => void;
  onDeleteTool: (id: string) => void;
  rtoProjects: string[];
  onAddRtoProject: (newProj: string) => boolean;
}

export default function ToolDetailView({ 
  tool, 
  onUpdateTool, 
  onDeleteTool,
  rtoProjects,
  onAddRtoProject
}: ToolDetailViewProps) {
  // Transfer Location states
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [newLocation, setNewLocation] = useState(AVAILABLE_LOCATIONS[0]);
  const [customLoc, setCustomLoc] = useState('');
  const [useCustomLoc, setUseCustomLoc] = useState(false);
  const [transferOperator, setTransferOperator] = useState('');
  const [transferError, setTransferError] = useState('');

  // RTO customized projects selection states
  const [useCustomDetailRtoProject, setUseCustomDetailRtoProject] = useState(false);
  const [customDetailRtoProject, setCustomDetailRtoProject] = useState('');
  const [rtoDetailError, setRtoDetailError] = useState('');

  // Maintenance Log states
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [maintType, setMaintType] = useState<MaintenanceType>('routine_inspection');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintCost, setMaintCost] = useState('0');
  const [maintOperator, setMaintOperator] = useState('');
  const [maintStatus, setMaintStatus] = useState<MaintenanceStatus>('completed');
  const [maintDate, setMaintDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextService, setNextService] = useState('');
  const [maintWorkOrder, setMaintWorkOrder] = useState('');
  const [maintError, setMaintError] = useState('');

  // Tab state: 'history' or 'maintenance'
  const [activeTab, setActiveTab] = useState<'details' | 'maint_logs' | 'loc_history'>('details');

  // Custom delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Detail Editing state
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftModel, setDraftModel] = useState('');
  const [draftSerialNumber, setDraftSerialNumber] = useState('');
  const [draftTagNumber, setDraftTagNumber] = useState('');
  const [draftPurchaseDate, setDraftPurchaseDate] = useState('');
  const [draftAcquisitionCost, setDraftAcquisitionCost] = useState('');
  const [draftLastInspectedDate, setDraftLastInspectedDate] = useState('');
  const [draftAssignedTo, setDraftAssignedTo] = useState('');
  const [draftCustodian, setDraftCustodian] = useState<'RTO' | 'ED' | 'PROJECT OWNED'>('RTO');
  const [draftRtoProject, setDraftRtoProject] = useState('');
  const [detailsError, setDetailsError] = useState('');

  // Sync draft states whenever current tool changes
  React.useEffect(() => {
    if (tool) {
      setDraftName(tool.name || '');
      setDraftModel(tool.model || '');
      setDraftSerialNumber(tool.serialNumber || '');
      setDraftTagNumber(tool.tagNumber || '');
      setDraftPurchaseDate(tool.purchaseDate || '');
      setDraftAcquisitionCost(tool.acquisitionCost !== undefined ? String(tool.acquisitionCost) : '');
      setDraftLastInspectedDate(tool.lastInspectedDate || '');
      setDraftAssignedTo(tool.assignedTo || '');
      setDraftCustodian(tool.custodian || 'RTO');
      setDraftRtoProject(tool.rtoProject || '');
      setIsEditingDetails(false);
      setDetailsError('');
      setRtoDetailError('');
    }
  }, [tool?.id]);

  if (!tool) {
    return (
      <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-500 border border-zinc-800">
          <Info className="w-5 h-5 text-amber-500" />
        </div>
        <h4 className="text-sm font-semibold text-zinc-200">No Equipment Selected</h4>
        <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
          Select any light equipment item from the list on the left to start monitoring, tracking locations, and logging maintenance history.
        </p>
      </div>
    );
  }

  // Calculate stats
  const totalMaintCost = tool.maintenanceHistory.reduce((sum, item) => sum + item.cost, 0);
  const pendingMaintCount = tool.maintenanceHistory.filter(i => i.status !== 'completed').length;

  const getStatusMeta = (status: ToolStatus) => {
    switch (status) {
      case 'available':
        return { text: 'Available / Ready', bg: 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50', dot: 'bg-emerald-500' };
      case 'in_use':
        return { text: 'In Active Use', bg: 'bg-blue-950/30 text-blue-400 border-blue-900/40', dot: 'bg-blue-500' };
      case 'under_maintenance':
        return { text: 'In Maintenance Shop', bg: 'bg-amber-950/30 text-amber-400 border-amber-900/40', dot: 'bg-amber-500' };
      case 'service_required':
        return { text: 'Requires Service', bg: 'bg-rose-950/30 text-rose-450 border-rose-900/50', dot: 'bg-rose-500' };
      case 'decommissioned':
        return { text: 'Decommissioned', bg: 'bg-zinc-900-60 text-zinc-500 border-zinc-800', dot: 'bg-zinc-600' };
    }
  };

  const currentStatusMeta = getStatusMeta(tool.status);

  // Trigger technical status dropdown change
  const handleStatusChange = (newStatus: ToolStatus) => {
    const updatedTool: Tool = {
      ...tool,
      status: newStatus,
      lastInspectedDate: newStatus === 'available' ? new Date().toISOString().split('T')[0] : tool.lastInspectedDate
    };
    onUpdateTool(updatedTool);
  };

  // Trigger Operator/Custody assignment change
  const handleCustodyChange = (operatorName: string) => {
    const updatedTool: Tool = {
      ...tool,
      assignedTo: operatorName.trim() || null
    };
    onUpdateTool(updatedTool);
  };

  // Save changes under "Details & Locations" tab
  const handleSaveDetails = () => {
    setDetailsError('');
    if (!draftName.trim()) {
      setDetailsError('Equipment name cannot be empty.');
      return;
    }

    const parsedCost = draftAcquisitionCost ? parseFloat(draftAcquisitionCost) : undefined;
    if (draftAcquisitionCost && (isNaN(parsedCost!) || parsedCost! < 0)) {
      setDetailsError('Entrance rate or acquisition cost must be a positive number.');
      return;
    }

    let finalRtoProject = draftRtoProject.trim();
    if (draftCustodian === 'RTO') {
      if (useCustomDetailRtoProject) {
        const trimmedCustom = customDetailRtoProject.trim();
        if (trimmedCustom) {
          onAddRtoProject(trimmedCustom);
          finalRtoProject = trimmedCustom;
        } else if (!finalRtoProject) {
          setDetailsError('Please enter a custom project name or select from list.');
          return;
        }
      } else {
        if (!finalRtoProject) {
          finalRtoProject = rtoProjects[0] || 'Project Alpha';
        }
      }
    } else {
      finalRtoProject = '';
    }

    const updatedTool: Tool = {
      ...tool,
      name: draftName.trim(),
      model: draftModel.trim(),
      serialNumber: draftSerialNumber.trim(),
      tagNumber: draftTagNumber.trim() || undefined,
      purchaseDate: draftPurchaseDate.trim(),
      acquisitionCost: parsedCost,
      lastInspectedDate: draftLastInspectedDate.trim(),
      assignedTo: draftAssignedTo.trim() || null,
      custodian: draftCustodian,
      rtoProject: draftCustodian === 'RTO' ? finalRtoProject : undefined
    };

    onUpdateTool(updatedTool);
    setIsEditingDetails(false);
    setUseCustomDetailRtoProject(false);
    setCustomDetailRtoProject('');
  };

  // Handle Location Transfer Submission
  const handleLocationTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');

    const targetLocation = useCustomLoc ? customLoc.trim() : newLocation;
    if (useCustomLoc && !customLoc.trim()) {
      setTransferError('Please enter a location name');
      return;
    }

    if (!transferOperator.trim()) {
      setTransferError('Please designate the operator or manager facilitating this move');
      return;
    }

    const previousLoc = tool.currentLocation;
    const newLog: LocationChange = {
      id: `loc-log-${Date.now()}`,
      fromLocation: previousLoc,
      toLocation: targetLocation,
      changedAt: new Date().toISOString(),
      updatedBy: transferOperator.trim()
    };

    const updatedTool: Tool = {
      ...tool,
      previousLocation: previousLoc, // Current becomes previous
      currentLocation: targetLocation, // Overwrite with new location
      locationHistory: [newLog, ...tool.locationHistory] // Prepend log entry
    };

    onUpdateTool(updatedTool);
    
    // Reset transfer state
    setShowTransferForm(false);
    setCustomLoc('');
    setTransferOperator('');
  };

  // Handle Maintenance Log Submission
  const handleMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMaintError('');

    if (!maintDesc.trim()) {
      setMaintError('Please specify diagnostic/service details');
      return;
    }

    if (!maintOperator.trim()) {
      setMaintError('Please designate the servicing technician');
      return;
    }

    const newRecord: MaintenanceRecord = {
      id: `maint-log-${Date.now()}`,
      toolId: tool.id,
      type: maintType,
      description: maintDesc.trim(),
      cost: parseFloat(maintCost) || 0,
      performedBy: maintOperator.trim(),
      date: maintDate,
      nextServiceDate: nextService ? nextService : undefined,
      status: maintStatus,
      workOrderNumber: maintWorkOrder.trim() || undefined
    };

    // Update state & automatically toggle tool status if critical / completed
    let finalStatus = tool.status;
    if (maintStatus === 'in_progress') {
      finalStatus = 'under_maintenance';
    } else if (maintStatus === 'completed' && tool.status === 'under_maintenance') {
      finalStatus = 'available';
    }

    const updatedTool: Tool = {
      ...tool,
      status: finalStatus,
      lastInspectedDate: maintStatus === 'completed' ? maintDate : tool.lastInspectedDate,
      maintenanceHistory: [newRecord, ...tool.maintenanceHistory]
    };

    onUpdateTool(updatedTool);

    // Reset fields
    setShowMaintForm(false);
    setMaintDesc('');
    setMaintCost('0');
    setMaintOperator('');
    setMaintStatus('completed');
    setMaintWorkOrder('');
    setSelectedMaintType('routine_inspection');
  };

  const downloadMaintenanceCSV = () => {
    if (!tool || tool.maintenanceHistory.length === 0) return;

    const csvHeaders = [
      'Work Order Number',
      'Service Event Type',
      'Technician / Performed By',
      'Service Date',
      'Next Service Target',
      'Cost Incurred (Php)',
      'Status',
      'Diagnostics / Description'
    ];

    const cellFormatter = (val: any) => {
      if (val === undefined || val === null) return '';
      const strVal = String(val).trim();
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n') || strVal.includes('\r')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    };

    const csvRows = tool.maintenanceHistory.map(m => [
      m.workOrderNumber || 'N/A',
      m.type.replace('_', ' ').toUpperCase(),
      m.performedBy,
      m.date,
      m.nextServiceDate || 'N/A',
      m.cost.toFixed(2),
      m.status.toUpperCase(),
      m.description
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cellFormatter).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const blobURL = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    const sanitizedFilename = tool.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    anchor.setAttribute('href', blobURL);
    anchor.setAttribute('download', `MAINTENANCE_HISTORY_${sanitizedFilename}.csv`);
    anchor.style.visibility = 'hidden';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const setSelectedMaintType = (type: string) => {
    setMaintType(type as MaintenanceType);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md flex flex-col h-full">
      {/* Detail header */}
      <div className="p-6 border-b border-zinc-800 bg-zinc-900/95">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              {tool.tagNumber && (
                <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-550/20 rounded font-mono text-[9px] font-bold tracking-widest uppercase shrink-0">
                  {tool.tagNumber}
                </span>
              )}
              <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">
                {tool.category}
              </span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${currentStatusMeta.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentStatusMeta.dot} mr-1`} />
                {currentStatusMeta.text}
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-100 leading-tight">
              {tool.name}
            </h2>
            <div className="flex items-center space-x-3 text-xs text-zinc-400 font-mono mt-1">
              <span>Model: <strong className="text-zinc-300 font-medium">{tool.model}</strong></span>
              <span>•</span>
              <span>Serial: <strong className="text-zinc-300 font-medium">{tool.serialNumber}</strong></span>
            </div>
          </div>

          {/* Action Quick Controls */}
          <div className="flex items-center space-x-2.5 shrink-0 self-start">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-zinc-400">Status Update:</label>
              <select
                id="detail-status-editor"
                className="text-xs bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 font-bold text-zinc-200 shadow-sm focus:border-amber-500 focus:outline-hidden"
                value={tool.status}
                onChange={(e) => handleStatusChange(e.target.value as ToolStatus)}
              >
                <option value="available" className="bg-zinc-900">Available / Ready</option>
                <option value="in_use" className="bg-zinc-900">In Active Use</option>
                <option value="under_maintenance" className="bg-zinc-900">Under Maintenance</option>
                <option value="service_required" className="bg-zinc-900">Requires Service</option>
                <option value="decommissioned" className="bg-zinc-900">Decommissioned</option>
              </select>
            </div>

            <button
              id="detail-delete-tool-btn"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete Equipment"
              className="p-1.5 text-rose-500 hover:text-white bg-rose-550/10 hover:bg-rose-600 border border-rose-550/25 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Menu navigation */}
      <div className="border-b border-zinc-850 px-6 flex space-x-4 bg-zinc-900">
        <button
          id="tab-btn-details"
          onClick={() => setActiveTab('details')}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-all ${
            activeTab === 'details'
              ? 'text-amber-500 border-amber-500'
              : 'text-zinc-500 border-transparent hover:text-zinc-250'
          }`}
        >
          Details & Locations
        </button>
        <button
          id="tab-btn-maintenance"
          onClick={() => setActiveTab('maint_logs')}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center space-x-1.5 ${
            activeTab === 'maint_logs'
              ? 'text-amber-500 border-amber-500'
              : 'text-zinc-500 border-transparent hover:text-zinc-250'
          }`}
        >
          <span>Maintenance & Repair History</span>
          {pendingMaintCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold">
              {pendingMaintCount}
            </span>
          )}
        </button>
        <button
          id="tab-btn-loc-history"
          onClick={() => setActiveTab('loc_history')}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-all ${
            activeTab === 'loc_history'
              ? 'text-amber-500 border-amber-500'
              : 'text-zinc-500 border-transparent hover:text-zinc-250'
          }`}
        >
          Location Log
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">        {activeTab === 'details' && (
          <div className="space-y-6">
            
            {/* Details Editing Action Bar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/40 p-3.5 border border-zinc-800 rounded-xl">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>{isEditingDetails ? 'Editing Details & Locations' : 'Equipment Specifications'}</span>
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium">
                  {isEditingDetails 
                    ? 'Modify the equipment properties below. Click Save Changes to apply.' 
                    : 'Manage organization, accountability, tags and parameters.'
                  }
                </p>
              </div>
              
              {!isEditingDetails ? (
                <button
                  id="tab-edit-details-btn"
                  type="button"
                  onClick={() => {
                    setDraftName(tool.name || '');
                    setDraftModel(tool.model || '');
                    setDraftSerialNumber(tool.serialNumber || '');
                    setDraftTagNumber(tool.tagNumber || '');
                    setDraftPurchaseDate(tool.purchaseDate || '');
                    setDraftAcquisitionCost(tool.acquisitionCost !== undefined ? String(tool.acquisitionCost) : '');
                    setDraftLastInspectedDate(tool.lastInspectedDate || '');
                    setDraftAssignedTo(tool.assignedTo || '');
                    setDraftCustodian(tool.custodian || 'RTO');
                    setDraftRtoProject(tool.rtoProject || '');
                    setIsEditingDetails(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 rounded-xl cursor-pointer transition shadow-xs"
                >
                  <Wrench className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                  <span>Edit Details</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                  <button
                    id="tab-cancel-edit-btn"
                    type="button"
                    onClick={() => {
                      setIsEditingDetails(false);
                      setDetailsError('');
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white border border-zinc-800 rounded-xl transition hover:bg-zinc-900"
                  >
                    Cancel
                  </button>
                  <button
                    id="tab-save-details-btn"
                    type="button"
                    onClick={handleSaveDetails}
                    className="inline-flex items-center space-x-1 px-4 py-1.5 text-xs font-bold text-black bg-emerald-500 hover:bg-emerald-400 rounded-xl cursor-pointer transition shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                    <span>Save Changes</span>
                  </button>
                </div>
              )}
            </div>

            {/* General Inline Error if validation fails */}
            {detailsError && (
              <div className="p-3.5 bg-rose-500/[0.04] border border-rose-500/20 text-rose-455 text-xs rounded-xl font-medium flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{detailsError}</span>
              </div>
            )}            {/* Visual Location Tracker Section (Hides when editing specs to avoid context switching) */}
            {!isEditingDetails && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Custody Locations tracker</h3>
                  </div>
                  {!showTransferForm && (
                     <button
                       id="trigger-transfer-form-btn"
                       onClick={() => setShowTransferForm(true)}
                       className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold text-black bg-amber-500 hover:bg-amber-400 transition-colors rounded-lg cursor-pointer"
                     >
                       <ArrowRightLeft className="w-3 h-3 text-black" />
                       <span>Transfer Location</span>
                     </button>
                  )}
                </div>

                {/* Dynamic location visualization flow */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                  {/* Previous Location item */}
                  <div className="p-3 bg-zinc-900 border border-zinc-800/60 rounded-lg flex items-start space-x-3 shadow-sm">
                    <div className="p-2 bg-zinc-950 text-zinc-500 rounded-lg self-center border border-zinc-850">
                      <History className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="text-[9px] uppercase font-bold text-zinc-550 block">Previous Custody Location</span>
                      <p className="text-xs font-bold text-zinc-400 block truncate">
                        {tool.previousLocation || 'None logged yet (Initial registration)'}
                      </p>
                    </div>
                  </div>

                  {/* Current Location item */}
                  <div className="p-3 bg-amber-500/[0.03] border border-amber-500/20 rounded-lg flex items-start space-x-3 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-8 h-8 pointer-events-none text-amber-500/10 flex items-center justify-center translate-x-1 -translate-y-1">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div className="p-2 bg-amber-500/10 text-amber-455 rounded-lg self-center border border-amber-500/20 z-10">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1 z-10">
                      <span className="text-[9px] uppercase font-bold text-amber-4block">Current Custody Location</span>
                      <p className="text-xs font-bold text-zinc-200 block truncate">
                        {tool.currentLocation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location Transfer Form */}
                {showTransferForm && (
                  <form onSubmit={handleLocationTransfer} className="mt-4 p-4 border border-zinc-800 bg-zinc-900 rounded-lg space-y-3 relative">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Enter Location Transfer Details</h4>
                    
                    {transferError && <p className="text-xs text-red-400 font-medium">{transferError}</p>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Location Choice selector */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[9px] font-bold text-zinc-500 uppercase">New Location Destination</label>
                          <button
                            id="toggle-transfer-location-btn"
                            type="button"
                            onClick={() => setUseCustomLoc(!useCustomLoc)}
                            className="text-[9px] text-amber-500 hover:text-amber-400 font-bold underline"
                          >
                            {useCustomLoc ? 'Pick standard' : 'Type custom'}
                          </button>
                        </div>

                        {useCustomLoc ? (
                          <input
                            id="input-transfer-custom"
                            type="text"
                            className="w-full text-xs px-2.5 py-1.5 border border-zinc-800 bg-zinc-900 text-zinc-200 rounded-lg focus:outline-hidden focus:border-amber-500"
                            placeholder="e.g. Jobsite Gamma - Sector 4"
                            value={customLoc}
                            onChange={(e) => setCustomLoc(e.target.value)}
                          />
                        ) : (
                          <select
                            id="select-transfer-standard"
                            className="w-full text-xs px-2.5 py-1.5 border border-zinc-800 bg-zinc-900 rounded-lg font-semibold text-zinc-200"
                            value={newLocation}
                            onChange={(e) => setNewLocation(e.target.value)}
                          >
                            {AVAILABLE_LOCATIONS.map(loc => (
                              <option key={loc} value={loc} className="bg-zinc-900 text-zinc-250">{loc}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Operator in charge */}
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Move Authorized By (Staff Name)</label>
                        <input
                          id="input-transfer-operator"
                          type="text"
                          className="w-full text-xs px-2.5 py-1.5 border border-zinc-800 bg-zinc-900 text-zinc-200 rounded-lg focus:outline-hidden focus:border-amber-500"
                          placeholder="e.g. John Doe"
                          value={transferOperator}
                          onChange={(e) => setTransferOperator(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Actions buttons */}
                    <div className="flex items-center justify-end space-x-2 pt-1 border-t border-zinc-850">
                      <button
                        id="cancel-location-transfer-btn"
                        type="button"
                        onClick={() => {
                          setShowTransferForm(false);
                          setTransferError('');
                        }}
                        className="px-2.5 py-1.2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg hover:bg-zinc-900"
                      >
                        Cancel
                      </button>
                      <button
                        id="submit-location-transfer-btn"
                        type="submit"
                        className="px-3.5 py-1.2 text-xs font-semibold text-black bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm flex items-center space-x-1"
                      >
                        <Send className="w-3 h-3 text-black" />
                        <span>Execute Transfer</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Editable or Static Specifications Grid */}
            {isEditingDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Panel 1: Equipment Name, Model, Serial Number */}
                <div className="p-4 border border-zinc-800 bg-zinc-900/95 rounded-xl space-y-3 shadow-md">
                  <div className="flex items-center space-x-1.5 text-zinc-400">
                    <Wrench className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Equipment Identity</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Equipment Name *</label>
                      <input
                        type="text"
                        className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-amber-500"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        placeholder="e.g. Electric Jackhammer"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Model Name</label>
                        <input
                          type="text"
                          className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-zinc-805 rounded-xl text-zinc-100 placeholder-zinc-655 focus:outline-hidden focus:border-amber-500"
                          value={draftModel}
                          onChange={(e) => setDraftModel(e.target.value)}
                          placeholder="e.g. Makita HM1307C"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Serial Number (S/N)</label>
                        <input
                          type="text"
                          className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-zinc-805 rounded-xl text-zinc-100 placeholder-zinc-655 focus:outline-hidden focus:border-amber-500 font-mono"
                          value={draftSerialNumber}
                          onChange={(e) => setDraftSerialNumber(e.target.value)}
                          placeholder="e.g. SN-893821"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Personnel Custody */}
                <div className="p-4 border border-zinc-800 bg-zinc-900/95 rounded-xl space-y-3 shadow-md">
                  <div className="flex items-center space-x-1.5 text-zinc-400">
                    <User className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Personnel Custody & Operator</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Staff / Operator in custody</label>
                      <input
                        type="text"
                        className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-hidden focus:border-amber-500 font-medium"
                        placeholder="Leave empty if Unassigned (Stored)"
                        value={draftAssignedTo}
                        onChange={(e) => setDraftAssignedTo(e.target.value)}
                      />
                    </div>
                    {draftAssignedTo && (
                      <button
                        type="button"
                        onClick={() => setDraftAssignedTo('')}
                        className="text-[10px] text-rose-450 hover:text-rose-400 font-bold block underline"
                      >
                        Release Custody (Reset to Unassigned)
                      </button>
                    )}
                  </div>
                </div>

                {/* Panel 3: Tool Custodian Accountability */}
                <div className="p-4 border border-zinc-800 bg-zinc-900/95 rounded-xl space-y-3 shadow-md">
                  <div className="flex items-center space-x-1.5 text-zinc-400">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Tool Custodian Accountability</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Primary Custodian</label>
                      <select
                        id="edit-detail-custodian-select"
                        className="w-full text-xs px-2.5 py-1.5 border border-zinc-800 bg-zinc-900 rounded-xl font-bold text-zinc-200 focus:outline-hidden focus:border-amber-500 cursor-pointer"
                        value={draftCustodian || 'RTO'}
                        onChange={(e) => {
                          const val = e.target.value as 'RTO' | 'ED' | 'PROJECT OWNED';
                          setDraftCustodian(val);
                          if (val === 'RTO' && !draftRtoProject) {
                            setDraftRtoProject(rtoProjects[0] || 'Project Alpha');
                          }
                        }}
                      >
                        <option value="RTO">RTO</option>
                        <option value="ED">ED</option>
                        <option value="PROJECT OWNED">PROJECT OWNED</option>
                      </select>
                    </div>

                    {draftCustodian === 'RTO' && (
                      <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                        <div className="flex items-center justify-between text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                          <span>RTO Project Assignment</span>
                          <button
                            type="button"
                            onClick={() => {
                              setUseCustomDetailRtoProject(!useCustomDetailRtoProject);
                            }}
                            className="text-amber-500 hover:text-amber-400 underline cursor-pointer"
                          >
                            {useCustomDetailRtoProject ? 'Select standard list' : 'Type new custom project'}
                          </button>
                        </div>

                        {useCustomDetailRtoProject ? (
                          <input
                            type="text"
                            placeholder="e.g. Project Gamma (Cagayan Expressway)"
                            value={customDetailRtoProject}
                            onChange={(e) => {
                              setCustomDetailRtoProject(e.target.value);
                              setDraftRtoProject(e.target.value);
                            }}
                            className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-hidden focus:border-amber-500"
                          />
                        ) : (
                          <select
                            className="w-full text-xs px-2 py-1.5 border border-zinc-800 bg-zinc-900 rounded-xl font-bold text-zinc-200 focus:outline-hidden focus:border-amber-500 cursor-pointer text-ellipsis overflow-hidden"
                            value={draftRtoProject || rtoProjects[0] || 'Project Alpha'}
                            onChange={(e) => setDraftRtoProject(e.target.value)}
                          >
                            {rtoProjects.map(proj => (
                              <option key={proj} value={proj}>{proj}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel 4: Spec details & costs */}
                <div className="p-4 border border-zinc-800 bg-zinc-900/95 rounded-xl space-y-3 shadow-md">
                  <div className="flex items-center space-x-1.5 text-zinc-400">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Ownership & Cost Details</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Tag Number</label>
                      <input
                        type="text"
                        className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-550 font-mono font-bold focus:outline-hidden focus:border-amber-500"
                        value={draftTagNumber}
                        onChange={(e) => setDraftTagNumber(e.target.value)}
                        placeholder="e.g. PT-101"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Acquisition Cost (Php)</label>
                      <input
                        type="number"
                        className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 font-mono focus:outline-hidden focus:border-amber-500"
                        value={draftAcquisitionCost}
                        onChange={(e) => setDraftAcquisitionCost(e.target.value)}
                        placeholder="Cost in Php"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Purchase Date</label>
                      <input
                        type="date"
                        className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-hidden focus:border-amber-500"
                        value={draftPurchaseDate}
                        onChange={(e) => setDraftPurchaseDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-zinc-550 uppercase mb-1">Last Safe Check Date</label>
                      <input
                        type="date"
                        className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-hidden focus:border-amber-500"
                        value={draftLastInspectedDate}
                        onChange={(e) => setDraftLastInspectedDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Custody Assignment */}
                <div className="p-4 border border-zinc-800 bg-zinc-900/80 rounded-xl space-y-2 pb-5">
                  <div className="flex items-center space-x-1.5 text-zinc-550">
                    <User className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Personnel Custody</span>
                  </div>
                  <div>
                    {tool.assignedTo ? (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-zinc-300">{tool.assignedTo}</p>
                        <button
                          id="release-custody-btn"
                          onClick={() => handleCustodyChange('')}
                          className="text-[10px] text-rose-450 hover:text-rose-350 font-bold block underline"
                        >
                          Release Custody
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-zinc-500 italic">Unassigned (Stored)</p>
                        <input
                          id="input-assign-custody"
                          type="text"
                          className="w-full text-xs px-2 py-1 bg-zinc-900 border border-zinc-805 rounded-lg text-zinc-200 focus:outline-hidden focus:border-amber-500"
                          placeholder="Assign operator..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCustodyChange((e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <span className="text-[9px] text-zinc-550 block leading-tight">Press Enter to assign</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tool Custodian */}
                <div className="p-4 border border-zinc-855 bg-zinc-900/80 rounded-xl space-y-3 pb-5">
                  <div className="flex items-center space-x-1.5 text-zinc-550">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-550">Tool Custodian</span>
                  </div>
                  <div className="space-y-2">
                    <select
                      id="detail-custodian-select"
                      className="w-full text-xs px-2.5 py-1.5 border border-zinc-800 bg-zinc-900 rounded-lg font-bold text-zinc-250 focus:outline-hidden focus:border-amber-500 cursor-pointer"
                      value={tool.custodian || 'RTO'}
                      onChange={(e) => {
                        const updatedCustodian = e.target.value as 'RTO' | 'ED' | 'PROJECT OWNED';
                        onUpdateTool({
                          ...tool,
                          custodian: updatedCustodian,
                          rtoProject: updatedCustodian === 'RTO' ? (tool.rtoProject || rtoProjects[0] || 'Project Alpha') : undefined
                        });
                      }}
                    >
                      <option value="RTO">RTO</option>
                      <option value="ED">ED</option>
                      <option value="PROJECT OWNED">PROJECT OWNED</option>
                    </select>
                    <p className="text-[9px] text-zinc-500 leading-tight">
                      Primary organizational accountability category
                    </p>
                  </div>

                  {/* Customized Projects under RTO Selection */}
                  {tool.custodian === 'RTO' && (
                    <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                        <span>RTO Project Target</span>
                        <button
                          id="toggle-detail-project-btn"
                          type="button"
                          onClick={() => {
                            setUseCustomDetailRtoProject(!useCustomDetailRtoProject);
                            setRtoDetailError('');
                          }}
                          className="text-amber-500 hover:text-amber-400 underline cursor-pointer"
                        >
                          {useCustomDetailRtoProject ? 'Select list' : 'Customize'}
                        </button>
                      </div>

                      {useCustomDetailRtoProject ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <input
                              id="input-detail-custom-project"
                              type="text"
                              placeholder="Type & hit Enter..."
                              value={customDetailRtoProject}
                              onChange={(e) => {
                                setCustomDetailRtoProject(e.target.value);
                                setRtoDetailError('');
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const trimmed = customDetailRtoProject.trim();
                                  if (!trimmed) {
                                    setRtoDetailError('Enter a project name');
                                    return;
                                  }
                                  onAddRtoProject(trimmed);
                                  onUpdateTool({
                                    ...tool,
                                    rtoProject: trimmed
                                  });
                                  setUseCustomDetailRtoProject(false);
                                  setCustomDetailRtoProject('');
                                }
                              }}
                              className="flex-1 text-xs px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-250 focus:outline-hidden focus:border-amber-500 font-medium"
                            />
                            <button
                              id="submit-detail-project-btn"
                              type="button"
                              onClick={() => {
                                const trimmed = customDetailRtoProject.trim();
                                if (!trimmed) {
                                  setRtoDetailError('Enter a project name');
                                  return;
                                }
                                onAddRtoProject(trimmed);
                                onUpdateTool({
                                  ...tool,
                                  rtoProject: trimmed
                                });
                                setUseCustomDetailRtoProject(false);
                                setCustomDetailRtoProject('');
                              }}
                              className="px-2.5 py-1.5 text-[10px] font-bold text-black bg-amber-500 hover:bg-amber-400 rounded-lg transition"
                            >
                              Save
                            </button>
                          </div>
                          {rtoDetailError && (
                            <p className="text-[9px] text-rose-400 font-semibold">{rtoDetailError}</p>
                          )}
                        </div>
                      ) : (
                        <select
                          id="detail-project-select"
                          className="w-full text-xs px-2 py-1.5 border border-zinc-800 bg-zinc-900 rounded-lg font-bold text-zinc-300 focus:outline-hidden focus:border-amber-500 cursor-pointer text-ellipsis overflow-hidden"
                          value={tool.rtoProject || rtoProjects[0] || 'Project Alpha'}
                          onChange={(e) => {
                            onUpdateTool({
                              ...tool,
                              rtoProject: e.target.value
                            });
                          }}
                        >
                          {rtoProjects.map(proj => (
                            <option key={proj} value={proj}>{proj}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>

                {/* Purchase specs */}
                <div className="p-4 border border-zinc-800 bg-zinc-900/80 rounded-xl space-y-2 pb-5">
                  <div className="flex items-center space-x-1.5 text-zinc-500">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Registration Details</span>
                  </div>
                  <div className="text-xs space-y-1 text-zinc-350">
                    <p className="flex justify-between">
                      <span className="text-zinc-550">Tag Number:</span>
                      <span className="font-bold font-mono text-amber-500">{tool.tagNumber || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-550">Purchased:</span>
                      <span className="font-bold font-mono">{tool.purchaseDate}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-550">Acquisition Cost:</span>
                      <span className="font-bold font-mono text-amber-400">
                        {tool.acquisitionCost !== undefined ? `Php ${tool.acquisitionCost.toFixed(2)}` : 'N/A'}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-550">Last Check:</span>
                      <span className="font-bold font-mono">{tool.lastInspectedDate}</span>
                    </p>
                  </div>
                </div>

                {/* Maintenance summary */}
                <div className="p-4 border border-zinc-800 bg-zinc-900/80 rounded-xl space-y-2 pb-5">
                  <div className="flex items-center space-x-1.5 text-zinc-550">
                    <Wrench className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-sans">Maintenance Cost</span>
                  </div>
                  <div className="text-zinc-350">
                    <span className="text-xl font-bold font-mono text-amber-400">Php {totalMaintCost.toFixed(2)}</span>
                    <p className="text-[10px] text-zinc-500 pt-1">
                      Across <strong className="text-zinc-400 font-mono">{tool.maintenanceHistory.length}</strong> service logs
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* General Description Card */}
            <div className="p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/80 flex items-start space-x-2.5">
              <div className="p-2 bg-zinc-900 border border-zinc-800/60 rounded-lg text-amber-500 mt-0.5">
                <Shield className="w-4 h-4 text-amber-500" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-tight">Active Duty Compliance</h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                  This light tool must undergo safety inspection after each custody transfer. Discovered malfunctions require immediate flagging of <strong>Requires Service</strong> or <strong>In Maintenance</strong> status to safeguard personnel.
                </p>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-4 bg-rose-500/[0.03] rounded-xl border border-rose-550/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-2.5">
                <div className="p-2 bg-rose-950/20 border border-rose-900/30 rounded-lg text-rose-450 mt-0.5 sm:mt-0 shadow-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-tight">Danger Zone</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                    Once deleted, this light equipment record, history log, and maintenance record cannot be recovered.
                  </p>
                </div>
              </div>
              <button
                id="danger-zone-delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all duration-150 cursor-pointer shadow-xs self-stretch sm:self-auto text-center font-sans"
              >
                Delete Equipment
              </button>
            </div>
          </div>
        )}

        {/* Maintenance Log Tab */}
        {activeTab === 'maint_logs' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-zinc-550" />
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Maintenance & Service logs</h3>
              </div>
              
              <div className="flex items-center space-x-2 self-start sm:self-auto">
                {tool.maintenanceHistory.length > 0 && (
                  <button
                    id="export-maint-history-csv-btn"
                    type="button"
                    onClick={downloadMaintenanceCSV}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition cursor-pointer"
                    title="Export equipment's maintenance history to CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-500" />
                    <span>Export History (CSV)</span>
                  </button>
                )}

                {!showMaintForm && (
                  <button
                    id="trigger-maint-form-btn"
                    onClick={() => setShowMaintForm(true)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 transition-colors rounded-xl shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                    <span>Log Service Event</span>
                  </button>
                )}
              </div>
            </div>

            {/* Interactive service form */}
            {showMaintForm && (
              <form onSubmit={handleMaintSubmit} className="p-4 border border-zinc-800 bg-zinc-900/30 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-805 pb-2">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center">
                    <ListPlus className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
                    Record New Maintenance details
                  </h4>
                  <button
                    id="cancel-maint-form-btn"
                    type="button"
                    onClick={() => setShowMaintForm(false)}
                    className="text-xs text-zinc-500 hover:text-zinc-250 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {maintError && (
                  <p className="text-xs text-rose-450 font-semibold">{maintError}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Work Order #</label>
                    <input
                      id="input-maint-work-order"
                      type="text"
                      className="w-full text-xs border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 rounded-lg text-zinc-100 placeholder-zinc-650 focus:outline-hidden focus:border-amber-500 font-mono"
                      placeholder="e.g. WO-2026-0034"
                      value={maintWorkOrder}
                      onChange={(e) => setMaintWorkOrder(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Service category</label>
                    <select
                      id="maint-type-select"
                      className="w-full text-xs border border-zinc-800 bg-zinc-900 px-2 py-1.5 rounded-lg text-zinc-200 font-medium"
                      value={maintType}
                      onChange={(e) => setSelectedMaintType(e.target.value)}
                    >
                      <option value="routine_inspection" className="bg-zinc-900">Routine Inspection</option>
                      <option value="repair" className="bg-zinc-900">Mechanical Repair</option>
                      <option value="calibration" className="bg-zinc-900">Precision Calibration</option>
                      <option value="cleaning" className="bg-zinc-900">Thorough Cleaning</option>
                      <option value="safety_check" className="bg-zinc-900">Critical Safety Check</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Assigned Technician</label>
                    <input
                      id="input-maint-technician"
                      type="text"
                      className="w-full text-xs border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 rounded-lg text-zinc-100 placeholder-zinc-650 focus:outline-hidden focus:border-amber-500"
                      placeholder="e.g. Marcus Vance"
                      value={maintOperator}
                      onChange={(e) => setMaintOperator(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Cost Incurred (Php)</label>
                    <input
                      id="input-maint-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full text-xs border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 rounded-lg text-zinc-100 placeholder-zinc-650 focus:outline-hidden focus:border-amber-500"
                      placeholder="e.g. 45.00"
                      value={maintCost}
                      onChange={(e) => setMaintCost(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Action status</label>
                    <select
                      id="maint-status-select"
                      className="w-full text-xs border border-zinc-800 bg-zinc-900 px-2 py-1.5 rounded-lg text-zinc-200 font-medium"
                      value={maintStatus}
                      onChange={(e) => setMaintStatus(e.target.value as MaintenanceStatus)}
                    >
                      <option value="completed" className="bg-zinc-900">Completed / Signed Off</option>
                      <option value="in_progress" className="bg-zinc-900">Currently In Progress</option>
                      <option value="pending" className="bg-zinc-900">Pending Scheduler</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Service Date</label>
                    <input
                      id="input-maint-date"
                      type="date"
                      className="w-full text-xs border border-zinc-800 bg-zinc-900 px-2.5 py-1.2 rounded-lg text-zinc-200"
                      value={maintDate}
                      onChange={(e) => setMaintDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Next Service Target (Optional)</label>
                    <input
                      id="input-maint-next-service"
                      type="date"
                      className="w-full text-xs border border-zinc-800 bg-zinc-900 px-2.5 py-1.2 rounded-lg text-zinc-200"
                      value={nextService}
                      onChange={(e) => setNextService(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Diagnostics / Work Done Comments</label>
                  <textarea
                    id="input-maint-desc"
                    rows={2}
                    className="w-full text-xs border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 rounded-lg text-zinc-200 focus:outline-hidden focus:border-amber-500"
                    placeholder="Provide description of diagnostics, replaced parts, safety issues resolved..."
                    value={maintDesc}
                    onChange={(e) => setMaintDesc(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-1 border-t border-zinc-850">
                  <button
                    id="cancel-save-maint-btn"
                    type="button"
                    onClick={() => {
                      setShowMaintForm(false);
                      setMaintError('');
                      setMaintWorkOrder('');
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-zinc-400 hover:text-zinc-250 border border-zinc-800 rounded-lg hover:bg-zinc-900"
                  >
                    Discard draft
                  </button>
                  <button
                    id="submit-maint-btn"
                    type="submit"
                    className="px-3.5 py-1 text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 rounded-lg cursor-pointer"
                  >
                    Commit Record
                  </button>
                </div>
              </form>
            )}

            {/* List of maintenance logs */}
            {tool.maintenanceHistory.length === 0 ? (
              <div className="py-8 text-center text-zinc-550 bg-zinc-950/20 rounded-xl border border-zinc-800">
                <span className="text-xs">No logged service inspections or repairs for this tool yet.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {tool.maintenanceHistory.map((maint) => {
                  let statusBadge = 'bg-zinc-900 text-zinc-455';
                  if (maint.status === 'completed') statusBadge = 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50';
                  if (maint.status === 'in_progress') statusBadge = 'bg-blue-950/30 text-blue-405 border-blue-900/50';
                  if (maint.status === 'pending') statusBadge = 'bg-amber-950/30 text-amber-500 border-amber-900/50';                  return (
                    <div 
                      key={maint.id} 
                      className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2.5 transition-all hover:bg-zinc-905"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-amber-500 uppercase">
                              {maint.type.replace('_', ' ')}
                            </span>
                            {maint.workOrderNumber && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/15 font-bold font-mono text-[9px] tracking-wide">
                                {maint.workOrderNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-zinc-500 font-mono">
                            <span>Tech: <strong className="text-zinc-400">{maint.performedBy}</strong></span>
                            <span>•</span>
                            <span>Date: <strong>{maint.date}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-zinc-200 bg-zinc-955 border border-zinc-800 px-2 py-0.5 rounded">
                            Php {maint.cost.toFixed(2)}
                          </span>
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusBadge}`}>
                            {maint.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400 font-normal leading-relaxed">
                        {maint.description}
                      </p>

                      {maint.nextServiceDate && (
                        <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400 pt-1.5 border-t border-zinc-850">
                          <Clock className="w-3 h-3 text-emerald-500" />
                          <span>Scheduled Calibration / Re-check: <strong className="font-mono">{maint.nextServiceDate}</strong></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Location History Tab */}
        {activeTab === 'loc_history' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-1.5">
              <History className="w-4 h-4 text-zinc-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Custody Transfer Logs</h3>
            </div>

            {tool.locationHistory.length === 0 ? (
              <div className="py-8 text-center text-zinc-550 bg-zinc-950/20 rounded-xl border border-zinc-800">
                <span className="text-xs">Initial registration site, no location transfers performed.</span>
              </div>
            ) : (
              <div className="relative pl-4 border-l border-zinc-800 space-y-4 pt-1">
                {tool.locationHistory.map((log) => (
                  <div key={log.id} className="relative space-y-1">
                    {/* Circle marker on line */}
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-[#0c0c0e] ring-2 ring-amber-500/20 shrink-0" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs">
                      <span className="font-semibold text-zinc-300 flex items-center mb-1 sm:mb-0">
                        Moved layout location:
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(log.changedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 flex items-center justify-between">
                      <div className="flex items-center space-x-1 min-w-0 flex-1">
                        <span className="font-bold text-zinc-400 truncate">{log.fromLocation}</span>
                        <span className="text-zinc-650 flex-shrink-0">→</span>
                        <strong className="text-amber-400 truncate">{log.toLocation}</strong>
                      </div>
                      <span className="text-[10px] text-zinc-400 ml-2 whitespace-nowrap">
                        By: <strong className="text-zinc-300">{log.updatedBy}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-805 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Confirm Deletion</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold mt-0.5">Permanent Action</p>
                </div>
              </div>

              <div className="space-y-2.5 bg-zinc-900/40 p-4 rounded-xl border border-zinc-850">
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  Are you absolutely sure you want to delete this equipment? This will permanently delete the item, history logs, and maintenance logs.
                </p>
                <div className="border-t border-zinc-850 pt-2.5 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-550">Name:</span>
                    <span className="font-bold text-zinc-300 font-sans truncate max-w-[160px]">{tool.name}</span>
                  </div>
                  {tool.tagNumber && (
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Tag Number:</span>
                      <span className="font-bold text-amber-500 font-mono text-[11px]">{tool.tagNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-550">Serial Number:</span>
                    <span className="font-bold text-zinc-400 font-mono text-[11px]">{tool.serialNumber}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2.5 pt-1">
                <button
                  id="cancel-delete-modal-btn"
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-800 hover:border-zinc-750 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-modal-btn"
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDeleteTool(tool.id);
                  }}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm animate-pulse-once"
                >
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
