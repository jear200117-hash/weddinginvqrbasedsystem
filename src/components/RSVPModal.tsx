'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Users, Check, AlertCircle, ArrowRight, ArrowLeft, Mail, Phone } from 'lucide-react';
import { rsvpAPI } from '@/lib/api';

interface RSVPModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestName: string;
  qrCode: string;
  onSuccess: (status: 'attending' | 'not_attending', attendeeCount?: number) => void;
  isUpdating?: boolean;
}

interface RSVPFormData {
  status: 'attending' | 'not_attending' | '';
  attendeeCount: number;
  guestNames: string[];
  email: string;
  phone: string;
}

export default function RSVPModal({ isOpen, onClose, guestName, qrCode, onSuccess, isUpdating = false }: RSVPModalProps) {
  const [formData, setFormData] = useState<RSVPFormData>({
    status: '',
    attendeeCount: 1,
    guestNames: [guestName],
    email: '',
    phone: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const handleStatusSelect = (status: 'attending' | 'not_attending') => {
    setFormData(prev => ({
      ...prev,
      status,
      attendeeCount: status === 'attending' ? 1 : 0,
      guestNames: status === 'attending' ? [guestName] : []
    }));
    setCurrentStep(status === 'attending' ? 2 : 3);
  };

  const handleGuestNameChange = (index: number, name: string) => {
    const newGuestNames = [...formData.guestNames];
    newGuestNames[index] = name;
    setFormData(prev => ({
      ...prev,
      guestNames: newGuestNames
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.status) {
        throw new Error('Please select your attendance status');
      }

      if (formData.status === 'attending') {
        if (!formData.email.trim()) {
          throw new Error('Please provide your email address');
        }
        if (!formData.phone.trim()) {
          throw new Error('Please provide your phone number');
        }
        if (!formData.guestNames[0].trim()) {
          throw new Error('Please provide your name');
        }
      }

      const rsvpData = {
        status: formData.status,
        attendeeCount: formData.status === 'attending' ? 1 : 0,
        guestNames: formData.status === 'attending' 
          ? [formData.guestNames[0].trim()]
          : [],
        email: formData.email.trim(),
        phone: formData.phone.trim()
      };

      await rsvpAPI.submit(qrCode, rsvpData);
      onSuccess(formData.status, rsvpData.attendeeCount);
    } catch (error: any) {
      setError(error.response?.data?.error || error.message || 'Failed to submit RSVP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      status: '',
      attendeeCount: 1,
      guestNames: [guestName],
      email: '',
      phone: ''
    });
    setCurrentStep(1);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600 p-8 text-white relative">
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-3">
              <Heart className="w-8 h-8" />
              <h2 className="text-3xl font-playfair">
                {isUpdating ? 'Update RSVP' : 'RSVP Confirmation'}
              </h2>
            </div>
            <p className="text-white/90 text-lg">
              Dear {guestName}, {isUpdating ? 'please update your response' : 'please confirm your attendance'}
            </p>
          </div>

          <div className="p-8">
            {error && (
              <motion.div
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Step 1: Attendance Status */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h3 className="text-2xl font-playfair text-gray-800 mb-4">
                    Will you be attending our wedding?
                  </h3>
                  <p className="text-gray-600">Please select your response below</p>
                </div>

                <div className="space-y-4">
                  <motion.button
                    onClick={() => handleStatusSelect('attending')}
                    className="w-full p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Check className="w-6 h-6" />
                      <span className="text-xl font-medium">Yes, I'll be there!</span>
                    </div>
                  </motion.button>

                  <motion.button
                    onClick={() => handleStatusSelect('not_attending')}
                    className="w-full p-6 bg-gradient-to-r from-gray-500 to-slate-600 text-white rounded-2xl hover:from-gray-600 hover:to-slate-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <X className="w-6 h-6" />
                      <span className="text-xl font-medium">I regretfully cannot attend</span>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Contact Information for Attending */}
            {currentStep === 2 && formData.status === 'attending' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h3 className="text-2xl font-playfair text-gray-800 mb-4">
                    Contact Information
                  </h3>
                  <p className="text-gray-600">Please provide your contact details for wedding updates</p>
                </div>

                <div className="space-y-6">
                  {/* Guest Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={formData.guestNames[0]}
                      onChange={(e) => handleGuestNameChange(0, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number (Philippines)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="+63 912 345 6789"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Format: +63 912 345 6789</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <motion.button
                    onClick={goBack}
                    className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                    whileHover={{ scale: 1.05 }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </motion.button>

                  <motion.button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.guestNames[0].trim() || !formData.email.trim() || !formData.phone.trim()}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit RSVP
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Not Attending Confirmation */}
            {currentStep === 3 && formData.status === 'not_attending' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h3 className="text-2xl font-playfair text-gray-800 mb-4">
                    Confirm Your Response
                  </h3>
                  <p className="text-gray-600">We understand and will miss you on our special day</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 text-center">
                  <div className="text-6xl mb-4">💔</div>
                  <p className="text-gray-700 text-lg">
                    Thank you for letting us know. We appreciate your response.
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <motion.button
                    onClick={goBack}
                    className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                    whileHover={{ scale: 1.05 }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </motion.button>

                  <motion.button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gray-500 to-slate-600 text-white rounded-xl hover:from-gray-600 hover:to-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Confirm Response
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
