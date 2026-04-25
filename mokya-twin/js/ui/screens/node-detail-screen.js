/**
 * NodeDetailScreen — per-node info and admin actions.
 *
 * Two tabs (LEFT/RIGHT to switch):
 *   • 資訊 — read-only NodeInfo / Position / DeviceMetrics fields
 *           (mirrors `meshtastic --info`)
 *   • 動作 — selectable actions mirrored on the CLI:
 *             send-dm, ping, traceroute, request_position,
 *             request_telemetry, toggle-favorite, toggle-ignored,
 *             remove. Real IPC isn't wired so each action shows a
 *             toast with a plausible CLI-style result line.
 *
 * Toggle actions mutate the in-memory NodeInfo (is_favorite,
 * is_ignored) so the UI reflects the change immediately. Remove also
 * splices NODES.
 */

import { BaseScreen } from '../screen-manager.js';
import { NODES, NODE_ACTIONS, buildNodeInfoFields } from './nodes-data.js';

const TAB_INFO    = 0;
const TAB_ACTIONS = 1;

const INFO_ROW_H        = 18;
const INFO_VISIBLE_ROWS = 9;
const INFO_LIST_TOP_Y   = 70;

const ACT_ROW_H        = 26;
const ACT_VISIBLE_ROWS = 6;
const ACT_LIST_TOP_Y   = 70;

export class NodeDetailScreen extends BaseScreen {
  constructor(renderer, mie, serial) {
    super(renderer, mie, serial);
    this._node = null;
    this._tab  = TAB_INFO;
    this._infoSel = 0; this._infoTop = 0;
    this._actSel  = 0; this._actTop  = 0;
    this._toast = null;       // { text, until }
  }

  setNode(node) {
    this._node = node;
    this._tab  = TAB_INFO;
    this._infoSel = 0; this._infoTop = 0;
    this._actSel  = 0; this._actTop  = 0;
    this._toast = null;
  }

  render(now) {
    const r = this.r;
    r.clear();

    r.drawStatusBar({
      time:    new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
      battery: 75,
      rssi:    -82,
      mode:    'LoRa',
    });

    if (!this._node) {
      r.drawLabel(r.W / 2, 120, '(無節點)', {
        font: r.F.ZH_MD, color: r.C.TEXT_DIM, align: 'center',
      });
      return;
    }
    const n = this._node;

    // Header: name + ID
    const star = n.is_favorite ? '★ ' : '';
    r.drawLabel(8, 30, star + n.user.long_name, {
      font: r.F.ZH_MD, color: r.C.TEXT,
    });
    r.drawLabel(r.W - 8, 30, n.user.id, {
      font: r.F.ZH_SM, color: r.C.TEXT_DIM, align: 'right',
    });

    // Tab strip
    const tabs = ['資訊', '動作'];
    const tabY = 42, tabH = 22;
    const tabW = r.W / 2;
    for (let i = 0; i < tabs.length; i++) {
      const x = i * tabW;
      const isSel = (i === this._tab);
      r.ctx.fillStyle = isSel ? r.C.GREEN_MUTED : r.C.SURFACE;
      r.ctx.fillRect(x, tabY, tabW, tabH);
      r.drawLabel(x + tabW / 2, tabY + tabH / 2 + 5, tabs[i], {
        font: r.F.ZH_MD, color: isSel ? r.C.GREEN : r.C.TEXT_DIM, align: 'center',
      });
      if (isSel) {
        r.ctx.fillStyle = r.C.GREEN;
        r.ctx.fillRect(x, tabY + tabH - 2, tabW, 2);
      }
    }

    if (this._tab === TAB_INFO)  this._renderInfo(r, n);
    else                          this._renderActions(r, n);

    // Toast
    if (this._toast && now < this._toast.until) {
      r.drawCard(20, 200, r.W - 40, 22, { radius: 6, bg: r.C.SURFACE2, border: r.C.GREEN });
      r.drawLabel(r.W / 2, 215, this._toast.text, {
        font: r.F.ZH_SM, color: r.C.GREEN, align: 'center', maxWidth: r.W - 60,
      });
    } else {
      r.drawLabel(r.W / 2, 235,
        this._tab === TAB_INFO ? '◀▶ 切換 · ▲▼ 捲動 · BACK 返回'
                                : '◀▶ 切換 · ▲▼ 選擇 · OK 執行 · BACK 返回', {
        font: r.F.ZH_SM, color: r.C.TEXT_DIM, align: 'center',
      });
    }
  }

  _renderInfo(r, n) {
    const fields = buildNodeInfoFields(n);
    const top    = this._infoTop;
    const rows   = Math.min(INFO_VISIBLE_ROWS, fields.length - top);
    for (let i = 0; i < rows; i++) {
      const idx = top + i;
      const f   = fields[idx];
      const y   = INFO_LIST_TOP_Y + i * INFO_ROW_H;
      const isSel = (idx === this._infoSel);
      r.ctx.fillStyle = isSel ? r.C.GREEN_MUTED : '#161618';
      r.ctx.fillRect(4, y, r.W - 8, INFO_ROW_H - 2);
      r.drawLabel(8, y + 13, f.label, {
        font: r.F.ZH_SM, color: isSel ? r.C.GREEN : r.C.TEXT_DIM,
      });
      r.drawLabel(r.W - 8, y + 13, f.value, {
        font: r.F.ZH_SM, color: isSel ? r.C.GREEN : r.C.TEXT, align: 'right',
        maxWidth: r.W - 100,
      });
    }
    if (fields.length > INFO_VISIBLE_ROWS) {
      const trackH = INFO_VISIBLE_ROWS * INFO_ROW_H;
      const trackX = r.W - 2;
      r.ctx.fillStyle = r.C.SURFACE2;
      r.ctx.fillRect(trackX, INFO_LIST_TOP_Y, 2, trackH);
      const thumbH = Math.max(8, ((INFO_VISIBLE_ROWS / fields.length) * trackH) | 0);
      const thumbY = INFO_LIST_TOP_Y +
        (((this._infoTop / Math.max(1, fields.length - INFO_VISIBLE_ROWS)) * (trackH - thumbH)) | 0);
      r.ctx.fillStyle = r.C.GREEN;
      r.ctx.fillRect(trackX, thumbY, 2, thumbH);
    }
  }

