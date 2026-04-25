/**
 * mesh-config-store.js — localStorage persistence for the Meshtastic
 * settings tree.
 *
 * The store is a flat map of `field.key → value`. On load() it walks
 * every field in CONFIG_GROUPS / MODULE_GROUPS / CHANNELS and overwrites
 * field.value when the key is present in the saved map. save() goes the
 * other way. reset() clears storage and reloads the original defaults
 * captured at module import.
 */

import { CONFIG_GROUPS, MODULE_GROUPS, CHANNELS } from './mesh-settings-data.js';

const STORAGE_KEY = 'mokya.mesh_config.v1';

// Snapshot factory defaults BEFORE any load() runs so reset() has them.
const DEFAULTS = new Map();
for (const f of allFields()) DEFAULTS.set(f.key, f.value);

let _saveTimer = null;

/** Iterate every editable field across the whole tree. */
export function* allFields() {
  for (const k of Object.keys(CONFIG_GROUPS)) {
    for (const f of CONFIG_GROUPS[k].fields) yield f;
  }
  for (const k of Object.keys(MODULE_GROUPS)) {
    for (const f of MODULE_GROUPS[k].fields) yield f;
  }
  for (const ch of CHANNELS) {
    for (const f of ch.fields) yield f;
  }
}

/** Apply any persisted edits onto the live registry. Idempotent. */
export function load() {
  let json;
  try { json = window.localStorage?.getItem(STORAGE_KEY); }
  catch (_) { return; }
  if (!json) return;
  let map;
  try { map = JSON.parse(json); }
  catch (_) {
    try { window.localStorage?.removeItem(STORAGE_KEY); } catch (_) {}
    return;
  }
  if (!map || typeof map !== 'object') return;
  let n = 0;
  for (const f of allFields()) {
    if (Object.prototype.hasOwnProperty.call(map, f.key)) {
      f.value = map[f.key];
      n++;
    }
  }
  if (n > 0) console.log(`[mesh-config-store] restored ${n} field(s)`);
}

/** Persist the current registry. Coalesces bursts via a 250 ms debounce. */
export function save() {
  if (_saveTimer != null) return;
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    saveNow();
  }, 250);
}

export function saveNow() {
  const map = {};
  for (const f of allFields()) map[f.key] = f.value;
  try { window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(map)); }
  catch (_) {}
}

/** Reset every field back to its module-import default and clear storage. */
export function reset() {
  for (const f of allFields()) {
    if (DEFAULTS.has(f.key)) f.value = DEFAULTS.get(f.key);
  }
  try { window.localStorage?.removeItem(STORAGE_KEY); } catch (_) {}
}

// Auto-load on first import so the registry is restored before any
// settings screen reads it.
load();
