import type { RackItem, RackSide } from '@/lib/rack-data';

const RU_H = 32;
const RU_NUM_W = 24;
const RAIL_W = 28;
const EQUIP_W = 172;
const RACK_INNER_W = RU_NUM_W + RAIL_W + EQUIP_W + RAIL_W; // 252
const CAP_H = 20;
const BOTTOM_CAP_H = 12;

const CFG = {
  front: {
    borderColor: '#52525b',
    railBg: '#27272a',
    bodyBg: '#09090b',
    enclosureBg: '#18181b',
    label: 'FRONT VIEW',
    labelColor: '#6ee7b7',
    indicatorColor: '#34d399',
    screwBorder: '#3f3f46',
    screwBg: '#27272a',
    screwDot: '#52525b',
  },
  rear: {
    borderColor: '#b45309',
    railBg: '#3b1f00',
    bodyBg: '#1c0f00',
    enclosureBg: '#271500',
    label: 'REAR VIEW',
    labelColor: '#fcd34d',
    indicatorColor: '#fbbf24',
    screwBorder: '#78350f',
    screwBg: '#451a03',
    screwDot: '#78350f',
  },
};

// Parse 6-digit or 8-digit hex to rgba (last 2 digits = alpha if present)
function rgba(hex: string, forceAlpha?: number): string {
  let h = hex.startsWith('#') ? hex.slice(1) : hex;
  let alpha = forceAlpha ?? 1;
  if (h.length === 8) {
    alpha = (forceAlpha ?? 1) * (parseInt(h.slice(6, 8), 16) / 255);
    h = h.slice(0, 6);
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}

function drawScrew(ctx: CanvasRenderingContext2D, cx: number, cy: number, side: RackSide) {
  const c = CFG[side];
  ctx.beginPath();
  ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = c.screwBg;
  ctx.fill();
  ctx.strokeStyle = c.screwBorder;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = c.screwDot;
  ctx.fill();
}

function clipText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 0 && ctx.measureText(out + '…').width > maxWidth) {
    out = out.slice(0, -1);
  }
  return out + '…';
}

function drawRack(ctx: CanvasRenderingContext2D, x: number, y: number, side: RackSide, ru: number, items: RackItem[]) {
  const c = CFG[side];
  const sideItems = items.filter(i => i.side === side);
  const totalH = CAP_H + ru * RU_H + BOTTOM_CAP_H;
  const equipX = x + RU_NUM_W + RAIL_W;
  const rightRailX = equipX + EQUIP_W;

  // Enclosure background
  ctx.fillStyle = c.enclosureBg;
  ctx.fillRect(x, y, RACK_INNER_W, totalH);

  // Outer border
  ctx.strokeStyle = c.borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, RACK_INNER_W - 2, totalH - 2);

  // ─── TOP CAP ───
  ctx.fillStyle = c.railBg;
  ctx.fillRect(x, y, RACK_INNER_W, CAP_H);
  ctx.strokeStyle = rgba(c.borderColor, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + CAP_H);
  ctx.lineTo(x + RACK_INNER_W, y + CAP_H);
  ctx.stroke();

  // Decorative bars on left side of cap
  ctx.fillStyle = rgba(c.borderColor, 0.5);
  ctx.fillRect(x + 8, y + 7, 24, 6);
  ctx.fillStyle = rgba(c.borderColor, 0.3);
  ctx.fillRect(x + 36, y + 7, 12, 6);

  // Cap label
  ctx.fillStyle = c.labelColor;
  ctx.font = 'bold 10px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(c.label, x + RACK_INNER_W / 2, y + 14);

  // Cap LED indicator dot
  ctx.beginPath();
  ctx.arc(x + RACK_INNER_W - 12, y + 10, 4, 0, Math.PI * 2);
  ctx.fillStyle = c.indicatorColor;
  ctx.fill();

  // ─── RU NUMBER COLUMN ───
  for (let i = 0; i < ru; i++) {
    const ruNum = ru - i;
    const rowY = y + CAP_H + i * RU_H;
    ctx.fillStyle = c.enclosureBg;
    ctx.fillRect(x, rowY, RU_NUM_W, RU_H);
    ctx.strokeStyle = rgba(c.borderColor, 0.12);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, rowY + RU_H);
    ctx.lineTo(x + RU_NUM_W, rowY + RU_H);
    ctx.stroke();
    ctx.fillStyle = rgba(c.borderColor, 0.6);
    ctx.font = '9px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(ruNum), x + RU_NUM_W / 2, rowY + RU_H / 2 + 3);
  }

  // ─── LEFT RAIL ───
  const leftRailX = x + RU_NUM_W;
  ctx.fillStyle = c.railBg;
  ctx.fillRect(leftRailX, y + CAP_H, RAIL_W, ru * RU_H);
  for (let i = 0; i < ru; i++) {
    const rowY = y + CAP_H + i * RU_H;
    ctx.strokeStyle = rgba(c.borderColor, 0.12);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(leftRailX, rowY + RU_H);
    ctx.lineTo(leftRailX + RAIL_W, rowY + RU_H);
    ctx.stroke();
    drawScrew(ctx, leftRailX + RAIL_W / 2, rowY + RU_H * 0.33, side);
    drawScrew(ctx, leftRailX + RAIL_W / 2, rowY + RU_H * 0.67, side);
  }

  // ─── EQUIPMENT AREA BACKGROUND ───
  ctx.fillStyle = c.bodyBg;
  ctx.fillRect(equipX, y + CAP_H, EQUIP_W, ru * RU_H);
  for (let i = 0; i < ru; i++) {
    const rowY = y + CAP_H + i * RU_H;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(equipX, rowY + RU_H);
    ctx.lineTo(equipX + EQUIP_W, rowY + RU_H);
    ctx.stroke();
  }

  // ─── RIGHT RAIL ───
  ctx.fillStyle = c.railBg;
  ctx.fillRect(rightRailX, y + CAP_H, RAIL_W, ru * RU_H);
  for (let i = 0; i < ru; i++) {
    const rowY = y + CAP_H + i * RU_H;
    ctx.strokeStyle = rgba(c.borderColor, 0.12);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(rightRailX, rowY + RU_H);
    ctx.lineTo(rightRailX + RAIL_W, rowY + RU_H);
    ctx.stroke();
    drawScrew(ctx, rightRailX + RAIL_W / 2, rowY + RU_H * 0.33, side);
    drawScrew(ctx, rightRailX + RAIL_W / 2, rowY + RU_H * 0.67, side);
  }

  // ─── EQUIPMENT ITEMS ───
  sideItems.forEach(item => {
    const fromTop = ru - item.ru;
    const iy = y + CAP_H + fromTop * RU_H;
    const ih = item.equipment.ru * RU_H;
    const textMaxW = EQUIP_W - 54; // leave room for RU badge + icon

    // Gradient fill
    const grad = ctx.createLinearGradient(equipX, iy, equipX + EQUIP_W, iy + ih);
    grad.addColorStop(0, rgba(item.equipment.color, 0.93));
    grad.addColorStop(1, rgba(item.equipment.color, 0.6));
    ctx.fillStyle = grad;
    ctx.fillRect(equipX, iy, EQUIP_W, ih);

    // Item border
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(equipX, iy, EQUIP_W, ih);

    // Left indicator bar
    ctx.fillStyle = c.indicatorColor;
    ctx.fillRect(equipX, iy, 3, ih);

    // LED dot
    ctx.beginPath();
    ctx.arc(equipX + 12, iy + 8, 3, 0, Math.PI * 2);
    ctx.fillStyle = c.indicatorColor;
    ctx.fill();

    // RU badge (top-right)
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '9px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${item.equipment.ru}U`, equipX + EQUIP_W - 5, iy + 12);

    // Name text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px ui-monospace, monospace';
    ctx.textAlign = 'left';
    const nameY = ih > RU_H ? iy + RU_H / 2 - 2 : iy + RU_H / 2 + 3;
    ctx.fillText(clipText(ctx, item.equipment.name, textMaxW), equipX + 20, nameY);

    // Model text (only if 2U+)
    if (item.equipment.ru >= 2 && item.equipment.model) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '9px ui-monospace, monospace';
      ctx.fillText(clipText(ctx, item.equipment.model, textMaxW), equipX + 20, iy + RU_H / 2 + 11);
    }
  });

  // ─── BOTTOM CAP ───
  const bottomY = y + CAP_H + ru * RU_H;
  ctx.fillStyle = c.railBg;
  ctx.fillRect(x, bottomY, RACK_INNER_W, BOTTOM_CAP_H);
  ctx.strokeStyle = rgba(c.borderColor, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, bottomY);
  ctx.lineTo(x + RACK_INNER_W, bottomY);
  ctx.stroke();
}

