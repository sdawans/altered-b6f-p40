# Altered TCG Tournament Tracker

A static website to track an Altered TCG tournament with Faction Conquest rules. No build step required — just edit JSON files and push to GitHub Pages.

## Quick Start

1. Open `index.html` in a browser via a local server (e.g. `npx serve .` or VS Code Live Server)
2. Edit the JSON files in `data/` to add your tournament data
3. Push to GitHub and enable GitHub Pages

> **Note:** Due to ES modules, you need a local server — opening `index.html` directly as a file won't work.

## Data Files

### `data/tournament.json`
Tournament metadata: name, factions, colors, banned heroes, prizes, lottery rules. Edit this once at setup.

### `data/players.json`
Array of players. Fill in real names and BGA ELO ratings:
```json
[
  { "id": "p01", "name": "RealPlayerName", "status": "active", "elo": 1500 },
  { "id": "p02", "name": "DroppedPlayer", "status": "dropped", "elo": 1420 }
]
```
- `id`: Unique identifier (used in round files to reference players)
- `status`: `"active"` or `"dropped"`
- `elo`: BGA ELO rating (used as third tiebreaker)

### `data/rounds/round1.json` ... `round6.json`
Match results per round:
```json
{
  "round": 1,
  "status": "completed",
  "matches": [
    {
      "player1": { "id": "p01", "faction": "axiom" },
      "player2": { "id": "p02", "faction": "bravos" },
      "winner": "p01"
    }
  ]
}
```
- `status`: `"upcoming"`, `"in_progress"`, or `"completed"`
- `faction`: One of `axiom`, `bravos`, `lyra`, `muna`, `ordis`, `yzmir`
- `winner`: Player ID of winner, or `null` if match is still in progress

## Faction Colors

| Faction | Color  | Banned Hero |
|---------|--------|-------------|
| Axiom   | Copper | Treyst      |
| Bravos  | Red    | Kojo        |
| Lyra    | Pink   | Fen         |
| Muna    | Green  | Rin         |
| Ordis   | Blue   | Sigismar    |
| Yzmir   | Purple | Akesha      |

## Deploying to GitHub Pages

1. `git init && git add . && git commit -m "init"`
2. Push to a GitHub repository
3. Go to Settings → Pages → Source: "Deploy from a branch" → Branch: `main`, folder: `/ (root)`
4. Your site will be live at `https://yourusername.github.io/repo-name/`

## Updating During Tournament

To update results mid-tournament:
1. Edit the relevant `data/rounds/roundN.json` file
2. Update player statuses in `data/players.json` if anyone drops
3. Commit and push — GitHub Pages updates automatically in ~1 minute

## Project Structure

```
├── index.html                  # Single page app
├── css/style.css               # All styles
├── js/
│   ├── app.js                  # Main entry, routing, tab management
│   ├── data.js                 # JSON loading & standings computation
│   ├── ui.js                   # Shared components (faction badges, etc.)
│   └── views/
│       ├── standings.js        # Standings table
│       ├── conquest.js         # Faction conquest grid
│       ├── rounds.js           # Round-by-round match results
│       ├── player.js           # Player detail page
│       └── info.js             # Tournament rules & prizes
├── data/
│   ├── tournament.json         # Tournament config
│   ├── players.json            # Player list
│   └── rounds/
│       ├── round1.json ... round6.json
└── img/                        # Faction icons, hero art, logo (add your own)
    ├── factions/
    └── heroes/
```
