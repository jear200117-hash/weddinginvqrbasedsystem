'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, MapPin, Users, ArrowRight, Send } from 'lucide-react';
import { invitationsAPI, rsvpAPI } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import RotatingBackground from '@/components/RotatingBackground';
import StoryCarousel from '@/components/StoryCarousel';
import RSVPModal from '@/components/RSVPModal';
import RSVPSuccessModal from '@/components/RSVPSuccessModal';
import RSVPStatusModal from '@/components/RSVPStatusModal';
import { BACKGROUND_IMAGE_CONFIG, ACTIVE_BACKGROUND_CONFIG } from '@/config/backgroundImages';
import { STORY_CAROUSEL_CONFIG, ACTIVE_STORY_CONFIG } from '@/config/storyCarousel';
import { ENTOURAGE_IMAGES_CONFIG, ACTIVE_ENTOURAGE_CONFIG } from '@/config/entourageImages';
import { ENTOURAGE_CONFIG, ENTOURAGE_DISPLAY_CONFIG } from '@/config/entourageConfig';
import { DRESS_CODE_CONFIG, DRESS_CODE_DISPLAY_CONFIG } from '@/config/dressCodeConfig';
import { VIDEO_CONFIG, ACTIVE_VIDEO_SOURCE } from '@/config/videoConfig';
import PrenupVideo from '@/components/PrenupVideo';
import { MUSIC_CONFIG, ACTIVE_MUSIC_CONFIG } from '@/config/musicConfig';
import BackgroundMusic from '@/components/BackgroundMusic';
import OtherDetailsSection from '@/components/OtherDetailsSection';
import FAQSection from '@/components/FAQSection';

interface Invitation {
  _id: string;
  guestName: string;
  guestRole: string;
  customMessage: string;
  qrCode: string;
  isActive: boolean;
  isOpened: boolean;
  invitationType: string;
  createdAt: string;
  rsvp?: {
    status: 'pending' | 'attending' | 'not_attending';
    attendeeCount: number;
    respondedAt?: string;
    guestNames?: string[];
    email?: string;
    phone?: string;
  };
}

