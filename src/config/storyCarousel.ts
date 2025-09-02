// Configuration for story carousel images
// You can customize which 6 images to display in the story section

export const STORY_CAROUSEL_CONFIG = {
  // Default story images (first 6 wedding images)
  defaultStory: [
    'img1.jpg',
    'img2.jpg', 
    'img3.jpg',
    'img4.jpg',
    'img5.jpg',
    'img6.jpg'
  ],
  
  // Romantic story selection
  romanticStory: [
    'img2.jpg',
    'img4.jpg',
    'img6.jpg', 
    'img8.jpg',
    'img10.jpg',
    'img12.jpg'
  ],
  
  // Elegant story selection
  elegantStory: [
    'img9.jpg',
    'img11.jpg',
    'img13.jpg',
    'img15.jpg',
    'img16.jpg',
    'img14.jpg'
  ],
  
  // Mixed story selection (wedding + venue)
  mixedStory: [
    'img1.jpg',
    'img3.jpg',
    'img5.jpg',
    'img7.jpg',
    'reception.jpg',
    'church.jpg'
  ],
  
  // Journey story selection (progression through relationship)
  journeyStory: [
    'img1.jpg',  // First meeting
    'img3.jpg',  // Dating
    'img5.jpg',  // Engagement
    'img7.jpg',  // Wedding prep
    'img9.jpg',  // Wedding day
    'img11.jpg'  // Future together
  ]
};

// Current active story carousel configuration
export const ACTIVE_STORY_CONFIG = 'elegantStory';

// You can change this to any of the above configurations:
// - 'defaultStory'
// - 'romanticStory'
// - 'elegantStory' 
// - 'mixedStory'
// - 'journeyStory'
// - Or set to null to use default first 6 images
