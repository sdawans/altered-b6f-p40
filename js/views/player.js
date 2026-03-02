import { factionBadge, heroBadge, escapeHtml } from '../ui.js?v=3';

export function renderPlayer(playerId, standings, factionList, factions, heroes, onBack) {
  const stat = standings.find(s => s.id === playerId);
  if (!stat) return;

  const playerMap = Object.fromEntries(standings.map(p => [p.id, p]));

  const droppedBadge = stat.status === 'dropped'
    ? '<span class="badge-dropped" style="margin-left:12px;vertical-align:middle">DROPPED</span>' : '';

  const conquestBadges = factionList.map(f => {
    const won = stat.factionWins[f.id];
    const played = stat.factionPlayed[f.id];
    const pending = stat.matches.some(m => m.faction === f.id && m.result === 'pending');
    const wonState = won ? true : pending ? null : played ? false : null;
    return factionBadge(f, { size: 'lg', showName: true, won: wonState });
  }).join('');

  const matchRows = stat.matches.map(m => {
    const opp = playerMap[m.opponent];
    const h = heroes[m.hero];
    const opH = heroes[m.opHero];
    const f = h ? factions[h.faction] : null;
    const opF = opH ? factions[opH.faction] : null;
    const cls = `match-row match-row--${m.result}`;
    const resCls = `match-row__result match-row__result--${m.result}`;
    const resLabel = m.result === 'win' ? 'WIN' : m.result === 'loss' ? 'LOSS' : 'LIVE';

    return `
      <div class="${cls}">
        <span class="match-row__round">R${m.round}</span>
        <span class="${resCls}">${resLabel}</span>
        ${heroBadge(h, f, { size: 'sm', showName: true })}
        <span class="match-row__vs">vs</span>
        ${heroBadge(opH, opF, { size: 'sm', showName: true })}
        <span class="match-row__opponent">${opp ? escapeHtml(opp.name) : 'Unknown'}</span>
      </div>
    `;
  }).join('');

  document.getElementById('content').innerHTML = `
    <div>
      <button class="back-btn" id="back-btn">← Back</button>
      <div class="player-header">
        <h2 class="player-header__name">${escapeHtml(stat.name)}${droppedBadge}</h2>
        <div class="player-header__stats">
          <span><strong>${stat.points}</strong> pts</span>
          <span><strong style="color:var(--win)">${stat.wins}</strong>W – <strong style="color:var(--loss)">${stat.losses}</strong>L</span>
          <span>Resistance: ${(stat.resistance * 100).toFixed(0)}%</span>
          <span>ELO: ${stat.elo}</span>
        </div>
      </div>

      <h3 class="section-title">Faction Conquest</h3>
      <div class="player-conquest">${conquestBadges}</div>

      <h3 class="section-title">Match History</h3>
      <div class="match-history">${matchRows}</div>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', onBack);
}
