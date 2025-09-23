'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mail, Image, Users, ArrowRight, Calendar, MapPin, Clock, Camera, BookOpen, Gift, Music, Utensils, Home, User, Camera as CameraIcon, Users as UsersIcon, MapPin as MapPinIcon, Clock as ClockIcon, X, Eye, Play, Download, Martini, Mic, Cake, Car, CheckSquare, Square, Check } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { albumsAPI, mediaAPI } from '@/lib/api';
import { usePublicAlbumsWithRealtime } from '@/lib/swrFirebase';
import { useMediaByAlbum } from '@/hooks/useFirebaseRealtime';
import { getBestDisplayUrl, getFullSizeDisplayUrl } from '@/lib/googleDriveUtils';
import toast, { Toaster } from 'react-hot-toast';

import { useLazyLoadMultipleImages } from '@/hooks/useLazyLoadWithPerformance';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

interface Album {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isFeatured: boolean;
  coverImage?: string;
  qrCode: string;
  createdAt: any;
  updatedAt: any;
}

interface Media {
  id: string;
  albumId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  isApproved: boolean;
  createdAt: any;
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
  // albumMedia is now handled by Firebase real-time hook
  const [loading, setLoading] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Download functionality state
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
  const howWeMetCache = useRef<Map<number, string>>(new Map());
  const sealedYesCache = useRef<Map<number, string>>(new Map());
  const [isLoadingHowWeMet, setIsLoadingHowWeMet] = useState(false);
  const [isLoadingSealedYes, setIsLoadingSealedYes] = useState(false);

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

  // Firebase real-time data
  const publicAlbums = usePublicAlbumsWithRealtime();
  const albumMedia = useMediaByAlbum(selectedAlbum?.id || '');

  // Helper to fetch and cache an image as blob URL
  const ensureCached = async (index: number, urls: string[], cache: React.MutableRefObject<Map<number, string>>) => {
    if (cache.current.has(index)) return;
    const url = urls[index];
    const res = await fetch(url, { cache: 'force-cache' });
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    cache.current.set(index, objectUrl);
  };

