/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  EquipmentDefinition,
  EquipmentShape,
  InputChannel,
  MonitorMix,
  StageConfig,
  StageItem,
  StageProject,
  WorkspaceTab,
} from './types/stage';
import { EQUIPMENT_CATALOG } from './data/equipmentCatalog';
import { STAGE_TEMPLATES, StageTemplate } from './data/templates';
import { TopBar } from './components/TopBar';
import { EquipmentSidebar } from './components/EquipmentSidebar';
import { StageCanvas } from './components/StageCanvas';
import { InspectorPanel } from './components/InspectorPanel';
import { InputPatchView } from './components/InputPatchView';
import { TechRiderPrintView } from './components/TechRiderPrintView';
import { TemplateModal } from './components/TemplateModal';
import { exportStageSvgToPng } from './utils/exportPng';

const STORAGE_KEY = 'stageplot-studio-project-v1';
const THEME_KEY = 'stageplot-studio-theme';

function loadInitialProject(): StageProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StageProject;
      if (parsed && parsed.stageConfig && Array.isArray(parsed.items)) {
        return {
          ...parsed,
          items: parsed.items.map((it) =>
            it.label === 'Power SR' ? { ...it, label: 'Power 240v' } : it
          ),
        };
      }
    }
  } catch {
    // Ignore invalid storage
  }
  return STAGE_TEMPLATES[0].createProject();
}

