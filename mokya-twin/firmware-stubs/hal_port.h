/**
 * hal_port.h — IHalPort: Stable C interface between MIE core and platform.
 *
 * This header defines the function-pointer struct that decouples mie_core.c
 * from any specific hardware.  Three implementations exist:
 *
 *   1. RP2350 firmware  — pico_sdk alarm/GPIO/flash calls
 *   2. JS Digital Twin  — WASM env imports satisfied by mie-hal.js
 *   3. Unit tests       — stub implementations in test harness
 *
 * IMPORTANT: Do not add fields here without updating all three implementations
 *            AND the Emscripten env imports table in WASM_BUILD_GUIDE.md.
 *
 * Binary layout is NOT ABI-stable across compilers; always pass by pointer.
 */

#ifndef MIE_HAL_PORT_H
#define MIE_HAL_PORT_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ── Alarm handle (opaque uint32) ───────────────────────────────── */
typedef uint32_t mie_alarm_id_t;
#define MIE_ALARM_INVALID  UINT32_MAX

/* ── Alarm callback ─────────────────────────────────────────────── */
typedef void (*mie_alarm_cb_t)(mie_alarm_id_t id, void *user_data);

/* ── MIE event types (matches JS CustomEvent type strings) ─────── */
typedef enum {
    MIE_EVT_COMPOSITION_UPDATE = 0x01,
    MIE_EVT_COMPOSITION_COMMIT = 0x02,
    MIE_EVT_MODE_CHANGE        = 0x03,
    MIE_EVT_ACTION_ENTER       = 0x04,
    MIE_EVT_ACTION_DELETE      = 0x05,
    MIE_EVT_CURSOR_MOVE        = 0x06,
} mie_event_type_t;

/**
 * IHalPort — platform services required by mie_core.c.
 *
 * All function pointers must be non-NULL before calling mie_init().
 */
typedef struct MIE_HalPort {
    /**
     * Return milliseconds since boot (wraps at 2^32 after ~49 days).
     * RP2350: to_ms_since_boot(get_absolute_time())
     * JS:     () => performance.now() | 0
     */
    uint32_t (*get_tick_ms)(void);

    /**
     * Schedule a one-shot alarm.
     * @param  ms        delay in milliseconds
     * @param  cb        callback (called from MIE tick, not IRQ)
     * @param  user_data opaque pointer passed back to cb
     * @return alarm id, or MIE_ALARM_INVALID on failure
     *
     * RP2350: add_alarm_in_ms(ms, _alarm_shim, ctx, true)
     * JS:     setTimeout wrapper in MIE_Timer
     */
    mie_alarm_id_t (*add_alarm_in_ms)(uint32_t ms,
                                      mie_alarm_cb_t cb,
                                      void *user_data);

    /**
     * Cancel a previously scheduled alarm.
     * @param  id  alarm id returned by add_alarm_in_ms
     * @return true if cancelled before it fired
     *
     * RP2350: cancel_alarm(id)
     * JS:     clearTimeout wrapper in MIE_Timer
     */
    bool (*cancel_alarm)(mie_alarm_id_t id);

    /**
     * Flush a rectangle of RGB565 pixels to the display.
     * Signature matches LVGL lv_display_flush_cb_t.
     *
     * @param x1,y1  top-left pixel (inclusive)
     * @param x2,y2  bottom-right pixel (inclusive)
     * @param buf    pointer to (x2-x1+1)*(y2-y1+1) uint16_t RGB565 values
     *
     * RP2350: ili9341_flush() via SPI DMA
     * JS:     DisplayHAL.flush() writes to Canvas 2D ImageData
     */
    void (*display_flush)(int16_t x1, int16_t y1,
                          int16_t x2, int16_t y2,
                          const uint16_t *buf);

    /**
     * Read bytes from RP2350 XIP Flash.
     * Used to stream the phonetic Trie binary blob.
     *
     * @param offset  byte offset from start of trie blob
     * @param buf     destination buffer
     * @param len     bytes to read
     * @return 0 on success, negative errno on error
     *
     * RP2350: memcpy from XIP region (0x10080000 + offset)
     * JS:     reads from pre-loaded ArrayBuffer in MIE_Timer
     */
    int (*flash_read)(uint32_t offset, uint8_t *buf, size_t len);

    /**
     * Emit a structured event to the host layer.
     * In JS Digital Twin this dispatches a CustomEvent on MIE_Bridge.
     *
     * @param type     mie_event_type_t
     * @param payload  JSON-encoded UTF-8 string (null-terminated)
     * @param len      byte length of payload (not including null terminator)
     *
     * RP2350: posts to FreeRTOS event queue
     * JS:     MIE_Bridge._emit() via Emscripten env import
     */
    void (*emit_event)(uint8_t type,
                       const uint8_t *payload,
                       size_t len);

    /**
     * Optional: write a null-terminated debug string.
     * Pass NULL to disable debug output.
     *
     * RP2350: printf() / UART
     * JS:     console.log
     */
    void (*debug_log)(const char *msg);

} MIE_HalPort;

#ifdef __cplusplus
}
#endif

#endif /* MIE_HAL_PORT_H */
