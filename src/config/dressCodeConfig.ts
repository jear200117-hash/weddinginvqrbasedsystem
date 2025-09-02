// Configuration for the wedding dress code
// Complete dress code requirements for Mark Jayson & Erica Mae's wedding

export const DRESS_CODE_CONFIG = {
  // Main dress code title
  title: "DRESS CODE",
  subtitle: "Formal / Semi-Formal",
  
  // Color palette
  colors: {
    sageGreen: "#5C5A47",
    dustyBlue: "#7C8E9E", 
    lightDustyBlue: "#98AEC2",
    pink: "#D1ABA1",
    lightPink: "#EBCEC9"
  },
  
  // Specific requirements by role
  requirements: {
    ninong: {
      title: "NINONG",
      description: "Black suit with dark sage green neck tie",
      color: "#5C5A47"
    },
    ninang: {
      title: "NINANG", 
      description: "Shades of dark sage green",
      color: "#5C5A47"
    },
    guests: {
      title: "GUESTS",
      description: "Dusty blue and dusty pink",
      colors: ["#7C8E9E", "#D1ABA1"]
    }
  },
  
  // General guidelines
  guidelines: {
    allowed: [
      "Formal attire",
      "Semi-formal attire",
      "Minimal prints allowed"
    ],
    notAllowed: [
      "Denim",
      "Ripped clothing",
      "Prints (except minimal)",
      "Color white"
    ]
  },
  
  // Additional notes
  notes: [
    "Please dress appropriately for this special occasion",
    "We appreciate your cooperation in following the dress code"
  ]
};

// Display configuration
export const DRESS_CODE_DISPLAY_CONFIG = {
  // Show/hide sections
  showColorPalette: true,
  showRoleRequirements: true,
  showGuidelines: true,
  showNotes: true,
  
  // Layout options
  useColorSwatches: true, // Show color swatches
  showColorCodes: true, // Display hex color codes
  
  // Styling
  useElegantLayout: true,
  showDecorativeElements: true
};
