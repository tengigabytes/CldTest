# MokyaLora Digital Twin — WASM Build Guide

Phase 4 replaces the JavaScript MIE state machine with `mie_core.wasm`,
compiled from `firmware/mie/mie_core.c` via Emscripten.

The JS/WASM boundary is defined by two headers:
- `firmware-stubs/hal_port.h` — imports (JS → WASM)
- `firmware-stubs/mie_wasm_api.h` — exports (WASM → JS)

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| emsdk | ≥ 3.1.50 | `git clone https://github.com/emscripten-core/emsdk` |
| CMake | ≥ 3.20 | `brew install cmake` / `apt install cmake` |
| Python 3 | ≥ 3.10 | for `tools/build-dict.py` |

```bash
# Install and activate emsdk
cd ~/emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh        # or add to ~/.zshrc / ~/.bashrc

# Verify
emcc --version               # should print 3.x.x
```

---

## Building mie_core.wasm

```bash
# From repo root (tengigabytes/CldTest or tengigabytes/MokyaLora)
source ~/emsdk/emsdk_env.sh

cd mokya-twin

emcmake cmake \
    -S firmware-stubs \
    -B build-wasm \
    -DCMAKE_BUILD_TYPE=Release

cmake --build build-wasm --target mie_core

# Output: mokya-twin/wasm/mie_core.wasm (copied by post-build hook)
ls -lh wasm/mie_core.wasm
```

For a debug build (enables heap safety checks):

```bash
emcmake cmake \
    -S firmware-stubs \
    -B build-wasm-debug \
    -DCMAKE_BUILD_TYPE=Debug

cmake --build build-wasm-debug --target mie_core
```

---

## WASM Imports (env object)

`mie-hal.js` must provide these functions to `WebAssembly.instantiate()`:

| Import name | Signature | Description |
|-------------|-----------|-------------|
| `get_tick_ms` | `() → i32` | Milliseconds since page load |
| `display_flush` | `(i32 x1, i32 y1, i32 x2, i32 y2, i32 ptr) → void` | RGB565 rect flush |
| `flash_read` | `(i32 offset, i32 bufPtr, i32 len) → i32` | Trie blob read |
| `emit_event` | `(i32 type, i32 payloadPtr, i32 len) → void` | MIE event relay |
| `abort` | `(i32 msgPtr) → void` | Fatal error handler |

Implementation in `mie-hal.js`:

```javascript
const imports = {
  env: {
    get_tick_ms: () => this._timer.getTickMs(),

    display_flush: (x1, y1, x2, y2, colorBufPtr) => {
      const w = x2 - x1 + 1, h = y2 - y1 + 1;
      const rgb565 = new Uint16Array(this._wasm.memory.buffer, colorBufPtr, w * h);
      this._emit('wasm:display_flush', { x1, y1, x2, y2, rgb565 });
    },

    flash_read: (offset, bufPtr, len) => {
      const src  = new Uint8Array(this._trieBlob, offset, len);
      const dest = new Uint8Array(this._wasm.memory.buffer, bufPtr, len);
      dest.set(src);
      return 0; // success
    },

    emit_event: (type, payloadPtr, len) => {
      const bytes   = new Uint8Array(this._wasm.memory.buffer, payloadPtr, len);
      const payload = new TextDecoder().decode(bytes);
      try {
        const detail = JSON.parse(payload);
        this._emit(_EVENT_NAMES[type] ?? 'wasm:event', detail);
      } catch {}
    },

    abort: (msgPtr) => {
      const msg = this._readCString(msgPtr);
      throw new Error(`[WASM] abort: ${msg}`);
    },
  }
};
```

---

## WASM Exports

After instantiation, call these from `mie-hal.js`:

```javascript
const wasm = instance.exports;

// Boot
wasm.mie_init();

// Load trie (fetch the binary blob first)
const trieBlob = await (await fetch('./data/zhuyin.bin')).arrayBuffer();
const ptr = wasm.malloc(trieBlob.byteLength);
new Uint8Array(wasm.memory.buffer, ptr, trieBlob.byteLength)
    .set(new Uint8Array(trieBlob));
const nodeCount = wasm.mie_trie_load_blob(ptr, trieBlob.byteLength);
wasm.free(ptr);
console.log('[MIE WASM] trie nodes:', nodeCount);

// Key input
wasm.mie_process_key(row, col, 2 /* MIE_KEY_TAP */);

// Candidate selection
wasm.mie_select_candidate(idx);

// rAF tick (call every frame)
wasm.mie_tick(performance.now() | 0);
```

---

## Trie Binary Format

`tools/build-dict.py` converts `data/zhuyin-full.json` to a compact binary
that `mie_trie.c` can `mmap`-style stream from Flash.

```
Header (8 bytes):
  uint32_t magic    = 0x4D494554  ('MIET')
  uint32_t version  = 2
  uint32_t n_nodes
  uint32_t n_entries

Node (12 bytes each):
  uint8_t  phoneme[4]   — UTF-8 (zero-padded)
  uint16_t child_idx    — index of first child node (0 = leaf)
  uint16_t sibling_idx  — index of next sibling (0 = last)
  uint16_t entry_idx    — index into string table (0 = no entry here)
  uint16_t reserved

String table:
  Pascal strings: uint8_t len, uint8_t data[len] (UTF-8)
```

Build:

```bash
python3 tools/build-dict.py \
    --input  data/zhuyin-full.json \
    --output data/zhuyin.bin \
    --stats

# Output: data/zhuyin.bin (~120 KB for 10,000 entry dict)
```

---

## Activating WASM in MIE_Bridge

When `mie_core.wasm` is present, `loadWasm()` succeeds and sets
`_useWasm = true`. No changes to any screen code are required — the
`MIE_Bridge` public API is identical in both modes.

```javascript
// In app.js (already wired):
mie.loadWasm('./wasm/mie_core.wasm').catch(() => {});
// Silently falls back to JS if .wasm is absent.
```

To verify WASM is active, check the Settings screen: the MIE row shows
`啟用` instead of `JS Fallback`.

---

## SharedArrayBuffer (Zero-copy Frame Buffer)

For the display flush to use a shared memory buffer between JS and WASM,
the server must send COOP/COEP headers.

**GitHub Pages** does not support custom headers. Use Cloudflare Pages with
a `_headers` file:

```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

Or self-host with nginx:

```nginx
add_header Cross-Origin-Opener-Policy "same-origin";
add_header Cross-Origin-Embedder-Policy "require-corp";
```

Enable in CMake by uncommenting `-sUSE_PTHREADS=1 -sSHARED_MEMORY=1` and
rebuilding.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `TypeError: WebAssembly.instantiate` | Browser blocked WASM | Serve via HTTPS or localhost |
| `LinkError: import env.xxx missing` | Import table mismatch | Compare WASM imports with this guide |
| WASM loads but MIE silent | `mie_init()` not called | Check `loadWasm()` calls `this._wasm.mie_init()` |
| `abort: OOM` | Memory too small | Increase `-sINITIAL_MEMORY` in CMakeLists_wasm.txt |
| Garbled display flush | Endianness issue | RGB565 is little-endian on both RP2350 and x86 — check Canvas ImageData conversion |
