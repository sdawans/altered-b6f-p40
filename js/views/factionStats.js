import { factionBadge } from '../ui.js?v=4';

export function renderFactionStats(globalStats, factionList, factions) {
  const rows = factionList.map(f => {
    const s = globalStats.factionStats[f.id] || { picks: 0, wins: 0, losses: 0, pending: 0 };
    const decided = s.wins + s.losses;
    const winRate = decided > 0 ? ((s.wins / decided) * 100).toFixed(0) : '—';
    const barWidth = decided > 0 ? (s.wins / decided) * 100 : 0;

    return `
      <tr>
        <td>${factionBadge(f, { size: 'md', showName: true })}</td>
        <td class="center">${s.picks}</td>
        <td class="center" style="color:var(--win)">${s.wins}</td>
        <td class="center" style="color:var(--loss)">${s.losses}</td>
        <td class="center" style="color:var(--text-muted)">${s.pending}</td>
        <td class="center" style="font-weight:700">${winRate}${winRate !== '—' ? '%' : ''}</td>
        <td style="width:120px">
          <div class="stat-bar">
            <div class="stat-bar__fill" style="width:${barWidth}%;background:${f.color}"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  document.getElementById('content').innerHTML = `
    <div class="standings">
      <table>
        <thead>
          <tr>
            <th>Faction</th>
            <th class="center">Picks</th>
            <th class="center">W</th>
            <th class="center">L</th>
            <th class="center">Pending</th>
            <th class="center">Win%</th>
            <th>Win Rate</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
