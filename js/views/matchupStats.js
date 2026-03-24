import { factionBadge } from '../ui.js?v=7';

export function renderMatchupStats(globalStats, factionList, factions) {
  const headers = factionList.map(f =>
    `<th style="padding:8px 4px;text-align:center">${factionBadge(f, { size: 'md' })}</th>`
  ).join('');

  const rows = factionList.map(f1 => {
    const cells = factionList.map(f2 => {
      if (f1.id === f2.id) {
        return '<td class="matchup__cell matchup__cell--self">—</td>';
      }
      const key = `${f1.id}:${f2.id}`;
      const m = globalStats.matchups[key];
      if (!m || (m.wins + m.losses) === 0) {
        return '<td class="matchup__cell matchup__cell--empty">—</td>';
      }
      const total = m.wins + m.losses;
      const rate = (m.wins / total) * 100;
      let color;
      if (rate > 60) color = 'var(--win)';
      else if (rate < 40) color = 'var(--loss)';
      else color = 'var(--text-secondary)';

      return `<td class="matchup__cell" style="color:${color};font-weight:600">${m.wins}-${m.losses}</td>`;
    }).join('');

    return `
      <tr>
        <td style="padding:6px 12px">${factionBadge(f1, { size: 'md', showName: true })}</td>
        ${cells}
      </tr>
    `;
  }).join('');

  document.getElementById('content').innerHTML = `
    <div class="conquest">
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">
        Row faction vs column faction. Shows wins-losses from row's perspective.
      </p>
      <table>
        <thead>
          <tr>
            <th class="label">vs</th>
            ${headers}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
