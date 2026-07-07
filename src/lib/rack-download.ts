import { toPng } from 'html-to-image';
import type { RackItem, RackSide } from '@/lib/rack-data';

const RU_HEIGHT = 32;

const SIDE_CFG = {
  front: {
    borderColor: '#52525b',
    railBg: '#27272a',
    bodyBg: '#09090b',
    enclosureBg: '#18181b',
    capBg: '#27272a',
    label: 'FRONT',
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
    capBg: '#3b1f00',
    label: 'REAR',
    labelColor: '#fcd34d',
    indicatorColor: '#fbbf24',
    screwBorder: '#78350f',
    screwBg: '#451a03',
    screwDot: '#78350f',
  },
};

const TYPE_ICONS_TEXT: Record<string, string> = {
  processor: '▶',
  power: '⚡',
  network: '◉',
  utility: '▬',
  media: '▷',
  other: '?',
};

// Build an HTML element representing one side of the rack (non-interactive)
function buildRackSideEl(side: RackSide, ru: number, items: RackItem[]): HTMLElement {
  const cfg = SIDE_CFG[side];
  const sideItems = items.filter(i => i.side === side);

  // Build occupancy map: topRu -> item
  const itemByTopRu = new Map<number, RackItem>();
  sideItems.forEach(item => itemByTopRu.set(item.ru, item));

  const RAIL_W = 28;
  const RU_NUM_W = 24;
  const EQUIP_W = 190;
  const RACK_INNER_W = RU_NUM_W + RAIL_W + EQUIP_W + RAIL_W;
  const CAP_H = 20;
  const BOTTOM_CAP_H = 12;
  const BODY_H = ru * RU_HEIGHT;

  const wrap = document.createElement('div');
  wrap.style.cssText = `
    display: flex; flex-direction: column;
    width: ${RACK_INNER_W}px;
    font-family: ui-monospace, SFMono-Regular, monospace;
  `;

  // Top cap
  const topCap = document.createElement('div');
  topCap.style.cssText = `
    height: ${CAP_H}px;
    background: ${cfg.capBg};
    border: 2px solid ${cfg.borderColor};
    border-bottom: 1px solid ${cfg.borderColor}50;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 8px; box-sizing: border-box;
  `;
  topCap.innerHTML = `
    <div style="display:flex;gap:4px;">
      <div style="width:24px;height:6px;border-radius:2px;background:${cfg.borderColor}80;"></div>
      <div style="width:12px;height:6px;border-radius:2px;background:${cfg.borderColor}50;"></div>
    </div>
    <span style="font-size:10px;font-weight:800;letter-spacing:3px;color:${cfg.labelColor};">${cfg.label}</span>
    <div style="width:8px;height:8px;border-radius:50%;background:${cfg.indicatorColor};box-shadow:0 0 5px ${cfg.indicatorColor};"></div>
  `;

  // Body row
  const bodyRow = document.createElement('div');
  bodyRow.style.cssText = `display: flex; flex: 1;`;

  // RU numbers column
  const ruNums = document.createElement('div');
  ruNums.style.cssText = `
    width: ${RU_NUM_W}px; display: flex; flex-direction: column;
    background: ${cfg.enclosureBg}; border-left: 2px solid ${cfg.borderColor};
  `;
  for (let i = 0; i < ru; i++) {
    const ruNum = ru - i;
    const cell = document.createElement('div');
    cell.style.cssText = `
      height: ${RU_HEIGHT}px; display: flex; align-items: center; justify-content: center;
      font-size: 9px; color: ${cfg.borderColor}99;
      border-bottom: 1px solid ${cfg.borderColor}20;
      box-sizing: border-box;
    `;
    cell.textContent = String(ruNum);
    ruNums.appendChild(cell);
  }

  // Rail builder
  function makeRail(): HTMLElement {
    const rail = document.createElement('div');
    rail.style.cssText = `
      width: ${RAIL_W}px; display: flex; flex-direction: column;
      background: ${cfg.railBg};
      border-left: 1px solid ${cfg.borderColor}30;
      border-right: 1px solid ${cfg.borderColor}30;
    `;
    for (let i = 0; i < ru; i++) {
      const slot = document.createElement('div');
      slot.style.cssText = `
        height: ${RU_HEIGHT}px; display: flex; flex-direction: column;
        align-items: center; justify-content: space-evenly;
        border-bottom: 1px solid ${cfg.borderColor}20;
      `;
      for (let s = 0; s < 2; s++) {
        const screw = document.createElement('div');
        screw.style.cssText = `
          width: 10px; height: 10px; border-radius: 50%;
          border: 1px solid ${cfg.screwBorder};
          background: ${cfg.screwBg};
          display: flex; align-items: center; justify-content: center;
        `;
        const dot = document.createElement('div');
        dot.style.cssText = `width:3px;height:3px;border-radius:50%;background:${cfg.screwDot};`;
        screw.appendChild(dot);
        slot.appendChild(screw);
      }
      rail.appendChild(slot);
    }
    return rail;
  }

  // Equipment area
  const equipArea = document.createElement('div');
  equipArea.style.cssText = `
    width: ${EQUIP_W}px; position: relative; background: ${cfg.bodyBg};
    border-right: none;
  `;

  // Draw RU slot lines
  for (let i = 0; i < ru; i++) {
    const line = document.createElement('div');
    line.style.cssText = `
      position: absolute; left: 0; right: 0;
      top: ${i * RU_HEIGHT}px; height: ${RU_HEIGHT}px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      box-sizing: border-box;
    `;
    equipArea.appendChild(line);
  }

  // Draw equipment items
  sideItems.forEach(item => {
    const fromTop = ru - item.ru;
    const block = document.createElement('div');
    block.style.cssText = `
      position: absolute;
      left: 0; right: 0;
      top: ${fromTop * RU_HEIGHT}px;
      height: ${item.equipment.ru * RU_HEIGHT}px;
      background: linear-gradient(135deg, ${item.equipment.color}ee 0%, ${item.equipment.color}99 100%);
      border-left: 3px solid ${cfg.indicatorColor};
      border-radius: 2px;
      display: flex; align-items: center; gap: 6px;
      padding: 0 8px;
      box-sizing: border-box;
      overflow: hidden;
    `;

    const ledDot = document.createElement('div');
    ledDot.style.cssText = `
      width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
      background: ${cfg.indicatorColor}; box-shadow: 0 0 5px ${cfg.indicatorColor};
    `;

    const textWrap = document.createElement('div');
    textWrap.style.cssText = `flex:1; min-width:0; overflow:hidden;`;

    const nameEl = document.createElement('div');
    nameEl.style.cssText = `font-size:10px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
    nameEl.textContent = item.equipment.name;
    textWrap.appendChild(nameEl);

    if (item.equipment.ru >= 2 && item.equipment.model) {
      const modelEl = document.createElement('div');
      modelEl.style.cssText = `font-size:9px;color:rgba(255,255,255,0.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
      modelEl.textContent = item.equipment.model;
      textWrap.appendChild(modelEl);
    }

    const ruBadge = document.createElement('div');
    ruBadge.style.cssText = `font-size:9px;color:rgba(255,255,255,0.4);flex-shrink:0;`;
    ruBadge.textContent = `${item.equipment.ru}U`;

    const iconEl = document.createElement('div');
    iconEl.style.cssText = `font-size:11px;color:rgba(255,255,255,0.25);flex-shrink:0;`;
    iconEl.textContent = TYPE_ICONS_TEXT[item.equipment.type] ?? '?';

    block.appendChild(ledDot);
    block.appendChild(textWrap);
    block.appendChild(ruBadge);
    block.appendChild(iconEl);
    equipArea.appendChild(block);
  });

  bodyRow.appendChild(ruNums);
  bodyRow.appendChild(makeRail());
  bodyRow.appendChild(equipArea);
  bodyRow.appendChild(makeRail());

  // Bottom cap
  const bottomCap = document.createElement('div');
  bottomCap.style.cssText = `
    height: ${BOTTOM_CAP_H}px;
    background: ${cfg.capBg};
    border: 2px solid ${cfg.borderColor};
    border-top: 1px solid ${cfg.borderColor}50;
  `;

  wrap.appendChild(topCap);
  wrap.appendChild(bodyRow);
  wrap.appendChild(bottomCap);
  return wrap;
}

