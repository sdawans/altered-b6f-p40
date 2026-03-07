// ─── SHARED UI HELPERS ──────────────────────────────────────────

export function factionBadge(faction, { size = 'md', showName = false, won = null } = {}) {
  if (!faction) return '';

  const dimmed = won === false ? ' faction-badge--dimmed' : '';

  return `
    <span class="faction-badge faction-badge--${size}${dimmed}">
      <img class="faction-badge__icon faction-badge__icon--${size}"
           src="img/factions/${faction.id}.png" alt="${faction.name}">
      ${showName ? `<span style="color:${won === false ? '#888' : faction.color}">${faction.name}</span>` : ''}
    </span>
  `;
}

export function heroBadge(hero, faction, { size = 'sm', showName = false, won = null } = {}) {
  if (!hero || !faction) return '';

  const dimmed = won === false ? ' hero-badge--dimmed' : '';
  const borderColor = won === true ? faction.color : won === false ? '#555' : faction.color + '80';

  return `
    <span class="hero-badge hero-badge--${size}${dimmed}">
      <img class="hero-badge__img hero-badge__img--${size}"
           src="img/heroes/${hero.id}.webp" alt="${hero.name}"
           style="border-color:${borderColor}">
      ${showName ? `<span style="color:${won === false ? '#888' : faction.color}">${hero.name}</span>` : ''}
    </span>
  `;
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
