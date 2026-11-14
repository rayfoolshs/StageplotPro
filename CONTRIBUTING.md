# Contributing

Thanks for improving StagePlot Studio. This project is a small, client-only React app; the fastest way to contribute is to keep changes focused, typed, and consistent with the existing patterns.

## Setup

```bash
git clone https://github.com/rayfoolshs/StageplotPro.git
cd StageplotPro
npm install
npm run dev
```

Requirements: Node.js 22+, npm 10+.

Before opening a pull request:

```bash
npm run lint    # tsc --noEmit
npm run build   # must succeed
```

There is no unit-test framework. Verify behaviour manually in the browser, including the PNG export and the print dialog.

## Project conventions

- **TypeScript everywhere.** No `any` unless unavoidable; no `@ts-ignore` without a comment explaining why.
- **Components** are PascalCase files exporting named function components (except `App`, the default export).
- **Types** belong in `src/types/stage.ts`; do not duplicate domain interfaces locally.
- **Catalog data** belongs in `src/data/equipmentCatalog.ts`; **templates** in `src/data/templates.ts`.
- **Styling** uses Tailwind utility classes. Respect the existing dark-mode pattern: `bg-white dark:bg-slate-900`, `text-slate-900 dark:text-slate-100`.
- **Print UI** must carry `no-print` where it should not appear on paper.
- **State** is owned by `App.tsx`. Child components receive data and callbacks; do not mutate the project object in place.
- **Units** are metres in state at all times. Convert only for display.
- **SVG geometry** inside `EquipmentGraphic` is drawn in local coordinates from `(0, 0)` to `(width, height)`; keep shapes inside those bounds so hit areas and exports behave.

## Common tasks

### Add a new equipment shape

1. Add the key to the `EquipmentShape` union in `src/types/stage.ts`.
2. Add a definition to `EQUIPMENT_CATALOG` in `src/data/equipmentCatalog.ts`:

   ```ts
   {
     type: 'my_new_gear',
     name: 'My New Gear',
     shortLabel: 'Gear',
     category: 'monitoring',
     defaultWidthM: 0.8,
     defaultDepthM: 0.6,
     rotatable: true,
     // resizable: true,   // only for zones / panels
     // isZone: true,      // paint beneath performers
     suggestedChannels: [
       { source: 'My Source', micOrDi: 'SM57', stand: 'Short Boom', phantom48v: false },
     ],
   },
   ```

3. Add a `case 'my_new_gear':` branch in `EquipmentGraphic` (`src/components/EquipmentSvg.tsx`). Use the shared colour variables (`accent`, `bodyFill`, `strokeColor`, …) so dark, light, and blueprint surfaces all work.
4. Run `npm run lint` and `npm run dev`; place the item, rotate it, select it, and export a PNG to confirm the symbol renders at both small and large sizes.

### Add a template

1. Append an entry to `STAGE_TEMPLATES` in `src/data/templates.ts`.
2. Implement `createProject: () => StageProject` returning a complete project — metadata, `stageConfig`, `items`, `inputList`, and `monitorMixes`.
3. Keep ids unique within the template; `stageItemId` values in channels must match item ids.
4. Check the template in the modal and confirm **Sync From Stage** does not duplicate channels (linked items are skipped).

### Add a project field

1. Add the property to `StageProject` (or the relevant interface) in `src/types/stage.ts`.
2. Initialise it in every template's `createProject`.
3. Update the loader fallback in `App.tsx` (`loadInitialProject`) so older autosaves do not break; add a migration if the value is required.
4. Surface it in the inspector or rider, and include it in export/import automatically (the whole project is serialised).

### Change the canvas

`StageCanvas.tsx` is the most delicate file. Key constraints:

- Pointer maths uses `getScreenCTM().inverse()`; keep it that way so zoom and browser zoom agree.
- Every drag/rotate/resize must call `onUpdateItems(updater, false)` during movement and `onCommitDragHistory()` on pointer-up, or undo will create one entry per frame.
- Selection handles must remain inside `<g data-no-export="true">` so they are stripped from PNG exports.
- Labels and badges stay unrotated for legibility; rotate only the equipment body.
- New snapping behaviour should respect `Alt` (bypass) and `showGrid`.

## Pull request checklist

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Tested in both light and dark themes.
- [ ] Tested at 50 %, 100 %, and 200 % zoom.
- [ ] PNG export still correct (no selection handles or guides).
- [ ] Rider print preview still paginates correctly.
- [ ] No new runtime network requests or API keys.
- [ ] Documentation updated when behaviour, data, or deployment changes.

## Commit messages

Use short, imperative subjects, optionally with a conventional prefix:

```text
feat: add choir riser snapping
fix: keep channel badges upright when rotated
docs: document GitHub Pages deployment
```

Keep unrelated formatting churn out of functional commits.

## Reporting issues

Include:

- what you expected and what happened,
- steps to reproduce (template, item type, zoom level),
- browser and OS,
- a JSON project export when the issue is layout-specific,
- a screenshot for rendering or print problems.
