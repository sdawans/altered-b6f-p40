// ─── DATA LOADER ───────────────────────────────────────────────
// Fetches tournament.json, players.json, and all round files.
// Computes derived stats (standings, conquest, hero/faction stats, matchups)

export async function loadTournamentData() {
  const [tournament, players] = await Promise.all([
    fetchJSON('data/tournament.json'),
    fetchJSON('data/players.json'),
  ]);

  // Build faction lookup
  const factions = {};
  tournament.factions.forEach(f => { factions[f.id] = f; });

  // Build hero lookup (hero id → { ...hero, faction })
  const heroes = {};
  tournament.heroes.forEach(h => { heroes[h.id] = h; });

  // Load all round files (fail silently for upcoming rounds)
  const rounds = [];
  for (let i = 1; i <= tournament.totalRounds; i++) {
    try {
      const round = await fetchJSON(`data/rounds/round${i}.json`);
      if (round && round.matches && round.matches.length > 0) {
        rounds.push(round);
      }
    } catch (e) {
      // Round file doesn't exist or is empty — skip
    }
  }

  // Build set of banned hero IDs
  const bannedHeroes = new Set(tournament.factions.map(f => f.bannedHero.toLowerCase()));

  const standings = computeStandings(players, rounds, heroes, bannedHeroes, tournament.finalRanking);
  const globalStats = computeGlobalStats(rounds, heroes);

  return { tournament, players, rounds, factions, heroes, standings, globalStats };
}

async function fetchJSON(path) {
  const resp = await fetch(`${path}?v=${Date.now()}`);
  if (!resp.ok) throw new Error(`Failed to fetch ${path}`);
  return resp.json();
}

// ─── HELPER: derive faction from hero ──────────────────────────

function heroFaction(heroId, heroes) {
  const h = heroes[heroId];
  return h ? h.faction : null;
}

// ─── STANDINGS COMPUTATION ─────────────────────────────────────

function computeStandings(players, rounds, heroes, bannedHeroes, finalRanking) {
  const stats = {};

  players.forEach(p => {
    stats[p.id] = {
      ...p,
      wins: 0,
      losses: 0,
      points: 0,
      byes: 0,
      opponents: [],
      factionWins: {},
      factionLosses: {},
      factionPlayed: {},
      factionPending: {},
      heroWins: {},
      heroLosses: {},
      heroPlayed: {},
      heroPending: {},
      bannedHeroViolations: [],
      matches: [],
    };
  });

  rounds.forEach(round => {
    round.matches.forEach(m => {
      // Bye match: player2 is null → auto-win, no faction/hero tracking
      if (!m.player2) {
        const p1 = stats[m.player1.id];
        if (!p1) return;
        p1.wins++;
        p1.points += 3;
        p1.byes++;
        p1.matches.push({
          round: round.round, opponent: null, hero: null, opHero: null,
          faction: null, opFaction: null, result: 'bye',
        });
        return;
      }

      const p1 = stats[m.player1.id];
      const p2 = stats[m.player2.id];
      if (!p1 || !p2) return;

      p1.opponents.push(m.player2.id);
      p2.opponents.push(m.player1.id);

      const h1 = m.player1.hero;
      const h2 = m.player2.hero;

      // Winner with null hero (timeout before deck selection) → joker for winner, loss for loser
      if (m.winner && ((!h1 && m.winner === m.player1.id) || (!h2 && m.winner === m.player2.id))) {
        const winner = m.winner === m.player1.id ? p1 : p2;
        const loser = m.winner === m.player1.id ? p2 : p1;
        const loserId = m.winner === m.player1.id ? m.player2.id : m.player1.id;
        const winnerId = m.winner === m.player1.id ? m.player1.id : m.player2.id;
        winner.wins++; winner.points += 3; winner.byes++;
        loser.losses++;
        winner.matches.push({
          round: round.round, opponent: loserId, hero: null, opHero: null,
          faction: null, opFaction: null, result: 'win',
        });
        loser.matches.push({
          round: round.round, opponent: winnerId, hero: null, opHero: null,
          faction: null, opFaction: null, result: 'loss',
        });
        return;
      }

      const f1 = heroFaction(h1, heroes);
      const f2 = heroFaction(h2, heroes);

      if (h1) p1.heroPlayed[h1] = (p1.heroPlayed[h1] || 0) + 1;
      if (h2) p2.heroPlayed[h2] = (p2.heroPlayed[h2] || 0) + 1;
      if (f1) p1.factionPlayed[f1] = (p1.factionPlayed[f1] || 0) + 1;
      if (f2) p2.factionPlayed[f2] = (p2.factionPlayed[f2] || 0) + 1;

      const b1 = h1 && bannedHeroes.has(h1);
      const b2 = h2 && bannedHeroes.has(h2);
      const mi1 = { round: round.round, opponent: m.player2.id, hero: h1, opHero: h2, faction: f1, opFaction: f2, result: null, banned: b1 };
      const mi2 = { round: round.round, opponent: m.player1.id, hero: h2, opHero: h1, faction: f2, opFaction: f1, result: null, banned: b2 };

      if (m.winner === m.player1.id) {
        p1.wins++; p1.points += 3;
        if (f1) p1.factionWins[f1] = true;
        if (h1) p1.heroWins[h1] = true;
        p2.losses++;
        if (f2) p2.factionLosses[f2] = (p2.factionLosses[f2] || 0) + 1;
        if (h2) p2.heroLosses[h2] = (p2.heroLosses[h2] || 0) + 1;
        mi1.result = 'win';
        mi2.result = 'loss';
      } else if (m.winner === m.player2.id) {
        p2.wins++; p2.points += 3;
        if (f2) p2.factionWins[f2] = true;
        if (h2) p2.heroWins[h2] = true;
        p1.losses++;
        if (f1) p1.factionLosses[f1] = (p1.factionLosses[f1] || 0) + 1;
        if (h1) p1.heroLosses[h1] = (p1.heroLosses[h1] || 0) + 1;
        mi1.result = 'loss';
        mi2.result = 'win';
      } else {
        if (f1) p1.factionPending[f1] = true;
        if (f2) p2.factionPending[f2] = true;
        if (h1) p1.heroPending[h1] = true;
        if (h2) p2.heroPending[h2] = true;
        mi1.result = 'pending';
        mi2.result = 'pending';
      }

      // Track banned hero violations (any use of a banned hero)
      if (b1) p1.bannedHeroViolations.push({ round: round.round, hero: h1, faction: f1 });
      if (b2) p2.bannedHeroViolations.push({ round: round.round, hero: h2, faction: f2 });

      p1.matches.push(mi1);
      p2.matches.push(mi2);
    });
  });

  // Compute resistance (average opponent win rate)
  Object.values(stats).forEach(p => {
    const rates = p.opponents.map(oId => {
      const opp = stats[oId];
      const total = opp.wins + opp.losses;
      return total > 0 ? opp.wins / total : 0;
    });
    p.resistance = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  });

  // Sort by official final ranking if available, otherwise points → resistance → ELO
  if (finalRanking && finalRanking.length > 0) {
    const rankIndex = {};
    finalRanking.forEach((id, i) => { rankIndex[id] = i; });
    return Object.values(stats).sort((a, b) => {
      const ra = rankIndex[a.id] !== undefined ? rankIndex[a.id] : 9999;
      const rb = rankIndex[b.id] !== undefined ? rankIndex[b.id] : 9999;
      return ra - rb;
    });
  }
  return Object.values(stats).sort((a, b) =>
    b.points - a.points || b.resistance - a.resistance || b.elo - a.elo
  );
}

