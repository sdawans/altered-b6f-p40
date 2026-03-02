import { heroBadge } from '../ui.js?v=2';

export function renderHeroStats(globalStats, heroList, heroes, factions) {
  // Sort heroes by picks desc, then win rate desc
  const sorted = [...heroList].sort((a, b) => {
    const sa = globalStats.heroStats[a.id] || { picks: 0 };
    const sb = globalStats.heroStats[b.id] || { picks: 0 };
    return sb.picks - sa.picks || sb.wins - sa.wins;
  });

  const rows = sorted.map(h => {
    const s = globalStats.heroStats[h.id] || { picks: 0, wins: 0, losses: 0, pending: 0 };
    if (s.picks === 0) return '';
    const f = factions[h.faction];
    const decided = s.wins + s.losses;
    const winRate = decided > 0 ? ((s.wins / decided) * 100).toFixed(0) : '—';
    const barWidth = decided > 0 ? (s.wins / decided) * 100 : 0;

    return `
      <tr>
        <td>${heroBadge(h, f, { size: 'sm', showName: true })}</td>
        <td style="color:${f.color};font-size:11px;text-transform:uppercase">${f.name}</td>
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
  }).filter(Boolean).join('');

  document.getElementById('content').innerHTML = `
    <div class="standings">
      <table>
        <thead>
          <tr>
            <th>Hero</th>
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
