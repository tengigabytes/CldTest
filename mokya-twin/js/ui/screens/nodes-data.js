/**
 * nodes-data.js — mock NodeInfo registry mirrored on Meshtastic's
 * `meshtastic.NodeInfo` protobuf + the fields surfaced by the
 * `meshtastic --nodes` CLI:
 *
 *   num, user.{id,long_name,short_name,macaddr,hw_model,is_licensed,
 *              public_key,role},
 *   position.{lat_i,lon_i,alt,time,location_source,
 *             precision_bits,sats_in_view},
 *   snr,
 *   last_heard,
 *   device_metrics.{battery_level,voltage,channel_utilization,
 *                   air_util_tx,uptime_seconds},
 *   channel, via_mqtt, hops_away, is_favorite, is_ignored
 *
 * Mutating fields in place is OK — this is a singleton registry shared
 * across NodesScreen + NodeDetailScreen.
 */

const HW_MODELS = [
  'MOKYA_LORA','HELTEC_V3','TBEAM','TLORA_T3_S3','RAK4631','PORTDUINO',
  'STATION_G2','TRACKER_T1000_E','HELTEC_WIRELESS_PAPER','UNSET'
];
const ROLES = [
  'CLIENT','CLIENT_MUTE','ROUTER','ROUTER_CLIENT','REPEATER',
  'TRACKER','SENSOR','TAK','CLIENT_HIDDEN','LOST_AND_FOUND','TAK_TRACKER'
];

export const NODES = [
  {
    num: 0xa1b2c3d4,
    user: {
      id:           '!a1b2c3d4',
      long_name:    'BM-7388',
      short_name:   'BM73',
      macaddr:      'A1:B2:C3:D4:55:66',
      hw_model:     'TBEAM',
      is_licensed:  false,
      public_key:   'eFw8Yc...kG3==',
      role:         'CLIENT',
    },
    position: {
      lat_i: 250330000, lon_i: 1215654000, alt: 142,
      time: '09:14',  location_source: 'INTERNAL', precision_bits: 14, sats_in_view: 9,
    },
    snr: 4.2,
    last_heard: '2 分鐘前',
    rssi: -82,
    device_metrics: {
      battery_level: 78, voltage: 4020,
      channel_utilization: 12.4, air_util_tx: 2.1, uptime_seconds: 86400,
    },
    channel:      0,
    via_mqtt:     false,
    hops_away:    1,
    is_favorite:  true,
    is_ignored:   false,
  },
  {
    num: 0xaabbccdd,
    user: {
      id: '!aabbccdd', long_name: 'VK2-101', short_name: 'VK21',
      macaddr: 'AA:BB:CC:DD:EE:FF', hw_model: 'HELTEC_V3', is_licensed: true,
      public_key: 'PqLm3...x9R==', role: 'CLIENT',
    },
    position: {
      lat_i: -337000000, lon_i: 1512000000, alt: 25,
      time: '09:12',  location_source: 'EXTERNAL', precision_bits: 12, sats_in_view: 7,
    },
    snr: 1.8, last_heard: '8 分鐘前', rssi: -98,
    device_metrics: {
      battery_level: 64, voltage: 3850,
      channel_utilization: 18.0, air_util_tx: 4.7, uptime_seconds: 432000,
    },
    channel: 0, via_mqtt: false, hops_away: 3,
    is_favorite: false, is_ignored: false,
  },
  {
    num: 0x11223344,
    user: {
      id: '!11223344', long_name: 'JA1-Mokya', short_name: 'JA1M',
      macaddr: '11:22:33:44:55:66', hw_model: 'MOKYA_LORA', is_licensed: false,
      public_key: 'KkAa9...mP2==', role: 'CLIENT',
    },
    position: {
      lat_i: 357000000, lon_i: 1397000000, alt: 65,
      time: '09:08',  location_source: 'INTERNAL', precision_bits: 14, sats_in_view: 11,
    },
    snr: 5.5, last_heard: '12 分鐘前', rssi: -76,
    device_metrics: {
      battery_level: 92, voltage: 4150,
      channel_utilization: 8.5, air_util_tx: 1.0, uptime_seconds: 200000,
    },
    channel: 0, via_mqtt: false, hops_away: 2,
    is_favorite: false, is_ignored: false,
  },
  {
    num: 0xdeadbeef,
    user: {
      id: '!deadbeef', long_name: 'KH-Roam', short_name: 'KHRO',
      macaddr: 'DE:AD:BE:EF:00:01', hw_model: 'TRACKER_T1000_E', is_licensed: false,
      public_key: 'ZzXx0...vN1==', role: 'TRACKER',
    },
    position: {
      lat_i: 220000000, lon_i: 1145000000, alt: 8,
      time: '08:00',  location_source: 'INTERNAL', precision_bits: 10, sats_in_view: 4,
    },
    snr: -2.3, last_heard: '1 小時前', rssi: -110,
    device_metrics: {
      battery_level: 30, voltage: 3700,
      channel_utilization: 6.0, air_util_tx: 0.4, uptime_seconds: 18000,
    },
    channel: 0, via_mqtt: true, hops_away: 5,
    is_favorite: false, is_ignored: false,
  },
  {
    num: 0xc0ffee01,
    user: {
      id: '!c0ffee01', long_name: 'TW-Hsinchu', short_name: 'HSCU',
      macaddr: 'C0:FF:EE:01:00:00', hw_model: 'TLORA_T3_S3', is_licensed: false,
      public_key: 'WeRt4...uH8==', role: 'ROUTER',
    },
    position: {
      lat_i: 247800000, lon_i: 1209600000, alt: 96,
      time: '07:00',  location_source: 'INTERNAL', precision_bits: 14, sats_in_view: 8,
    },
    snr: 3.0, last_heard: '2 小時前', rssi: -88,
    device_metrics: {
      battery_level: 55, voltage: 3920,
      channel_utilization: 24.0, air_util_tx: 6.2, uptime_seconds: 1209600,
    },
    channel: 0, via_mqtt: false, hops_away: 2,
    is_favorite: false, is_ignored: false,
  },
  {
    num: 0xc0ffee02,
    user: {
      id: '!c0ffee02', long_name: 'TW-Tainan', short_name: 'TNAN',
      macaddr: 'C0:FF:EE:02:00:00', hw_model: 'TLORA_T3_S3', is_licensed: false,
      public_key: 'YuIo5...nM9==', role: 'CLIENT',
    },
    position: {
      lat_i: 230000000, lon_i: 1202000000, alt: 12,
      time: '昨天', location_source: 'INTERNAL', precision_bits: 14, sats_in_view: 6,
    },
    snr: 0.4, last_heard: '昨天', rssi: -103,
    device_metrics: {
      battery_level: 41, voltage: 3760,
      channel_utilization: 14.0, air_util_tx: 3.0, uptime_seconds: 600000,
    },
    channel: 0, via_mqtt: false, hops_away: 4,
    is_favorite: false, is_ignored: false,
  },
  {
    num: 0xc0ffee03,
    user: {
      id: '!c0ffee03', long_name: 'TW-Hualien', short_name: 'HLEN',
      macaddr: 'C0:FF:EE:03:00:00', hw_model: 'STATION_G2', is_licensed: false,
      public_key: '(unknown)', role: 'CLIENT_MUTE',
    },
    position: {
      lat_i: 0, lon_i: 0, alt: 0,
      time: '—', location_source: 'UNSET', precision_bits: 0, sats_in_view: 0,
    },
    snr: null, last_heard: '3 天前', rssi: null,
    device_metrics: {
      battery_level: 12, voltage: 3500,
      channel_utilization: 0, air_util_tx: 0, uptime_seconds: 0,
    },
    channel: 0, via_mqtt: false, hops_away: 7,
    is_favorite: false, is_ignored: true,
  },
];

