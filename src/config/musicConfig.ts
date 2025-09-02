// Configuration for background music
// IMPORTANT: Only use music you have proper rights/licensing for

export const MUSIC_CONFIG = {
  // Option 1: Royalty-free music (RECOMMENDED)
  royaltyFree: {
    // Use royalty-free music from sites like:
    // - Pixabay Music (free)
    // - Free Music Archive (free)
    // - Bensound (free with attribution)
    // - PremiumBeat (paid)
    // - Artlist (paid)
    
    // Example with a romantic royalty-free track
    musicUrl: "/music/romantic-background.mp3", // Upload to public/music folder
    title: "Romantic Wedding Music",
    artist: "Royalty Free Music",
    autoPlay: true,
    loop: true,
    volume: 0.3
  },
  
  // Option 2: User's own music (if they have rights)
  customMusic: {
    // Only use if you own the rights or have written permission
    musicUrl: "/music/custom-wedding-song.mp3",
    title: "Our Wedding Song",
    artist: "Custom Artist",
    autoPlay: true,
    loop: true,
    volume: 0.3
  },
  
  // Option 3: "That Part" Instrumental (SAFER - No Lyrics)
  thatPartInstrumental: {
    // ✅ SAFER: Instrumental version has fewer copyright concerns
    // Still check licensing requirements for instrumental covers
    musicUrl: "/music/that-part-instrumental.mp3", // Upload instrumental version
    title: "That Part (Instrumental)",
    artist: "Lauren Smith - Instrumental Cover",
    autoPlay: false, // User must click to start
    loop: true,
    volume: 0.3
  },
  
  // Option 4: "That Part" by Lauren Smith (COPYRIGHT RISK)
  thatPart: {
    // ⚠️ COPYRIGHT WARNING: This song is copyrighted by Lauren Smith
    // Using this without permission violates copyright law
    // You are responsible for any legal consequences
    musicUrl: "/music/that-part-lauren-smith.mp3", // You must own this file legally
    title: "That Part",
    artist: "Lauren Smith",
    autoPlay: false, // Set to false to reduce legal risk
    loop: true,
    volume: 0.3
  },
  
  // Option 5: No auto-play (SAFEST)
  noAutoPlay: {
    musicUrl: "",
    title: "No Background Music",
    artist: "",
    autoPlay: false,
    loop: false,
    volume: 0
  },
  
  // Option 6: User-controlled music player
  userControlled: {
    musicUrl: "/music/romantic-background.mp3",
    title: "Background Music (Click to Play)",
    artist: "Royalty Free Music",
    autoPlay: false, // User must click to start
    loop: true,
    volume: 0.3
  }
};

// Current active music configuration
export const ACTIVE_MUSIC_CONFIG = 'thatPartInstrumental';

// You can change this to:
// - 'royaltyFree' - Use royalty-free music (RECOMMENDED)
// - 'customMusic' - Use your own music (if you have rights)
// - 'thatPartInstrumental' - Use "That Part" instrumental (SAFER - No Lyrics)
// - 'thatPart' - Use "That Part" by Lauren Smith (COPYRIGHT RISK - USE AT YOUR OWN RISK)
// - 'noAutoPlay' - No background music (SAFEST)
// - 'userControlled' - User clicks to start music (BEST UX)

// LEGAL DISCLAIMER:
// - Only use music you have proper licensing for
// - Royalty-free music is the safest option
// - Auto-playing copyrighted music may violate copyright law
// - Consider user experience - many users prefer to control music themselves
// - Using "That Part" by Lauren Smith without permission violates copyright law
// - You are responsible for any legal consequences of using copyrighted music
