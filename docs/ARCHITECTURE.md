# Architecture

StagePlot Studio is a client-only single-page application. A single React tree owns one `StageProject`, renders three workspace views from it, and persists it to `localStorage`. There is no router, store library, backend, or runtime network dependency.

- **Framework:** React 19 with function components and hooks.
- **Language:** TypeScript (strict type-checking via `tsc --noEmit`; no ESLint).
- **Build:** Vite 8, ES modules, `base: './'` for portable static hosting.
- **Styling:** Tailwind CSS 4 through `@tailwindcss/vite`, plus a small `@layer base` for font variables and print rules.
- **Icons:** `lucide-react`.
- **Graphics:** hand-authored SVG (`EquipmentSvg.tsx`) and the stage canvas (`StageCanvas.tsx`). No canvas 2D drawing at runtime except during PNG export.

## Module map

```text
src/
├── main.tsx                     ReactDOM root + App
├── App.tsx                      Project state, history, persistence, shortcuts, exports
├── types/stage.ts               All domain types
├── data/
│   ├── equipmentCatalog.ts      CATEGORY_META + EQUIPMENT_CATALOG (37 definitions)
│   └── templates.ts             STAGE_TEMPLATES (5 factories)
├── components/
│   ├── TopBar.tsx               Tabs, template modal trigger, export menu, theme
│   ├── EquipmentSidebar.tsx     Search + grouped, collapsible catalog
│   ├── StageCanvas.tsx          SVG stage editor and interaction state machine
│   ├── EquipmentSvg.tsx         <EquipmentGraphic> switch over EquipmentShape
│   ├── InspectorPanel.tsx       Contextual property editor (project / stage / item)
│   ├── InputPatchView.tsx       Channel table, CSV export, monitor mix editor
│   ├── TechRiderPrintView.tsx   A4 print document with inline plot and tables
│   └── TemplateModal.tsx        Full-screen template picker
└── utils/exportPng.ts           SVG → <img> → 2× canvas → PNG blob download
```

## State ownership

`App.tsx` is the single source of truth.

```text
                 ┌─────────────────────────────┐
                 │ App.tsx                     │
                 │  project: StageProject      │
                 │  selectedIds: string[]      │
                 │  activeTab: WorkspaceTab    │
                 │  historyPast/Future         │
                 │  isDarkTheme, toast         │
                 └──────────┬──────────────────┘
                            │ props + callbacks
     ┌──────────────┬───────┴────────┬──────────────────┐
     ▼              ▼                ▼                  ▼
TopBar      EquipmentSidebar     StageCanvas      InspectorPanel
                                                 InputPatchView
                                                 TechRiderPrintView
```

Child components are presentational and never mutate the project directly. They call callbacks such as `onUpdateItem`, `onUpdateItems`, `onUpdateStageConfig`, `onUpdateProjectMeta`, `onUpdateInputList`, and `onUpdateMonitorMixes`.

### Update paths

| Path | Use |
| --- | --- |
| `handleUpdateProjectMeta(patch)` | Shallow merge of project metadata (including `inputList` / `monitorMixes`). |
| `handleUpdateStageConfig(patch)` | Merge into `stageConfig`. |
| `handleUpdateItem(id, patch)` | One item, commits history. |
| `commitItemsChange(updater, commitHistory)` | Batch item updates with optional history coalescing. |
| `handleUndo` / `handleRedo` | Swap item snapshots between two stacks. |

`updatedAt` is refreshed on every path except pure selection/theme changes.

### Undo model

History stores **item arrays only**, capped at 40 snapshots. Project metadata, stage configuration, input list, and monitor mixes are not undoable. This keeps snapshots small and drag interactions cheap.

During pointer drags, `StageCanvas` calls `onUpdateItems(fn, false)` repeatedly. The first such call stores the pre-drag item array in `dragBaseItemsRef`; `onCommitDragHistory` pushes that base once on pointer-up, so a forty-step drag becomes one undo step. Rotation and resize use the same coalescing.

## Canvas geometry

`StageCanvas.tsx` defines:

```ts
PPM = 80          // SVG pixels per metre
PAD_X = 64        // left/right drafting margin
PAD_TOP = 54      // top margin for upstage label and rulers
PAD_BOTTOM = 78   // bottom margin for audience bar
```

The SVG `viewBox` is `0 0 totalW totalH`, where:

```text
totalW = stageWidthM  * PPM + PAD_X * 2
totalH = stageDepthM  * PPM + PAD_TOP + PAD_BOTTOM
```

The canvas is not panned; it is centred inside a scrollable container. Zoom scales the container's CSS width/height (0.5–2.0). Because the view box stays fixed, PNG export always renders the full stage at native resolution regardless of zoom.

