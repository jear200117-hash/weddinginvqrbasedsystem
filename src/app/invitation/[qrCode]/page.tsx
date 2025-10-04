'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { invitationsAPI, rsvpAPI } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import RotatingBackground from '@/components/RotatingBackground';
import AnimatedBackground from '@/components/AnimatedBackground';
import StoryCarousel from '@/components/StoryCarousel';
import RSVPSection from '@/components/RSVPSection';
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
import { Martini, Camera, Utensils, Mic, Cake, Music, Car } from "lucide-react";
import { useInvitationByQR, useRSVPByQR } from '@/hooks/useFirebaseRealtime';
import { getImageUrl, CloudinaryPresets } from '@/lib/cloudinary';

interface Invitation {
  id: string;
  guestName: string;
  guestRole: string;
  customMessage: string;
  invitationType: string;
  qrCode: string;
  isActive: boolean;
  rsvp: {
    status: 'pending' | 'attending' | 'not_attending';
    attendeeCount?: number;
    guestNames?: string[];
    email?: string;
    phone?: string;
    submittedAt?: any;
    ipAddress?: string;
    userAgent?: string;
  };
  openedAt?: any;
  createdAt: any;
  updatedAt: any;
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

  // RSVP States
  const [rsvpStatus, setRsvpStatus] = useState<'attending' | 'not_attending' | null>(null);
  const [rsvpAttendeeCount, setRsvpAttendeeCount] = useState<number>(0);
  // FAQ accordion state
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);
  // RSVP Reminder Modal
  const [showRSVPReminder, setShowRSVPReminder] = useState(false);

  // Firebase real-time data
  const firebaseInvitation = useInvitationByQR(qrCode);
  const firebaseRSVP = useRSVPByQR(qrCode);

  // Add beforeunload reminder for RSVP
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only show reminder if RSVP is not submitted
      if (!invitation?.rsvp?.status || invitation.rsvp.status === 'pending') {
        e.preventDefault();
        setShowRSVPReminder(true);
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [invitation?.rsvp?.status]);

  // Show RSVP reminder when user scrolls to middle section
  useEffect(() => {
    if (!invitation?.rsvp?.status || invitation.rsvp.status === 'pending') {
      const handleScroll = () => {
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Show reminder when user has scrolled past 40% of the page
        if (scrollPosition > documentHeight * 0.4) {
          setShowRSVPReminder(true);
          window.removeEventListener('scroll', handleScroll);
        }
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [invitation?.rsvp?.status]);

  // Prevent closing with Escape key when RSVP not submitted
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (!invitation?.rsvp?.status || invitation.rsvp.status === 'pending')) {
        e.preventDefault();
        setShowRSVPReminder(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [invitation?.rsvp?.status]);

  // Mark invitation as opened when page loads
  useEffect(() => {
    if (qrCode) {
      // Call backend API to mark invitation as opened
      fetch(`https://api-rpahsncjpa-as.a.run.app/invitations/qr/${qrCode}`)
        .then(response => response.json())
        .then(data => {
          if (data.invitation) {
            console.log('Invitation marked as opened via API');
          }
        })
        .catch(error => {
          console.error('Error marking invitation as opened:', error);
        });
    }
  }, [qrCode]);

  // Firebase real-time invitation data
  useEffect(() => {
    if (firebaseInvitation.invitation) {
      setInvitation(firebaseInvitation.invitation);
      // Start directly with envelope stage - user must click to open invitation
      setTimeout(() => setAnimationStage('envelope'), 500);
      setLoading(false);
    }
  }, [firebaseInvitation.invitation]);

  useEffect(() => {
    if (firebaseInvitation.error) {
      setError('Failed to load invitation');
      setLoading(false);
    }
  }, [firebaseInvitation.error]);

  // Update loading state based on Firebase data
  useEffect(() => {
    setLoading(firebaseInvitation.loading);
  }, [firebaseInvitation.loading]);

  // Firebase real-time RSVP updates are handled by the hooks above
  // No need for Socket.IO subscriptions since we're using Firebase real-time

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

  const handleRSVPClick = () => {
    if (invitation?.rsvp?.status && invitation.rsvp.status !== 'pending') {
      // RSVP already submitted, navigate to home
      window.location.href = '/';
      return;
    }
    // Scroll to RSVP section
    const rsvpSection = document.getElementById('rsvp-section');
    if (rsvpSection) {
      rsvpSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRSVPSuccess = (status: 'attending' | 'not_attending', attendeeCount: number = 0) => {
    setRsvpStatus(status);
    setRsvpAttendeeCount(attendeeCount);

    // Update the invitation state to reflect RSVP submission
    if (invitation) {
      setInvitation({
        ...invitation,
        rsvp: {
          status,
          attendeeCount,
          submittedAt: new Date()
        }
      });
    }
  };

  const handleRSVPReminderClose = () => {
    setShowRSVPReminder(false);
  };

  const handleGoToRSVP = () => {
    setShowRSVPReminder(false);
    const rsvpSection = document.getElementById('rsvp-section');
    if (rsvpSection) {
      rsvpSection.scrollIntoView({ behavior: 'smooth' });
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

      {/* RSVP Reminder Banner */}
      {(!invitation?.rsvp?.status || invitation.rsvp.status === 'pending') && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 left-0 right-0 bg-[#5976DA] text-white z-40 shadow-lg"
        >
          <div className="px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">
                Please don't forget to RSVP! Your response is important to us.
              </span>
              <button
                onClick={() => setShowRSVPReminder(true)}
                className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-medium transition-colors"
              >
                RSVP Now
              </button>
            </div>
          </div>
        </motion.div>
      )}
      <AnimatePresence mode="wait">
        {/* Envelope Stage */}
        {animationStage === 'envelope' && (
          <motion.div
            key="envelope"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={`min-h-screen flex items-center justify-center ${(!invitation?.rsvp?.status || invitation.rsvp.status === 'pending') ? 'pt-16' : ''}`}
          >
            {/* Animated Background for Envelope Stage */}
            <AnimatedBackground opacity={0.15} />
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="text-center cursor-pointer"
              onClick={() => setAnimationStage('invitation')}
            >
              <div className="flex items-center justify-center">
                {/* Combined Monogram with MJ and Erica */}
                <motion.div
                  className="w-80 sm:w-96 md:w-[28rem] lg:w-[32rem] xl:w-[36rem] transform rotate-3 hover:rotate-0 transition-transform"
                  whileHover={{ rotate: 0, scale: 1.05 }}
                  animate={{
                    scale: [1, 1.02, 1],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    scale: { 
                      duration: 4, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }
                  }}
                >
                  <img
                    src={getImageUrl('imgs', 'monogramwithmjanderica.png', CloudinaryPresets.highQuality)}
                    alt="MJ & Erica Wedding Monogram"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </div>
              <p className="text-lg sm:text-xl text-gray-600 mt-6 px-4">Click to open your invitation</p>
            </motion.div>
          </motion.div>
        )}

        {/* Invitation Stage */}
        {animationStage === 'invitation' && (
          <motion.div
            key="invitation"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative ${(!invitation?.rsvp?.status || invitation.rsvp.status === 'pending') ? 'pt-10' : ''}`}
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
                className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto text-white"
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
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-playfair font-bold text-white tracking-tight leading-tight drop-shadow-lg">
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
                    Walk with us as we say 'I Do'and step into our forever.
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
                    className={`group relative px-10 py-3 backdrop-blur-sm text-white rounded-full overflow-hidden text-lg font-medium shadow-xl border border-white/50 ${invitation?.rsvp?.status === 'pending' || !invitation?.rsvp
                      ? 'bg-sage-green/90 hover:bg-sage-green'
                      : 'bg-emerald-600/90 hover:bg-emerald-600'
                      }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">
                      {invitation?.rsvp?.status === 'pending' || !invitation?.rsvp
                        ? 'RSVP'
                        : 'Proceed to Home'
                      }
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </span>
                  </motion.button>

                  {/* RSVP Status Indicator */}
                  {invitation?.rsvp?.status && invitation.rsvp.status !== 'pending' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.7, duration: 0.6 }}
                      className="mt-4 text-center"
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm">
                        {invitation.rsvp.status === 'attending' ? (
                          <>
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span>✓ RSVP Confirmed</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span>✗ RSVP Declined</span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            </section>

            {/* ===== SECTION 2: COUNTDOWN & VIDEO ===== */}
            <section className="min-h-screen flex items-center justify-center relative overflow-hidden py-16">
              {/* Subtle Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{
                  backgroundImage: `url(${getImageUrl('weddingimgs', 'img1.jpg', CloudinaryPresets.background)})`,
                  opacity: 0.08,
                  transform: 'scale(1.1)'
                }}
              />


              <div className="relative z-10 text-center px-6 max-w-6xl mx-auto w-full">

                {/* Header Text */}
                <motion.div
                  className="mb-12"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  <div className="w-20 h-20 mx-auto flex items-center justify-center overflow-hidden mb-5">
                    <img
                      src={getImageUrl('imgs', 'monogram-flower-black.png', CloudinaryPresets.highQuality)}
                      alt="MJ & Erica Monogram"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h2 className="text-6xl md:text-6xl font-parisienne text-slate-blue mb-4">
                    We are getting married
                  </h2>
                  <p className="text-2xl font-parisienne text-black mb-8">
                    January 16, 2026
                  </p>

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

                {/* Countdown Section */}
                <motion.div
                  className="mb-16"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  <h3 className="text-3xl md:text-4xl font-parisienne text-sage-green mb-8">
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
            <section className="min-h-screen flex items-center justify-center bg-white relative py-16 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{
                  backgroundImage: `url(${getImageUrl('weddingimgs', 'img4.jpg', CloudinaryPresets.background)})`,
                  opacity: 0.08,
                  transform: 'scale(1.1)'
                }}
              />
              <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
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
                      <div className="w-32 h-32 flex items-center justify-center overflow-hidden">
                        <img
                          src={getImageUrl('imgs', 'monogram-black.png', CloudinaryPresets.highQuality)}
                          alt="MJ & Erica Monogram"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Main Heading */}
                    <h2 className="text-6xl md:text-6xl font-parisienne text-slate-blue leading-tight">
                      Part of our story
                    </h2>

                    {/* Subheading */}
                    <p className="text-xl md:text-2xl font-parisienne text-sage-green">
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
            <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-sage-green/5 to-dusty-rose/10 relative py-20 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{
                  backgroundImage: `url(${getImageUrl('weddingimgs', 'img2.jpg', CloudinaryPresets.background)})`,
                  opacity: 0.08,
                  transform: 'scale(1.1)'
                }}
              />
              <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">

                {/* Section Header */}
                <motion.div
                  className="text-center mb-20"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  <div className="w-20 h-20 mx-auto flex items-center justify-center overflow-hidden mb-5">
                    <img
                      src={getImageUrl('imgs', 'monogram-flower-black.png', CloudinaryPresets.highQuality)}
                      alt="MJ & Erica Monogram"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h2 className="text-6xl md:text-6xl font-parisienne text-slate-blue mb-4">
                    Wedding Timeline
                  </h2>
                  <p className="text-2xl font-parisienne text-black mb-8">
                    January 16, 2026
                  </p>

                  {/* Decorative Flourish */}
                  <motion.div
                    className="flex justify-center items-center"
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

                {/* Timeline Content */}
                <motion.div
                  className="max-w-4xl mx-auto"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  <div className="flex items-center justify-center">
                    <div className="space-y-2">
                      {[
                        { time: "11:00 AM", label: "Ceremony", icon: <Heart className="w-6 h-6 stroke-[1.5]" />, description: "Our Lady of Lourdes Parish" },
                        { time: "12:30 PM", label: "Cocktails", icon: <Martini className="w-6 h-6 stroke-[1.5]" />, description: "Welcome Reception" },
                        { time: "1:00 PM", label: "Photos", icon: <Camera className="w-6 h-6 stroke-[1.5]" />, description: "Wedding Portraits" },
                        { time: "2:00 PM", label: "Reception", icon: <Utensils className="w-6 h-6 stroke-[1.5]" />, description: "AQUILA Crystal Palace" },
                        { time: "2:30 PM", label: "Speeches", icon: <Mic className="w-6 h-6 stroke-[1.5]" />, description: "Toasts & Well Wishes" },
                        { time: "3:00 PM", label: "Cake Cutting", icon: <Cake className="w-6 h-6 stroke-[1.5]" />, description: "Sweet Celebration" },
                        { time: "4:00 PM", label: "First Dance", icon: <Music className="w-6 h-6 stroke-[1.5]" />, description: "Our Special Moment" },
                        { time: "6:00 PM", label: "Send Off", icon: <Car className="w-6 h-6 stroke-[1.5]" />, description: "Farewell & Thanks" },
                      ].map((item, idx) => (
                        <motion.div
                          key={idx}
                          className="flex items-center gap-8 p-6 rounded-2xl hover:bg-sage-green/5 transition-colors"
                          initial={{ opacity: 0, x: -30 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: idx * 0.1 }}
                          viewport={{ once: true }}
                        >
                          {/* Time */}
                          <div className="w-24 text-right">
                            <div className="text-lg md:text-xl font-geist-sans text-sage-green font-semibold">
                              {item.time}
                            </div>
                          </div>

                          {/* Icon */}
                          <div className="w-18 h-18 bg-gradient-to-br from-sage-green/20 to-dusty-rose/20 rounded-full flex items-center justify-center">
                            <span className="text-sage-green">{item.icon}</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <h3 className="text-xl md:text-2xl font-geist-sans text-slate-blue mb-1">
                              {item.label}
                            </h3>
                            <p className="text-slate-blue/70 text-md md:text-xl">
                              {item.description}
                            </p>
                          </div>

                          {/* Decorative Line */}
                          <div className="hidden md:block w-16 h-px bg-gradient-to-r from-sage-green/30 to-transparent"></div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Additional Note */}
                <motion.div
                  className="text-center mt-12"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                >
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl max-w-2xl mx-auto">
                    <h4 className="text-lg font-parisienne text-slate-blue mb-3">Important Note</h4>
                    <p className="text-slate-blue/80 leading-relaxed">
                      Please arrive 15 minutes before the ceremony.
                    </p>
                  </div>
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
                    src={ACTIVE_ENTOURAGE_CONFIG ? getImageUrl('weddingimgs', ENTOURAGE_IMAGES_CONFIG[ACTIVE_ENTOURAGE_CONFIG][0], CloudinaryPresets.auto) : getImageUrl('weddingimgs', 'img9.jpg', CloudinaryPresets.auto)}
                    alt="Elegant wedding moment"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[3/2] rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={ACTIVE_ENTOURAGE_CONFIG ? getImageUrl('weddingimgs', ENTOURAGE_IMAGES_CONFIG[ACTIVE_ENTOURAGE_CONFIG][1], CloudinaryPresets.auto) : getImageUrl('weddingimgs', 'img11.jpg', CloudinaryPresets.auto)}
                    alt="Romantic wedding portrait"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[3/2] rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={ACTIVE_ENTOURAGE_CONFIG ? getImageUrl('weddingimgs', ENTOURAGE_IMAGES_CONFIG[ACTIVE_ENTOURAGE_CONFIG][2], CloudinaryPresets.auto) : getImageUrl('weddingimgs', 'img13.jpg', CloudinaryPresets.auto)}
                    alt="Beautiful wedding celebration"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            </div>


            {/* ===== SECTION 6: WEDDING ENTOURAGE ===== */}
            <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-warm-beige/5 to-dusty-rose/10 relative py-16 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{
                  backgroundImage: `url(${getImageUrl('weddingimgs', 'img3.jpg', CloudinaryPresets.background)})`,
                  opacity: 0.08,
                  transform: 'scale(1.1)'
                }}
              />
              <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
                {/* Section Header */}
                <motion.div
                  className="text-center mb-20"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  <div className="w-20 h-20 mx-auto flex items-center justify-center overflow-hidden mb-5">
                    <img
                      src={getImageUrl('imgs', 'monogram-flower-black.png', CloudinaryPresets.highQuality)}
                      alt="MJ & Erica Monogram"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h2 className="text-6xl md:text-6xl font-parisienne text-slate-blue mb-8">
                    The Entourage
                  </h2>
                  <p className="text-2xl font-parisienne text-black mb-8">
                    January 16, 2026
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
                      <h3 className="text-4xl md:text-6xl font-parisienne text-slate-blue mb-8">
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
                      <h3 className="text-5xl md:text-6xl font-parisienne text-dusty-rose mb-12">
                        {ENTOURAGE_CONFIG.parents.title}
                      </h3>

                      <div className="grid md:grid-cols-2 gap-16 max-w-4xl mx-auto">
                        {/* Groom's Parents */}
                        <div className="space-y-4">
                          <h4 className="text-4xl font-parisienne text-slate-blue mb-6">
                            {ENTOURAGE_CONFIG.parents.groomParents.title}
                          </h4>
                          <div className="space-y-3 text-slate-blue/80 text-xl">
                            {ENTOURAGE_CONFIG.parents.groomParents.members.map((member, index) => (
                              <p key={index}>{member.name}</p>
                            ))}
                          </div>
                        </div>

                        {/* Bride's Parents */}
                        <div className="space-y-4">
                          <h4 className="text-4xl font-parisienne text-dusty-rose mb-6">
                            {ENTOURAGE_CONFIG.parents.brideParents.title}
                          </h4>
                          <div className="space-y-3 text-slate-blue/80 text-xl">
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
                      <h3 className="text-5xl md:text-6xl font-parisienne text-dusty-rose mb-12">
                        {ENTOURAGE_CONFIG.principalSponsors.title}
                      </h3>

                      <div className="grid md:grid-cols-2 gap-16 max-w-4xl mx-auto">
                        {/* Ninong */}
                        <div className="space-y-4">
                          <h4 className="text-3xl font-parisienne text-slate-blue mb-8">
                            {ENTOURAGE_CONFIG.principalSponsors.ninong.title}
                          </h4>
                          <div className="space-y-3 text-slate-blue/80 text-xl">
                            {ENTOURAGE_CONFIG.principalSponsors.ninong.members.map((member, index) => (
                              <p key={index}>
                                {member.name}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Ninang */}
                        <div className="space-y-4">
                          <h4 className="text-3xl font-parisienne text-dusty-rose mb-8">
                            {ENTOURAGE_CONFIG.principalSponsors.ninang.title}
                          </h4>
                          <div className="space-y-3 text-slate-blue/80 text-xl">
                            {ENTOURAGE_CONFIG.principalSponsors.ninang.members.map((member, index) => (
                              <p key={index}>
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
                      <h3 className="text-5xl md:text-6xl font-parisienne text-dusty-rose mb-12">
                        {ENTOURAGE_CONFIG.secondarySponsors.title}
                      </h3>

                      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Candle (in) */}
                        <div className="space-y-3">
                          <h4 className="text-3xl font-parisienne text-dusty-rose mb-4">
                            {ENTOURAGE_CONFIG.secondarySponsors.candleIn.title}
                          </h4>
                          <div className="space-y-2 text-slate-blue/80 text-xl">
                            {ENTOURAGE_CONFIG.secondarySponsors.candleIn.members.map((member, index) => (
                              <p key={index}>{member.name}</p>
                            ))}
                          </div>
                        </div>

                        {/* Veil */}
                        <div className="space-y-3">
                          <h4 className="text-3xl font-parisienne text-dusty-rose mb-4">
                            {ENTOURAGE_CONFIG.secondarySponsors.veil.title}
                          </h4>
                          <div className="space-y-2 text-slate-blue/80 text-xl">
                            {ENTOURAGE_CONFIG.secondarySponsors.veil.members.map((member, index) => (
                              <p key={index}>{member.name}</p>
                            ))}
                          </div>
                        </div>

                        {/* Cord */}
                        <div className="space-y-3">
                          <h4 className="text-3xl font-parisienne text-warm-beige mb-4">
                            {ENTOURAGE_CONFIG.secondarySponsors.cord.title}
                          </h4>
                          <div className="space-y-2 text-slate-blue/80 text-xl">
                            {ENTOURAGE_CONFIG.secondarySponsors.cord.members.map((member, index) => (
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
                      <h3 className="text-5xl md:text-6xl font-parisienne text-dusty-rose mb-12">
                        {ENTOURAGE_CONFIG.weddingParty.title}
                      </h3>

                      <div className="grid md:grid-cols-2 gap-16 max-w-4xl mx-auto">
                        {/* Groomsmen */}
                        <div className="space-y-4">
                          <h4 className="text-3xl font-parisienne text-slate-blue mb-8">
                            {ENTOURAGE_CONFIG.weddingParty.groomsmen.title}
                          </h4>
                          <div className="space-y-3 text-slate-blue/80 text-xl">
                            {ENTOURAGE_CONFIG.weddingParty.groomsmen.members.map((member, index) => (
                              <p key={index}>
                                {member.name}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Bridesmaids */}
                        <div className="space-y-4">
                          <h4 className="text-3xl font-parisienne text-dusty-rose mb-8">
                            {ENTOURAGE_CONFIG.weddingParty.bridesmaids.title}
                          </h4>
                          <div className="space-y-3 text-slate-blue/80 text-xl">
                            {ENTOURAGE_CONFIG.weddingParty.bridesmaids.members.map((member, index) => (
                              <p key={index}>
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
                      <h3 className="text-5xl md:text-6xl font-parisienne text-warm-beige mb-12">
                        {ENTOURAGE_CONFIG.bearers.title}
                      </h3>

                      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {/* Ring Bearer */}
                        <div className="space-y-3">
                          <h4 className="text-3xl font-parisienne text-dusty-rose mb-4">
                            {ENTOURAGE_CONFIG.bearers.ring.title}
                          </h4>
                          <div className="space-y-2 text-slate-blue/80 text-xl">
                            {ENTOURAGE_CONFIG.bearers.ring.members.map((member, index) => (
                              <p key={index}>{member.name}</p>
                            ))}
                          </div>
                        </div>

                        {/* Arras Bearer */}
                        <div className="space-y-3">
                          <h4 className="text-3xl font-parisienne text-dusty-rose mb-4">
                            {ENTOURAGE_CONFIG.bearers.arras.title}
                          </h4>
                          <div className="space-y-2 text-slate-blue/80 text-xl">
                            {ENTOURAGE_CONFIG.bearers.arras.members.map((member, index) => (
                              <p key={index}>{member.name}</p>
                            ))}
                          </div>
                        </div>

                        {/* Bible Bearer */}
                        <div className="space-y-3">
                          <h4 className="text-3xl font-parisienne text-warm-beige mb-4">
                            {ENTOURAGE_CONFIG.bearers.bible.title}
                          </h4>
                          <div className="space-y-2 text-slate-blue/80 text-xl">
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
                      <h3 className="text-5xl md:text-6xl font-parisienne text-dusty-rose mb-12">
                        {ENTOURAGE_CONFIG.flowerGirls.title}
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-16 max-w-4xl mx-auto">
                        {/* Escort */}
                      <div className="space-y-4">
                          <h4 className="text-3xl font-parisienne text-slate-blue mb-8">
                            {ENTOURAGE_CONFIG.escort.title}
                          </h4>
                          <div className="space-y-3 text-slate-blue/80 text-xl">
                            {ENTOURAGE_CONFIG.escort.members.map((member, index) => (
                              <p key={index}>
                                {member.name}
                              </p>
                            ))}
                          </div>
                      </div>

                        {/* Flower Girls */}
                        <div className="space-y-4">
                          <h4 className="text-3xl font-parisienne text-dusty-rose mb-8">
                            {ENTOURAGE_CONFIG.flowerGirls.title}
                          </h4>
                          <div className="space-y-3 text-slate-blue/80 text-xl">
                            {ENTOURAGE_CONFIG.flowerGirls.members.map((member, index) => (
                              <p key={index}>
                                {member.name}
                              </p>
                            ))}
                          </div>
                        </div>

                        
                      </div>
                    </motion.div>
                  )}

                  {/* Little Bride and Little Groom */}
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.4 }}
                    viewport={{ once: true }}
                  >
                    <h3 className="text-5xl md:text-6xl font-parisienne text-dusty-rose mb-12">
                      The Little Couple
                    </h3>

                    <div className="grid md:grid-cols-2 gap-16 max-w-4xl mx-auto">
                      {/* Groom */}
                      <div className="space-y-4">
                        <h4 className="text-2xl font-parisienne text-slate-blue mb-6">
                          {ENTOURAGE_CONFIG.littleCouple.littleGroom.role}
                        </h4>
                        <div className="text-slate-blue/80 text-2xl font-medium">
                          <p>{ENTOURAGE_CONFIG.littleCouple.littleGroom.name}</p>
                        </div>
                      </div>

                      {/* Bride */}
                      <div className="space-y-4">
                        <h4 className="text-2xl font-parisienne text-dusty-rose mb-6">
                          {ENTOURAGE_CONFIG.littleCouple.littleBride.role}
                        </h4>
                        <div className="text-slate-blue/80 text-2xl font-medium">
                          <p>{ENTOURAGE_CONFIG.littleCouple.littleBride.name}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Maid of Honor */}
                  {ENTOURAGE_DISPLAY_CONFIG.showMaidOfHonor && (
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 1.6 }}
                      viewport={{ once: true }}
                    >
                      <h3 className="text-5xl md:text-6xl font-parisienne text-dusty-rose mb-12">
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
                    transition={{ duration: 0.8, delay: 1.8 }}
                    viewport={{ once: true }}
                  >
                    <h3 className="text-5xl md:text-6xl font-parisienne text-slate-blue mb-12">
                      The Couple
                    </h3>

                    <div className="grid md:grid-cols-2 gap-16 max-w-4xl mx-auto">
                      {/* Groom */}
                      <div className="space-y-4">
                        <h4 className="text-4xl font-parisienne text-sage-green mb-6">
                          {ENTOURAGE_CONFIG.couple.groom.role}
                        </h4>
                        <div className="text-slate-blue/80 text-2xl font-medium">
                          <p>{ENTOURAGE_CONFIG.couple.groom.name}</p>
                        </div>
                      </div>

                      {/* Bride */}
                      <div className="space-y-4">
                        <h4 className="text-4xl font-parisienne text-dusty-rose mb-6">
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
            <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-warm-beige/5 to-dusty-rose/10 relative py-16 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{
                  backgroundImage: `url(${getImageUrl('weddingimgs', 'img11.jpg', CloudinaryPresets.background)})`,
                  opacity: 0.08,
                  transform: 'scale(1.1)'
                }}
              />
              <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">

                {/* Section Header */}
                <motion.div
                  className="text-center mb-16"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  <div className="w-20 h-20 mx-auto flex items-center justify-center overflow-hidden mb-5">
                    <img
                      src={getImageUrl('imgs', 'monogram-flower-black.png', CloudinaryPresets.highQuality)}
                      alt="MJ & Erica Monogram"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h2 className="text-6xl md:text-6xl font-parisienne text-slate-blue mb-8">
                    Wedding Venues
                  </h2>
                  <p className="text-2xl font-parisienne text-black mb-8">
                    January 16, 2026
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
                          <h3 className="text-3xl md:text-4xl font-parisienne text-slate-blue">Ceremony</h3>
                          <p className="text-sage-green text-lg font-parisienne">11:00 AM</p>
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
                          src={getImageUrl('imgs', 'church.jpg', CloudinaryPresets.auto)}
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
                          src={getImageUrl('imgs', 'reception.jpg', CloudinaryPresets.auto)}
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
                          <h3 className="text-3xl md:text-4xl font-parisienne text-slate-blue">Reception</h3>
                          <p className="text-dusty-rose text-lg font-parisienne">1:00 PM onwards</p>
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
                    <h4 className="text-xl font-parisienne text-slate-blue mb-4">Transportation</h4>
                    <p className="text-slate-blue/80 leading-relaxed">
                      Both venues are conveniently located in Tagaytay City. We recommend allowing extra travel time due to the scenic mountain roads.
                      Parking is available at both locations.
                    </p>
                  </div>
                </motion.div>

              </div>
            </section>

            {/* ===== SECTION 8: DRESS CODE ===== */}
            <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-sage-green/5 to-dusty-rose/10 relative py-16 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{
                  backgroundImage: `url(${getImageUrl('weddingimgs', 'img15.jpg', CloudinaryPresets.background)})`,
                  opacity: 0.08,
                  transform: 'scale(1.1)'
                }}
              />
              <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
                {/* Section Header */}
                <motion.div
                  className="text-center mb-20"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  <div className="w-20 h-20 mx-auto flex items-center justify-center overflow-hidden mb-5">
                    <img
                      src={getImageUrl('imgs', 'monogram-flower-black.png', CloudinaryPresets.highQuality)}
                      alt="MJ & Erica Monogram"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h2 className="text-6xl md:text-6xl font-parisienne text-slate-blue mb-8">
                    {DRESS_CODE_CONFIG.title}
                  </h2>
                  <p className="text-2xl font-parisienne text-black mb-8">
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
                          <p className="text-sm font-medium text-slate-blue">DustyPink</p>
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
                          <p className="text-sm font-medium text-slate-blue">Light Dusty Pink</p>
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

                      <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                        {/* Ninong */}
                        <div className="space-y-6">
                          <div className="w-32 h-32 rounded-lg mx-auto overflow-hidden">
                            <img
                              src={getImageUrl('imgs', 'ninong.png', CloudinaryPresets.auto)}
                              alt="Ninong dress code"
                              className="w-full h-full object-cover"
                            />
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
                          <div className="w-32 h-32 rounded-lg mx-auto overflow-hidden">
                            <img
                              src={getImageUrl('imgs', 'ninang.png', CloudinaryPresets.auto)}
                              alt="Ninang dress code"
                              className="w-full h-full object-cover"
                            />
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
                          <div className="w-50 h-32 rounded-lg mx-auto overflow-hidden">
                            <img
                              src={getImageUrl('imgs', 'guest.png', CloudinaryPresets.auto)}
                              alt="Guest dress code"
                              className="w-full h-full object-cover"
                            />
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
                    src={getImageUrl('weddingimgs', 'img15.jpg', CloudinaryPresets.auto)}
                    alt="Beautiful wedding moment"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[3/2] rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={getImageUrl('weddingimgs', 'img1.jpg', CloudinaryPresets.auto)}
                    alt="Romantic wedding portrait"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[3/2] rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={getImageUrl('weddingimgs', 'img5.jpg', CloudinaryPresets.auto)}
                    alt="Elegant wedding celebration"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            </div>

            {/* ===== SECTION 11: RSVP ===== */}
            <div id="rsvp-section">
              <RSVPSection
                guestName={invitation?.guestName || ''}
                qrCode={qrCode}
                customMessage={invitation?.customMessage || "We would be honored to have you join us as we celebrate our special day. Please let us know if you'll be able to attend our wedding celebration."}
                currentRSVP={invitation?.rsvp}
                onRSVPSuccess={handleRSVPSuccess}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RSVP Reminder Modal */}
      {showRSVPReminder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/50"
          >
            <div className="text-center space-y-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white" />
                </div>
              </div>

              <h3 className="text-2xl font-playfair text-slate-blue mb-2">
                Don't Forget to RSVP!
              </h3>

              <p className="text-gray-600 leading-relaxed">
                We would love to know if you'll be joining us for our special day.
                Please take a moment to respond to our invitation.
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleRSVPReminderClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleGoToRSVP}
                  className="flex-1 px-4 py-3 bg-[#5976DA] text-white rounded-xl hover:from-sage-green/90 hover:to-emerald-600/90 transition-all"
                >
                  RSVP Now
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

