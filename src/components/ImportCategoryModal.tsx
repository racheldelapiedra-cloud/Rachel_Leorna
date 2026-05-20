/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Tool, ToolStatus } from '../types';
import { X, Upload, FileText, CheckCircle, AlertTriangle, HelpCircle, Download, FileSpreadsheet } from 'lucide-react';

interface ImportCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  onImport: (importedTools: Tool[]) => void;
}

export default function ImportCategoryModal({ isOpen, onClose, category, onImport }: ImportCategoryModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedTools, setParsedTools] = useState<Partial<Tool>[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Manual trigger download of a sample CSV template for the target category
  const handleDownloadTemplate = () => {
    const csvHeaders = [
      'Equipment Name',
      'Model Number',
      'Serial Number',
      'Tag Number',
      'Current Location',
      'Acquisition Cost',
      'Assigned Operator',
      'Status'
    ];
    const sampleRows = [
      [`Hilti Rotary Hammer TE-50`, 'TE-50', 'SN-HIL-9241', 'TAG-HL-01', 'Warehouse Site A', '45000', 'Juan dela Cruz', 'available'],
      [`Hilti Concrete Breaker TE-1000`, 'TE-1000', 'SN-HIL-5582', 'TAG-HL-02', 'Basement Level 2', '75000', 'Pedro Penduko', 'under_maintenance']
    ];
    
    const csvContent = [
      csvHeaders.join(','),
      ...sampleRows.map(row => row.map(cell => {
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.setAttribute('href', url);
    anchor.setAttribute('download', `IMPORT_TEMPLATE_${category.replace(/\s+/g, '_').toUpperCase()}.csv`);
    anchor.style.visibility = 'hidden';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  // Safe line spliter for CSV rows with optional double quotes and commas
  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let insideQuote = false;
    let entry = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        result.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    result.push(entry.trim());
    return result.map(val => val.replace(/^"|"$/g, '').trim());
  };

  const processFile = (fileToParse: File) => {
    setFile(fileToParse);
    setErrorMsg(null);
    setParsedTools([]);

    const reader = new FileReader();
    
    if (fileToParse.name.endsWith('.json')) {
      reader.onload = (e) => {
        try {
          const rawText = e.target?.result as string;
          const parsed = JSON.parse(rawText);
          const dataArray = Array.isArray(parsed) ? parsed : [parsed];
          
          const validTools: Partial<Tool>[] = [];
          
          dataArray.forEach((item: any) => {
            const name = item.name || item.equipmentName || item.title;
            if (!name) return; // Skip items without a name
            
            const costParsed = item.cost || item.acquisitionCost || item.price;
            const validStatus: ToolStatus = 
              ['available', 'in_use', 'under_maintenance', 'service_required', 'decommissioned'].includes(item.status) 
                ? item.status 
                : 'available';

            validTools.push({
              name: String(name),
              model: String(item.model || item.modelNumber || 'GENERIC'),
              serialNumber: String(item.serialNumber || item.serial || item.serialNo || `SN-${Math.floor(100000 + Math.random() * 900000)}`),
              tagNumber: item.tagNumber || item.tag || item.tagId || undefined,
              acquisitionCost: costParsed ? parseFloat(costParsed) : undefined,
              currentLocation: String(item.currentLocation || item.location || 'Site HQ'),
              assignedTo: item.assignedTo || item.operator || item.assignedOperator || null,
              status: validStatus,
              purchaseDate: item.purchaseDate || new Date().toISOString().split('T')[0],
              lastInspectedDate: item.lastInspectedDate || new Date().toISOString().split('T')[0],
              previousLocation: null,
              locationHistory: [],
              maintenanceHistory: []
            });
          });

          if (validTools.length === 0) {
            setErrorMsg('No valid equipment name records found in JSON file.');
          } else {
            setParsedTools(validTools);
          }
        } catch (err) {
          setErrorMsg('Failed to parse JSON file. Ensure it contains a valid array of equipment.');
        }
      };
      reader.readAsText(fileToParse);
    } else if (fileToParse.name.endsWith('.csv')) {
      reader.onload = (e) => {
        try {
          const rawText = e.target?.result as string;
          // Split by line breaks, filter out empty rows
          const lines = rawText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
          
          if (lines.length < 2) {
            setErrorMsg('The CSV file is empty or missing headers.');
            return;
          }

          const rawHeaders = parseCSVLine(lines[0]);
          const headers = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

          // Trace matching columns
          const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('title') || h === 'equipment');
          const modelIndex = headers.findIndex(h => h.includes('model') || h === 'mno');
          const serialIndex = headers.findIndex(h => h.includes('serial') || h === 'sn' || h === 'serialno');
          const tagIndex = headers.findIndex(h => h.includes('tag') || h === 'tagid');
          const costIndex = headers.findIndex(h => h.includes('cost') || h.includes('price') || h.includes('rate'));
          const locationIndex = headers.findIndex(h => h.includes('location') || h.includes('site') || h.includes('currentlocation'));
          const operatorIndex = headers.findIndex(h => h.includes('operator') || h.includes('assignedto') || h.includes('custody'));
          const statusIndex = headers.findIndex(h => h === 'status' || h.includes('state'));

          if (nameIndex === -1) {
            setErrorMsg('Could not detect "Equipment Name" header row column in CSV file.');
            return;
          }

          const validTools: Partial<Tool>[] = [];

          // Process rows starting from line 1
          for (let i = 1; i < lines.length; i++) {
            const cells = parseCSVLine(lines[i]);
            if (cells.length === 0 || !cells[nameIndex]) continue;

            // Gather elements
            let costVal: number | undefined;
            if (costIndex !== -1 && cells[costIndex]) {
              const cleanedCost = cells[costIndex].replace(/[^0-9.]/g, '');
              const parsedFloat = parseFloat(cleanedCost);
              if (!isNaN(parsedFloat)) costVal = parsedFloat;
            }

            // Status translation mapping
            let rowStatus: ToolStatus = 'available';
            if (statusIndex !== -1 && cells[statusIndex]) {
              const fileStatus = cells[statusIndex].toLowerCase().trim();
              if (fileStatus.includes('use')) rowStatus = 'in_use';
              else if (fileStatus.includes('maintenance') || fileStatus.includes('repair')) rowStatus = 'under_maintenance';
              else if (fileStatus.includes('service') || fileStatus.includes('need') || fileStatus.includes('required')) rowStatus = 'service_required';
              else if (fileStatus.includes('decom') || fileStatus.includes('old') || fileStatus.includes('retire')) rowStatus = 'decommissioned';
            }

            validTools.push({
              name: cells[nameIndex],
              model: modelIndex !== -1 && cells[modelIndex] ? cells[modelIndex] : 'GENERIC',
              serialNumber: serialIndex !== -1 && cells[serialIndex] ? cells[serialIndex] : `SN-${Math.floor(100000 + Math.random() * 900000)}`,
              tagNumber: tagIndex !== -1 && cells[tagIndex] ? cells[tagIndex] : undefined,
              acquisitionCost: costVal,
              currentLocation: locationIndex !== -1 && cells[locationIndex] ? cells[locationIndex] : 'Site HQ',
              assignedTo: operatorIndex !== -1 && cells[operatorIndex] ? cells[operatorIndex] : null,
              status: rowStatus,
              purchaseDate: new Date().toISOString().split('T')[0],
              lastInspectedDate: new Date().toISOString().split('T')[0],
              previousLocation: null,
              locationHistory: [],
              maintenanceHistory: []
            });
          }

          if (validTools.length === 0) {
            setErrorMsg('No valid rows containing equipment records were extracted.');
          } else {
            setParsedTools(validTools);
          }
        } catch (err) {
          setErrorMsg('Error reading CSV rows. Ensure correct columns schema formatting.');
        }
      };
      reader.readAsText(fileToParse);
    } else {
      setErrorMsg('Unsupported format. Please upload a standard CSV or JSON file.');
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSaveImport = () => {
    if (parsedTools.length === 0) return;

    // Build the final complete equipment objects
    const finalTools: Tool[] = parsedTools.map((t, idx) => ({
      id: `tool-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      name: t.name!,
      model: t.model || 'GENERIC',
      serialNumber: t.serialNumber!,
      category: category, // Enforce current category on all details
      status: t.status || 'available',
      currentLocation: t.currentLocation || 'Site HQ',
      previousLocation: null,
      locationHistory: [],
      maintenanceHistory: [],
      purchaseDate: t.purchaseDate || new Date().toISOString().split('T')[0],
      acquisitionCost: t.acquisitionCost,
      tagNumber: t.tagNumber || `TAG-${category.substring(0,2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      lastInspectedDate: t.lastInspectedDate || new Date().toISOString().split('T')[0],
      assignedTo: t.assignedTo || null,
      custodian: t.custodian || 'RTO'
    }));

    onImport(finalTools);
    onClose();
    // Refresh states
    setFile(null);
    setParsedTools([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header toolbar */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900 shrink-0">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Import Category Details</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Import under {category}</p>
            </div>
          </div>
          <button
            id="close-import-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 max-h-[70vh]">
          
          {/* File Upload Zone - Supports click and drag/drop */}
          {!file ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed p-6 text-center rounded-xl cursor-pointer flex flex-col items-center justify-center space-y-3 transition-all ${
                dragActive 
                  ? 'border-amber-500 bg-amber-500/5' 
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/10'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.json"
                className="hidden"
              />
              <div className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-full group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-6 h-6 text-amber-500" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-200">Drag & drop your CSV or JSON file here</p>
                <p className="text-[10px] text-zinc-550">or click to browse local files on your machine</p>
              </div>
              <div className="text-[9px] text-zinc-500 flex items-center bg-zinc-950/40 px-2.5 py-1 rounded border border-zinc-850">
                <HelpCircle className="w-3 h-3 text-amber-500/80 mr-1 shrink-0" />
                <span>Supports headers: Name, Model, Serial, Tag, Cost, Location, Operator, Status</span>
              </div>
            </div>
          ) : (
            /* File details view */
            <div className="border border-zinc-800 p-4 rounded-xl bg-zinc-900/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <FileText className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-200 truncate">{file.name}</p>
                    <p className="text-[9px] text-zinc-500 font-mono font-bold uppercase">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setParsedTools([]);
                    setErrorMsg(null);
                  }}
                  className="text-[10px] text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider cursor-pointer"
                >
                  Change File
                </button>
              </div>

              {/* Status information after parsing */}
              {errorMsg ? (
                <div className="p-3 bg-rose-950/20 text-rose-455 border border-rose-900/30 text-xs rounded-xl flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              ) : parsedTools.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="p-3 bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 text-xs rounded-xl flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Successfully parsed <strong className="font-mono">{parsedTools.length}</strong> equipment units.</span>
                  </div>

                  {/* Tiny live review table of some units */}
                  <div className="space-y-1.5 border-t border-zinc-850 pt-3">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono"> Roster Preview:</span>
                    <div className="space-y-1 bg-zinc-950/40 border border-zinc-800/80 rounded-lg p-2 max-h-[160px] overflow-y-auto divide-y divide-zinc-850">
                      {parsedTools.slice(0, 5).map((t, index) => (
                        <div key={index} className="py-1.5 text-[10px] flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-300 truncate">{t.name}</p>
                            <p className="text-zinc-550 truncate">Model: {t.model} • S/N: {t.serialNumber}</p>
                          </div>
                          <span className="text-amber-500 font-bold shrink-0 font-mono">
                            {t.acquisitionCost !== undefined ? `Php ${t.acquisitionCost}` : 'N/A'}
                          </span>
                        </div>
                      ))}
                      {parsedTools.length > 5 && (
                        <p className="text-[9px] text-center text-zinc-550 pt-1.5 italic">
                          And {parsedTools.length - 5} other units...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-zinc-900/40 text-zinc-400 border border-zinc-800 text-xs rounded-xl flex items-center justify-center space-x-2">
                  <span className="animate-pulse">Analyzing document structure...</span>
                </div>
              )}
            </div>
          )}

          {/* Guidelines / Help section */}
          <div className="p-4 bg-zinc-950/40 border border-zinc-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center space-x-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Roster Format Guidelines</span>
              </span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-[9.5px] text-amber-500 hover:text-amber-450 font-bold flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Download Template CSV</span>
              </button>
            </div>
            
            <p className="text-[10.5px] leading-relaxed text-zinc-500">
              Your upload will automatically set the category of all entries to <strong className="text-zinc-400 font-medium font-sans">{category}</strong>. 
              The system automatically registers custody details, cost figures, and generates tracking references for each newly imported unit.
            </p>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-3.5 border-t border-zinc-800 flex justify-end items-center bg-zinc-900 shrink-0 space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-820 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="confirm-import-save-btn"
            type="button"
            disabled={parsedTools.length === 0}
            onClick={handleSaveImport}
            className={`px-4 py-1.5 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-sm ${
              parsedTools.length > 0
                ? 'bg-amber-500 hover:bg-amber-400 text-black cursor-pointer active:scale-95'
                : 'bg-zinc-850 text-zinc-600 cursor-not-allowed opacity-50'
            }`}
          >
            <span>Confirm Import ({parsedTools.length})</span>
          </button>
        </div>

      </div>
    </div>
  );
}
