'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Heart, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RSVPSuccessModalProps {
  isOpen: boolean;
  status: 'attending' | 'not_attending';
  guestName: string;
  attendeeCount?: number;
}

export default function RSVPSuccessModal({ 
  isOpen, 
  status, 
  guestName, 
  attendeeCount 
}: RSVPSuccessModalProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  if (!isOpen) return null;

  const isAttending = status === 'attending';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          {/* Header */}
          <div className={`${isAttending ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600' : 'bg-gradient-to-br from-gray-400 via-slate-500 to-gray-600'} p-8 text-white text-center`}>
            {/* Success Animation */}
            <motion.div
              className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", duration: 0.6 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", duration: 0.4 }}
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>
            </motion.div>

            <motion.h2
              className="text-3xl font-playfair mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              RSVP Confirmed!
            </motion.h2>

            <motion.p
              className="text-white/90 text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Thank you, {guestName}!
            </motion.p>
          </div>

          <div className="p-8">
            <motion.div
              className="space-y-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {isAttending ? (
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">🎉</div>
                  <div className="space-y-2">
                    <p className="text-green-600 font-medium text-lg">
                      ✓ You're attending our wedding
                    </p>
                    {attendeeCount && attendeeCount > 1 && (
                      <p className="text-gray-600">
                        Party size: {attendeeCount} guest{attendeeCount > 1 ? 's' : ''}
                      </p>
                    )}
                    <p className="text-gray-600">
                      We can't wait to celebrate with you!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">💔</div>
                  <div className="space-y-2">
                    <p className="text-gray-600 font-medium text-lg">
                      We're sorry you can't make it
                    </p>
                    <p className="text-gray-600">
                      You'll be in our hearts on our special day
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              className="flex flex-col gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                onClick={handleGoHome}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Home className="w-5 h-5" />
                Return to Home
              </motion.button>

              <motion.button
                onClick={() => window.close()}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close Window
              </motion.button>
            </motion.div>

            {/* Footer Note */}
            <motion.div
              className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-sm text-blue-700 text-center">
                <Heart className="w-4 h-4 inline mr-1" />
                Thank you for your response!
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
