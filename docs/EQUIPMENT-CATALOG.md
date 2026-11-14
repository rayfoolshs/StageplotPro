# Equipment Catalog

All equipment definitions live in [`src/data/equipmentCatalog.ts`](../src/data/equipmentCatalog.ts). The catalog drives the sidebar, SVG rendering metadata, default footprints, and the suggested channel lists used by **Send to Patch** and **Sync From Stage**.

- Footprints are the default size in metres; `resizable` items expose corner handles.
- `zone` items are background regions inserted beneath performers.
- "Suggested channels" are appended to the input list; they are not created automatically when you place an item.
- Rotation is available for every type today; the handle is only hidden when a definition sets `rotatable: false`.
- Every type renders through `EquipmentGraphic` in [`src/components/EquipmentSvg.tsx`](../src/components/EquipmentSvg.tsx).

## Vocals & Mics

| Item | Type key | Footprint (W × D) | Traits | Suggested channels |
| --- | --- | --- | --- | --- |
| Vocal Mic (Boom Stand) | `mic_boom` | 0.65 m × 0.65 m | — | Lead Vocal — Shure SM58 |
| Wireless Handheld Mic | `mic_wireless` | 0.55 m × 0.55 m | — | Wireless Vocal — Shure QLXD / SM58 |
| Choir / Area Condenser | `mic_condenser` | 0.6 m × 0.6 m | — | Choir / Area Mic — Neumann KM184 / Rode NT5 |

## Drums & Percussion

| Item | Type key | Footprint (W × D) | Traits | Suggested channels |
| --- | --- | --- | --- | --- |
| 5-Piece Drum Kit | `drum_kit` | 2.2 m × 1.8 m | — | Kick Drum — Shure Beta 52A<br>Snare Top — Shure SM57<br>Hi-Hat / Rack — Sennheiser e604<br>Floor Tom — Sennheiser e604<br>Drum OH L — Rode NT5 / KM184<br>Drum OH R — Rode NT5 / KM184 |
| Compact / Jazz Kit | `drum_compact` | 1.75 m × 1.5 m | — | Kick Drum — AKG D112<br>Snare — Shure SM57<br>Overhead Mono — Small Diaphragm Condenser |
| Percussion Rig / Congas | `percussion_table` | 1.5 m × 1.0 m | — | Percussion L — Shure SM57<br>Percussion R — Shure SM57 |
| Marimba / Xylophone | `marimba` | 2.2 m × 0.95 m | — | Mallet Perc L — Condenser Pair<br>Mallet Perc R — Condenser Pair |
| Timpani Set (3-4) | `timpani` | 2.4 m × 1.25 m | — | — |

## Guitars & Bass

| Item | Type key | Footprint (W × D) | Traits | Suggested channels |
| --- | --- | --- | --- | --- |
| Electric Guitar Amp | `guitar_amp` | 0.75 m × 0.5 m | — | Electric Guitar — Sennheiser e609 / SM57 |
| Bass Amp & Cab | `bass_amp` | 0.85 m × 0.6 m | — | Bass Guitar DI — Active DI (Post-Pre) |
| Acoustic Guitar + DI | `acoustic_guitar` | 0.85 m × 0.85 m | — | Acoustic Guitar — Active DI Box |
| Guitar Pedalboard / Modeler | `pedalboard` | 0.8 m × 0.45 m | — | Guitar Modeler L — Stereo DI |

## Keys & Piano

| Item | Type key | Footprint (W × D) | Traits | Suggested channels |
| --- | --- | --- | --- | --- |
| Grand Piano | `grand_piano` | 1.65 m × 2.2 m | — | Piano High — DPA 4099 / KM184<br>Piano Low — DPA 4099 / KM184 |
| Upright Piano | `upright_piano` | 1.55 m × 0.7 m | — | Upright Piano L — Condenser Mic<br>Upright Piano R — Condenser Mic |
| Keyboard / Stage Piano | `keyboard_single` | 1.45 m × 0.55 m | — | Keys L — Stereo DI (Radial JDI)<br>Keys R — Stereo DI (Radial JDI) |
| Dual-Tier Synth Rig | `keyboard_double` | 1.5 m × 0.7 m | — | Keys Main L — Stereo DI<br>Keys Main R — Stereo DI |

