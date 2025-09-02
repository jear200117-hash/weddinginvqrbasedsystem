'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Users, Edit, Mail, Phone } from 'lucide-react';

interface RSVPStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestName: string;
  rsvpData: {
    status: 'attending' | 'not_attending';
    attendeeCount?: number;
    respondedAt?: string;
    guestNames?: string[];
    email?: string;
    phone?: string;
  };
  onUpdateRSVP: () => void;
}

export default function RSVPStatusModal({ 
  isOpen, 
  onClose, 
  guestName, 
  rsvpData, 
  onUpdateRSVP 
}: RSVPStatusModalProps) {
  if (!isOpen) return null;

  const isAttending = rsvpData.status === 'attending';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`${isAttending ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600' : 'bg-gradient-to-br from-gray-400 via-slate-500 to-gray-600'} p-8 text-white relative`}>
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-3">
              {isAttending ? (
                <CheckCircle className="w-8 h-8" />
              ) : (
                <XCircle className="w-8 h-8" />
              )}
              <h2 className="text-3xl font-playfair">RSVP Status</h2>
            </div>
            <p className="text-white/90 text-lg">Hello {guestName}!</p>
          </div>

          <div className="p-8">
            {/* Current Status */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center px-6 py-3 rounded-2xl text-xl font-medium ${
                isAttending 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {isAttending ? '✓ You\'re Attending' : '✗ Not Attending'}
              </div>
              
              {rsvpData.respondedAt && (
                <p className="text-sm text-gray-500 mt-3">
                  Responded on {new Date(rsvpData.respondedAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Details */}
            {isAttending && (
              <div className="space-y-6 mb-8">
                {rsvpData.attendeeCount && rsvpData.attendeeCount > 0 && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {rsvpData.attendeeCount} guest{rsvpData.attendeeCount !== 1 ? 's' : ''} attending
                      </div>
                      <div className="text-sm text-gray-600">Including yourself</div>
                    </div>
                  </div>
                )}

                                 {rsvpData.guestNames && rsvpData.guestNames.length > 0 && (
                   <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                     <div className="text-sm font-medium text-purple-800 mb-2">Guest Name:</div>
                     <div className="text-purple-700">{rsvpData.guestNames[0]}</div>
                   </div>
                 )}

                 {rsvpData.email && (
                   <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl">
                     <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                       <Mail className="w-6 h-6 text-blue-600" />
                     </div>
                     <div>
                       <div className="font-medium text-gray-900">Email</div>
                       <div className="text-sm text-gray-600">{rsvpData.email}</div>
                     </div>
                   </div>
                 )}

                 {rsvpData.phone && (
                   <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl">
                     <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                       <Phone className="w-6 h-6 text-green-600" />
                     </div>
                     <div>
                       <div className="font-medium text-gray-900">Phone</div>
                       <div className="text-sm text-gray-600">{rsvpData.phone}</div>
                     </div>
                   </div>
                 )}
              </div>
            )}

            {!isAttending && (
              <div className="mb-8">
                <div className="bg-gray-50 rounded-2xl p-6 text-center">
                  <div className="text-6xl mb-4">💔</div>
                  <p className="text-gray-700 text-lg">
                    We understand and will miss you on our special day. Thank you for letting us know.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                onClick={onUpdateRSVP}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Edit className="w-5 h-5" />
                Update Response
              </motion.button>

              <motion.button
                onClick={onClose}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </div>

            {/* Note */}
            <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Need to make changes?</strong> Click "Update Response" to modify your RSVP details.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