export default function InvitationPage() {
  const params = useParams();
  const qrCode = params.qrCode as string;

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [animationStage, setAnimationStage] = useState<'plane' | 'envelope' | 'invitation'>('plane');
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // RSVP Modal States
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<'attending' | 'not_attending' | null>(null);
  const [rsvpAttendeeCount, setRsvpAttendeeCount] = useState<number>(0);
  // FAQ accordion state
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);

  useEffect(() => {
    if (qrCode) {
      fetchInvitation();
    }
  }, [qrCode]);

  // Countdown timer effect
  useEffect(() => {
    const weddingDate = new Date('2026-01-16T11:00:00').getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = weddingDate - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchInvitation = async () => {
    try {
      const response = await invitationsAPI.getByQRCode(qrCode);
      setInvitation(response.invitation);

      // Start animation sequence
      setTimeout(() => setAnimationStage('envelope'), 2000);
      setTimeout(() => setAnimationStage('invitation'), 4000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRSVPClick = () => {
    if (invitation?.rsvp?.status && invitation.rsvp.status !== 'pending') {
      // RSVP already submitted, show status modal
      setShowStatusModal(true);
      return;
    }
    setShowRSVPModal(true);
  };

  const handleUpdateRSVP = () => {
    setShowStatusModal(false);
    setShowRSVPModal(true);
  };

  const handleConfirmAttendance = () => {
    // Check if RSVP is pending or undefined (no RSVP yet)
    if (invitation?.rsvp?.status && invitation.rsvp.status !== 'pending') {
      setShowStatusModal(true);
      return;
    }
    setShowRSVPModal(true);
  };

  const handleDeclineWithRegrets = () => {
    // Check if RSVP is pending or undefined (no RSVP yet)
    if (invitation?.rsvp?.status && invitation.rsvp.status !== 'pending') {
      setShowStatusModal(true);
      return;
    }
    setShowRSVPModal(true);
  };

  const handleRSVPSuccess = (status: 'attending' | 'not_attending', attendeeCount: number = 0) => {
    setShowRSVPModal(false);
    setRsvpStatus(status);
    setRsvpAttendeeCount(attendeeCount);
    setShowSuccessModal(true);
    
    // Update the invitation state to reflect RSVP submission
    if (invitation) {
      setInvitation({
        ...invitation,
        rsvp: {
          status,
          attendeeCount,
          respondedAt: new Date().toISOString()
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitation Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This invitation could not be found.'}</p>
          <Link href="/" className="text-rose-600 hover:text-rose-700">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100">
      <BackgroundMusic />
      <AnimatePresence mode="wait">
        {/* Paper Plane Stage */}
        {animationStage === 'plane' && (
          <motion.div
            key="plane"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="min-h-screen flex items-center justify-center"
          >
            <motion.div
              animate={{
                y: [-20, -100, -200],
                x: [0, 50, 100],
                rotate: [0, 15, 30]
              }}
              transition={{
                duration: 2,
                ease: "easeInOut"
              }}
              className="text-center"
            >
              <Send className="text-rose-500 mx-auto mb-4" size={80} />
              <p className="text-xl text-gray-600">Your invitation is on its way...</p>
            </motion.div>
          </motion.div>
        )}

        {/* Envelope Stage */}
        {animationStage === 'envelope' && (
          <motion.div
            key="envelope"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="min-h-screen flex items-center justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="text-center cursor-pointer"
              onClick={() => setAnimationStage('invitation')}
            >
              <div className="bg-white p-8 rounded-2xl shadow-2xl mb-6 transform rotate-3 hover:rotate-0 transition-transform">
                <div className="w-32 h-24 bg-gradient-to-br from-rose-400 to-pink-500 rounded-lg relative">
                  <div className="absolute top-2 left-2 right-2 h-1 bg-white rounded-full"></div>
                  <div className="absolute top-4 left-2 right-2 h-1 bg-white rounded-full"></div>
                  <div className="absolute top-6 left-2 right-2 h-1 bg-white rounded-full"></div>
                </div>
              </div>
              <p className="text-xl text-gray-600">Click to open your invitation</p>
            </motion.div>
          </motion.div>
        )}

        {/* Invitation Stage */}
        {animationStage === 'invitation' && (
          <motion.div
            key="invitation"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            {/* ===== SECTION 1: HERO & MAIN INVITATION ===== */}
            <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
              {/* Rotating Background Images */}
              <RotatingBackground
                interval={6000}
                opacity={0.25}
                showIndicators={true}
                customImages={ACTIVE_BACKGROUND_CONFIG ? BACKGROUND_IMAGE_CONFIG[ACTIVE_BACKGROUND_CONFIG] : undefined}
              />

              {/* Dark Overlay for Better Text Contrast */}
              <div className="absolute inset-0 bg-black/40"></div>

              {/* Elegant Overlay Gradients */}
              <div className="absolute inset-0 bg-gradient-to-br from-warm-beige/30 via-dusty-rose/20 to-sage-green/30"></div>

              {/* Elegant Pattern Overlay */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 10 L70 40 L100 40 L78 58 L88 88 L60 70 L32 88 L42 58 L20 40 L50 40 Z' fill='%23667c93' fill-opacity='0.15'/%3E%3C/svg%3E")`,
                  backgroundSize: '120px 120px'
                }} />
              </div>

              {/* Floating Decorative Elements */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-10 w-2 h-2 bg-dusty-rose rounded-full animate-pulse opacity-60"></div>
                <div className="absolute top-40 right-20 w-1 h-1 bg-slate-blue rounded-full animate-pulse opacity-40" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-32 left-20 w-3 h-3 bg-sage-green rounded-full animate-pulse opacity-30" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-20 right-10 w-1 h-1 bg-warm-beige rounded-full animate-pulse opacity-50" style={{ animationDelay: '0.5s' }}></div>
              </div>

              <motion.div
                className="relative z-10 text-center px-6 max-w-4xl mx-auto text-white"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              >
                {/* Top Date Section */}
                <motion.div
                  className="mb-12"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  <div className="text-lg md:text-xl font-light tracking-widest mb-6 text-white drop-shadow-lg">
                    JANUARY
                  </div>

                  {/* Date Layout */}
                  <div className="flex items-center justify-center gap-6 md:gap-12 mb-6">
                    <div className="flex-1 max-w-32">
                      <div className="h-px bg-white/80 mb-3"></div>
                      <div className="text-sm md:text-base font-light tracking-wider text-white drop-shadow-lg">Friday</div>
                    </div>

                    <div className="text-center">
                      <div className="text-6xl md:text-7xl font-bold text-white tracking-tight drop-shadow-lg">16</div>
                      <div className="text-lg md:text-xl font-light mt-1 text-white drop-shadow-lg">2026</div>
                    </div>

                    <div className="flex-1 max-w-32">
                      <div className="h-px bg-white/80 mb-3"></div>
                      <div className="text-sm md:text-base font-light tracking-wider text-white drop-shadow-lg">11:00 AM</div>
                    </div>
                  </div>
                </motion.div>

                {/* Names Section */}
                <motion.div
                  className="mb-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                >
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-playfair font-bold text-white tracking-tight leading-tight drop-shadow-lg">
                    MJ & Erica
                  </h1>
                </motion.div>

                {/* Invitation Text */}
                <motion.div
                  className="mb-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                >
                  <p className="text-lg md:text-xl font-light text-white max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
                    Join us as we say "I Do" and begin our new journey together.
                  </p>
                </motion.div>

                {/* RSVP Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, duration: 0.6 }}
                >
                  <motion.button
                    onClick={handleRSVPClick}
                    className="group relative px-10 py-3 bg-sage-green/90 backdrop-blur-sm text-white rounded-full overflow-hidden text-lg font-medium shadow-xl border border-white/50"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(142, 145, 128, 1)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">
                      {invitation?.rsvp?.status === 'pending' || !invitation?.rsvp 
                        ? 'RSVP'
                        : invitation.rsvp.status === 'attending' 
                        ? '✓ Attending' 
                        : '✗ Not Attending'
                      }
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </span>
                  </motion.button>
                </motion.div>
              </motion.div>
            </section>

            {/* ===== SECTION 2: COUNTDOWN & VIDEO ===== */}
            <section className="min-h-screen flex items-center justify-center relative overflow-hidden py-16">
              {/* Elegant Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white via-warm-beige/10 to-dusty-rose/20"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-sage-green/5 via-transparent to-slate-blue/10"></div>

              <div className="relative z-10 text-center px-6 max-w-6xl mx-auto w-full">

                {/* Header Text */}
                <motion.div
                  className="mb-12"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  <h2 className="text-4xl md:text-5xl font-playfair text-slate-blue mb-4">
                    We are getting married
                  </h2>
                  <div className="text-2xl md:text-3xl text-dusty-rose font-light">
                    January 16, 2026
                  </div>
                </motion.div>

                {/* Countdown Section */}
                <motion.div
                  className="mb-16"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  <h3 className="text-2xl md:text-3xl text-sage-green font-light mb-8">
                    Countdown Begins
                  </h3>

                  {/* Countdown Timer */}
                  <div className="grid grid-cols-4 gap-4 md:gap-8 max-w-2xl mx-auto mb-8">
                    <motion.div
                      className="bg-sage-green text-white rounded-lg p-4 md:p-6 shadow-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="text-2xl md:text-4xl font-bold">{timeLeft.days.toString().padStart(2, '0')}</div>
                      <div className="text-sm md:text-base font-light">Days</div>
                    </motion.div>
                    <motion.div
                      className="bg-slate-blue text-white rounded-lg p-4 md:p-6 shadow-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="text-2xl md:text-4xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</div>
                      <div className="text-sm md:text-base font-light">Hrs</div>
                    </motion.div>
                    <motion.div
                      className="bg-dusty-rose text-white rounded-lg p-4 md:p-6 shadow-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="text-2xl md:text-4xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                      <div className="text-sm md:text-base font-light">Mins</div>
                    </motion.div>
                    <motion.div
                      className="bg-warm-beige text-white rounded-lg p-4 md:p-6 shadow-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="text-2xl md:text-4xl font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                      <div className="text-sm md:text-base font-light">Secs</div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Prenup Video Section */}
                <motion.div
                  className="max-w-4xl mx-auto"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                >
                  <PrenupVideo
                    videoConfig={VIDEO_CONFIG[ACTIVE_VIDEO_SOURCE]}
                  />
                </motion.div>

              </div>
            </section>

            {/* ===== SECTION 3: OUR STORY WITH CAROUSEL ===== */}
            <section className="min-h-screen flex items-center justify-center bg-white relative py-16">
              <div className="max-w-7xl mx-auto px-6 w-full">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                  {/* Left Side - Text Content */}
                  <motion.div
                    className="space-y-8"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                  >
                    {/* Logo/Monogram */}
                    <div className="flex items-center mb-8">
                      <div className="w-20 h-20 rounded-full border-2 border-sage-green flex items-center justify-center">
                        <div className="text-2xl font-playfair font-bold text-sage-green">ME</div>
                      </div>
                    </div>

                    {/* Main Heading */}
                    <h2 className="text-4xl md:text-5xl font-playfair text-slate-blue leading-tight">
                      Part of our story.
                    </h2>

                    {/* Subheading */}
                    <p className="text-xl md:text-2xl text-sage-green font-light">
                      We have carefully chosen every guest at our wedding.
                    </p>

                    {/* Main Paragraph */}
                    <p className="text-lg md:text-xl text-slate-blue/80 leading-relaxed max-w-xl">
                      We have carefully chosen every guest at our wedding & b'cos you have been meaningful part of our journey we would be truly honored to have you with us as we celebrate the happiest day of our lives.
                    </p>
                  </motion.div>

                  {/* Right Side - Story Carousel */}
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                  >
                    <StoryCarousel
                      images={ACTIVE_STORY_CONFIG ? STORY_CAROUSEL_CONFIG[ACTIVE_STORY_CONFIG] : undefined}
                    />
                  </motion.div>

                </div>
              </div>
            </section>

            {/* ===== SECTION 4: WEDDING TIMELINE ===== */}
            <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-warm-beige/5 to-dusty-rose/10 relative py-16">
              <div className="max-w-6xl mx-auto px-6 w-full">

                {/* Section Header */}
                <motion.div
                  className="text-center mb-16"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  <h2 className="text-4xl md:text-5xl font-playfair text-slate-blue mb-6">
                    Wedding Timeline
                  </h2>
                  <div className="flex justify-center items-center">
                    <div className="w-16 h-px bg-gradient-to-r from-transparent via-dusty-rose to-transparent"></div>
                    <div className="mx-4 w-2 h-2 bg-dusty-rose rounded-full"></div>
                    <div className="w-16 h-px bg-gradient-to-r from-dusty-rose via-transparent to-transparent"></div>
                  </div>
                </motion.div>

                {/* Timeline Container */}
                <div className="relative">
                  {/* Central Timeline Line */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-sage-green via-dusty-rose to-slate-blue h-full"></div>

                  {/* Timeline Items */}
                  <div className="space-y-16">

                    {/* 10:30 AM Assembly */}
                    <motion.div
                      className="relative flex items-center"
                      initial={{ opacity: 0, x: -100 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6 }}
                      viewport={{ once: true }}
                    >
                      <div className="w-1/2 pr-8 text-right">
                        <div className="bg-white rounded-2xl p-6 shadow-xl border border-sage-green/20">
                          <div className="text-2xl md:text-3xl font-bold text-slate-blue mb-2">10:30 AM</div>
                          <div className="text-lg md:text-xl text-sage-green font-medium">Assembly</div>
                          <div className="text-sm text-slate-blue/70 mt-2">Guests arrive and gather</div>
                        </div>
                      </div>
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-sage-green rounded-full border-4 border-white shadow-lg z-10"></div>
                      <div className="w-1/2 pl-8"></div>
                    </motion.div>

                    {/* 11:00 AM Ceremony */}
                    <motion.div
                      className="relative flex items-center"
                      initial={{ opacity: 0, x: 100 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      viewport={{ once: true }}
                    >
                      <div className="w-1/2 pr-8"></div>
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-dusty-rose rounded-full border-4 border-white shadow-lg z-10"></div>
                      <div className="w-1/2 pl-8">
                        <div className="bg-white rounded-2xl p-6 shadow-xl border border-dusty-rose/20">
                          <div className="text-2xl md:text-3xl font-bold text-slate-blue mb-2">11:00 AM</div>
                          <div className="text-lg md:text-xl text-dusty-rose font-medium">Ceremony</div>
                          <div className="text-sm text-slate-blue/70 mt-2">The main event begins</div>
                        </div>
                      </div>
                    </motion.div>

                    {/* 12:00 NOON Photos */}
                    <motion.div
                      className="relative flex items-center"
                      initial={{ opacity: 0, x: -100 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      viewport={{ once: true }}
                    >
                      <div className="w-1/2 pr-8 text-right">
                        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-blue/20">
                          <div className="text-2xl md:text-3xl font-bold text-slate-blue mb-2">12:00 NOON</div>
                          <div className="text-lg md:text-xl text-slate-blue font-medium">Photos</div>
                          <div className="text-sm text-slate-blue/70 mt-2">Capture the memories</div>
                        </div>
                      </div>
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-slate-blue rounded-full border-4 border-white shadow-lg z-10"></div>
                      <div className="w-1/2 pl-8"></div>
                    </motion.div>

                    {/* 1:00 PM Reception */}
                    <motion.div
                      className="relative flex items-center"
                      initial={{ opacity: 0, x: 100 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      viewport={{ once: true }}
                    >
                      <div className="w-1/2 pr-8"></div>
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-warm-beige rounded-full border-4 border-white shadow-lg z-10"></div>
                      <div className="w-1/2 pl-8">
                        <div className="bg-white rounded-2xl p-6 shadow-xl border border-warm-beige/20">
                          <div className="text-2xl md:text-3xl font-bold text-slate-blue mb-2">1:00 PM</div>
                          <div className="text-lg md:text-xl text-warm-beige font-medium">Reception</div>
                          <div className="text-sm text-slate-blue/70 mt-2">Welcome celebration</div>
                        </div>
                      </div>
                    </motion.div>

                    {/* 2:00 PM Food & Toasts */}
                    <motion.div
                      className="relative flex items-center"
                      initial={{ opacity: 0, x: -100 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.8 }}
                      viewport={{ once: true }}
                    >
                      <div className="w-1/2 pr-8 text-right">
                        <div className="bg-white rounded-2xl p-6 shadow-xl border border-sage-green/20">
                          <div className="text-2xl md:text-3xl font-bold text-slate-blue mb-2">2:00 PM</div>
                          <div className="text-lg md:text-xl text-sage-green font-medium">Food & Toasts</div>
                          <div className="text-sm text-slate-blue/70 mt-2">Dinner and speeches</div>
                        </div>
                      </div>
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-sage-green rounded-full border-4 border-white shadow-lg z-10"></div>
                      <div className="w-1/2 pl-8"></div>
                    </motion.div>

                    {/* 4:00 PM After Party */}
                    <motion.div
                      className="relative flex items-center"
                      initial={{ opacity: 0, x: 100 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 1.0 }}
                      viewport={{ once: true }}
                    >
                      <div className="w-1/2 pr-8"></div>
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-dusty-rose rounded-full border-4 border-white shadow-lg z-10"></div>
                      <div className="w-1/2 pl-8">
                        <div className="bg-white rounded-2xl p-6 shadow-xl border border-dusty-rose/20">
                          <div className="text-2xl md:text-3xl font-bold text-slate-blue mb-2">4:00 PM</div>
                          <div className="text-lg md:text-xl text-dusty-rose font-medium">After Party</div>
                          <div className="text-sm text-slate-blue/70 mt-2">Dancing and celebration</div>
                        </div>
                      </div>
                    </motion.div>

                  </div>
                </div>

                {/* Bottom Message */}
                <motion.div
                  className="text-center mt-16"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  viewport={{ once: true }}
                >
                  <p className="text-lg text-slate-blue/80 max-w-3xl mx-auto leading-relaxed">
                    Please arrive on time to ensure you don't miss any special moments of our celebration.
                  </p>
                </motion.div>

              </div>
            </section>

            {/* 3 Images between Timeline and Entourage */}
            <div className="py-8 bg-white">
              <motion.div
                className="grid grid-cols-3 gap-2 mx-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="aspect-[3/2] rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={ACTIVE_ENTOURAGE_CONFIG ? `/weddingimgs/${ENTOURAGE_IMAGES_CONFIG[ACTIVE_ENTOURAGE_CONFIG][0]}` : '/weddingimgs/img9.jpg'}
                    alt="Elegant wedding moment"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[3/2] rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={ACTIVE_ENTOURAGE_CONFIG ? `/weddingimgs/${ENTOURAGE_IMAGES_CONFIG[ACTIVE_ENTOURAGE_CONFIG][1]}` : '/weddingimgs/img11.jpg'}
                    alt="Romantic wedding portrait"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[3/2] rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={ACTIVE_ENTOURAGE_CONFIG ? `/weddingimgs/${ENTOURAGE_IMAGES_CONFIG[ACTIVE_ENTOURAGE_CONFIG][2]}` : '/weddingimgs/img13.jpg'}
                    alt="Beautiful wedding celebration"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            </div>


            {/* ===== SECTION 6: WEDDING ENTOURAGE ===== */}
            <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-warm-beige/5 to-dusty-rose/10 relative py-16">
              <div className="max-w-5xl mx-auto px-6 w-full">

                {/* Section Header */}
                <motion.div
                  className="text-center mb-20"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  <div className="text-xl md:text-2xl font-playfair text-slate-blue/70 mb-4 tracking-widest">
                    MJ & ERICA
                  </div>
                  <h2 className="text-5xl md:text-6xl font-playfair text-sage-green mb-8 tracking-wide">
                    THE ENTOURAGE
                  </h2>

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

                <div className="space-y-20">

                  {/* Best Man */}
                  {ENTOURAGE_DISPLAY_CONFIG.showBestMan && (
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                      viewport={{ once: true }}
                    >
                      <h3 className="text-4xl md:text-5xl font-playfair text-sage-green mb-8 tracking-wide">
                        {ENTOURAGE_CONFIG.bestMan.title}
                      </h3>
                      <div className="space-y-4 max-w-md mx-auto">
                        {ENTOURAGE_CONFIG.bestMan.members.map((member, index) => (
                          <div key={index} className="text-slate-blue/80 text-xl leading-relaxed">
                            <p>{member.name}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Parents Section */}
                  {ENTOURAGE_DISPLAY_CONFIG.showParents && (
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      viewport={{ once: true }}
                    >
                      <h3 className="text-4xl md:text-5xl font-playfair text-sage-green mb-12 tracking-wide">
                        {ENTOURAGE_CONFIG.parents.title}
                      </h3>

                      <div className="grid md:grid-cols-2 gap-16 max-w-4xl mx-auto">
                        {/* Groom's Parents */}
                        <div className="space-y-4">
                          <h4 className="text-2xl font-playfair text-sage-green mb-6">
                            {ENTOURAGE_CONFIG.parents.groomParents.title}
                          </h4>
                          <div className="space-y-3 text-slate-blue/80 text-lg">
                            {ENTOURAGE_CONFIG.parents.groomParents.members.map((member, index) => (
                              <p key={index}>{member.name}</p>
                            ))}
                          </div>
                        </div>

                        {/* Bride's Parents */}
                        <div className="space-y-4">
                          <h4 className="text-2xl font-playfair text-dusty-rose mb-6">
                            {ENTOURAGE_CONFIG.parents.brideParents.title}
                          </h4>
                          <div className="space-y-3 text-slate-blue/80 text-lg">
                            {ENTOURAGE_CONFIG.parents.brideParents.members.map((member, index) => (
                              <p key={index}>{member.name}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Principal Sponsors */}
                  {ENTOURAGE_DISPLAY_CONFIG.showPrincipalSponsors && (
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      viewport={{ once: true }}
                    >
                      <h3 className="text-4xl md:text-5xl font-playfair text-slate-blue mb-12 tracking-wide">
                        {ENTOURAGE_CONFIG.principalSponsors.title}
                      </h3>

                      <div className="grid md:grid-cols-2 gap-16 max-w-4xl mx-auto">
                        {/* Ninong */}
                        <div className="space-y-4">
                          <h4 className="text-2xl font-playfair text-sage-green mb-8">
                            {ENTOURAGE_CONFIG.principalSponsors.ninong.title}
                          </h4>
                          <div className="space-y-3 text-slate-blue/80 text-lg">
                            {ENTOURAGE_CONFIG.principalSponsors.ninong.members.map((member, index) => (
                              <p key={index}>
                                {ENTOURAGE_DISPLAY_CONFIG.showSponsorNumbers ? `${member.number}. ` : ''}
                                {member.name}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Ninang */}
                        <div className="space-y-4">
                          <h4 className="text-2xl font-playfair text-dusty-rose mb-8">
                            {ENTOURAGE_CONFIG.principalSponsors.ninang.title}
                          </h4>
                          <div className="space-y-3 text-slate-blue/80 text-lg">
                            {ENTOURAGE_CONFIG.principalSponsors.ninang.members.map((member, index) => (
                              <p key={index}>
                                {ENTOURAGE_DISPLAY_CONFIG.showSponsorNumbers ? `${member.number}. ` : ''}
                                {member.name}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Secondary Sponsors */}
                  {ENTOURAGE_DISPLAY_CONFIG.showSecondarySponsors && (
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      viewport={{ once: true }}
                    >
                      <h3 className="text-4xl md:text-5xl font-playfair text-dusty-rose mb-12 tracking-wide">
                        {ENTOURAGE_CONFIG.secondarySponsors.title}
                      </h3>

                      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Candle (in) */}
                        <div className="space-y-3">
                          <h4 className="text-xl font-playfair text-sage-green mb-4">
                            {ENTOURAGE_CONFIG.secondarySponsors.candleIn.title}
                          </h4>
                          <div className="space-y-2 text-slate-blue/80 text-sm">
                            {ENTOURAGE_CONFIG.secondarySponsors.candleIn.members.map((member, index) => (
                              <p key={index}>{member.name}</p>
                            ))}
                          </div>
                        </div>

                        {/* Veil */}
                        <div className="space-y-3">
                          <h4 className="text-xl font-playfair text-dusty-rose mb-4">
                            {ENTOURAGE_CONFIG.secondarySponsors.veil.title}
                          </h4>
                          <div className="space-y-2 text-slate-blue/80 text-sm">
                            {ENTOURAGE_CONFIG.secondarySponsors.veil.members.map((member, index) => (
                              <p key={index}>{member.name}</p>
                            ))}
                          </div>
                        </div>

                        {/* Cord */}
                        <div className="space-y-3">
                          <h4 className="text-xl font-playfair text-warm-beige mb-4">
                            {ENTOURAGE_CONFIG.secondarySponsors.cord.title}
                          </h4>
                          <div className="space-y-2 text-slate-blue/80 text-sm">
                            {ENTOURAGE_CONFIG.secondarySponsors.cord.members.map((member, index) => (
                              <p key={index}>{member.name}</p>
                            ))}
                          </div>
                        </div>

                        {/* Candle (out) */}
                        <div className="space-y-3">
                          <h4 className="text-xl font-playfair text-sage-green mb-4">
                            {ENTOURAGE_CONFIG.secondarySponsors.candleOut.title}
                          </h4>
                          <div className="space-y-2 text-slate-blue/80 text-sm">
                            {ENTOURAGE_CONFIG.secondarySponsors.candleOut.members.map((member, index) => (
                              <p key={index}>{member.name}</p>
                            ))}
                          </div>
                        </div>

                        {/* Veil 2 */}
                        <div className="space-y-3">
                          <h4 className="text-xl font-playfair text-dusty-rose mb-4">
                            {ENTOURAGE_CONFIG.secondarySponsors.veil2.title}
                          </h4>
                          <div className="space-y-2 text-slate-blue/80 text-sm">
                            {ENTOURAGE_CONFIG.secondarySponsors.veil2.members.map((member, index) => (
                              <p key={index}>{member.name}</p>
                            ))}
                          </div>
                        </div>

                        {/* Cord 2 */}
                        <div className="space-y-3">
                          <h4 className="text-xl font-playfair text-warm-beige mb-4">
                            {ENTOURAGE_CONFIG.secondarySponsors.cord2.title}
                          </h4>
                          <div className="space-y-2 text-slate-blue/80 text-sm">
                            {ENTOURAGE_CONFIG.secondarySponsors.cord2.members.map((member, index) => (
                              <p key={index}>{member.name}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Wedding Party */}
                  {ENTOURAGE_DISPLAY_CONFIG.showWeddingParty && (
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.8 }}
                      viewport={{ once: true }}
                    >
                      <h3 className="text-4xl md:text-5xl font-playfair text-dusty-rose mb-12 tracking-wide">
                        {ENTOURAGE_CONFIG.weddingParty.title}
                      </h3>

                      <div className="grid md:grid-cols-2 gap-16 max-w-4xl mx-auto">
                        {/* Groomsmen */}
                        <div className="space-y-4">
                          <h4 className="text-2xl font-playfair text-sage-green mb-8">
                            {ENTOURAGE_CONFIG.weddingParty.groomsmen.title}
                          </h4>
                          <div className="space-y-3 text-slate-blue/80 text-lg">
                            {ENTOURAGE_CONFIG.weddingParty.groomsmen.members.map((member, index) => (
                              <p key={index}>
                                {ENTOURAGE_DISPLAY_CONFIG.showSponsorNumbers ? `${member.number}. ` : ''}
                                {member.name}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Bridesmaids */}
                        <div className="space-y-4">
                          <h4 className="text-2xl font-playfair text-dusty-rose mb-8">
                            {ENTOURAGE_CONFIG.weddingParty.bridesmaids.title}
                          </h4>
                          <div className="space-y-3 text-slate-blue/80 text-lg">
                            {ENTOURAGE_CONFIG.weddingParty.bridesmaids.members.map((member, index) => (
                              <p key={index}>
                                {ENTOURAGE_DISPLAY_CONFIG.showSponsorNumbers ? `${member.number}. ` : ''}
                                {member.name}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Bearers */}
                  {ENTOURAGE_DISPLAY_CONFIG.showBearers && (
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 1.0 }}
                      viewport={{ once: true }}
                    >
                      <h3 className="text-4xl md:text-5xl font-playfair text-warm-beige mb-12 tracking-wide">
                        {ENTOURAGE_CONFIG.bearers.title}
                      </h3>

                      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {/* Ring Bearer */}
                        <div className="space-y-3">
                          <h4 className="text-xl font-playfair text-sage-green mb-4">
                            {ENTOURAGE_CONFIG.bearers.ring.title}
                          </h4>
                          <div className="space-y-2 text-slate-blue/80 text-lg">
                            {ENTOURAGE_CONFIG.bearers.ring.members.map((member, index) => (
                              <p key={index}>{member.name}</p>
                            ))}
                          </div>
                        </div>

                        {/* Arras Bearer */}
                        <div className="space-y-3">
                          <h4 className="text-xl font-playfair text-dusty-rose mb-4">
                            {ENTOURAGE_CONFIG.bearers.arras.title}
                          </h4>
                          <div className="space-y-2 text-slate-blue/80 text-lg">
                            {ENTOURAGE_CONFIG.bearers.arras.members.map((member, index) => (
                              <p key={index}>{member.name}</p>
                            ))}
                          </div>
                        </div>

                        {/* Bible Bearer */}
                        <div className="space-y-3">
                          <h4 className="text-xl font-playfair text-warm-beige mb-4">
                            {ENTOURAGE_CONFIG.bearers.bible.title}
                          </h4>
                          <div className="space-y-2 text-slate-blue/80 text-lg">
                            {ENTOURAGE_CONFIG.bearers.bible.members.map((member, index) => (
                              <p key={index}>{member.name}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Flower Girls */}
                  {ENTOURAGE_DISPLAY_CONFIG.showFlowerGirls && (
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 1.2 }}
                      viewport={{ once: true }}
                    >
                      <h3 className="text-4xl md:text-5xl font-playfair text-sage-green mb-12 tracking-wide">
                        {ENTOURAGE_CONFIG.flowerGirls.title}
                      </h3>

                      <div className="space-y-4 max-w-2xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-8">
                          {ENTOURAGE_CONFIG.flowerGirls.members.map((member, index) => (
                            <div key={index} className="text-slate-blue/80 text-lg">
                              <p>
                                {ENTOURAGE_DISPLAY_CONFIG.showSponsorNumbers ? `${member.number}. ` : ''}
                                {member.name}
                                {member.role && <span className="text-sm text-slate-blue/60 ml-2">({member.role})</span>}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Maid of Honor */}
                  {ENTOURAGE_DISPLAY_CONFIG.showMaidOfHonor && (
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 1.4 }}
                      viewport={{ once: true }}
                    >
                      <h3 className="text-4xl md:text-5xl font-playfair text-dusty-rose mb-12 tracking-wide">
                        {ENTOURAGE_CONFIG.maidOfHonor.title}
                      </h3>

                      <div className="space-y-4 max-w-md mx-auto">
                        {ENTOURAGE_CONFIG.maidOfHonor.members.map((member, index) => (
                          <div key={index} className="text-slate-blue/80 text-xl leading-relaxed">
                            <p>{member.name}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Bride and Groom */}
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.6 }}
                    viewport={{ once: true }}
                  >
                    <h3 className="text-4xl md:text-5xl font-playfair text-slate-blue mb-12 tracking-wide">
                      THE COUPLE
                    </h3>

                    <div className="grid md:grid-cols-2 gap-16 max-w-4xl mx-auto">
                      {/* Groom */}
                      <div className="space-y-4">
                        <h4 className="text-2xl font-playfair text-sage-green mb-6">
                          {ENTOURAGE_CONFIG.couple.groom.role}
                        </h4>
                        <div className="text-slate-blue/80 text-2xl font-medium">
                          <p>{ENTOURAGE_CONFIG.couple.groom.name}</p>
                        </div>
                      </div>

                      {/* Bride */}
                      <div className="space-y-4">
                        <h4 className="text-2xl font-playfair text-dusty-rose mb-6">
                          {ENTOURAGE_CONFIG.couple.bride.role}
                        </h4>
                        <div className="text-slate-blue/80 text-2xl font-medium">
                          <p>{ENTOURAGE_CONFIG.couple.bride.name}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                </div>

              </div>
            </section>

            {/* ===== SECTION 7: WEDDING VENUES ===== */}
            <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-warm-beige/5 to-dusty-rose/10 relative py-16">
              <div className="max-w-7xl mx-auto px-6 w-full">

                {/* Section Header */}
                <motion.div
                  className="text-center mb-16"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  <h2 className="text-4xl md:text-5xl font-playfair text-slate-blue mb-6">
                    Wedding Venues
                  </h2>
                  <div className="flex justify-center items-center">
                    <div className="w-16 h-px bg-gradient-to-r from-transparent via-dusty-rose to-transparent"></div>
                    <div className="mx-4 w-2 h-2 bg-dusty-rose rounded-full"></div>
                    <div className="w-16 h-px bg-gradient-to-r from-dusty-rose via-transparent to-transparent"></div>
                  </div>
                </motion.div>

                <div className="space-y-20">

                  {/* Church - Ceremony Venue */}
                  <motion.div
                    className="grid lg:grid-cols-2 gap-12 items-center"
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                  >
                    {/* Church Info */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 bg-sage-green rounded-full flex items-center justify-center">
                          <span className="text-white text-2xl">⛪</span>
                        </div>
                        <div>
                          <h3 className="text-3xl md:text-4xl font-playfair text-slate-blue">Ceremony</h3>
                          <p className="text-sage-green text-lg">11:00 AM</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-xl border border-sage-green/20">
                        <h4 className="text-2xl font-playfair text-slate-blue mb-4">
                          Our Lady of Lourdes Parish
                        </h4>
                        <div className="text-lg text-slate-blue/80 mb-6 leading-relaxed">
                          <div className="flex items-start space-x-3 mb-2">
                            <span className="text-sage-green mt-1">📍</span>
                            <span>Tagaytay City, Cavite</span>
                          </div>
                          <p className="text-sm text-slate-blue/60 mt-4">
                            Join us for our sacred ceremony at this beautiful parish church in the heart of Tagaytay.
                          </p>
                        </div>

                        <button
                          className="w-full px-6 py-3 bg-sage-green text-white rounded-full hover:bg-sage-green/90 transition-colors text-lg font-medium shadow-lg"
                          onClick={() => window.open('https://maps.google.com/?q=Our+Lady+of+Lourdes+Parish+Tagaytay+City', '_blank')}
                        >
                          View on Google Maps
                        </button>
                      </div>
                    </div>

                    {/* Church Image */}
                    <div className="relative">
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-sage-green/20 to-dusty-rose/20">
                        <img
                          src="/imgs/church.jpg"
                          alt="Our Lady of Lourdes Parish Church"
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Reception - AQUILA Crystal Palace */}
                  <motion.div
                    className="grid lg:grid-cols-2 gap-12 items-center"
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                  >
                    {/* Reception Image */}
                    <div className="relative lg:order-1">
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-dusty-rose/20 to-warm-beige/20">
                        <img
                          src="/imgs/reception.jpg"
                          alt="AQUILA Crystal Palace Reception Venue"
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                      </div>
                    </div>

                    {/* Reception Info */}
                    <div className="space-y-6 lg:order-2">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 bg-dusty-rose rounded-full flex items-center justify-center">
                          <span className="text-white text-2xl">🏰</span>
                        </div>
                        <div>
                          <h3 className="text-3xl md:text-4xl font-playfair text-slate-blue">Reception</h3>
                          <p className="text-dusty-rose text-lg">1:00 PM onwards</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-xl border border-dusty-rose/20">
                        <h4 className="text-2xl font-playfair text-slate-blue mb-4">
                          AQUILA Crystal Palace
                        </h4>
                        <div className="text-lg text-slate-blue/80 mb-6 leading-relaxed">
                          <div className="flex items-start space-x-3 mb-2">
                            <span className="text-dusty-rose mt-1">📍</span>
                            <span>Tagaytay Events Place, Tagaytay City</span>
                          </div>
                          <p className="text-sm text-slate-blue/60 mt-4">
                            Celebrate with us at this elegant events venue with stunning views and exquisite facilities.
                          </p>
                        </div>

                        <button
                          className="w-full px-6 py-3 bg-dusty-rose text-white rounded-full hover:bg-dusty-rose/90 transition-colors text-lg font-medium shadow-lg"
                          onClick={() => window.open('https://maps.google.com/?q=AQUILA+Crystal+Palace+Tagaytay+Events+Place', '_blank')}
                        >
                          View on Google Maps
                        </button>
                      </div>
                    </div>
                  </motion.div>

                </div>

                {/* Transportation Note */}
                <motion.div
                  className="text-center mt-16"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl max-w-3xl mx-auto">
                    <h4 className="text-xl font-playfair text-slate-blue mb-4">Transportation</h4>
                    <p className="text-slate-blue/80 leading-relaxed">
                      Both venues are conveniently located in Tagaytay City. We recommend allowing extra travel time due to the scenic mountain roads.
                      Parking is available at both locations.
                    </p>
                  </div>
                </motion.div>

              </div>
            </section>

            {/* ===== SECTION 8: DRESS CODE ===== */}
            <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-sage-green/5 to-dusty-rose/10 relative py-16">
              <div className="max-w-6xl mx-auto px-6 w-full">

                {/* Section Header */}
                <motion.div
                  className="text-center mb-20"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  <div className="text-xl md:text-2xl font-playfair text-slate-blue/70 mb-4 tracking-widest">
                    MJ & ERICA
                  </div>
                  <h2 className="text-5xl md:text-6xl font-playfair text-sage-green mb-4 tracking-wide">
                    {DRESS_CODE_CONFIG.title}
                  </h2>
                  <p className="text-2xl font-playfair text-dusty-rose mb-8">
                    {DRESS_CODE_CONFIG.subtitle}
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

                <div className="space-y-16">

                  {/* Color Palette */}
                  {DRESS_CODE_DISPLAY_CONFIG.showColorPalette && (
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                      viewport={{ once: true }}
                    >
                      {/* Decorative Border Pattern */}
                      <motion.div
                        className="flex justify-center items-center mb-8"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                      >
                        <svg className="w-64 h-2 text-sage-green" viewBox="0 0 320 10" fill="currentColor">
                          <pattern id="palette-pattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                            <circle cx="4" cy="4" r="1" fill="currentColor" opacity="0.4" />
                          </pattern>
                          <rect width="320" height="2" fill="url(#palette-pattern)" />
                        </svg>
                      </motion.div>

                      <h3 className="text-3xl md:text-4xl font-playfair text-slate-blue mb-12 tracking-wide">
                        COLOR PALETTE
                      </h3>

                      <div className="grid md:grid-cols-5 gap-6 max-w-4xl mx-auto">
                        {/* Sage Green */}
                        <div className="space-y-3">
                          <div
                            className="w-20 h-20 rounded-full mx-auto shadow-lg border-2 border-white"
                            style={{ backgroundColor: DRESS_CODE_CONFIG.colors.sageGreen }}
                          ></div>
                          <p className="text-sm font-medium text-slate-blue">Sage Green</p>
                          {DRESS_CODE_DISPLAY_CONFIG.showColorCodes && (
                            <p className="text-xs text-slate-blue/60 font-mono">{DRESS_CODE_CONFIG.colors.sageGreen}</p>
                          )}
                        </div>

                        {/* Dusty Blue */}
                        <div className="space-y-3">
                          <div
                            className="w-20 h-20 rounded-full mx-auto shadow-lg border-2 border-white"
                            style={{ backgroundColor: DRESS_CODE_CONFIG.colors.dustyBlue }}
                          ></div>
                          <p className="text-sm font-medium text-slate-blue">Dusty Blue</p>
                          {DRESS_CODE_DISPLAY_CONFIG.showColorCodes && (
                            <p className="text-xs text-slate-blue/60 font-mono">{DRESS_CODE_CONFIG.colors.dustyBlue}</p>
                          )}
                        </div>

                        {/* Light Dusty Blue */}
                        <div className="space-y-3">
                          <div
                            className="w-20 h-20 rounded-full mx-auto shadow-lg border-2 border-white"
                            style={{ backgroundColor: DRESS_CODE_CONFIG.colors.lightDustyBlue }}
                          ></div>
                          <p className="text-sm font-medium text-slate-blue">Light Dusty Blue</p>
                          {DRESS_CODE_DISPLAY_CONFIG.showColorCodes && (
                            <p className="text-xs text-slate-blue/60 font-mono">{DRESS_CODE_CONFIG.colors.lightDustyBlue}</p>
                          )}
                        </div>

                        {/* Pink */}
                        <div className="space-y-3">
                          <div
                            className="w-20 h-20 rounded-full mx-auto shadow-lg border-2 border-white"
                            style={{ backgroundColor: DRESS_CODE_CONFIG.colors.pink }}
                          ></div>
                          <p className="text-sm font-medium text-slate-blue">Pink</p>
                          {DRESS_CODE_DISPLAY_CONFIG.showColorCodes && (
                            <p className="text-xs text-slate-blue/60 font-mono">{DRESS_CODE_CONFIG.colors.pink}</p>
                          )}
                        </div>

                        {/* Light Pink */}
                        <div className="space-y-3">
                          <div
                            className="w-20 h-20 rounded-full mx-auto shadow-lg border-2 border-white"
                            style={{ backgroundColor: DRESS_CODE_CONFIG.colors.lightPink }}
                          ></div>
                          <p className="text-sm font-medium text-slate-blue">Light Pink</p>
                          {DRESS_CODE_DISPLAY_CONFIG.showColorCodes && (
                            <p className="text-xs text-slate-blue/60 font-mono">{DRESS_CODE_CONFIG.colors.lightPink}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Role-Specific Requirements */}
                  {DRESS_CODE_DISPLAY_CONFIG.showRoleRequirements && (
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      viewport={{ once: true }}
                    >
                      {/* Decorative Border Pattern */}
                      <motion.div
                        className="flex justify-center items-center mb-8"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                      >
                        <svg className="w-64 h-2 text-dusty-rose" viewBox="0 0 320 10" fill="currentColor">
                          <pattern id="requirements-pattern" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                            <rect x="5" y="5" width="2" height="2" fill="currentColor" opacity="0.5" />
                          </pattern>
                          <rect width="320" height="2" fill="url(#requirements-pattern)" />
                        </svg>
                      </motion.div>

                      <h3 className="text-3xl md:text-4xl font-playfair text-slate-blue mb-12 tracking-wide">
                        ATTIRE REQUIREMENTS
                      </h3>

                      <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {/* Ninong */}
                        <div className="space-y-6">
                          <div className="w-20 h-20 rounded-lg mx-auto shadow-xl border border-sage-green/20 flex items-center justify-center bg-white/90 backdrop-blur-sm">
                            <div className="w-12 h-12 rounded-md" style={{ backgroundColor: DRESS_CODE_CONFIG.requirements.ninong.color }}></div>
                          </div>
                          <h4 className="text-2xl font-playfair text-sage-green">
                            {DRESS_CODE_CONFIG.requirements.ninong.title}
                          </h4>
                          <p className="text-slate-blue/80 text-lg leading-relaxed">
                            {DRESS_CODE_CONFIG.requirements.ninong.description}
                          </p>
                        </div>

                        {/* Ninang */}
                        <div className="space-y-6">
                          <div className="w-20 h-20 rounded-lg mx-auto shadow-xl border border-dusty-rose/20 flex items-center justify-center bg-white/90 backdrop-blur-sm">
                            <div className="w-12 h-12 rounded-md" style={{ backgroundColor: DRESS_CODE_CONFIG.requirements.ninang.color }}></div>
                          </div>
                          <h4 className="text-2xl font-playfair text-dusty-rose">
                            {DRESS_CODE_CONFIG.requirements.ninang.title}
                          </h4>
                          <p className="text-slate-blue/80 text-lg leading-relaxed">
                            {DRESS_CODE_CONFIG.requirements.ninang.description}
                          </p>
                        </div>

                        {/* Guests */}
                        <div className="space-y-6">
                          <div className="w-20 h-20 rounded-lg mx-auto shadow-xl border border-warm-beige/20 flex items-center justify-center bg-white/90 backdrop-blur-sm">
                            <div className="flex space-x-1">
                              <div
                                className="w-5 h-5 rounded-sm shadow-sm"
                                style={{ backgroundColor: DRESS_CODE_CONFIG.requirements.guests.colors[0] }}
                              ></div>
                              <div
                                className="w-5 h-5 rounded-sm shadow-sm"
                                style={{ backgroundColor: DRESS_CODE_CONFIG.requirements.guests.colors[1] }}
                              ></div>
                            </div>
                          </div>
                          <h4 className="text-2xl font-playfair text-warm-beige">
                            {DRESS_CODE_CONFIG.requirements.guests.title}
                          </h4>
                          <p className="text-slate-blue/80 text-lg leading-relaxed">
                            {DRESS_CODE_CONFIG.requirements.guests.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Guidelines */}
                  {DRESS_CODE_DISPLAY_CONFIG.showGuidelines && (
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      viewport={{ once: true }}
                    >
                      {/* Decorative Border Pattern */}
                      <motion.div
                        className="flex justify-center items-center mb-8"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 1.0, duration: 0.8 }}
                      >
                        <svg className="w-64 h-2 text-warm-beige" viewBox="0 0 320 10" fill="currentColor">
                          <pattern id="guidelines-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M0,5 L5,0 L10,5 L5,10 Z" fill="currentColor" opacity="0.3" />
                          </pattern>
                          <rect width="320" height="2" fill="url(#guidelines-pattern)" />
                        </svg>
                      </motion.div>

                      <h3 className="text-3xl md:text-4xl font-playfair text-slate-blue mb-12 tracking-wide">
                        GUIDELINES
                      </h3>

                      <div className="grid md:grid-cols-2 gap-16 max-w-4xl mx-auto">
                        {/* Allowed */}
                        <div className="space-y-6">
                          <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage-green/10 border-2 border-sage-green/20 mb-4">
                              <div className="w-8 h-8 rounded-full bg-sage-green"></div>
                            </div>
                            <h4 className="text-2xl font-playfair text-sage-green mb-6">
                              ENCOURAGED
                            </h4>
                          </div>
                          <div className="space-y-4 text-slate-blue/80 text-lg">
                            {DRESS_CODE_CONFIG.guidelines.allowed.map((item, index) => (
                              <div key={index} className="flex items-start justify-center">
                                <div className="w-2 h-2 rounded-full bg-sage-green/60 mr-4 mt-3 flex-shrink-0"></div>
                                <p className="text-center">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Not Allowed */}
                        <div className="space-y-6">
                          <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dusty-rose/10 border-2 border-dusty-rose/20 mb-4">
                              <div className="w-8 h-1 bg-dusty-rose transform rotate-45"></div>
                              <div className="w-8 h-1 bg-dusty-rose transform -rotate-45 absolute"></div>
                            </div>
                            <h4 className="text-2xl font-playfair text-dusty-rose mb-6">
                              PLEASE AVOID
                            </h4>
                          </div>
                          <div className="space-y-4 text-slate-blue/80 text-lg">
                            {DRESS_CODE_CONFIG.guidelines.notAllowed.map((item, index) => (
                              <div key={index} className="flex items-start justify-center">
                                <div className="w-2 h-2 rounded-full bg-dusty-rose/60 mr-4 mt-3 flex-shrink-0"></div>
                                <p className="text-center">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Notes */}
                  {DRESS_CODE_DISPLAY_CONFIG.showNotes && (
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      viewport={{ once: true }}
                    >
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl max-w-3xl mx-auto">
                        <h4 className="text-xl font-playfair text-slate-blue mb-6">Important Notes</h4>
                        <div className="space-y-3 text-slate-blue/80 leading-relaxed">
                          {DRESS_CODE_CONFIG.notes.map((note, index) => (
                            <p key={index} className="text-lg">{note}</p>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                </div>

              </div>
            </section>

            {/* ===== SECTION 9: OTHER DETAILS ===== */}
            <OtherDetailsSection />

            {/* ===== SECTION 10: FAQ ===== */}
            <FAQSection openFAQIndex={openFAQIndex} setOpenFAQIndex={setOpenFAQIndex} />

            {/* 3 Images below Dress Code */}
            <div className="py-8 bg-white">
              <motion.div
                className="grid grid-cols-3 gap-2 mx-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="aspect-[3/2] rounded-lg overflow-hidden shadow-lg">
                  <img
                    src="/weddingimgs/img1.jpg"
                    alt="Beautiful wedding moment"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[3/2] rounded-lg overflow-hidden shadow-lg">
                  <img
                    src="/weddingimgs/img3.jpg"
                    alt="Romantic wedding portrait"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[3/2] rounded-lg overflow-hidden shadow-lg">
                  <img
                    src="/weddingimgs/img5.jpg"
                    alt="Elegant wedding celebration"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RSVP Modal */}
      {invitation && (
        <RSVPModal
          isOpen={showRSVPModal}
          onClose={() => setShowRSVPModal(false)}
          guestName={invitation.guestName}
          qrCode={qrCode}
          onSuccess={handleRSVPSuccess}
          isUpdating={!!invitation.rsvp?.status && invitation.rsvp.status !== 'pending'}
        />
      )}

      {/* Success Modal */}
      {rsvpStatus && (
        <RSVPSuccessModal
          isOpen={showSuccessModal}
          status={rsvpStatus}
          guestName={invitation?.guestName || ''}
          attendeeCount={rsvpAttendeeCount}
        />
      )}

      {/* RSVP Status Modal */}
      {invitation?.rsvp?.status && invitation.rsvp.status !== 'pending' && (
        <RSVPStatusModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          guestName={invitation.guestName}
          rsvpData={invitation.rsvp as { status: 'attending' | 'not_attending'; attendeeCount?: number; respondedAt?: string; guestNames?: string[]; email?: string; phone?: string; }}
          onUpdateRSVP={handleUpdateRSVP}
        />
      )}
    </div>
  );
}