export async function downloadRackPng(rackName: string, ru: number, items: RackItem[]): Promise<void> {
  const SCALE = 2; // retina
  const PAD = 32;
  const TITLE_H = 44;
  const LABEL_H = 22;
  const DIVIDER_GAP = 40;
  const RACK_H = CAP_H + ru * RU_H + BOTTOM_CAP_H;

  const W = PAD * 2 + RACK_INNER_W * 2 + DIVIDER_GAP;
  const H = PAD + TITLE_H + LABEL_H + RACK_H + PAD;

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(SCALE, SCALE);

  // Background
  ctx.fillStyle = '#0f0f0f';
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = '#e4e4e7';
  ctx.font = 'bold 14px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(rackName.toUpperCase(), W / 2, PAD + 18);

  ctx.fillStyle = '#52525b';
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillText(`${ru}U RACK  ·  ${items.filter(i => i.side === 'front').length} FRONT  ·  ${items.filter(i => i.side === 'rear').length} REAR`, W / 2, PAD + 32);

  // Rack position
  const frontX = PAD;
  const rearX = PAD + RACK_INNER_W + DIVIDER_GAP;
  const bodyY = PAD + TITLE_H + LABEL_H;

  // Side labels
  ctx.font = 'bold 9px ui-monospace, monospace';
  ctx.fillStyle = '#6ee7b7';
  ctx.textAlign = 'center';
  ctx.fillText('◀  FRONT VIEW', frontX + RACK_INNER_W / 2, PAD + TITLE_H + 14);

  ctx.fillStyle = '#fcd34d';
  ctx.fillText('REAR VIEW  ▶', rearX + RACK_INNER_W / 2, PAD + TITLE_H + 14);

  // Vertical divider
  const divX = PAD + RACK_INNER_W + DIVIDER_GAP / 2;
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(divX, PAD + TITLE_H);
  ctx.lineTo(divX, H - PAD);
  ctx.stroke();

  // Draw both rack sides
  drawRack(ctx, frontX, bodyY, 'front', ru, items);
  drawRack(ctx, rearX, bodyY, 'rear', ru, items);

  // Trigger download via blob
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `${rackName.replace(/\s+/g, '-').toLowerCase()}-rack.png`;
    a.href = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}
