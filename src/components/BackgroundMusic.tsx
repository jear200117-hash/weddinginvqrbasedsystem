'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Music, Waves } from 'lucide-react';
import { MUSIC_CONFIG, ACTIVE_MUSIC_CONFIG } from '@/config/musicConfig';

export default function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [showControls, setShowControls] = useState(false);
  const [userConsent, setUserConsent] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const musicConfig = MUSIC_CONFIG[ACTIVE_MUSIC_CONFIG];

  useEffect(() => {
    if (!musicConfig.musicUrl) return;

    const audio = audioRef.current;
    if (!audio) return;

    // Set audio properties
    audio.src = musicConfig.musicUrl;
    audio.loop = musicConfig.loop;
    audio.volume = volume;

    // Handle audio events
    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setError(null);
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setError('Failed to load audio file');
      setIsLoading(false);
      setIsPlaying(false);
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [musicConfig.musicUrl, musicConfig.loop]);

  useEffect(() => {
    if (!audioRef.current) return;
    
    // Update volume without affecting playback
    const audio = audioRef.current;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Listen for external prompt to open controls or play
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ action?: 'play' | 'open' }>;
      setShowControls(true);
      if (custom.detail?.action === 'play') {
        // This is called from a user interaction (button click) so playback should be allowed
        togglePlay();
      }
    };
    window.addEventListener('open-music-controls', handler as EventListener);
    return () => window.removeEventListener('open-music-controls', handler as EventListener);
  }, []);

  // Auto-hide controls when playing
  useEffect(() => {
    if (isPlaying && showControls && !isHovering) {
      // Clear any existing timeout
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
      
      // Set new timeout to hide controls after 3 seconds
      hideControlsTimeout.current = setTimeout(() => {
        if (!isHovering) {
          setShowControls(false);
        }
      }, 3000);
    }

    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [isPlaying, showControls, isHovering]);

  const togglePlay = async () => {
    if (!userConsent) {
      setUserConsent(true);
    }

    const audio = audioRef.current;
    if (!audio) {
      setError('Audio element not found');
      return;
    }

    console.log('Toggle play - Current state:', { isPlaying, src: audio.src });

    try {
      if (isPlaying) {
        console.log('Pausing audio...');
        audio.pause();
        setIsPlaying(false);
      } else {
        console.log('Attempting to play audio...');
        setIsLoading(true);
        setError(null);
        
        // Only load if audio hasn't been loaded yet
        if (audio.readyState === 0) {
          console.log('Loading audio for first time...');
          audio.load();
        }
        
        // Modern browsers require user interaction for audio
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          console.log('Audio resumed/started playing successfully');
        }
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
      setError(`Failed to play: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
      setIsPlaying(false);
      // Fallback: show user they need to interact
      setShowControls(true);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(false);
  };

  const handleSeek = (newTime: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Don't render if no music is configured
  if (!musicConfig.musicUrl) {
    return null;
  }

      return (
    <>
      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        preload="metadata" 
        controls={false}
        crossOrigin="anonymous"
      />
      
      {/* Music Controls */}
      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
                          {/* Main Music Button */}
         <motion.button
           onClick={() => {
             // Always show controls when clicking the button
             setShowControls(true);
             togglePlay();
           }}
           className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
             isPlaying 
               ? 'bg-slate-blue text-white shadow-slate-blue/50' 
               : 'bg-white/90 backdrop-blur-sm text-slate-blue hover:bg-white'
           }`}
           whileHover={{ scale: 1.1 }}
           whileTap={{ scale: 0.95 }}
           onMouseEnter={() => {
             setIsHovering(true);
             setShowControls(true);
             // Clear any auto-hide timeout
             if (hideControlsTimeout.current) {
               clearTimeout(hideControlsTimeout.current);
             }
           }}
           onMouseLeave={() => {
             setIsHovering(false);
             // Delay hiding to allow moving to controls
             setTimeout(() => {
               if (!isHovering) {
                 setShowControls(false);
               }
             }, 200);
           }}
         >
           <AnimatePresence mode="wait">
             {isLoading ? (
               <motion.div
                 key="loading"
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.8 }}
                 className="flex items-center justify-center"
               >
                 <motion.div
                   animate={{ rotate: 360 }}
                   transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                 >
                   <Waves className="w-6 h-6" />
                 </motion.div>
               </motion.div>
             ) : isPlaying ? (
               <motion.div
                 key="playing"
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.8 }}
                 className="flex items-center justify-center"
               >
                 <motion.div
                   animate={{ 
                     scale: [1, 1.1, 1],
                     opacity: [1, 0.8, 1]
                   }}
                   transition={{ 
                     duration: 2, 
                     repeat: Infinity,
                     ease: "easeInOut"
                   }}
                 >
                   <Pause className="w-6 h-6" />
                 </motion.div>
               </motion.div>
             ) : (
               <motion.div
                 key="paused"
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.8 }}
               >
                 <Play className="w-6 h-6" />
               </motion.div>
             )}
           </AnimatePresence>
         </motion.button>

                 {/* Extended Controls */}
         <AnimatePresence>
           {showControls && (
             <motion.div
               className="absolute bottom-16 right-0 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-gray-200 min-w-48"
               initial={{ opacity: 0, y: 10, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, y: 10, scale: 0.95 }}
               transition={{ duration: 0.2 }}
               onMouseEnter={() => {
                 setIsHovering(true);
                 // Clear any auto-hide timeout
                 if (hideControlsTimeout.current) {
                   clearTimeout(hideControlsTimeout.current);
                 }
               }}
               onMouseLeave={() => {
                 setIsHovering(false);
                 setShowControls(false);
               }}
             >
                             {/* Song Info */}
               <div className="mb-3">
                 <h4 className="font-semibold text-slate-blue text-sm">
                   {musicConfig.title}
                 </h4>
                 <p className="text-xs text-gray-600">
                   {musicConfig.artist}
                 </p>
                 {error && (
                   <p className="text-xs text-red-500 mt-1">
                     {error}
                   </p>
                 )}
               </div>

               {/* Progress Bar */}
               {duration > 0 && (
                 <div className="mb-3">
                   <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                     <span>{formatTime(currentTime)}</span>
                     <span>/</span>
                     <span>{formatTime(duration)}</span>
                   </div>
                   <input
                     type="range"
                     min="0"
                     max={duration}
                     value={currentTime}
                     onChange={(e) => handleSeek(parseFloat(e.target.value))}
                     className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                   />
                 </div>
               )}

              {/* Volume Control */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={toggleMute}
                  className="text-gray-600 hover:text-slate-blue transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

                             {/* Play/Pause Button */}
               <button
                 onClick={togglePlay}
                 className="w-full px-3 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 transition-colors text-sm flex items-center justify-center gap-2"
               >
                 {isPlaying ? (
                   <>
                     <Pause className="w-4 h-4" />
                     Pause
                   </>
                 ) : (
                   <>
                     <Play className="w-4 h-4" />
                     Play
                   </>
                 )}
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* User Consent Modal (if needed) */}
      <AnimatePresence>
        {!userConsent && musicConfig.autoPlay && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-md mx-4 text-center"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <Music className="w-12 h-12 text-slate-blue mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-blue mb-2">
                Background Music
              </h3>
              <p className="text-gray-600 mb-4">
                Would you like to play background music while viewing the invitation?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setUserConsent(true);
                    togglePlay();
                  }}
                  className="px-6 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 transition-colors"
                >
                  Yes, Play Music
                </button>
                <button
                  onClick={() => setUserConsent(true)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  No Thanks
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
