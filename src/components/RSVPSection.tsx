'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Users, Check, X, Mail, Phone, ArrowRight, AlertCircle, Calendar, MapPin } from 'lucide-react';
import { rsvpAPI } from '@/lib/api';

interface RSVPSectionProps {
  guestName: string;
  qrCode: string;
  customMessage: string;
  currentRSVP?: {
    status: 'pending' | 'attending' | 'not_attending';
    attendeeCount?: number;
    respondedAt?: string;
    guestNames?: string[];
    email?: string;
    phone?: string;
  };
  onRSVPSuccess: (status: 'attending' | 'not_attending', attendeeCount?: number) => void;
}

interface RSVPFormData {
  status: 'attending' | 'not_attending' | '';
  attendeeCount: number;
  guestNames: string[];
  email: string;
  phone: string;
}

export default function RSVPSection({ guestName, qrCode, customMessage, currentRSVP, onRSVPSuccess }: RSVPSectionProps) {
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
  const [showForm, setShowForm] = useState(false);

  // Check if RSVP is already submitted
  const isRSVPSubmitted = currentRSVP?.status && currentRSVP.status !== 'pending';

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
      onRSVPSuccess(formData.status, rsvpData.attendeeCount);
      setShowForm(false);
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

  const handleStartRSVP = () => {
    resetForm();
    setShowForm(true);
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-rose-50/30 to-pink-100/30 relative py-16 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: 'url(/weddingimgs/img16.jpg)',
          opacity: 0.08,
          transform: 'scale(1.1)'
        }}
      />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 w-full">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="w-20 h-20 mx-auto flex items-center justify-center overflow-hidden mb-5">
            <img 
              src="/imgs/monogram-flower-black.png" 
              alt="MJ & Erica Monogram" 
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-5xl md:text-6xl font-parisienne text-sage-green mb-4">
            Rsvp
          </h2>
          <p className="text-2xl font-parisienne text-black mb-8">
            Please respond by December 10, 2026
          </p>

          {/* Decorative Flourish */}
          <motion.div
            className="flex justify-center items-center mb-8"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <svg className="w-48 h-4 text-sage-green" viewBox="0 0 200 20" fill="currentColor">
              <path d="M10,10 Q50,2 100,10 Q150,18 190,10" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
              <circle cx="20" cy="10" r="1.5" />
              <circle cx="40" cy="8" r="1" />
              <circle cx="60" cy="12" r="1" />
              <circle cx="80" cy="8" r="1.5" />
              <circle cx="100" cy="10" r="2" />
              <circle cx="120" cy="12" r="1.5" />
              <circle cx="140" cy="8" r="1" />
              <circle cx="160" cy="12" r="1" />
              <circle cx="180" cy="8" r="1.5" />
            </svg>
          </motion.div>
        </motion.div>

        {/* RSVP Content */}
        <div className="max-w-2xl mx-auto">
          {!isRSVPSubmitted ? (
            // Show RSVP Form
            <motion.div
              className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {!showForm ? (
                // Initial RSVP Prompt
                <div className="text-center space-y-8">
                  <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 flex items-center justify-center overflow-hidden">
                        <img 
                          src="/imgs/monogram-black.png" 
                          alt="MJ & Erica Monogram" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                  </div>
                  
                  <h3 className="text-3xl font-parisienne text-slate-blue mb-4">
                    Dear {guestName}
                  </h3>
                  
                  <p className="text-lg text-slate-blue/80 leading-relaxed mb-8">
                    {customMessage}
                  </p>

                  <motion.button
                    onClick={handleStartRSVP}
                    className="group relative px-10 py-4 bg-[#5976DA] text-white rounded-full overflow-hidden text-lg font-medium shadow-xl border border-white/50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Respond to Invitation
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.button>
                </div>
              ) : (
                // RSVP Form Steps
                <div className="space-y-8">
                  {error && (
                    <motion.div
                      className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
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
                        <h3 className="text-2xl font-parisienne text-slate-blue mb-4">
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
                        <h3 className="text-2xl font-parisienne text-slate-blue mb-4">
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sage-green focus:border-transparent transition-all"
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
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sage-green focus:border-transparent transition-all"
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
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sage-green focus:border-transparent transition-all"
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
                          <ArrowRight className="w-4 h-4 rotate-180" />
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
                        <h3 className="text-2xl font-parisienne text-slate-blue mb-4">
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
                          <ArrowRight className="w-4 h-4 rotate-180" />
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
              )}
            </motion.div>
          ) : (
            // Show RSVP Response
            <motion.div
              className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <div className="text-center space-y-8">
                <div className="flex justify-center mb-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    currentRSVP.status === 'attending' 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                      : 'bg-gradient-to-br from-gray-500 to-slate-600'
                  }`}>
                    {currentRSVP.status === 'attending' ? (
                      <Check className="w-10 h-10 text-white" />
                    ) : (
                      <X className="w-10 h-10 text-white" />
                    )}
                  </div>
                </div>
                
                <h3 className="text-3xl font-parisienne text-slate-blue mb-4">
                  Thank you, {guestName}!
                </h3>
                
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="text-2xl font-medium text-slate-blue mb-2">
                    {currentRSVP.status === 'attending' ? 'You\'re attending!' : 'You\'re not attending'}
                  </div>
                  
                  {currentRSVP.status === 'attending' && (
                    <div className="space-y-2 text-gray-600">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Attendee Count: {currentRSVP.attendeeCount}</span>
                      </div>
                      {currentRSVP.guestNames && currentRSVP.guestNames.length > 0 && (
                        <div className="text-sm">
                          Guest: {currentRSVP.guestNames[0]}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {currentRSVP.respondedAt && (
                    <div className="text-sm text-gray-500 mt-4">
                      Responded on: {formatDate(currentRSVP.respondedAt)}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 text-blue-800">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">
                      Your RSVP has been submitted and cannot be changed. Please contact the hosts if you need to make any changes.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Wedding Details Reminder */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl max-w-3xl mx-auto">
            <h4 className="text-xl font-parisienne text-slate-blue mb-4">Wedding Details</h4>
            <div className="grid md:grid-cols-2 gap-6 text-slate-blue/80">
              <div className="flex items-center justify-center gap-3">
                <Calendar className="w-5 h-5 text-sage-green" />
                <span>January 16, 2026 at 11:00 AM</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <MapPin className="w-5 h-5 text-dusty-rose" />
                <span>Our Lady of Lourdes Parish, Tagaytay</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
