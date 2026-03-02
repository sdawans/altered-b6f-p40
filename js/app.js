import { loadTournamentData } from './data.js?v=2';
import { renderStandings } from './views/standings.js?v=2';
import { renderConquest } from './views/conquest.js?v=2';
import { renderRounds } from './views/rounds.js?v=2';
import { renderPlayer } from './views/player.js?v=2';
import { renderInfo } from './views/info.js?v=2';
import { renderFactionStats } from './views/factionStats.js?v=2';
import { renderHeroStats } from './views/heroStats.js?v=2';
import { renderMatchupStats } from './views/matchupStats.js?v=2';

let data = null;
let currentTab = 'standings';
let selectedPlayer = null;

// ─── INIT ──────────────────────────────────────────────────────

async function init() {
  try {
    data = await loadTournamentData();
  } catch (err) {
    document.getElementById('content').innerHTML =
      `<div style="text-align:center;padding:60px;color:var(--loss)">
        Failed to load tournament data. Make sure JSON files are in the data/ folder.
        <br><small style="color:var(--text-muted)">${err.message}</small>
      </div>`;
    return;
  }

  renderHeader();
  bindTabs();
  render();
}

// ─── HEADER ────────────────────────────────────────────────────

function renderHeader() {
  const t = data.tournament;
  const activePlayers = data.players.filter(p => p.status === 'active').length;
  const completedRounds = data.rounds.filter(r => r.status === 'completed').length;
  const inProgress = data.rounds.some(r => r.status === 'in_progress');
  const currentRound = inProgress ? completedRounds + 1 : completedRounds;

  document.getElementById('header-subtitle').innerHTML = `BWAT • ${t.subtitle}`;
  document.getElementById('header-title').textContent = t.name;

  const metaHtml = `
    <span>${activePlayers} active players</span>
    <span>•</span>
    <span>Round ${currentRound} / ${t.totalRounds}</span>
    ${inProgress ? '<span class="header__live">● In Progress</span>' : ''}
  `;
  document.getElementById('header-meta').innerHTML = metaHtml;
}

// ─── TABS ──────────────────────────────────────────────────────

function bindTabs() {
  document.querySelectorAll('.tabs__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      selectedPlayer = null;
      updateTabStyles();
      render();
    });
  });
}

function updateTabStyles() {
  document.querySelectorAll('.tabs__btn').forEach(btn => {
    btn.classList.toggle('tabs__btn--active', btn.dataset.tab === currentTab);
  });
}

// ─── RENDER ────────────────────────────────────────────────────

function render() {
  if (!data) return;

  const { tournament, players, rounds, factions, heroes, standings, globalStats } = data;
  const factionList = tournament.factions;
  const heroList = tournament.heroes;
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));

  if (selectedPlayer) {
    document.querySelector('.tabs').style.display = 'none';
    renderPlayer(selectedPlayer, standings, factionList, factions, heroes, () => {
      selectedPlayer = null;
      document.querySelector('.tabs').style.display = '';
      render();
    });
    return;
  }

  document.querySelector('.tabs').style.display = '';

  switch (currentTab) {
    case 'standings':
      renderStandings(standings, factions, selectPlayer);
      break;
    case 'conquest':
      renderConquest(standings, factionList, factions);
      break;
    case 'rounds':
      renderRounds(rounds, tournament.totalRounds, playerMap, factions, heroes, selectPlayer);
      break;
    case 'factionStats':
      renderFactionStats(globalStats, factionList, factions);
      break;
    case 'heroStats':
      renderHeroStats(globalStats, heroList, heroes, factions);
      break;
    case 'matchups':
      renderMatchupStats(globalStats, factionList, factions);
      break;
    case 'info':
      renderInfo(tournament, factionList);
      break;
  }
}

function selectPlayer(playerId) {
  selectedPlayer = playerId;
  render();
}

// ─── BOOT ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
