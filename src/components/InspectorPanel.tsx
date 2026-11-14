import React from 'react';
import {
  Lock,
  Unlock,
  ArrowUpToLine,
  ArrowDownToLine,
  Copy,
  Trash2,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  ListPlus,
} from 'lucide-react';
import {
  MonitorMix,
  StageConfig,
  StageItem,
  StageProject,
} from '../types/stage';
import { EQUIPMENT_CATALOG } from '../data/equipmentCatalog';

interface InspectorPanelProps {
  project: StageProject;
  selectedIds: string[];
  onUpdateProjectMeta: (patch: Partial<StageProject>) => void;
  onUpdateStageConfig: (patch: Partial<StageConfig>) => void;
  onUpdateItem: (id: string, patch: Partial<StageItem>) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onAlignSelected: (mode: 'align-x' | 'align-y' | 'distribute-x') => void;
  onSendItemToPatch: (item: StageItem) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  project,
  selectedIds,
  onUpdateProjectMeta,
  onUpdateStageConfig,
  onUpdateItem,
  onDuplicateSelected,
  onDeleteSelected,
  onAlignSelected,
  onSendItemToPatch,
}) => {
  const selectedItems = project.items.filter((it) => selectedIds.includes(it.id));
  const singleItem = selectedItems.length === 1 ? selectedItems[0] : null;
  const stageBoxes = project.items.filter(
    (it) => it.type === 'stage_box' || it.type === 'x32_snake' || it.type === 'di_box'
  );

  // Multi-selection view
  if (selectedItems.length > 1) {
    return (
      <aside className="no-print w-72 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 overflow-y-auto space-y-5">
        <div>
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Multiple Selection
          </h2>
          <p className="mt-1 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            {selectedItems.length} items selected
          </p>
        </div>

        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Alignment & Spacing
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={() => onAlignSelected('align-x')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
            >
              <AlignHorizontalJustifyCenter className="w-3.5 h-3.5 text-slate-500" />
              <span>Align Centers Vertically (Same X)</span>
            </button>
            <button
              type="button"
              onClick={() => onAlignSelected('align-y')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
            >
              <AlignVerticalJustifyCenter className="w-3.5 h-3.5 text-slate-500" />
              <span>Align Row Horizontally (Same Y)</span>
            </button>
            {selectedItems.length >= 3 && (
              <button
                type="button"
                onClick={() => onAlignSelected('distribute-x')}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <span>Distribute Evenly Left-to-Right</span>
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex gap-2">
          <button
            type="button"
            onClick={onDuplicateSelected}
            className="flex-1 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            onClick={onDeleteSelected}
            className="flex-1 py-2 px-3 rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-950 text-xs font-medium text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </aside>
    );
  }

  // Single selected item inspector
  if (singleItem) {
    const def = EQUIPMENT_CATALOG.find((d) => d.type === singleItem.type);
    const linkedChannelsCount = project.inputList.filter(
      (ch) => ch.stageItemId === singleItem.id
    ).length;

    return (
      <aside className="no-print w-72 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 overflow-y-auto space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {def?.name || 'Stage Item'}
            </p>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {singleItem.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onUpdateItem(singleItem.id, { locked: !singleItem.locked })}
            title={singleItem.locked ? 'Unlock item' : 'Lock item'}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              singleItem.locked
                ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {singleItem.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Identity */}
        <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Display Label
            </label>
            <input
              type="text"
              value={singleItem.label}
              onChange={(e) => onUpdateItem(singleItem.id, { label: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Performer / Musician
            </label>
            <input
              type="text"
              value={singleItem.performer || ''}
              placeholder="e.g. Sarah / Lead Vox"
              onChange={(e) => onUpdateItem(singleItem.id, { performer: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Audio & Routing */}
        <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Channel Badge
              </label>
              <input
                type="text"
                value={singleItem.channelLabel || ''}
                placeholder="e.g. 1-4"
                onChange={(e) => onUpdateItem(singleItem.id, { channelLabel: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Monitor Mix
              </label>
              <select
                value={singleItem.monitorMixId || ''}
                onChange={(e) => onUpdateItem(singleItem.id, { monitorMixId: e.target.value })}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">None</option>
                {project.monitorMixes.map((mx: MonitorMix) => (
                  <option key={mx.id} value={mx.name}>
                    {mx.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {stageBoxes.length > 0 && singleItem.type !== 'stage_box' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Snake / Stage Box Route
              </label>
              <select
                value={singleItem.connectedToId || ''}
                onChange={(e) => onUpdateItem(singleItem.id, { connectedToId: e.target.value || undefined })}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Not routed</option>
                {stageBoxes.map((sb) => (
                  <option key={sb.id} value={sb.id}>
                    {sb.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {def?.suggestedChannels && def.suggestedChannels.length > 0 && (
            <button
              type="button"
              onClick={() => onSendItemToPatch(singleItem)}
              className="w-full py-2 px-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>
                {linkedChannelsCount > 0
                  ? `In Patch List (${linkedChannelsCount} ch) · Add More`
                  : `Add ${def.suggestedChannels.length} Ch to Patch List`}
              </span>
            </button>
          )}
        </div>

        {/* Geometry & Rotation */}
        <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Width (m)
              </label>
              <input
                type="number"
                step={0.1}
                min={0.3}
                max={12}
                value={singleItem.widthM}
                onChange={(e) =>
                  onUpdateItem(singleItem.id, {
                    widthM: Math.max(0.3, Number(e.target.value) || 0.5),
                  })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Depth (m)
              </label>
              <input
                type="number"
                step={0.1}
                min={0.3}
                max={10}
                value={singleItem.depthM}
                onChange={(e) =>
                  onUpdateItem(singleItem.id, {
                    depthM: Math.max(0.3, Number(e.target.value) || 0.5),
                  })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Rotation
              </label>
              <span className="font-mono-tabular text-[11px] text-slate-500">
                {singleItem.rotation}°
              </span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              step={5}
              value={singleItem.rotation}
              onChange={(e) =>
                onUpdateItem(singleItem.id, { rotation: Number(e.target.value) })
              }
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="grid grid-cols-4 gap-1 mt-1.5">
              {[-90, 0, 90, 180].map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => onUpdateItem(singleItem.id, { rotation: deg })}
                  className={`py-1 text-[10px] font-mono-tabular rounded border cursor-pointer ${
                    singleItem.rotation === deg
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() =>
                onUpdateItem(singleItem.id, { zIndex: Math.max(1, singleItem.zIndex - 1) })
              }
              className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowDownToLine className="w-3 h-3" />
              <span>Send Back</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateItem(singleItem.id, { zIndex: singleItem.zIndex + 1 })}
              className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowUpToLine className="w-3 h-3" />
              <span>Bring Front</span>
            </button>
          </div>
        </div>

        {/* Item Notes */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
            Tech / Placement Notes
          </label>
          <textarea
            rows={2}
            value={singleItem.notes || ''}
            onChange={(e) => onUpdateItem(singleItem.id, { notes: e.target.value })}
            placeholder="e.g. Tall boom stand, angle toward center..."
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
          />
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex gap-2">
          <button
            type="button"
            onClick={onDuplicateSelected}
            className="flex-1 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            onClick={onDeleteSelected}
            className="flex-1 py-2 px-3 rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-950 text-xs font-medium text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </aside>
    );
  }

  // Default: Stage & Event Properties
  return (
    <aside className="no-print w-72 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 overflow-y-auto space-y-4">
      <div>
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Plot &amp; Stage Properties
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
          Select an item on stage to edit its channel, rotation, or mix.
        </p>
      </div>

      <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
            Ensemble / Artist
          </label>
          <input
            type="text"
            value={project.ensembleOrArtist}
            onChange={(e) => onUpdateProjectMeta({ ensembleOrArtist: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
            Plot Title
          </label>
          <input
            type="text"
            value={project.title}
            onChange={(e) => onUpdateProjectMeta({ title: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Venue / Event
            </label>
            <input
              type="text"
              value={project.eventOrVenue}
              onChange={(e) => onUpdateProjectMeta({ eventOrVenue: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Date
            </label>
            <input
              type="date"
              value={project.eventDate}
              onChange={(e) => onUpdateProjectMeta({ eventDate: e.target.value })}
              className="w-full px-2 py-1.5 text-xs font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Stage Dimensions */}
      <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Stage Dimensions
          </span>
          <div className="flex items-center p-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
            {(['m', 'ft'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => onUpdateStageConfig({ unit: u })}
                className={`px-2 py-0.5 text-[11px] font-mono-tabular rounded cursor-pointer ${
                  project.stageConfig.unit === u
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Width (m)
            </label>
            <input
              type="number"
              min={4}
              max={24}
              step={0.5}
              value={project.stageConfig.widthM}
              onChange={(e) =>
                onUpdateStageConfig({
                  widthM: Math.max(4, Math.min(24, Number(e.target.value) || 10)),
                })
              }
              className="w-full px-2.5 py-1.5 text-xs font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Depth (m)
            </label>
            <input
              type="number"
              min={3}
              max={16}
              step={0.5}
              value={project.stageConfig.depthM}
              onChange={(e) =>
                onUpdateStageConfig({
                  depthM: Math.max(3, Math.min(16, Number(e.target.value) || 7)),
                })
              }
              className="w-full px-2.5 py-1.5 text-xs font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
          <span>Show Downstage Apron</span>
          <input
            type="checkbox"
            checked={project.stageConfig.hasApron}
            onChange={(e) => onUpdateStageConfig({ hasApron: e.target.checked })}
            className="rounded accent-blue-600"
          />
        </label>

        <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
          <span>Show Channel Badges</span>
          <input
            type="checkbox"
            checked={project.stageConfig.showChannels}
            onChange={(e) => onUpdateStageConfig({ showChannels: e.target.checked })}
            className="rounded accent-blue-600"
          />
        </label>
      </div>

      {/* Notes */}
      <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
            Stage &amp; Backline Notes
          </label>
          <textarea
            rows={3}
            value={project.stageNotes}
            onChange={(e) => onUpdateProjectMeta({ stageNotes: e.target.value })}
            placeholder="Riser height, piano lid position, changeover details..."
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
            Power Requirements
          </label>
          <textarea
            rows={2}
            value={project.powerNotes}
            onChange={(e) => onUpdateProjectMeta({ powerNotes: e.target.value })}
            placeholder="Quad box locations, 240V / 120V drops..."
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none"
          />
        </div>
      </div>
    </aside>
  );
};
