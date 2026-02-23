import React from 'react';
import { useNavigate } from 'react-router-dom';

// Booking history page
const BookingHistory = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white transition-colors mb-4 cursor-pointer"
          >
            Back
          </button>
          <h1 className="text-2xl font-black">Booking History</h1>
          <p className="text-slate-500 text-sm mt-1">View your past and upcoming bookings</p>
        </div>

        {/* Empty State */}
        <div className="text-center py-20 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
          <span className="text-2xl text-slate-500 mb-4 block">No bookings</span>
          <h3 className="text-xl font-semibold text-slate-300 mb-2">No Bookings Yet</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Your booking history will appear here once you book a movie ticket.
          </p>
          
          {/* TODO: Show login prompt if not authenticated */}
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/movies')}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full text-sm transition-all cursor-pointer"
            >
              Browse Movies
            </button>
            <p className="text-slate-600 text-xs">
              {/* TODO: Replace with actual auth check */}
              Sign in to view your booking history
            </p>
          </div>
        </div>

        {/* TODO: When bookings exist, show them here */}
        {/* 
        <div className="space-y-4">
          {bookings.map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
        */}
      </div>
    </div>
  );
};

export default BookingHistory;



