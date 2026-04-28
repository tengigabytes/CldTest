/**
 * MessagesScreen — A-1 對話列表(對齊 doc/ui/01-page-architecture.md)
 *
 * DM 與頻道對話混合單列,依最近活動排序。對話列表項目格式對齊
 * doc/ui/20-launcher-home.md 的訊息行(▶ + 圖示 + 名稱 + 時間 + ●N/✏ +
 * 預覽,40 字位)— 與 L-0 桌面訊息區格式一致,不再分頁籤。
 *
 * 草稿提示:對齊 12-ime.md §對話列表草稿提示,有草稿時 ●N 位置改顯示
 * 橙色 ✏,預覽改顯示草稿內容。
 *
 * Keys:
 *   ▲▼     移動焦點
 *   OK     開啟對話(進 chat-screen)
 *   BACK   返回
 */

import { BaseScreen } from '../screen-manager.js';
import { listDraftIds, getDraft } from './drafts-store.js';

const ROW_H   = 22;
const LIST_Y  = 32;
const VISIBLE = 9;     // 22*9 = 198px,加 status 16 + footer ≈ 230

// Mock 對話清單(後續接 NodeDB / serial 真實資料);依時間排序
const MOCK_CONVERSATIONS = [
  { kind: 'dm',      id: '!a1b2c3d4', from: '阿明',     time: '09:38', unread: 2, preview: '我快到了五分鐘有' },
  { kind: 'channel', id: 0,           from: 'LongFast',  time: '09:35', unread: 1, preview: '陽明山訊號穩定' },
  { kind: 'dm',      id: '!e5f6a7b8', from: '老周',     time: '09:12', unread: 0, preview: '我收到了訊息' },
  { kind: 'channel', id: 2,           from: 'Local',     time: '08:42', unread: 0, preview: 'tx test 73' },
  { kind: 'dm',      id: '!c9d0a1b2', from: 'JA1-Mokya',time: '昨日',  unread: 0, preview: 'こんにちは' },
];

export class MessagesScreen extends BaseScreen {
  constructor(renderer, mie, serial, deps) {
    super(renderer, mie, serial);
    this._sel = 0;
    this._top = 0;
    this._deps = deps ?? null;     // { chatScreen }
  }

  render(now) {
    const r = this.r;
    r.clear();

    r.drawStatusBar({
      time:    new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
      battery: 75,
    });

    // 標題
    r.drawLabel(r.W / 2, 28, '訊息', {
      font: r.F.ZH_MD, color: r.C.TEXT, align: 'center',
    });

    // 列表
    const list = this._buildList();
    if (list.length === 0) {
      r.drawLabel(r.W / 2, 120, '(目前沒有訊息)', {
        font: r.F.ZH_MD, color: r.C.TEXT_DIM, align: 'center',
      });
      return;
    }

    const rows = Math.min(VISIBLE, list.length - this._top);
    for (let i = 0; i < rows; i++) {
      const idx = this._top + i;
      const y   = LIST_Y + i * ROW_H;
      this._drawRow(r, y, list[idx], idx === this._sel);
    }

    // 滾動 thumb
    if (list.length > VISIBLE) {
      const trackH = VISIBLE * ROW_H;
      const trackX = r.W - 2;
      r.ctx.fillStyle = r.C.SURFACE2;
      r.ctx.fillRect(trackX, LIST_Y, 2, trackH);
      const thumbH = Math.max(8, ((VISIBLE / list.length) * trackH) | 0);
      const thumbY = LIST_Y +
        (((this._top / Math.max(1, list.length - VISIBLE)) * (trackH - thumbH)) | 0);
      r.ctx.fillStyle = r.C.FOCUS;
      r.ctx.fillRect(trackX, thumbY, 2, thumbH);
    }
  }

