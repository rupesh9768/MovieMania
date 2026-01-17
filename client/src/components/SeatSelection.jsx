import React, { useState } from 'react';

// 1. UPDATE: Accept props for navigation (onNext) and dynamic pricing (basePrice)
const SeatSelection = ({ onNext, basePrice = 12 }) => { 
  
  // CONFIGURATION: More Rows & Seats
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seatsPerRow = 12;

  // STATE
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  // Simulated "Occupied" data
  const occupiedSeats = ['A1', 'A2', 'B6', 'D11', 'D12', 'F5', 'F6', 'H1', 'H2'];

  const toggleSeat = (id) => {
    if (occupiedSeats.includes(id)) return; // Prevent clicking occupied seats

    if (selectedSeats.includes(id)) {
      setSelectedSeats(selectedSeats.filter(s => s !== id));
    } else {
      setSelectedSeats([...selectedSeats, id]);
    }
  };

  // Helper to calculate total
  const totalPrice = selectedSeats.length * basePrice;

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
            {/* Added a small price indicator */}
            <p className="text-slate-500 text-[10px] mt-1">Ticket Price: ${basePrice.toFixed(2)}</p>
        </div>
      </div>

      {/* --- SEATING GRID --- */}
      <div className="mb-24 perspective-[1000px]">
        <div className="grid gap-3 transform rotate-x-[20deg] origin-top">
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

                  // LOGIC: Determine Color & Style based on state
                  let seatStyle = "bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300"; // Available
                  if (isSelected) seatStyle = "bg-cyan-500 text-black shadow-[0_0_15px_#22d3ee] scale-110 -translate-y-1 font-bold"; // Selected
                  if (isOccupied) seatStyle = "bg-white/10 text-white/20 cursor-not-allowed"; // Occupied

                  return (
                    <button
                      key={seatId}
                      disabled={isOccupied}
                      onClick={() => toggleSeat(seatId)}
                      className={`
                        w-8 h-8 sm:w-10 sm:h-10 rounded-t-lg text-[10px] transition-all duration-200 flex items-center justify-center border-b-2 border-transparent
                        ${seatStyle}
                        ${seatNum === 3 || seatNum === 9 ? 'mr-4' : ''} /* Aisle gap */
                      `}
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
          <div className="w-4 h-4 rounded-t bg-white/10"></div> 
          <span>Occupied</span>
        </div>
      </div>

      {/* --- FLOATING BOOKING BAR --- */}
      {selectedSeats.length > 0 && (
        <div className="fixed bottom-6 z-50 animate-bounce-in">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-3 pl-6 pr-3 rounded-full flex items-center gap-6 shadow-2xl ring-1 ring-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Seats</span>
              <span className="text-sm font-bold text-cyan-400 max-w-[150px] truncate">
                {selectedSeats.join(', ')}
              </span>
            </div>
            
            <div className="h-8 w-[1px] bg-white/10"></div>

            <div className="flex flex-col min-w-[60px]">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
              {/* 2. UPDATE: Use dynamic total price */}
              <span className="text-lg font-black text-white">${totalPrice}</span>
            </div>

            <button 
              /* 3. UPDATE: Call onNext passed from parent with dynamic data */
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