export const HW_MODEL_OPTIONS = HW_MODELS;
export const ROLE_OPTIONS     = ROLES;

/** Build the read-only NodeInfo field list rendered in the 資訊 tab. */
export function buildNodeInfoFields(n) {
  const u  = n.user;
  const p  = n.position;
  const m  = n.device_metrics;
  return [
    { label: 'ID',                value: u.id },
    { label: '長名稱',             value: u.long_name },
    { label: '短名稱',             value: u.short_name },
    { label: '硬體型號',           value: u.hw_model },
    { label: '角色',               value: u.role },
    { label: 'HAM 認證',           value: u.is_licensed ? '是' : '否' },
    { label: 'MAC',               value: u.macaddr },
    { label: '公鑰',               value: u.public_key },
    { label: '緯度',               value: p.lat_i ? (p.lat_i / 1e7).toFixed(5) + '°' : '—' },
    { label: '經度',               value: p.lon_i ? (p.lon_i / 1e7).toFixed(5) + '°' : '—' },
    { label: '海拔',               value: p.alt ? `${p.alt} m` : '—' },
    { label: '位置來源',           value: p.location_source },
    { label: '位置精度 bits',       value: String(p.precision_bits) },
    { label: '可見衛星',           value: String(p.sats_in_view) },
    { label: 'RSSI',               value: n.rssi === null ? '—' : `${n.rssi} dBm` },
    { label: 'SNR',                value: n.snr === null  ? '—' : `${n.snr > 0 ? '+' : ''}${n.snr.toFixed(1)} dB` },
    { label: 'Hops',               value: String(n.hops_away) },
    { label: '頻道',               value: String(n.channel) },
    { label: 'via MQTT',           value: n.via_mqtt ? '是' : '否' },
    { label: '電量',               value: `${m.battery_level}%` },
    { label: '電壓',               value: `${(m.voltage / 1000).toFixed(2)} V` },
    { label: '頻道使用率',         value: `${m.channel_utilization.toFixed(1)}%` },
    { label: 'Air util TX',        value: `${m.air_util_tx.toFixed(1)}%` },
    { label: '運行時間',           value: formatUptime(m.uptime_seconds) },
    { label: '最後聽到',           value: n.last_heard },
    { label: '時間戳',             value: p.time },
    { label: '最愛',               value: n.is_favorite ? '★ 是' : '☆ 否' },
    { label: '忽略',               value: n.is_ignored  ? '✓ 是' : '— 否' },
  ];
}

function formatUptime(secs) {
  if (!secs) return '—';
  const d = (secs / 86400) | 0;
  const h = ((secs % 86400) / 3600) | 0;
  const m = ((secs % 3600) / 60) | 0;
  if (d > 0) return `${d}天 ${h}小時`;
  if (h > 0) return `${h}小時 ${m}分`;
  return `${m}分`;
}

/** Action catalogue mirrored on `meshtastic --ping/--traceroute/...`. */
export const NODE_ACTIONS = [
  { id: 'send-dm',     label: '發送私訊',     hint: '對此節點開啟私訊' },
  { id: 'ping',        label: 'Ping',        hint: '送出 PING 並等待 ACK' },
  { id: 'traceroute',  label: 'Traceroute',  hint: '回報 mesh 路由' },
  { id: 'req-pos',     label: '請求位置',     hint: '請求最新位置回報' },
  { id: 'req-tel',     label: '請求遙測',     hint: '請求 device_metrics' },
  { id: 'toggle-fav',  label: '切換最愛',     hint: '加入/移出收藏' },
  { id: 'toggle-ign',  label: '切換忽略',     hint: '加入/移出忽略清單' },
  { id: 'remove',      label: '移除節點',     hint: '從 NodeDB 刪除' },
];
