import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  Undo2,
  Redo2,
  Copy,
  Trash2,
  Grid3X3,
  Cable,
  Tag,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
} from 'lucide-react';
import {
  EquipmentShape,
  StageConfig,
  StageItem,
} from '../types/stage';
import { EQUIPMENT_CATALOG } from '../data/equipmentCatalog';
import { EquipmentGraphic } from './EquipmentSvg';

export const PPM = 80; // Pixels per meter in base SVG coordinates
const PAD_X = 64;
const PAD_TOP = 54;
const PAD_BOTTOM = 78;

interface AlignmentGuide {
  axis: 'x' | 'y';
  posM: number;
}

interface StageCanvasProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  stageConfig: StageConfig;
  items: StageItem[];
  selectedIds: string[];
  canUndo: boolean;
  canRedo: boolean;
  onSelectIds: (ids: string[]) => void;
  onUpdateItems: (updater: (prev: StageItem[]) => StageItem[], commitHistory?: boolean) => void;
  onDropNewEquipment: (type: EquipmentShape, xM: number, yM: number) => void;
  onUpdateStageConfig: (patch: Partial<StageConfig>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onCommitDragHistory: () => void;
  onOpenTemplates: () => void;
}

type InteractionMode =
  | { kind: 'none' }
  | {
      kind: 'drag';
      startMouseM: { x: number; y: number };
      initialPositions: Record<string, { xM: number; yM: number }>;
      moved: boolean;
    }
  | {
      kind: 'rotate';
      itemId: string;
      centerM: { x: number; y: number };
      initialRotation: number;
    }
  | {
      kind: 'resize';
      itemId: string;
      corner: 'nw' | 'ne' | 'sw' | 'se';
      initialItem: StageItem;
    }
  | {
      kind: 'marquee';
      startM: { x: number; y: number };
      currentM: { x: number; y: number };
    };

