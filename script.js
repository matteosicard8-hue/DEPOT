// script.js
const searchInput = document.getElementById('search');
const suggestionsEl = document.getElementById('suggestions');
const articlesContainer = document.getElementById('articles');
const articleDetail = document.getElementById('articleDetail');
const backBtn = document.getElementById('backBtn');
const detailContent = document.getElementById('detailContent');

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
    li.setAttribute('data-title', it.title);
    li.innerHTML = `
      <div class="suggestion-title">${it.title}</div>
      <div class="suggestion-desc">${it.description || ''}</div>
    `;
    li.addEventListener('click', () => {
      displayArticle(it.title, it.url);
      clearSuggestions();
      searchInput.value = '';
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
    const url = 'https://fr.wikipedia.org/w/api.php?action=opensearch&format=json&limit=8&origin=*\u0026search=' + encodeURIComponent(query);
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

async function fetchArticleContent(title) {
  try {
    const url = `https://fr.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}&prop=extracts&explaintext=false&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query.pages;
    const page = Object.values(pages)[0];
    return page.extract || '<p>Contenu non disponible</p>';
  } catch (err) {
    console.error('Erreur fetch article:', err);
    return '<p>Erreur lors du chargement de l\u0027article</p>';
  }
}

async function displayArticle(title, wikipediaUrl) {
  articlesContainer.style.display = 'none';
  articleDetail.style.display = 'block';
  detailContent.innerHTML = '<p style="text-align: center; color: #6b7280;">Chargement de l\u0027article...</p>';
  
  const content = await fetchArticleContent(title);
  detailContent.innerHTML = `
    <h1>${title}</h1>
    ${content}
    <p style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.9rem;">
      Source: <a href="${wikipediaUrl}" target="_blank" style="color: #3057ff;">Wikipédia - ${title}</a>
    </p>
  `;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBackToSearch() {
  articlesContainer.style.display = 'flex';
  articleDetail.style.display = 'none';
  detailContent.innerHTML = '';
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
    if (sel) {
      const title = sel.getAttribute('data-title');
      const url = sel.getAttribute('data-url');
      displayArticle(title, url);
      clearSuggestions();
    }
  } else if (e.key === 'Escape') {
    clearSuggestions();
  }
});

document.addEventListener('click', (e) => {
  if (!document.querySelector('.search-container').contains(e.target)) {
    clearSuggestions();
  }
});

backBtn.addEventListener('click', goBackToSearch);