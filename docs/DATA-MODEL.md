# Data Model

All types live in [`src/types/stage.ts`](../src/types/stage.ts). This document explains their meaning, invariants, and the on-disk JSON format.

## Aggregate: `StageProject`

```ts
interface StageProject {
  id: string;
  title: string;
  ensembleOrArtist: string;
  eventOrVenue: string;
  eventDate: string;      // ISO date string (yyyy-mm-dd from templates)
  contactName: string;
  contactEmail: string;
  stageNotes: string;
  powerNotes: string;
  stageConfig: StageConfig;
  items: StageItem[];
  inputList: InputChannel[];
  monitorMixes: MonitorMix[];
  updatedAt: string;      // ISO timestamp, refreshed on edits
}
```

One project is active at a time. `id` is informational; the app does not index projects.

## Stage configuration

```ts
interface StageConfig {
  widthM: number;                 // metres, stage left-to-right
  depthM: number;                 // metres, upstage-to-downstage
  unit: 'm' | 'ft';               // display unit only
  gridStepM: number;              // metres per grid line
  hasApron: boolean;              // draw curved apron
  showGrid: boolean;              // grid lines + grid snapping
  showLabels: boolean;            // item labels / performer / mix text
  showChannels: boolean;          // channel badges
  showCables: boolean;            // cable paths to connected stage boxes
  showDimensions: boolean;        // ruler ticks and width/depth annotations
  stageSurface: 'dark' | 'light' | 'blueprint';
}
```

**Invariants**

- `widthM` and `depthM` are positive; the inspector enforces practical minimums.
- Stored geometry is always metric. `unit` converts at render time (`× 3.28084` for feet) and never rewrites `widthM` / `depthM`.
- `gridStepM` is the spacing of grid lines; dragging snaps to half of it.

## Stage items

```ts
interface StageItem {
  id: string;
  type: EquipmentShape;         // which SVG graphic to render
  label: string;                // displayed name / short label
  performer?: string;
  xM: number;                   // centre X, metres from Stage Left edge
  yM: number;                   // centre Y, metres from Upstage edge
  widthM: number;
  depthM: number;
  rotation: number;             // degrees; 0 faces audience
  channelLabel?: string;        // e.g. "1", "1-4"
  monitorMixId?: string;        // e.g. "Mix 2"
  connectedToId?: string;       // target StageItem id for cable display
  locked?: boolean;
  zIndex: number;               // paint order, ascending
  notes?: string;
  color?: string;               // custom tint override
}
```

**Geometry rules**

- `xM` / `yM` identify the item's **centre**, not a corner.
- `yM = 0` is the **upstage** (back) edge; `yM = depthM` is downstage, where the audience sits.
- `xM = 0` is the **left edge of the drawing**, labelled **Stage Right** (the performers' right, the audience's left). Increasing `xM` moves toward **Stage Left**.
- The comment above `xM` in `types/stage.ts` says "from Stage Left edge"; the renderer and the on-canvas labels place zero at Stage Right. Treat the renderer as authoritative.
- Items are clamped to `0.2 … widthM - 0.2` and `0.2 … depthM - 0.2` during drag, resize, nudge, and duplicate.
- Rotation is normalised to `-180 … 180`; labels and badges remain upright.
- `zIndex` is assigned from `max(existing zIndex, 5) + 1`; zones (risers, backdrop, TV panel) are inserted at `2` so they sit beneath performers.
- Locked items ignore move, resize, rotate, and arrow-key nudging, but can still be selected, edited in the inspector, duplicated, or deleted.

## Input channels

```ts
interface InputChannel {
  id: string;
  channelNumber: number;
  source: string;               // e.g. "Kick Drum"
  micOrDi: string;              // e.g. "Shure Beta 52A"
  stand: string;                // e.g. "Short Boom", "N/A (DI / Direct)"
  phantom48v: boolean;
  stageItemId?: string;         // links the row to a plot item
  notes: string;
}
```

- `channelNumber` drives ordering and CSV output.
- Auto-generated rows use `stageItemId` to prevent duplicate generation by **Sync From Stage**.
- Deleting a plot item does **not** delete its channels; the link simply becomes stale.

## Monitor mixes

```ts
interface MonitorMix {
  id: string;
  name: string;                 // "Mix 1"
  type: 'Floor Wedge' | 'IEM Stereo' | 'IEM Mono' | 'Drum Fill' | 'Side Fill';
  performerOrPosition: string;
  requestedContents: string;
}
```