export const StageCanvas: React.FC<StageCanvasProps> = ({
  svgRef,
  stageConfig,
  items,
  selectedIds,
  canUndo,
  canRedo,
  onSelectIds,
  onUpdateItems,
  onDropNewEquipment,
  onUpdateStageConfig,
  onUndo,
  onRedo,
  onDuplicateSelected,
  onDeleteSelected,
  onCommitDragHistory,
  onOpenTemplates,
}) => {
  const [zoom, setZoom] = useState(1);
  const [guides, setGuides] = useState<AlignmentGuide[]>([]);
  const [interaction, setInteraction] = useState<InteractionMode>({ kind: 'none' });
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const stageW = stageConfig.widthM * PPM;
  const stageD = stageConfig.depthM * PPM;
  const totalW = stageW + PAD_X * 2;
  const totalH = stageD + PAD_TOP + PAD_BOTTOM;

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.zIndex - b.zIndex),
    [items]
  );

  const clientToStageMeters = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const svgPt = pt.matrixTransform(ctm.inverse());
      return {
        x: (svgPt.x - PAD_X) / PPM,
        y: (svgPt.y - PAD_TOP) / PPM,
      };
    },
    [svgRef]
  );

  const snapValue = useCallback(
    (val: number, step: number) => {
      if (!stageConfig.showGrid || step <= 0) return Math.round(val * 100) / 100;
      return Math.round(val / step) * step;
    },
    [stageConfig.showGrid]
  );

  const handlePointerDownItem = (e: React.PointerEvent, item: StageItem) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    const isSelected = selectedIds.includes(item.id);
    let nextSelected = selectedIds;
    if (e.shiftKey) {
      nextSelected = isSelected
        ? selectedIds.filter((id) => id !== item.id)
        : [...selectedIds, item.id];
      onSelectIds(nextSelected);
    } else if (!isSelected) {
      nextSelected = [item.id];
      onSelectIds(nextSelected);
    }

    if (item.locked) return;

    const mouseM = clientToStageMeters(e.clientX, e.clientY);
    const initialPositions: Record<string, { xM: number; yM: number }> = {};
    items.forEach((it) => {
      if (nextSelected.includes(it.id) && !it.locked) {
        initialPositions[it.id] = { xM: it.xM, yM: it.yM };
      }
    });

    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setInteraction({
      kind: 'drag',
      startMouseM: mouseM,
      initialPositions,
      moved: false,
    });
  };

  const handlePointerDownRotate = (e: React.PointerEvent, item: StageItem) => {
    e.stopPropagation();
    if (item.locked) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setInteraction({
      kind: 'rotate',
      itemId: item.id,
      centerM: { x: item.xM, y: item.yM },
      initialRotation: item.rotation,
    });
  };

  const handlePointerDownResize = (
    e: React.PointerEvent,
    item: StageItem,
    corner: 'nw' | 'ne' | 'sw' | 'se'
  ) => {
    e.stopPropagation();
    if (item.locked) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setInteraction({
      kind: 'resize',
      itemId: item.id,
      corner,
      initialItem: { ...item },
    });
  };

  const handlePointerDownCanvas = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const mouseM = clientToStageMeters(e.clientX, e.clientY);
    if (!e.shiftKey) {
      onSelectIds([]);
    }
    setInteraction({
      kind: 'marquee',
      startM: mouseM,
      currentM: mouseM,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (interaction.kind === 'none') return;
    const mouseM = clientToStageMeters(e.clientX, e.clientY);

    if (interaction.kind === 'drag') {
      const dx = mouseM.x - interaction.startMouseM.x;
      const dy = mouseM.y - interaction.startMouseM.y;
      if (Math.abs(dx) < 0.02 && Math.abs(dy) < 0.02 && !interaction.moved) return;

      const activeGuides: AlignmentGuide[] = [];
      const movingIds = Object.keys(interaction.initialPositions);
      const primaryId = movingIds[0];
      let snappedDx = dx;
      let snappedDy = dy;

      if (primaryId) {
        const init = interaction.initialPositions[primaryId];
        let targetX = init.xM + dx;
        let targetY = init.yM + dy;

        if (stageConfig.showGrid && !e.altKey) {
          targetX = snapValue(targetX, stageConfig.gridStepM * 0.5);
          targetY = snapValue(targetY, stageConfig.gridStepM * 0.5);
        }

        // Smart alignment guides against stage center & stationary items
        const snapThreshold = 0.14;
        const centerLineX = stageConfig.widthM / 2;
        if (Math.abs(targetX - centerLineX) < snapThreshold) {
          targetX = centerLineX;
          activeGuides.push({ axis: 'x', posM: centerLineX });
        } else {
          for (const other of items) {
            if (movingIds.includes(other.id)) continue;
            if (Math.abs(targetX - other.xM) < snapThreshold) {
              targetX = other.xM;
              activeGuides.push({ axis: 'x', posM: other.xM });
              break;
            }
          }
        }

        for (const other of items) {
          if (movingIds.includes(other.id)) continue;
          if (Math.abs(targetY - other.yM) < snapThreshold) {
            targetY = other.yM;
            activeGuides.push({ axis: 'y', posM: other.yM });
            break;
          }
        }

        snappedDx = targetX - init.xM;
        snappedDy = targetY - init.yM;
      }

      setGuides(activeGuides);
      if (!interaction.moved) {
        setInteraction({ ...interaction, moved: true });
      }

      onUpdateItems(
        (prev) =>
          prev.map((it) => {
            const init = interaction.initialPositions[it.id];
            if (!init) return it;
            return {
              ...it,
              xM: Math.max(0.2, Math.min(stageConfig.widthM - 0.2, Number((init.xM + snappedDx).toFixed(2)))),
              yM: Math.max(0.2, Math.min(stageConfig.depthM - 0.2, Number((init.yM + snappedDy).toFixed(2)))),
            };
          }),
        false
      );
    } else if (interaction.kind === 'rotate') {
      const angleRad = Math.atan2(
        mouseM.y - interaction.centerM.y,
        mouseM.x - interaction.centerM.x
      );
      let deg = (angleRad * 180) / Math.PI + 90;
      const step = e.shiftKey ? 15 : 5;
      deg = Math.round(deg / step) * step;
      while (deg > 180) deg -= 360;
      while (deg <= -180) deg += 360;

      onUpdateItems(
        (prev) =>
          prev.map((it) => (it.id === interaction.itemId ? { ...it, rotation: deg } : it)),
        false
      );
    } else if (interaction.kind === 'resize') {
      const { initialItem, corner } = interaction;
      const minSize = 0.6;
      const halfW = initialItem.widthM / 2;
      const halfD = initialItem.depthM / 2;
      let left = initialItem.xM - halfW;
      let right = initialItem.xM + halfW;
      let top = initialItem.yM - halfD;
      let bottom = initialItem.yM + halfD;

      const snappedX = snapValue(mouseM.x, 0.2);
      const snappedY = snapValue(mouseM.y, 0.2);

      if (corner === 'nw' || corner === 'sw') left = Math.min(right - minSize, snappedX);
      if (corner === 'ne' || corner === 'se') right = Math.max(left + minSize, snappedX);
      if (corner === 'nw' || corner === 'ne') top = Math.min(bottom - minSize, snappedY);
      if (corner === 'sw' || corner === 'se') bottom = Math.max(top + minSize, snappedY);

      const newW = Number((right - left).toFixed(2));
      const newD = Number((bottom - top).toFixed(2));
      const newX = Number(((left + right) / 2).toFixed(2));
      const newY = Number(((top + bottom) / 2).toFixed(2));

      onUpdateItems(
        (prev) =>
          prev.map((it) =>
            it.id === interaction.itemId
              ? { ...it, widthM: newW, depthM: newD, xM: newX, yM: newY }
              : it
          ),
        false
      );
    } else if (interaction.kind === 'marquee') {
      setInteraction({ ...interaction, currentM: mouseM });
    }
  };

  const handlePointerUp = () => {
    if (interaction.kind === 'drag' && interaction.moved) {
      onCommitDragHistory();
    } else if (interaction.kind === 'rotate' || interaction.kind === 'resize') {
      onCommitDragHistory();
    } else if (interaction.kind === 'marquee') {
      const minX = Math.min(interaction.startM.x, interaction.currentM.x);
      const maxX = Math.max(interaction.startM.x, interaction.currentM.x);
      const minY = Math.min(interaction.startM.y, interaction.currentM.y);
      const maxY = Math.max(interaction.startM.y, interaction.currentM.y);
      if (maxX - minX > 0.15 || maxY - minY > 0.15) {
        const inside = items
          .filter((it) => it.xM >= minX && it.xM <= maxX && it.yM >= minY && it.yM <= maxY)
          .map((it) => it.id);
        onSelectIds(inside);
      }
    }
    setGuides([]);
    setInteraction({ kind: 'none' });
  };

  // Surface colors
  const surface = stageConfig.stageSurface;
  const stageBg =
    surface === 'dark'
      ? '#0F172A'
      : surface === 'blueprint'
        ? '#0B2545'
        : '#FFFFFF';
  const stageOuterBg =
    surface === 'dark'
      ? '#090D16'
      : surface === 'blueprint'
        ? '#071B34'
        : '#F8FAFC';
  const stageBorder =
    surface === 'dark'
      ? '#334155'
      : surface === 'blueprint'
        ? '#3B82F6'
        : '#CBD5E1';
  const gridLineColor =
    surface === 'dark'
      ? 'rgba(148, 163, 184, 0.14)'
      : surface === 'blueprint'
        ? 'rgba(147, 197, 253, 0.18)'
        : 'rgba(15, 23, 42, 0.08)';
  const labelTextColor =
    surface === 'dark' || surface === 'blueprint' ? '#E2E8F0' : '#0F172A';
  const mutedTextColor =
    surface === 'dark'
      ? '#94A3B8'
      : surface === 'blueprint'
        ? '#93C5FD'
        : '#64748B';

  const unitFactor = stageConfig.unit === 'ft' ? 3.28084 : 1;
  const formatMeasure = (m: number) => `${(m * unitFactor).toFixed(1).replace(/\.0$/, '')}${stageConfig.unit}`;

  // Grid ticks
  const gridLinesX = useMemo(() => {
    const step = stageConfig.gridStepM || 0.5;
    const lines: number[] = [];
    for (let x = step; x < stageConfig.widthM; x += step) {
      lines.push(Number(x.toFixed(2)));
    }
    return lines;
  }, [stageConfig.widthM, stageConfig.gridStepM]);

  const gridLinesY = useMemo(() => {
    const step = stageConfig.gridStepM || 0.5;
    const lines: number[] = [];
    for (let y = step; y < stageConfig.depthM; y += step) {
      lines.push(Number(y.toFixed(2)));
    }
    return lines;
  }, [stageConfig.depthM, stageConfig.gridStepM]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
      {/* Compact Drafting Toolbar */}
      <div className="no-print h-11 px-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1.5" />

          <button
            type="button"
            onClick={onDuplicateSelected}
            disabled={selectedIds.length === 0}
            title="Duplicate selected (Ctrl+D)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={selectedIds.length === 0}
            title="Delete selected (Backspace)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-35 disabled:pointer-events-none whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>

        {/* Layer & Surface Switches */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateStageConfig({ showGrid: !stageConfig.showGrid })}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              stageConfig.showGrid
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateStageConfig({ showLabels: !stageConfig.showLabels })}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              stageConfig.showLabels
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Labels</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateStageConfig({ showCables: !stageConfig.showCables })}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              stageConfig.showCables
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Cable className="w-3.5 h-3.5" />
            <span>Snakes</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Surface Selector */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
            {(['dark', 'light', 'blueprint'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onUpdateStageConfig({ stageSurface: mode })}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  stageConfig.stageSurface === mode
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
              title="Zoom out"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              title="Reset zoom"
              className="px-1.5 py-1 text-[11px] font-mono-tabular text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, Number((z + 0.15).toFixed(2))))}
              title="Zoom in"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Stage Drafting Viewport */}
      <div
        ref={containerRef}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          if (!isDragOver) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const type = e.dataTransfer.getData('application/stageplot-type') as EquipmentShape;
          if (!type) return;
          const m = clientToStageMeters(e.clientX, e.clientY);
          const xM = Math.max(0.4, Math.min(stageConfig.widthM - 0.4, snapValue(m.x, 0.25)));
          const yM = Math.max(0.4, Math.min(stageConfig.depthM - 0.4, snapValue(m.y, 0.25)));
          onDropNewEquipment(type, xM, yM);
        }}
        className={`flex-1 overflow-auto flex items-center justify-center p-6 select-none relative ${
          isDragOver ? 'ring-2 ring-inset ring-blue-500/70' : ''
        }`}
      >
        <div
          style={{
            width: totalW * zoom,
            height: totalH * zoom,
          }}
          className="relative shadow-lg rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 transition-[width,height] duration-75"
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${totalW} ${totalH}`}
            onPointerDown={handlePointerDownCanvas}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="block touch-none"
          >
            {/* Outer drafting matte */}
            <rect x={0} y={0} width={totalW} height={totalH} fill={stageOuterBg} />

            {/* Upstage / Downstage / SL / SR architectural labels */}
            <text
              x={PAD_X + stageW / 2}
              y={26}
              textAnchor="middle"
              fill={mutedTextColor}
              fontSize={11}
              fontWeight="600"
              letterSpacing="0.14em"
              fontFamily="JetBrains Mono, monospace"
            >
              UPSTAGE (BACK)
            </text>

            <text
              x={22}
              y={PAD_TOP + stageD / 2}
              textAnchor="middle"
              fill={mutedTextColor}
              fontSize={11}
              fontWeight="600"
              letterSpacing="0.12em"
              fontFamily="JetBrains Mono, monospace"
              transform={`rotate(-90, 22, ${PAD_TOP + stageD / 2})`}
            >
              STAGE RIGHT
            </text>

            <text
              x={totalW - 22}
              y={PAD_TOP + stageD / 2}
              textAnchor="middle"
              fill={mutedTextColor}
              fontSize={11}
              fontWeight="600"
              letterSpacing="0.12em"
              fontFamily="JetBrains Mono, monospace"
              transform={`rotate(90, ${totalW - 22}, ${PAD_TOP + stageD / 2})`}
            >
              STAGE LEFT
            </text>

            {/* Optional Stage Apron */}
            {stageConfig.hasApron && (
              <path
                d={`M ${PAD_X + stageW * 0.12} ${PAD_TOP + stageD}
                    Q ${PAD_X + stageW / 2} ${PAD_TOP + stageD + 44} ${PAD_X + stageW * 0.88} ${PAD_TOP + stageD} Z`}
                fill={stageBg}
                stroke={stageBorder}
                strokeWidth={1.5}
              />
            )}

            {/* Main Stage Floor */}
            <rect
              x={PAD_X}
              y={PAD_TOP}
              width={stageW}
              height={stageD}
              fill={stageBg}
              stroke={stageBorder}
              strokeWidth={2}
            />

            {/* Grid Lines */}
            {stageConfig.showGrid && (
              <g>
                {gridLinesX.map((xm) => (
                  <line
                    key={`gx-${xm}`}
                    x1={PAD_X + xm * PPM}
                    y1={PAD_TOP}
                    x2={PAD_X + xm * PPM}
                    y2={PAD_TOP + stageD}
                    stroke={gridLineColor}
                    strokeWidth={Math.abs(xm - stageConfig.widthM / 2) < 0.01 ? 1.5 : 1}
                    strokeDasharray={Math.abs(xm - stageConfig.widthM / 2) < 0.01 ? '5 4' : undefined}
                  />
                ))}
                {gridLinesY.map((ym) => (
                  <line
                    key={`gy-${ym}`}
                    x1={PAD_X}
                    y1={PAD_TOP + ym * PPM}
                    x2={PAD_X + stageW}
                    y2={PAD_TOP + ym * PPM}
                    stroke={gridLineColor}
                    strokeWidth={1}
                  />
                ))}
              </g>
            )}

            {/* Dimension Ruler Ticks */}
            {stageConfig.showDimensions && (
              <g fontFamily="JetBrains Mono, monospace" fontSize={10} fill={mutedTextColor}>
                <text x={PAD_X} y={PAD_TOP - 8} textAnchor="start">
                  0{stageConfig.unit}
                </text>
                <text x={PAD_X + stageW / 2} y={PAD_TOP - 8} textAnchor="middle">
                  CL ({formatMeasure(stageConfig.widthM / 2)})
                </text>
                <text x={PAD_X + stageW} y={PAD_TOP - 8} textAnchor="end">
                  {formatMeasure(stageConfig.widthM)}
                </text>
                <text x={PAD_X - 8} y={PAD_TOP + 10} textAnchor="end">
                  0
                </text>
                <text x={PAD_X - 8} y={PAD_TOP + stageD} textAnchor="end">
                  {formatMeasure(stageConfig.depthM)}
                </text>
              </g>
            )}

            {/* Downstage / Audience Bar */}
            <g>
              <line
                x1={PAD_X}
                y1={PAD_TOP + stageD + (stageConfig.hasApron ? 38 : 18)}
                x2={PAD_X + stageW}
                y2={PAD_TOP + stageD + (stageConfig.hasApron ? 38 : 18)}
                stroke={stageBorder}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={PAD_X + stageW / 2}
                y={PAD_TOP + stageD + (stageConfig.hasApron ? 58 : 40)}
                textAnchor="middle"
                fill={mutedTextColor}
                fontSize={12}
                fontWeight="600"
                letterSpacing="0.18em"
                fontFamily="JetBrains Mono, monospace"
              >
                DOWNSTAGE · AUDIENCE
              </text>
            </g>

            {/* Signal Cable / Snake Routing Layer */}
            {stageConfig.showCables && (
              <g>
                {items.map((item) => {
                  if (!item.connectedToId) return null;
                  const target = items.find((t) => t.id === item.connectedToId);
                  if (!target) return null;
                  const x1 = PAD_X + item.xM * PPM;
                  const y1 = PAD_TOP + item.yM * PPM;
                  const x2 = PAD_X + target.xM * PPM;
                  const y2 = PAD_TOP + target.yM * PPM;
                  const ctrlX = (x1 + x2) / 2;
                  const ctrlY = Math.min(y1, y2) - 24;
                  return (
                    <path
                      key={`cable-${item.id}`}
                      d={`M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`}
                      fill="none"
                      stroke="#38BDF8"
                      strokeOpacity={0.65}
                      strokeWidth={1.75}
                      strokeDasharray="4 3"
                    />
                  );
                })}
              </g>
            )}

            {/* Stage Equipment Items */}
            {sortedItems.map((item) => {
              const cx = PAD_X + item.xM * PPM;
              const cy = PAD_TOP + item.yM * PPM;
              const w = item.widthM * PPM;
              const h = item.depthM * PPM;
              const isSelected = selectedIds.includes(item.id);
              const def = EQUIPMENT_CATALOG.find((d) => d.type === item.type);

              return (
                <g
                  key={item.id}
                  transform={`translate(${cx}, ${cy})`}
                  onPointerDown={(e) => handlePointerDownItem(e, item)}
                  className={item.locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
                >
                  {/* Rotated Equipment Body */}
                  <g transform={`rotate(${item.rotation}) translate(${-w / 2}, ${-h / 2})`}>
                    <EquipmentGraphic
                      type={item.type}
                      width={w}
                      height={h}
                      surface={surface}
                      customColor={item.color}
                    />

                    {/* Selection Bounding Box & Interactive Handles */}
                    {isSelected && (
                      <g data-no-export="true">
                        <rect
                          x={-4}
                          y={-4}
                          width={w + 8}
                          height={h + 8}
                          rx={4}
                          fill="none"
                          stroke="#2563EB"
                          strokeWidth={1.75}
                          strokeDasharray="4 2"
                        />

                        {/* Rotation Handle */}
                        {!item.locked && def?.rotatable !== false && (
                          <g
                            onPointerDown={(e) => handlePointerDownRotate(e, item)}
                            className="cursor-pointer"
                          >
                            <line
                              x1={w / 2}
                              y1={-4}
                              x2={w / 2}
                              y2={-22}
                              stroke="#2563EB"
                              strokeWidth={1.5}
                            />
                            <circle
                              cx={w / 2}
                              cy={-24}
                              r={5.5}
                              fill="#FFFFFF"
                              stroke="#2563EB"
                              strokeWidth={2}
                            />
                          </g>
                        )}

                        {/* Resize Corner Handles for Risers & Zones */}
                        {!item.locked && def?.resizable && (
                          <>
                            {(
                              [
                                { c: 'nw', x: -4, y: -4, cur: 'nwse-resize' },
                                { c: 'ne', x: w + 4, y: -4, cur: 'nesw-resize' },
                                { c: 'sw', x: -4, y: h + 4, cur: 'nesw-resize' },
                                { c: 'se', x: w + 4, y: h + 4, cur: 'nwse-resize' },
                              ] as const
                            ).map((handle) => (
                              <rect
                                key={handle.c}
                                x={handle.x - 4}
                                y={handle.y - 4}
                                width={8}
                                height={8}
                                rx={1.5}
                                fill="#FFFFFF"
                                stroke="#2563EB"
                                strokeWidth={1.75}
                                style={{ cursor: handle.cur }}
                                onPointerDown={(e) => handlePointerDownResize(e, item, handle.c)}
                              />
                            ))}
                          </>
                        )}
                      </g>
                    )}
                  </g>

                  {/* Upright Labels & Channel / Monitor Badges (kept unrotated for legibility) */}
                  {stageConfig.showLabels && (
                    <g pointerEvents="none">
                      <text
                        x={0}
                        y={h / 2 + 14}
                        textAnchor="middle"
                        fill={labelTextColor}
                        fontSize={11}
                        fontWeight="600"
                        fontFamily="Plus Jakarta Sans, sans-serif"
                      >
                        {item.label}
                      </text>
                      {(item.performer || item.monitorMixId) && (
                        <text
                          x={0}
                          y={h / 2 + 27}
                          textAnchor="middle"
                          fill={mutedTextColor}
                          fontSize={9.5}
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {[item.performer, item.monitorMixId].filter(Boolean).join(' · ')}
                        </text>
                      )}
                    </g>
                  )}

                  {/* Channel Badge (Corner callout) */}
                  {stageConfig.showChannels && item.channelLabel && (
                    <g transform={`translate(${w / 2 - 4}, ${-h / 2 + 4})`} pointerEvents="none">
                      <rect
                        x={-14}
                        y={-9}
                        width={Math.max(22, item.channelLabel.length * 7 + 12)}
                        height={17}
                        rx={3}
                        fill="#2563EB"
                      />
                      <text
                        x={-14 + Math.max(22, item.channelLabel.length * 7 + 12) / 2}
                        y={3}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize={9.5}
                        fontWeight="600"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {`CH ${item.channelLabel}`}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Smart Alignment Guides */}
            {guides.map((g, i) =>
              g.axis === 'x' ? (
                <line
                  key={`guide-${i}`}
                  data-no-export="true"
                  x1={PAD_X + g.posM * PPM}
                  y1={PAD_TOP}
                  x2={PAD_X + g.posM * PPM}
                  y2={PAD_TOP + stageD}
                  stroke="#38BDF8"
                  strokeWidth={1.25}
                  strokeDasharray="4 4"
                />
              ) : (
                <line
                  key={`guide-${i}`}
                  data-no-export="true"
                  x1={PAD_X}
                  y1={PAD_TOP + g.posM * PPM}
                  x2={PAD_X + stageW}
                  y2={PAD_TOP + g.posM * PPM}
                  stroke="#38BDF8"
                  strokeWidth={1.25}
                  strokeDasharray="4 4"
                />
              )
            )}

            {/* Marquee Selection Box */}
            {interaction.kind === 'marquee' && (
              <rect
                data-no-export="true"
                x={PAD_X + Math.min(interaction.startM.x, interaction.currentM.x) * PPM}
                y={PAD_TOP + Math.min(interaction.startM.y, interaction.currentM.y) * PPM}
                width={Math.abs(interaction.currentM.x - interaction.startM.x) * PPM}
                height={Math.abs(interaction.currentM.y - interaction.startM.y) * PPM}
                fill="rgba(37, 99, 235, 0.14)"
                stroke="#2563EB"
                strokeWidth={1.25}
                strokeDasharray="4 2"
              />
            )}
          </svg>

          {/* Empty Canvas Onboarding Overlay */}
          {items.length === 0 && (
            <div className="no-print absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto max-w-sm rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 p-5 text-center shadow-sm">
                <Layers className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Empty Stage Canvas
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Drag instruments, mics, and risers from the Equipment Library on the left, or start from an ensemble template.
                </p>
                <div className="mt-3.5 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenTemplates}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
                  >
                    Choose Ensemble Template
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subtle Bottom Helper Strip (real functional shortcuts, zero fake telemetry) */}
      <div className="no-print h-8 px-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
        <div className="flex items-center gap-3 font-mono-tabular">
          <span>
            {formatMeasure(stageConfig.widthM)} × {formatMeasure(stageConfig.depthM)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{items.length} stage items</span>
          {selectedIds.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {selectedIds.length} selected
              </span>
            </>
          )}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <span>Drag to move</span>
          <span aria-hidden="true">·</span>
          <span>Arrow keys to nudge</span>
          <span aria-hidden="true">·</span>
          <span>Shift+Click multi-select</span>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset View</span>
          </button>
        </div>
      </div>
    </div>
  );
};
