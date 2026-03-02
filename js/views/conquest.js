import { factionBadge, escapeHtml } from '../ui.js';

export function renderConquest(standings, factionList, factions) {
  const factionHeaders = factionList.map(f =>
    `<th style="padding:8px 4px;text-align:center">${factionBadge(f, { size: 'sm' })}</th>`
  ).join('');

  const rows = standings.map(p => {
    const conquestCount = Object.keys(p.factionWins).length;
    const uniqueFactions = new Set([
      ...Object.keys(p.factionWins),
      ...Object.keys(p.factionLosses),
      ...Object.keys(p.factionPending),
    ]).size;

    const cells = factionList.map(f => {
      const won = !!p.factionWins[f.id];
      const lossCount = p.factionLosses[f.id] || 0;
      const pending = !!p.factionPending[f.id];

      let content, bg, border, color;

      if (won) {
        content = '<span style="font-size:16px">✦</span>';
        bg = f.bg;
        border = f.color;
        color = f.color;
      } else if (pending) {
        const dots = lossCount > 0
          ? `<span class="loss-corner" style="color:#ef444488">${'✕'.repeat(lossCount)}</span>`
          : '';
        content = `<span style="font-size:14px">⟳</span>${dots}`;
        bg = f.bg + '66';
        border = f.color + '44';
        color = f.color + '99';
      } else if (lossCount > 0) {
        content = '<span style="display:flex;align-items:center;justify-content:center;gap:1px">'
          + Array(lossCount).fill('<span style="font-size:11px;color:#ef444477">✕</span>').join('')
          + '</span>';
        bg = '#111122';
        border = f.color + '22';
        color = '#ef444477';
      } else {
        content = '';
        bg = '#111122';
        border = '#222';
        color = '#333';
      }

      return `<td class="conquest__cell" style="background:${bg};border:1px solid ${border};color:${color}">${content}</td>`;
    }).join('');

    const nameColor = p.status === 'dropped' ? 'var(--text-dim)' : '#d4d4e0';
    const scoreColor = conquestCount >= 5 ? 'var(--gold)' : conquestCount >= 3 ? 'var(--win)' : 'var(--text-secondary)';
    const lotteryColor = uniqueFactions >= 6 ? 'var(--gold)' : uniqueFactions >= 4 ? 'var(--text-secondary)' : 'var(--text-dim)';
    const lotteryBonus = uniqueFactions >= 6 ? ' ✨' : '';

    return `
      <tr style="border-bottom:1px solid #1a1a2e">
        <td class="conquest player-name" style="color:${nameColor}">${escapeHtml(p.name)}</td>
        ${cells}
        <td class="conquest__score" style="color:${scoreColor}">${conquestCount}/6</td>
        <td class="conquest__lottery" style="color:${lotteryColor}" title="Unique factions played (6 = lottery bonus)">${uniqueFactions}/6${lotteryBonus}</td>
      </tr>
    `;
  }).join('');

  document.getElementById('content').innerHTML = `
    <div class="conquest">
      <div class="conquest__legend">
        <span><span style="color:var(--accent)">✦</span> conquered (locked)</span>
        <span><span style="color:#ef444477">✕</span> lost (can replay)</span>
        <span><span style="color:var(--text-secondary)">⟳</span> in progress</span>
        <span style="color:var(--text-dim)">empty = not yet played</span>
      </div>
      <table>
        <thead>
          <tr>
            <th class="label">Player</th>
            ${factionHeaders}
            <th style="padding:8px 12px;text-align:center;color:#777;font-size:11px;text-transform:uppercase">Won</th>
            <th style="padding:8px 12px;text-align:center;color:#777;font-size:11px;text-transform:uppercase" title="Unique factions played (6 = lottery bonus)">🎲</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
