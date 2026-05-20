/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Tool } from './types';
import { INITIAL_TOOLS } from './initialData';
import StatsGrid from './components/StatsGrid';
import ToolCardList from './components/ToolCardList';
import ToolDetailView from './components/ToolDetailView';
import AddToolModal from './components/AddToolModal';
import { Hammer, Plus, RefreshCw, Layers, ArrowLeft } from 'lucide-react';

export default function App() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mobileDetailActive, setMobileDetailActive] = useState(false);

  // Initialize categories state with defaults plus user-custom ones saved in local storage
  const [categories, setCategories] = useState<string[]>(() => {
    const defaultCategories = [
      'AIR COMPRESSOR',
      'Baby Grinder',
      'CHAIN BLOCK',
      'CIRCULAR SAW',
      'HILTI',
      'Power Tools'
    ];
    const saved = localStorage.getItem('equipment_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        return parsed.filter(c => !['Heavy Hand Tools', 'Diagnostic & Measurement', 'Site Utility', 'Safety & Protection'].includes(c));
      } catch (err) {
        console.error('Error loading custom categories', err);
      }
    }
    return defaultCategories;
  });

  const handleAddCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (trimmed && !categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...categories, trimmed];
      setCategories(updated);
      localStorage.setItem('equipment_categories', JSON.stringify(updated));
      return true;
    }
    return false;
  };

  const handleRemoveCategory = (catToRemove: string) => {
    const updated = categories.filter(c => c !== catToRemove);
    setCategories(updated);
    localStorage.setItem('equipment_categories', JSON.stringify(updated));
  };

  // Initialize customizable RTO Project list in local storage
  const [rtoProjects, setRtoProjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('rto_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Error loading custom RTO projects', err);
      }
    }
    return [
      'Project Alpha',
      'Project Beta',
      'Metro Manila Expressway',
      'Cebu City Port Rehab',
      'Davao Bypass Construction'
    ];
  });

  const handleAddRtoProject = (newProj: string) => {
    const trimmed = newProj.trim();
    if (trimmed && !rtoProjects.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...rtoProjects, trimmed];
      setRtoProjects(updated);
      localStorage.setItem('rto_projects', JSON.stringify(updated));
      return true;
    }
    return false;
  };

  // Initialize data from localStorage or initialData
  useEffect(() => {
    const savedTools = localStorage.getItem('light_equipment_inventory');
    if (savedTools) {
      try {
        const parsed = JSON.parse(savedTools) as Tool[];
        const filtered = parsed.filter(t => 
          !['Safety & Protection', 'Site Utility', 'Diagnostic & Measurement', 'Heavy Hand Tools'].includes(t.category)
        );
        setTools(filtered);
        localStorage.setItem('light_equipment_inventory', JSON.stringify(filtered));
        if (filtered.length > 0) {
          setSelectedToolId(filtered[0].id);
        }
      } catch (err) {
        console.error('Error loading tools from local storage, fallback to initial:', err);
        setTools(INITIAL_TOOLS);
        if (INITIAL_TOOLS.length > 0) {
          setSelectedToolId(INITIAL_TOOLS[0].id);
        }
      }
    } else {
      setTools(INITIAL_TOOLS);
      if (INITIAL_TOOLS.length > 0) {
        setSelectedToolId(INITIAL_TOOLS[0].id);
      }
    }
  }, []);

  // Save changes to localStorage whenever inventory updates
  const saveTools = (updatedTools: Tool[]) => {
    setTools(updatedTools);
    localStorage.setItem('light_equipment_inventory', JSON.stringify(updatedTools));
  };

  // Select tool callback
  const handleSelectTool = (id: string) => {
    setSelectedToolId(id);
    setMobileDetailActive(true); // Toggle mobile view to detail
  };

  // Add a new tool
  const handleAddTool = (newTool: Tool) => {
    const updatedTools = [newTool, ...tools];
    saveTools(updatedTools);
    setSelectedToolId(newTool.id);
  };

  // Edit/update a tool state (location change, maintenance lock, custody change)
  const handleUpdateTool = (updatedTool: Tool) => {
    const updatedTools = tools.map(t => t.id === updatedTool.id ? updatedTool : t);
    saveTools(updatedTools);
  };

  // Delete an existing tool from the roster
  const handleDeleteTool = (id: string) => {
    const updatedTools = tools.filter(t => t.id !== id);
    saveTools(updatedTools);
    if (updatedTools.length > 0) {
      setSelectedToolId(updatedTools[0].id);
    } else {
      setSelectedToolId(null);
    }
    setMobileDetailActive(false);
  };

  // Bulk Import tools under appropriate category
  const handleImportTools = (importedTools: Tool[]) => {
    const updatedTools = [...importedTools, ...tools];
    saveTools(updatedTools);
    if (importedTools.length > 0) {
      setSelectedToolId(importedTools[0].id);
    }
  };

  // Reset demo catalog state returning inventory to standard demo
  const handleResetCatalog = () => {
    if (window.confirm('Do you want to reset the equipment catalog to default demo values? All local changes will be cleared.')) {
      setTools(INITIAL_TOOLS);
      localStorage.setItem('light_equipment_inventory', JSON.stringify(INITIAL_TOOLS));
      if (INITIAL_TOOLS.length > 0) {
        setSelectedToolId(INITIAL_TOOLS[0].id);
      }
      setMobileDetailActive(false);
    }
  };

  // Retrieve current active tool details
  const currentTool = tools.find(t => t.id === selectedToolId) || null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-400 font-sans flex flex-col antialiased selection:bg-amber-500/20 selection:text-amber-500">
      
      {/* Dynamic Master Header */}
      <header className="sticky top-0 z-30 bg-zinc-900/95 border-b border-zinc-800/60 px-4 sm:px-6 py-4 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 text-black rounded-xl shadow-md shadow-amber-500/5">
              <Hammer className="w-5 h-5 stroke-[2.25]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-200 hover:text-amber-500 transition-colors duration-200 font-sans cursor-default">
                ED - LET Monitoring
              </h1>
              <p className="text-[10px] sm:text-xs text-zinc-500 font-medium tracking-wide">
                Precision Custody & Maintenance Logistics
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="reset-catalog-btn"
              onClick={handleResetCatalog}
              title="Reset Demo Fleet Catalog"
              className="p-2 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              id="header-register-tool-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-black bg-amber-500 hover:bg-amber-400 transition-all rounded-xl shadow-sm hover:shadow-amber-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-black stroke-[2.5]" />
              <span>Register Equipment</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Statistics Dashboard Block */}
        <StatsGrid tools={tools} />

        {/* Master Detail Board Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left / Full list panel */}
          <div className={`col-span-1 lg:col-span-12 xl:col-span-5 ${mobileDetailActive ? 'hidden lg:block' : 'block'}`}>
            <ToolCardList
              tools={tools}
              categories={categories}
              onAddCategory={handleAddCategory}
              onRemoveCategory={handleRemoveCategory}
              selectedToolId={selectedToolId}
              onSelectTool={handleSelectTool}
              onImportTools={handleImportTools}
            />
          </div>

          {/* Right / Single item detail monitor screen */}
          <div className={`col-span-1 lg:col-span-12 xl:col-span-7 ${!mobileDetailActive ? 'hidden lg:block' : 'block'}`}>
            
            {/* Mobile Layout Return Button */}
            {mobileDetailActive && (
              <button
                id="mobile-back-to-list-btn"
                onClick={() => setMobileDetailActive(false)}
                className="lg:hidden flex items-center space-x-2 text-xs font-bold text-amber-500 mb-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-3 py-2 rounded-xl transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-amber-500" />
                <span>Return to Equipment List</span>
              </button>
            )}

            <ToolDetailView
              tool={currentTool}
              onUpdateTool={handleUpdateTool}
              onDeleteTool={handleDeleteTool}
              rtoProjects={rtoProjects}
              onAddRtoProject={handleAddRtoProject}
            />
          </div>

        </div>
      </main>

      {/* Slide-over Dialog registration modal */}
      <AddToolModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTool={handleAddTool}
        categories={categories}
        onAddCategory={handleAddCategory}
        rtoProjects={rtoProjects}
        onAddRtoProject={handleAddRtoProject}
      />

      {/* Footer copyright info details */}
      <footer className="py-6 border-t border-zinc-800/80 bg-zinc-900/40 mt-12 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-medium tracking-wide">
            © 2026 LUMEN Monitor. Certified ledger transactions persisted locally.
          </p>
          <div className="flex items-center space-x-2 text-[10px] font-mono select-none bg-zinc-900 px-2.5 py-1 rounded-lg text-zinc-400 border border-zinc-805">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Firmware Status: Stable v1.4.1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
