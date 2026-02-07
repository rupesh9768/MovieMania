import React, { useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom'; 
import SeatSelection from '../components/SeatSelection';
import Payment from '../components/Payment';

// TODO: Payment integration (Stripe / Khalti)
// TODO: Booking ownership validation — ensure user can only access their own bookings
// TODO: Booking confirmation email
// TODO: E-ticket generation (PDF)

function Booking() {
  const { movieId, showtimeId } = useParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('selection');
  const [bookingData, setBookingData] = useState({ seats: [], price: 0 });

  // Get the data passed from the previous page
  const { state } = useLocation();
  const { movieTitle, time, hall, price, date } = state || {};

  const handleBooking = (seats, totalCost) => {
    setBookingData({ seats, price: totalCost });
    setCurrentPage('payment');
  };

  const handlePaymentSuccess = () => {
    // TODO: POST to your backend when ready
    // const res = await fetch('/api/bookings', { method: 'POST', body: JSON.stringify({...}) });
    
    const booking = {
      id: Date.now(),
      movieId,
      showtimeId,
      movieTitle,
      seats: bookingData.seats,
      totalPrice: bookingData.price,
      hall,
      time,
      date,
      status: 'confirmed'
    };
    
    console.log('Booking created:', booking);
    setCurrentPage('success');
  };

  const handleBack = () => {
    setCurrentPage('selection');
  };

  return (
    <div className="App bg-dark-bg min-h-screen font-sans text-white">
      
      {/* Header showing booking info */}
      <div className="p-4 bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">{movieTitle || "Movie Booking"}</h2>
            <p className="text-sm text-gray-400">{hall} • {time} • {date || 'Today'}</p>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white text-sm"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Step indicator */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className={`flex items-center gap-2 ${currentPage === 'selection' ? 'text-cyan-400' : 'text-slate-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              currentPage === 'selection' ? 'bg-cyan-500 text-black' : 
              currentPage === 'payment' || currentPage === 'success' ? 'bg-green-500 text-black' : 'bg-slate-700'
            }`}>
              {currentPage === 'payment' || currentPage === 'success' ? '✓' : '1'}
            </span>
            <span>Select Seats</span>
          </div>
          <div className="w-12 h-[2px] bg-slate-700"></div>
          <div className={`flex items-center gap-2 ${currentPage === 'payment' ? 'text-cyan-400' : 'text-slate-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              currentPage === 'payment' ? 'bg-cyan-500 text-black' : 
              currentPage === 'success' ? 'bg-green-500 text-black' : 'bg-slate-700'
            }`}>
              {currentPage === 'success' ? '✓' : '2'}
            </span>
            <span>Payment</span>
          </div>
          <div className="w-12 h-[2px] bg-slate-700"></div>
          <div className={`flex items-center gap-2 ${currentPage === 'success' ? 'text-green-400' : 'text-slate-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              currentPage === 'success' ? 'bg-green-500 text-black' : 'bg-slate-700'
            }`}>3</span>
            <span>Confirmed</span>
          </div>
        </div>
      </div>

      {currentPage === 'selection' && (
        <SeatSelection 
          onNext={handleBooking} 
          basePrice={price || 350}
          movieId={movieId}
          showtimeId={showtimeId}
        />
      )}

      {currentPage === 'payment' && (
        <Payment 
          selectedSeats={bookingData.seats} 
          totalPrice={bookingData.price}
          onBack={handleBack}
          onConfirm={handlePaymentSuccess}
          movieTitle={movieTitle}
        />
      )}

      {currentPage === 'success' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center animate-fade-in">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-black text-white mb-2">Booking Confirmed!</h1>
          <p className="text-slate-400 mb-8 text-lg">
            Your tickets for <span className="text-cyan-400 font-bold">{movieTitle}</span> are booked.
          </p>
          
          {/* Ticket Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full mb-8">
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Movie</span>
                <span className="font-bold">{movieTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hall</span>
                <span className="font-bold">{hall}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time</span>
                <span className="font-bold">{time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date</span>
                <span className="font-bold">{date || 'Today'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Seats</span>
                <span className="font-bold text-cyan-400">{bookingData.seats.sort().join(', ')}</span>
              </div>
              <div className="border-t border-slate-700 pt-3 flex justify-between">
                <span className="text-slate-400">Total Paid</span>
                <span className="font-black text-xl text-green-400">NPR {bookingData.price}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/')}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-full transition-all"
            >
              Go Home
            </button>
            <button 
              onClick={() => window.print()}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-8 rounded-full transition-all"
            >
              Print Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Booking;