## Winds, Brass & Strings

| Item | Type key | Footprint (W × D) | Traits | Suggested channels |
| --- | --- | --- | --- | --- |
| Brass Player / Horn Mic | `brass_player` | 0.85 m × 0.85 m | — | Trumpet / Horn — Shure SM57 / Beta 98 |
| Woodwind / Saxophone | `woodwind_player` | 0.85 m × 0.85 m | — | Saxophone / Flute — Sennheiser MD421 / SM57 |
| Strings (Violin / Cello) | `string_player` | 0.9 m × 0.9 m | — | Strings — DPA 4099 / Condenser |
| Double Bass / Upright | `upright_bass` | 0.95 m × 0.95 m | — | Double Bass — DPA 4099B + Pickup DI |
| Music Stand | `music_stand` | 0.6 m × 0.45 m | — | — |
| Conductor Podium & Stand | `conductor_podium` | 1.2 m × 1.1 m | — | — |

## Monitors, DI & Audio

| Item | Type key | Footprint (W × D) | Traits | Suggested channels |
| --- | --- | --- | --- | --- |
| Floor Wedge Monitor | `wedge_monitor` | 0.65 m × 0.45 m | — | — |
| Drum Fill / Sub Wedge | `drum_fill` | 0.75 m × 0.65 m | — | — |
| FOH PA / Side Fill | `pa_speaker` | 0.7 m × 0.7 m | — | — |
| IEM / Wireless Rack | `iem_rack` | 0.7 m × 0.6 m | — | — |
| DI Box (Mono / Stereo) | `di_box` | 0.45 m × 0.4 m | — | Direct Input — Active DI Box |
| Digital Stage Box / Snake | `stage_box` | 0.75 m × 0.5 m | — | — |
| X32 Digital Snake (S16/S32) | `x32_snake` | 0.85 m × 0.5 m | — | — |
| X32 Mixing Desk | `x32_desk` | 1.15 m × 0.7 m | — | — |

## Risers, Stands & Power

| Item | Type key | Footprint (W × D) | Traits | Suggested channels |
| --- | --- | --- | --- | --- |
| Stage / Drum Riser | `riser` | 2.4 m × 2.0 m | zone, resizable | — |
| Choir Risers (3-Tier) | `choir_riser` | 3.6 m × 1.5 m | zone, resizable | — |
| Black Lakeland Backdrop | `black_backdrop` | 4.0 m × 0.35 m | zone, resizable | — |
| 80" TV Panel (Display) | `tv_panel_80` | 1.85 m × 0.45 m | resizable | — |
| Lectern / Podium | `lectern` | 0.85 m × 0.65 m | — | Lectern Mic — Gooseneck Condenser / SM58 |
| Performer Chair / Stool | `chair_stool` | 0.55 m × 0.55 m | — | — |
| Power 240v (Quad Box) | `power_drop` | 0.5 m × 0.5 m | — | — |

## Category order and colour coding

The sidebar groups categories in this order, using `CATEGORY_META` for labels and accents:

1. Vocals & Mics — blue
2. Drums & Percussion — amber
3. Guitars & Bass — red
4. Keys & Piano — violet
5. Winds, Brass & Strings — teal
6. Monitors, DI & Audio — emerald
7. Risers, Stands & Power — slate

## Counts at a glance

| Category | Types |
| --- | ---: |
| Vocals & Mics | 3 |
| Drums & Percussion | 5 |
| Guitars & Bass | 4 |
| Keys & Piano | 4 |
| Winds, Brass & Strings | 6 |
| Monitors, DI & Audio | 8 |
| Risers, Stands & Power | 7 |
| **Total** | **37** |
