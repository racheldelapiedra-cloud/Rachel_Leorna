/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tool, ToolStatus } from '../types';
import { AVAILABLE_LOCATIONS } from '../initialData';
import { X, Hammer, ClipboardPaste, HelpCircle } from 'lucide-react';

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTool: (tool: Tool) => void;
  categories: string[];
  onAddCategory: (newCat: string) => boolean;
  rtoProjects: string[];
  onAddRtoProject: (newProj: string) => boolean;
}

export default function AddToolModal({ 
  isOpen, 
  onClose, 
  onAddTool, 
  categories, 
  onAddCategory,
  rtoProjects,
  onAddRtoProject
}: AddToolModalProps) {
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [tagNumber, setTagNumber] = useState('');
  const [category, setCategory] = useState(categories && categories.length > 0 ? categories[0] : 'Power Tools');
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [status, setStatus] = useState<ToolStatus>('available');
  const [initialLocation, setInitialLocation] = useState(AVAILABLE_LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState('');
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [custodian, setCustodian] = useState<'RTO' | 'ED' | 'PROJECT OWNED'>('RTO');
  
  // RTO specific customizable project variables
  const [selectedRtoProject, setSelectedRtoProject] = useState(rtoProjects && rtoProjects.length > 0 ? rtoProjects[0] : 'Project Alpha');
  const [customRtoProject, setCustomRtoProject] = useState('');
  const [useCustomRtoProject, setUseCustomRtoProject] = useState(false);

  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Tool name is required';
    if (!model.trim()) newErrors.model = 'Model number is required';
    if (!serialNumber.trim()) newErrors.serialNumber = 'Serial number is required';
    
    let finalCategory = category;
    if (useCustomCategory) {
      const trimmedCat = customCategory.trim();
      if (!trimmedCat) {
        newErrors.customCategory = 'Please provide a category name or select from list';
      } else {
        onAddCategory(trimmedCat);
        finalCategory = trimmedCat;
      }
    }

    const finalLocation = useCustomLocation ? customLocation.trim() : initialLocation;
    if (useCustomLocation && !customLocation.trim()) {
      newErrors.customLocation = 'Please designate a location or select from list';
    }

    let finalRtoProject: string | undefined = undefined;
    if (custodian === 'RTO') {
      if (useCustomRtoProject) {
        const trimmedProj = customRtoProject.trim();
        if (!trimmedProj) {
          newErrors.customRtoProject = 'Please enter a custom project name or select from list';
        } else {
          onAddRtoProject(trimmedProj);
          finalRtoProject = trimmedProj;
        }
      } else {
        finalRtoProject = selectedRtoProject;
      }
    }

    const parsedCost = acquisitionCost ? parseFloat(acquisitionCost) : undefined;
    if (acquisitionCost && (isNaN(parsedCost!) || parsedCost! < 0)) {
      newErrors.acquisitionCost = 'Enter a valid positive number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newTool: Tool = {
      id: `tool-${Date.now()}`,
      name: name.trim(),
      model: model.trim(),
      serialNumber: serialNumber.trim(),
      category: finalCategory,
      status,
      currentLocation: finalLocation,
      previousLocation: null,
      purchaseDate,
      acquisitionCost: parsedCost,
      tagNumber: tagNumber.trim() || undefined,
      lastInspectedDate: new Date().toISOString().split('T')[0],
      assignedTo: assignedTo.trim() || null,
      custodian,
      rtoProject: finalRtoProject,
      locationHistory: [],
      maintenanceHistory: []
    };

    onAddTool(newTool);
    onClose();
    
    // Reset form
    setName('');
    setModel('');
    setSerialNumber('');
    setTagNumber('');
    setCategory(categories[0] || 'Power Tools');
    setCustomCategory('');
    setUseCustomCategory(false);
    setStatus('available');
    setInitialLocation(AVAILABLE_LOCATIONS[0]);
    setCustomLocation('');
    setUseCustomLocation(false);
    setAssignedTo('');
    setCustodian('RTO');
    setSelectedRtoProject(rtoProjects[0] || 'Project Alpha');
    setCustomRtoProject('');
    setUseCustomRtoProject(false);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setAcquisitionCost('');
    setErrors({});
  };

  const formCategories = categories.filter(c => c !== 'All Categories');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        id="modal-backdrop"
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Container */}
      <div 
        id="modal-container"
        className="relative bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 max-w-lg w-full overflow-hidden transition-all transform flex flex-col z-10"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950/60 border-b border-zinc-850 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-zinc-900 border border-zinc-800 text-amber-550 rounded-lg">
              <Hammer className="w-4 h-4 text-amber-550" />
            </div>
            <h3 className="font-bold text-[13px] text-zinc-250 uppercase tracking-wider">Register Light Equipment</h3>
          </div>
          <button 
            id="close-modal-btn"
            onClick={onClose} 
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-905 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-4">
          {/* Grid fields */}
          <div>
            <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Equipment Name *
            </label>
            <input
              id="input-tool-name"
              type="text"
              className={`w-full text-xs px-3.5 py-2 bg-zinc-900 border rounded-xl text-zinc-100 placeholder-zinc-550 focus:outline-hidden focus:border-amber-500 transition-all ${
                errors.name ? 'border-rose-500 font-semibold' : 'border-zinc-805'
              }`}
              placeholder="e.g. Makita 18V LXT Cordless Impact Driver"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
            />
            {errors.name && <p className="text-rose-400 text-xs mt-1 font-semibold">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Equipment Tag Number
              </label>
              <input
                id="input-tool-tag"
                type="text"
                className="w-full text-xs px-3.5 py-2 bg-zinc-900 border border-zinc-808 rounded-xl text-zinc-100 placeholder-zinc-550 focus:outline-hidden focus:border-amber-500 transition-all font-mono uppercase font-semibold text-amber-400"
                placeholder="e.g. AC 01"
                value={tagNumber}
                onChange={(e) => setTagNumber(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Model Number *
              </label>
              <input
                id="input-tool-model"
                type="text"
                className={`w-full text-xs px-3.5 py-2 bg-zinc-900 border rounded-xl text-zinc-200 placeholder-zinc-550 focus:outline-hidden focus:border-amber-500 transition-all ${
                  errors.model ? 'border-rose-500 font-semibold' : 'border-zinc-805'
                }`}
                placeholder="e.g. XDT13Z"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  if (errors.model) setErrors(prev => ({ ...prev, model: '' }));
                }}
              />
              {errors.model && <p className="text-rose-400 text-xs mt-1 font-semibold">{errors.model}</p>}
            </div>

            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Serial Number *
              </label>
              <input
                id="input-tool-serial"
                type="text"
                className={`w-full text-xs px-3.5 py-2 bg-zinc-900 border rounded-xl text-zinc-200 placeholder-zinc-550 focus:outline-hidden focus:border-amber-500 transition-all ${
                  errors.serialNumber ? 'border-rose-500' : 'border-zinc-805'
                }`}
                placeholder="e.g. MK-ID-77291"
                value={serialNumber}
                onChange={(e) => {
                  setSerialNumber(e.target.value);
                  if (errors.serialNumber) setErrors(prev => ({ ...prev, serialNumber: '' }));
                }}
              />
              {errors.serialNumber && <p className="text-rose-400 text-xs mt-1 font-semibold">{errors.serialNumber}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomCategory(!useCustomCategory);
                    setErrors(prev => ({ ...prev, customCategory: '' }));
                  }}
                  className="text-[9px] text-amber-550 hover:text-amber-405 font-bold uppercase tracking-wider cursor-pointer"
                >
                  {useCustomCategory ? 'Select List' : '+ Add New'}
                </button>
              </div>

              {useCustomCategory ? (
                <div>
                  <input
                    id="input-custom-category"
                    type="text"
                    className={`w-full text-xs px-3.5 py-2 bg-zinc-900 border rounded-xl text-zinc-200 placeholder-zinc-550 focus:outline-hidden focus:border-amber-500 transition-all ${
                      errors.customCategory ? 'border-rose-500 font-semibold' : 'border-zinc-805'
                    }`}
                    placeholder="e.g. HILTI"
                    value={customCategory}
                    onChange={(e) => {
                      setCustomCategory(e.target.value);
                      if (errors.customCategory) setErrors(prev => ({ ...prev, customCategory: '' }));
                    }}
                  />
                  {errors.customCategory && <p className="text-rose-400 text-[10px] mt-1 font-semibold">{errors.customCategory}</p>}
                </div>
              ) : (
                <select
                  id="select-tool-category"
                  className="w-full text-xs px-3 py-2 border border-zinc-800 rounded-xl bg-zinc-900 text-zinc-200 focus:outline-hidden focus:border-amber-500 font-semibold"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {formCategories.map(cat => (
                    <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Initial Technical Status
              </label>
              <select
                id="select-tool-status"
                className="w-full text-xs px-3 py-2 border border-zinc-800 rounded-xl bg-zinc-900 text-zinc-200 focus:outline-hidden focus:border-amber-500 font-semibold"
                value={status}
                onChange={(e) => setStatus(e.target.value as ToolStatus)}
              >
                <option value="available" className="bg-zinc-900">Available / Clear</option>
                <option value="in_use" className="bg-zinc-900">In Active Use (On Site)</option>
                <option value="under_maintenance" className="bg-zinc-900">Under Maintenance</option>
                <option value="service_required" className="bg-zinc-900">Needs Inspection</option>
              </select>
            </div>
          </div>

          {/* Location setup */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] font-medium text-zinc-400 uppercase tracking-wider">
                Initial Custody Location *
              </label>
              <button
                id="toggle-location-type-btn"
                type="button"
                onClick={() => {
                  setUseCustomLocation(!useCustomLocation);
                  setErrors(prev => ({ ...prev, customLocation: '' }));
                }}
                className="text-[10px] text-amber-550 hover:text-amber-405 underline cursor-pointer font-medium"
              >
                {useCustomLocation ? 'Select from list' : 'Enter custom location'}
              </button>
            </div>

            {useCustomLocation ? (
              <input
                id="input-custom-location"
                type="text"
                className={`w-full text-xs px-3.5 py-2 bg-zinc-900 border rounded-xl text-zinc-200 placeholder-zinc-550 focus:outline-hidden focus:border-amber-500 transition-all ${
                  errors.customLocation ? 'border-rose-500 font-semibold' : 'border-zinc-805'
                }`}
                placeholder="e.g. Site E - Storage Locker 4"
                value={customLocation}
                onChange={(e) => {
                  setCustomLocation(e.target.value);
                  if (errors.customLocation) setErrors(prev => ({ ...prev, customLocation: '' }));
                }}
              />
            ) : (
              <select
                id="select-initial-location"
                className="w-full text-xs px-3 py-2 border border-zinc-800 rounded-xl bg-zinc-900 text-zinc-200 focus:outline-hidden focus:border-amber-500 font-semibold"
                value={initialLocation}
                onChange={(e) => setInitialLocation(e.target.value)}
              >
                {AVAILABLE_LOCATIONS.map(loc => (
                  <option key={loc} value={loc} className="bg-zinc-900">{loc}</option>
                ))}
              </select>
            )}
            {errors.customLocation && <p className="text-rose-400 text-xs mt-1 font-semibold">{errors.customLocation}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Personnel Custody (Optional)
              </label>
              <input
                id="input-assigned-custody"
                type="text"
                className="w-full text-xs px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-550 focus:outline-hidden focus:border-amber-500 transition-all font-medium"
                placeholder="e.g. Frank Cooper"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Tool Custodian <span className="text-amber-500">*</span>
              </label>
              <select
                id="select-custodian"
                className="w-full text-xs px-3 py-2 border border-zinc-800 rounded-xl bg-zinc-900 text-zinc-200 focus:outline-hidden focus:border-amber-500 font-semibold"
                value={custodian}
                onChange={(e) => setCustodian(e.target.value as 'RTO' | 'ED' | 'PROJECT OWNED')}
              >
                <option value="RTO">RTO</option>
                <option value="ED">ED</option>
                <option value="PROJECT OWNED">PROJECT OWNED</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Purchase Date
              </label>
              <input
                id="input-purchase-date"
                type="date"
                className="w-full text-xs px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-205 focus:outline-hidden focus:border-amber-500 transition-all"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Acquisition Cost (Php)
              </label>
              <input
                id="input-acquisition-cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 520.00"
                className={`w-full text-xs px-3.5 py-2 bg-zinc-900 border rounded-xl text-zinc-200 placeholder-zinc-550 focus:outline-hidden focus:border-amber-500 transition-all ${
                  errors.acquisitionCost ? 'border-rose-500 font-semibold' : 'border-zinc-808'
                }`}
                value={acquisitionCost}
                onChange={(e) => {
                  setAcquisitionCost(e.target.value);
                  if (errors.acquisitionCost) setErrors(prev => ({ ...prev, acquisitionCost: '' }));
                }}
              />
              {errors.acquisitionCost && <p className="text-rose-400 text-[10px] mt-1 font-semibold">{errors.acquisitionCost}</p>}
            </div>
          </div>

          {/* RTO Project selector (Only shown if Custodian is RTO) */}
          {custodian === 'RTO' && (
            <div className="p-4 border border-zinc-805 bg-zinc-950 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">
                  Assign RTO Project <span className="text-zinc-500">(Required for RTO Custody)</span>
                </label>
                <button
                  id="toggle-rto-project-type-btn"
                  type="button"
                  onClick={() => {
                    setUseCustomRtoProject(!useCustomRtoProject);
                    setErrors(prev => ({ ...prev, customRtoProject: '' }));
                  }}
                  className="text-[10px] text-amber-500 hover:text-amber-400 underline cursor-pointer font-semibold"
                >
                  {useCustomRtoProject ? 'Select Project from list' : '+ Customize / Enter New Project'}
                </button>
              </div>

              {useCustomRtoProject ? (
                <div>
                  <input
                    id="input-custom-rto-project"
                    type="text"
                    className={`w-full text-xs px-3.5 py-2 bg-zinc-900 border rounded-xl text-zinc-100 placeholder-zinc-550 focus:outline-hidden focus:border-amber-500 transition-all ${
                      errors.customRtoProject ? 'border-rose-500 font-semibold' : 'border-zinc-805'
                    }`}
                    placeholder="e.g. Project Charlie (Cagayan Expressway)"
                    value={customRtoProject}
                    onChange={(e) => {
                      setCustomRtoProject(e.target.value);
                      if (errors.customRtoProject) setErrors(prev => ({ ...prev, customRtoProject: '' }));
                    }}
                  />
                  {errors.customRtoProject && <p className="text-rose-400 text-xs mt-1 font-semibold">{errors.customRtoProject}</p>}
                </div>
              ) : (
                <select
                  id="select-rto-project"
                  className="w-full text-xs px-3 py-2 border border-zinc-800 rounded-xl bg-zinc-900 text-zinc-200 focus:outline-hidden focus:border-amber-500 font-semibold"
                  value={selectedRtoProject}
                  onChange={(e) => setSelectedRtoProject(e.target.value)}
                >
                  {rtoProjects.map(proj => (
                    <option key={proj} value={proj} className="bg-zinc-900">{proj}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-4 border-t border-zinc-850 flex items-center justify-end space-x-3">
            <button
              id="cancel-modal-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-register-tool-btn"
              type="submit"
              className="px-5 py-2 text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center space-x-2 cursor-pointer"
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>Register Equipment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
