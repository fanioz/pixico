# Pixico

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

A pixel-art icon generator for app stores — offline-first, store-ready exports.

Pixico is a single-file web app wrapped as a cross-platform desktop application using Tauri v2. Create pixel icons at 16×16, 24×24, or 32×32 resolution and export them ready for Google Play (512×512), Apple App Store (1024×1024), and Microsoft Store (MSIX). Works completely offline with vendored dependencies.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

## Background

Pixico was built for designers and developers who need pixel-perfect icons for app store submissions. Instead of configuring export pipelines or remembering store requirements, Pixico provides:

- Pre-tuned grid sizes (16/24/32px)
- Curated pixel palettes (Sweetie-16, PICO-8, Milk Tea, Game Boy)
- One-tap export to store-required dimensions
- Full offline operation with zero CDN dependencies

The app is distributed via Microsoft Store (Windows) and GitHub Releases (macOS DMG, Linux AppImage/deb).

## Install

### Windows

Install from the Microsoft Store: *[pending Store approval — will be linked after #9]*

### macOS

Download the latest `.dmg` from [GitHub Releases](https://github.com/fanioz/pixico/releases):

```sh
# Download the DMG, then drag Pixico.app to Applications
open Pixico_0.1.0_aarch64.dmg  # Apple Silicon
# or
open Pixico_0.1.0_x64.dmg      # Intel
```

*Note: Notarized DMG requires Apple Developer Program membership (#5). Current builds use ad-hoc signing.*

### Linux

Download the AppImage or `.deb` from [GitHub Releases](https://github.com/fanioz/pixico/releases):

```sh
# AppImage (universal)
chmod +x Pixico_0.1.0_amd64.AppImage
./Pixico_0.1.0_amd64.AppImage

# Debian/Ubuntu
sudo dpkg -i Pixico_0.1.0_amd64.deb
```

### Build from Source

Requires [Rust](https://rustup.rs/) and Node.js.

```sh
git clone https://github.com/fanioz/pixico.git
cd pixico
npm install
npx tauri build
```

Built binaries will be in `src-tauri/target/release/`.

## Usage

1. **Draw** — Choose a grid size (16/24/32px), pick a palette, and draw with pen/fill/shade tools
2. **Preview** — See live previews at Google Play (512×512), App Store (1024×1024), and home screen sizes
3. **Export** — Click "Download PNG" to save a 512×512 store-ready icon with 10% padding

The canvas supports:
- Click-drag to paint
- Right-click to erase
- Mirror mode for symmetrical designs
- Undo/redo (40-step history)
- Flood fill and shade darkening

All work autosaves locally during the session.

## Features

- **Store-true export** — One click generates Google Play 512×512, App Store 1024×1024, or Windows ICO
- **Pastel-first palettes** — Sweetie-16, Milk Tea, PICO-8, Game Boy palettes pre-loaded
- **Offline-first** — All dependencies (Tailwind, JSZip, fonts) are vendored; no network calls at runtime
- **Cross-platform** — Single codebase builds for Windows, macOS (arm64 + Intel), and Linux
- **Lightweight** — ~3–10 MB bundle size (Tauri v2 native webview)

## Contributing

Issues and pull requests are welcome. For questions or feature requests, [open an issue](https://github.com/fanioz/pixico/issues/new).

Before submitting a PR:
- Run `npx tauri build` to verify the build succeeds
- Test the app on your platform

See the [wayfinder map (#1)](https://github.com/fanioz/pixico/issues/1) for current development focus.

## License

UNLICENSED — no license file present in this repository.
