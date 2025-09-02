// Configuration for the prenup video
// You can customize the video source and settings

export const VIDEO_CONFIG = {
  // Google Drive video configuration
  googleDrive: {
    // Your actual Google Drive video URL
    videoUrl: "https://drive.google.com/file/d/1CCCfrxwuICfiR1eEnMbWN-5rzxuL6lH7/view?ts=68b411b0&pli=1",
    
    // Alternative formats for better compatibility
    directUrl: "https://drive.google.com/uc?export=download&id=1CCCfrxwuICfiR1eEnMbWN-5rzxuL6lH7",
    
    // Embed URL for iframe
    embedUrl: "https://drive.google.com/file/d/1CCCfrxwuICfiR1eEnMbWN-5rzxuL6lH7/preview",
    
    // Video title
    title: "Our Prenup Video",
    
    // Video description
    description: "Watch our journey together and see how our love story began"
  },
  
  // YouTube configuration (fallback)
  youtube: {
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?si=example",
    title: "Our Prenup Video",
    description: "Watch our journey together and see how our love story began"
  },
  
  // Direct video file configuration
  directVideo: {
    videoUrl: "/videos/prenup-video.mp4", // If you upload video to public/videos folder
    title: "Our Prenup Video",
    description: "Watch our journey together and see how our love story began"
  }
};

// Current active video source
export const ACTIVE_VIDEO_SOURCE = 'googleDrive';

// You can change this to:
// - 'googleDrive' - Use Google Drive video
// - 'youtube' - Use YouTube video
// - 'directVideo' - Use direct video file

// Instructions for Google Drive setup:
// 1. Upload your prenup video to Google Drive
// 2. Right-click the video and select "Share"
// 3. Set to "Anyone with the link can view"
// 4. Copy the file ID from the URL
// 5. Replace YOUR_GOOGLE_DRIVE_FILE_ID in the config above
