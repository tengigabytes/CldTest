/**
 * system-settings-data.js — host-/EMU-level settings, distinct from
 * `mesh-settings-data.js` which mirrors the firmware Config protobuf.
 *
 * These are knobs that control the device-as-experienced-by-the-user
 * (display brightness, IME multi-tap timing, language, debug, etc.).
 * Same shape as mesh-settings so SettingsListScreen + FieldEditScreen
 * can render and edit them without changes.
 *
 * Persistence is wired separately (system-settings-store.js) — same
 * key/value flat-map pattern as mesh-config-store.
 */

function f(key, label, type, value, extra = {}) {
  return { key, label, type, value, ...extra };
}

export const SYSTEM_GROUPS = {
  display: {
    title: '顯示',
    fields: [
      f('emu.display.brightness',         '亮度 (0–255)',      'int',   255, { unit: '/255' }),
      f('emu.display.screen_on_secs',     '亮屏秒數',           'int',    60, { unit: 's' }),
      f('emu.display.flip',                '螢幕翻轉',           'bool', false),
      f('emu.display.invert',              '反色',               'bool', false),
      f('emu.display.scanlines',           '掃描線特效',         'bool',  true),
      f('emu.display.show_serial_log',     '顯示序列 log',       'bool', false),
    ],
  },

  ime: {
    title: '輸入法',
    fields: [
      f('emu.ime.default_mode',     '預設模式',         'enum', '中', { options: ['中','EN','ABC','數字'] }),
      f('emu.ime.multi_tap_ms',     'Multi-tap 視窗',   'int',  300, { unit: 'ms' }),
      f('emu.ime.long_press_ms',    'Long-press 觸發',  'int',  500, { unit: 'ms' }),
      f('emu.ime.candidate_page',   '候選翻頁鍵',       'enum', 'UP/DOWN', { options: ['UP/DOWN','TAB','LEFT/RIGHT'] }),
      f('emu.ime.show_pinyin',      'Zhuyin 顯示拼音',  'bool', false),
      f('emu.ime.persist_lru',      '記憶最近選字',     'bool', true),
    ],
  },

  language: {
    title: '語言',
    fields: [
      f('emu.lang.ui',              'UI 語言',          'enum', 'zh-TW', { options: ['zh-TW','zh-CN','en-US','ja-JP'] }),
      f('emu.lang.message_locale',  '訊息語系',         'enum', 'zh-TW', { options: ['zh-TW','zh-CN','en-US','ja-JP'] }),
      f('emu.lang.units',           '單位',             'enum', 'METRIC', { options: ['METRIC','IMPERIAL'] }),
      f('emu.lang.time_format',     '時間格式',         'enum', '24h', { options: ['24h','12h'] }),
    ],
  },

  audio: {
    title: '提示音',
    fields: [
      f('emu.audio.key_click',      '按鍵聲',           'bool', true),
      f('emu.audio.message_alert',  '訊息提醒音',       'bool', true),
      f('emu.audio.charge_alert',   '充電提示',         'bool', false),
      f('emu.audio.volume',         '音量',             'int',   60, { unit: '%' }),
      f('emu.audio.haptic',         '震動',             'bool', false),
    ],
  },

  power: {
    title: '電源',
    fields: [
      f('emu.power.auto_sleep_secs',   '自動休眠',          'int',  300, { unit: 's' }),
      f('emu.power.deep_sleep_secs',   '深度休眠',          'int', 1800, { unit: 's' }),
      f('emu.power.shutdown_pct',      '低電量關機',         'int',    5, { unit: '%' }),
      f('emu.power.warn_pct',          '低電量警告',         'int',   15, { unit: '%' }),
      f('emu.power.show_estimate',     '顯示剩餘時間',       'bool', true),
    ],
  },

  debug: {
    title: '除錯',
    fields: [
      f('emu.debug.show_fps',         '顯示 FPS',           'bool', false),
      f('emu.debug.show_keypress',    '顯示按鍵事件',       'bool', false),
      f('emu.debug.serial_log_level', 'Serial log 等級',    'enum', 'INFO', { options: ['ERROR','WARN','INFO','DEBUG','TRACE'] }),
      f('emu.debug.dump_protobuf',    '匯出 protobuf',      'bool', false),
    ],
  },

  about: {
    title: '關於',
    fields: [
      f('emu.about.firmware_version', 'Firmware',         'string', '2.7.8 (mock)'),
      f('emu.about.emu_version',      'EMU 版本',          'string', '0.1.0 (dev)'),
      f('emu.about.hw_model',         '硬體型號',           'string', 'MOKYA_LORA Rev A'),
      f('emu.about.build_date',       '建置日期',           'string', '2026-04-25'),
      f('emu.about.repo',             'Repo',             'string', 'tengigabytes/MokyaLora_EMU'),
      f('emu.about.canvas',           'Canvas',           'string', '320×240 landscape'),
      f('emu.about.font',             '字型',               'string', 'GNU Unifont 16 px'),
    ],
  },
};

export const SYSTEM_MENU = [
  { kind: 'group', key: 'display',  label: '顯示' },
  { kind: 'group', key: 'ime',      label: '輸入法' },
  { kind: 'group', key: 'language', label: '語言' },
  { kind: 'group', key: 'audio',    label: '提示音' },
  { kind: 'group', key: 'power',    label: '電源' },
  { kind: 'group', key: 'debug',    label: '除錯' },
  { kind: 'group', key: 'about',    label: '關於' },
  { kind: 'reset', label: '重置為預設' },
];
