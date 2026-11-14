# StagePlot Studio

A precision stage plot designer, input patch list builder, and printable technical rider generator for bands, ensembles, school music departments, and live sound engineers.

StagePlot Studio runs entirely in the browser. There is no backend, no account, and no data collection — projects live in `localStorage` on your machine and travel as JSON files.

**Live app:** <https://rayfoolshs.github.io/StageplotPro/>

---

## What it does

| Workspace | Purpose |
| --- | --- |
| **Stage Plot** | Drag equipment onto a scaled, dimensioned stage. Move, rotate, resize, align, lock, and label every item. |
| **Input Patch** | Build the channel list from gear you placed, or by hand. Record mic/DI, stand, 48V, and notes. Download as CSV. |
| **Tech Rider** | Generate an A4 print-ready rider: vector stage plot, input list, monitor mixes, contacts, and power notes. |

Everything is connected: a drum kit placed on the plot can generate its six suggested channels, and plot items carry channel badges that match the patch list.

## Feature highlights

- **37 equipment types** across seven categories: vocals & mics, drums & percussion, guitars & bass, keys & piano, winds/brass/strings, monitoring & audio, risers/stands/power.
- **Metric drafting canvas** with grid, centre line, rulers, stage dimensions, optional apron, and three stage surfaces (dark, light, blueprint).
- **Direct manipulation**: drag to place, drag to move, corner handles to resize, rotation handle to angle, plus snap-to-grid, snap-to-centre-line, and snap-to-other-items.
- **Precision tools**: multi-select, duplicate, delete, align X, align Y, distribute horizontally, z-order controls, and per-item locking.
- **Undo / redo** (40 steps) with coalesced drag history.
- **Auto channel generation** from `suggestedChannels` metadata, "Sync From Stage" for bulk import, and per-item channel/monitor badges.
- **Monitor mix planner**: wedges, IEM (mono/stereo), drum fill, side fill, with requested-content notes.
- **Exports**: high-resolution PNG with title block and contact footer, CSV patch list, JSON project file (lossless round trip), and browser print / Save as PDF for the rider.
- **Dark and light UI**, autosave, and five starting templates.
- **Offline-friendly** once loaded; no network calls at runtime.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 3000 (LAN-accessible). |
| `npm run build` | Type-free production build into `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Type-check with `tsc --noEmit` (no ESLint configured). |
| `npm run clean` | Remove `dist/` and the legacy `server.js` artefact. |

## Workspace tour

### 1. Stage Plot

- Pick a template from **Templates**, or start from **Blank Stage**.
- Drag gear from the left sidebar onto the canvas, or click a sidebar item to drop it in the middle.
- Select one or more items to reveal selection handles:
  - drag the body to move,
  - drag a corner to resize (when the item is resizable),
  - drag the round handle to rotate,
  - use the inspector on the right for numeric values.
- The canvas toolbar provides undo, redo, duplicate, delete, zoom (50 %–200 %), and a fullscreen-ish fitted view.
- The inspector edits project metadata, stage settings, item geometry, labels, performers, channel badges, monitor mix IDs, cable links, colours, and notes.

### 2. Input Patch

- **Sync From Stage** walks the plot and appends suggested channels for every unlinked piece of gear.
- **Add Channel** creates a blank row; every cell is editable.
- **Download CSV** exports a spreadsheet-ready patch list.
- Any channel can be located back on the plot; the app switches to the Stage Plot tab with that item selected.
- **Add Monitor Mix** builds the monitor schedule used by the rider.

### 3. Tech Rider

- Editable contact and power sections sit beside a crisp, ink-friendly vector plot.
- **Print / Save PDF Rider** switches to this tab and opens the browser print dialog.
- Print styling is A4 portrait with 12 mm margins; the UI chrome is hidden and page breaks are controlled.

## Keyboard shortcuts

Shortcuts are active only in the Stage Plot workspace and are ignored while typing in inputs.

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z`, `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + D` | Duplicate selection |
| `Delete` / `Backspace` | Delete selection |
| `Escape` | Clear selection |
| `Arrow keys` | Nudge selection by 0.1 m |
| `Shift + Arrow keys` | Nudge selection by 0.5 m |

## Coordinate system and units

