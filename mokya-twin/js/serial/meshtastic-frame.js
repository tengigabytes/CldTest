/**
 * meshtastic-frame.js — Meshtastic FromRadio decoder + minimal ToRadio
 * encoders. Field numbers verified against meshtastic/protobufs @ main:
 *   src/meshtastic/mesh.proto      (FromRadio, ToRadio, NodeInfo, User,
 *                                   Position, MyNodeInfo, Channel)
 *   src/meshtastic/telemetry.proto (DeviceMetrics)
 *
 * Only the fields the EMU surfaces are decoded; everything else is
 * skipped silently.
 *
 * Wire framing (separate concern, in meshtastic-serial.js):
 *   0x94 0xC3 [len_msb] [len_lsb] [protobuf_FromRadio]
 */

import {
  forEachField, readVarint, readI32, readFloat, readString,
  writeVarintField, writeLenDelim,
} from './protobuf.js';

// ── FromRadio top-level ──────────────────────────────────────
export function decodeFromRadio(bytes) {
  const out = {};
  forEachField(bytes, (fn, wt, v) => {
    switch (fn) {
      case 1:  out.packet            = decodeMeshPacket(v);   break;
      case 3:  out.myInfo            = decodeMyNodeInfo(v);   break;
      case 4:  out.nodeInfo          = decodeNodeInfo(v);     break;
      case 5:  out.config            = decodeConfig(v);       break;
      case 7:  out.configCompleteId  = v;                     break;
      case 8:  out.rebooted          = v !== 0;               break;
      case 10: out.channel           = decodeChannel(v);      break;
      case 11: out.queueStatus       = decodeQueueStatus(v);  break;
      case 13: out.metadata          = decodeMetadata(v);     break;
    }
  });
  return out;
}

// ── MyNodeInfo ───────────────────────────────────────────────
function decodeMyNodeInfo(buf) {
  const o = {};
  forEachField(buf, (fn, wt, v) => {
    switch (fn) {
      case 1: o.myNodeNum     = v; break;
      case 4: o.rebootCount   = v; break;
      case 6: o.minAppVersion = v; break;
      case 7: o.deviceId      = readString(v); break;
      case 8: o.pioEnv        = readString(v); break;
    }
  });
  return o;
}

// ── NodeInfo ────────────────────────────────────────────────
function decodeNodeInfo(buf) {
  const o = {};
  forEachField(buf, (fn, wt, v) => {
    switch (fn) {
      case 1:  o.num            = v; break;
      case 4:  o.user           = decodeUser(v);     break;
      case 5:  o.position       = decodePosition(v); break;
      case 7:  o.snr            = readFloat(v);      break;
      case 8:  o.lastHeard      = v;                 break;
      case 9:  o.deviceMetrics  = decodeDeviceMetrics(v); break;
      case 10: o.channel        = v;                 break;
      case 11: o.viaMqtt        = v !== 0;           break;
      case 12: o.hopsAway       = v;                 break;
      case 13: o.isFavorite     = v !== 0;           break;
      case 14: o.isIgnored      = v !== 0;           break;
    }
  });
  return o;
}

function decodeUser(buf) {
  const o = {};
  forEachField(buf, (fn, wt, v) => {
    switch (fn) {
      case 1: o.id          = readString(v); break;
      case 2: o.longName    = readString(v); break;
      case 3: o.shortName   = readString(v); break;
      case 4: o.macaddr     = bytesToHex(v); break;
      case 5: o.hwModel     = v;             break;
      case 6: o.isLicensed  = v !== 0;       break;
      case 7: o.role        = v;             break;
      case 8: o.publicKey   = bytesToHex(v); break;
    }
  });
  return o;
}

function decodePosition(buf) {
  const o = {};
  forEachField(buf, (fn, wt, v) => {
    switch (fn) {
      // latitude_i / longitude_i are sfixed32 in the proto, but we
      // accept both wire types just in case (fixed32 = wt 5; varint = 0).
      case 1: o.latitudeI   = wt === 5 ? readI32(v) : signed(v); break;
      case 2: o.longitudeI  = wt === 5 ? readI32(v) : signed(v); break;
      case 3: o.altitude    = signed(v); break;
      case 4: o.time        = v; break;
      case 7: o.satsInView  = v; break;
      case 12: o.precisionBits = v; break;
    }
  });
  return o;
}

