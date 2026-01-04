# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RTL-SDR (Software Defined Radio) project for macOS using the RTL2838UHIDIR USB dongle.

## Hardware

- **Device**: RTL2838UHIDIR (Realtek RTL2832U with R820T tuner)
- **Frequency Range**: 24 MHz - 1.7 GHz
- **Interface**: USB 2.0 (480 Mb/s)

## Installed Tools

### Command Line
- `librtlsdr` - RTL-SDR drivers and utilities (via Homebrew)
- `sox` - Audio processing and playback

### GUI Application
- **SDR++** v1.2.1 (nightly) - Located at `/Applications/SDR++.app`

## Common Commands

### Test RTL-SDR Device
```bash
rtl_test -t
```

### Listen to FM Radio (Command Line)
```bash
rtl_fm -f 100.0M -M wbfm -s 200000 -r 48000 - | play -r 48000 -t raw -e s -b 16 -c 1 -V1 -
```
- Replace `100.0M` with desired frequency (FM: 88-108 MHz)

### Launch SDR++ GUI
```bash
open /Applications/SDR++.app
```

## Troubleshooting

### "Device claimed by another instance" Error
Kill processes holding the device before launching SDR++:
```bash
pkill -9 -f rtl_fm
pkill -9 -f rtl_test
pkill -9 -f sdrpp
```

### SDR++ No Audio
1. Select **RTL-SDR** as source (top-left dropdown)
2. Click Play button
3. Set Radio mode to **WFM** for FM stations
4. In Audio section, select **Built-in Output**
