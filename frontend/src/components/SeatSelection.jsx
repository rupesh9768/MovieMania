import React, { useState, useEffect, useMemo } from 'react';
import { getBookedSeats } from '../api/bookingService';
import { backendApi } from '../api';

const rowLabel = (r) => {
  if (r < 26) return String.fromCharCode(65 + r);
  return String.fromCharCode(65 + Math.floor(r / 26) - 1) + String.fromCharCode(65 + (r % 26));
};

/**
 * SeatSelection Component
 * Props:
 * - onNext: (seats, totalPrice) => void
 * - basePrice: price per ticket (default 350)
 * - movieId, showtimeId: for fetching booked seats
 * - theaterId: optional — theater ObjectId to fetch layout
 * - hallName: optional — hall name string (e.g. "Hall A - Standard")
 */
const SeatSelection = ({ onNext, basePrice = 350, premiumPrice, movieId, showtimeId, theaterId, hallName }) => {

  // Default grid config (fallback when no custom layout)
  const DEFAULT_ROWS = 10;
  const DEFAULT_COLS = 10;

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [reservedSeats, setReservedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Custom layout state
  const [customLayout, setCustomLayout] = useState(null); // { seatLayout, layoutRows, layoutCols }
  const [layoutLoading, setLayoutLoading] = useState(false);

  // Fetch custom layout from backend
  useEffect(() => {
    const loadLayout = async () => {
      if (!theaterId) return;

      setLayoutLoading(true);
      try {
        // Get the theater to find the matching hall
        const theater = await backendApi.getTheaterById(theaterId);
        if (!theater?.halls?.length) return;

        // Find hall by matching the hallName (e.g. "Hall A - Standard")
        const hall = theater.halls.find((h) => {
          const fullName = `${h.name} - ${h.type}`;
          return fullName === hallName || h.name === hallName;
        });

        if (hall?.seatLayout?.length > 0 && hall.layoutRows > 0 && hall.layoutCols > 0) {
          setCustomLayout({
            seatLayout: hall.seatLayout,
            layoutRows: hall.layoutRows,
            layoutCols: hall.layoutCols
          });
        }
      } catch (err) {
        console.error('Failed to load seat layout:', err);
      } finally {
        setLayoutLoading(false);
      }
    };

    loadLayout();
  }, [theaterId, hallName]);

  // Fetch occupied seats from backend API
  useEffect(() => {
    const loadOccupiedSeats = async () => {
      if (!movieId || !showtimeId) {
        setBookedSeats([]);
        setReservedSeats([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const seatState = await getBookedSeats(movieId, showtimeId);
        setBookedSeats(Array.isArray(seatState?.bookedSeats) ? seatState.bookedSeats : []);
        setReservedSeats(Array.isArray(seatState?.reservedSeats) ? seatState.reservedSeats : []);
      } catch (error) {
        console.error('Failed to fetch booked seats:', error);
        setBookedSeats([]);
        setReservedSeats([]);
      }
      setLoading(false);
    };

    loadOccupiedSeats();
  }, [movieId, showtimeId]);

  // Build the grid from custom layout or default
  const { grid, gridRows, gridCols, hasPremium } = useMemo(() => {
    if (customLayout) {
      const { seatLayout, layoutRows, layoutCols } = customLayout;
      const g = Array.from({ length: layoutRows }, () =>
        Array.from({ length: layoutCols }, () => ({ type: 'empty', label: '' }))
      );
      let premFound = false;
      seatLayout.forEach((cell) => {
        if (cell.row < layoutRows && cell.col < layoutCols) {
          let type = cell.type || 'empty';
          // Map legacy types to 'seat'
          if (type === 'vip' || type === 'wheelchair') type = 'seat';
          g[cell.row][cell.col] = { type, label: cell.label || '' };
          if (type === 'premium') premFound = true;
        }
      });
      return { grid: g, gridRows: layoutRows, gridCols: layoutCols, hasPremium: premFound };
    }

    // Default grid
    const defaultRows = Array.from({ length: DEFAULT_ROWS }, (_, r) =>
      Array.from({ length: DEFAULT_COLS }, (_, c) => ({
        type: 'seat',
        label: `${rowLabel(r)}${c + 1}`
      }))
    );
    return { grid: defaultRows, gridRows: DEFAULT_ROWS, gridCols: DEFAULT_COLS, hasPremium: false };
  }, [customLayout]);

  const toggleSeat = (label) => {
    if (bookedSeats.includes(label) || reservedSeats.includes(label)) return;
    setSelectedSeats((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  // Count totals
  const allSeatLabels = useMemo(() => {
    const labels = [];
    grid.forEach((row) => row.forEach((cell) => {
      if (['seat', 'premium'].includes(cell.type) && cell.label) labels.push(cell.label);
    }));
    return labels;
  }, [grid]);

  // Build a map of seat label -> type for pricing
  const seatTypeMap = useMemo(() => {
    const map = {};
    grid.forEach((row) => row.forEach((cell) => {
      if (cell.label && ['seat', 'premium'].includes(cell.type)) {
        map[cell.label] = cell.type;
      }
    }));
    return map;
  }, [grid]);

  const effectivePremiumPrice = premiumPrice || basePrice;
  const totalPrice = selectedSeats.reduce((sum, seatId) => {
    const type = seatTypeMap[seatId];
    return sum + (type === 'premium' ? effectivePremiumPrice : basePrice);
  }, 0);
  const unavailableSeats = [...new Set([...bookedSeats, ...reservedSeats])];
  const availableCount = allSeatLabels.filter((l) => !unavailableSeats.includes(l)).length;
  const sortedSelectedSeats = [...selectedSeats].sort();

  if (loading || layoutLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading seat map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white p-4 flex flex-col items-center overflow-x-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-5xl mb-6 flex items-center justify-between z-10">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Choose Your Seats</h2>
          <p className="text-xs text-slate-400 mt-1">Booked and reserved seats are locked and cannot be selected.</p>
        </div>
        {selectedSeats.length > 0 && (
          <button
            onClick={() => setSelectedSeats([])}
            className="text-xs text-slate-300 hover:text-white border border-slate-700 hover:border-cyan-500/50 rounded-lg px-3 py-1.5 transition-all bg-slate-900/60"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* --- THE CURVED SCREEN --- */}
      <div className="relative w-full max-w-5xl mb-12 perspective-normal z-10">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-cyan-500/40 blur-[60px] rounded-full pointer-events-none"></div>
        <div className="h-16 w-full border-t-[6px] border-cyan-300/70 rounded-[50%] shadow-[0_-10px_40px_rgba(34,211,238,0.4)] bg-linear-to-b from-cyan-500/15 to-transparent"></div>
        <div className="text-center mt-4">
          <p className="text-cyan-400/50 tracking-[0.8em] text-[10px] font-bold uppercase">Cinema Screen</p>
          <p className="text-slate-400 text-xs mt-1">
            Normal: NPR {basePrice}
            {hasPremium && effectivePremiumPrice !== basePrice && (
              <span className="ml-2 text-amber-400">• Premium: NPR {effectivePremiumPrice}</span>
            )}
          </p>
        </div>
      </div>

      {/* --- SEATING GRID --- */}
      <div className="mb-14 perspective-[1000px] z-10 w-full max-w-5xl bg-slate-900/50 border border-slate-800/70 rounded-2xl p-5 sm:p-8 shadow-2xl backdrop-blur-sm overflow-x-auto">
        <div className="grid gap-2 sm:gap-3 transform origin-top">
          {grid.map((row, r) => (
            <div key={r} className="flex gap-2 sm:gap-3 items-center justify-center">
              {/* Row Label Left */}
              <span className="text-cyan-200/80 text-[10px] font-bold w-5 text-center bg-slate-800 rounded-md py-1">{rowLabel(r)}</span>

              <div className="flex gap-1.5 sm:gap-2">
                {row.map((cell, c) => {
                  if (cell.type === 'empty' || cell.type === 'aisle') {
                    return (
                      <div
                        key={c}
                        className={`w-9 h-9 sm:w-10 sm:h-10 ${cell.type === 'aisle' ? 'w-4 sm:w-5' : ''}`}
                      />
                    );
                  }

                  const seatId = cell.label;
                  const isBooked = bookedSeats.includes(seatId);
                  const isReserved = reservedSeats.includes(seatId);
                  const isSelected = selectedSeats.includes(seatId);
                  const isPremium = cell.type === 'premium';

                  let seatStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/30 hover:text-emerald-200";
                  if (isPremium) seatStyle = "bg-amber-500/20 text-amber-300 border-amber-400/30 hover:bg-amber-500/30 hover:text-amber-200";
                  if (isSelected) seatStyle = "bg-sky-500 text-slate-950 border-sky-300 shadow-[0_0_18px_rgba(56,189,248,0.8)] scale-105 -translate-y-0.5 font-bold";
                  if (isReserved) seatStyle = "bg-amber-400/25 text-amber-200 border-amber-300/40 cursor-not-allowed";
                  if (isBooked) seatStyle = "bg-red-500/25 text-red-200/70 border-red-400/40 cursor-not-allowed line-through";

                  const typeLabel = isPremium ? ' (Premium)' : '';

                  return (
                    <button
                      key={c}
                      disabled={isBooked || isReserved}
                      onClick={() => toggleSeat(seatId)}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-[10px] transition-all duration-200 flex items-center justify-center border ${seatStyle}`}
                      title={isBooked ? 'This seat is already booked' : isReserved ? 'This seat is currently reserved' : `Seat ${seatId}${typeLabel}`}
                    >
                      {seatId.replace(/^[A-Z]/, '')}
                    </button>
                  );
                })}
              </div>

              {/* Row Label Right */}
              <span className="text-cyan-200/80 text-[10px] font-bold w-5 text-center bg-slate-800 rounded-md py-1">{rowLabel(r)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- LEGEND --- */}
      <div className="flex flex-wrap justify-center gap-4 text-[11px] text-slate-200 mb-6 z-10 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500/30 border border-emerald-400/40"></div>
          <span>Normal</span>
        </div>
        {hasPremium && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500/30 border border-amber-400/40"></div>
            <span className="text-amber-300">Premium</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]"></div>
          <span className="text-sky-300 font-bold">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/30 border border-red-400/40"></div>
          <span className="text-red-300">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-400/30 border border-amber-300/40"></div>
          <span className="text-amber-200">Reserved</span>
        </div>
      </div>

      {/* --- SEAT STATS --- */}
      <div className="text-center mb-8 text-sm text-slate-300 z-10">
        <p>Available: {availableCount} seats</p>
        <p>Booked: {bookedSeats.length} seats</p>
        <p>Reserved: {reservedSeats.length} seats</p>
      </div>

      {/* --- FLOATING BOOKING BAR --- */}
      {selectedSeats.length > 0 && (
        <div className="fixed bottom-5 z-50 animate-bounce-in">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/20 p-3 pl-5 pr-3 rounded-2xl flex items-center gap-5 shadow-2xl ring-1 ring-cyan-500/10">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Seats ({selectedSeats.length})</span>
              <span className="text-sm font-bold text-cyan-400 max-w-37.5 truncate">
                {sortedSelectedSeats.join(', ')}
              </span>
            </div>

            <div className="h-8 w-px bg-white/10"></div>

            <div className="flex flex-col min-w-20">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
              <span className="text-lg font-black text-white">NPR {totalPrice}</span>
            </div>

            <button
              onClick={() => onNext(selectedSeats, totalPrice)}
              className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-3 px-6 rounded-xl transition-transform active:scale-95 shadow-[0_8px_30px_rgba(34,211,238,0.35)]"
            >
              Reserve Seats
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSelection;
