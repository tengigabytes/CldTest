/**
 * system-settings-store.js — localStorage persistence for the EMU
 * system settings tree. Same flat-map pattern as mesh-config-store.
 */

import { SYSTEM_GROUPS } from './system-settings-data.js';

const STORAGE_KEY = 'mokya.system_settings.v1';

const DEFAULTS = new Map();
for (const f of allFields()) DEFAULTS.set(f.key, f.value);

let _saveTimer = null;

export function* allFields() {
  for (const k of Object.keys(SYSTEM_GROUPS)) {
    for (const f of SYSTEM_GROUPS[k].fields) yield f;
  }
}

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
  for (const f of allFields()) {
    if (Object.prototype.hasOwnProperty.call(map, f.key)) f.value = map[f.key];
  }
}

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

export function reset() {
  for (const f of allFields()) {
    if (DEFAULTS.has(f.key)) f.value = DEFAULTS.get(f.key);
  }
  try { window.localStorage?.removeItem(STORAGE_KEY); } catch (_) {}
}

load();
