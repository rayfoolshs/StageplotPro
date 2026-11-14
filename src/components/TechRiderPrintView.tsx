import React from 'react';
import { Printer, Download } from 'lucide-react';
import { StageProject } from '../types/stage';
import { EquipmentGraphic } from './EquipmentSvg';

interface TechRiderPrintViewProps {
  project: StageProject;
  onUpdateProjectMeta: (patch: Partial<StageProject>) => void;
  onExportPng: () => void;
}

const PPM = 74;
const PAD_X = 56;
const PAD_TOP = 44;
const PAD_BOTTOM = 64;

export const TechRiderPrintView: React.FC<TechRiderPrintViewProps> = ({
  project,
  onUpdateProjectMeta,
  onExportPng,
}) => {
  const { stageConfig, items, inputList, monitorMixes } = project;
  const stageW = stageConfig.widthM * PPM;
  const stageD = stageConfig.depthM * PPM;
  const totalW = stageW + PAD_X * 2;
  const totalH = stageD + PAD_TOP + PAD_BOTTOM;

  const unitFactor = stageConfig.unit === 'ft' ? 3.28084 : 1;
  const formatDim = (m: number) => `${(m * unitFactor).toFixed(1).replace(/\.0$/, '')}${stageConfig.unit}`;

  const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-6 md:p-8 print:p-0 print:bg-white">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Action Bar (hidden on print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div>
            <h1 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Printable Technical Rider &amp; Stage Sheet
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              High-contrast ink-friendly layout formatted for A4 / US Letter printing or PDF export.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onExportPng}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Stage PNG</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Rider Document Sheet (Always crisp white paper for printing) */}
        <div className="bg-white text-slate-900 border border-slate-200 print:border-0 rounded-xl print:rounded-none p-8 print:p-0 space-y-6 shadow-xs print:shadow-none">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Technical Rider &amp; Stage Plot
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
                {project.ensembleOrArtist || 'Untitled Ensemble'}
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                {[project.title, project.eventOrVenue, project.eventDate]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-600 space-y-1 font-mono-tabular">
              <div>
                Stage: {formatDim(stageConfig.widthM)} × {formatDim(stageConfig.depthM)}
              </div>
              <div>
                {inputList.length} Inputs · {monitorMixes.length} Monitors
              </div>
              {(project.contactName || project.contactEmail) && (
                <div className="font-sans text-slate-500">
                  {[project.contactName, project.contactEmail].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          </div>

          {/* Vector Stage Plot Diagram (Ink-friendly light mode) */}
          <div className="print-avoid-break">
            <svg
              viewBox={`0 0 ${totalW} ${totalH}`}
              className="w-full h-auto border border-slate-200 rounded-lg bg-slate-50"
            >
              <rect x={0} y={0} width={totalW} height={totalH} fill="#F8FAFC" />

              <text
                x={PAD_X + stageW / 2}
                y={22}
                textAnchor="middle"
                fill="#64748B"
                fontSize={10}
                fontWeight="600"
                letterSpacing="0.14em"
                fontFamily="JetBrains Mono, monospace"
              >
                UPSTAGE (BACK)
              </text>
              <text
                x={18}
                y={PAD_TOP + stageD / 2}
                textAnchor="middle"
                fill="#64748B"
                fontSize={10}
                fontWeight="600"
                letterSpacing="0.12em"
                fontFamily="JetBrains Mono, monospace"
                transform={`rotate(-90, 18, ${PAD_TOP + stageD / 2})`}
              >
                STAGE RIGHT
              </text>
              <text
                x={totalW - 18}
                y={PAD_TOP + stageD / 2}
                textAnchor="middle"
                fill="#64748B"
                fontSize={10}
                fontWeight="600"
                letterSpacing="0.12em"
                fontFamily="JetBrains Mono, monospace"
                transform={`rotate(90, ${totalW - 18}, ${PAD_TOP + stageD / 2})`}
              >
                STAGE LEFT
              </text>

              {stageConfig.hasApron && (
                <path
                  d={`M ${PAD_X + stageW * 0.12} ${PAD_TOP + stageD}
                      Q ${PAD_X + stageW / 2} ${PAD_TOP + stageD + 36} ${PAD_X + stageW * 0.88} ${PAD_TOP + stageD} Z`}
                  fill="#FFFFFF"
                  stroke="#94A3B8"
                  strokeWidth={1.5}
                />
              )}

              <rect
                x={PAD_X}
                y={PAD_TOP}
                width={stageW}
                height={stageD}
                fill="#FFFFFF"
                stroke="#334155"
                strokeWidth={2}
              />

              {/* Subtle 1m grid for print */}
              {Array.from({ length: Math.floor(stageConfig.widthM) - 1 }, (_, i) => i + 1).map(
                (xm) => (
                  <line
                    key={`px-${xm}`}
                    x1={PAD_X + xm * PPM}
                    y1={PAD_TOP}
                    x2={PAD_X + xm * PPM}
                    y2={PAD_TOP + stageD}
                    stroke="#E2E8F0"
                    strokeWidth={1}
                  />
                )
              )}
              {Array.from({ length: Math.floor(stageConfig.depthM) - 1 }, (_, i) => i + 1).map(
                (ym) => (
                  <line
                    key={`py-${ym}`}
                    x1={PAD_X}
                    y1={PAD_TOP + ym * PPM}
                    x2={PAD_X + stageW}
                    y2={PAD_TOP + ym * PPM}
                    stroke="#E2E8F0"
                    strokeWidth={1}
                  />
                )
              )}

              {sortedItems.map((item) => {
                const cx = PAD_X + item.xM * PPM;
                const cy = PAD_TOP + item.yM * PPM;
                const w = item.widthM * PPM;
                const h = item.depthM * PPM;
                return (
                  <g key={item.id} transform={`translate(${cx}, ${cy})`}>
                    <g transform={`rotate(${item.rotation}) translate(${-w / 2}, ${-h / 2})`}>
                      <EquipmentGraphic
                        type={item.type}
                        width={w}
                        height={h}
                        surface="light"
                        customColor={item.color}
                      />
                    </g>
                    <text
                      x={0}
                      y={h / 2 + 13}
                      textAnchor="middle"
                      fill="#0F172A"
                      fontSize={10}
                      fontWeight="600"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      {item.label}
                    </text>
                    {(item.performer || item.monitorMixId) && (
                      <text
                        x={0}
                        y={h / 2 + 24}
                        textAnchor="middle"
                        fill="#475569"
                        fontSize={8.5}
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {[item.performer, item.monitorMixId].filter(Boolean).join(' · ')}
                      </text>
                    )}
                    {item.channelLabel && (
                      <g transform={`translate(${w / 2 - 4}, ${-h / 2 + 4})`}>
                        <rect
                          x={-12}
                          y={-8}
                          width={Math.max(20, item.channelLabel.length * 6.5 + 10)}
                          height={15}
                          rx={3}
                          fill="#1D4ED8"
                        />
                        <text
                          x={-12 + Math.max(20, item.channelLabel.length * 6.5 + 10) / 2}
                          y={2.5}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize={8.5}
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

              <text
                x={PAD_X + stageW / 2}
                y={PAD_TOP + stageD + (stageConfig.hasApron ? 52 : 34)}
                textAnchor="middle"
                fill="#475569"
                fontSize={11}
                fontWeight="600"
                letterSpacing="0.16em"
                fontFamily="JetBrains Mono, monospace"
              >
                DOWNSTAGE · AUDIENCE
              </text>
            </svg>
          </div>

          {/* Contact & Staging Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 print-avoid-break">
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-slate-900">
                Stage &amp; Backline Notes
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {project.stageNotes || 'No additional staging notes specified.'}
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-slate-900">
                Power &amp; Production Contact
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {project.powerNotes || 'Standard stage power drops as plotted.'}
              </p>
              <div className="no-print grid grid-cols-2 gap-2 pt-2">
                <input
                  type="text"
                  value={project.contactName}
                  placeholder="Tech Contact Name"
                  onChange={(e) => onUpdateProjectMeta({ contactName: e.target.value })}
                  className="px-2.5 py-1.5 text-xs rounded border border-slate-200 bg-slate-50 text-slate-900"
                />
                <input
                  type="email"
                  value={project.contactEmail}
                  placeholder="Contact Email"
                  onChange={(e) => onUpdateProjectMeta({ contactEmail: e.target.value })}
                  className="px-2.5 py-1.5 text-xs rounded border border-slate-200 bg-slate-50 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Page 2: Input Patch List & Monitor Mixes */}
          <div className="border-t border-slate-200 pt-6 space-y-6 print-break-before">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 mb-2.5">
                Input Patch List ({inputList.length} Channels)
              </h3>
              {inputList.length === 0 ? (
                <p className="text-xs text-slate-500">No input channels defined.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-[11px] font-semibold text-slate-600">
                      <th className="py-2 pr-3 w-12">Ch</th>
                      <th className="py-2 px-3">Source / Instrument</th>
                      <th className="py-2 px-3">Mic / DI</th>
                      <th className="py-2 px-3">Stand</th>
                      <th className="py-2 px-3 w-14 text-center">48V</th>
                      <th className="py-2 pl-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {inputList.map((ch) => (
                      <tr key={ch.id}>
                        <td className="py-1.5 pr-3 font-mono-tabular font-semibold text-slate-900">
                          {String(ch.channelNumber).padStart(2, '0')}
                        </td>
                        <td className="py-1.5 px-3 font-medium text-slate-900">{ch.source}</td>
                        <td className="py-1.5 px-3 text-slate-700">{ch.micOrDi}</td>
                        <td className="py-1.5 px-3 text-slate-600">{ch.stand}</td>
                        <td className="py-1.5 px-3 text-center font-mono-tabular">
                          {ch.phantom48v ? '48V' : '—'}
                        </td>
                        <td className="py-1.5 pl-3 text-slate-600">{ch.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {monitorMixes.length > 0 && (
              <div className="print-avoid-break">
                <h3 className="font-display text-base font-bold text-slate-900 mb-2.5">
                  Monitor Mixes ({monitorMixes.length})
                </h3>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-[11px] font-semibold text-slate-600">
                      <th className="py-2 pr-3 w-32">Mix</th>
                      <th className="py-2 px-3 w-32">Type</th>
                      <th className="py-2 px-3 w-48">Position / Performer</th>
                      <th className="py-2 pl-3">Requested Contents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {monitorMixes.map((mx) => (
                      <tr key={mx.id}>
                        <td className="py-1.5 pr-3 font-semibold text-slate-900">{mx.name}</td>
                        <td className="py-1.5 px-3 text-slate-700">{mx.type}</td>
                        <td className="py-1.5 px-3 text-slate-700">{mx.performerOrPosition}</td>
                        <td className="py-1.5 pl-3 text-slate-600">{mx.requestedContents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
