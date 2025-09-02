// Configuration for the wedding entourage
// Complete entourage list for Mark Jayson & Erica Mae's wedding

export const ENTOURAGE_CONFIG = {
  // Best Man
  bestMan: {
    title: "BEST MAN",
    members: [
      { name: "Marvin Jeff De La Rea", role: "Best Man" }
    ]
  },

  // Parents
  parents: {
    title: "PARENTS",
    groomParents: {
      title: "PARENTS OF THE GROOM",
      members: [
        { name: "Adriano De La Rea", role: "Father of the Groom" },
        { name: "Eliza De La Rea", role: "Mother of the Groom" }
      ]
    },
    brideParents: {
      title: "PARENTS OF THE BRIDE", 
      members: [
        { name: "Gilberth Pineda", role: "Father of the Bride" },
        { name: "Ma. Luisa Pineda", role: "Mother of the Bride" }
      ]
    }
  },

  // Principal Sponsors (Ninong & Ninang)
  principalSponsors: {
    title: "PRINCIPAL SPONSORS",
    ninong: {
      title: "NINONG",
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
      title: "NINANG",
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
    title: "SECONDARY SPONSORS",
    candleIn: {
      title: "CANDLE (in)",
      members: [
        { name: "John Erick Pineda", role: "Male" },
        { name: "Jyn Abellar", role: "Female" }
      ]
    },
    veil: {
      title: "VEIL",
      members: [
        { name: "Aries De La Rea", role: "Male" },
        { name: "Paoline Creag", role: "Female" }
      ]
    },
    cord: {
      title: "CORD",
      members: [
        { name: "Jason Quinag", role: "Male" },
        { name: "Ruth Vera", role: "Female" }
      ]
    },
    candleOut: {
      title: "CANDLE (out)",
      members: [
        { name: "Chris De La Rea", role: "Male" },
        { name: "Shaira Marquez", role: "Female" }
      ]
    },
    veil2: {
      title: "VEIL",
      members: [
        { name: "Aljon Catitir", role: "Male" },
        { name: "Eries Veroya", role: "Female" }
      ]
    },
    cord2: {
      title: "CORD",
      members: [
        { name: "Morice Buisan", role: "Male" },
        { name: "Rica Cayanan", role: "Female" }
      ]
    }
  },

  // Wedding Party
  weddingParty: {
    title: "GROOMSMEN / BRIDESMAID",
    groomsmen: {
      title: "GROOMSMEN",
      members: [
        { name: "Paul Aguda", number: 1 },
        { name: "Lukcy De La Rea", number: 2 },
        { name: "Matthew Benig", number: 3 }
      ]
    },
    bridesmaids: {
      title: "BRIDESMAIDS",
      members: [
        { name: "Danica De La Rea", number: 1 },
        { name: "Eva Rose Marco", number: 2 },
        { name: "Alliya Tañafranca", number: 3 }
      ]
    }
  },

  // Bearers
  bearers: {
    title: "BEARERS",
    ring: {
      title: "RING",
      members: [
        { name: "Liam Ramos", role: "Ring Bearer" }
      ]
    },
    arras: {
      title: "ARRAS AND COINS",
      members: [
        { name: "Amiel Pineda", role: "Arras Bearer" }
      ]
    },
    bible: {
      title: "BIBLE",
      members: [
        { name: "Chase Arkmel Fariñas", role: "Bible Bearer" }
      ]
    }
  },

  // Flower Girls
  flowerGirls: {
    title: "FLOWER GIRLS",
    members: [
      { name: "Amaris Christelle Marquez", number: 1 },
      { name: "Ginn Elizsh Wyn Cebeda", number: 2 },
      { name: "Euliza Cheyenne Alinton", number: 3 },
      { name: "Zyrel Miñano", role: "Little Bride", number: 4 }
    ]
  },

  // Maid of Honor
  maidOfHonor: {
    title: "MAID OF HONOR",
    members: [
      { name: "Angelica Alday", role: "Maid of Honor" }
    ]
  },

  // Bride and Groom
  couple: {
    groom: {
      name: "Mark Jayson De La Rea",
      role: "GROOM"
    },
    bride: {
      name: "Erica Mae Pineda", 
      role: "BRIDE"
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

