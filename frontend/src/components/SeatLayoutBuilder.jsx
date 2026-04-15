import React, { useState, useEffect, useCallback } from 'react';

const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 14;
const MAX_ROWS = 30;
const MAX_COLS = 40;

const CELL_TYPES = ['empty', 'seat', 'premium', 'aisle'];
const CELL_CYCLE = { empty: 'seat', seat: 'premium', premium: 'aisle', aisle: 'empty' };

const CELL_CONFIG = {
  empty:   { bg: 'bg-slate-800/60', border: 'border-slate-700', text: 'text-slate-600', label: 'Empty', icon: null },
  seat:    { bg: 'bg-emerald-500/30', border: 'border-emerald-400/50', text: 'text-emerald-300', label: 'Normal', icon: null },
  premium: { bg: 'bg-amber-500/30', border: 'border-amber-400/50', text: 'text-amber-300', label: 'Premium', icon: '★' },
  aisle:   { bg: 'bg-transparent', border: 'border-dashed border-slate-700/50', text: 'text-slate-700', label: 'Aisle', icon: null }
};

const rowLabel = (r) => {
  if (r < 26) return String.fromCharCode(65 + r);
  return String.fromCharCode(65 + Math.floor(r / 26) - 1) + String.fromCharCode(65 + (r % 26));
};

const buildEmptyGrid = (rows, cols) =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: 'empty' }))
  );

const gridToLayout = (grid) => {
  const layout = [];
  grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      const isSeat = cell.type === 'seat' || cell.type === 'premium';
      const label = isSeat ? `${rowLabel(r)}${c + 1}` : '';
      layout.push({ row: r, col: c, type: cell.type, label });
    });
  });
  return layout;
};

const layoutToGrid = (seatLayout, rows, cols) => {
  const grid = buildEmptyGrid(rows, cols);
  seatLayout.forEach((cell) => {
    if (cell.row < rows && cell.col < cols) {
      let type = cell.type || 'empty';
      if (type === 'vip' || type === 'wheelchair') type = 'seat';
      grid[cell.row][cell.col] = { type };
    }
  });
  return grid;
};

