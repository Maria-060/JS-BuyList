const SIZE = 4;

let grid = [
  [1,  2,  3,  4],
  [5,  6,  7,  8],
  [9,  10, 11, 12],
  [13, 14, 15, ""]
];

let moveCount = 0;
let pivotTable = null;

const movesDisplay = document.getElementById("moves");
const messageBox   = document.getElementById("message");
const newGameBtn   = document.getElementById("shuffleBtn");

function toDataSource() {
  return grid.map(row => ({
    c1: String(row[0]),
    c2: String(row[1]),
    c3: String(row[2]),
    c4: String(row[3])
  }));
}

function buildReport() {
  return {
    dataSource: { data: toDataSource() },
    slice: {
      rows: [
        { uniqueName: "c1" },
        { uniqueName: "c2" },
        { uniqueName: "c3" },
        { uniqueName: "c4" }
      ]
    },
    options: {
      grid: {
        type: "flat",
        showHeaders: false,
        showTotals: false,
        showGrandTotals: false
      }
    }
  };
}

function render() {
  if (!pivotTable) {
    pivotTable = new WebDataRocks({
      container: "#wdr-component",
      toolbar: false,
      report: buildReport()
    });

    pivotTable.on("cellclick", function(cell) {
      const raw = cell.label;
      if (!raw || raw === "") return;

      const num = Number(raw);
      if (isNaN(num)) return;

      const pos = locateTile(num);
      if (pos) tryMove(pos.r, pos.c);
    });
  } else {
    pivotTable.setReport(buildReport());
  }
}

function locateEmpty() {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === "") return { r, c };
  return null;
}

function locateTile(num) {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (Number(grid[r][c]) === num) return { r, c };
  return null;
}

function isAdjacent(r, c) {
  const e = locateEmpty();
  if (!e) return false;
  return Math.abs(r - e.r) + Math.abs(c - e.c) === 1;
}

function tryMove(r, c) {
  if (!isAdjacent(r, c)) return;

  const e = locateEmpty();
  grid[e.r][e.c] = grid[r][c];
  grid[r][c] = "";

  moveCount++;
  movesDisplay.textContent = moveCount;
  messageBox.textContent = "";

  render();

  if (checkWin()) {
    messageBox.textContent = "🎉 Вітаю! Ви виграли!";
  }
}

function checkWin() {
  const target = [
    [1,  2,  3,  4],
    [5,  6,  7,  8],
    [9,  10, 11, 12],
    [13, 14, 15, ""]
  ];
  return JSON.stringify(grid) === JSON.stringify(target);
}

function shuffle() {
  for (let i = 0; i < 150; i++) {
    const e = locateEmpty();
    const neighbors = [
      { r: e.r - 1, c: e.c },
      { r: e.r + 1, c: e.c },
      { r: e.r,     c: e.c - 1 },
      { r: e.r,     c: e.c + 1 }
    ].filter(p => p.r >= 0 && p.r < SIZE && p.c >= 0 && p.c < SIZE);

    const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
    grid[e.r][e.c] = grid[pick.r][pick.c];
    grid[pick.r][pick.c] = "";
  }

  moveCount = 0;
  movesDisplay.textContent = moveCount;
  messageBox.textContent = "";
  render();
}

newGameBtn.addEventListener("click", shuffle);
render();
