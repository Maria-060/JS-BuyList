const DEFAULT_ITEMS = [
  { id: 1, name: 'Помідори', count: 2, bought: false },
  { id: 2, name: 'Печиво',   count: 2, bought: true  },
  { id: 3, name: 'Сир',      count: 1, bought: true  },
];

function loadState() {
  try {
    const saved = localStorage.getItem('buy-list');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.items)) {
        items = parsed.items;
        nextId = parsed.nextId || (Math.max(...items.map(i => i.id)) + 1);
        return;
      }
    }
  } catch (e) {}
  items = DEFAULT_ITEMS.map(i => ({ ...i }));
  nextId = 4;
}

function saveState() {
  try {
    localStorage.setItem('buy-list', JSON.stringify({ items, nextId }));
  } catch (e) {}
}

let items = [];
let nextId = 4;
loadState();

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderList() {
  const list = document.getElementById('items-list');
  list.innerHTML = '';

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'item';
    li.dataset.id = item.id;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'item__name' + (item.bought ? ' is-bought' : '');
    nameSpan.textContent = item.name;
    nameSpan.setAttribute('aria-label', 'Назва товару');

    if (!item.bought) {
      nameSpan.style.cursor = 'pointer';
      nameSpan.dataset.tooltip = 'Натисніть щоб редагувати';
      nameSpan.addEventListener('click', () => startEditName(li, item, nameSpan));
    }

    li.appendChild(nameSpan);

    if (!item.bought) {
      const counter = document.createElement('div');
      counter.className = 'item__counter';

      const minusBtn = document.createElement('button');
      minusBtn.className = 'btn btn--counter minus';
      minusBtn.textContent = '−';
      minusBtn.setAttribute('aria-label', 'Зменшити кількість ' + item.name);
      minusBtn.dataset.tooltip = 'Зменшити кількість';
      if (item.count <= 1) minusBtn.disabled = true;
      minusBtn.addEventListener('click', () => {
        if (item.count > 1) { item.count--; saveState(); renderAll(); }
      });

      const countSpan = document.createElement('span');
      countSpan.className = 'item__count';
      countSpan.textContent = item.count;

      const plusBtn = document.createElement('button');
      plusBtn.className = 'btn btn--counter plus';
      plusBtn.textContent = '+';
      plusBtn.setAttribute('aria-label', 'Збільшити кількість ' + item.name);
      plusBtn.dataset.tooltip = 'Збільшити кількість';
      plusBtn.addEventListener('click', () => {
        item.count++; saveState(); renderAll();
      });

      counter.appendChild(minusBtn);
      counter.appendChild(countSpan);
      counter.appendChild(plusBtn);
      li.appendChild(counter);
    }

    const actions = document.createElement('div');
    actions.className = 'item__actions';

    const boughtBtn = document.createElement('button');
    boughtBtn.className = 'btn btn--bought' + (item.bought ? ' is-bought' : '');
    boughtBtn.textContent = item.bought ? 'Зробити не купленим' : 'Не куплено';
    boughtBtn.setAttribute('aria-label', item.bought ? 'Зробити не купленим: ' + item.name : 'Позначити як куплене: ' + item.name);
    boughtBtn.setAttribute('aria-pressed', item.bought);
    boughtBtn.dataset.tooltip = item.bought ? 'Повернути до списку' : 'Позначити як куплене';
    boughtBtn.addEventListener('click', () => {
      item.bought = !item.bought; saveState(); renderAll();
    });
    actions.appendChild(boughtBtn);

    if (!item.bought) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn--remove';
      removeBtn.textContent = '✕';
      removeBtn.setAttribute('aria-label', 'Видалити ' + item.name);
      removeBtn.dataset.tooltip = 'Видалити товар';
      removeBtn.addEventListener('click', () => {
        items = items.filter(i => i.id !== item.id); saveState(); renderAll();
      });
      actions.appendChild(removeBtn);
    }

    li.appendChild(actions);
    list.appendChild(li);
  });
}

function startEditName(li, item, nameSpan) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'item__name';
  input.value = item.name;
  input.setAttribute('aria-label', 'Редагувати назву товару');

  li.replaceChild(input, nameSpan);
  input.focus();

  function finishEdit() {
    const newName = input.value.trim();
    if (newName) item.name = newName;
    saveState();
    renderAll();
  }

  input.addEventListener('blur', finishEdit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape') { input.value = item.name; input.blur(); }
  });
}

function renderSummary() {
  const remaining = items.filter(i => !i.bought);
  const bought    = items.filter(i =>  i.bought);

  document.getElementById('tags-remaining').innerHTML =
    remaining.length
      ? remaining.map(i => `<span class="tag">${escapeHtml(i.name)}<span class="tag__badge">${i.count}</span></span>`).join('')
      : '<span style="color:#9ca3af;font-size:.85rem">—</span>';

  document.getElementById('tags-bought').innerHTML =
    bought.length
      ? bought.map(i => `<span class="tag">${escapeHtml(i.name)}<span class="tag__badge">${i.count}</span></span>`).join('')
      : '<span style="color:#9ca3af;font-size:.85rem">—</span>';
}

function renderAll() {
  renderList();
  renderSummary();
  attachTooltips();
}

document.getElementById('btn-add').addEventListener('click', addItem);
document.getElementById('new-item').addEventListener('keydown', e => {
  if (e.key === 'Enter') addItem();
});

function addItem() {
  const input = document.getElementById('new-item');
  const name = input.value.trim();
  if (!name) return;
  items.push({ id: nextId++, name, count: 1, bought: false });
  input.value = '';
  input.focus();
  saveState();
  renderAll();
}

// =====================
//  Tooltip
// =====================
const tooltip = document.getElementById('tooltip');
let tooltipTimeout;

function attachTooltips() {
  document.querySelectorAll('[data-tooltip]').forEach(el => {
    el.removeEventListener('mouseenter', onTooltipEnter);
    el.removeEventListener('mouseleave', onTooltipLeave);
    el.addEventListener('mouseenter', onTooltipEnter);
    el.addEventListener('mouseleave', onTooltipLeave);
  });
}

function onTooltipEnter(e) {
  clearTimeout(tooltipTimeout);
  const text = e.currentTarget.dataset.tooltip;
  if (!text) return;
  tooltip.textContent = text;
  tooltip.setAttribute('aria-hidden', 'false');
  positionTooltip(e.currentTarget);
  tooltip.classList.add('is-visible');
}

function onTooltipLeave() {
  tooltip.classList.remove('is-visible');
  tooltipTimeout = setTimeout(() => {
    tooltip.setAttribute('aria-hidden', 'true');
  }, 200);
}

function positionTooltip(el) {
  const rect = el.getBoundingClientRect();
  const tw = tooltip.offsetWidth || 120;
  let left = rect.left + rect.width / 2 - tw / 2;
  const top = rect.top - 40 + window.scrollY;
  left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}

renderAll();
