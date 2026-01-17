// script.js
const searchInput = document.getElementById('search');
const suggestionsEl = document.getElementById('suggestions');
let activeIndex = -1;
let suggestions = [];
let debounceTimer = null;

function clearSuggestions() {
  suggestions = [];
  activeIndex = -1;
  suggestionsEl.innerHTML = '';
  suggestionsEl.style.display = 'none';
}

function renderSuggestions(items) {
  suggestions = items;
  suggestionsEl.innerHTML = '';
  if (!items || items.length === 0) {
    clearSuggestions();
    return;
  }
  items.forEach((it, idx) => {
    const li = document.createElement('li');
    li.className = 'suggestion-item';
    li.setAttribute('role', 'option');
    li.setAttribute('data-url', it.url);
    li.innerHTML = `
      <div class="suggestion-title">${it.title}</div>
      <div class="suggestion-desc">${it.description || ''}</div>
    `;
    li.addEventListener('click', () => {
      window.open(it.url, '_blank');
      clearSuggestions();
    });
    suggestionsEl.appendChild(li);
  });
  suggestionsEl.style.display = 'block';
}

function setActive(index) {
  const items = suggestionsEl.querySelectorAll('.suggestion-item');
  if (!items.length) return;
  items.forEach((el, i) => {
    el.classList.toggle('active', i === index);
    if (i === index) el.scrollIntoView({ block: 'nearest' });
  });
  activeIndex = index;
}

async function fetchSuggestions(query) {
  if (!query || query.length < 2) {
    clearSuggestions();
    return;
  }
  try {
    const url = 'https://fr.wikipedia.org/w/api.php?action=opensearch&format=json&limit=8&origin=*&search=' + encodeURIComponent(query);
    const res = await fetch(url);
    const data = await res.json();
    const titles = data[1] || [];
    const descs = data[2] || [];
    const urls = data[3] || [];
    const items = titles.map((t, i) => ({ title: t, description: descs[i], url: urls[i] }));
    renderSuggestions(items);
  } catch (err) {
    console.error('Erreur suggestions:', err);
    clearSuggestions();
  }
}

function debounceFetch(q) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchSuggestions(q), 250);
}

searchInput.addEventListener('input', (e) => {
  const q = e.target.value.trim();
  debounceFetch(q);
});

searchInput.addEventListener('keydown', (e) => {
  const items = suggestionsEl.querySelectorAll('.suggestion-item');
  if (!items.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = Math.min(activeIndex + 1, items.length - 1);
    setActive(next);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prev = Math.max(activeIndex - 1, 0);
    setActive(prev);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const idx = activeIndex >= 0 ? activeIndex : 0;
    const sel = items[idx];
    if (sel) window.open(sel.getAttribute('data-url'), '_blank');
    clearSuggestions();
  } else if (e.key === 'Escape') {
    clearSuggestions();
  }
});

// close suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (!document.querySelector('.search-container').contains(e.target)) {
    clearSuggestions();
  }
});

// accessibility: allow focus/blur
searchInput.addEventListener('focus', () => {
  if (suggestions.length) suggestionsEl.style.display = 'block';
};