// ─── GLOBAL STATS (factions, heroes, matchups) ─────────────────

function computeGlobalStats(rounds, heroes) {
  const factionStats = {};  // factionId → { picks, wins, losses, pending }
  const heroStats = {};     // heroId → { picks, wins, losses, pending }
  const matchups = {};      // "f1 vs f2" → { wins, losses } (from f1's perspective)

  rounds.forEach(round => {
    round.matches.forEach(m => {
      if (!m.player2) return; // skip byes
      const h1 = m.player1.hero;
      const h2 = m.player2.hero;
      const f1 = heroFaction(h1, heroes);
      const f2 = heroFaction(h2, heroes);

      // Hero stats
      if (h1) {
        if (!heroStats[h1]) heroStats[h1] = { picks: 0, wins: 0, losses: 0, pending: 0 };
        heroStats[h1].picks++;
      }
      if (h2) {
        if (!heroStats[h2]) heroStats[h2] = { picks: 0, wins: 0, losses: 0, pending: 0 };
        heroStats[h2].picks++;
      }

      // Faction stats
      if (f1) {
        if (!factionStats[f1]) factionStats[f1] = { picks: 0, wins: 0, losses: 0, pending: 0 };
        factionStats[f1].picks++;
      }
      if (f2) {
        if (!factionStats[f2]) factionStats[f2] = { picks: 0, wins: 0, losses: 0, pending: 0 };
        factionStats[f2].picks++;
      }

      if (m.winner === m.player1.id) {
        if (h1) heroStats[h1].wins++;
        if (h2) heroStats[h2].losses++;
        if (f1) factionStats[f1].wins++;
        if (f2) factionStats[f2].losses++;
        if (f1 && f2) {
          const key = `${f1}:${f2}`;
          if (!matchups[key]) matchups[key] = { wins: 0, losses: 0 };
          matchups[key].wins++;
          const rkey = `${f2}:${f1}`;
          if (!matchups[rkey]) matchups[rkey] = { wins: 0, losses: 0 };
          matchups[rkey].losses++;
        }
      } else if (m.winner === m.player2.id) {
        if (h2) heroStats[h2].wins++;
        if (h1) heroStats[h1].losses++;
        if (f2) factionStats[f2].wins++;
        if (f1) factionStats[f1].losses++;
        if (f1 && f2) {
          const key = `${f1}:${f2}`;
          if (!matchups[key]) matchups[key] = { wins: 0, losses: 0 };
          matchups[key].losses++;
          const rkey = `${f2}:${f1}`;
          if (!matchups[rkey]) matchups[rkey] = { wins: 0, losses: 0 };
          matchups[rkey].wins++;
        }
      } else {
        if (h1) heroStats[h1].pending++;
        if (h2) heroStats[h2].pending++;
        if (f1) factionStats[f1].pending++;
        if (f2) factionStats[f2].pending++;
      }
    });
  });

  return { factionStats, heroStats, matchups };
}
