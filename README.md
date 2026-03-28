# MokyaLora_EMU

MokyaLora Digital Twin — browser-based emulator and PWA simulator for the MokyaLora LoRa/Meshtastic handheld device (RP2350 + ILI9341 + 6×6 Zhuyin keyboard).

Live demo: https://tengigabytes.github.io/MokyaLora_EMU/

## Quick Start

```bash
# Serve locally (required for ES modules + Service Worker)
npx serve mokya-twin
# or
python3 -m http.server -d mokya-twin 8080
# Open in Chrome: http://localhost:8080
```

## Repository Layout

```
mokya-twin/     Browser PWA simulator (HTML/CSS/JS)
MokyaLora/      Firmware submodule (RP2350 C source)
```

See [`mokya-twin/ROADMAP.md`](mokya-twin/ROADMAP.md) for the full development roadmap.