Plot items reference a mix by id, while the readable label (`Mix 1`) is what appears on the canvas. Renaming a mix does not rewrite item badges; keep them in sync manually or use consistent ids/labels from the start.

## Equipment definitions

```ts
interface EquipmentDefinition {
  type: EquipmentShape;
  name: string;                 // catalog display name
  shortLabel: string;           // default item label
  category: EquipmentCategory;
  defaultWidthM: number;
  defaultDepthM: number;
  resizable?: boolean;          // shows corner handles
  rotatable?: boolean;          // false hides rotation handle
  isZone?: boolean;             // background zone (riser/backdrop/panel)
  suggestedChannels?: SuggestedChannel[];
  defaultNotes?: string;
}

interface SuggestedChannel {
  source: string;
  micOrDi: string;
  stand: string;
  phantom48v: boolean;
}
```

`EquipmentCategory` is one of `vocals`, `drums`, `guitars`, `keys`, `winds_strings`, `monitoring`, `staging`. `CATEGORY_META` maps each category to a label, accent colour, badge background, and stroke colour.

`suggestedChannels` powers **Send to Patch** and **Sync From Stage**. When a definition has exactly one suggestion, the generated source is `<item label> (<performer>)`; multiple suggestions are named `<item label> · <suggested source>`.

## Templates

```ts
interface StageTemplate {
  id: string;
  name: string;
  subtitle: string;
  preview?: ...;
  createProject: () => StageProject;
}
```

Templates are factories, not stored files. Each returns a complete project with metadata, stage config, items, channels, and mixes. Selecting a template replaces the project and clears history.

| id | name |
| --- | --- |
| `rock_band` | 5-Piece Contemporary Band |
| `concert_band` | Concert Band / Wind Ensemble |
| `jazz_combo` | Jazz Ensemble / Quartet + Horns |
| `choir_piano` | Choir & Piano Accompaniment |
| `blank_stage` | Blank Stage |

## Workspace tab

```ts
type WorkspaceTab = 'plot' | 'patch' | 'rider';
```

View state only; never persisted.

## Project JSON format

Exports are pretty-printed `StageProject` objects with the extension `.stageplot.json`.

```json
{
  "id": "proj-rock-band",
  "title": "Contemporary Band Stage Plot",
  "ensembleOrArtist": "Example Ensemble",
  "eventOrVenue": "Main Auditorium",
  "eventDate": "2026-11-14",
  "contactName": "Music Department",
  "contactEmail": "music@example.org",
  "stageNotes": "Drums centred on a 2.4 m riser.",
  "powerNotes": "4 × 240V quad boxes.",
  "stageConfig": {
    "widthM": 10,
    "depthM": 7,
    "unit": "m",
    "gridStepM": 0.5,
    "hasApron": true,
    "showGrid": true,
    "showLabels": true,
    "showChannels": true,
    "showCables": false,
    "showDimensions": true,
    "stageSurface": "dark"
  },
  "items": [
    {
      "id": "d1",
      "type": "drum_kit",
      "label": "Drum Kit",
      "performer": "Alex",
      "xM": 5,
      "yM": 2.2,
      "widthM": 2.2,
      "depthM": 1.8,
      "rotation": 0,
      "channelLabel": "1-6",
      "zIndex": 6
    }
  ],
  "inputList": [
    {
      "id": "ch1",
      "channelNumber": 1,
      "source": "Kick Drum",
      "micOrDi": "Shure Beta 52A",
      "stand": "Short Boom",
      "phantom48v": false,
      "stageItemId": "d1",
      "notes": "Gate / Tight punch"
    }
  ],
  "monitorMixes": [
    {
      "id": "mx1",
      "name": "Mix 1",
      "type": "Floor Wedge",
      "performerOrPosition": "Downstage Center (Lead Vox)",
      "requestedContents": "Lead Vox, Keys"
    }
  ],
  "updatedAt": "2026-11-14T06:30:00.000Z"
}
```

### Import validation

Import accepts any JSON file but requires:

- an object with a `stageConfig` property, and
- an array `items` property.

Everything else is trusted as-is. Import resets selection and history, so keep a backup before importing an experimental file.

## Local storage keys

| Key | Contents |
| --- | --- |
| `stageplot-studio-project-v1` | Current `StageProject` JSON. |
| `stageplot-studio-theme` | `"dark"` or `"light"`. |
