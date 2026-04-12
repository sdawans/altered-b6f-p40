import { heroBadge, escapeHtml } from '../ui.js?v=11';

export function renderHeroStats(globalStats, heroList, heroes, factions, selectHero) {
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
    if (!f) return '';
    const decided = s.wins + s.losses;
    const winRate = decided > 0 ? ((s.wins / decided) * 100).toFixed(0) : '—';
    const barWidth = decided > 0 ? (s.wins / decided) * 100 : 0;

    return `
      <tr data-hero="${h.id}" style="cursor:pointer">
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

  document.querySelectorAll('[data-hero]').forEach(tr => {
    tr.addEventListener('click', () => selectHero(tr.dataset.hero));
  });
}

export function renderHeroDetail(heroId, heroes, factions, rounds, standings, globalStats, onBack, selectPlayer) {
  const hero = heroes[heroId];
  if (!hero) return;
  const faction = factions[hero.faction];
  if (!faction) return;

  const s = globalStats.heroStats[heroId] || { picks: 0, wins: 0, losses: 0, pending: 0 };
  const decided = s.wins + s.losses;
  const winRate = decided > 0 ? ((s.wins / decided) * 100).toFixed(0) : '—';

  const playerMap = Object.fromEntries(standings.map(p => [p.id, p]));

  // Collect all matches involving this hero
  const matchList = [];
  rounds.forEach(round => {
    round.matches.forEach(m => {
      if (!m.player2) return;
      const h1 = m.player1.hero;
      const h2 = m.player2.hero;
      if (h1 !== heroId && h2 !== heroId) return;

      // From the perspective of the player using this hero
      const isP1 = h1 === heroId;
      const playerId = isP1 ? m.player1.id : m.player2.id;
      const oppId = isP1 ? m.player2.id : m.player1.id;
      const oppHeroId = isP1 ? h2 : h1;

      let result;
      if (!m.winner) {
        result = 'pending';
      } else if (m.winner === playerId) {
        result = 'win';
      } else {
        result = 'loss';
      }

      matchList.push({ round: round.round, playerId, oppId, oppHeroId, result });
    });
  });

  const matchRows = matchList.map(m => {
    const player = playerMap[m.playerId];
    const opp = playerMap[m.oppId];
    const opH = m.oppHeroId ? heroes[m.oppHeroId] : null;
    const opF = opH ? factions[opH.faction] : null;
    const cls = `match-row match-row--${m.result}`;
    const resCls = `match-row__result match-row__result--${m.result}`;
    const resLabel = m.result === 'win' ? 'WIN' : m.result === 'loss' ? 'LOSS' : 'LIVE';

    return `
      <div class="${cls}">
        <span class="match-row__round">R${m.round}</span>
        <span class="${resCls}">${resLabel}</span>
        <span class="match-row__opponent hero-detail__player" data-player="${m.playerId}" style="cursor:pointer">${player ? escapeHtml(player.name) : 'Unknown'}</span>
        <span class="match-row__vs">vs</span>
        ${heroBadge(opH, opF, { size: 'sm', showName: true })}
        <span class="match-row__opponent hero-detail__player" data-player="${m.oppId}" style="cursor:pointer">${opp ? escapeHtml(opp.name) : 'Unknown'}</span>
      </div>
    `;
  }).join('');

  // Players who have used this hero
  const players = [...new Set(matchList.map(m => m.playerId))];
  const playerBadges = players.map(pid => {
    const p = playerMap[pid];
    if (!p) return '';
    return `<span class="hero-detail__player" data-player="${pid}" style="cursor:pointer;color:${faction.color};font-weight:600">${escapeHtml(p.name)}</span>`;
  }).join(', ');

  document.getElementById('content').innerHTML = `
    <div>
      <button class="back-btn" id="back-btn">← Back</button>
      <div class="player-header">
        <h2 class="player-header__name" style="display:flex;align-items:center;gap:12px">
          ${heroBadge(hero, faction, { size: 'lg' })}
          <span style="color:${faction.color}">${escapeHtml(hero.name)}</span>
        </h2>
        <div class="player-header__stats">
          <span style="color:${faction.color};text-transform:uppercase;font-size:12px;font-weight:600">${faction.name}</span>
          <span><strong>${s.picks}</strong> picks</span>
          <span><strong style="color:var(--win)">${s.wins}</strong>W – <strong style="color:var(--loss)">${s.losses}</strong>L</span>
          ${s.pending > 0 ? `<span style="color:var(--text-muted)">${s.pending} pending</span>` : ''}
          <span>Win rate: <strong>${winRate}${winRate !== '—' ? '%' : ''}</strong></span>
        </div>
      </div>

      <h3 class="section-title">Played by</h3>
      <div style="margin-bottom:28px;font-size:14px">${playerBadges}</div>

      <h3 class="section-title">Match History</h3>
      <div class="match-history">${matchRows}</div>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', onBack);
  document.querySelectorAll('.hero-detail__player').forEach(el => {
    el.addEventListener('click', () => selectPlayer(el.dataset.player));
  });
}