const SeatLayoutBuilder = ({ existingLayout, layoutRows, layoutCols, onSave, saving }) => {
  const [rows, setRows] = useState(layoutRows || DEFAULT_ROWS);
  const [cols, setCols] = useState(layoutCols || DEFAULT_COLS);
  const [grid, setGrid] = useState(() => {
    if (existingLayout?.length > 0 && layoutRows && layoutCols) {
      return layoutToGrid(existingLayout, layoutRows, layoutCols);
    }
    return buildEmptyGrid(layoutRows || DEFAULT_ROWS, layoutCols || DEFAULT_COLS);
  });

  const [paintMode, setPaintMode] = useState(null);
  const [isPainting, setIsPainting] = useState(false);
  const [zoom, setZoom] = useState(1);

  const resizeGrid = useCallback((newRows, newCols) => {
    setGrid((prev) => {
      const resized = buildEmptyGrid(newRows, newCols);
      prev.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (r < newRows && c < newCols) resized[r][c] = cell;
        });
      });
      return resized;
    });
  }, []);

  const handleRowsChange = (val) => {
    const n = Math.max(1, Math.min(MAX_ROWS, val));
    setRows(n);
    resizeGrid(n, cols);
  };

  const handleColsChange = (val) => {
    const n = Math.max(1, Math.min(MAX_COLS, val));
    setCols(n);
    resizeGrid(rows, n);
  };

  const toggleCell = (r, c) => {
    setGrid((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      if (paintMode) {
        next[r][c].type = paintMode;
      } else {
        next[r][c].type = CELL_CYCLE[next[r][c].type];
      }
      return next;
    });
  };

  const handleMouseDown = (r, c) => {
    setIsPainting(true);
    toggleCell(r, c);
  };

  const handleMouseEnter = (r, c) => {
    if (isPainting) toggleCell(r, c);
  };

  const handleMouseUp = () => setIsPainting(false);

  useEffect(() => {
    const up = () => setIsPainting(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const fillAll = (type) => {
    setGrid(Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ type }))
    ));
  };

  const fillRow = (r, type) => {
    setGrid((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      next[r] = next[r].map(() => ({ type }));
      return next;
    });
  };

  const fillCol = (c, type) => {
    setGrid((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      next.forEach((row) => { row[c] = { type }; });
      return next;
    });
  };

  const markRowPremium = (r) => {
    setGrid((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      next[r] = next[r].map((cell) => {
        if (cell.type === 'seat' || cell.type === 'premium') return { type: 'premium' };
        return cell;
      });
      return next;
    });
  };

  const seatTypes = ['seat', 'premium'];
  const seatCount = grid.flat().filter((c) => seatTypes.includes(c.type)).length;
  const premiumCount = grid.flat().filter((c) => c.type === 'premium').length;
  const normalCount = seatCount - premiumCount;

  const cellSize = Math.max(24, Math.min(36, Math.floor(36 * zoom)));
  const fontSize = Math.max(7, Math.floor(9 * zoom));

  const handleSave = () => {
    const layout = gridToLayout(grid);
    onSave({ seatLayout: layout, layoutRows: rows, layoutCols: cols, totalSeats: seatCount });
  };

  const applyPreset = (preset) => {
    if (preset === 'standard') {
      setRows(12);
      setCols(16);
      const g = buildEmptyGrid(12, 16);
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 16; c++) {
          if (c === 4 || c === 11) g[r][c] = { type: 'aisle' };
          else if (r >= 10) g[r][c] = { type: 'premium' };
          else g[r][c] = { type: 'seat' };
        }
      }
      setGrid(g);
    } else if (preset === 'premium-hall') {
      setRows(8);
      setCols(12);
      const g = buildEmptyGrid(8, 12);
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 12; c++) {
          if (c === 3 || c === 8) g[r][c] = { type: 'aisle' };
          else if (r >= 5) g[r][c] = { type: 'premium' };
          else g[r][c] = { type: 'seat' };
        }
      }
      setGrid(g);
    } else if (preset === 'large') {
      setRows(20);
      setCols(24);
      const g = buildEmptyGrid(20, 24);
      for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 24; c++) {
          if (c === 6 || c === 17) g[r][c] = { type: 'aisle' };
          else if (r >= 17) g[r][c] = { type: 'premium' };
          else if (r === 0 && (c <= 2 || c >= 21)) g[r][c] = { type: 'empty' };
          else g[r][c] = { type: 'seat' };
        }
      }
      setGrid(g);
    }
  };

  return (
    <div className="space-y-4" onMouseUp={handleMouseUp}>
      {/* Top controls bar */}
      <div className="flex flex-wrap items-end gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Rows</label>
          <input
            type="number"
            min="1"
            max={MAX_ROWS}
            value={rows}
            onChange={(e) => handleRowsChange(parseInt(e.target.value, 10) || 1)}
            className="w-16 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm text-center"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Cols</label>
          <input
            type="number"
            min="1"
            max={MAX_COLS}
            value={cols}
            onChange={(e) => handleColsChange(parseInt(e.target.value, 10) || 1)}
            className="w-16 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm text-center"
          />
        </div>

        <div className="h-8 w-px bg-slate-700" />

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Zoom</label>
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="w-7 h-7 rounded bg-slate-800 border border-slate-600 text-slate-300 text-sm hover:bg-slate-700">-</button>
            <span className="text-xs text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))} className="w-7 h-7 rounded bg-slate-800 border border-slate-600 text-slate-300 text-sm hover:bg-slate-700">+</button>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-700" />

        <div className="flex gap-1.5">
          <button onClick={() => fillAll('seat')} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-emerald-500/30 transition-all">
            Fill All Seats
          </button>
          <button onClick={() => fillAll('empty')} className="bg-slate-700/50 hover:bg-slate-700 text-slate-400 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-600 transition-all">
            Clear All
          </button>
        </div>

        <div className="h-8 w-px bg-slate-700" />

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Presets</label>
          <div className="flex gap-1.5">
            <button onClick={() => applyPreset('standard')} className="bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 px-2 py-1.5 rounded-lg text-[11px] font-semibold border border-cyan-500/25 transition-all">
              Standard
            </button>
            <button onClick={() => applyPreset('premium-hall')} className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 px-2 py-1.5 rounded-lg text-[11px] font-semibold border border-amber-500/25 transition-all">
              Premium
            </button>
            <button onClick={() => applyPreset('large')} className="bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 px-2 py-1.5 rounded-lg text-[11px] font-semibold border border-purple-500/25 transition-all">
              Large
            </button>
          </div>
        </div>
      </div>

      {/* Paint mode selector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-2">Paint Tool</label>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setPaintMode(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              paintMode === null ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            Cycle
          </button>
          {CELL_TYPES.map((t) => {
            const cfg = CELL_CONFIG[t];
            return (
              <button
                key={t}
                onClick={() => setPaintMode(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  paintMode === t ? `${cfg.bg} ${cfg.border} ${cfg.text}` : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {cfg.icon ? `${cfg.icon} ` : ''}{cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid with SCREEN AT TOP */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 overflow-auto select-none" style={{ maxHeight: '60vh' }}>
        {/* Screen indicator at TOP */}
        <div className="mb-4" style={{ marginLeft: `${cellSize + 4}px`, marginRight: `${cellSize + 4}px` }}>
          <div className="h-2 bg-linear-to-r from-cyan-500/10 via-cyan-500/40 to-cyan-500/10 rounded-full border border-cyan-500/20"></div>
          <p className="text-center text-[10px] text-cyan-500/50 mt-1 uppercase tracking-[0.25em] font-bold">Screen</p>
        </div>

        {/* Column numbers */}
        <div className="flex gap-px mb-px" style={{ marginLeft: `${cellSize + 4}px` }}>
          {Array.from({ length: cols }, (_, c) => (
            <button
              key={c}
              onClick={() => fillCol(c, paintMode || 'seat')}
              className="flex items-center justify-center text-slate-600 hover:text-cyan-400 font-bold cursor-pointer transition-colors"
              style={{ width: `${cellSize}px`, height: `${Math.floor(cellSize * 0.6)}px`, fontSize: `${Math.max(7, fontSize - 1)}px` }}
              title={`Fill column ${c + 1}`}
            >
              {c + 1}
            </button>
          ))}
        </div>

        {grid.map((row, r) => (
          <div key={r} className="flex gap-px mb-px items-center">
            <button
              onClick={() => fillRow(r, paintMode || 'seat')}
              className="flex items-center justify-center text-cyan-300/70 hover:text-cyan-300 font-bold cursor-pointer transition-colors shrink-0"
              style={{ width: `${cellSize}px`, height: `${cellSize}px`, fontSize: `${Math.max(8, fontSize)}px` }}
              title={`Fill row ${rowLabel(r)}`}
            >
              {rowLabel(r)}
            </button>

            {row.map((cell, c) => {
              const cfg = CELL_CONFIG[cell.type];
              const isSeat = seatTypes.includes(cell.type);
              const label = isSeat ? `${rowLabel(r)}${c + 1}` : '';
              const isAisle = cell.type === 'aisle';

              return (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleMouseDown(r, c); }}
                  onMouseEnter={() => handleMouseEnter(r, c)}
                  className={`rounded border flex items-center justify-center transition-colors cursor-pointer ${cfg.bg} ${cfg.border} ${cfg.text} ${isAisle ? 'opacity-40' : ''}`}
                  style={{ width: `${cellSize}px`, height: `${cellSize}px`, fontSize: `${fontSize}px`, fontWeight: 700, minWidth: `${cellSize}px` }}
                  title={isAisle ? 'Aisle' : (label || 'Empty')}
                >
                  {cfg.icon || label}
                </button>
              );
            })}

            <div className="flex items-center gap-1 shrink-0">
              <div
                className="flex items-center justify-center text-cyan-300/40 font-bold"
                style={{ width: `${cellSize}px`, height: `${cellSize}px`, fontSize: `${Math.max(8, fontSize)}px` }}
              >
                {rowLabel(r)}
              </div>
              <button
                onClick={() => markRowPremium(r)}
                className="text-[9px] text-amber-400/50 hover:text-amber-400 px-1 py-0.5 rounded transition-colors"
                title={`Mark row ${rowLabel(r)} as premium`}
              >
                ★
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Legend + stats */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3 text-[11px]">
            {Object.entries(CELL_CONFIG).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded ${cfg.bg} border ${cfg.border} flex items-center justify-center text-[8px]`}>
                  {cfg.icon || ''}
                </div>
                <span className="text-slate-400">{cfg.label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <span><span className="text-emerald-400 font-bold">{normalCount}</span> normal</span>
            <span><span className="text-amber-400 font-bold">{premiumCount}</span> premium</span>
            <span className="text-white font-bold">{seatCount} total</span>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || seatCount === 0}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2.5 px-8 rounded-xl text-sm transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : seatCount === 0 ? 'Add at least 1 seat' : `Save Layout (${seatCount} seats)`}
        </button>
      </div>
    </div>
  );
};

export default SeatLayoutBuilder;
