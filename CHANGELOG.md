# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Automated tests for geometry, history coalescing, and export.
- Optional routing/deep links for workspaces.
- Project library with multiple saved plots.

## [0.1.0] — 2026-11-14

### Added

- Complete documentation set: `README.md`, `docs/USER-GUIDE.md`, `docs/ARCHITECTURE.md`, `docs/DATA-MODEL.md`, `docs/EQUIPMENT-CATALOG.md`, `docs/DEPLOYMENT.md`, `CONTRIBUTING.md`, and this changelog.
- GitHub Pages deployment workflow (`.github/workflows/deploy.yml`) that builds on push to `main` and publishes `dist/` with the official Pages actions.
- `package-lock.json` for reproducible `npm ci` installs.

### Changed

- Renamed the package from `react-example` to `stageplot-studio` and set version `0.1.0`.
- Set Vite `base` to `./` so the build works at a domain root or under a repository sub-path.
- Replaced `__dirname` with `import.meta.dirname` in `vite.config.ts` to match Vite's native config loader.
- Raised the `esbuild` dev dependency to `^0.28.0` to satisfy Vite 8's peer range and unblock `npm install`/`npm ci`.

### Fixed

- Dependency resolution failure (`ERESOLVE`) between the pinned `esbuild@0.25` and `vite@8.3`.

## [0.0.0] — 2026-11-14

### Added

- Initial StagePlot Studio application: React 19 + Vite + Tailwind 4 scaffold.
- Stage Plot workspace with a scaled SVG canvas, 37 equipment types across seven categories, drag-and-drop placement, move/rotate/resize, snapping and alignment guides, marquee selection, lock, z-order, and undo/redo.
- Equipment sidebar with search and collapsible categories; inspector for project, stage, and item properties.
- Input Patch workspace with manual channel editing, auto-generated channels from stage gear, monitor mix planning, channel badges, and CSV export.
- Printable technical rider with vector stage plot, input list, monitor mixes, contact and power notes, A4 print styles.
- PNG export with title block, JSON project save/import, `localStorage` autosave, dark/light theme, and five starting templates.