  // Navigation that waits for cache before switching frame
  const goToHowWeMet = async (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= howWeMetImages.length) return;
    setIsLoadingHowWeMet(true);
    try {
      await ensureCached(targetIndex, howWeMetImages, howWeMetCache);
      setCurrentHowWeMetIndex(targetIndex);
    } finally {
      setIsLoadingHowWeMet(false);
    }
  };

  const goToSealedYes = async (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= sealedWithYes.length) return;
    setIsLoadingSealedYes(true);
    try {
      await ensureCached(targetIndex, sealedWithYes, sealedYesCache);
      setCurrentSealedWhitYesIndex(targetIndex);
    } finally {
      setIsLoadingSealedYes(false);
    }
  };

  // Preload all images on mount and cleanup cached object URLs on unmount
  useEffect(() => {
    let cancelled = false;
    const preload = async () => {
      try {
        await Promise.all([
          ...howWeMetImages.map((_, i) => ensureCached(i, howWeMetImages, howWeMetCache)),
          ...sealedWithYes.map((_, i) => ensureCached(i, sealedWithYes, sealedYesCache))
        ]);
      } catch (_) {
        // ignore
      }
    };
    preload();
    return () => {
      cancelled = true;
      howWeMetCache.current.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
      sealedYesCache.current.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
      howWeMetCache.current.clear();
      sealedYesCache.current.clear();
    };
  }, [howWeMetImages, sealedWithYes]);

  // Auto-advance removed per request

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

  // Firebase real-time albums data
  useEffect(() => {
    if (publicAlbums.data && activeTab === 'photos' && !selectedAlbum) {
      setAlbums(publicAlbums.data);
    }
    if (activeTab === 'photos') {
      setLoading(publicAlbums.loading);
    }
  }, [publicAlbums.data, publicAlbums.loading, activeTab, selectedAlbum]);

  // Firebase real-time album media data is handled by the useMediaByAlbum hook

  // Firebase real-time listeners are handled by the hooks above
  // No need for Socket.IO subscriptions since we're using Firebase real-time

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
      // Media is now handled by Firebase real-time hook
    } catch (error: any) {
      toast.error('Failed to load album media');
    }
  };

  const handleAlbumSelect = (album: Album) => {
    setSelectedAlbum(album);
    fetchAlbumMedia(album.id);
  };


  const openViewer = (media: Media) => {
    setSelectedMedia(media);
    setShowViewer(true);
  };

  // Download functionality
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedMediaIds(new Set());
  };

  const toggleMediaSelection = (mediaId: string) => {
    setSelectedMediaIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mediaId)) {
        newSet.delete(mediaId);
      } else {
        newSet.add(mediaId);
      }
      return newSet;
    });
  };

  const selectAllMedia = () => {
    const allIds = new Set(albumMedia.data.map(media => media.id));
    setSelectedMediaIds(allIds);
  };

  const clearSelection = () => {
    setSelectedMediaIds(new Set());
  };

  const handleBulkDownload = async () => {
    if (selectedMediaIds.size === 0) return;

    setIsDownloading(true);
    try {
      const selectedMedia = albumMedia.data.filter(media => selectedMediaIds.has(media.id));

      // Use a different approach for multiple files - open each in a new tab
      if (selectedMedia.length === 1) {
        // Single file - direct download
        const media = selectedMedia[0];
        const downloadUrl = media.fileUrl;

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = media.fileName || 'download';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Multiple files - open each in a new tab to bypass popup blocker
        selectedMedia.forEach((media, index) => {
          const downloadUrl = media.fileUrl;

          // Open in new tab with a small delay to prevent blocking
          setTimeout(() => {
            window.open(downloadUrl, '_blank');
          }, index * 100);
        });
      }

      toast.success(`Downloaded ${selectedMediaIds.size} files`);
    } catch (error) {
      console.error('Bulk download error:', error);
      toast.error('Failed to download some files');
    } finally {
      setIsDownloading(false);
    }
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
                    <img
                      src="/imgs/monogram.png"
                      alt="MJ & Erica Monogram"
                      className="mx-auto w-40 md:w-56 h-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                    />
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
                    <p className="text-lg md:text-xl font-light opacity-90">
                      Tagaytay City, Cavite
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
                    Walk with us as we say 'I Do'and step into our forever.
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
                      {/* Image frame from cache or placeholder while loading */}
                      {howWeMetCache.current.has(currentHowWeMetIndex) ? (
                        <img
                          src={howWeMetCache.current.get(currentHowWeMetIndex)!}
                          alt={`How We Met - Image ${currentHowWeMetIndex + 1}`}
                          className="w-full h-full object-cover absolute inset-0"
                        />
                      ) : (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#84a2be] to-[#cba397] flex items-center justify-center">
                          <Heart className="text-white opacity-30" size={80} />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                      {/* Dots removed per request */}

                      {/* Navigation Arrows */}
                      <button
                        onClick={async () => {
                          if (isLoadingHowWeMet) return;
                          const prevIndex = currentHowWeMetIndex === 0 ? howWeMetImages.length - 1 : currentHowWeMetIndex - 1;
                          await goToHowWeMet(prevIndex);
                        }}
                        disabled={isLoadingHowWeMet}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 hover:translate-x-1"
                        title="Previous image (slides right)"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={async () => {
                          if (isLoadingHowWeMet) return;
                          const nextIndex = (currentHowWeMetIndex + 1) % howWeMetImages.length;
                          await goToHowWeMet(nextIndex);
                        }}
                        disabled={isLoadingHowWeMet}
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
                    When paths crossed
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
                      {/* Image frame from cache or placeholder while loading */}
                      {sealedYesCache.current.has(currentSealedWhitYesIndex) ? (
                        <img
                          src={sealedYesCache.current.get(currentSealedWhitYesIndex)!}
                          alt={`Sealed With a YES - Image ${currentSealedWhitYesIndex + 1}`}
                          className="w-full h-full object-cover absolute inset-0"
                        />
                      ) : (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#84a2be] to-[#cba397] flex items-center justify-center">
                          <Heart className="text-white opacity-30" size={80} />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                      {/* Dots removed per request */}

                      {/* Navigation Arrows */}
                      <button
                        onClick={async () => {
                          if (isLoadingSealedYes) return;
                          const prevIndex = currentSealedWhitYesIndex === 0 ? sealedWithYes.length - 1 : currentSealedWhitYesIndex - 1;
                          await goToSealedYes(prevIndex);
                        }}
                        disabled={isLoadingSealedYes}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 hover:translate-x-1"
                        title="Previous image (slides right)"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={async () => {
                          if (isLoadingSealedYes) return;
                          const nextIndex = (currentSealedWhitYesIndex + 1) % sealedWithYes.length;
                          await goToSealedYes(nextIndex);
                        }}
                        disabled={isLoadingSealedYes}
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
                  <>
                    {/* Featured Albums Section */}
                    {albums.filter(album => album.isFeatured).length > 0 && (
                      <div className="mb-16">
                        <div className="flex items-center mb-8">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#cba397]"></div>
                          <div className="px-6">
                            <h3 className="text-3xl font-light text-gray-900 font-parisienne text-slate-blue">
                              Featured Albums
                            </h3>
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#cba397]"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                          {albums.filter(album => album.isFeatured).map((album, index) => (
                            <motion.div
                              key={album.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ y: -8, scale: 1.02 }}
                              className="bg-white rounded-xl shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 border-[#cba397] border-opacity-30"
                              onClick={() => handleAlbumSelect(album)}
                            >
                              <div className="h-56 bg-gradient-to-br from-[#84a2be] from-opacity-20 to-[#cba397] to-opacity-20 flex items-center justify-center relative">
                                {album.coverImage ? (
                                  <img
                                    src={getBestDisplayUrl(album.coverImage, undefined, 400)}
                                    alt={album.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Image className="text-[#cba397]" size={72} />
                                )}
                                {/* Featured Badge */}
                                <div className="absolute top-4 right-4">
                                  <span className="bg-gradient-to-r from-[#cba397] to-[#667c93] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                                    ✨ Featured
                                  </span>
                                </div>
                              </div>
                              <div className="p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{album.name}</h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{album.description}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-500">Wedding Highlights</span>
                                  <div className="flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-[#cba397]" />
                                    <span className="text-xs text-[#667c93] font-medium">Must See</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Albums Section */}
                    {albums.filter(album => !album.isFeatured).length > 0 && (
                      <div>
                        <div className="flex items-center mb-8">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-300"></div>
                          <div className="px-6">
                            <h3 className="text-2xl font-light text-gray-700 font-parisienne">
                              All Albums
                            </h3>
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-300"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {albums.filter(album => !album.isFeatured).map((album, index) => (
                            <motion.div
                              key={album.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ y: -5 }}
                              className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                              onClick={() => handleAlbumSelect(album)}
                            >
                              <div className="h-48 bg-gradient-to-br from-[#84a2be] from-opacity-20 to-[#cba397] to-opacity-20 flex items-center justify-center">
                                {album.coverImage ? (
                                  <img
                                    src={getBestDisplayUrl(album.coverImage, undefined, 400)}
                                    alt={album.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Image className="text-[#cba397]" size={64} />
                                )}
                              </div>
                              <div className="p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{album.name}</h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{album.description}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-500">Album</span>
                                  <span className="text-xs text-gray-400">
                                    {(() => {
                                      try {
                                        const date = album.createdAt?.toDate ? album.createdAt.toDate() : new Date(album.createdAt);
                                        return date.toLocaleDateString();
                                      } catch (error) {
                                        return 'Recent';
                                      }
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show message if only featured albums exist */}
                    {albums.filter(album => !album.isFeatured).length === 0 && albums.filter(album => album.isFeatured).length > 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-sm">More albums coming soon...</p>
                      </div>
                    )}
                  </>
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
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setSelectedAlbum(null)}
                      className="text-[#84a2be] hover:text-[#667c93] flex items-center gap-2"
                    >
                      ← Back to Albums
                    </button>

                    {/* Selection Controls */}
                    {albumMedia.data.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleSelectionMode}
                          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isSelectionMode
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                          {isSelectionMode ? <CheckSquare size={16} /> : <Square size={16} />}
                          {isSelectionMode ? 'Exit Selection' : 'Select Photos'}
                        </button>

                        {isSelectionMode && (
                          <>
                            <button
                              onClick={selectAllMedia}
                              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                            >
                              Select All
                            </button>
                            <button
                              onClick={clearSelection}
                              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                            >
                              Clear
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900">{selectedAlbum.name}</h2>
                  <p className="text-gray-600">{selectedAlbum.description}</p>
                </div>

                {/* Download Action Controls */}
                {isSelectionMode && selectedMediaIds.size > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {selectedMediaIds.size} photos selected
                      </span>
                      <button
                        onClick={handleBulkDownload}
                        disabled={isDownloading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                  </div>
                )}

                {albumMedia.data.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {albumMedia.data.map((media) => (
                      <motion.div
                        key={media.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        className={`relative group ${isSelectionMode ? 'cursor-default' : 'cursor-pointer'}`}
                        onClick={() => isSelectionMode ? toggleMediaSelection(media.id) : openViewer(media)}
                      >
                        {media.fileType.startsWith('image/') ? (
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
                              src={getBestDisplayUrl(media.thumbnailUrl || media.fileUrl, undefined, 300)}
                              alt={media.fileName}
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
                                console.error('Failed to load image:', media.fileUrl);
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.backgroundColor = '#dc2626';
                                target.style.border = '2px solid #dc2626';
                                target.alt = 'Image failed to load';
                              }}
                              onLoad={(e) => {
                                console.log('Image loaded successfully:', media.fileName);
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.backgroundColor = 'transparent';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="aspect-square w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center rounded-lg relative overflow-hidden">
                            <div className="w-full h-full relative">
                              <video
                                src={media.fileUrl}
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

                        {/* Selection Checkbox */}
                        {isSelectionMode && (
                          <div className="absolute top-2 left-2 z-10">
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${selectedMediaIds.has(media.id)
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-300'
                              }`}>
                              {selectedMediaIds.has(media.id) && <Check size={16} />}
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
              <div className="relative w-full h-full flex items-center justify-center">
                <button
                  onClick={() => setShowViewer(false)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                >
                  <X size={32} />
                </button>

                {selectedMedia.fileType.startsWith('image/') ? (
                  <img
                    src={getFullSizeDisplayUrl(selectedMedia.fileUrl, undefined)}
                    alt={selectedMedia.fileName}
                    className="max-w-none max-h-none w-auto h-auto object-contain"
                    style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                  />
                ) : (
                  <video
                    src={selectedMedia.fileUrl}
                    controls
                    className="max-w-none max-h-none w-auto h-auto"
                    style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                    autoPlay
                  />
                )}

                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm">{selectedMedia.fileName}</p>
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
