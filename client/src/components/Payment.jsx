import React, { useState } from 'react';

const Payment = ({ selectedSeats, totalPrice, onBack, onConfirm, movieTitle }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('khalti'); // Default to Khalti

  const handlePayment = () => {
    setIsProcessing(true);
    
    // Simulate API delay for realism
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm(); // Trigger the Success page
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b1121] text-white p-6 flex flex-col items-center justify-center animate-fade-in">
      
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <h2 className="text-2xl font-bold mb-6 text-center">Checkout</h2>

        {/* --- ORDER SUMMARY --- */}
        <div className="bg-slate-950/50 rounded-xl p-4 mb-6 border border-slate-800">
          <h3 className="text-sm uppercase text-slate-500 font-bold mb-4 tracking-wider">Order Summary</h3>
          
          <div className="flex justify-between mb-2">
            <span className="text-slate-300">Movie</span>
            <span className="font-medium text-white">{movieTitle || "Movie Ticket"}</span>
          </div>
          
          <div className="flex justify-between mb-2">
            <span className="text-slate-300">Seats <span className="text-xs text-slate-500">({selectedSeats.length})</span></span>
            <span className="font-medium text-cyan-400">{selectedSeats.join(', ')}</span>
          </div>

          <div className="h-[1px] bg-slate-800 my-3"></div>

          <div className="flex justify-between items-center">
            <span className="text-slate-300">Total Amount</span>
            <span className="text-2xl font-black text-white">${totalPrice}</span>
          </div>
        </div>

        {/* --- PAYMENT METHODS --- */}
        <h3 className="text-sm uppercase text-slate-500 font-bold mb-3 tracking-wider">Select Payment Method</h3>
        
        <div className="grid gap-3 mb-8">
          {/* KHALTI BUTTON (Selected) */}
          <button 
            onClick={() => setPaymentMethod('khalti')}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              paymentMethod === 'khalti' 
              ? 'bg-[#5C2D91]/20 border-[#5C2D91] shadow-[0_0_15px_rgba(92,45,145,0.3)]' 
              : 'bg-slate-800 border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Simple Khalti Icon Placeholder */}
              <div className="w-8 h-8 rounded bg-[#5C2D91] flex items-center justify-center text-white font-bold text-xs">K</div>
              <span className="font-bold">Khalti Wallet</span>
            </div>
            {paymentMethod === 'khalti' && <div className="w-3 h-3 bg-[#5C2D91] rounded-full shadow-[0_0_8px_#5C2D91]"></div>}
          </button>

          {/* ESEWA BUTTON (Optional/Disabled for now) */}
          <button 
            onClick={() => setPaymentMethod('esewa')}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              paymentMethod === 'esewa' 
              ? 'bg-green-600/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
              : 'bg-slate-800 border-transparent opacity-60 hover:opacity-100'
            }`}
          >
             <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-green-500 flex items-center justify-center text-white font-bold text-xs">e</div>
              <span className="font-bold">eSewa</span>
            </div>
            {paymentMethod === 'esewa' && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
          </button>
        </div>

        {/* --- ACTIONS --- */}
        <button 
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-4 rounded-full mb-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
             <>Processing...</> // You can add a spinner here later
          ) : (
             <>Pay USD {totalPrice}</>
          )}
        </button>

        <button 
          onClick={onBack}
          className="w-full text-slate-500 hover:text-white py-2 text-sm transition-colors"
        >
          Cancel & Go Back
        </button>

      </div>
    </div>
  );
};

export default Payment;