function decodeDeviceMetrics(buf) {
  const o = {};
  forEachField(buf, (fn, wt, v) => {
    switch (fn) {
      case 1: o.batteryLevel        = v;            break;
      case 2: o.voltage             = readFloat(v); break;
      case 3: o.channelUtilization  = readFloat(v); break;
      case 4: o.airUtilTx           = readFloat(v); break;
      case 5: o.uptimeSeconds       = v;            break;
    }
  });
  return o;
}

// ── Config (only group key + summary surfaced) ─────────────
function decodeConfig(buf) {
  // Config is a oneof — find which sub-message is set.
  let group = null, payload = null;
  forEachField(buf, (fn, wt, v) => {
    payload = v; group = ['device','position','power','network','display',
                          'lora','bluetooth','security','sessionkey'][fn - 1] ?? null;
  });
  return { group, raw: payload };
}

// ── Channel ────────────────────────────────────────────────
function decodeChannel(buf) {
  const o = {};
  forEachField(buf, (fn, wt, v) => {
    switch (fn) {
      case 1: o.index    = v; break;
      case 2: o.settings = v; break; // ChannelSettings — left raw
      case 3: o.role     = v; break; // 0 DISABLED, 1 PRIMARY, 2 SECONDARY
    }
  });
  return o;
}

// ── MeshPacket (passthrough, only header fields) ───────────
function decodeMeshPacket(buf) {
  const o = {};
  forEachField(buf, (fn, wt, v) => {
    switch (fn) {
      case 1: o.from      = v; break;
      case 2: o.to        = v; break;
      case 3: o.channel   = v; break;
      case 6: o.id        = v; break;
      case 7: o.rxTime    = v; break;
      case 8: o.rxSnr     = readFloat(v); break;
      case 9: o.hopLimit  = v; break;
      case 11: o.rxRssi   = signed(v); break;
    }
  });
  return o;
}

function decodeQueueStatus(buf) {
  const o = {};
  forEachField(buf, (fn, wt, v) => {
    switch (fn) {
      case 1: o.res       = v; break;
      case 2: o.free      = v; break;
      case 3: o.maxlen    = v; break;
      case 4: o.meshPacketId = v; break;
    }
  });
  return o;
}

function decodeMetadata(buf) {
  const o = {};
  forEachField(buf, (fn, wt, v) => {
    switch (fn) {
      case 1: o.firmwareVersion = readString(v); break;
      case 2: o.deviceStateVersion = v; break;
      case 5: o.hwModel = v; break;
      case 9: o.role    = v; break;
    }
  });
  return o;
}

// ── ToRadio encoders ───────────────────────────────────────
//
// Meshtastic protobuf field numbers (verified against
// meshtastic/protobufs @ main, src/meshtastic/{mesh,portnums,
// admin}.proto):
//
//   ToRadio.packet              = 1
//   ToRadio.want_config_id      = 3
//   ToRadio.heartbeat           = 7
//
//   MeshPacket.from             = 1
//   MeshPacket.to               = 2
//   MeshPacket.channel          = 3
//   MeshPacket.decoded(Data)    = 4
//   MeshPacket.id               = 6
//   MeshPacket.want_ack         = 8
//   MeshPacket.priority         = 9
//   MeshPacket.hop_limit        = 10
//
//   Data.portnum                = 1
//   Data.payload                = 2
//   Data.want_response          = 3
//   Data.dest                   = 4   (rarely used)
//   Data.source                 = 5
//   Data.request_id             = 6
//   Data.reply_id               = 7
//
//   PortNum:
//     TEXT_MESSAGE_APP   =  1
//     POSITION_APP       =  3
//     ADMIN_APP          =  6
//     ROUTING_APP        =  5
//     TRACEROUTE_APP     = 70
//     TELEMETRY_APP      = 67
//
//   AdminMessage:
//     reboot_ota_seconds        = 95
//     shutdown_seconds          = 4
//     reboot_seconds            = 6
//     factory_reset_config      = 94 (oneof tag)
//     factory_reset_device      = 96
//     remove_by_nodenum         = 33
//     set_favorite_node         = 99
//     remove_favorite_node      = 100
//     set_ignored_node          = 101
//     remove_ignored_node       = 102

