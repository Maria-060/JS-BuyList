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
      nameSpan.addEventListener('click', () => startEditName(li, item, nameSpan));
    }

    li.appendChild(nameSpan);

    if (!item.bought) {
      const counter = document.createElement('div');
      counter.className = 'item__counter';
      counter.innerHTML = `
        <button
          class="btn btn--counter minus"
          aria-label="Зменшити кількість ${escapeHtml(item.name)}"
          ${item.count <= 1 ? 'disabled' : ''}
        >−</button>
        <span class="item__count">${item.count}</span>
        <button
          class="btn btn--counter plus"
          aria-label="Збільшити кількість ${escapeHtml(item.name)}"
        >+</button>
      `;

      counter.querySelector('.minus').addEventListener('click', () => {
        if (item.count > 1) { item.count--; saveState(); renderAll(); }
      });
      counter.querySelector('.plus').addEventListener('click', () => {
        item.count++; saveState(); renderAll();
      });

      li.appendChild(counter);
    }

    const actions = document.createElement('div');
    actions.className = 'item__actions';

    const boughtBtn = document.createElement('button');
    boughtBtn.className = 'btn btn--bought' + (item.bought ? ' is-bought' : '');
    boughtBtn.textContent = item.bought ? 'Зробити не купленим' : 'Не куплено';
    boughtBtn.setAttribute('aria-label', item.bought ? 'Зробити не купленим: ' + item.name : 'Позначити як куплене: ' + item.name);
    boughtBtn.setAttribute('aria-pressed', item.bought);
    boughtBtn.addEventListener('click', () => {
      item.bought = !item.bought; saveState(); renderAll();
    });
    actions.appendChild(boughtBtn);

    if (!item.bought) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn--remove';
      removeBtn.textContent = '✕';
      removeBtn.setAttribute('aria-label', 'Видалити ' + item.name);
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


renderAll();