  _renderActions(r, n) {
    const top  = this._actTop;
    const rows = Math.min(ACT_VISIBLE_ROWS, NODE_ACTIONS.length - top);
    for (let i = 0; i < rows; i++) {
      const idx = top + i;
      const a   = NODE_ACTIONS[idx];
      const y   = ACT_LIST_TOP_Y + i * ACT_ROW_H;
      const isSel = (idx === this._actSel);

      r.drawCard(8, y, r.W - 16, ACT_ROW_H - 4, {
        radius: 4,
        bg:     isSel ? r.C.GREEN_MUTED : r.C.SURFACE,
        border: isSel ? r.C.GREEN       : r.C.BORDER,
      });

      // Action label (with current state for toggles)
      let label = a.label;
      if (a.id === 'toggle-fav') label = n.is_favorite ? '取消最愛'  : '加入最愛';
      if (a.id === 'toggle-ign') label = n.is_ignored  ? '取消忽略'  : '加入忽略';
      r.drawLabel(14, y + 14, label, {
        font: r.F.ZH_MD, color: isSel ? r.C.GREEN : r.C.TEXT,
      });
      if (isSel) {
        r.drawLabel(r.W - 14, y + 14, '►', {
          font: r.F.ZH_SM, color: r.C.GREEN, align: 'right',
        });
      }
    }
  }

  // ── Key handling ────────────────────────────────────────────
  handleKeyTap({ key }) {
    const fn = key.fn;
    if (!this._node) { if (fn === 'BACK') this.goBack(); return; }

    if (fn === 'BACK') { this.goBack(); return; }

    if (fn === 'LEFT' || fn === 'RIGHT') {
      this._tab = (this._tab + 1) % 2;
      return;
    }

    if (this._tab === TAB_INFO) {
      const fields = buildNodeInfoFields(this._node);
      const N = fields.length;
      if (fn === 'UP')   { this._infoSel = (this._infoSel - 1 + N) % N; this._ensureInfoVisible(N); return; }
      if (fn === 'DOWN') { this._infoSel = (this._infoSel + 1) % N;     this._ensureInfoVisible(N); return; }
      return;
    }

    // Actions tab
    const N = NODE_ACTIONS.length;
    if (fn === 'UP')   { this._actSel = (this._actSel - 1 + N) % N; this._ensureActVisible(); return; }
    if (fn === 'DOWN') { this._actSel = (this._actSel + 1) % N;     this._ensureActVisible(); return; }
    if (fn === 'OK')   { this._runAction(NODE_ACTIONS[this._actSel].id); return; }
  }

  _runAction(id) {
    const n = this._node;
    const idShort = n.user.id;
    let msg;
    switch (id) {
      case 'send-dm':
        // Forward to chat-screen (no per-recipient context yet — stub).
        this.goto('chat', 'slide_l');
        return;
      case 'ping':
        msg = `→ Ping ${idShort}  ✓ ack 124 ms · ${n.rssi ?? '?'} dBm`;
        break;
      case 'traceroute':
        msg = `→ Traceroute ${idShort}  hops: 我 → ?? → ${idShort}`;
        break;
      case 'req-pos':
        msg = `→ requestPosition ${idShort}  ✓ 已送出`;
        break;
      case 'req-tel':
        msg = `→ requestTelemetry ${idShort}  ✓ 已送出`;
        break;
      case 'toggle-fav':
        n.is_favorite = !n.is_favorite;
        msg = n.is_favorite ? `★ ${idShort} 已加入最愛` : `${idShort} 已取消最愛`;
        break;
      case 'toggle-ign':
        n.is_ignored = !n.is_ignored;
        msg = n.is_ignored ? `${idShort} 已加入忽略` : `${idShort} 已取消忽略`;
        break;
      case 'remove': {
        const i = NODES.indexOf(n);
        if (i >= 0) NODES.splice(i, 1);
        this.goBack();
        return;
      }
      default: msg = `${id}: ?`;
    }
    this._toast = { text: msg, until: performance.now() + 2000 };
  }

  _ensureInfoVisible(total) {
    if (this._infoSel < this._infoTop) this._infoTop = this._infoSel;
    else if (this._infoSel >= this._infoTop + INFO_VISIBLE_ROWS)
      this._infoTop = this._infoSel - INFO_VISIBLE_ROWS + 1;
    if (this._infoTop < 0) this._infoTop = 0;
    if (this._infoTop > total - INFO_VISIBLE_ROWS)
      this._infoTop = Math.max(0, total - INFO_VISIBLE_ROWS);
  }

  _ensureActVisible() {
    const N = NODE_ACTIONS.length;
    if (this._actSel < this._actTop) this._actTop = this._actSel;
    else if (this._actSel >= this._actTop + ACT_VISIBLE_ROWS)
      this._actTop = this._actSel - ACT_VISIBLE_ROWS + 1;
    if (this._actTop < 0) this._actTop = 0;
    if (this._actTop > N - ACT_VISIBLE_ROWS)
      this._actTop = Math.max(0, N - ACT_VISIBLE_ROWS);
  }
}
