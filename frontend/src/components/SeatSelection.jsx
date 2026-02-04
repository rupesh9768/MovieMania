import React, { useState, useEffect } from 'react';

// INLINE MOCK DATA: Already booked seats (replace with API call when backend is ready)
const MOCK_BOOKED_SEATS = ['A3', 'A4', 'B5', 'B6', 'C7', 'D2', 'D3', 'E8', 'E9', 'F1', 'G10', 'H5', 'H6'];

/**
 * SeatSelection Component
 * Props:
 * - onNext: function to call when user confirms selection (seats, totalPrice)
 * - basePrice: price per ticket (default 350)
 * - movieId: ID of the movie (for fetching booked seats)
 * - showtimeId: ID of the showtime (for fetching booked seats)
 */
const SeatSelection = ({ onNext, basePrice = 350, movieId, showtimeId }) => { 
  
  // CONFIGURATION: Rows & Seats
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seatsPerRow = 12;

  // STATE
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch occupied seats (mock for now, replace with API when ready)
  useEffect(() => {
    const loadOccupiedSeats = async () => {
      setLoading(true);
      
      // TODO: Fetch from API when backend is ready
      // const res = await fetch(`/api/bookings/seats?movieId=${movieId}&showtimeId=${showtimeId}`);
      // const data = await res.json();
      // setOccupiedSeats(data);
      
      // For now, use mock data
      setOccupiedSeats(MOCK_BOOKED_SEATS);
      setLoading(false);
    };
    
    loadOccupiedSeats();
  }, [movieId, showtimeId]);

  const toggleSeat = (id) => {
    if (occupiedSeats.includes(id)) return; // Prevent clicking occupied seats

    if (selectedSeats.includes(id)) {
      setSelectedSeats(selectedSeats.filter(s => s !== id));
    } else {
      setSelectedSeats([...selectedSeats, id]);
    }
  };

  // Calculate total
  const totalPrice = selectedSeats.length * basePrice;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1121] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading seat map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1121] text-white p-4 flex flex-col items-center overflow-x-hidden">
      
      {/* --- THE CURVED SCREEN --- */}
      <div className="relative w-full max-w-4xl mb-16 perspective-[500px]">
        {/* Glow Effect */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-cyan-500/30 blur-[60px] rounded-full pointer-events-none"></div>
        {/* Actual Screen Arc */}
        <div className="h-16 w-full border-t-[6px] border-cyan-400/60 rounded-[50%] shadow-[0_-10px_40px_rgba(34,211,238,0.3)] bg-gradient-to-b from-cyan-500/10 to-transparent"></div>
        
        <div className="text-center mt-4">
          <p className="text-cyan-500/40 tracking-[1em] text-[9px] font-bold uppercase">Screen</p>
          <p className="text-slate-500 text-[10px] mt-1">Ticket Price: NPR {basePrice}</p>
        </div>
      </div>

      {/* --- SEATING GRID --- */}
      <div className="mb-24 perspective-[1000px]">
        <div className="grid gap-3 transform origin-top">
          {rows.map((row) => (
            <div key={row} className="flex gap-2 sm:gap-3 items-center justify-center">
              {/* Row Label Left */}
              <span className="text-slate-600 text-[10px] font-bold w-4 text-center">{row}</span>
              
              {/* Seats */}
              <div className="flex gap-1.5 sm:gap-2">
                {Array.from({ length: seatsPerRow }).map((_, i) => {
                  const seatNum = i + 1;
                  const seatId = `${row}${seatNum}`;
                  
                  const isOccupied = occupiedSeats.includes(seatId);
                  const isSelected = selectedSeats.includes(seatId);

                  // Determine Color & Style based on state
                  let seatStyle = "bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300"; // Available
                  if (isSelected) seatStyle = "bg-cyan-500 text-black shadow-[0_0_15px_#22d3ee] scale-110 -translate-y-1 font-bold"; // Selected
                  if (isOccupied) seatStyle = "bg-red-500/20 text-red-500/40 cursor-not-allowed line-through"; // Occupied

                  return (
                    <button
                      key={seatId}
                      disabled={isOccupied}
                      onClick={() => toggleSeat(seatId)}
                      className={`
                        w-8 h-8 sm:w-10 sm:h-10 rounded-t-lg text-[10px] transition-all duration-200 flex items-center justify-center border-b-2 border-transparent
                        ${seatStyle}
                        ${seatNum === 3 || seatNum === 9 ? 'mr-4' : ''}
                      `}
                      title={isOccupied ? 'This seat is already booked' : `Seat ${seatId}`}
                    >
                      {seatNum}
                    </button>
                  );
                })}
              </div>

              {/* Row Label Right */}
              <span className="text-slate-600 text-[10px] font-bold w-4 text-center">{row}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- LEGEND --- */}
      <div className="flex gap-6 text-[10px] uppercase tracking-wider text-slate-400 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-t bg-slate-800 border border-slate-700"></div> 
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-t bg-cyan-500 shadow-[0_0_10px_#22d3ee]"></div> 
          <span className="text-cyan-400 font-bold">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-t bg-red-500/20 border border-red-500/30"></div> 
          <span className="text-red-400">Booked</span>
        </div>
      </div>

      {/* --- SEAT STATS --- */}
      <div className="text-center mb-8 text-sm text-slate-400">
        <p>Available: {(rows.length * seatsPerRow) - occupiedSeats.length} seats</p>
        <p>Booked: {occupiedSeats.length} seats</p>
      </div>

      {/* --- FLOATING BOOKING BAR --- */}
      {selectedSeats.length > 0 && (
        <div className="fixed bottom-6 z-50 animate-bounce-in">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-3 pl-6 pr-3 rounded-full flex items-center gap-6 shadow-2xl ring-1 ring-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Seats ({selectedSeats.length})</span>
              <span className="text-sm font-bold text-cyan-400 max-w-[150px] truncate">
                {selectedSeats.sort().join(', ')}
              </span>
            </div>
            
            <div className="h-8 w-[1px] bg-white/10"></div>

            <div className="flex flex-col min-w-[80px]">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
              <span className="text-lg font-black text-white">NPR {totalPrice}</span>
            </div>

            <button 
              onClick={() => onNext(selectedSeats, totalPrice)}
              className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-3 px-8 rounded-full transition-transform active:scale-95"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSelection;