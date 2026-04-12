import { factionBadge, escapeHtml } from '../ui.js?v=11';

const PRIZE_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32', '#cd7f32', '#6a8caf', '#6a8caf',
  '#557788', '#557788', '#557788', '#557788', '#557788'];

export function renderStandings(standings, factions, onSelectPlayer) {
  const rows = standings.map((p, i) => {
    const conqueredBadges = Object.keys(p.factionWins)
      .map(fId => factionBadge(factions[fId], { size: 'md', won: true }))
      .join('')
      + (p.byes > 0 ? Array(p.byes).fill('<span class="joker-badge" title="Joker (bye win — wildcard conquest)">?</span>').join('') : '');

    const rankColor = i < 11 ? PRIZE_COLORS[i] : '#666';
    const nameClass = p.status === 'dropped' ? 'standings__name standings__name--dropped' : 'standings__name';
    const droppedBadge = p.status === 'dropped' ? '<span class="badge-dropped">dropped</span>' : '';
    const violationBadge = p.bannedHeroViolations.length > 0
      ? '<span style="color:#f59e0b;font-size:11px;margin-left:4px" title="Played banned hero">⚠</span>' : '';

    return `
      <tr data-player-id="${p.id}">
        <td class="standings__rank" style="color:${rankColor}">${i + 1}</td>
        <td><span class="${nameClass}">${escapeHtml(p.name)}</span>${droppedBadge}${violationBadge}</td>
        <td class="center standings__wins">${p.wins}</td>
        <td class="center standings__losses">${p.losses}</td>
        <td class="center standings__points">${p.points}</td>
        <td class="center" style="color:var(--text-secondary)">${(p.resistance * 100).toFixed(0)}%</td>
        <td class="center" style="color:var(--text-muted)">${p.elo}</td>
        <td class="center"><div class="standings__factions">${conqueredBadges}</div></td>
      </tr>
    `;
  }).join('');

  const html = `
    <div class="standings">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th class="center">W</th>
            <th class="center">L</th>
            <th class="center">Pts</th>
            <th class="center">Res%</th>
            <th class="center">ELO</th>
            <th class="center">Factions Won</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  const container = document.getElementById('content');
  container.innerHTML = html;

  // Bind click events
  container.querySelectorAll('tr[data-player-id]').forEach(row => {
    row.addEventListener('click', () => onSelectPlayer(row.dataset.playerId));
  });
}