export const PortNum = Object.freeze({
  UNKNOWN_APP:     0,
  TEXT_MESSAGE:    1,
  REMOTE_HARDWARE: 2,
  POSITION:        3,
  NODEINFO:        4,
  ROUTING:         5,
  ADMIN:           6,
  TRACEROUTE:     70,
  TELEMETRY:      67,
  REPLY:          32,
});

export const BROADCAST_NUM = 0xFFFFFFFF;

/** ToRadio { want_config_id = nonce }. */
export function encodeWantConfig(nonce = 1) {
  const out = [];
  writeVarintField(out, 3, nonce >>> 0);
  return new Uint8Array(out);
}

/** ToRadio { heartbeat = {} }. */
export function encodeHeartbeat() {
  return new Uint8Array([(7 << 3) | 2, 0]);
}

/**
 * Generic ToRadio { packet: MeshPacket } builder.
 * Returns the unframed ToRadio bytes; caller wraps with stream framing.
 */
export function encodeToRadioPacket({
  to       = BROADCAST_NUM,
  channel  = 0,
  portnum,
  payload  = new Uint8Array(0),
  wantAck       = false,
  wantResponse  = false,
  hopLimit      = null,
  id            = randomPacketId(),
} = {}) {
  // Data sub-message
  const data = [];
  writeVarintField(data, 1, portnum);
  if (payload.length > 0) writeLenDelim(data, 2, payload);
  if (wantResponse)        writeVarintField(data, 3, 1);
  // MeshPacket
  const pkt = [];
  writeVarintField(pkt, 2, to >>> 0);
  if (channel > 0) writeVarintField(pkt, 3, channel);
  writeLenDelim(pkt, 4, new Uint8Array(data));
  writeVarintField(pkt, 6, id >>> 0);
  if (wantAck) writeVarintField(pkt, 8, 1);
  if (hopLimit !== null) writeVarintField(pkt, 10, hopLimit);
  // ToRadio
  const torad = [];
  writeLenDelim(torad, 1, new Uint8Array(pkt));
  return new Uint8Array(torad);
}

/** Plain text mesh message (TEXT_MESSAGE_APP). */
export function encodeTextMessage(text, opts = {}) {
  const utf8 = new TextEncoder().encode(text);
  return encodeToRadioPacket({
    portnum:      PortNum.TEXT_MESSAGE,
    payload:      utf8,
    wantAck:      opts.wantAck ?? false,
    to:           opts.to       ?? BROADCAST_NUM,
    channel:      opts.channel  ?? 0,
  });
}

/** Traceroute trigger — empty RouteDiscovery on TRACEROUTE_APP. */
export function encodeTraceroute(toNum, channel = 0) {
  return encodeToRadioPacket({
    to: toNum, channel,
    portnum: PortNum.TRACEROUTE,
    payload: new Uint8Array(0),
    wantResponse: true,
    wantAck: true,
  });
}

/** `--request-position --dest !id` — empty Position on POSITION_APP, want_response. */
export function encodeRequestPosition(toNum, channel = 0) {
  return encodeToRadioPacket({
    to: toNum, channel,
    portnum: PortNum.POSITION,
    wantResponse: true,
  });
}

/** `--request-telemetry --dest !id` — empty Telemetry on TELEMETRY_APP, want_response. */
export function encodeRequestTelemetry(toNum, channel = 0) {
  return encodeToRadioPacket({
    to: toNum, channel,
    portnum: PortNum.TELEMETRY,
    wantResponse: true,
  });
}

