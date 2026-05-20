/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Tool, ToolStatus } from '../types';
import { Search, MapPin, SlidersHorizontal, ArrowUpDown, ChevronRight, User, Trash2, FolderPlus, Upload, Download } from 'lucide-react';
import ImportCategoryModal from './ImportCategoryModal';

interface ToolCardListProps {
  tools: Tool[];
  categories: string[];
  onAddCategory: (newCat: string) => boolean;
  onRemoveCategory: (cat: string) => void;
  selectedToolId: string | null;
  onSelectTool: (id: string) => void;
  onImportTools: (importedTools: Tool[]) => void;
}

export default function ToolCardList({ tools, categories, onAddCategory, onRemoveCategory, selectedToolId, onSelectTool, onImportTools }: ToolCardListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'newest' | 'last_inspected' | 'highest_cost' | 'lowest_cost'>('name');

  // Inline Category Manager states
  const [showAddCategoryInline, setShowAddCategoryInline] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [catError, setCatError] = useState('');

  // Category File Import modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeImportCategory, setActiveImportCategory] = useState('');

  const handleCreateCategoryInline = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) {
      setCatError('Category name is required.');
      return;
    }
    const success = onAddCategory(trimmed);
    if (success) {
      setNewCatInput('');
      setCatError('');
      setSelectedCategory(trimmed);
    } else {
      setCatError('Already exists.');
    }
  };

  const handleExportCategoryTools = (cat: string) => {
    const categoryTools = tools.filter(t => t.category === cat);
    if (categoryTools.length === 0) {
      alert(`No equipment registered under category "${cat}" to export.`);
      return;
    }

    // Generate CSV
    const headers = [
      'ID', 'Name', 'Model', 'Serial Number', 'Tag Number', 'Category', 
      'Current Location', 'Previous Location', 'Status', 'Assigned To', 
      'Custodian', 'RTO Project', 'Purchase Date', 'Acquisition Cost (Php)', 'Last Inspected Date'
    ];

    const csvRows = [
      headers.join(','), // Header row
      ...categoryTools.map(t => {
        const values = [
          t.id,
          t.name,
          t.model,
          t.serialNumber,
          t.tagNumber || '',
          t.category,
          t.currentLocation,
          t.previousLocation || '',
          t.status,
          t.assignedTo || '',
          t.custodian || '',
          t.rtoProject || '',
          t.purchaseDate,
          t.acquisitionCost !== undefined ? t.acquisitionCost.toString() : '',
          t.lastInspectedDate
        ];
        return values.map(v => {
          const escaped = String(v).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',');
      })
    ].join('\n');

    // Trigger download
    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeCatName = cat.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `inventory_category_${safeCatName}_export.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Search Logic
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchSearch = 
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tool.tagNumber && tool.tagNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tool.assignedTo && tool.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = selectedCategory === 'All Categories' || tool.category === selectedCategory;
      const matchStatus = selectedStatus === 'all' || tool.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'newest') {
        return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
      } else if (sortBy === 'last_inspected') {
        return new Date(b.lastInspectedDate).getTime() - new Date(a.lastInspectedDate).getTime();
      } else if (sortBy === 'highest_cost') {
        const costA = a.acquisitionCost ?? 0;
        const costB = b.acquisitionCost ?? 0;
        return costB - costA;
      } else if (sortBy === 'lowest_cost') {
        const costA = a.acquisitionCost ?? 0;
        const costB = b.acquisitionCost ?? 0;
        return costA - costB;
      }
      return 0;
    });
  }, [tools, searchTerm, selectedCategory, selectedStatus, sortBy]);

  // Status Badge Colors helper
  const getStatusMeta = (status: ToolStatus) => {
    switch (status) {
      case 'available':
        return { text: 'Available', bg: 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50', dot: 'bg-emerald-450' };
      case 'in_use':
        return { text: 'In Use', bg: 'bg-blue-950/30 text-blue-400 border-blue-900/50', dot: 'bg-blue-450' };
      case 'under_maintenance':
        return { text: 'In Repair', bg: 'bg-amber-950/30 text-amber-400 border-amber-900/50', dot: 'bg-amber-450' };
      case 'service_required':
        return { text: 'Needs Service', bg: 'bg-rose-950/30 text-rose-450 border-rose-900/50', dot: 'bg-rose-450' };
      case 'decommissioned':
        return { text: 'Decommissioned', bg: 'bg-zinc-900/60 text-zinc-500 border-zinc-800/80', dot: 'bg-zinc-600' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/90 space-y-3">
        {/* Search Input bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            id="tool-search-input"
            type="text"
            className="w-full text-sm pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans placeholder-zinc-550 text-zinc-100"
            placeholder="Search name, serial, model, or operator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Sub-filtering controls */}
        <div className="grid grid-cols-2 gap-2">
          {/* Category Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1.5 min-w-0">
                <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider shrink-0">Category</label>
                {selectedCategory !== 'All Categories' && (
                  <button
                    type="button"
                    onClick={() => handleExportCategoryTools(selectedCategory)}
                    className="inline-flex items-center space-x-1 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-505 hover:bg-emerald-500 hover:text-black border border-emerald-500/20 px-1.5 py-0.5 rounded transition duration-150 cursor-pointer shrink-0"
                    title={`Export all registered equipment units under ${selectedCategory} to CSV`}
                  >
                    <Download className="w-2.5 h-2.5" />
                    <span className="text-[8.5px]">Export CSV</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategoryInline(!showAddCategoryInline)}
                className="text-[9px] text-amber-500 hover:text-amber-405 font-bold uppercase tracking-wider cursor-pointer transition-colors"
                title="Manage custom categories"
              >
                {showAddCategoryInline ? 'Hide' : '+ Manage'}
              </button>
            </div>
            <select
              id="category-filter-select"
              className="w-full text-xs px-2.5 py-1.5 border border-zinc-800 bg-zinc-900 rounded-lg focus:outline-hidden focus:border-amber-500 text-zinc-350 font-medium"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All Categories" className="bg-zinc-900 text-zinc-250">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat} className="bg-zinc-900 text-zinc-250">{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-1">Status</label>
            <select
              id="status-filter-select"
              className="w-full text-xs px-2.5 py-1.5 border border-zinc-800 bg-zinc-900 rounded-lg focus:outline-hidden focus:border-amber-500 text-zinc-350 font-medium"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all" className="bg-zinc-900 text-zinc-250">All Statuses</option>
              <option value="available" className="bg-zinc-900 text-zinc-250">Available / Clear</option>
              <option value="in_use" className="bg-zinc-900 text-zinc-250">In Active Use</option>
              <option value="under_maintenance" className="bg-zinc-900 text-zinc-250">Under Maintenance</option>
              <option value="service_required" className="bg-zinc-900 text-zinc-250">Service Required</option>
              <option value="decommissioned" className="bg-zinc-900 text-zinc-250">Decommissioned</option>
            </select>
          </div>
        </div>

        {/* Dynamic Category Manager drawer/container */}
        {showAddCategoryInline && (
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2.5 mt-2 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 flex items-center space-x-1">
                <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                <span>Custom Category Desk</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowAddCategoryInline(false);
                  setNewCatInput('');
                  setCatError('');
                }}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                Done
              </button>
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Category name (e.g. HILTI)"
                value={newCatInput}
                onChange={(e) => {
                  setNewCatInput(e.target.value);
                  setCatError('');
                }}
                className="flex-1 text-xs px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-hidden focus:border-amber-500 placeholder-zinc-650"
              />
              <button
                type="button"
                onClick={handleCreateCategoryInline}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Add
              </button>
            </div>
            {catError && <p className="text-[10px] text-rose-400 font-semibold">{catError}</p>}

            <div className="pt-2 border-t border-zinc-850">
              <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Registered Categories</span>
              <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                {categories.map(cat => {
                  const isCore = ['Power Tools'].includes(cat);
                  const isUsed = tools.some(t => t.category === cat);
                  return (
                    <div key={cat} className="flex items-center justify-between text-[11px] py-1.5 px-2.5 bg-zinc-900/40 rounded-lg border border-zinc-805 hover:border-zinc-755 transition">
                      <span className="text-zinc-405 font-medium truncate pr-2">{cat}</span>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {/* Import button under category */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveImportCategory(cat);
                            setIsImportModalOpen(true);
                          }}
                          className="p-1 rounded bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-500 cursor-pointer transition-all"
                          title={`Import equipment units under category ${cat}`}
                        >
                          <Upload className="w-3 h-3" />
                        </button>

                        {/* Export button under category */}
                        <button
                          type="button"
                          onClick={() => handleExportCategoryTools(cat)}
                          className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500 hover:text-black text-emerald-555 cursor-pointer transition-all text-emerald-450"
                          title={`Export all equipment under category ${cat} to CSV`}
                        >
                          <Download className="w-3 h-3" />
                        </button>

                        {!isCore ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (isUsed) {
                                alert(`Cannot delete category "${cat}" because there are tools currently registered under it. Please re-assign those tools first.`);
                              } else if (window.confirm(`Are you sure you want to delete category "${cat}"?`)) {
                                onRemoveCategory(cat);
                              }
                            }}
                            className={`p-1 rounded transition bg-rose-950/20 text-rose-405 hover:bg-rose-950/40 cursor-pointer ${isUsed ? 'opacity-40 cursor-not-allowed' : ''}`}
                            title={isUsed ? "Category in use by equipment" : "Delete category"}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[8.5px] font-mono tracking-wider font-bold text-zinc-600 uppercase select-none px-1">Core</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Sorting option */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-850">
          <span className="text-xs font-medium text-zinc-550">
            Showing <strong className="text-zinc-350">{filteredTools.length}</strong> items
          </span>
          <div className="flex items-center space-x-1.5 text-zinc-350">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <select
              id="sort-select"
              className="text-xs border-0 bg-transparent text-zinc-350 focus:ring-0 cursor-pointer font-bold py-0 pl-1 pr-6"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="name" className="bg-zinc-900">Sort by Name</option>
              {`newest` === 'newest' && <option value="newest" className="bg-zinc-900">Sort by Age</option>}
              <option value="last_inspected" className="bg-zinc-900">Sort by Last Inspected</option>
              <option value="highest_cost" className="bg-zinc-900">Sort by Highest Cost</option>
              <option value="lowest_cost" className="bg-zinc-900">Sort by Lowest Cost</option>
            </select>
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 max-h-[600px] md:max-h-[700px]">
        {filteredTools.length === 0 ? (
          <div className="p-8 text-center text-zinc-550 flex flex-col items-center justify-center space-y-2">
            <span className="text-sm font-medium">No matching equipment found</span>
            <span className="text-xs opacity-75">Try adjusting your keywords or quick filters</span>
          </div>
        ) : (
          filteredTools.map((tool) => {
            const isSelected = tool.id === selectedToolId;
            const statusMeta = getStatusMeta(tool.status);

            return (
              <div
                key={tool.id}
                id={`tool-item-${tool.id}`}
                onClick={() => onSelectTool(tool.id)}
                className={`p-4 text-left transition-all cursor-pointer flex items-start justify-between group relative border-l-[3px] ${
                  isSelected 
                    ? 'bg-amber-500/5 border-l-amber-500' 
                    : 'border-l-transparent hover:bg-zinc-900/30'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                  {/* Category & Status & Tag */}
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    {tool.tagNumber && (
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-[9.5px] font-bold font-mono tracking-wider uppercase shrink-0">
                        {tool.tagNumber}
                      </span>
                    )}
                    <span className="text-[9px] font-bold text-zinc-550 tracking-wider uppercase truncate">
                      {tool.category}
                    </span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${statusMeta.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot} mr-1`} />
                      {statusMeta.text}
                    </span>
                  </div>

                  {/* Title & Serial */}
                  <h4 className="text-[13px] font-bold text-zinc-200 tracking-tight leading-snug group-hover:text-amber-450 transition-colors truncate">
                    {tool.name}
                  </h4>

                  <div className="flex items-center space-x-2">
                    <span className="inline-block text-[10px] text-zinc-400 font-mono tracking-wide bg-zinc-900/90 border border-zinc-800/80 px-1.5 py-0.5 rounded">
                      S/N: {tool.serialNumber}
                    </span>
                    <span className="inline-block text-[10px] text-amber-500 font-mono font-bold bg-amber-500/5 border border-amber-500/15 px-1.5 py-0.5 rounded max-w-[190px] truncate" title={tool.custodian === 'RTO' && tool.rtoProject ? `Custodian: RTO - ${tool.rtoProject}` : `Custodian: ${tool.custodian || 'RTO'}`}>
                      {tool.custodian || 'RTO'}
                      {tool.custodian === 'RTO' && tool.rtoProject ? ` (${tool.rtoProject})` : ''}
                    </span>
                    {tool.acquisitionCost !== undefined && (
                      <span className="inline-block text-[10px] text-amber-400 font-mono font-semibold bg-amber-405/5 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        Php {tool.acquisitionCost.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Locations display */}
                  <div className="pt-2 text-[11px] font-normal text-zinc-450 space-y-1">
                    <div className="flex items-center text-zinc-300 font-medium">
                      <MapPin className="w-3 h-3 text-amber-500 mr-1 shrink-0" />
                      <span className="truncate">Current: {tool.currentLocation}</span>
                    </div>
                    {tool.previousLocation && (
                      <div className="flex items-center opacity-85 text-[10px] text-zinc-500 italic pl-4">
                        <span>Prev: {tool.previousLocation}</span>
                      </div>
                    )}
                  </div>

                  {/* Custody operator */}
                  {tool.assignedTo && (
                    <div className="flex items-center text-[10px] font-medium text-zinc-450 pt-0.5">
                      <User className="w-3 h-3 text-zinc-550 mr-1 shrink-0" />
                      <span>Operator: <strong className="text-zinc-300 font-medium">{tool.assignedTo}</strong></span>
                    </div>
                  )}
                </div>

                <div className="flex self-center items-center justify-center p-1 bg-zinc-900 text-zinc-500 rounded-lg group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-all shrink-0 border border-zinc-800/50">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Category Wise Segmented File Uploader Component */}
      <ImportCategoryModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        category={activeImportCategory}
        onImport={onImportTools}
      />
    </div>
  );
}
