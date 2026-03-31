import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import SeatSelection from '../components/SeatSelection';
import { cancelBooking, confirmBooking, reserveBooking, initiateKhaltiPayment } from '../api/bookingService';
import { backendApi } from '../api';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const getPosterUrl = (poster) => {
  if (!poster) return '';
  if (poster.startsWith('http')) return poster;
  return `${TMDB_IMAGE_BASE}${poster}`;
};

const formatShowDateTime = (date, time) => {
  const parsedDate = new Date(date);
  const dateLabel = Number.isNaN(parsedDate.getTime())
    ? (date || 'Date TBD')
    : parsedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

  return `${dateLabel} • ${time || 'Time TBD'}`;
};

function Booking() {
  const { movieId, showtimeId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [currentPage, setCurrentPage] = useState('selection');
  const [bookingError, setBookingError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);
  const [reserving, setReserving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reservationMsLeft, setReservationMsLeft] = useState(null);

  const [bookingData, setBookingData] = useState({
    seats: [],
    price: 0,
    reservationId: null,
    reservationExpiresAt: null,
    paymentMethod: 'khalti'
  });

  const [movieMeta, setMovieMeta] = useState({
    title: state?.movieTitle || 'Movie Booking',
    poster: state?.moviePoster || '',
    hall: state?.hall || 'Hall 1',
    time: state?.time || '',
    date: state?.date || '',
    price: state?.price || 350,
    theaterId: state?.theaterId || null
  });

  useEffect(() => {
    const loadMovieMeta = async () => {
      if (movieMeta.poster && movieMeta.title && movieMeta.title !== 'Movie Booking') return;
      try {
        const movie = await backendApi.getBackendMovieById(movieId);
        if (movie) {
          setMovieMeta((prev) => ({
            ...prev,
            title: prev.title === 'Movie Booking' ? movie.title : prev.title,
            poster: prev.poster || movie.poster || ''
          }));
        }
      } catch (error) {
        console.error('Failed to load movie metadata:', error);
      }
    };

    loadMovieMeta();
  }, [movieId, movieMeta.poster, movieMeta.title]);

  const showtimeLabel = useMemo(
    () => formatShowDateTime(movieMeta.date, movieMeta.time),
    [movieMeta.date, movieMeta.time]
  );

  useEffect(() => {
    if (!bookingData.reservationExpiresAt || currentPage !== 'summary') {
      setReservationMsLeft(null);
      return;
    }

    const tick = () => {
      const ms = new Date(bookingData.reservationExpiresAt).getTime() - Date.now();
      setReservationMsLeft(Math.max(0, ms));
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [bookingData.reservationExpiresAt, currentPage]);

  useEffect(() => {
    if (
      currentPage === 'summary' &&
      bookingData.reservationId &&
      reservationMsLeft !== null &&
      reservationMsLeft <= 0
    ) {
      setBookingError('Reservation expired. Please select seats again.');
      setCurrentPage('selection');
      setBookingData({ seats: [], price: 0, reservationId: null, reservationExpiresAt: null, paymentMethod: 'khalti' });
    }
  }, [reservationMsLeft, currentPage, bookingData.reservationId]);

  const reservationTimeLabel = useMemo(() => {
    if (reservationMsLeft === null) return '--:--';
    if (reservationMsLeft <= 0) return '00:00';
    const totalSec = Math.ceil(reservationMsLeft / 1000);
    const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const sec = (totalSec % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }, [reservationMsLeft]);

  const releaseReservation = async () => {
    if (!bookingData.reservationId) return;

    try {
      await cancelBooking(bookingData.reservationId);
    } catch {
      // Reservation will auto-expire in backend if cancellation fails.
    }
  };

  const handleReserveSeats = async (seats, totalCost) => {
    setBookingError('');
    setReserving(true);

    try {
      const reservation = await reserveBooking({
        movieId,
        showtimeId,
        movieTitle: movieMeta.title,
        hall: movieMeta.hall,
        date: movieMeta.date,
        time: movieMeta.time,
        seats,
        totalPrice: totalCost
      });

      setBookingData({
        seats,
        price: totalCost,
        reservationId: reservation._id,
        reservationExpiresAt: reservation.reservationExpiresAt,
        paymentMethod: 'khalti'
      });
      setCurrentPage('summary');
    } catch (error) {
      console.error('Seat reservation failed:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to reserve seats. Please try again.';
      setBookingError(msg);
    } finally {
      setReserving(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!bookingData.reservationId) return;

    setBookingError('');
    setConfirming(true);

    try {
      if (bookingData.paymentMethod === 'khalti') {
        // Initiate Khalti payment — user will be redirected to Khalti
        const { payment_url } = await initiateKhaltiPayment(bookingData.reservationId);
        // Store booking context in sessionStorage so we can restore after redirect
        sessionStorage.setItem('khalti_booking', JSON.stringify({
          reservationId: bookingData.reservationId,
          seats: bookingData.seats,
          price: bookingData.price,
          movieMeta
        }));
        window.location.href = payment_url;
        return;
      }

      // Non-Khalti fallback: direct confirm
      const booking = await confirmBooking(bookingData.reservationId, {
        totalPrice: bookingData.price,
        paymentMethod: bookingData.paymentMethod
      });

      setBookingResult(booking);
      setCurrentPage('success');
    } catch (error) {
      console.error('Booking confirmation failed:', error);
      const msg = error.response?.data?.message || error.message || 'Booking failed. Please try again.';
      setBookingError(msg);
    } finally {
      setConfirming(false);
    }
  };

  const handleBackToSelection = async () => {
    await releaseReservation();
    setCurrentPage('selection');
    setBookingError('');
    setBookingData({ seats: [], price: 0, reservationId: null, reservationExpiresAt: null, paymentMethod: 'khalti' });
  };

  const handleCancelReservation = async () => {
    await releaseReservation();
    setBookingError('Reservation cancelled.');
    setCurrentPage('selection');
    setBookingData({ seats: [], price: 0, reservationId: null, reservationExpiresAt: null, paymentMethod: 'khalti' });
  };

  const handleExitBooking = async () => {
    if (currentPage !== 'success') {
      await releaseReservation();
    }
    navigate(-1);
  };

  return (
    <div className="App bg-dark-bg min-h-screen font-sans text-white">
      <div className="p-4 bg-slate-900 border-b border-slate-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">{movieMeta.title}</h2>
            <p className="text-sm text-gray-400">{movieMeta.hall} • {showtimeLabel}</p>
          </div>
          <button onClick={handleExitBooking} className="text-slate-400 hover:text-white text-sm">
            Back
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className={`flex items-center gap-2 ${currentPage === 'selection' ? 'text-cyan-400' : 'text-slate-500'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              currentPage === 'selection' ? 'bg-cyan-500 text-black' :
              currentPage === 'summary' || currentPage === 'success' ? 'bg-green-500 text-black' : 'bg-slate-700'
            }`}>
              {currentPage === 'summary' || currentPage === 'success' ? 'Done' : '1'}
            </span>
            <span>Select Seats</span>
          </div>

          <div className="w-12 h-0.5 bg-slate-700"></div>

          <div className={`flex items-center gap-2 ${currentPage === 'summary' ? 'text-cyan-400' : 'text-slate-500'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              currentPage === 'summary' ? 'bg-cyan-500 text-black' :
              currentPage === 'success' ? 'bg-green-500 text-black' : 'bg-slate-700'
            }`}>
              {currentPage === 'success' ? 'Done' : '2'}
            </span>
            <span>Review</span>
          </div>

          <div className="w-12 h-0.5 bg-slate-700"></div>

          <div className={`flex items-center gap-2 ${currentPage === 'success' ? 'text-green-400' : 'text-slate-500'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              currentPage === 'success' ? 'bg-green-500 text-black' : 'bg-slate-700'
            }`}>
              3
            </span>
            <span>Confirmed</span>
          </div>
        </div>
      </div>

      {bookingError && (
        <div className="max-w-md mx-auto mt-2 px-4">
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-center text-sm">
            {bookingError}
          </div>
        </div>
      )}

      {reserving && (
        <div className="max-w-md mx-auto mt-4 px-4 text-center text-sm text-cyan-400">
          Reserving selected seats for 5 minutes...
        </div>
      )}

      {currentPage === 'selection' && (
        <SeatSelection
          onNext={handleReserveSeats}
          basePrice={movieMeta.price || 350}
          movieId={movieId}
          showtimeId={showtimeId}
          theaterId={movieMeta.theaterId}
          hallName={movieMeta.hall}
        />
      )}

      {currentPage === 'summary' && (
        <section className="max-w-5xl mx-auto px-4 pb-16 pt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <p className="text-xs uppercase tracking-wider text-cyan-400 font-semibold mb-3">Booking Summary</p>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Reservation expires in {reservationTimeLabel}
              </div>

              <div className="flex gap-4">
                <div className="w-24 h-36 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 shrink-0">
                  {movieMeta.poster ? (
                    <img src={getPosterUrl(movieMeta.poster)} alt={movieMeta.title} className="w-full h-full object-cover" />
                  ) : null}
                </div>

                <div className="flex-1 space-y-2">
                  <h3 className="text-2xl font-black">{movieMeta.title}</h3>
                  <p className="text-sm text-slate-400">{movieMeta.hall}</p>
                  <p className="text-sm text-slate-400">{showtimeLabel}</p>
                  <p className="text-sm text-cyan-400 font-semibold">Seats: {bookingData.seats.slice().sort().join(', ')}</p>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-800 pt-5">
                <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Payment Method</label>
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <button
                    onClick={() => setBookingData((prev) => ({ ...prev, paymentMethod: 'khalti' }))}
                    className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                      bookingData.paymentMethod === 'khalti'
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                        : 'border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    Khalti
                  </button>
                  <button
                    onClick={() => setBookingData((prev) => ({ ...prev, paymentMethod: 'esewa' }))}
                    className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                      bookingData.paymentMethod === 'esewa'
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                        : 'border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    eSewa
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 h-fit">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">Total</p>
              <p className="text-4xl font-black text-green-400 mb-1">NPR {bookingData.price}</p>
              <p className="text-xs text-slate-500 mb-6">{bookingData.seats.length} seat(s)</p>

              <button
                onClick={handleConfirmBooking}
                disabled={confirming}
                className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-black font-bold py-3.5 rounded-xl transition-all"
              >
                {confirming ? 'Redirecting to Khalti...' : bookingData.paymentMethod === 'khalti' ? 'Pay with Khalti' : 'Confirm Booking'}
              </button>

              <button
                onClick={handleBackToSelection}
                className="w-full mt-3 text-slate-400 hover:text-white text-sm py-2 transition-colors"
              >
                Back to Seat Selection
              </button>

              <button
                onClick={handleCancelReservation}
                className="w-full mt-2 text-red-400 hover:text-red-300 text-sm py-2 transition-colors"
              >
                Cancel Reservation
              </button>
            </div>
          </div>
        </section>
      )}

      {currentPage === 'success' && (
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-[0_0_40px_rgba(34,197,94,0.4)]">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-4xl font-black text-white mb-2">Booking Confirmed!</h1>
            <p className="text-slate-400 mb-8 text-lg">Your cinema seats are successfully booked.</p>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto text-left">
              <div className="flex gap-4 mb-4">
                <div className="w-20 h-28 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 shrink-0">
                  {movieMeta.poster ? (
                    <img src={getPosterUrl(movieMeta.poster)} alt={movieMeta.title} className="w-full h-full object-cover" />
                  ) : null}
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-1">{movieMeta.title}</h3>
                  <p className="text-sm text-slate-400">{movieMeta.hall}</p>
                  <p className="text-sm text-slate-400">{showtimeLabel}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Seats</span>
                  <span className="font-semibold text-cyan-400">{(bookingResult?.seats || bookingData.seats).slice().sort().join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="font-semibold text-green-400">{bookingResult?.status || 'booked'}</span>
                </div>
                <div className="border-t border-slate-700 pt-3 mt-3 flex justify-between items-center">
                  <span className="text-slate-400">Total Paid</span>
                  <span className="font-black text-xl text-green-400">NPR {bookingResult?.totalPrice || bookingData.price}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center mt-8">
              <button
                onClick={() => navigate('/booking-history')}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-8 rounded-full transition-all"
              >
                View Booking History
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-full transition-all"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Booking;
