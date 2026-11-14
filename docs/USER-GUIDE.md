# StagePlot Studio — User Guide

This guide covers the everyday workflow: starting a project, drafting the plot, building the patch list, producing the rider, and exporting or backing up your work.

---

## 1. Starting a project

Open the app. It restores the last autosaved project, or loads the **5-Piece Contemporary Band** template on first run.

- **Templates** (top bar) replaces the current project. You are warned implicitly by the undo stack resetting; export first if the current work matters.
- **Blank Stage** gives you a 10 m × 7 m empty stage with a 0.5 m grid.
- Project details (title, artist, venue, date, contact, notes) live in the inspector on the right when nothing is selected, or under the rider tab.

> Autosave writes to this browser's `localStorage` after every change. It does not sync between browsers or machines.

## 2. Drafting the stage plot

### Place equipment

- **Drag** a card from the left sidebar onto the canvas. The drop point becomes the item's centre.
- **Click** a card to drop the item near the middle of the stage.
- Search the sidebar to filter by name, category, or shape; collapse categories you do not need.

### Select and manipulate

| Action | How |
| --- | --- |
| Select one item | Click it. |
| Add/remove from selection | `Shift` + click. |
| Marquee select | Drag on empty canvas; items whose centres fall inside the rectangle are selected. |
| Clear selection | Click empty canvas, press `Escape`, or select another item. |
| Move | Drag the item body. Multi-selection moves together. |
| Resize | Drag a corner handle (resizable items only: risers, backdrop, TV panel). |
| Rotate | Drag the round handle above the item. |
| Lock | Inspector → padlock button. Locked items ignore drag, resize, rotate, and nudge. |
| Layer order | Inspector → **Bring Front** / **Send Back**. Zones placed from the catalog start below standard gear. |

While dragging, items snap to half a grid step and align to the stage centre line or other item centres within 0.14 m. Hold **Alt** while dragging to bypass grid snapping. Turn the **Grid** toggle off to disable grid snapping entirely (alignment guides still help you line items up).

### Arrange a group

Select two or more items, then use the inspector:

- **Align Centres Vertically** — same `xM`.
- **Align Row Horizontally** — same `yM`.
- **Distribute** — even horizontal spacing between the leftmost and rightmost selected items.
- **Duplicate** — offsets clones by 0.5 m (clamped to the stage) and unlocks them.
- **Delete**.

### Canvas controls

- **Undo / Redo** buttons mirror the keyboard shortcuts. History holds 40 item states.
- **Zoom**: 50 %–200 % in 15 % steps, reset to 100 % with the percentage button.
- **Grid / Labels / Snakes** toggles control grid lines, item labels, and cable lines to connected stage boxes.- **Dark / Light / Blueprint** changes the stage surface rendering; exports honour it.

### Item inspector

With exactly one item selected you can edit:

- display label and performer,
- channel badge (free text such as `1` or `1-4`),
- monitor mix assignment,
- cable link (which stage box or snake it connects to),
- exact `x`, `y`, width, depth, rotation,
- fill colour tint,
- free-form notes,
- lock state,
- **Send to Patch** to append the item's suggested channels to the input list.

With nothing selected, the inspector edits the project header, stage size, units, grid step, apron, dimension display, and surface.

## 3. Building the input patch

Open the **Input Patch** tab.

### Generate channels from the plot

- **Sync From Stage** scans the plot for gear with suggested channels that are not already linked, appends them in plot order, numbers them sequentially, and stamps matching channel badges on the items.
- **Send to Patch** (inspector) does the same for a single item.

Gear without microphone suggestions (stands, wedges, risers, power, desks) is skipped.

### Edit manually

- **Add Channel** appends a row. Every column is editable: source, mic/DI, stand, 48V, notes.
- Filter the table to find a channel quickly.
- Use the locate control on a row to jump back to the item on the plot with it selected.

### Monitor mixes

- **Add Monitor Mix** creates a row with name, type (Floor Wedge, IEM Stereo, IEM Mono, Drum Fill, Side Fill), position/performer, and requested contents.
- Assign mixes to plot items through the item inspector so the stage plot and rider agree.

### Export the patch

- **Download CSV** produces `<artist-or-title>-input-patch.csv`, one row per channel with a header row. It opens cleanly in Excel, Numbers, or Google Sheets.

## 4. Producing the technical rider

Open the **Tech Rider** tab.

- The document shows a white, ink-friendly vector plot (regardless of your dark UI theme), project header, contact/power block, input patch table, and monitor mix table.
- Contact name, email, stage notes, and power notes are editable in place.
- **Print / Save PDF Rider** in the Export Plot menu switches to this tab and opens the print dialog.

Print settings to use:

- Paper: **A4**, portrait.
- Margins: default (the stylesheet sets 12 mm).
- Background graphics: **on** — the plot uses fills and strokes.
- Scale: 100 % (do not use "fit to page" if you need exact dimensions).

The rider intentionally starts the patch list on a new page and avoids breaking rows across pages.

## 5. Exporting a stage plot image

**Export Plot → Download PNG Image** produces a 2× scale PNG with:

- a title block (project title, artist/venue/date),
- stage size and channel/monitor counts,
- the full stage drawing,
- a footer with contact details and the audience/perspective note.

If you trigger the export while on another tab, the app switches to the plot first. Very large stages produce large images; zoom level does not affect the export resolution (the underlying SVG view box does).

## 6. Backup, transfer, and restore

| Goal | Action |
| --- | --- |
| Full backup | **Export Plot → Save Project (.json)** |
| Move to another machine | Copy the `.json` file, open the app there, **Import Project (.json)** |
| Undo a bad import | Import another backup; the undo stack resets on import |
| Reset to a template | **Templates** → choose a template |

The JSON file contains the entire `StageProject`: metadata, stage configuration, every item, the input list, and monitor mixes. It is plain, readable JSON and safe to diff or version-control.

## 7. Tips and troubleshooting

- **Nothing moves**: the item may be locked (amber padlock in the inspector).
- **Snapping feels aggressive**: turn off **Grid** in the canvas toolbar.
- **Channels duplicate**: **Sync From Stage** skips items that already have linked channels. If you cloned an item, the clone is not linked; delete the old channels or edit the list.
- **Print is blank or cut off**: enable background graphics and use A4 portrait at 100 %.
- **Autosave lost**: clearing browser site data removes the project. Restore from your latest JSON export.
- **Fonts look different**: the app loads Outfit, Plus Jakarta Sans, and JetBrains Mono from Google Fonts; offline use falls back to system fonts.
- **Two tabs open**: each tab autosaves independently; the last write wins. Work in one tab at a time.
