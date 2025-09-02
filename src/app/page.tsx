'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mail, Image, Users, ArrowRight, Calendar, MapPin, Clock, Camera, BookOpen, Gift, Music, Utensils, Home, User, Camera as CameraIcon, Users as UsersIcon, MapPin as MapPinIcon, Clock as ClockIcon, X, Plus, Upload, Eye, Play, Download } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
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

export default function HomePage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('home');
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);
  
  // Album functionality state
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumMedia, setAlbumMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    guestName: '',
    files: [] as File[]
  });
  const [createAlbumForm, setCreateAlbumForm] = useState({
    name: '',
    description: '',
    guestEmail: '',
    coverImage: undefined as string | undefined
  });
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Check for tab parameter in URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['home', 'story', 'photos', 'timeline'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Countdown functionality
  useEffect(() => {
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

        const monthsElement = document.getElementById('months');
        const daysElement = document.getElementById('days');
        const hoursElement = document.getElementById('hours');
        const minutesElement = document.getElementById('minutes');
        const secondsElement = document.getElementById('seconds');

        if (monthsElement) monthsElement.textContent = months.toString().padStart(2, '0');
        if (daysElement) daysElement.textContent = days.toString().padStart(2, '0');
        if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
        if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
        if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setUploadForm({ ...uploadForm, files: filesArray });
    }
  };

  const handleUpload = async () => {
    if (!selectedAlbum || !uploadForm.guestName.trim() || uploadForm.files.length === 0) {
      toast.error('Please fill in all fields and select files');
      return;
    }

    setUploading(true);
    try {
      const fileList = Object.assign(uploadForm.files, {
        length: uploadForm.files.length,
        item: (index: number) => uploadForm.files[index]
      }) as FileList;
      
      const response = await mediaAPI.upload(selectedAlbum._id, fileList, uploadForm.guestName);
      
      if (response.media && Array.isArray(response.media)) {
        const newMedia = response.media.map((media: any) => ({
          ...media,
          _id: media._id || `temp-${Date.now()}-${Math.random()}`,
          createdAt: new Date().toISOString(),
          uploadedBy: uploadForm.guestName
        }));
        
        setAlbumMedia(prev => [...newMedia, ...prev]);
        
        setAlbums(prev => prev.map(album => 
          album._id === selectedAlbum._id 
            ? { ...album, mediaCount: (album.mediaCount || 0) + newMedia.length }
            : album
        ));
      }
      
      toast.success('Media uploaded successfully!');
      setShowUploadModal(false);
      setUploadForm({ guestName: '', files: [] });
      
      setTimeout(() => {
        fetchAlbumMedia(selectedAlbum._id);
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!createAlbumForm.name.trim() || !createAlbumForm.guestEmail.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createAlbumForm.guestEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check if coverImage is too large (base64 images can be very large)
    let coverImageToSend = createAlbumForm.coverImage;
    if (coverImageToSend && coverImageToSend.length > 1000000) { // 1MB limit for base64
      console.warn('Cover image too large, removing from request');
      coverImageToSend = undefined;
      toast.error('Cover image is too large. Please choose a smaller image.');
      return;
    }

    const albumData = {
      name: createAlbumForm.name,
      description: createAlbumForm.description,
      isPublic: true,
      guestEmail: createAlbumForm.guestEmail,
      ...(coverImageToSend && { coverImage: coverImageToSend })
    };



    try {
      await albumsAPI.createGuest(albumData);
      
      toast.success('Album created successfully! It will be reviewed before publishing.');
      setShowCreateAlbumModal(false);
      setCreateAlbumForm({ name: '', description: '', guestEmail: '', coverImage: undefined });
      fetchAlbums();
    } catch (error: any) {
      // Show specific validation errors if available
      let errorMessage = 'Failed to create album';
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        const firstError = error.response.data.errors[0];
        errorMessage = firstError.msg || firstError.message || firstError;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    }
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
                  className="w-full h-full object-cover"
                  style={{
                    display: 'block',
                    opacity: '1',
                    visibility: 'visible',
                    filter: 'none',
                    transform: 'none',
                    position: 'relative',
                    zIndex: 1
                  }}
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
                {/* Overlay for text readability */}
                <div className="absolute inset-0 bg-black bg-opacity-60"></div>
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
                    <div className="text-4xl font-light text-[#cba397] mb-2" id="months">00</div>
                    <div className="text-sm text-gray-600 uppercase tracking-wide">Months</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-light text-[#cba397] mb-2" id="days">00</div>
                    <div className="text-sm text-gray-600 uppercase tracking-wide">Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-light text-[#cba397] mb-2" id="hours">00</div>
                    <div className="text-sm text-gray-600 uppercase tracking-wide">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-light text-[#cba397] mb-2" id="minutes">00</div>
                    <div className="text-sm text-gray-600 uppercase tracking-wide">Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-light text-[#cba397] mb-2" id="seconds">00</div>
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
              <h2 className="text-5xl font-light text-gray-900 mb-6 tracking-wide">
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
                  className="relative"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-[#84a2be] to-[#cba397] rounded-2xl shadow-lg overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="text-white opacity-30" size={80} />
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
                    Our paths crossed on a beautiful spring day in 2020. What started as a chance meeting 
                    at a local coffee shop turned into hours of conversation and endless laughter.
                  </p>
                  <p className="text-gray-600 leading-relaxed font-light text-lg">
                    From that first moment, we knew there was something special between us. 
                    The connection was instant, and our friendship blossomed into something beautiful.
                  </p>
                </motion.div>
              </div>

              {/* Our Journey */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="space-y-6 md:order-2"
                >
                  <h3 className="text-3xl font-light text-gray-900 mb-4">
                    Our Journey
                  </h3>
                  <p className="text-gray-600 leading-relaxed font-light text-lg">
                    Through adventures around the world, quiet nights at home, and everything in between, 
                    we've built a love that grows stronger every day.
                  </p>
                  <p className="text-gray-600 leading-relaxed font-light text-lg">
                    We've supported each other through challenges, celebrated each other's successes, 
                    and created countless memories that we'll treasure forever.
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="relative md:order-1"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-[#cba397] to-[#8e9180] rounded-2xl shadow-lg overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="text-white opacity-30" size={80} />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* The Proposal */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="relative"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-[#667c93] to-[#84a2be] rounded-2xl shadow-lg overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center">
                      <Gift className="text-white opacity-30" size={80} />
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
                    The Proposal
                  </h3>
                  <p className="text-gray-600 leading-relaxed font-light text-lg">
                    On a perfect evening in December 2024, surrounded by twinkling lights and the magic 
                    of the season, MJ asked the most important question of our lives.
                  </p>
                  <p className="text-gray-600 leading-relaxed font-light text-lg">
                    With tears of joy and hearts full of love, we said yes to forever. 
                    Now we can't wait to celebrate this next chapter with all of you!
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
                  <h2 className="text-5xl font-light text-gray-900 mb-6 tracking-wide">
                    Wedding Albums
                  </h2>
                  <div className="w-24 h-px bg-[#cba397] mx-auto mb-8"></div>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light mb-6">
                    Share your photos and videos from our special day
                  </p>
                  
                  <button
                    onClick={() => setShowCreateAlbumModal(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#667c93] to-[#84a2be] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    <Plus size={20} />
                    Create Your Album
                  </button>
                  
                  <p className="text-sm text-gray-500 mt-3">
                    Create a new album and it will be reviewed by the host before publishing
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
                    <p className="text-gray-500 mb-6">Be the first to create an album and share your memories!</p>
                    <button
                      onClick={() => setShowCreateAlbumModal(true)}
                      className="bg-gradient-to-r from-[#667c93] to-[#84a2be] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                    >
                      Create First Album
                    </button>
                  </div>
                )}
              </>
            ) : (
              // Album Media View
              <>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <button
                      onClick={() => setSelectedAlbum(null)}
                      className="text-[#84a2be] hover:text-[#667c93] mb-2 flex items-center gap-2"
                    >
                      ← Back to Albums
                    </button>
                    <h2 className="text-3xl font-bold text-gray-900">{selectedAlbum.name}</h2>
                    <p className="text-gray-600">{selectedAlbum.description}</p>
                  </div>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-gradient-to-r from-[#667c93] to-[#84a2be] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  >
                    <Upload size={20} />
                    Upload Photo/Video
                  </button>
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
                    <p className="text-gray-500 mb-6">Be the first to share memories from this album!</p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="bg-gradient-to-r from-[#667c93] to-[#84a2be] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                    >
                      Upload First Photo/Video
                    </button>
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
              <h2 className="text-5xl font-light text-gray-900 mb-6 tracking-wide">
                Wedding Timeline
              </h2>
              <div className="w-24 h-px bg-[#cba397] mx-auto mb-8"></div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
                Our special day's schedule and important moments
              </p>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-[#cba397]"></div>
              
              <div className="space-y-12">
                {[
                  { 
                    time: '2:00 PM', 
                    event: 'Ceremony Begins', 
                    description: 'Join us as we say "I do" in our beautiful venue',
                    icon: Heart
                  },
                  { 
                    time: '3:00 PM', 
                    event: 'Cocktail Hour', 
                    description: 'Celebrate with drinks and appetizers while we take photos',
                    icon: Gift
                  },
                  { 
                    time: '5:00 PM', 
                    event: 'Reception Dinner', 
                    description: 'Enjoy a delicious meal with family and friends',
                    icon: Utensils
                  },
                  { 
                    time: '7:00 PM', 
                    event: 'First Dance', 
                    description: 'Watch our first dance as husband and wife',
                    icon: Music
                  },
                  { 
                    time: '8:00 PM', 
                    event: 'Dancing & Celebration', 
                    description: 'Dance the night away and create unforgettable memories',
                    icon: Camera
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative flex items-start gap-6"
                  >
                    {/* Timeline Dot */}
                    <div className="w-16 h-16 bg-[#cba397] rounded-full flex items-center justify-center shadow-lg">
                      <item.icon className="text-white" size={24} />
                    </div>
                    
                    {/* Event Content */}
                    <div className="flex-1 bg-white rounded-lg shadow-md p-6 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">{item.event}</h3>
                        <span className="text-[#cba397] font-medium text-lg">{item.time}</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{item.description}</p>
                    </div>
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
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 text-left ${
                        activeTab === tab.id 
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

      {/* Main Content */}
      <main>
        {renderTabContent()}
      </main>

      {/* Create Album Modal */}
      <AnimatePresence>
        {showCreateAlbumModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Create New Album</h3>
                <button
                  onClick={() => setShowCreateAlbumModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Album Name *
                  </label>
                  <input
                    type="text"
                    value={createAlbumForm.name}
                    onChange={(e) => setCreateAlbumForm({...createAlbumForm, name: e.target.value})}
                    placeholder="Enter album name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={createAlbumForm.description}
                    onChange={(e) => setCreateAlbumForm({...createAlbumForm, description: e.target.value})}
                    placeholder="Describe your album (optional)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    value={createAlbumForm.guestEmail}
                    onChange={(e) => setCreateAlbumForm({...createAlbumForm, guestEmail: e.target.value})}
                    placeholder="Enter your email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Photo (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#84a2be] transition-colors">
                    {createAlbumForm.coverImage ? (
                      <div className="space-y-2">
                        <img 
                          src={createAlbumForm.coverImage} 
                          alt="Cover preview" 
                          className="w-24 h-24 object-cover rounded-lg mx-auto"
                        />
                        <button
                          type="button"
                          onClick={() => setCreateAlbumForm({...createAlbumForm, coverImage: undefined})}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="mx-auto text-gray-400" size={24} />
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="text-[#84a2be] font-medium">Click to upload</span> cover photo
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setCreateAlbumForm({...createAlbumForm, coverImage: e.target?.result as string});
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id="guest-cover-photo-upload"
                        />
                        <label 
                          htmlFor="guest-cover-photo-upload"
                          className="cursor-pointer inline-block px-4 py-2 bg-[#84a2be] bg-opacity-20 text-[#667c93] rounded-lg hover:bg-[#84a2be] hover:bg-opacity-30 transition-colors text-sm font-medium"
                        >
                          Choose File
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateAlbumModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAlbum}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#667c93] to-[#84a2be] text-white rounded-lg hover:shadow-lg"
                >
                  Create Album
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Upload Photo/Video</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.guestName}
                    onChange={(e) => setUploadForm({...uploadForm, guestName: e.target.value})}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Files *
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported: JPG, PNG, GIF, MP4, MOV (Max 50MB per file)
                  </p>
                </div>

                {uploadForm.files.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-700 mb-2">Selected files:</p>
                    <div className="space-y-1">
                      {uploadForm.files.map((file, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#667c93] to-[#84a2be] text-white rounded-lg hover:shadow-lg disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
  );
}
