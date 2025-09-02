// Configuration for rotating background images
// You can customize which images to display by modifying these arrays

export const BACKGROUND_IMAGE_CONFIG = {
  // Custom selection of wedding images (you can change these to any image names from weddingimgs)
  customWeddingImages: [
    'img1.jpg',   // First image
    'img3.jpg',   // Third image  
    'img5.jpg',   // Fifth image
    'img7.jpg'    // Seventh image
  ],
  
  // Alternative selections you can use:
  romanticImages: [
    'img2.jpg',
    'img4.jpg', 
    'img6.jpg',
    'img8.jpg'
  ],
  
  elegantImages: [
    'img9.jpg',
    'img11.jpg',
    'img16.jpg',
    'img15.jpg'
  ],
  
  // Venue images (from imgs folder)
  venueImages: [
    'reception.jpg',
    'church.jpg'
  ],
  
  // Mixed selection
  mixedImages: [
    'img1.jpg',
    'img3.jpg',
    'reception.jpg',
    'church.jpg'
  ]
};

// Current active configuration
export const ACTIVE_BACKGROUND_CONFIG = 'romanticImages';

// You can change this to any of the above configurations:
// - 'customWeddingImages'
// - 'romanticImages' 
// - 'elegantImages'
// - 'venueImages'
// - 'mixedImages'
// - Or set to null to use default first 4 images