Pointer coordinates are converted with `SVGScreenCTM`:

```ts
svgPt = clientPoint.matrixTransform(svg.getScreenCTM().inverse())
xM = (svgPt.x - PAD_X) / PPM
yM = (svgPt.y - PAD_TOP) / PPM
```

This keeps hit-testing correct under zoom and browser page zoom.

### Drawing order

1. Drafting matte.
2. Architectural labels (UPSTAGE, STAGE RIGHT, STAGE LEFT).
3. Optional apron.
4. Stage floor.
5. Grid (centre line emphasised, dashed).
6. Dimension annotations.
7. Downstage / audience bar.
8. Signal cables (when **Snakes** is on).
9. Equipment items, sorted by `zIndex`, each as `translate(cx, cy) → rotate → translate(-w/2, -h/2)`.
10. Selection overlay (`data-no-export="true"`, so it is stripped before export).
11. Item labels and channel badges, kept unrotated for legibility.

### Interaction state machine

`StageCanvas` holds a discriminated union:

```ts
type InteractionMode =
  | { kind: 'none' }
  | { kind: 'drag'; startMouseM; initialPositions; moved }
  | { kind: 'rotate'; itemId; centerM; initialRotation }
  | { kind: 'resize'; itemId; corner; initialItem }
  | { kind: 'marquee'; startM; currentM };
```

- **Drag:** pointer-down on an item captures the pointer, records initial positions of all selected unlocked items, then applies a shared delta. The primary item snaps to half-grid (unless `showGrid` is off or `Alt` is held) and to the stage centre line or other item centres within 0.14 m; active guides render during movement.
- **Rotate:** angle derived from the pointer relative to item centre; result normalised to −180…180.
- **Resize:** corner-specific clamping with a minimum size; supports only items whose catalog definition sets `resizable: true`.
- **Marquee:** drag on empty canvas; selects items whose centres fall inside the rectangle if it exceeds 0.15 m in either axis.
- **Drop:** sidebar cards set `application/stageplot-type`; the canvas converts the drop point to metres, clamps to the stage, snaps to 0.25 m, and delegates to `onDropNewEquipment`.

## Rendering equipment

`EquipmentSvg.tsx` exports `EquipmentGraphic`, which switches on `EquipmentShape` and draws each item in a local coordinate space of `0 0 width height`. Shapes respond to `surface` (`dark` / `light` / `blueprint`) and an optional `customColor` tint. Adding a shape requires:

1. extending the `EquipmentShape` union,
2. adding a catalog definition,
3. adding a rendering branch,
4. optionally adding suggested channels.

See [CONTRIBUTING.md](../CONTRIBUTING.md).

## Persistence and migration

- Autosave effect serialises the whole project to `localStorage['stageplot-studio-project-v1']`.
- Loading tolerates malformed JSON and validates that `stageConfig` exists and `items` is an array.
- A small migration rewrites legacy `Power SR` labels to `Power 240v` on load.
- Theme is stored separately in `localStorage['stageplot-studio-theme']` and applied by toggling the `dark` class on `<html>`; Tailwind's dark variant is wired to that class.

## Export pipeline

`utils/exportPng.ts`:

1. Clone the live `<svg>`.
2. Remove `[data-no-export]` nodes (selection handles, guides).
3. Wrap the clone in a new SVG with a 76 px header and 44 px footer.
4. Draw a title block (project title, subtitle, stage dimensions, channel/monitor counts) and a contact footer.
5. Serialise to a blob URL, load into an `Image`, draw onto a 2× canvas, and download `image/png`.

Text in the header/footer uses explicit `font-family` attributes so exported PNGs do not depend on CSS inheritance.

## Print pipeline

`TechRiderPrintView` renders a paper-like sheet inside the app. `index.css` defines:

- `@page { size: A4 portrait; margin: 12mm }`,
- forced white background and exact colour printing,
- `.no-print` to hide navigation and chrome,
- `.print-break-before` and `.print-avoid-break` for pagination.

`handlePrintRider` switches to the rider tab, waits 160 ms for layout, then calls `window.print()`.

## Constraints and intentional trade-offs

- **One project at a time.** There is no project library or cloud sync; JSON files are the unit of transfer.
- **No automated tests.** Correctness relies on TypeScript plus manual verification.
- **Item-only undo.** Geometry and composition are undoable, metadata edits are not.
- **Metric canonical units.** Feet are a display conversion only; stored values are always metres.
- **No routing.** Tabs are React state, so deep links and browser back do not switch workspaces.
- **Client-side only.** The scaffold's original Gemini/Express environment variables are unused; the shipped app makes no API calls.
