# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RTL-SDR (Software Defined Radio) project for macOS using the RTL2838UHIDIR USB dongle.

## Hardware

- **Device**: RTL2838UHIDIR (Realtek RTL2832U with R820T tuner)
- **Frequency Range**: 24 MHz - 1.7 GHz
- **Interface**: USB 2.0 (480 Mb/s)

## FM Radio App

A beautiful cross-platform FM Radio application built with Tauri + React + TypeScript.

### Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS v4
- **Backend**: Rust (Tauri)
- **Audio**: rtl_fm + sox

### Development Commands
```bash
cd fm-radio

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build production release
npm run tauri build
```

### Project Structure
```
fm-radio/
├── src/              # React frontend
│   ├── App.tsx       # Main UI component
│   └── App.css       # Tailwind + custom styles
├── src-tauri/        # Rust backend
│   ├── src/lib.rs    # Tauri commands (RTL-SDR control)
│   └── Cargo.toml    # Rust dependencies
└── package.json      # Node dependencies
```

## Command Line Tools

### Test RTL-SDR Device
```bash
rtl_test -t
```

### Listen to FM Radio (CLI)
```bash
rtl_fm -f 100.0M -M wbfm -s 200000 -r 48000 - | play -r 48000 -t raw -e s -b 16 -c 1 -V1 -
```

## Troubleshooting

### "Device claimed by another instance" Error
```bash
pkill -9 -f rtl_fm
pkill -9 -f rtl_test
pkill -9 -f sdrpp
```
