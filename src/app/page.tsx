'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mail, Image, Users, ArrowRight, Calendar, MapPin, Clock, Camera, BookOpen, Gift, Music, Utensils, Home, User, Camera as CameraIcon, Users as UsersIcon, MapPin as MapPinIcon, Clock as ClockIcon, X, Eye, Play, Download, Martini, Mic, Cake, Car} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { albumsAPI, mediaAPI } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';

import { useLazyLoadMultipleImages } from '@/hooks/useLazyLoadWithPerformance';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

interface Album {
  _id: string;
  name: string;
  description: string;
  coverImage?: string;
  isFeatured: boolean;
  isPublic: boolean;
  mediaCount: number;
  lastUpdated: string;
}

interface Media {
  _id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  mediaType: 'image' | 'video';
  album: string;
  uploadedBy?: string;
  isApproved: boolean;
  createdAt: string;
}

function TabInitializer({ onInit }: { onInit: (tab: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['home', 'story', 'photos', 'timeline'].includes(tab)) {
      onInit(tab);
    }
  }, [searchParams, onInit]);
  return null;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('home');

  // Album functionality state (display-only)
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumMedia, setAlbumMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // How We Met carousel state
  const [howWeMetImages] = useState([
    'https://res.cloudinary.com/ddjopmdsi/image/upload/w_800,h_600,c_fill,f_auto,q_auto/IMG_7327_afee0e.heic',
    'https://res.cloudinary.com/ddjopmdsi/image/upload/w_800,h_600,c_fill,f_auto,q_auto/IMG_9938_l7s1bu.heic',
    'https://res.cloudinary.com/ddjopmdsi/image/upload/w_800,h_600,c_fill,f_auto,q_auto/IMG_8956_gv9zbw.heic',
    'https://res.cloudinary.com/ddjopmdsi/image/upload/w_800,h_600,c_fill,f_auto,q_auto/IMG_4703_locd2s.jpg',
    'https://res.cloudinary.com/ddjopmdsi/image/upload/w_800,h_600,c_fill,f_auto,q_auto/IMG_3303_wwwjrr.heic',
    'https://res.cloudinary.com/ddjopmdsi/image/upload/w_800,h_600,c_fill,f_auto,q_auto/IMG_0035_zqv0pk.heic'
  ]);

  const [sealedWithYes] = useState([
    'https://res.cloudinary.com/ddjopmdsi/image/upload/v1757247836/sealed-with-yes_4_s9j77l.jpg',
    'https://res.cloudinary.com/ddjopmdsi/image/upload/v1757247830/sealed-with-yes_3_rtgb5f.jpg',
    'https://res.cloudinary.com/ddjopmdsi/image/upload/v1757247827/sealed-with-yes_2_af2k6b.jpg',
    'https://res.cloudinary.com/ddjopmdsi/image/upload/v1757247832/sealed-with-yes_5_shr7ls.jpg',
    'https://res.cloudinary.com/ddjopmdsi/image/upload/v1757247829/sealed-with-yes_1_nuz34i.jpg'
  ]);
  const [currentSealedWhitYesIndex, setCurrentSealedWhitYesIndex] = useState(0);
  const [currentHowWeMetIndex, setCurrentHowWeMetIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0])); // Pre-load first image
  const [imageLoading, setImageLoading] = useState(false);

  // Countdown state
  const [countdown, setCountdown] = useState({
    months: '00',
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  });
  const [isClient, setIsClient] = useState(false);

  // Tab is initialized by TabInitializer inside Suspense

  // Client-side detection
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Preload next image when current changes
  useEffect(() => {
    const preloadNextImage = (index: number) => {
      if (!loadedImages.has(index)) {
        const img = new window.Image();
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, index]));
        };
        img.src = howWeMetImages[index];
      }
    };

    // Preload current and next image
    preloadNextImage(currentHowWeMetIndex);
    preloadNextImage((currentHowWeMetIndex + 1) % howWeMetImages.length);
  }, [currentHowWeMetIndex, howWeMetImages, loadedImages]);

  // Preload all images on component mount
  useEffect(() => {
    howWeMetImages.forEach((_, index) => {
      if (!loadedImages.has(index)) {
        const img = new window.Image();
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, index]));
        };
        img.src = howWeMetImages[index];
      }
    });
    sealedWithYes.forEach((_, index) => {
      if (!loadedImages.has(index)) {
        const img = new window.Image();
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, index]));
        };
        img.src = sealedWithYes[index];
      }
    });
  }, [howWeMetImages, loadedImages, sealedWithYes]);

  // How We Met carousel auto-advance
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHowWeMetIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % howWeMetImages.length;
        // Only advance if next image is loaded
        if (loadedImages.has(nextIndex)) {
          return nextIndex;
        }
        return prevIndex; // Stay on current if next isn't ready
      });
    }, 6000); // Change image every 6 seconds (increased for better UX with smooth transitions)

    return () => clearInterval(interval);
  }, [howWeMetImages.length, loadedImages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSealedWhitYesIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % sealedWithYes.length;
        return nextIndex;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [sealedWithYes.length, loadedImages]);

  // Handle image loading
  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = (index: number) => {
    console.error(`Failed to load image ${index}`);
    setImageLoading(false);
    // Try next image
    const nextIndex = (index + 1) % howWeMetImages.length;
    if (nextIndex !== index) {
      setCurrentHowWeMetIndex(nextIndex);
    }
  };

  // Countdown functionality
  useEffect(() => {
    if (!isClient) return;

    const weddingDate = new Date('January 16, 2026 14:00:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = weddingDate - now;

      if (distance > 0) {
        // Calculate months (approximate)
        const months = Math.floor(distance / (1000 * 60 * 60 * 24 * 30.44));
        const days = Math.floor((distance % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setCountdown({
          months: months.toString().padStart(2, '0'),
          days: days.toString().padStart(2, '0'),
          hours: hours.toString().padStart(2, '0'),
          minutes: minutes.toString().padStart(2, '0'),
          seconds: seconds.toString().padStart(2, '0')
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isClient]);

  // Fetch albums when photos tab becomes active
  useEffect(() => {
    if (activeTab === 'photos') {
      fetchAlbums();
    }
  }, [activeTab]);

  // Close mobile menu when clicking outside or scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (showMobileMenu) {
        setShowMobileMenu(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showMobileMenu && !target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      window.addEventListener('scroll', handleScroll);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMobileMenu]);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const response = await albumsAPI.getAll();
      setAlbums(response.albums);
    } catch (error: any) {
      toast.error('Failed to load albums');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbumMedia = async (albumId: string) => {
    try {
      const response = await albumsAPI.getById(albumId, {});
      console.log('Album media response:', response);
      setAlbumMedia(response.media || []);
    } catch (error: any) {
      toast.error('Failed to load album media');
    }
  };

  const handleAlbumSelect = (album: Album) => {
    setSelectedAlbum(album);
    fetchAlbumMedia(album._id);
  };


  const openViewer = (media: Media) => {
    setSelectedMedia(media);
    setShowViewer(true);
  };

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'story', label: 'Our Story', icon: BookOpen },
    { id: 'photos', label: 'Photos', icon: CameraIcon },
    { id: 'timeline', label: 'Wedding Timeline', icon: Calendar }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
              className="relative h-[70vh] w-full flex flex-col overflow-hidden"
            >
              {/* Background Image */}
              <div className="absolute inset-0 bg-gray-100">
                <img
                  src="hero.jpg"
                  alt="Wedding Hero"
                  className="w-full h-full object-cover !brightness-50"
                 
                  onLoad={(e) => {
                    console.log('Hero image loaded successfully');
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.opacity = '1';
                  }}
                  onError={(e) => {
                    console.error('Failed to load hero image');
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.backgroundColor = '#f3f4f6';
                  }}
                />
              </div>

              {/* Hero Content */}
              <div className="relative z-10 flex-1 flex items-center justify-center text-center px-4">
                <div className="max-w-4xl mx-auto text-white">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-6xl md:text-8xl font-light mb-4 tracking-wide font-dancing-script"
                    style={{
                      textShadow: `
                        0px 2px 4px rgba(139, 69, 19, 0.3),
                        0px 4px 8px rgba(101, 67, 33, 0.2),
                        0px 8px 16px rgba(62, 39, 35, 0.1),
                        1px 1px 2px rgba(0, 0, 0, 0.4)
                      `
                    }}
                  >
                    MJ + Erica
                  </motion.h1>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="space-y-2 mb-6"
                    style={{
                      textShadow: `
                        0px 1px 2px rgba(101, 67, 33, 0.4),
                        0px 2px 4px rgba(62, 39, 35, 0.3),
                        0px 4px 8px rgba(0, 0, 0, 0.2)
                      `
                    }}
                  >
                    <p className="text-xl md:text-2xl font-light">
                      January 16, 2026
                    </p>
                    <p className="text-lg md:text-xl font-light opacity-90">
                      Balayan, Batangas
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    className="text-lg md:text-xl font-light opacity-80"
                    style={{
                      textShadow: `
                        0px 1px 2px rgba(139, 69, 19, 0.3),
                        0px 2px 4px rgba(101, 67, 33, 0.2),
                        0px 4px 8px rgba(0, 0, 0, 0.1)
                      `
                    }}
                  >
                    Join us as we celebrate our love
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Countdown Section */}
            <div className="bg-white py-8 px-4">
              <div className="max-w-4xl mx-auto text-center">
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-4xl font-light text-[#cba397] mb-2">
                      {isClient ? countdown.months : '00'}
                    </div>
                    <div className="text-sm text-gray-600 uppercase tracking-wide">Months</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-light text-[#cba397] mb-2">
                      {isClient ? countdown.days : '00'}
                    </div>
                    <div className="text-sm text-gray-600 uppercase tracking-wide">Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-light text-[#cba397] mb-2">
                      {isClient ? countdown.hours : '00'}
                    </div>
                    <div className="text-sm text-gray-600 uppercase tracking-wide">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-light text-[#cba397] mb-2">
                      {isClient ? countdown.minutes : '00'}
                    </div>
                    <div className="text-sm text-gray-600 uppercase tracking-wide">Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-light text-[#cba397] mb-2">
                      {isClient ? countdown.seconds : '00'}
                    </div>
                    <div className="text-sm text-gray-600 uppercase tracking-wide">Seconds</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'story':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto px-4 py-8"
          >
            <div className="text-center mb-16">
              <h2 className="text-7xl font-light text-gray-900 mb-6 font-parisienne text-slate-blue">
                Our Love Story
              </h2>
              <div className="w-24 h-px bg-[#cba397] mx-auto mb-8"></div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
                Every love story is beautiful, but ours is our favorite.
                From our first meeting to this moment, every step has been magical.
              </p>
            </div>

            <div className="space-y-16">
              {/* How We Met */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="relative group"
                >
                  <div className="aspect-[4/3] rounded-2xl shadow-lg overflow-hidden">
                    <div className="w-full h-full relative">
                      {/* Loading indicator */}
                      <AnimatePresence>
                        {imageLoading && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="absolute inset-0 bg-gradient-to-br from-[#84a2be] to-[#cba397] flex items-center justify-center z-10"
                          >
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <AnimatePresence mode="wait">
                        {loadedImages.has(currentHowWeMetIndex) && (
                          <motion.img
                            key={currentHowWeMetIndex}
                            src={howWeMetImages[currentHowWeMetIndex]}
                            alt={`How We Met - Image ${currentHowWeMetIndex + 1}`}
                            className="w-full h-full object-cover absolute inset-0"
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "-100%", opacity: 0 }}
                            transition={{ 
                              duration: 0.8, 
                              ease: [0.25, 0.46, 0.45, 0.94] // Custom cubic-bezier for smooth ease
                            }}
                            onLoad={handleImageLoad}
                            onError={() => handleImageError(currentHowWeMetIndex)}
                          />
                        )}
                      </AnimatePresence>
                      
                      {/* Fallback placeholder */}
                      {!loadedImages.has(currentHowWeMetIndex) && !imageLoading && (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#84a2be] to-[#cba397] flex items-center justify-center">
                          <Heart className="text-white opacity-30" size={80} />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      
                      {/* Carousel Indicators */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {howWeMetImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              if (!imageLoading && index !== currentHowWeMetIndex && loadedImages.has(index)) {
                                setImageLoading(true);
                                setCurrentHowWeMetIndex(index);
                              }
                            }}
                            disabled={imageLoading || !loadedImages.has(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-500 ease-out ${
                              index === currentHowWeMetIndex 
                                ? 'bg-white scale-125' 
                                : loadedImages.has(index)
                                ? 'bg-white/50 hover:bg-white/75'
                                : 'bg-white/20 cursor-not-allowed'
                            } ${imageLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                        ))}
                      </div>

                      {/* Navigation Arrows */}
                      <button
                        onClick={() => {
                          if (!imageLoading) {
                            const prevIndex = currentHowWeMetIndex === 0 ? howWeMetImages.length - 1 : currentHowWeMetIndex - 1;
                            if (loadedImages.has(prevIndex)) {
                              setImageLoading(true);
                              setCurrentHowWeMetIndex(prevIndex);
                            }
                          }
                        }}
                        disabled={imageLoading || !loadedImages.has(currentHowWeMetIndex === 0 ? howWeMetImages.length - 1 : currentHowWeMetIndex - 1)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 hover:translate-x-1"
                        title="Previous image (slides right)"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (!imageLoading) {
                            const nextIndex = (currentHowWeMetIndex + 1) % howWeMetImages.length;
                            if (loadedImages.has(nextIndex)) {
                              setImageLoading(true);
                              setCurrentHowWeMetIndex(nextIndex);
                            }
                          }
                        }}
                        disabled={imageLoading || !loadedImages.has((currentHowWeMetIndex + 1) % howWeMetImages.length)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 hover:-translate-x-1"
                        title="Next image (slides left)"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="space-y-6"
                >
                  <h3 className="text-3xl font-light text-gray-900 mb-4">
                    How We Met
                  </h3>
                  <p className="text-gray-600 leading-relaxed font-light text-lg">
                    MJ, the adventurous soul, loved exploring and planning hikes, while Erica lived a quieter, more sheltered routine of home and school. From being schoolmates,
                    they became friends and eventually colleagues, sharing stories about family, friends, and even their love lives
                  </p>
                  <p className="text-gray-600 leading-relaxed font-light text-lg">
                    They built a bond that felt natural and genuine—two people who truly understood each other. Little did they know, God had already begun writing their love story as early as 2014,
                    and years later, in 2021, their friendship blossomed into something deeper, turning into the love story they continue to live today.
                  </p>
                </motion.div>
              </div>

              {/* The Proposal */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="relative group"
                >
                  <div className="aspect-[4/3] rounded-2xl shadow-lg overflow-hidden">
                    <div className="w-full h-full relative">
                      {/* Loading indicator */}
                      <AnimatePresence>
                        {imageLoading && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="absolute inset-0 bg-gradient-to-br from-[#84a2be] to-[#cba397] flex items-center justify-center z-10"
                          >
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <AnimatePresence mode="wait">
                        {loadedImages.has(currentSealedWhitYesIndex) && (
                          <motion.img
                            key={currentSealedWhitYesIndex}
                            src={sealedWithYes[currentSealedWhitYesIndex]}
                            alt={`How We Met - Image ${currentSealedWhitYesIndex + 1}`}
                            className="w-full h-full object-cover absolute inset-0"
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "-100%", opacity: 0 }}
                            transition={{ 
                              duration: 0.8, 
                              ease: [0.25, 0.46, 0.45, 0.94] // Custom cubic-bezier for smooth ease
                            }}
                            onLoad={handleImageLoad}
                            onError={() => handleImageError(currentSealedWhitYesIndex)}
                          />
                        )}
                      </AnimatePresence>
                      
                      {/* Fallback placeholder */}
                      {!loadedImages.has(currentSealedWhitYesIndex) && !imageLoading && (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#84a2be] to-[#cba397] flex items-center justify-center">
                          <Heart className="text-white opacity-30" size={80} />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      
                      {/* Carousel Indicators */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {sealedWithYes.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              if (!imageLoading && index !== currentSealedWhitYesIndex && loadedImages.has(index)) {
                                setImageLoading(true);
                                setCurrentSealedWhitYesIndex(index);
                              }
                            }}
                            disabled={imageLoading || !loadedImages.has(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-500 ease-out ${
                              index === currentSealedWhitYesIndex 
                                ? 'bg-white scale-125' 
                                : loadedImages.has(index)
                                ? 'bg-white/50 hover:bg-white/75'
                                : 'bg-white/20 cursor-not-allowed'
                            } ${imageLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                        ))}
                      </div>

                      {/* Navigation Arrows */}
                      <button
                        onClick={() => {
                          if (!imageLoading) {
                            const prevIndex = currentSealedWhitYesIndex === 0 ? sealedWithYes.length - 1 : currentSealedWhitYesIndex - 1;
                            if (loadedImages.has(prevIndex)) {
                              setImageLoading(true);
                              setCurrentSealedWhitYesIndex(prevIndex);
                            }
                          }
                        }}
                        disabled={imageLoading || !loadedImages.has(currentSealedWhitYesIndex === 0 ? sealedWithYes.length - 1 : currentSealedWhitYesIndex - 1)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 hover:translate-x-1"
                        title="Previous image (slides right)"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (!imageLoading) {
                            const nextIndex = (currentSealedWhitYesIndex + 1) % sealedWithYes.length;
                            if (loadedImages.has(nextIndex)) {
                              setImageLoading(true);
                              setCurrentSealedWhitYesIndex(nextIndex);
                            }
                          }
                        }}
                        disabled={imageLoading || !loadedImages.has((currentSealedWhitYesIndex + 1) % sealedWithYes.length)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 hover:-translate-x-1"
                        title="Next image (slides left)"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="space-y-6"
                >
                  <h3 className="text-3xl font-light text-gray-900 mb-4">
                    Sealed with a YES
                  </h3>
                  <p className="text-gray-600 leading-relaxed font-light text-lg">
                    It was an ordinary evening on November 30, 2023. Erica and MJ sharing dinner—MJ’s special adobo—while watching Ang Batang Quiapo. But little did Erica know, MJ had been quietly building up his courage.
                    With a nervous smile and a racing heart, MJ turned to Erica and asked the question that would change their lives forever: “Will you marry me?”

                  </p>
                  <p className="text-gray-600 leading-relaxed font-light text-lg">
                    Caught off guard, Erica’s first instinct was to ask, “Alam ba ’to ng magulang ko?” before laughter filled the room. Then, with happy tears and a heart full of love, she gave her sweetest answer: “Yes.”

                    From that simple night, their journey toward forever began. Now we can't wait to celebrate this next chapter with all of you!
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        );

      case 'photos':
        if (loading) {
          return (
            <div className="max-w-6xl mx-auto px-4 py-16 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cba397]"></div>
            </div>
          );
        }

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto px-4 py-8"
          >
            {!selectedAlbum ? (
              // Albums Grid View
              <>
                <div className="text-center mb-12">
                  <h2 className="text-7xl font-light text-gray-900 mb-6 font-parisienne text-slate-blue">
                    Wedding Albums
                  </h2>
                  <div className="w-24 h-px bg-[#cba397] mx-auto mb-8"></div>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
                    Browse photos and videos from our special day
                  </p>
                </div>

                {albums.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {albums.map((album) => (
                      <motion.div
                        key={album._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                        onClick={() => handleAlbumSelect(album)}
                      >
                        <div className="h-48 bg-gradient-to-br from-[#84a2be] from-opacity-20 to-[#cba397] to-opacity-20 flex items-center justify-center">
                          {album.coverImage ? (
                            <img
                              src={album.coverImage}
                              alt={album.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image className="text-[#cba397]" size={64} />
                          )}
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{album.name}</h3>
                          <p className="text-gray-600 text-sm mb-4">{album.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{album.mediaCount} {album.mediaCount === 1 ? 'item' : 'items'}</span>
                            {album.isFeatured && (
                              <span className="bg-[#cba397] bg-opacity-20 text-[#667c93] px-2 py-1 rounded-full text-xs">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Image className="text-gray-400 mx-auto mb-4" size={64} />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No albums yet</h3>
                    <p className="text-gray-500">Albums will appear here once they are created by the host.</p>
                  </div>
                )}
              </>
            ) : (
              // Album Media View
              <>
                <div className="mb-8">
                  <button
                    onClick={() => setSelectedAlbum(null)}
                    className="text-[#84a2be] hover:text-[#667c93] mb-2 flex items-center gap-2"
                  >
                    ← Back to Albums
                  </button>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedAlbum.name}</h2>
                  <p className="text-gray-600">{selectedAlbum.description}</p>
                </div>

                {albumMedia.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {albumMedia.map((media) => (
                      <motion.div
                        key={media._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        className="relative group cursor-pointer"
                        onClick={() => openViewer(media)}
                      >
                        {media.mediaType === 'image' ? (
                          <div
                            className="w-full rounded-lg overflow-hidden"
                            style={{
                              aspectRatio: '1/1',
                              minHeight: '200px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              position: 'relative'
                            }}
                          >
                            <img
                              src={media.thumbnailUrl || media.url}
                              alt={media.originalName}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                                backgroundColor: '#f9fafb',
                                opacity: '1',
                                visibility: 'visible',
                                filter: 'none',
                                transform: 'none',
                                position: 'relative',
                                zIndex: 1
                              }}
                              onError={(e) => {
                                console.error('Failed to load image:', media.url);
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.backgroundColor = '#dc2626';
                                target.style.border = '2px solid #dc2626';
                                target.alt = 'Image failed to load';
                              }}
                              onLoad={(e) => {
                                console.log('Image loaded successfully:', media.originalName);
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.backgroundColor = 'transparent';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="aspect-square w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center rounded-lg relative overflow-hidden">
                            <div className="w-full h-full relative">
                              <video
                                src={media.url}
                                className="w-full h-full object-cover rounded-lg"
                                preload="metadata"
                                muted
                                playsInline
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
                                <div className="bg-white bg-opacity-90 rounded-full p-3 shadow-lg">
                                  <Play className="text-blue-600" size={24} />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Eye className="text-white" size={24} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Image className="text-gray-400 mx-auto mb-4" size={64} />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No photos or videos yet</h3>
                    <p className="text-gray-500">Photos and videos will appear here once they are uploaded by guests.</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        );

      case 'timeline':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto px-4 py-8"
          >
            <div className="text-center mb-16">
              <h2 className="text-7xl font-light text-gray-900 mb-6 font-parisienne text-slate-blue">
                Wedding Timeline
              </h2>
              <div className="w-24 h-px bg-[#cba397] mx-auto mb-8"></div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
                Our special day's schedule and important moments
              </p>
            </div>

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
        );

      default:
        return null;
    }
  };

  return (
    <Suspense fallback={null}>
      <div className="min-h-screen bg-white">
        <Toaster position="top-center" />
        {/* Global Navbar - always visible */}
        <header className="bg-white sticky top-0 z-50 shadow-sm">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">

              </div>

              {/* Tab Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-light transition-all duration-300 ${activeTab === tab.id ? 'bg-[#cba397] text-white' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      <Icon size={20} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="mobile-menu-button text-gray-700 focus:outline-none"
                >
                  {showMobileMenu ? (
                    <X className="w-8 h-8" />
                  ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="mobile-menu md:hidden bg-white border-b border-gray-200 shadow-lg"
            >
              <div className="max-w-6xl mx-auto px-4 py-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setShowMobileMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 text-left ${activeTab === tab.id
                          ? 'bg-[#cba397] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        <Icon size={20} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initialize tab from URL on client */}
        <Suspense fallback={null}>
          <TabInitializer onInit={setActiveTab} />
        </Suspense>

        {/* Main Content */}
        <main>
          {renderTabContent()}
        </main>


        {/* Media Viewer */}
        <AnimatePresence>
          {showViewer && selectedMedia && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
              onClick={() => setShowViewer(false)}
            >
              <div className="relative max-w-4xl max-h-full">
                <button
                  onClick={() => setShowViewer(false)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                >
                  <X size={32} />
                </button>

                {selectedMedia.mediaType === 'image' ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.originalName}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <video
                    src={selectedMedia.url}
                    controls
                    className="max-w-full max-h-full"
                    autoPlay
                  />
                )}

                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm">{selectedMedia.originalName}</p>
                  {selectedMedia.uploadedBy && (
                    <p className="text-xs text-gray-300">By {selectedMedia.uploadedBy}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Performance Monitor */}
        <PerformanceMonitor />
      </div>
    </Suspense>
  );
}
