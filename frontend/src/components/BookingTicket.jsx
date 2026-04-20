import React from 'react';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const getPosterUrl = (poster) => {
  if (!poster) return '';
  if (poster.startsWith('http')) return poster;
  return `${TMDB_IMAGE_BASE}${poster}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
};

// Simple fake barcode using repeated thin/thick bars
function FakeBarcode() {
  const pattern = [2,1,3,1,2,1,1,3,2,1,3,2,1,1,2,3,1,2,1,1,3,1,2,3,1,1,2,1,3,1];
  return (
    <div className="flex items-end gap-px h-10" aria-hidden="true">
      {pattern.map((width, i) => (
        <div
          key={i}
          style={{ width: `${width * 3}px` }}
          className={`bg-current h-full ${i % 2 === 0 ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
    </div>
  );
}

function BookingTicket({ bookingResult, movieMeta, showtimeLabel }) {
  const bookingId = bookingResult?._id || bookingResult?.id || 'N/A';
  const shortId = bookingId !== 'N/A' ? bookingId.slice(-8).toUpperCase() : 'N/A';
  const seats = (bookingResult?.seats || []).slice().sort().join(', ');
  const totalPaid = bookingResult?.totalPrice || movieMeta?.price || 0;
  const hall = bookingResult?.hall || movieMeta?.hall || 'Hall';
  const title = bookingResult?.movieTitle || movieMeta?.title || 'Movie';
  const poster = movieMeta?.poster || '';
  const paymentMethod = bookingResult?.paymentMethod || 'Khalti';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Ticket */}
      <div
        className="w-full max-w-md bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl select-none"
        style={{ fontFamily: 'Segoe UI, sans-serif' }}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-400 font-bold">MovieMania</p>
            <p className="text-lg font-black leading-tight mt-0.5">{title}</p>
          </div>
          {poster && (
            <img
              src={getPosterUrl(poster)}
              alt={title}
              className="w-14 h-20 object-cover rounded-lg border border-slate-700 shrink-0"
            />
          )}
        </div>

        {/* Divider with notches */}
        <div className="relative flex items-center bg-white">
          <div className="absolute -left-4 w-8 h-8 bg-slate-100 rounded-full border border-slate-200" />
          <div className="flex-1 border-t-2 border-dashed border-slate-300 mx-4" />
          <div className="absolute -right-4 w-8 h-8 bg-slate-100 rounded-full border border-slate-200" />
        </div>

        {/* Body */}
        <div className="bg-white px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Date &amp; Time</p>
              <p className="font-bold mt-0.5">{showtimeLabel || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Hall</p>
              <p className="font-bold mt-0.5">{hall}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Seats</p>
              <p className="font-bold mt-0.5 text-cyan-600">{seats || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Paid</p>
              <p className="font-black mt-0.5 text-green-600 text-base">NPR {totalPaid}</p>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-3">
            <div>
              <p className="text-slate-400 uppercase tracking-wider font-semibold">Booking ID</p>
              <p className="font-mono font-bold text-slate-700 mt-0.5">#{shortId}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 uppercase tracking-wider font-semibold">Payment</p>
              <p className="font-bold text-slate-700 mt-0.5 capitalize">{paymentMethod}</p>
            </div>
          </div>
        </div>

        {/* Barcode strip */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col items-center gap-2">
          <div className="text-slate-800">
            <FakeBarcode />
          </div>
          <p className="font-mono text-xs text-slate-400 tracking-widest">{bookingId !== 'N/A' ? bookingId.toUpperCase() : 'MM-TICKET'}</p>
        </div>
      </div>

    </div>
  );
}

export default BookingTicket;
