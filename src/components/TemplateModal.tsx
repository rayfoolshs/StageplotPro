import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { STAGE_TEMPLATES, StageTemplate } from '../data/templates';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: StageTemplate) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Ensemble &amp; Stage Templates
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Start from a pre-configured stage layout and input patch list. Loading a template replaces the current plot.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close templates"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          {STAGE_TEMPLATES.map((tpl) => {
            const preview = tpl.createProject();
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  onSelectTemplate(tpl);
                  onClose();
                }}
                className="group text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-500 transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {tpl.name}
                    </h3>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {tpl.subtitle}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center gap-2 text-[11px] font-mono-tabular text-slate-500 dark:text-slate-400">
                  <span>
                    {preview.stageConfig.widthM}m × {preview.stageConfig.depthM}m
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{preview.items.length} items</span>
                  <span aria-hidden="true">·</span>
                  <span>{preview.inputList.length} ch</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