  _drawRow(r, y, msg, isFocused) {
    const ctx = r.ctx;
    if (isFocused) {
      ctx.fillStyle = r.C.FOCUS_BG;
      ctx.fillRect(0, y, r.W, ROW_H);
    }
    ctx.font          = r.F.ZH_SM;
    ctx.textBaseline  = 'alphabetic';
    ctx.textAlign     = 'left';
    const baseline = y + 14;

    // ▶ 焦點符
    let x = 4;
    if (isFocused) {
      ctx.fillStyle = r.C.FOCUS;
      ctx.fillText('▶', x, baseline);
    }
    x += 14;

    // 圖示(👤 DM / # 頻道)
    const icon = msg.kind === 'dm' ? '👤' : '#';
    ctx.fillStyle = r.C.TEXT;
    ctx.fillText(icon, x, baseline);
    x += 18;

    // 名稱
    const name = truncateChars(msg.from, 4);
    ctx.fillStyle = isFocused ? r.C.FOCUS : r.C.TEXT;
    ctx.fillText(name, x, baseline);
    x += 64;

    // 時間
    ctx.fillStyle = r.C.TEXT_DIM;
    ctx.fillText(msg.time || '—', x, baseline);
    x += ctx.measureText(msg.time || '—').width + 6;

    // 草稿 ✏ / 未讀 ●N
    if (msg.draft) {
      ctx.fillStyle = r.C.FOCUS;
      ctx.fillText('✏', x, baseline);
      x += 18;
    } else if (msg.unread > 0) {
      ctx.fillStyle = r.C.GREEN;
      ctx.fillText(`●${msg.unread}`, x, baseline);
      x += ctx.measureText(`●${msg.unread}`).width + 4;
    }

    // 預覽
    const preview = msg.draft || msg.preview || '';
    if (preview) {
      const remainW = r.W - x - 6;
      ctx.fillStyle = msg.draft ? r.C.FOCUS_DIM
                    : (msg.unread > 0 ? r.C.TEXT : r.C.TEXT_DIM);
      ctx.fillText(truncateToWidth(ctx, preview, remainW), x, baseline);
    }
  }

  /** 結合 mock conversations + 草稿 store。 */
  _buildList() {
    const draftIds = new Set(listDraftIds());
    return MOCK_CONVERSATIONS.map(c => {
      const draftKey = `chat:${c.kind}:${c.id}`;
      const draft = draftIds.has(draftKey) ? getDraft(draftKey) : null;
      return { ...c, draft: draft?.text || '' };
    });
  }

  handleKeyTap({ key }) {
    const fn = key.fn;
    const list = this._buildList();
    const N = list.length;
    if (N === 0) {
      if (fn === 'BACK') this.goBack();
      return;
    }
    if (fn === 'UP')   { this._sel = (this._sel - 1 + N) % N; this._ensureVisible(); return; }
    if (fn === 'DOWN') { this._sel = (this._sel + 1) % N;     this._ensureVisible(); return; }
    if (fn === 'OK' || fn === 'RIGHT') {
      const it = list[this._sel];
      const chat = this._deps?.chatScreen
                 ?? this._manager?._screens?.get?.('chat');
      if (chat) {
        if (it.kind === 'dm') chat.setRecipient(it.id, it.from);
        else                  chat.setChannel(it.id ?? 0, it.from);
      }
      this.goto('chat', 'slide_l');
      return;
    }
    if (fn === 'BACK') { this.goBack(); return; }
  }

  _ensureVisible() {
    const N = this._buildList().length;
    if (this._sel < this._top)                     this._top = this._sel;
    else if (this._sel >= this._top + VISIBLE)     this._top = this._sel - VISIBLE + 1;
    if (this._top < 0) this._top = 0;
    if (this._top > N - VISIBLE) this._top = Math.max(0, N - VISIBLE);
  }
}

// helpers
function truncateChars(s, max) {
  if (!s) return '';
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}
function truncateToWidth(ctx, s, maxWidth) {
  if (!s) return '';
  if (ctx.measureText(s).width <= maxWidth) return s;
  const eW = ctx.measureText('…').width;
  let lo = 0, hi = s.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    const w = ctx.measureText(s.slice(0, mid)).width + eW;
    if (w <= maxWidth) lo = mid;
    else               hi = mid - 1;
  }
  return s.slice(0, lo) + '…';
}
