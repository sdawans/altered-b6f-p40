import { factionBadge, escapeHtml } from '../ui.js?v=11';

function computeTickets(p, lottery) {
  const uniqueFactions = new Set([
    ...Object.keys(p.factionWins),
    ...Object.keys(p.factionLosses),
    ...Object.keys(p.factionPlayed),
  ]).size;
  const jokers = p.byes || 0;
  const effectiveUnique = Math.min(uniqueFactions + jokers, 6);
  const played6 = p.matches.length >= 6;
  return played6 ? (effectiveUnique >= 6 ? lottery.ticketsForAllFactions : lottery.ticketsForCompletion) : 0;
}

function ticketDisplay(tickets) {
  if (tickets <= 0) return '';
  return `<span class="lottery-tickets" title="${tickets} lottery ticket${tickets > 1 ? 's' : ''}">${'🎟️'.repeat(tickets)}</span>`;
}

function playerCard(p, rank, factions, { color, prize, medal, tickets, isLotteryWinner }) {
  const conquestBadges = Object.keys(p.factionWins)
    .map(fId => factionBadge(factions[fId], { size: 'sm', won: true }))
    .join('')
    + (p.byes > 0 ? Array(p.byes).fill('<span class="joker-badge" title="Joker">?</span>').join('') : '');

  const violation = p.bannedHeroViolations.length > 0
    ? '<span style="color:#f59e0b;font-size:11px;margin-left:4px" title="Played banned hero">⚠</span>' : '';

  const lotteryBadge = isLotteryWinner ? '<div class="podium__lottery-badge">🎲 Lottery Winner!</div>' : '';

  return `
    <div class="podium__card podium__card--${rank}" data-player-id="${p.id}">
      <div class="podium__medal" style="color:${color}">${medal}</div>
      <div class="podium__name">${escapeHtml(p.name)}${violation}</div>
      <div class="podium__stats">
        <span style="color:var(--win);font-weight:700">${p.wins}W</span>
        <span style="color:var(--loss);font-weight:700">${p.losses}L</span>
        <span style="font-weight:700">${p.points}pts</span>
        <span style="color:var(--text-secondary)">${(p.resistance * 100).toFixed(0)}%</span>
      </div>
      <div class="podium__conquest">${conquestBadges}</div>
      <div class="podium__prize" style="color:${color}">${prize}</div>
      ${tickets > 0 ? `<div class="podium__tickets">${ticketDisplay(tickets)}</div>` : ''}
      ${lotteryBadge}
    </div>
  `;
}

function prizeRow(p, rank, factions, prize, tickets, isLotteryWinner) {
  const conquestBadges = Object.keys(p.factionWins)
    .map(fId => factionBadge(factions[fId], { size: 'sm', won: true }))
    .join('')
    + (p.byes > 0 ? Array(p.byes).fill('<span class="joker-badge" title="Joker">?</span>').join('') : '');

  const violation = p.bannedHeroViolations.length > 0
    ? '<span style="color:#f59e0b;font-size:11px;margin-left:4px" title="Played banned hero">⚠</span>' : '';

  const lotteryTag = isLotteryWinner
    ? '<span class="lottery-winner-tag">🎲 Winner!</span>' : '';

  const rowClass = isLotteryWinner ? ' class="lottery-winner-row"' : '';

  return `
    <tr data-player-id="${p.id}" style="cursor:pointer"${rowClass}>
      <td class="center" style="font-weight:700;font-size:16px;color:${prize ? prize.color : '#666'}">${rank}</td>
      <td><span style="font-weight:600">${escapeHtml(p.name)}</span>${violation} ${lotteryTag}</td>
      <td class="center" style="color:var(--win);font-weight:600">${p.wins}</td>
      <td class="center" style="color:var(--loss);font-weight:600">${p.losses}</td>
      <td class="center" style="font-weight:700">${p.points}</td>
      <td class="center" style="color:var(--text-secondary)">${(p.resistance * 100).toFixed(0)}%</td>
      <td class="center"><div class="standings__factions">${conquestBadges}</div></td>
      <td class="center" style="font-weight:600;color:${prize ? prize.color : 'var(--text-dim)'}">${prize ? prize.prize : '—'}</td>
      <td class="center">${ticketDisplay(tickets)}</td>
    </tr>
  `;
}

const PRIZES = {
  1: { prize: '5 boosters', color: '#ffd700' },
  2: { prize: '4 boosters', color: '#c0c0c0' },
  3: { prize: '3 boosters', color: '#cd7f32' },
  4: { prize: '3 boosters', color: '#cd7f32' },
  5: { prize: '2 boosters', color: '#6a8caf' },
  6: { prize: '2 boosters', color: '#6a8caf' },
  7: { prize: '1 booster', color: '#557788' },
  8: { prize: '1 booster', color: '#557788' },
  9: { prize: '1 booster', color: '#557788' },
  10: { prize: '1 booster', color: '#557788' },
  11: { prize: '1 booster', color: '#557788' },
};

