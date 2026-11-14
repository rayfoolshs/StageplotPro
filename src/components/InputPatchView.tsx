import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  Search,
} from 'lucide-react';
import { InputChannel, MonitorMix, StageProject } from '../types/stage';
import { EQUIPMENT_CATALOG, MIC_PRESETS, STAND_PRESETS } from '../data/equipmentCatalog';

interface InputPatchViewProps {
  project: StageProject;
  onUpdateInputList: (list: InputChannel[]) => void;
  onUpdateMonitorMixes: (mixes: MonitorMix[]) => void;
  onSyncFromStage: () => number;
  onLocateStageItem: (itemId: string) => void;
}

export const InputPatchView: React.FC<InputPatchViewProps> = ({
  project,
  onUpdateInputList,
  onUpdateMonitorMixes,
  onSyncFromStage,
  onLocateStageItem,
}) => {
  const [filter, setFilter] = useState('');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const renumber = (list: InputChannel[]) =>
    list.map((ch, idx) => ({ ...ch, channelNumber: idx + 1 }));

  const addChannel = () => {
    const nextNum = project.inputList.length + 1;
    const newCh: InputChannel = {
      id: `ch-${Date.now()}`,
      channelNumber: nextNum,
      source: `Input ${nextNum}`,
      micOrDi: 'Shure SM58',
      stand: 'Tall Boom',
      phantom48v: false,
      notes: '',
    };
    onUpdateInputList([...project.inputList, newCh]);
  };

  const updateChannel = (id: string, patch: Partial<InputChannel>) => {
    onUpdateInputList(
      project.inputList.map((ch) => (ch.id === id ? { ...ch, ...patch } : ch))
    );
  };

  const deleteChannel = (id: string) => {
    onUpdateInputList(renumber(project.inputList.filter((ch) => ch.id !== id)));
  };

  const moveChannel = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= project.inputList.length) return;
    const copy = [...project.inputList];
    const [removed] = copy.splice(index, 1);
    copy.splice(target, 0, removed);
    onUpdateInputList(renumber(copy));
  };

  const handleSync = () => {
    const addedCount = onSyncFromStage();
    setSyncMessage(
      addedCount > 0
        ? `Added ${addedCount} channel${addedCount > 1 ? 's' : ''} from stage items.`
        : 'All stage mics and instruments already have patch entries.'
    );
    setTimeout(() => setSyncMessage(null), 3500);
  };

  const exportCsv = () => {
    const headers = ['Channel', 'Source', 'Mic / DI', 'Stand', '48V Phantom', 'Stage Position', 'Notes'];
    const rows = project.inputList.map((ch) => {
      const linked = project.items.find((it) => it.id === ch.stageItemId);
      return [
        String(ch.channelNumber),
        ch.source,
        ch.micOrDi,
        ch.stand,
        ch.phantom48v ? 'Yes' : 'No',
        linked ? linked.label : '',
        ch.notes,
      ]
        .map((cell) => `"${(cell || '').replace(/"/g, '""')}"`)
        .join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = (project.ensembleOrArtist || 'input-patch')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    link.href = url;
    link.download = `${slug}-input-patch.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const addMonitorMix = () => {
    const nextNum = project.monitorMixes.length + 1;
    onUpdateMonitorMixes([
      ...project.monitorMixes,
      {
        id: `mx-${Date.now()}`,
        name: `Mix ${nextNum}`,
        type: 'Floor Wedge',
        performerOrPosition: '',
        requestedContents: '',
      },
    ]);
  };

  const updateMix = (id: string, patch: Partial<MonitorMix>) => {
    onUpdateMonitorMixes(
      project.monitorMixes.map((mx) => (mx.id === id ? { ...mx, ...patch } : mx))
    );
  };

  const deleteMix = (id: string) => {
    onUpdateMonitorMixes(project.monitorMixes.filter((mx) => mx.id !== id));
  };

  const filteredChannels = project.inputList.filter((ch) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      ch.source.toLowerCase().includes(q) ||
      ch.micOrDi.toLowerCase().includes(q) ||
      ch.notes.toLowerCase().includes(q) ||
      String(ch.channelNumber).includes(q)
    );
  });

  const phantomCount = project.inputList.filter((c) => c.phantom48v).length;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Summary */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {project.ensembleOrArtist} · {project.eventOrVenue}
            </p>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Input Patch List &amp; Monitor Mixes
            </h1>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
              <span>{project.inputList.length} channels</span>
              <span aria-hidden="true">·</span>
              <span>{phantomCount} requiring +48V</span>
              <span aria-hidden="true">·</span>
              <span>{project.monitorMixes.length} monitor mixes</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSync}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Sync From Stage</span>
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={project.inputList.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
            <button
              type="button"
              onClick={addChannel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Channel</span>
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className="px-4 py-2.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-xs font-medium text-blue-800 dark:text-blue-200">
            {syncMessage}
          </div>
        )}

        {/* Input Patch Table */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Channel Patch Sheet
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter channels or mics..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
            {project.inputList.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No input channels configured yet
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Sync channels automatically from the instruments placed on your stage plot, or add rows manually.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleSync}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Sync From Stage
                  </button>
                  <button
                    type="button"
                    onClick={addChannel}
                    className="px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                  >
                    Add First Channel
                  </button>
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[780px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40">
                    <th className="py-2.5 px-3 w-16">Ch</th>
                    <th className="py-2.5 px-3">Source / Instrument</th>
                    <th className="py-2.5 px-3">Mic / DI Selection</th>
                    <th className="py-2.5 px-3 w-40">Stand</th>
                    <th className="py-2.5 px-3 w-16 text-center">48V</th>
                    <th className="py-2.5 px-3 w-40">Stage Link</th>
                    <th className="py-2.5 px-3">Engineer Notes</th>
                    <th className="py-2.5 px-3 w-24 text-right">Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredChannels.map((ch) => {
                    const realIdx = project.inputList.findIndex((c) => c.id === ch.id);
                    const linkedItem = project.items.find((it) => it.id === ch.stageItemId);
                    return (
                      <tr
                        key={ch.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-1.5 px-3 font-mono-tabular font-semibold text-slate-900 dark:text-slate-100">
                          {String(ch.channelNumber).padStart(2, '0')}
                        </td>
                        <td className="py-1.5 px-3">
                          <input
                            type="text"
                            value={ch.source}
                            onChange={(e) => updateChannel(ch.id, { source: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-3">
                          <input
                            type="text"
                            list="mic-presets-list"
                            value={ch.micOrDi}
                            onChange={(e) => updateChannel(ch.id, { micOrDi: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-3">
                          <input
                            type="text"
                            list="stand-presets-list"
                            value={ch.stand}
                            onChange={(e) => updateChannel(ch.id, { stand: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={ch.phantom48v}
                            onChange={(e) => updateChannel(ch.id, { phantom48v: e.target.checked })}
                            aria-label={`48V phantom power for channel ${ch.channelNumber}`}
                            className="rounded accent-amber-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-1">
                            <select
                              value={ch.stageItemId || ''}
                              onChange={(e) =>
                                updateChannel(ch.id, {
                                  stageItemId: e.target.value || undefined,
                                })
                              }
                              className="w-full px-1.5 py-1 rounded border border-slate-200/70 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px]"
                            >
                              <option value="">Unlinked</option>
                              {project.items
                                .filter((it) => {
                                  const def = EQUIPMENT_CATALOG.find((d) => d.type === it.type);
                                  return !def?.isZone;
                                })
                                .map((it) => (
                                  <option key={it.id} value={it.id}>
                                    {it.label}
                                  </option>
                                ))}
                            </select>
                            {linkedItem && (
                              <button
                                type="button"
                                onClick={() => onLocateStageItem(linkedItem.id)}
                                title="View on stage plot"
                                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                              >
                                View
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-1.5 px-3">
                          <input
                            type="text"
                            value={ch.notes}
                            placeholder="HPF, gate, pan..."
                            onChange={(e) => updateChannel(ch.id, { notes: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 bg-transparent text-slate-600 dark:text-slate-300 focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-3 text-right">
                          <div className="inline-flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveChannel(realIdx, -1)}
                              disabled={realIdx === 0 || !!filter}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-25 cursor-pointer"
                              title="Move up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveChannel(realIdx, 1)}
                              disabled={realIdx === project.inputList.length - 1 || !!filter}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-25 cursor-pointer"
                              title="Move down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteChannel(ch.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                              title="Remove channel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <datalist id="mic-presets-list">
            {MIC_PRESETS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <datalist id="stand-presets-list">
            {STAND_PRESETS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </section>

        {/* Monitor Mixes Matrix */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Monitor Mixes &amp; Foldback Requests
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assign mixes directly to stage wedges or performers in the Stage Plot inspector.
              </p>
            </div>
            <button
              type="button"
              onClick={addMonitorMix}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Monitor Mix</span>
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
            {project.monitorMixes.length === 0 ? (
              <div className="py-8 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No monitor mixes defined. Click "Add Monitor Mix" to specify wedges or in-ear mixes.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40">
                    <th className="py-2.5 px-3 w-36">Mix Name</th>
                    <th className="py-2.5 px-3 w-36">Hardware Type</th>
                    <th className="py-2.5 px-3 w-52">Performer / Position</th>
                    <th className="py-2.5 px-3">Requested Mix Contents</th>
                    <th className="py-2.5 px-3 w-12 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {project.monitorMixes.map((mx) => (
                    <tr key={mx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={mx.name}
                          onChange={(e) => updateMix(mx.id, { name: e.target.value })}
                          className="w-full px-2 py-1 font-medium rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <select
                          value={mx.type}
                          onChange={(e) =>
                            updateMix(mx.id, { type: e.target.value as MonitorMix['type'] })
                          }
                          className="w-full px-2 py-1 rounded border border-slate-200/70 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs"
                        >
                          <option value="Floor Wedge">Floor Wedge</option>
                          <option value="Drum Fill">Drum Fill</option>
                          <option value="IEM Stereo">IEM Stereo</option>
                          <option value="IEM Mono">IEM Mono</option>
                          <option value="Side Fill">Side Fill</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={mx.performerOrPosition}
                          placeholder="e.g. Downstage Center"
                          onChange={(e) =>
                            updateMix(mx.id, { performerOrPosition: e.target.value })
                          }
                          className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={mx.requestedContents}
                          placeholder="e.g. Lead Vox (High), Keys, Light Kick"
                          onChange={(e) =>
                            updateMix(mx.id, { requestedContents: e.target.value })
                          }
                          className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => deleteMix(mx.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                          title="Delete monitor mix"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
