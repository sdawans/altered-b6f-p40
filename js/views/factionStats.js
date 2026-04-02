import { factionBadge, heroBadge, escapeHtml } from '../ui.js?v=9';

export function renderFactionStats(globalStats, factionList, factions, selectFaction) {
  const rows = factionList.map(f => {
    const s = globalStats.factionStats[f.id] || { picks: 0, wins: 0, losses: 0, pending: 0 };
    const decided = s.wins + s.losses;
    const winRate = decided > 0 ? ((s.wins / decided) * 100).toFixed(0) : '—';
    const barWidth = decided > 0 ? (s.wins / decided) * 100 : 0;

    return `
      <tr data-faction="${f.id}" style="cursor:pointer">
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

  document.querySelectorAll('[data-faction]').forEach(tr => {
    tr.addEventListener('click', () => selectFaction(tr.dataset.faction));
  });
}

export function renderFactionDetail(factionId, factions, heroes, heroList, rounds, standings, globalStats, onBack, selectPlayer, selectHero) {
  const faction = factions[factionId];
  if (!faction) return;

  const s = globalStats.factionStats[factionId] || { picks: 0, wins: 0, losses: 0, pending: 0 };
  const decided = s.wins + s.losses;
  const winRate = decided > 0 ? ((s.wins / decided) * 100).toFixed(0) : '—';

  const playerMap = Object.fromEntries(standings.map(p => [p.id, p]));

  // Heroes within this faction with their stats
  const factionHeroes = heroList.filter(h => h.faction === factionId);
  const heroRows = factionHeroes.map(h => {
    const hs = globalStats.heroStats[h.id] || { picks: 0, wins: 0, losses: 0, pending: 0 };
    if (hs.picks === 0) return '';
    const hDecided = hs.wins + hs.losses;
    const hWinRate = hDecided > 0 ? ((hs.wins / hDecided) * 100).toFixed(0) : '—';
    const barWidth = hDecided > 0 ? (hs.wins / hDecided) * 100 : 0;

    return `
      <tr data-hero="${h.id}" style="cursor:pointer">
        <td>${heroBadge(h, faction, { size: 'sm', showName: true })}</td>
        <td class="center">${hs.picks}</td>
        <td class="center" style="color:var(--win)">${hs.wins}</td>
        <td class="center" style="color:var(--loss)">${hs.losses}</td>
        <td class="center" style="font-weight:700">${hWinRate}${hWinRate !== '—' ? '%' : ''}</td>
        <td style="width:100px">
          <div class="stat-bar">
            <div class="stat-bar__fill" style="width:${barWidth}%;background:${faction.color}"></div>
          </div>
        </td>
      </tr>
    `;
  }).filter(Boolean).join('');

  const unpickedHeroes = factionHeroes.filter(h => {
    const hs = globalStats.heroStats[h.id];
    return !hs || hs.picks === 0;
  });
  const unpickedHtml = unpickedHeroes.length > 0
    ? `<div style="margin-top:8px;font-size:13px;color:var(--text-dim)">Not yet picked: ${unpickedHeroes.map(h => heroBadge(h, faction, { size: 'sm', showName: true, won: false })).join(' ')}</div>`
    : '';

  // All matches involving this faction
  const matchList = [];
  rounds.forEach(round => {
    round.matches.forEach(m => {
      if (!m.player2) return;
      const h1 = m.player1.hero;
      const h2 = m.player2.hero;
      const f1 = h1 && heroes[h1] ? heroes[h1].faction : null;
      const f2 = h2 && heroes[h2] ? heroes[h2].faction : null;
      if (f1 !== factionId && f2 !== factionId) return;

      // From the perspective of the player using this faction
      const isP1 = f1 === factionId;
      const playerId = isP1 ? m.player1.id : m.player2.id;
      const playerHeroId = isP1 ? h1 : h2;
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

      matchList.push({ round: round.round, playerId, playerHeroId, oppId, oppHeroId, result });
    });
  });

  const matchRows = matchList.map(m => {
    const player = playerMap[m.playerId];
    const opp = playerMap[m.oppId];
    const pH = m.playerHeroId ? heroes[m.playerHeroId] : null;
    const pF = pH ? factions[pH.faction] : null;
    const opH = m.oppHeroId ? heroes[m.oppHeroId] : null;
    const opF = opH ? factions[opH.faction] : null;
    const cls = `match-row match-row--${m.result}`;
    const resCls = `match-row__result match-row__result--${m.result}`;
    const resLabel = m.result === 'win' ? 'WIN' : m.result === 'loss' ? 'LOSS' : 'LIVE';

    return `
      <div class="${cls}">
        <span class="match-row__round">R${m.round}</span>
        <span class="${resCls}">${resLabel}</span>
        ${heroBadge(pH, pF, { size: 'sm', showName: true })}
        <span class="faction-detail__player" data-player="${m.playerId}" style="cursor:pointer">${player ? escapeHtml(player.name) : 'Unknown'}</span>
        <span class="match-row__vs">vs</span>
        ${heroBadge(opH, opF, { size: 'sm', showName: true })}
        <span class="faction-detail__player" data-player="${m.oppId}" style="cursor:pointer">${opp ? escapeHtml(opp.name) : 'Unknown'}</span>
      </div>
    `;
  }).join('');

  document.getElementById('content').innerHTML = `
    <div>
      <button class="back-btn" id="back-btn">← Back</button>
      <div class="player-header">
        <h2 class="player-header__name" style="display:flex;align-items:center;gap:12px">
          ${factionBadge(faction, { size: 'lg' })}
          <span style="color:${faction.color}">${escapeHtml(faction.name)}</span>
        </h2>
        <div class="player-header__stats">
          <span><strong>${s.picks}</strong> picks</span>
          <span><strong style="color:var(--win)">${s.wins}</strong>W – <strong style="color:var(--loss)">${s.losses}</strong>L</span>
          ${s.pending > 0 ? `<span style="color:var(--text-muted)">${s.pending} pending</span>` : ''}
          <span>Win rate: <strong>${winRate}${winRate !== '—' ? '%' : ''}</strong></span>
        </div>
      </div>

      <h3 class="section-title">Heroes</h3>
      <div class="standings" style="margin-bottom:28px">
        <table>
          <thead>
            <tr>
              <th>Hero</th>
              <th class="center">Picks</th>
              <th class="center">W</th>
              <th class="center">L</th>
              <th class="center">Win%</th>
              <th>Win Rate</th>
            </tr>
          </thead>
          <tbody>${heroRows}</tbody>
        </table>
        ${unpickedHtml}
      </div>

      <h3 class="section-title">Match History</h3>
      <div class="match-history">${matchRows}</div>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', onBack);
  document.querySelectorAll('.faction-detail__player').forEach(el => {
    el.addEventListener('click', () => selectPlayer(el.dataset.player));
  });
  document.querySelectorAll('[data-hero]').forEach(el => {
    el.addEventListener('click', () => selectHero(el.dataset.hero));
  });
}