export function renderResults(standings, factions, tournament, onSelectPlayer) {
  const lottery = tournament.lottery;
  const active = standings.filter(p => p.status !== 'dropped');
  const lotteryWinnerIds = new Set(lottery.winners || []);
  const playerMap = Object.fromEntries(standings.map(p => [p.id, p]));

  // Compute tickets for each player
  const ticketsMap = {};
  active.forEach(p => { ticketsMap[p.id] = computeTickets(p, lottery); });

  // Podium: top 3
  const [first, second, third] = active;

  // 4th-11th: prize cut
  const prizeCut = active.slice(3, 11);
  const prizeCutRows = prizeCut.map((p, i) => prizeRow(p, i + 4, factions, PRIZES[i + 4], ticketsMap[p.id], lotteryWinnerIds.has(p.id))).join('');

  // 12th+: rest
  const rest = active.slice(11);
  const restRows = rest.map((p, i) => prizeRow(p, i + 12, factions, null, ticketsMap[p.id], lotteryWinnerIds.has(p.id))).join('');

  const tableHeaders = `
    <th class="center">#</th>
    <th>Player</th>
    <th class="center">W</th>
    <th class="center">L</th>
    <th class="center">Pts</th>
    <th class="center">Res%</th>
    <th class="center">Conquest</th>
    <th class="center">Prize</th>
    <th class="center" title="Lottery tickets">🎲</th>
  `;

  // Lottery winners section
  const lotteryWinners = (lottery.winners || []).map(id => playerMap[id]).filter(Boolean);
  const lotterySection = lotteryWinners.length > 0 ? `
    <div class="results__section">
      <div class="lottery-winners">
        <div class="lottery-winners__header">
          <span class="lottery-winners__icon">🎲</span>
          <h3 class="lottery-winners__title">Lottery Winners</h3>
          <span class="lottery-winners__icon">🎲</span>
        </div>
        <div class="lottery-winners__prize">${escapeHtml(lottery.prize)}</div>
        <div class="lottery-winners__cards">
          ${lotteryWinners.map(p => `
            <div class="lottery-winner-card" data-player-id="${p.id}">
              <div class="lottery-winner-card__emoji">🎉</div>
              <div class="lottery-winner-card__name">${escapeHtml(p.name)}</div>
              <div class="lottery-winner-card__tickets">${ticketDisplay(ticketsMap[p.id])} drawn from ${ticketsMap[p.id]} ticket${ticketsMap[p.id] > 1 ? 's' : ''}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  ` : '';

  document.getElementById('content').innerHTML = `
    <div class="results">
      <h2 class="results__title">Final Results</h2>

      <div class="results__section">
        <div class="podium">
          <div class="podium__row podium__row--top">
            ${playerCard(first, 1, factions, { color: '#ffd700', prize: '5 boosters', medal: '🥇', tickets: ticketsMap[first.id], isLotteryWinner: lotteryWinnerIds.has(first.id) })}
          </div>
          <div class="podium__row podium__row--bottom">
            ${playerCard(second, 2, factions, { color: '#c0c0c0', prize: '4 boosters', medal: '🥈', tickets: ticketsMap[second.id], isLotteryWinner: lotteryWinnerIds.has(second.id) })}
            ${playerCard(third, 3, factions, { color: '#cd7f32', prize: '3 boosters', medal: '🥉', tickets: ticketsMap[third.id], isLotteryWinner: lotteryWinnerIds.has(third.id) })}
          </div>
        </div>
      </div>

      ${lotterySection}

      <div class="results__section">
        <h3 class="section-title">4th – 11th Place</h3>
        <div class="standings">
          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${prizeCutRows}</tbody>
          </table>
        </div>
      </div>

      ${rest.length > 0 ? `
      <div class="results__section">
        <h3 class="section-title">12th – ${active.length}th Place</h3>
        <div class="standings">
          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${restRows}</tbody>
          </table>
        </div>
      </div>` : ''}

      <div class="results__lottery-info">
        <strong>🎲 Lottery:</strong> ${escapeHtml(lottery.prize)}
        <span style="color:var(--text-muted);margin-left:8px">·</span>
        6 rounds played = <strong>${lottery.ticketsForCompletion} ticket</strong>
        <span style="color:var(--text-muted)">·</span>
        6 different factions = <strong>${lottery.ticketsForAllFactions} tickets</strong>
      </div>
    </div>
  `;

  // Bind click events for player detail
  document.querySelectorAll('[data-player-id]').forEach(el => {
    el.addEventListener('click', () => onSelectPlayer(el.dataset.playerId));
  });
}
