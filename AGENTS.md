# AGENTS.md

Pixico is a single-file HTML app (`src/index.html`) that generates and converts pixel-art icons ready for app-store release (Google Play 512×512, Apple App Store 1024×1024, Microsoft Store / MSIX). It ships as a desktop app: `src/` is the Tauri frontend (vendored for full offline use, see CONTEXT.md under Aset ter-vendor) and `src-tauri/` is the Tauri v2 wrapper. Build with `npx tauri build`.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: one `CONTEXT.md` plus `docs/adr/` at the repo root. See `docs/agents/domain.md`.
