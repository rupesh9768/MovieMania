import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyKhaltiPayment } from '../api/bookingService';

function KhaltiCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [message, setMessage] = useState('Verifying your payment...');
  const [bookingResult, setBookingResult] = useState(null);

  useEffect(() => {
    const verify = async () => {
      const pidx = searchParams.get('pidx');
      const paymentStatus = searchParams.get('status');

      // Retrieve stored booking context
      const stored = sessionStorage.getItem('khalti_booking');
      const bookingContext = stored ? JSON.parse(stored) : null;

      if (!pidx || !bookingContext?.reservationId) {
        setStatus('failed');
        setMessage('Missing payment information. Please try booking again.');
        return;
      }

      if (paymentStatus !== 'Completed') {
        setStatus('failed');
        setMessage(`Payment was not completed. Status: ${paymentStatus || 'Unknown'}`);
        return;
      }

      try {
        const booking = await verifyKhaltiPayment(pidx, bookingContext.reservationId);
        setBookingResult(booking);
        setStatus('success');
        setMessage('Payment successful! Your booking is confirmed.');
        sessionStorage.removeItem('khalti_booking');
      } catch (error) {
        console.error('Payment verification failed:', error);
        setStatus('failed');
        setMessage(error.response?.data?.message || error.message || 'Payment verification failed.');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-bold mb-2">Verifying Payment</h2>
            <p className="text-slate-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-[0_0_40px_rgba(34,197,94,0.4)]">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-black mb-2">Payment Successful!</h2>
            <p className="text-slate-400 mb-6">{message}</p>

            {bookingResult && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-6 text-left text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Movie</span>
                  <span className="font-semibold">{bookingResult.movieTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Seats</span>
                  <span className="font-semibold text-cyan-400">{bookingResult.seats?.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="font-semibold text-green-400">{bookingResult.status}</span>
                </div>
                <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between">
                  <span className="text-slate-400">Total Paid</span>
                  <span className="font-black text-lg text-green-400">NPR {bookingResult.totalPrice}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/booking-history')}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-full transition-all"
              >
                View Bookings
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-full transition-all"
              >
                Go Home
              </button>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-[0_0_40px_rgba(239,68,68,0.4)]">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-black mb-2">Payment Failed</h2>
            <p className="text-slate-400 mb-6">{message}</p>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-full transition-all"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-full transition-all"
              >
                Go Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default KhaltiCallback;
