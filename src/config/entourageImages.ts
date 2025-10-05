// Configuration for the 3 images above the entourage section
// You can customize which 3 images to display

export const ENTOURAGE_IMAGES_CONFIG = {
  // Default selection (first 3 wedding images)
  defaultEntourage: [
    'img1.jpg',
    'img2.jpg', 
    'img3.jpg'
  ],
  
  // Romantic selection
  romanticEntourage: [
    'img2.jpg',
    'img4.jpg',
    'img6.jpg'
  ],
  
  // Elegant selection
  elegantEntourage: [
    'img9.jpg',
    'img11.jpg',
    'img13.jpg'
  ],
  
  // Mixed selection (wedding + venue)
  mixedEntourage: [
    'img1.jpg',
    'reception.jpg',
    'img3.jpg'
  ],
  
  // Special moments selection
  specialMoments: [
    'img5.jpg',  // Engagement
    'img7.jpg',  // Wedding prep
    'img9.jpg'   // Wedding day
  ],

  // Unique selection (no conflicts with other sections)
  uniqueSelection: [
    'img21.jpg',  // Unique moment
    'img29.jpg', // Unique moment
    'img18.jpg'  // Unique moment
  ]
};

// Current active configuration
export const ACTIVE_ENTOURAGE_CONFIG = 'uniqueSelection';

// You can change this to any of the above configurations:
// - 'defaultEntourage'
// - 'romanticEntourage'
// - 'elegantEntourage'
// - 'mixedEntourage'
// - 'specialMoments'
