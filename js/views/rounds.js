import { heroBadge, escapeHtml } from '../ui.js?v=3';

let activeRound = null;

export function renderRounds(rounds, totalRounds, playerMap, factions, heroes, onSelectPlayer) {
  if (activeRound === null) {
    activeRound = rounds.length > 0 ? rounds.length : 1;
  }

  const roundTabs = Array.from({ length: totalRounds }, (_, i) => {
    const r = rounds[i];
    const num = i + 1;
    const status = r ? r.status : 'upcoming';
    const isActive = activeRound === num;

    let cls = 'round-tab';
    if (isActive) cls += ' round-tab--active';
    else if (status === 'upcoming') cls += ' round-tab--upcoming';

    let statusIcon = '';
    if (status === 'in_progress') statusIcon = '<span class="round-tab__status round-tab__status--live">●</span>';
    else if (status === 'completed') statusIcon = '<span class="round-tab__status round-tab__status--done">✓</span>';

    return `<button class="${cls}" data-round="${num}" ${status === 'upcoming' ? 'disabled' : ''}>R${num}${statusIcon}</button>`;
  }).join('');

  const round = rounds[activeRound - 1];
  let matchesHtml;

  if (round && round.matches.length > 0) {
    matchesHtml = round.matches.map(m => {
      const p1 = playerMap[m.player1.id];
      const p2 = playerMap[m.player2.id];
      if (!p1 || !p2) return '';

      const p1Won = m.winner === m.player1.id;
      const p2Won = m.winner === m.player2.id;
      const pending = m.winner === null;

      const p1NameCls = p1Won ? 'match-card__name--winner' : pending ? '' : 'match-card__name--loser';
      const p2NameCls = p2Won ? 'match-card__name--winner' : pending ? '' : 'match-card__name--loser';
      const cardCls = pending ? 'match-card match-card--pending' : 'match-card';

      const p1Star = p1Won ? '<span class="match-card__star">★</span>' : '';
      const p2Star = p2Won ? '<span class="match-card__star">★</span>' : '';

      const h1 = heroes[m.player1.hero];
      const h2 = heroes[m.player2.hero];
      const f1 = h1 ? factions[h1.faction] : null;
      const f2 = h2 ? factions[h2.faction] : null;

      return `
        <div class="${cardCls}">
          <div class="match-card__player" data-player-id="${p1.id}">
            <span class="match-card__name ${p1NameCls}">${escapeHtml(p1.name)}${p1Star}</span>
            ${heroBadge(h1, f1, { size: 'sm', showName: true, won: p1Won ? true : p2Won ? false : null })}
          </div>
          <span class="match-card__vs">vs</span>
          <div class="match-card__player match-card__player--right" data-player-id="${p2.id}">
            ${heroBadge(h2, f2, { size: 'sm', showName: true, won: p2Won ? true : p1Won ? false : null })}
            <span class="match-card__name ${p2NameCls}">${p2Star}${escapeHtml(p2.name)}</span>
          </div>
        </div>
      `;
    }).join('');
  } else {
    matchesHtml = '<div class="round-empty">This round hasn\'t started yet.</div>';
  }

  const container = document.getElementById('content');
  container.innerHTML = `
    <div>
      <div class="round-tabs">${roundTabs}</div>
      <div class="match-list">${matchesHtml}</div>
    </div>
  `;

  container.querySelectorAll('.round-tab:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      activeRound = parseInt(btn.dataset.round);
      renderRounds(rounds, totalRounds, playerMap, factions, heroes, onSelectPlayer);
    });
  });

  container.querySelectorAll('.match-card__player[data-player-id]').forEach(el => {
    el.addEventListener('click', () => onSelectPlayer(el.dataset.playerId));
  });
}
