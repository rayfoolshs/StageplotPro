import React, { useState, useMemo } from 'react';
import { Search, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { CATEGORY_META, EQUIPMENT_CATALOG } from '../data/equipmentCatalog';
import { EquipmentCategory, EquipmentDefinition } from '../types/stage';
import { EquipmentGraphic } from './EquipmentSvg';

interface EquipmentSidebarProps {
  onAddEquipment: (def: EquipmentDefinition) => void;
}

const CATEGORY_ORDER: EquipmentCategory[] = [
  'vocals',
  'drums',
  'guitars',
  'keys',
  'winds_strings',
  'monitoring',
  'staging',
];

export const EquipmentSidebar: React.FC<EquipmentSidebarProps> = ({ onAddEquipment }) => {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CATEGORY_ORDER.map((cat) => {
      const items = EQUIPMENT_CATALOG.filter(
        (item) =>
          item.category === cat &&
          (!q ||
            item.name.toLowerCase().includes(q) ||
            item.shortLabel.toLowerCase().includes(q) ||
            CATEGORY_META[cat].label.toLowerCase().includes(q))
      );
      return { category: cat, meta: CATEGORY_META[cat], items };
    }).filter((g) => g.items.length > 0);
  }, [search]);

  const toggleCategory = (cat: string) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <aside className="no-print w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden">
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
            Equipment Library
          </h2>
          <span className="font-mono-tabular text-[11px] text-slate-400 dark:text-slate-500">
            {EQUIPMENT_CATALOG.length} items
          </span>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter gear or instruments..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          Drag onto stage or click to add
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-2">
        {grouped.length === 0 ? (
          <div className="py-10 px-3 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">No equipment matches "{search}"</p>
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        ) : (
          grouped.map(({ category, meta, items }) => {
            const isCollapsed = !!collapsed[category] && !search.trim();
            return (
              <div key={category} className="pb-1">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-1.5 py-1.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer"
                >
                  <span className="truncate">{meta.label}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    {items.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/stageplot-type', item.type);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={() => onAddEquipment(item)}
                        title={`Add ${item.name}`}
                        className="group flex flex-col items-center p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all text-center cursor-grab active:cursor-grabbing"
                      >
                        <div className="w-11 h-9 flex items-center justify-center mb-1 relative">
                          <svg width={40} height={32} viewBox="0 0 40 32" className="overflow-visible">
                            <EquipmentGraphic
                              type={item.type}
                              width={40}
                              height={32}
                              surface="light"
                            />
                          </svg>
                          <span className="opacity-0 group-hover:opacity-100 absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center transition-opacity">
                            <Plus className="w-2.5 h-2.5" />
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200 leading-tight line-clamp-2">
                          {item.shortLabel}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