/**
 * Wrap an AdminMessage as a ToRadio packet on ADMIN_APP. The admin
 * protobuf body is built by the caller via the admin* helpers below.
 */
function encodeAdmin(toNum, channel, adminBytes) {
  return encodeToRadioPacket({
    to: toNum, channel,
    portnum: PortNum.ADMIN,
    payload: adminBytes,
    wantResponse: true,
    wantAck: true,
  });
}

/** AdminMessage bodies — single-field protobufs. */
export function adminRebootBody(seconds = 5) {
  const out = []; writeVarintField(out, 6, seconds >>> 0);
  return new Uint8Array(out);
}
export function adminShutdownBody(seconds = 5) {
  const out = []; writeVarintField(out, 4, seconds >>> 0);
  return new Uint8Array(out);
}
export function adminFactoryResetConfigBody() {
  const out = []; writeVarintField(out, 94, 1);
  return new Uint8Array(out);
}
export function adminFactoryResetDeviceBody() {
  const out = []; writeVarintField(out, 96, 1);
  return new Uint8Array(out);
}
export function adminRemoveByNodenumBody(nodeNum) {
  const out = []; writeVarintField(out, 33, nodeNum >>> 0);
  return new Uint8Array(out);
}
export function adminSetFavoriteBody(nodeNum) {
  const out = []; writeVarintField(out, 99, nodeNum >>> 0);
  return new Uint8Array(out);
}
export function adminRemoveFavoriteBody(nodeNum) {
  const out = []; writeVarintField(out, 100, nodeNum >>> 0);
  return new Uint8Array(out);
}
export function adminSetIgnoredBody(nodeNum) {
  const out = []; writeVarintField(out, 101, nodeNum >>> 0);
  return new Uint8Array(out);
}
export function adminRemoveIgnoredBody(nodeNum) {
  const out = []; writeVarintField(out, 102, nodeNum >>> 0);
  return new Uint8Array(out);
}

/** High-level admin send helpers (returns ToRadio bytes). */
export function encodeAdminReboot(toNum, seconds = 5)
  { return encodeAdmin(toNum, 0, adminRebootBody(seconds)); }
export function encodeAdminShutdown(toNum, seconds = 5)
  { return encodeAdmin(toNum, 0, adminShutdownBody(seconds)); }
export function encodeAdminRemoveNode(toNum, targetNodeNum)
  { return encodeAdmin(toNum, 0, adminRemoveByNodenumBody(targetNodeNum)); }
export function encodeAdminSetFavorite(toNum, targetNodeNum)
  { return encodeAdmin(toNum, 0, adminSetFavoriteBody(targetNodeNum)); }
export function encodeAdminRemoveFavorite(toNum, targetNodeNum)
  { return encodeAdmin(toNum, 0, adminRemoveFavoriteBody(targetNodeNum)); }
export function encodeAdminSetIgnored(toNum, targetNodeNum)
  { return encodeAdmin(toNum, 0, adminSetIgnoredBody(targetNodeNum)); }
export function encodeAdminRemoveIgnored(toNum, targetNodeNum)
  { return encodeAdmin(toNum, 0, adminRemoveIgnoredBody(targetNodeNum)); }

/** Random 31-bit packet id (matches firmware's `random()` trim). */
export function randomPacketId() {
  return (Math.random() * 0x7FFFFFFF) >>> 0;
}

/** Parse a "!a1b2c3d4" id into a u32 node number. Falls back to BROADCAST. */
export function parseNodeId(id) {
  if (!id) return BROADCAST_NUM;
  const hex = id.replace(/^!/, '');
  const n = parseInt(hex, 16);
  return Number.isFinite(n) ? (n >>> 0) : BROADCAST_NUM;
}

// ── Helpers ────────────────────────────────────────────────
function signed(v) { return v | 0; } // varint values used as i32

function bytesToHex(buf) {
  let s = '';
  for (let i = 0; i < buf.length; i++) {
    s += buf[i].toString(16).padStart(2, '0');
  }
  return s;
}