- The stage is measured in **metres** internally; the UI can display metres or feet.
- `xM` is the distance from the left edge of the drawing (**Stage Right**, audience left); `yM` is the distance from the **Upstage** edge. Increasing `xM` moves toward **Stage Left**.
- Rotation `0°` faces the audience (downstage); positive values rotate clockwise.
- The canvas renders at **80 px per metre** in SVG space, scaled visually by zoom.
- Audience is at the bottom; Stage Right is on the viewer's left, Stage Left on the right — performer perspective, as on a real plot.
- Snap thresholds: grid/2 while dragging, 0.14 m to the centre line and other item centres, 0.25 m when dropping new gear, 0.2 m while resizing.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full implementation map.

## Data and privacy

- The current project is autosaved to `localStorage` under `stageplot-studio-project-v1`.
- The theme preference is stored under `stageplot-studio-theme`.
- Nothing leaves the browser. There are no analytics, no API keys, and no server-side calls at runtime.
- Use **Export Plot → Save Project (.json)** for backups and **Import Project (.json)** to restore. Clearing site data erases the autosave, so export before housekeeping.

## Templates

| Template | Contents |
| --- | --- |
| 5-Piece Contemporary Band | Drums on riser, bass, two guitars, keys, three vocals, four monitor mixes. |
| Concert Band / Wind Ensemble | Full wind and percussion layout with conductor podium. |
| Jazz Ensemble / Quartet + Horns | Compact jazz kit, upright bass, horns, piano. |
| Choir & Piano Accompaniment | Choir risers, piano, area mics, conductor. |
| Blank Stage | Empty 10 m × 7 m stage. |

## Project structure

```text
.
├── .github/workflows/deploy.yml   # GitHub Pages deployment
├── index.html                     # Fonts, meta tags, root node
├── src/
│   ├── App.tsx                    # State owner: project, history, exports, shortcuts
│   ├── main.tsx                   # React entry
│   ├── index.css                  # Tailwind 4, fonts, print rules
│   ├── types/stage.ts             # Domain types (project, items, channels, mixes)
│   ├── data/
│   │   ├── equipmentCatalog.ts    # 37 equipment definitions + suggested channels
│   │   └── templates.ts           # Five full project templates
│   ├── components/
│   │   ├── TopBar.tsx             # Tabs, templates, export menu, theme toggle
│   │   ├── EquipmentSidebar.tsx   # Searchable, collapsible catalog
│   │   ├── StageCanvas.tsx        # Scaled SVG editor with all pointer interactions
│   │   ├── EquipmentSvg.tsx       # Vector art for every equipment shape
│   │   ├── InspectorPanel.tsx     # Project, stage, and item property editors
│   │   ├── InputPatchView.tsx     # Channel table + monitor mix planner
│   │   ├── TechRiderPrintView.tsx # A4 rider document
│   │   └── TemplateModal.tsx      # Template picker
│   └── utils/exportPng.ts         # SVG → canvas → PNG with title block
├── docs/                          # Architecture, data model, guides, deployment
├── CONTRIBUTING.md
├── CHANGELOG.md
└── README.md
```

## Deployment

The repository deploys to GitHub Pages through GitHub Actions on every push to `main`.

1. Repository **Settings → Pages → Build and deployment → Source** must be set to **GitHub Actions**.
2. Push to `main` (or run the *Deploy to GitHub Pages* workflow manually).
3. The workflow installs with `npm ci`, builds with `npm run build`, and publishes `dist/`.

The Vite `base` is `./`, so the same build works at a domain root, under a repository sub-path, or behind any static host. Full instructions, including custom domains and alternatives, are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Documentation

- [User Guide](docs/USER-GUIDE.md) — day-to-day workflow, exports, printing.
- [Architecture](docs/ARCHITECTURE.md) — state flow, canvas geometry, interaction model.
- [Data Model](docs/DATA-MODEL.md) — types, catalog metadata, JSON project format.
- [Equipment Catalog](docs/EQUIPMENT-CATALOG.md) — every shape, category, footprint, and suggested channels.
- [Deployment](docs/DEPLOYMENT.md) — GitHub Pages, local preview, custom domains.
- [Contributing](CONTRIBUTING.md) — setup, conventions, how to add gear or templates.
- [Changelog](CHANGELOG.md) — release history.

## Tech stack

React 19 · TypeScript 7 · Vite 8 · Tailwind CSS 4 · Lucide icons · Motion. No router, no state library, no UI kit — the app is a single view tree with local state and SVG.

## License and attribution

Portions of the initial scaffold carry `SPDX-License-Identifier: Apache-2.0` headers. Add a project licence file before distributing if you need explicit terms; the repository does not currently include one.
