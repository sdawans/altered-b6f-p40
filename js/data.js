// ─── DATA LOADER ───────────────────────────────────────────────
// Fetches tournament.json, players.json, and all round files.
// Computes derived stats (standings, conquest, etc.)

export async function loadTournamentData() {
  const [tournament, players] = await Promise.all([
    fetchJSON('data/tournament.json'),
    fetchJSON('data/players.json'),
  ]);

  // Build faction lookup
  const factions = {};
  tournament.factions.forEach(f => { factions[f.id] = f; });

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

  const standings = computeStandings(players, rounds, factions);

  return { tournament, players, rounds, factions, standings };
}

async function fetchJSON(path) {
  const resp = await fetch(`${path}?v=${Date.now()}`);
  if (!resp.ok) throw new Error(`Failed to fetch ${path}`);
  return resp.json();
}

// ─── STANDINGS COMPUTATION ─────────────────────────────────────

function computeStandings(players, rounds, factions) {
  const stats = {};

  players.forEach(p => {
    stats[p.id] = {
      ...p,
      wins: 0,
      losses: 0,
      points: 0,
      opponents: [],
      factionWins: {},
      factionLosses: {},
      factionPlayed: {},
      factionPending: {},
      matches: [],
    };
  });

  rounds.forEach(round => {
    round.matches.forEach(m => {
      const p1 = stats[m.player1.id];
      const p2 = stats[m.player2.id];
      if (!p1 || !p2) return;

      p1.opponents.push(m.player2.id);
      p2.opponents.push(m.player1.id);

      const f1 = m.player1.faction;
      const f2 = m.player2.faction;

      if (f1) p1.factionPlayed[f1] = (p1.factionPlayed[f1] || 0) + 1;
      if (f2) p2.factionPlayed[f2] = (p2.factionPlayed[f2] || 0) + 1;

      const mi1 = { round: round.round, opponent: m.player2.id, faction: f1, opFaction: f2, result: null };
      const mi2 = { round: round.round, opponent: m.player1.id, faction: f2, opFaction: f1, result: null };

      if (m.winner === m.player1.id) {
        p1.wins++; p1.points += 3;
        if (f1) p1.factionWins[f1] = true;
        p2.losses++;
        if (f2) p2.factionLosses[f2] = (p2.factionLosses[f2] || 0) + 1;
        mi1.result = 'win';
        mi2.result = 'loss';
      } else if (m.winner === m.player2.id) {
        p2.wins++; p2.points += 3;
        if (f2) p2.factionWins[f2] = true;
        p1.losses++;
        if (f1) p1.factionLosses[f1] = (p1.factionLosses[f1] || 0) + 1;
        mi1.result = 'loss';
        mi2.result = 'win';
      } else {
        // Pending (winner is null)
        if (f1) p1.factionPending[f1] = true;
        if (f2) p2.factionPending[f2] = true;
        mi1.result = 'pending';
        mi2.result = 'pending';
      }

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

  // Sort: points desc → resistance desc → ELO desc
  return Object.values(stats).sort((a, b) =>
    b.points - a.points || b.resistance - a.resistance || b.elo - a.elo
  );
}
