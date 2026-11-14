import React, { useState, useRef, useEffect } from 'react';
import { Download, Printer, FileJson, Upload, ChevronDown, Sun, Moon } from 'lucide-react';
import { WorkspaceTab } from '../types/stage';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  onOpenTemplates: () => void;
  onExportPng: () => void;
  onPrintRider: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  onOpenTemplates,
  onExportPng,
  onPrintRider,
  onExportJson,
  onImportJson,
  isDarkTheme,
  onToggleTheme,
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const navItems: { id: WorkspaceTab; label: string }[] = [
    { id: 'plot', label: 'Stage Plot' },
    { id: 'patch', label: 'Input Patch' },
    { id: 'rider', label: 'Tech Rider' },
  ];

  return (
    <header className="no-print h-14 px-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-8 shrink-0 z-30">
      {/* Zone 1: Single-element Brand Wordmark */}
      <a
        href="#plot"
        onClick={(e) => {
          e.preventDefault();
          onTabChange('plot');
        }}
        className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
      >
        StagePlot Studio
      </a>

      {/* Zone 2: Concise single-line navigation links */}
      <nav className="flex items-center gap-7" aria-label="Workspace views">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`relative py-4 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenTemplates}
          className="py-4 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm"
        >
          Templates
        </button>
      </nav>

      {/* Zone 3: Single Primary Action (+ subtle theme switch inside action cluster) */}
      <div className="flex items-center gap-2 shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={onToggleTheme}
          title={isDarkTheme ? 'Switch to light workspace' : 'Switch to dark workspace'}
          aria-label={isDarkTheme ? 'Switch to light workspace' : 'Switch to dark workspace'}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
        >
          {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Plot</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {exportOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1.5 z-50">
              <button
                type="button"
                onClick={() => {
                  setExportOpen(false);
                  onExportPng();
                }}
                className="w-full px-3.5 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Download PNG Image</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setExportOpen(false);
                  onPrintRider();
                }}
                className="w-full px-3.5 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print / Save PDF Rider</span>
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <button
                type="button"
                onClick={() => {
                  setExportOpen(false);
                  onExportJson();
                }}
                className="w-full px-3.5 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
              >
                <FileJson className="w-4 h-4 text-slate-500" />
                <span>Save Project (.json)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setExportOpen(false);
                  fileInputRef.current?.click();
                }}
                className="w-full px-3.5 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Import Project (.json)</span>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImportJson(file);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>
    </header>
  );
};
