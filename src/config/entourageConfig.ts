// Configuration for the wedding entourage
// Complete entourage list for Mark Jayson & Erica Mae's wedding

export const ENTOURAGE_CONFIG = {
  // Best Man
  bestMan: {
    title: "Best Man",
    members: [
      { name: "Marvin Jeff De La Rea", role: "Best Man" }
    ]
  },

  // Parents
  parents: {
    title: "Parents",
    groomParents: {
      title: "Parents of the Groom",
      members: [
        { name: "Adriano De La Rea", role: "Father of the Groom" },
        { name: "Eliza De La Rea", role: "Mother of the Groom" }
      ]
    },
    brideParents: {
      title: "Parents of the Bride", 
      members: [
        { name: "Gilberth Pineda", role: "Father of the Bride" },
        { name: "Ma. Luisa Pineda", role: "Mother of the Bride" }
      ]
    }
  },

  // Principal Sponsors (Ninong & Ninang)
  principalSponsors: {
    title: "Principal Sponsors",
    ninong: {
      title: "Ninong",
      members: [
        { name: "Lito Punongbayan", number: 1 },
        { name: "Lito Palas", number: 2 },
        { name: "Emanuel Saldaña", number: 3 },
        { name: "Enrique Pagcaliwangan", number: 4 },
        { name: "Felix De La Rea", number: 5 },
        { name: "Rolando Quinag", number: 6 },
        { name: "Ramon Monteza", number: 7 },
        { name: "Nicolas Polliente", number: 8 },
        { name: "Kim De Villa", number: 9 },
        { name: "Tito Perigrino", number: 10 },
        { name: "Dominador Miguel", number: 11 },
        { name: "Felix Aguas Jr", number: 12 }
      ]
    },
    ninang: {
      title: "Ninang",
      members: [
        { name: "Remedios Punongbayan", number: 1 },
        { name: "Marilyn Palas", number: 2 },
        { name: "Janelle Saldaña", number: 3 },
        { name: "Daisy Pagcaliwangan", number: 4 },
        { name: "Christina De L Rea", number: 5 },
        { name: "Maricel Quinag", number: 6 },
        { name: "Imelda Monteza", number: 7 },
        { name: "Sonia Polliente", number: 8 },
        { name: "Irene De Villa", number: 9 },
        { name: "Florencia Perigrino", number: 10 },
        { name: "Emily Miguel", number: 11 },
        { name: "Merlita Aguas", number: 12 }
      ]
    }
  },

  // Secondary Sponsors
  secondarySponsors: {
    title: "Secondary Sponsors",
    candleIn: {
      title: "Candle (in)",
      members: [
        { name: "John Erick Pineda", role: "Male" },
        { name: "Jyn Sheeren Abellar", role: "Female" }
      ]
    },
    veil: {
      title: "Veil",
      members: [
        { name: "Aries De La Rea", role: "Male" },
        { name: "Paoline Creag", role: "Female" }
      ]
    },
    cord: {
      title: "Cord",
      members: [
        { name: "Jason Quinag", role: "Male" },
        { name: "Ruth Anne Vera", role: "Female" }
      ]
    },
    candleOut: {
      title: "Candle (out)",
      members: [
        { name: "Gene Mari Christopher De La Rea", role: "Male" },
        { name: "Shaira Ann Marquez", role: "Female" }
      ]
    },
    veil2: {
      title: "Veil",
      members: [
        { name: "Aljhon Gabriel Catitir", role: "Male" },
        { name: "Eries Veroya", role: "Female" }
      ]
    },
    cord2: {
      title: "Cord",
      members: [
        { name: "Morice James Buisan", role: "Male" },
        { name: "Rica Ella Cayanan", role: "Female" }
      ]
    }
  },

  // Wedding Party
  weddingParty: {
    title: "Groomsmen / Bridesmaid",
    groomsmen: {
      title: "Groomsmen",
      members: [
        { name: "Paul Melchor Aguda", number: 1 },
        { name: "Alexis De La Rea", number: 2 },
        { name: "John Matthew Benig", number: 3 }
      ]
    },
    bridesmaids: {
      title: "Bridesmaids",
      members: [
        { name: "Danica De La Rea", number: 1 },
        { name: "Evarose Marco", number: 2 },
        { name: "Alliyah Tañafranca", number: 3 }
      ]
    }
  },

  // Bearers
  bearers: {
    title: "Bearers",
    ring: {
      title: "Ring",
      members: [
        { name: "Liam Ramos", role: "Ring Bearer" }
      ]
    },
    arras: {
      title: "Arras and Coins",
      members: [
        { name: "Amiel Pineda", role: "Arras Bearer" }
      ]
    },
    bible: {
      title: "Bible",
      members: [
        { name: "Chase Arkmel Fariñas", role: "Bible Bearer" }
      ]
    }
  },

  // Flower Girls
  flowerGirls: {
    title: "Flower Girls",
    members: [
      { name: "Amaris Christelle Marquez", number: 1 },
      { name: "Ginn Elizsh Wyn Cebeda", number: 2 },
      { name: "Euliza Cheyenne Alinton", number: 3 },
      { name: "Zyrel Miñano", role: "Little Bride", number: 4 }
    ]
  },

  // Maid of Honor
  maidOfHonor: {
    title: "Maid of Honor",
    members: [
      { name: "Angelica Alday", role: "Maid of Honor" }
    ]
  },

  // Bride and Groom
  couple: {
    groom: {
      name: "Mark Jayson De La Rea",
      role: "Groom"
    },
    bride: {
      name: "Erica Mae Pineda", 
      role: "Bride"
    }
  }
};

// Display configuration
export const ENTOURAGE_DISPLAY_CONFIG = {
  // Show/hide sections
  showBestMan: true,
  showParents: true,
  showPrincipalSponsors: true,
  showSecondarySponsors: true,
  showWeddingParty: true,
  showBearers: true,
  showFlowerGirls: true,
  showMaidOfHonor: true,
  
  // Layout options
  principalSponsorsPerRow: 3, // Number of sponsors per row
  showSponsorNumbers: true, // Show sponsor numbers
  
  // Styling
  useAlternatingColors: true, // Alternate colors for different sections
  showDecorativeElements: true // Show decorative borders and flourishes
};

