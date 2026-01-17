import React, { useState } from 'react';
// 1. Import useLocation and useParams
import { useLocation, useParams } from 'react-router-dom'; 
import SeatSelection from '../components/SeatSelection';
import Payment from '../components/Payment';

function Booking() {
  const [currentPage, setCurrentPage] = useState('selection');
  const [bookingData, setBookingData] = useState({ seats: [], price: 0 });

  // 2. Get the data passed from the previous page
  const { state } = useLocation();
  const { movieTitle, time, hall, price } = state || {}; // Safely unpack data

  const handleBooking = (seats, totalCost) => {
    setBookingData({ seats, price: totalCost });
    setCurrentPage('payment');
  };

  const handlePaymentSuccess = () => {
    setCurrentPage('success');
  };

  const handleBack = () => {
    setCurrentPage('selection');
  };

  return (
    <div className="App bg-[#0b1121] min-h-screen font-sans text-white">
      
      {/* 3. OPTIONAL: Add a Header showing what they are watching */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 text-center">
         <h2 className="text-xl font-bold text-yellow-500">{movieTitle || "Movie Booking"}</h2>
         <p className="text-sm text-gray-400">{hall} • {time}</p>
      </div>

      {currentPage === 'selection' && (
        <SeatSelection 
           onNext={handleBooking} 
           basePrice={price || 15} // Pass the dynamic price to your seat component!
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
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in">
           {/* ... Your success code ... */}
           <h1 className="text-4xl font-black text-white mb-2">You're All Set!</h1>
           <p className="text-slate-400 mb-8 text-lg">
             Tickets for <span className="text-cyan-400 font-bold">{movieTitle}</span> at {time} confirmed.
           </p>
        </div>
      )}
    </div>
  );
}

export default Booking;