export async function downloadRackPng(rackName: string, ru: number, items: RackItem[]): Promise<void> {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    display: flex; flex-direction: column; gap: 0;
    padding: 24px;
    background: #0f0f0f;
    font-family: ui-monospace, SFMono-Regular, monospace;
    z-index: -1;
  `;

  // Title
  const titleEl = document.createElement('div');
  titleEl.style.cssText = `
    color: #e4e4e7; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;
    margin-bottom: 12px; text-align: center; font-family: ui-monospace, monospace;
  `;
  titleEl.textContent = rackName.toUpperCase();
  container.appendChild(titleEl);

  // Racks row
  const racksRow = document.createElement('div');
  racksRow.style.cssText = `display: flex; gap: 32px; align-items: flex-start;`;

  for (const side of ['front', 'rear'] as RackSide[]) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `display: flex; flex-direction: column; align-items: center; gap: 6px;`;

    const labelEl = document.createElement('div');
    const labelColor = side === 'front' ? '#6ee7b7' : '#fcd34d';
    labelEl.style.cssText = `
      font-size: 9px; font-weight: 800; letter-spacing: 4px; color: ${labelColor};
      text-transform: uppercase; margin-bottom: 4px;
    `;
    labelEl.textContent = side === 'front' ? '◀ FRONT VIEW' : 'REAR VIEW ▶';

    const rackEl = buildRackSideEl(side, ru, items);
    wrapper.appendChild(labelEl);
    wrapper.appendChild(rackEl);
    racksRow.appendChild(wrapper);
  }

  // Divider between the two sides
  const divider = document.createElement('div');
  divider.style.cssText = `
    width: 1px; background: #3f3f46; align-self: stretch; margin: 15px 0;
  `;
  racksRow.insertBefore(divider, racksRow.children[1]);

  container.appendChild(racksRow);
  document.body.appendChild(container);

  try {
    const dataUrl = await toPng(container, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#0f0f0f',
    });
    const a = document.createElement('a');
    a.download = `${rackName.replace(/\s+/g, '-').toLowerCase()}-rack.png`;
    a.href = dataUrl;
    a.click();
  } finally {
    document.body.removeChild(container);
  }
}
