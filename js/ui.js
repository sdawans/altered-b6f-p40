// ─── SHARED UI HELPERS ──────────────────────────────────────────

export function factionBadge(faction, { size = 'md', showName = false, won = null } = {}) {
  if (!faction) return '';

  const dimmed = won === false ? ' faction-badge--dimmed' : '';
  const borderColor = won === true ? faction.color : won === false ? '#555' : faction.color + '60';

  return `
    <span class="faction-badge faction-badge--${size}${dimmed}"
          style="background:${faction.bg}; border:1.5px solid ${borderColor}; color:${won === false ? '#888' : faction.color}">
      <span class="faction-badge__icon faction-badge__icon--${size}"
            style="background:radial-gradient(circle at 35% 35%, ${faction.color}cc, ${faction.color}44); border:1.5px solid ${faction.color}">
        ${faction.name[0]}
      </span>
      ${showName ? faction.name : ''}
    </span>
  `;
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
