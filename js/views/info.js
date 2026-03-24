import { factionBadge } from '../ui.js?v=7';

export function renderInfo(tournament, factionList) {
  const prizeRows = tournament.prizes.map(p =>
    `<div>${p.rank} — ${p.prize}</div>`
  ).join('');

  const bannedHeroes = factionList.map(f =>
    `<div class="banned-hero">
      <img class="banned-hero__img" src="img/heroes/${f.bannedHero.toLowerCase()}.webp" alt="${f.bannedHero}">
      ${factionBadge(f, { size: 'lg' })}
      <span class="banned-hero__name">${f.bannedHero}</span>
    </div>`
  ).join('');

  document.getElementById('content').innerHTML = `
    <div>
      <div class="info-grid">
        <div class="info-card">
          <h3 class="info-card__title">Format</h3>
          <div class="info-card__body">
            <div><strong>${tournament.format}</strong> format</div>
            <div><strong>Faction Conquest</strong> — win with a faction → can't replay it</div>
            <div><strong>${tournament.totalRounds} rounds</strong>, turn-based (${tournament.turnTime})</div>
            <div>Played on <strong>${tournament.platform}</strong> — <a href="https://boardgamearena.com/tournament?id=525806" target="_blank" style="color:var(--accent);text-decoration:underline">View on BGA</a></div>
          </div>
        </div>

        <div class="info-card">
          <h3 class="info-card__title">Prizes</h3>
          <div class="info-card__body">${prizeRows}</div>
        </div>

        <div class="info-card info-card--full">
          <h3 class="info-card__title">Banned Heroes</h3>
          <div class="banned-heroes">${bannedHeroes}</div>
        </div>

        <div class="info-card info-card--full">
          <h3 class="info-card__title">Lottery</h3>
          <div class="info-card__body">
            <div>${tournament.lottery.prize}</div>
            <div>Play all ${tournament.totalRounds} games → <strong>${tournament.lottery.ticketsForCompletion} ticket</strong></div>
            <div>Play 6 different factions → <strong style="color:var(--gold)">${tournament.lottery.ticketsForAllFactions} tickets</strong></div>
          </div>
        </div>
      </div>
    </div>
  `;
}