export default function App() {
  const [project, setProject] = useState<StageProject>(loadInitialProject);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('plot');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark';
    } catch {
      return false;
    }
  });

  // Undo / Redo history for items
  const [historyPast, setHistoryPast] = useState<StageItem[][]>([]);
  const [historyFuture, setHistoryFuture] = useState<StageItem[][]>([]);
  const dragBaseItemsRef = useRef<StageItem[] | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 3200);
  }, []);

  // Persist project
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch {
      // Ignore storage quota errors
    }
  }, [project]);

  // Sync dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkTheme) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, isDarkTheme ? 'dark' : 'light');
    } catch {
      // Ignore
    }
  }, [isDarkTheme]);

  const commitItemsChange = useCallback(
    (updater: (prev: StageItem[]) => StageItem[], commitHistory = true) => {
      setProject((prev) => {
        if (commitHistory) {
          setHistoryPast((h) => [...h.slice(-39), prev.items]);
          setHistoryFuture([]);
          dragBaseItemsRef.current = null;
        } else if (dragBaseItemsRef.current === null) {
          dragBaseItemsRef.current = prev.items;
        }
        return {
          ...prev,
          items: updater(prev.items),
          updatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  const handleCommitDragHistory = useCallback(() => {
    if (dragBaseItemsRef.current) {
      const base = dragBaseItemsRef.current;
      dragBaseItemsRef.current = null;
      setHistoryPast((h) => [...h.slice(-39), base]);
      setHistoryFuture([]);
    }
  }, []);

  const handleUndo = useCallback(() => {
    setHistoryPast((past) => {
      if (past.length === 0) return past;
      const previous = past[past.length - 1];
      setProject((curr) => {
        setHistoryFuture((f) => [curr.items, ...f.slice(0, 39)]);
        return { ...curr, items: previous, updatedAt: new Date().toISOString() };
      });
      setSelectedIds([]);
      return past.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistoryFuture((future) => {
      if (future.length === 0) return future;
      const next = future[0];
      setProject((curr) => {
        setHistoryPast((p) => [...p.slice(-39), curr.items]);
        return { ...curr, items: next, updatedAt: new Date().toISOString() };
      });
      setSelectedIds([]);
      return future.slice(1);
    });
  }, []);

  const addEquipmentAt = useCallback(
    (def: EquipmentDefinition, xM: number, yM: number) => {
      const maxZ = project.items.reduce((acc, it) => Math.max(acc, it.zIndex), 5);
      const newItem: StageItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: def.type,
        label: def.shortLabel,
        xM: Number(xM.toFixed(2)),
        yM: Number(yM.toFixed(2)),
        widthM: def.defaultWidthM,
        depthM: def.defaultDepthM,
        rotation: def.type === 'wedge_monitor' ? 180 : 0,
        zIndex: def.isZone ? 2 : maxZ + 1,
      };
      commitItemsChange((prev) => [...prev, newItem], true);
      setSelectedIds([newItem.id]);
    },
    [project.items, commitItemsChange]
  );

  const handleAddFromSidebar = useCallback(
    (def: EquipmentDefinition) => {
      const offset = (project.items.length % 5) * 0.25 - 0.5;
      const cx = Math.max(1, Math.min(project.stageConfig.widthM - 1, project.stageConfig.widthM / 2 + offset));
      const cy = Math.max(1, Math.min(project.stageConfig.depthM - 1, project.stageConfig.depthM / 2 + offset));
      addEquipmentAt(def, cx, cy);
    },
    [project.items.length, project.stageConfig.widthM, project.stageConfig.depthM, addEquipmentAt]
  );

  const handleDropNewEquipment = useCallback(
    (type: EquipmentShape, xM: number, yM: number) => {
      const def = EQUIPMENT_CATALOG.find((d) => d.type === type);
      if (def) addEquipmentAt(def, xM, yM);
    },
    [addEquipmentAt]
  );

  const handleDuplicateSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const newIds: string[] = [];
    commitItemsChange((prev) => {
      const clones = prev
        .filter((it) => selectedIds.includes(it.id))
        .map((it) => {
          const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          newIds.push(id);
          return {
            ...it,
            id,
            xM: Math.min(project.stageConfig.widthM - 0.5, Number((it.xM + 0.5).toFixed(2))),
            yM: Math.min(project.stageConfig.depthM - 0.5, Number((it.yM + 0.5).toFixed(2))),
            locked: false,
          };
        });
      return [...prev, ...clones];
    }, true);
    setSelectedIds(newIds);
  }, [selectedIds, project.stageConfig.widthM, project.stageConfig.depthM, commitItemsChange]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    commitItemsChange(
      (prev) => prev.filter((it) => !selectedIds.includes(it.id)),
      true
    );
    setSelectedIds([]);
  }, [selectedIds, commitItemsChange]);

  const handleAlignSelected = useCallback(
    (mode: 'align-x' | 'align-y' | 'distribute-x') => {
      const targetItems = project.items.filter((it) => selectedIds.includes(it.id) && !it.locked);
      if (targetItems.length < 2) return;

      commitItemsChange((prev) => {
        if (mode === 'align-x') {
          const avgX = Number(
            (targetItems.reduce((s, i) => s + i.xM, 0) / targetItems.length).toFixed(2)
          );
          return prev.map((it) =>
            selectedIds.includes(it.id) && !it.locked ? { ...it, xM: avgX } : it
          );
        }
        if (mode === 'align-y') {
          const avgY = Number(
            (targetItems.reduce((s, i) => s + i.yM, 0) / targetItems.length).toFixed(2)
          );
          return prev.map((it) =>
            selectedIds.includes(it.id) && !it.locked ? { ...it, yM: avgY } : it
          );
        }
        // distribute-x
        const sorted = [...targetItems].sort((a, b) => a.xM - b.xM);
        const minX = sorted[0].xM;
        const maxX = sorted[sorted.length - 1].xM;
        const step = (maxX - minX) / (sorted.length - 1);
        const posMap = new Map<string, number>();
        sorted.forEach((it, idx) => {
          posMap.set(it.id, Number((minX + idx * step).toFixed(2)));
        });
        return prev.map((it) =>
          posMap.has(it.id) ? { ...it, xM: posMap.get(it.id)! } : it
        );
      }, true);
    },
    [project.items, selectedIds, commitItemsChange]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'plot') return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
        return;
      }
      if (e.key === 'Escape') {
        setSelectedIds([]);
        return;
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedIds.length > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 0.5 : 0.1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        commitItemsChange(
          (prev) =>
            prev.map((it) =>
              selectedIds.includes(it.id) && !it.locked
                ? {
                    ...it,
                    xM: Math.max(0.2, Math.min(project.stageConfig.widthM - 0.2, Number((it.xM + dx).toFixed(2)))),
                    yM: Math.max(0.2, Math.min(project.stageConfig.depthM - 0.2, Number((it.yM + dy).toFixed(2)))),
                  }
                : it
            ),
          true
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeTab,
    selectedIds,
    project.stageConfig.widthM,
    project.stageConfig.depthM,
    handleUndo,
    handleRedo,
    handleDuplicateSelected,
    handleDeleteSelected,
    commitItemsChange,
  ]);

  const handleUpdateProjectMeta = (patch: Partial<StageProject>) => {
    setProject((prev) => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }));
  };

  const handleUpdateStageConfig = (patch: Partial<StageConfig>) => {
    setProject((prev) => ({
      ...prev,
      stageConfig: { ...prev.stageConfig, ...patch },
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleUpdateItem = (id: string, patch: Partial<StageItem>) => {
    commitItemsChange(
      (prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
      true
    );
  };

  const handleSendItemToPatch = (item: StageItem) => {
    const def = EQUIPMENT_CATALOG.find((d) => d.type === item.type);
    if (!def?.suggestedChannels || def.suggestedChannels.length === 0) return;

    const startCh = project.inputList.length + 1;
    const newChannels: InputChannel[] = def.suggestedChannels.map((s, idx) => ({
      id: `ch-${Date.now()}-${idx}`,
      channelNumber: startCh + idx,
      source:
        def.suggestedChannels!.length === 1 && item.label
          ? `${item.label}${item.performer ? ` (${item.performer})` : ''}`
          : `${item.label} · ${s.source}`,
      micOrDi: s.micOrDi,
      stand: s.stand,
      phantom48v: s.phantom48v,
      stageItemId: item.id,
      notes: '',
    }));

    const endCh = startCh + newChannels.length - 1;
    const badge = startCh === endCh ? `${startCh}` : `${startCh}-${endCh}`;

    setProject((prev) => ({
      ...prev,
      inputList: [...prev.inputList, ...newChannels],
      items: prev.items.map((it) =>
        it.id === item.id ? { ...it, channelLabel: badge } : it
      ),
      updatedAt: new Date().toISOString(),
    }));
    showToast(`Added ${newChannels.length} channel${newChannels.length > 1 ? 's' : ''} (CH ${badge}) to Input Patch`);
  };

  const handleSyncFromStage = (): number => {
    let nextNum = project.inputList.length + 1;
    const added: InputChannel[] = [];
    const badgeUpdates = new Map<string, string>();

    for (const item of project.items) {
      const alreadyLinked = project.inputList.some((ch) => ch.stageItemId === item.id);
      if (alreadyLinked) continue;
      const def = EQUIPMENT_CATALOG.find((d) => d.type === item.type);
      if (!def?.suggestedChannels || def.suggestedChannels.length === 0) continue;

      const itemStart = nextNum;
      def.suggestedChannels.forEach((s, idx) => {
        added.push({
          id: `ch-${Date.now()}-${item.id}-${idx}`,
          channelNumber: nextNum++,
          source:
            def.suggestedChannels!.length === 1 && item.label
              ? `${item.label}${item.performer ? ` (${item.performer})` : ''}`
              : `${item.label} · ${s.source}`,
          micOrDi: s.micOrDi,
          stand: s.stand,
          phantom48v: s.phantom48v,
          stageItemId: item.id,
          notes: '',
        });
      });
      const itemEnd = nextNum - 1;
      badgeUpdates.set(item.id, itemStart === itemEnd ? `${itemStart}` : `${itemStart}-${itemEnd}`);
    }

    if (added.length > 0) {
      setProject((prev) => ({
        ...prev,
        inputList: [...prev.inputList, ...added],
        items: prev.items.map((it) =>
          badgeUpdates.has(it.id) ? { ...it, channelLabel: badgeUpdates.get(it.id) } : it
        ),
        updatedAt: new Date().toISOString(),
      }));
    }
    return added.length;
  };

  const handleSelectTemplate = (template: StageTemplate) => {
    setHistoryPast([]);
    setHistoryFuture([]);
    setSelectedIds([]);
    setProject(template.createProject());
    showToast(`Loaded "${template.name}"`);
  };

  const handleExportPng = async () => {
    if (activeTab !== 'plot') {
      setActiveTab('plot');
      await new Promise((r) => setTimeout(r, 80));
    }
    if (!svgRef.current) {
      showToast('Switch to Stage Plot view to export PNG');
      return;
    }
    try {
      await exportStageSvgToPng(svgRef.current, project);
      showToast('Stage plot PNG downloaded');
    } catch {
      showToast('Could not export PNG');
    }
  };

  const handlePrintRider = () => {
    setActiveTab('rider');
    setTimeout(() => window.print(), 160);
  };

  const handleExportJson = () => {
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = (project.ensembleOrArtist || project.title || 'stageplot')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    link.href = url;
    link.download = `${slug}.stageplot.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Project file saved (.json)');
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as StageProject;
        if (!parsed.stageConfig || !Array.isArray(parsed.items)) {
          showToast('Invalid stageplot JSON file');
          return;
        }
        setHistoryPast([]);
        setHistoryFuture([]);
        setSelectedIds([]);
        setProject(parsed);
        showToast(`Imported "${parsed.title || file.name}"`);
      } catch {
        showToast('Could not parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 print:h-auto print:overflow-visible">
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onExportPng={handleExportPng}
        onPrintRider={handlePrintRider}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        isDarkTheme={isDarkTheme}
        onToggleTheme={() => setIsDarkTheme((d) => !d)}
      />

      {activeTab === 'plot' && (
        <main className="flex-1 flex min-h-0 overflow-hidden">
          <EquipmentSidebar onAddEquipment={handleAddFromSidebar} />
          <StageCanvas
            svgRef={svgRef}
            stageConfig={project.stageConfig}
            items={project.items}
            selectedIds={selectedIds}
            canUndo={historyPast.length > 0}
            canRedo={historyFuture.length > 0}
            onSelectIds={setSelectedIds}
            onUpdateItems={commitItemsChange}
            onDropNewEquipment={handleDropNewEquipment}
            onUpdateStageConfig={handleUpdateStageConfig}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onDuplicateSelected={handleDuplicateSelected}
            onDeleteSelected={handleDeleteSelected}
            onCommitDragHistory={handleCommitDragHistory}
            onOpenTemplates={() => setTemplatesOpen(true)}
          />
          <InspectorPanel
            project={project}
            selectedIds={selectedIds}
            onUpdateProjectMeta={handleUpdateProjectMeta}
            onUpdateStageConfig={handleUpdateStageConfig}
            onUpdateItem={handleUpdateItem}
            onDuplicateSelected={handleDuplicateSelected}
            onDeleteSelected={handleDeleteSelected}
            onAlignSelected={handleAlignSelected}
            onSendItemToPatch={handleSendItemToPatch}
          />
        </main>
      )}

      {activeTab === 'patch' && (
        <InputPatchView
          project={project}
          onUpdateInputList={(inputList: InputChannel[]) =>
            handleUpdateProjectMeta({ inputList })
          }
          onUpdateMonitorMixes={(monitorMixes: MonitorMix[]) =>
            handleUpdateProjectMeta({ monitorMixes })
          }
          onSyncFromStage={handleSyncFromStage}
          onLocateStageItem={(itemId) => {
            setSelectedIds([itemId]);
            setActiveTab('plot');
          }}
        />
      )}

      {activeTab === 'rider' && (
        <TechRiderPrintView
          project={project}
          onUpdateProjectMeta={handleUpdateProjectMeta}
          onExportPng={handleExportPng}
        />
      )}

      <TemplateModal
        isOpen={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {toast && (
        <div
          role="status"
          className="no-print fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
