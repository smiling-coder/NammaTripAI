/* =====================================================================
   NammaTrip AI - script.js

   HOW THIS FILE IS ORGANISED (read it top to bottom):
   1. DATA          destinations, start cities, planning assumptions
   2. TRANSLATIONS  every Kannada / English string
   3. ENGINE        pure functions (no DOM): validate, score, choose, cost.
                    You can test them in the browser console: NammaEngine
   4. UI            reads the form, calls the engine, draws the page

   IMPORTANT HONESTY NOTE
   The "AI" in the name refers to the planning idea. This prototype uses a
   transparent RULE-BASED engine that runs in the browser. It does not call
   any AI service, and it does not use live prices or live availability.
   ===================================================================== */
'use strict';

/* =====================================================================
   1. DATA
   ===================================================================== */

// The order matters: each destination's `interests` array follows this order.
const INTEREST_KEYS = ['heritage', 'temples', 'nature', 'waterfalls', 'food', 'wildlife',
  'beaches', 'adventure', 'photography', 'family', 'culture'];

// Places a traveller can start from (coordinates are approximate city centres).
const START_CITIES = [
  { id: 'bengaluru', en: 'Bengaluru', kn: 'ಬೆಂಗಳೂರು', lat: 12.9716, lng: 77.5946 },
  { id: 'mysuru', en: 'Mysuru', kn: 'ಮೈಸೂರು', lat: 12.2958, lng: 76.6394 },
  { id: 'mangaluru', en: 'Mangaluru', kn: 'ಮಂಗಳೂರು', lat: 12.9141, lng: 74.8560 },
  { id: 'hubballi', en: 'Hubballi-Dharwad', kn: 'ಹುಬ್ಬಳ್ಳಿ-ಧಾರವಾಡ', lat: 15.3647, lng: 75.1240 },
  { id: 'belagavi', en: 'Belagavi', kn: 'ಬೆಳಗಾವಿ', lat: 15.8497, lng: 74.4977 },
  { id: 'shivamogga', en: 'Shivamogga', kn: 'ಶಿವಮೊಗ್ಗ', lat: 13.9299, lng: 75.5681 }
];

/* Destination dataset.
   - interests: weight 0-3 for each key in INTEREST_KEYS (an editorial judgement by the team).
   - cost: [low, high] planning ranges in INR. stay = per ROOM per night,
           food and act = per PERSON per day. These are TEAM ASSUMPTIONS, not live prices.
   - access: easy | moderate | demanding (an editorial estimate, not an official rating).
   - official: only filled where we are confident of a stable official page. */
const DESTINATIONS = [
  {
    id: 'mysuru', en: 'Mysuru', kn: 'ಮೈಸೂರು', scene: 'palace', lat: 12.2958, lng: 76.6394, days: 2,
    region: { en: 'South Karnataka', kn: 'ದಕ್ಷಿಣ ಕರ್ನಾಟಕ' }, tags: ['heritage', 'temples'],
    interests: [3, 2, 1, 0, 2, 1, 0, 0, 2, 3, 3],
    desc: { en: 'Royal city of palaces, silk and sandalwood, famous for the Dasara festival.',
      kn: 'ಅರಮನೆಗಳು, ರೇಷ್ಮೆ ಮತ್ತು ಶ್ರೀಗಂಧಕ್ಕೆ ಹೆಸರಾದ ರಾಜನಗರಿ; ದಸರಾ ಉತ್ಸವಕ್ಕೆ ಪ್ರಸಿದ್ಧ.' },
    attractions: [['Mysore Palace', 'ಮೈಸೂರು ಅರಮನೆ'], ['Chamundi Hills', 'ಚಾಮುಂಡಿ ಬೆಟ್ಟ'], ['Devaraja Market', 'ದೇವರಾಜ ಮಾರುಕಟ್ಟೆ']],
    cost: { stay: [1200, 3500], food: [350, 800], act: [100, 500] }, access: 'easy', season: null, official: null
  },
  {
    id: 'hampi', en: 'Hampi', kn: 'ಹಂಪಿ', scene: 'temple', lat: 15.3350, lng: 76.4600, days: 3,
    region: { en: 'North Karnataka', kn: 'ಉತ್ತರ ಕರ್ನಾಟಕ' }, tags: ['heritage', 'temples'],
    interests: [3, 3, 2, 0, 1, 0, 0, 2, 3, 1, 2],
    desc: { en: 'UNESCO World Heritage site: ruins of the Vijayanagara capital among boulders and the Tungabhadra river.',
      kn: 'ತುಂಗಭದ್ರಾ ನದಿ ಮತ್ತು ಬಂಡೆಗಳ ನಡುವೆ ಇರುವ ವಿಜಯನಗರ ಸಾಮ್ರಾಜ್ಯದ ರಾಜಧಾನಿಯ ಅವಶೇಷಗಳು; ವಿಶ್ವ ಪರಂಪರೆಯ ತಾಣ.' },
    attractions: [['Virupaksha Temple', 'ವಿರೂಪಾಕ್ಷ ದೇವಾಲಯ'], ['Vittala Temple', 'ವಿಠ್ಠಲ ದೇವಾಲಯ'], ['Hemakuta Hill', 'ಹೇಮಕೂಟ ಬೆಟ್ಟ']],
    cost: { stay: [800, 3000], food: [300, 700], act: [100, 600] }, access: 'demanding',
    season: { months: [4, 5], en: 'Summer afternoons can be very hot. Plan sightseeing for early morning or evening.',
      kn: 'ಬೇಸಿಗೆಯ ಮಧ್ಯಾಹ್ನಗಳು ತುಂಬಾ ಬಿಸಿಯಾಗಿರಬಹುದು. ಬೆಳಿಗ್ಗೆ ಅಥವಾ ಸಂಜೆ ವೀಕ್ಷಣೆ ಯೋಜಿಸಿ.' },
    official: { url: 'https://whc.unesco.org/en/list/241', type: 'unesco' }
  },
  {
    id: 'coorg', en: 'Coorg (Kodagu)', kn: 'ಕೊಡಗು', scene: 'hills', lat: 12.4244, lng: 75.7382, days: 3,
    region: { en: 'Western Ghats', kn: 'ಪಶ್ಚಿಮ ಘಟ್ಟ' }, tags: ['nature'],
    interests: [0, 1, 3, 2, 2, 2, 0, 2, 3, 2, 2],
    desc: { en: 'Misty hills, coffee estates and Kodava culture.',
      kn: 'ಮಂಜು ಮುಸುಕಿದ ಬೆಟ್ಟಗಳು, ಕಾಫಿ ತೋಟಗಳು ಮತ್ತು ಕೊಡವ ಸಂಸ್ಕೃತಿ.' },
    attractions: [['Abbey Falls', 'ಅಬ್ಬಿ ಜಲಪಾತ'], ["Raja's Seat", 'ರಾಜಾಸೀಟ್'], ['Dubare Elephant Camp', 'ದುಬಾರೆ ಆನೆ ಶಿಬಿರ']],
    cost: { stay: [1500, 5000], food: [400, 900], act: [150, 900] }, access: 'moderate',
    season: { months: [6, 7, 8], en: 'Heavy rain is common in the monsoon, with mist and slippery roads.',
      kn: 'ಮಳೆಗಾಲದಲ್ಲಿ ಭಾರೀ ಮಳೆ, ಮಂಜು ಮತ್ತು ಜಾರುವ ರಸ್ತೆಗಳು ಸಾಮಾನ್ಯ.' },
    official: null
  },
  {
    id: 'jog', en: 'Jog Falls', kn: 'ಜೋಗ ಜಲಪಾತ', scene: 'falls', lat: 14.2294, lng: 74.8120, days: 1,
    region: { en: 'Malnad', kn: 'ಮಲೆನಾಡು' }, tags: ['nature'],
    interests: [0, 0, 3, 3, 0, 1, 0, 1, 3, 2, 0],
    desc: { en: 'One of the tallest plunge waterfalls in India, on the Sharavathi river. Strongest in and after the monsoon.',
      kn: 'ಶರಾವತಿ ನದಿಯ ಮೇಲಿರುವ ಭಾರತದ ಎತ್ತರದ ಜಲಪಾತಗಳಲ್ಲಿ ಒಂದು. ಮಳೆಗಾಲದಲ್ಲಿ ಮತ್ತು ಅದರ ನಂತರ ಅತ್ಯಂತ ರಭಸ.' },
    attractions: [['Jog Falls viewpoint', 'ಜೋಗ ಜಲಪಾತ ವೀಕ್ಷಣಾ ಸ್ಥಳ'], ['Sharavathi valley', 'ಶರಾವತಿ ಕಣಿವೆ'], ['Linganamakki dam', 'ಲಿಂಗನಮಕ್ಕಿ ಅಣೆಕಟ್ಟು']],
    cost: { stay: [900, 2800], food: [300, 600], act: [50, 300] }, access: 'moderate',
    season: { months: [3, 4, 5], en: 'Water flow is usually thin in the dry months. The falls look best in and after the monsoon.',
      kn: 'ಬೇಸಿಗೆಯ ತಿಂಗಳುಗಳಲ್ಲಿ ನೀರಿನ ಹರಿವು ಕಡಿಮೆ ಇರುತ್ತದೆ. ಮಳೆಗಾಲದಲ್ಲಿ ಮತ್ತು ನಂತರ ಜಲಪಾತ ಚೆನ್ನಾಗಿ ಕಾಣುತ್ತದೆ.' },
    official: null
  },
  {
    id: 'gokarna', en: 'Gokarna', kn: 'ಗೋಕರ್ಣ', scene: 'beach', lat: 14.5479, lng: 74.3188, days: 2,
    region: { en: 'Coastal Karnataka', kn: 'ಕರಾವಳಿ ಕರ್ನಾಟಕ' }, tags: ['coast', 'temples'],
    interests: [0, 3, 2, 0, 1, 0, 3, 2, 3, 1, 1],
    desc: { en: 'Temple town with quiet beaches on the Arabian Sea.',
      kn: 'ಅರಬ್ಬೀ ಸಮುದ್ರದ ತೀರದಲ್ಲಿ ಶಾಂತ ಕಡಲತೀರಗಳಿರುವ ದೇವಾಲಯ ಪಟ್ಟಣ.' },
    attractions: [['Mahabaleshwara Temple', 'ಮಹಾಬಲೇಶ್ವರ ದೇವಾಲಯ'], ['Om Beach', 'ಓಂ ಬೀಚ್'], ['Kudle Beach', 'ಕುಡ್ಲೆ ಬೀಚ್']],
    cost: { stay: [800, 3500], food: [350, 800], act: [50, 600] }, access: 'moderate',
    season: { months: [6, 7, 8, 9], en: 'The sea is often rough in the monsoon and some beach services may be closed. Follow local safety signs.',
      kn: 'ಮಳೆಗಾಲದಲ್ಲಿ ಸಮುದ್ರ ಹೆಚ್ಚಾಗಿ ಪ್ರಕ್ಷುಬ್ಧವಾಗಿರುತ್ತದೆ; ಕೆಲವು ಕಡಲತೀರ ಸೇವೆಗಳು ಮುಚ್ಚಿರಬಹುದು. ಸ್ಥಳೀಯ ಸುರಕ್ಷತಾ ಫಲಕಗಳನ್ನು ಪಾಲಿಸಿ.' },
    official: null
  },
  {
    id: 'badami', en: 'Badami', kn: 'ಬಾದಾಮಿ', scene: 'temple', lat: 15.9149, lng: 75.6760, days: 1,
    region: { en: 'North Karnataka', kn: 'ಉತ್ತರ ಕರ್ನಾಟಕ' }, tags: ['heritage'],
    interests: [3, 2, 1, 0, 0, 0, 0, 2, 3, 1, 1],
    desc: { en: 'Chalukyan rock-cut cave temples above the Agastya lake.',
      kn: 'ಅಗಸ್ತ್ಯ ತೀರ್ಥ ಸರೋವರದ ಬಳಿಯ ಚಾಲುಕ್ಯರ ಗುಹಾ ದೇವಾಲಯಗಳು.' },
    attractions: [['Badami cave temples', 'ಬಾದಾಮಿ ಗುಹಾ ದೇವಾಲಯಗಳು'], ['Agastya Lake', 'ಅಗಸ್ತ್ಯ ತೀರ್ಥ'], ['Bhutanatha temples', 'ಭೂತನಾಥ ದೇವಾಲಯಗಳು']],
    cost: { stay: [800, 2500], food: [250, 550], act: [50, 300] }, access: 'demanding', season: null, official: null
  },
  {
    id: 'belur', en: 'Belur', kn: 'ಬೇಲೂರು', scene: 'temple', lat: 13.1650, lng: 75.8650, days: 1,
    region: { en: 'Hoysala heartland', kn: 'ಹೊಯ್ಸಳ ನಾಡು' }, tags: ['heritage', 'temples'],
    interests: [3, 3, 0, 0, 1, 0, 0, 0, 2, 1, 2],
    desc: { en: 'Hoysala masterpiece: the Chennakeshava temple with intricate carvings.',
      kn: 'ಸೂಕ್ಷ್ಮ ಕೆತ್ತನೆಗಳಿರುವ ಚೆನ್ನಕೇಶವ ದೇವಾಲಯ; ಹೊಯ್ಸಳ ಶಿಲ್ಪಕಲೆಯ ಶ್ರೇಷ್ಠ ಉದಾಹರಣೆ.' },
    attractions: [['Chennakeshava Temple', 'ಚೆನ್ನಕೇಶವ ದೇವಾಲಯ'], ['Courtyard sculptures', 'ಆವರಣದ ಶಿಲ್ಪಗಳು'], ['Local market', 'ಸ್ಥಳೀಯ ಮಾರುಕಟ್ಟೆ']],
    cost: { stay: [800, 2500], food: [250, 550], act: [50, 200] }, access: 'easy', season: null, official: null
  },
  {
    id: 'halebidu', en: 'Halebidu', kn: 'ಹಳೇಬೀಡು', scene: 'temple', lat: 13.2120, lng: 75.9930, days: 1,
    region: { en: 'Hoysala heartland', kn: 'ಹೊಯ್ಸಳ ನಾಡು' }, tags: ['heritage', 'temples'],
    interests: [3, 3, 0, 0, 1, 0, 0, 0, 2, 1, 2],
    desc: { en: 'The Hoysaleswara temple, famed for detailed stone sculpture.',
      kn: 'ಸೂಕ್ಷ್ಮ ಶಿಲ್ಪಕಲೆಗೆ ಹೆಸರಾದ ಹೊಯ್ಸಳೇಶ್ವರ ದೇವಾಲಯ.' },
    attractions: [['Hoysaleswara Temple', 'ಹೊಯ್ಸಳೇಶ್ವರ ದೇವಾಲಯ'], ['Kedareshwara Temple', 'ಕೇದಾರೇಶ್ವರ ದೇವಾಲಯ'], ['Archaeological museum', 'ಪುರಾತತ್ವ ವಸ್ತುಸಂಗ್ರಹಾಲಯ']],
    cost: { stay: [700, 2200], food: [250, 500], act: [50, 200] }, access: 'easy', season: null, official: null
  },
  {
    id: 'bengaluru', en: 'Bengaluru', kn: 'ಬೆಂಗಳೂರು', scene: 'city', lat: 12.9716, lng: 77.5946, days: 2,
    region: { en: 'Bengaluru region', kn: 'ಬೆಂಗಳೂರು ಪ್ರದೇಶ' }, tags: [],
    interests: [1, 1, 1, 0, 3, 0, 0, 1, 1, 3, 2],
    desc: { en: 'Garden city and tech hub with parks, cafes, museums and markets.',
      kn: 'ಉದ್ಯಾನನಗರಿ ಮತ್ತು ತಂತ್ರಜ್ಞಾನ ಕೇಂದ್ರ; ಉದ್ಯಾನಗಳು, ಕೆಫೆಗಳು, ವಸ್ತುಸಂಗ್ರಹಾಲಯಗಳು ಮತ್ತು ಮಾರುಕಟ್ಟೆಗಳು.' },
    attractions: [['Lalbagh', 'ಲಾಲ್‌ಬಾಗ್'], ['Cubbon Park', 'ಕಬ್ಬನ್ ಪಾರ್ಕ್'], ['VV Puram food street', 'ವಿ.ವಿ. ಪುರಂ ತಿಂಡಿ ಬೀದಿ']],
    cost: { stay: [1500, 5000], food: [500, 1200], act: [100, 800] }, access: 'easy', season: null, official: null
  },
  {
    id: 'mangaluru', en: 'Mangaluru', kn: 'ಮಂಗಳೂರು', scene: 'beach', lat: 12.9141, lng: 74.8560, days: 2,
    region: { en: 'Coastal Karnataka', kn: 'ಕರಾವಳಿ ಕರ್ನಾಟಕ' }, tags: ['coast'],
    interests: [1, 2, 1, 0, 3, 0, 3, 1, 1, 2, 3],
    desc: { en: 'Coastal city known for seafood, beaches and Tulu-Kannada culture.',
      kn: 'ಮೀನು ಖಾದ್ಯಗಳು, ಕಡಲತೀರಗಳು ಮತ್ತು ತುಳು-ಕನ್ನಡ ಸಂಸ್ಕೃತಿಗೆ ಹೆಸರಾದ ಕರಾವಳಿ ನಗರ.' },
    attractions: [['Panambur Beach', 'ಪಣಂಬೂರು ಬೀಚ್'], ['Kadri Manjunath Temple', 'ಕದ್ರಿ ಮಂಜುನಾಥ ದೇವಾಲಯ'], ["St Aloysius Chapel", 'ಸೇಂಟ್ ಅಲೋಶಿಯಸ್ ಚಾಪೆಲ್']],
    cost: { stay: [1200, 3500], food: [400, 900], act: [50, 400] }, access: 'easy', season: null, official: null
  },
  {
    id: 'udupi', en: 'Udupi', kn: 'ಉಡುಪಿ', scene: 'beach', lat: 13.3409, lng: 74.7421, days: 1,
    region: { en: 'Coastal Karnataka', kn: 'ಕರಾವಳಿ ಕರ್ನಾಟಕ' }, tags: ['coast', 'temples'],
    interests: [1, 3, 0, 0, 3, 0, 3, 0, 2, 2, 3],
    desc: { en: 'Krishna temple town and home of Udupi cuisine, close to Malpe beach.',
      kn: 'ಶ್ರೀಕೃಷ್ಣ ದೇವಾಲಯದ ಪಟ್ಟಣ; ಉಡುಪಿ ಖಾದ್ಯಗಳ ತವರು; ಮಲ್ಪೆ ಕಡಲತೀರದ ಹತ್ತಿರ.' },
    attractions: [['Sri Krishna Matha', 'ಶ್ರೀಕೃಷ್ಣ ಮಠ'], ['Malpe Beach', 'ಮಲ್ಪೆ ಬೀಚ್'], ["St Mary's Island", 'ಸೇಂಟ್ ಮೇರಿಸ್ ದ್ವೀಪ']],
    cost: { stay: [1000, 3000], food: [350, 750], act: [50, 400] }, access: 'easy', season: null, official: null
  },
  {
    id: 'chikkamagaluru', en: 'Chikkamagaluru', kn: 'ಚಿಕ್ಕಮಗಳೂರು', scene: 'hills', lat: 13.3153, lng: 75.7754, days: 2,
    region: { en: 'Malnad', kn: 'ಮಲೆನಾಡು' }, tags: ['nature'],
    interests: [0, 1, 3, 2, 2, 2, 0, 3, 3, 2, 1],
    desc: { en: 'Coffee land with Mullayanagiri, Baba Budangiri and trekking trails.',
      kn: 'ಕಾಫಿ ನಾಡು; ಮುಳ್ಳಯ್ಯನಗಿರಿ, ಬಾಬಾಬುಡನ್‌ಗಿರಿ ಮತ್ತು ಚಾರಣ ಮಾರ್ಗಗಳು.' },
    attractions: [['Mullayanagiri', 'ಮುಳ್ಳಯ್ಯನಗಿರಿ'], ['Baba Budangiri', 'ಬಾಬಾಬುಡನ್‌ಗಿರಿ'], ['Coffee estate walk', 'ಕಾಫಿ ತೋಟ ನಡಿಗೆ']],
    cost: { stay: [1200, 4000], food: [350, 800], act: [100, 900] }, access: 'moderate', season: null, official: null
  },
  {
    id: 'pattadakal', en: 'Pattadakal', kn: 'ಪಟ್ಟದಕಲ್ಲು', scene: 'temple', lat: 15.9489, lng: 75.8164, days: 1,
    region: { en: 'North Karnataka', kn: 'ಉತ್ತರ ಕರ್ನಾಟಕ' }, tags: ['heritage', 'temples'],
    interests: [3, 3, 0, 0, 0, 0, 0, 0, 2, 1, 1],
    desc: { en: 'UNESCO site with early Chalukyan temples that blend northern and southern styles.',
      kn: 'ಉತ್ತರ ಮತ್ತು ದಕ್ಷಿಣ ಶೈಲಿಗಳು ಬೆರೆತ ಆರಂಭಿಕ ಚಾಲುಕ್ಯ ದೇವಾಲಯಗಳಿರುವ ವಿಶ್ವ ಪರಂಪರೆಯ ತಾಣ.' },
    attractions: [['Virupaksha Temple (Pattadakal)', 'ವಿರೂಪಾಕ್ಷ ದೇವಾಲಯ (ಪಟ್ಟದಕಲ್ಲು)'], ['Sangameshwara Temple', 'ಸಂಗಮೇಶ್ವರ ದೇವಾಲಯ'], ['Papanatha Temple', 'ಪಾಪನಾಥ ದೇವಾಲಯ']],
    cost: { stay: [700, 2200], food: [250, 500], act: [50, 200] }, access: 'easy', season: null,
    official: { url: 'https://whc.unesco.org/en/list/239', type: 'unesco' }
  }
];

// Airport codes (IATA) for places in our list that have one. Used only for the "Plane" option.
const AIRPORTS = { bengaluru: 'BLR', mysuru: 'MYQ', mangaluru: 'IXE', hubballi: 'HBX', belagavi: 'IXG', shivamogga: 'RQY', hampi: 'VDY' };

const KARNATAKA_TOURISM_URL = 'https://www.karnataka.com/';

/* REAL PHOTOS
   Photos are fetched while the visitor is online from the Wikipedia page summary of each monument
   (https://en.wikipedia.org/api/rest_v1/page/summary/<title>). Each destination lists wiki page titles
   in order; the first page that has a lead photo is used. If nothing loads (offline, blocked), the
   original SVG illustration stays visible, so the app never shows a broken image. */
const PHOTO_TITLES = {
  mysuru: ['Mysore_Palace', 'Mysore'],
  hampi: ['Virupaksha_Temple,_Hampi', 'Hampi'],
  coorg: ['Abbey_Falls', 'Kodagu_district'],
  jog: ['Jog_Falls'],
  gokarna: ['Mahabaleshwar_Temple,_Gokarna', 'Gokarna,_Karnataka'],
  badami: ['Badami_cave_temples', 'Badami'],
  belur: ['Chennakeshava_Temple,_Belur', 'Belur,_Karnataka'],
  halebidu: ['Hoysaleswara_Temple', 'Halebidu'],
  bengaluru: ['Vidhana_Soudha', 'Bangalore'],
  mangaluru: ['Kadri_Manjunath_Temple', 'Mangalore'],
  udupi: ['Udupi_Sri_Krishna_Matha', 'Udupi'],
  chikkamagaluru: ['Mullayanagiri', 'Chikmagalur'],
  pattadakal: ['Pattadakal', 'Group_of_Monuments_at_Pattadakal']
};

// Planning assumptions used by the cost engine. All are ESTIMATES by the team.
const RATE = {
  roadFactor: 1.2,                                   // straight-line km x 1.2 approximates road km
  avgSpeedKmh: 45,                                   // rough average road speed
  transportPerKmPerPerson: { low: 1.5, mid: 4, high: 7 },   // INR: state bus / mixed / shared cab
  localPerDayPerPerson: { low: 50, mid: 150, high: 300 },   // INR: autos, local taxis
  carPerKm: 12,                                      // INR per km for a whole car (fuel, driver), shared by up to 4 people
  busPerKmPerPerson: [1.5, 3],                       // INR per km per person (state bus to private AC)
  flightKmh: 650, airportOverheadMin: 150,           // rough flight speed and airport time
  contingency: 0.08                                  // 8% buffer on top
};
const PACE_DAYS_PER_STOP = { relaxed: 2.5, balanced: 2, packed: 1.5 };
const MAX_STOPS = 6;

/* =====================================================================
   2. TRANSLATIONS
   ===================================================================== */
const T = {
  en: {
    doc_title: 'NammaTrip AI - Plan your Karnataka journey',
    skip: 'Skip to main content', menu: 'Menu',
    nav_explore: 'Destinations', nav_plan: 'Plan a trip', nav_culture: 'Culture', nav_about: 'How it works',
    lang_btn: 'ಕನ್ನಡ', lang_aria: 'Switch to Kannada',
    hero_kicker: 'A prototype for the Kannada Digital Innovation Hackathon 2026',
    hero_title: 'Small plans. Big memories.',
    hero_tagline: 'Your Budget. Your Journey. Your Karnataka.',
    hero_sub: 'Tell us your budget, days and interests. NammaTrip AI builds a day-by-day Karnataka plan in Kannada or English, with every cost clearly marked as an estimate.',
    cta_plan: 'Plan my journey', cta_explore: 'Explore destinations',
    stat_dest: '13 curated destinations', stat_lang: 'Kannada and English',
    stat_key: 'Works without an API key', stat_open: 'Open, explainable logic',
    quick_title: 'Quick plan', quick_note: 'Fills the full planner for you.',
    select_city: 'Select a city',
    explore_title: 'Thirteen places, one state',
    explore_sub: 'Browse, filter, and open a card for details. Costs are planning ranges, not live prices.',
    filter_all: 'All', filter_heritage: 'Heritage', filter_temples: 'Temples', filter_nature: 'Nature', filter_coast: 'Coast',
    prev: 'Previous', next: 'Next', carousel_label: 'Destinations',
    card_days: '{n} suggested', card_days_one: '1 day suggested', card_open: 'View details',
    dlg_close: 'Close', dlg_attractions: 'Known attractions', dlg_cost: 'Planning cost ranges',
    dlg_cost_note: 'Team planning assumptions in rupees, not live prices. Verify before booking.',
    cost_stay: 'Stay per room per night', cost_food: 'Food per person per day', cost_act: 'Entry and activities per person per day',
    dlg_season: 'Season note', dlg_access: 'Access (editorial estimate)',
    access_easy: 'Mostly easy', access_moderate: 'Some walking or steps', access_demanding: 'Demanding terrain or many steps',
    dlg_maps: 'Open in Maps', dlg_official: 'Official information', link_unesco: 'UNESCO World Heritage page', link_kt: 'Karnataka Tourism portal',
    dlg_add: 'Add to my trip wishes', dlg_remove: 'Remove from my trip wishes',
    plan_title: 'Build your trip', plan_sub: 'Everything is calculated on your device with a transparent rule-based engine.',
    g_basics: 'Trip basics', g_prefs: 'Your preferences',
    f_start: 'Starting city', f_days: 'Number of days', f_travellers: 'Travellers',
    f_date: 'Start date (optional)', f_budget: 'Total budget (₹)', f_budget_slider: 'Budget slider',
    alloc_title: 'Suggested split of your budget',
    alloc_note: 'A planning guide that updates as you move the slider. It is not a quote.',
    c_stay: 'Stay', c_transport: 'Transport', c_food: 'Food', c_act: 'Entry and activities', c_cont: 'Contingency',
    f_interests: 'Interests', f_interests_hint: 'Pick at least one, or choose places below.',
    f_pace: 'Travel pace', pace_relaxed: 'Relaxed', pace_balanced: 'Balanced', pace_packed: 'Packed',
    f_dest: 'Preferred destinations (optional)', f_dest_hint: 'Leave empty to let the engine discover places for you.',
    f_access: 'I need easier access (fewer steps and long walks)', f_family: 'Family-friendly trip',
    btn_generate: 'Create my plan', btn_sample: 'Try a sample trip', btn_reset: 'Reset trip',
    int_heritage: 'Heritage', int_temples: 'Temples', int_nature: 'Nature', int_waterfalls: 'Waterfalls',
    int_food: 'Food', int_wildlife: 'Wildlife', int_beaches: 'Beaches', int_adventure: 'Adventure',
    int_photography: 'Photography', int_family: 'Family travel', int_culture: 'Local culture',
    e_start: 'Please choose a starting city.',
    e_days: 'Enter a whole number of days from 1 to 14.',
    e_trav: 'Enter a whole number of travellers from 1 to 20.',
    e_budget: 'Enter a budget between ₹2,000 and ₹10,00,000.',
    e_date: 'Please enter a valid date.',
    e_interest: 'Choose at least one interest or one preferred destination.',
    e_form: 'Please fix the highlighted fields.',
    r_title: 'Your Karnataka plan',
    r_empty_title: 'Your plan will appear here',
    r_empty_text: 'Fill in the form above, or try a sample trip to see how it works.',
    r_loading: 'Calculating on your device. No server or AI service is contacted.',
    r_error: 'Something went wrong while creating the plan. Check your inputs and try again.',
    badge_engine: 'Rule-based engine running in your browser. Not live AI.',
    r_summary: '{days} days, {n} travellers, budget {budget}',
    r_route: 'Route overview',
    r_route_note: 'Schematic map, not to scale. Distances are straight-line distance times 1.2 as a road estimate.',
    map_start: 'Start',
    r_progress: 'Move the traveller along the route',
    r_progress_val: 'Day {d} of {n}, near {place}',
    r_stops: 'Your stops', r_stops_hint: 'Drag to reorder, or use the arrow buttons. The itinerary updates each time.',
    r_up: 'Move up', r_down: 'Move down', r_remove: 'Remove', r_add_label: 'Add a stop', r_add: 'Add', r_optimise: 'Optimise route order',
    r_days_n: '{n} days', r_day_one: '1 day', r_details: 'Details', r_maps: 'Maps',
    why_match: 'Matches your interest in {interests}.', why_pref: 'You asked for this place.',
    why_added: 'Added by you.', why_none: 'A balanced pick for variety.', why_km: 'About {km} km from the previous point.',
    r_itin: 'Day-by-day itinerary', day_label: 'Day', day_n: 'Day {n}',
    slot_morning: 'Morning', slot_afternoon: 'Afternoon', slot_evening: 'Evening',
    evening_local: 'Local food and an easy evening walk',
    travel_note: 'Travel from {from} to {to}: about {km} km, roughly {h} h by road (estimate)',
    return_note: 'Return to {to}: about {km} km, roughly {h} h by road (estimate)',
    r_cost: 'Cost estimate', r_est_total: 'Estimated total', r_your_budget: 'Your budget',
    r_diff_under: 'About {x} under budget', r_diff_over: 'About {x} over budget',
    r_range: 'Likely range: {lo} to {hi}',
    r_cost_note: 'Mid-level estimate using team planning assumptions. These are not live prices.',
    r_budget_vs: 'Budget compared with the estimate (shaded band shows low to high)',
    v_comfortable: 'Your budget covers even the higher-cost estimate. You have room for nicer stays or extra activities.',
    v_fits: 'Your budget fits the mid-level estimate.',
    v_tight: 'Tight: your budget covers only the low-cost estimate. Choose budget stays and transport.',
    v_insufficient: 'Budget is not enough: even the low-cost estimate is {lo}. Add about {gap}, reduce the days, or remove far-away stops.',
    w_more_stops: 'You have more stops than days, so the trip was extended to {n} days.',
    w_access: '{place} may involve steps or uneven ground (editorial estimate).',
    w_long: 'The leg to {place} is long (about {km} km). Plan rest stops.',
    w_season: '{place}: {note}',
    w_verify: 'Prices, weather, opening hours and road or access conditions must be checked before travel.',
    r_pack: 'Packing checklist', r_tips: 'Travel tips',
    a_print: 'Print', a_json: 'Download JSON', a_txt: 'Download text', a_share: 'Share',
    t_ready: 'Plan ready with {n} stops.', t_reset: 'Trip reset.', t_sample: 'Sample trip loaded.',
    t_downloaded: 'Download started.', t_copied: 'Trip summary copied to the clipboard.',
    t_share_fail: 'Sharing is not available in this browser.', t_moved: '{place} moved to position {n}.',
    t_removed: '{place} removed.', t_added: '{place} added.', t_last_stop: 'Keep at least one stop.',
    t_wish_added: '{place} added to your trip wishes.', t_wish_removed: '{place} removed from your trip wishes.',
    t_optimised: 'Route order optimised.', t_quick: 'Details copied to the planner.',
    cul_title: 'Taste, heritage and language',
    cul_sub: 'Kannada is not an add-on here. It is the language the trip is told in.',
    cul_food: 'Local food to look for', cul_heritage: 'Dynasties behind the monuments',
    cul_phrases: 'Useful Kannada phrases', cul_resp: 'Responsible tourism',
    ab_title: 'A transparent engine you can explain',
    ab_sub: 'No hidden AI and no invented data. Here is exactly what happens when you press the button.',
    s1_t: 'Score', s1_d: 'Each place gets points for your interests, your wishes, budget fit, distance from your start city, and family or access needs.',
    s2_t: 'Choose', s2_d: 'The number of stops depends on your days and pace. The engine picks high scorers and avoids near-duplicates.',
    s3_t: 'Route', s3_d: 'Stops are ordered by nearest neighbour from your start city, and days are shared by suggested duration.',
    s4_t: 'Cost', s4_d: 'Stay, transport, food, activities and an 8% buffer are added up at low, mid and high planning rates.',
    s5_t: 'Be honest', s5_d: 'If the budget is too low, the app says so instead of pretending the plan fits.',
    ab_limits: 'Data limitations', ab_ready: 'Ready for real AI later',
    ab_ready_text: 'The planner is built in separate layers (data, engine, display). A real AI model can later be added behind a secure backend that returns a plan in the same shape. API keys must never be placed in browser code.',
    ab_credits: 'Credits',
    ab_credits_text: 'Built by a BCA student for the hackathon. Fallback illustrations are original SVG drawings. Destination photos load from Wikipedia and Wikimedia Commons when you are online; each photo belongs to its creator under the licence on its Commons page. Fonts: Fraunces, Hanken Grotesk and Noto Kannada fonts from Google Fonts.',
    photo_credit: 'Photo via Wikipedia',
    m_title: 'Maps and ways to travel',
    m_sub: 'Pick a mode to see it on the map. Times and costs are estimates unless marked as road data.',
    mode_car: 'Car', mode_bus: 'Bus', mode_plane: 'Plane', mode_walk: 'Walking',
    m_loading: 'Loading map...', m_offline: 'The interactive map needs an internet connection. The table below still works.',
    m_leg: 'Leg', m_distance: 'Distance', m_car: 'Car', m_bus: 'Bus', m_plane: 'Plane', m_links: 'Open maps',
    m_row: '{from} to {to}', m_hm: '{h} h {m} min', m_pp: 'per person', m_live: 'Road data', m_estimated: 'Estimate',
    m_car_note: 'Car cost is shared per vehicle of 4 people at an assumed ₹12 per km. Time uses road data when available.',
    m_bus_note: 'Bus cost assumes ₹1.5 to ₹3 per km per person and about 30% more time than a car. Check KSRTC and private operators.',
    m_plane_note: 'Shown only where both places have an airport in our list and are 150 km or more apart. Check airlines for real flights and fares.',
    m_walk_note: 'Walking is not practical between cities. Use the walking links in each day of the itinerary.',
    m_plane_none: 'No airport data', m_price_varies: 'Fares vary', m_flights: 'Search flights', m_drive: 'Drive route', m_transit: 'Bus or train route',
    m_walk_day: "Walking route between today's places", m_walk_list: 'Walking routes by day',

    ft_tag: 'ಕನ್ನಡದಲ್ಲಿ ನಿಮ್ಮ ಕರ್ನಾಟಕ ಪ್ರವಾಸದ ಸಂಗಾತಿ', ft_text: 'Code. Create. Celebrate Kannada.'
  },
  kn: {
    doc_title: 'ನಮ್ಮಟ್ರಿಪ್ ಎಐ - ನಿಮ್ಮ ಕರ್ನಾಟಕ ಪ್ರವಾಸ ಯೋಜಿಸಿ',
    skip: 'ಮುಖ್ಯ ವಿಷಯಕ್ಕೆ ಹೋಗಿ', menu: 'ಮೆನು',
    nav_explore: 'ಸ್ಥಳಗಳು', nav_plan: 'ಪ್ರವಾಸ ಯೋಜನೆ', nav_culture: 'ಸಂಸ್ಕೃತಿ', nav_about: 'ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ',
    lang_btn: 'English', lang_aria: 'ಇಂಗ್ಲಿಷ್‌ಗೆ ಬದಲಿಸಿ',
    hero_kicker: 'ಕನ್ನಡ ಡಿಜಿಟಲ್ ಇನ್ನೋವೇಶನ್ ಹ್ಯಾಕಥಾನ್ 2026ಕ್ಕಾಗಿ ಒಂದು ಮೂಲಮಾದರಿ',
    hero_title: 'ಸಣ್ಣ ಯೋಜನೆ, ದೊಡ್ಡ ನೆನಪುಗಳು.',
    hero_tagline: 'ನಿಮ್ಮ ಬಜೆಟ್. ನಿಮ್ಮ ಪ್ರಯಾಣ. ನಿಮ್ಮ ಕರ್ನಾಟಕ.',
    hero_sub: 'ನಿಮ್ಮ ಬಜೆಟ್, ದಿನಗಳು ಮತ್ತು ಆಸಕ್ತಿಗಳನ್ನು ತಿಳಿಸಿ. ನಮ್ಮಟ್ರಿಪ್ ಎಐ ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ದಿನವಾರು ಕರ್ನಾಟಕ ಪ್ರವಾಸ ಯೋಜನೆ ರೂಪಿಸುತ್ತದೆ; ಎಲ್ಲ ವೆಚ್ಚಗಳನ್ನೂ ಅಂದಾಜು ಎಂದು ಸ್ಪಷ್ಟವಾಗಿ ಗುರುತಿಸಲಾಗಿದೆ.',
    cta_plan: 'ನನ್ನ ಪ್ರವಾಸ ಯೋಜಿಸಿ', cta_explore: 'ಸ್ಥಳಗಳನ್ನು ನೋಡಿ',
    stat_dest: '13 ಆಯ್ದ ಸ್ಥಳಗಳು', stat_lang: 'ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್',
    stat_key: 'ಎಪಿಐ ಕೀ ಇಲ್ಲದೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ', stat_open: 'ತೆರೆದ, ವಿವರಿಸಬಹುದಾದ ತರ್ಕ',
    quick_title: 'ತ್ವರಿತ ಯೋಜನೆ', quick_note: 'ಇದು ಪೂರ್ಣ ಯೋಜನಾ ಫಾರ್ಮ್ ಅನ್ನು ತುಂಬುತ್ತದೆ.',
    select_city: 'ನಗರ ಆರಿಸಿ',
    explore_title: 'ಹದಿಮೂರು ಸ್ಥಳಗಳು, ಒಂದು ರಾಜ್ಯ',
    explore_sub: 'ಬ್ರೌಸ್ ಮಾಡಿ, ಫಿಲ್ಟರ್ ಮಾಡಿ, ವಿವರಗಳಿಗಾಗಿ ಕಾರ್ಡ್ ತೆರೆಯಿರಿ. ವೆಚ್ಚಗಳು ಯೋಜನಾ ಶ್ರೇಣಿಗಳು, ಲೈವ್ ದರಗಳಲ್ಲ.',
    filter_all: 'ಎಲ್ಲವೂ', filter_heritage: 'ಪರಂಪರೆ', filter_temples: 'ದೇವಾಲಯಗಳು', filter_nature: 'ಪ್ರಕೃತಿ', filter_coast: 'ಕರಾವಳಿ',
    prev: 'ಹಿಂದಿನ', next: 'ಮುಂದಿನ', carousel_label: 'ಸ್ಥಳಗಳು',
    card_days: 'ಸೂಚಿತ {n}', card_days_one: 'ಸೂಚಿತ 1 ದಿನ', card_open: 'ವಿವರ ನೋಡಿ',
    dlg_close: 'ಮುಚ್ಚಿ', dlg_attractions: 'ಪ್ರಮುಖ ಆಕರ್ಷಣೆಗಳು', dlg_cost: 'ವೆಚ್ಚದ ಯೋಜನಾ ಶ್ರೇಣಿ',
    dlg_cost_note: 'ಇವು ತಂಡದ ಯೋಜನಾ ಊಹೆಗಳು (ರೂಪಾಯಿಗಳಲ್ಲಿ); ಲೈವ್ ದರಗಳಲ್ಲ. ಬುಕ್ ಮಾಡುವ ಮೊದಲು ಪರಿಶೀಲಿಸಿ.',
    cost_stay: 'ವಸತಿ (ಕೋಣೆಗೆ, ರಾತ್ರಿಗೆ)', cost_food: 'ಊಟ (ವ್ಯಕ್ತಿಗೆ, ದಿನಕ್ಕೆ)', cost_act: 'ಪ್ರವೇಶ ಮತ್ತು ಚಟುವಟಿಕೆ (ವ್ಯಕ್ತಿಗೆ, ದಿನಕ್ಕೆ)',
    dlg_season: 'ಋತು ಟಿಪ್ಪಣಿ', dlg_access: 'ಪ್ರವೇಶ ಸುಲಭತೆ (ಸಂಪಾದಕೀಯ ಅಂದಾಜು)',
    access_easy: 'ಬಹುತೇಕ ಸುಲಭ', access_moderate: 'ಸ್ವಲ್ಪ ನಡಿಗೆ ಅಥವಾ ಮೆಟ್ಟಿಲುಗಳು', access_demanding: 'ಕಠಿಣ ಭೂಪ್ರದೇಶ ಅಥವಾ ಹೆಚ್ಚು ಮೆಟ್ಟಿಲುಗಳು',
    dlg_maps: 'ನಕ್ಷೆಯಲ್ಲಿ ತೆರೆಯಿರಿ', dlg_official: 'ಅಧಿಕೃತ ಮಾಹಿತಿ', link_unesco: 'ಯುನೆಸ್ಕೋ ವಿಶ್ವ ಪರಂಪರೆ ಪುಟ', link_kt: 'ಕರ್ನಾಟಕ ಪ್ರವಾಸೋದ್ಯಮ ಪೋರ್ಟಲ್',
    dlg_add: 'ನನ್ನ ಪ್ರವಾಸದ ಆಯ್ಕೆಗೆ ಸೇರಿಸಿ', dlg_remove: 'ನನ್ನ ಪ್ರವಾಸದ ಆಯ್ಕೆಯಿಂದ ತೆಗೆಯಿರಿ',
    plan_title: 'ನಿಮ್ಮ ಪ್ರವಾಸ ರೂಪಿಸಿ', plan_sub: 'ಎಲ್ಲವನ್ನೂ ನಿಮ್ಮ ಸಾಧನದಲ್ಲೇ ಪಾರದರ್ಶಕ ನಿಯಮಾಧಾರಿತ ಎಂಜಿನ್‌ನಿಂದ ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತದೆ.',
    g_basics: 'ಪ್ರವಾಸದ ಮೂಲ ವಿವರಗಳು', g_prefs: 'ನಿಮ್ಮ ಆದ್ಯತೆಗಳು',
    f_start: 'ಆರಂಭಿಕ ನಗರ', f_days: 'ದಿನಗಳ ಸಂಖ್ಯೆ', f_travellers: 'ಪ್ರಯಾಣಿಕರು',
    f_date: 'ಪ್ರಯಾಣ ಆರಂಭದ ದಿನಾಂಕ (ಐಚ್ಛಿಕ)', f_budget: 'ಒಟ್ಟು ಬಜೆಟ್ (₹)', f_budget_slider: 'ಬಜೆಟ್ ಸ್ಲೈಡರ್',
    alloc_title: 'ನಿಮ್ಮ ಬಜೆಟ್‌ನ ಸೂಚಿತ ಹಂಚಿಕೆ',
    alloc_note: 'ಸ್ಲೈಡರ್ ಚಲಿಸಿದಂತೆ ಬದಲಾಗುವ ಯೋಜನಾ ಮಾರ್ಗದರ್ಶಿ. ಇದು ದರಪಟ್ಟಿಯಲ್ಲ.',
    c_stay: 'ವಸತಿ', c_transport: 'ಸಾರಿಗೆ', c_food: 'ಊಟ', c_act: 'ಪ್ರವೇಶ ಮತ್ತು ಚಟುವಟಿಕೆ', c_cont: 'ಅನಿರೀಕ್ಷಿತ ವೆಚ್ಚ',
    f_interests: 'ಆಸಕ್ತಿಗಳು', f_interests_hint: 'ಕನಿಷ್ಠ ಒಂದನ್ನು ಆರಿಸಿ, ಅಥವಾ ಕೆಳಗೆ ಸ್ಥಳಗಳನ್ನು ಆರಿಸಿ.',
    f_pace: 'ಪ್ರಯಾಣದ ವೇಗ', pace_relaxed: 'ನಿಧಾನ', pace_balanced: 'ಸಮತೋಲನ', pace_packed: 'ಚುರುಕು',
    f_dest: 'ಇಷ್ಟದ ಸ್ಥಳಗಳು (ಐಚ್ಛಿಕ)', f_dest_hint: 'ಸ್ಥಳಗಳನ್ನು ಎಂಜಿನ್ ಆರಿಸಲು ಖಾಲಿ ಬಿಡಿ.',
    f_access: 'ನನಗೆ ಸುಲಭ ಪ್ರವೇಶ ಬೇಕು (ಕಡಿಮೆ ಮೆಟ್ಟಿಲು, ಕಡಿಮೆ ನಡಿಗೆ)', f_family: 'ಕುಟುಂಬಕ್ಕೆ ಸೂಕ್ತ ಪ್ರವಾಸ',
    btn_generate: 'ನನ್ನ ಯೋಜನೆ ರಚಿಸಿ', btn_sample: 'ಮಾದರಿ ಪ್ರವಾಸ ಪ್ರಯತ್ನಿಸಿ', btn_reset: 'ಪ್ರವಾಸ ಮರುಹೊಂದಿಸಿ',
    int_heritage: 'ಪರಂಪರೆ', int_temples: 'ದೇವಾಲಯಗಳು', int_nature: 'ಪ್ರಕೃತಿ', int_waterfalls: 'ಜಲಪಾತಗಳು',
    int_food: 'ಆಹಾರ', int_wildlife: 'ವನ್ಯಜೀವಿ', int_beaches: 'ಕಡಲತೀರಗಳು', int_adventure: 'ಸಾಹಸ',
    int_photography: 'ಛಾಯಾಗ್ರಹಣ', int_family: 'ಕುಟುಂಬ ಪ್ರವಾಸ', int_culture: 'ಸ್ಥಳೀಯ ಸಂಸ್ಕೃತಿ',
    e_start: 'ದಯವಿಟ್ಟು ಆರಂಭಿಕ ನಗರವನ್ನು ಆರಿಸಿ.',
    e_days: '1 ರಿಂದ 14ರ ನಡುವೆ ದಿನಗಳ ಸಂಖ್ಯೆಯನ್ನು ಪೂರ್ಣಾಂಕದಲ್ಲಿ ನಮೂದಿಸಿ.',
    e_trav: '1 ರಿಂದ 20ರ ನಡುವೆ ಪ್ರಯಾಣಿಕರ ಸಂಖ್ಯೆಯನ್ನು ಪೂರ್ಣಾಂಕದಲ್ಲಿ ನಮೂದಿಸಿ.',
    e_budget: '₹2,000 ರಿಂದ ₹10,00,000ರ ನಡುವೆ ಬಜೆಟ್ ನಮೂದಿಸಿ.',
    e_date: 'ದಯವಿಟ್ಟು ಸರಿಯಾದ ದಿನಾಂಕ ನಮೂದಿಸಿ.',
    e_interest: 'ಕನಿಷ್ಠ ಒಂದು ಆಸಕ್ತಿ ಅಥವಾ ಒಂದು ಇಷ್ಟದ ಸ್ಥಳವನ್ನು ಆರಿಸಿ.',
    e_form: 'ದಯವಿಟ್ಟು ಗುರುತಿಸಿದ ಕ್ಷೇತ್ರಗಳನ್ನು ಸರಿಪಡಿಸಿ.',
    r_title: 'ನಿಮ್ಮ ಕರ್ನಾಟಕ ಪ್ರವಾಸ ಯೋಜನೆ',
    r_empty_title: 'ನಿಮ್ಮ ಯೋಜನೆ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ',
    r_empty_text: 'ಮೇಲಿನ ಫಾರ್ಮ್ ತುಂಬಿ, ಅಥವಾ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ ಎಂದು ನೋಡಲು ಮಾದರಿ ಪ್ರವಾಸ ಪ್ರಯತ್ನಿಸಿ.',
    r_loading: 'ನಿಮ್ಮ ಸಾಧನದಲ್ಲೇ ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ. ಯಾವುದೇ ಸರ್ವರ್ ಅಥವಾ ಎಐ ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸುವುದಿಲ್ಲ.',
    r_error: 'ಯೋಜನೆ ರಚಿಸುವಾಗ ಏನೋ ತೊಂದರೆಯಾಯಿತು. ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    badge_engine: 'ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಚಲಿಸುವ ನಿಯಮಾಧಾರಿತ ಎಂಜಿನ್. ಲೈವ್ ಎಐ ಅಲ್ಲ.',
    r_summary: '{days} ದಿನ, {n} ಪ್ರಯಾಣಿಕರು, ಬಜೆಟ್ {budget}',
    r_route: 'ಮಾರ್ಗ ಅವಲೋಕನ',
    r_route_note: 'ಸಾಂಕೇತಿಕ ನಕ್ಷೆ, ಅಳತೆಗೆ ಅನುಗುಣವಾಗಿಲ್ಲ. ದೂರಗಳು ನೇರ ದೂರವನ್ನು 1.2ರಿಂದ ಗುಣಿಸಿದ ರಸ್ತೆ ಅಂದಾಜು.',
    map_start: 'ಆರಂಭ',
    r_progress: 'ಪ್ರಯಾಣಿಕನನ್ನು ಮಾರ್ಗದಲ್ಲಿ ಚಲಿಸಿ',
    r_progress_val: 'ದಿನ {d} / {n}, {place} ಬಳಿ',
    r_stops: 'ನಿಮ್ಮ ನಿಲುಗಡೆಗಳು', r_stops_hint: 'ಎಳೆದು ಮರುಕ್ರಮಗೊಳಿಸಿ, ಅಥವಾ ಬಾಣದ ಬಟನ್ ಬಳಸಿ. ಪ್ರತಿ ಬಾರಿ ಯೋಜನೆ ನವೀಕರಣವಾಗುತ್ತದೆ.',
    r_up: 'ಮೇಲಕ್ಕೆ ಸರಿಸಿ', r_down: 'ಕೆಳಕ್ಕೆ ಸರಿಸಿ', r_remove: 'ತೆಗೆಯಿರಿ', r_add_label: 'ನಿಲುಗಡೆ ಸೇರಿಸಿ', r_add: 'ಸೇರಿಸಿ', r_optimise: 'ಮಾರ್ಗದ ಕ್ರಮ ಸುಧಾರಿಸಿ',
    r_days_n: '{n} ದಿನ', r_day_one: '1 ದಿನ', r_details: 'ವಿವರ', r_maps: 'ನಕ್ಷೆ',
    why_match: '{interests} ಬಗ್ಗೆ ನಿಮ್ಮ ಆಸಕ್ತಿಗೆ ಹೊಂದುತ್ತದೆ.', why_pref: 'ನೀವು ಈ ಸ್ಥಳವನ್ನು ಕೇಳಿದ್ದೀರಿ.',
    why_added: 'ನೀವು ಸೇರಿಸಿದ್ದು.', why_none: 'ವೈವಿಧ್ಯಕ್ಕಾಗಿ ಆರಿಸಿದ ಸಮತೋಲನ ಆಯ್ಕೆ.', why_km: 'ಹಿಂದಿನ ಸ್ಥಳದಿಂದ ಸುಮಾರು {km} ಕಿ.ಮೀ.',
    r_itin: 'ದಿನವಾರು ಯೋಜನೆ', day_label: 'ದಿನ', day_n: 'ದಿನ {n}',
    slot_morning: 'ಬೆಳಿಗ್ಗೆ', slot_afternoon: 'ಮಧ್ಯಾಹ್ನ', slot_evening: 'ಸಂಜೆ',
    evening_local: 'ಸ್ಥಳೀಯ ಆಹಾರ ಮತ್ತು ಆರಾಮದ ಸಂಜೆ ನಡಿಗೆ',
    travel_note: '{from} ನಿಂದ {to} ಗೆ ಪ್ರಯಾಣ: ಸುಮಾರು {km} ಕಿ.ಮೀ, ರಸ್ತೆಯಲ್ಲಿ ಸುಮಾರು {h} ಗಂಟೆ (ಅಂದಾಜು)',
    return_note: '{to} ಗೆ ಹಿಂತಿರುಗುವಿಕೆ: ಸುಮಾರು {km} ಕಿ.ಮೀ, ರಸ್ತೆಯಲ್ಲಿ ಸುಮಾರು {h} ಗಂಟೆ (ಅಂದಾಜು)',
    r_cost: 'ವೆಚ್ಚದ ಅಂದಾಜು', r_est_total: 'ಅಂದಾಜು ಒಟ್ಟು ವೆಚ್ಚ', r_your_budget: 'ನಿಮ್ಮ ಬಜೆಟ್',
    r_diff_under: 'ಬಜೆಟ್‌ಗಿಂತ ಸುಮಾರು {x} ಕಡಿಮೆ', r_diff_over: 'ಬಜೆಟ್‌ಗಿಂತ ಸುಮಾರು {x} ಹೆಚ್ಚು',
    r_range: 'ಸಂಭಾವ್ಯ ಶ್ರೇಣಿ: {lo} ರಿಂದ {hi}',
    r_cost_note: 'ತಂಡದ ಯೋಜನಾ ಊಹೆಗಳನ್ನು ಬಳಸಿದ ಮಧ್ಯಮ ಮಟ್ಟದ ಅಂದಾಜು. ಇವು ಲೈವ್ ದರಗಳಲ್ಲ.',
    r_budget_vs: 'ಬಜೆಟ್ ಮತ್ತು ಅಂದಾಜಿನ ಹೋಲಿಕೆ (ಛಾಯೆಯ ಪಟ್ಟಿ ಕಡಿಮೆಯಿಂದ ಹೆಚ್ಚಿನವರೆಗೆ ತೋರಿಸುತ್ತದೆ)',
    v_comfortable: 'ನಿಮ್ಮ ಬಜೆಟ್ ಹೆಚ್ಚಿನ ವೆಚ್ಚದ ಅಂದಾಜನ್ನೂ ಭರಿಸುತ್ತದೆ. ಉತ್ತಮ ವಸತಿ ಅಥವಾ ಹೆಚ್ಚುವರಿ ಚಟುವಟಿಕೆಗಳಿಗೆ ಅವಕಾಶವಿದೆ.',
    v_fits: 'ನಿಮ್ಮ ಬಜೆಟ್ ಮಧ್ಯಮ ಮಟ್ಟದ ಅಂದಾಜಿಗೆ ಹೊಂದುತ್ತದೆ.',
    v_tight: 'ಬಿಗಿ: ನಿಮ್ಮ ಬಜೆಟ್ ಕಡಿಮೆ ವೆಚ್ಚದ ಅಂದಾಜನ್ನು ಮಾತ್ರ ಭರಿಸುತ್ತದೆ. ಕಡಿಮೆ ದರದ ವಸತಿ ಮತ್ತು ಸಾರಿಗೆ ಆರಿಸಿ.',
    v_insufficient: 'ಬಜೆಟ್ ಸಾಕಾಗುವುದಿಲ್ಲ: ಕಡಿಮೆ ವೆಚ್ಚದ ಅಂದಾಜೇ {lo}. ಸುಮಾರು {gap} ಹೆಚ್ಚಿಸಿ, ದಿನಗಳನ್ನು ಕಡಿಮೆ ಮಾಡಿ, ಅಥವಾ ದೂರದ ನಿಲುಗಡೆಗಳನ್ನು ತೆಗೆಯಿರಿ.',
    w_more_stops: 'ದಿನಗಳಿಗಿಂತ ನಿಲುಗಡೆಗಳು ಹೆಚ್ಚಿರುವುದರಿಂದ ಪ್ರವಾಸವನ್ನು {n} ದಿನಗಳಿಗೆ ವಿಸ್ತರಿಸಲಾಗಿದೆ.',
    w_access: '{place}ನಲ್ಲಿ ಮೆಟ್ಟಿಲುಗಳು ಅಥವಾ ಅಸಮ ನೆಲ ಇರಬಹುದು (ಸಂಪಾದಕೀಯ ಅಂದಾಜು).',
    w_long: '{place} ಗೆ ಪ್ರಯಾಣ ದೀರ್ಘವಾಗಿದೆ (ಸುಮಾರು {km} ಕಿ.ಮೀ). ವಿಶ್ರಾಂತಿ ನಿಲುಗಡೆ ಯೋಜಿಸಿ.',
    w_season: '{place}: {note}',
    w_verify: 'ಪ್ರಯಾಣದ ಮೊದಲು ದರಗಳು, ಹವಾಮಾನ, ತೆರೆಯುವ ಸಮಯ ಮತ್ತು ರಸ್ತೆ ಅಥವಾ ಪ್ರವೇಶ ಪರಿಸ್ಥಿತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಬೇಕು.',
    r_pack: 'ಪ್ಯಾಕಿಂಗ್ ಪಟ್ಟಿ', r_tips: 'ಪ್ರವಾಸ ಸಲಹೆಗಳು',
    a_print: 'ಮುದ್ರಿಸಿ', a_json: 'JSON ಡೌನ್‌ಲೋಡ್', a_txt: 'ಪಠ್ಯ ಡೌನ್‌ಲೋಡ್', a_share: 'ಹಂಚಿಕೊಳ್ಳಿ',
    t_ready: '{n} ನಿಲುಗಡೆಗಳೊಂದಿಗೆ ಯೋಜನೆ ಸಿದ್ಧ.', t_reset: 'ಪ್ರವಾಸ ಮರುಹೊಂದಿಸಲಾಗಿದೆ.', t_sample: 'ಮಾದರಿ ಪ್ರವಾಸ ಲೋಡ್ ಆಗಿದೆ.',
    t_downloaded: 'ಡೌನ್‌ಲೋಡ್ ಆರಂಭವಾಗಿದೆ.', t_copied: 'ಪ್ರವಾಸದ ಸಾರಾಂಶವನ್ನು ಕ್ಲಿಪ್‌ಬೋರ್ಡ್‌ಗೆ ನಕಲಿಸಲಾಗಿದೆ.',
    t_share_fail: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಲು ಸಾಧ್ಯವಿಲ್ಲ.', t_moved: '{place} ಅನ್ನು {n}ನೇ ಸ್ಥಾನಕ್ಕೆ ಸರಿಸಲಾಗಿದೆ.',
    t_removed: '{place} ತೆಗೆಯಲಾಗಿದೆ.', t_added: '{place} ಸೇರಿಸಲಾಗಿದೆ.', t_last_stop: 'ಕನಿಷ್ಠ ಒಂದು ನಿಲುಗಡೆ ಇರಲಿ.',
    t_wish_added: '{place} ಅನ್ನು ನಿಮ್ಮ ಪ್ರವಾಸದ ಆಯ್ಕೆಗೆ ಸೇರಿಸಲಾಗಿದೆ.', t_wish_removed: '{place} ಅನ್ನು ನಿಮ್ಮ ಪ್ರವಾಸದ ಆಯ್ಕೆಯಿಂದ ತೆಗೆಯಲಾಗಿದೆ.',
    t_optimised: 'ಮಾರ್ಗದ ಕ್ರಮ ಸುಧಾರಿಸಲಾಗಿದೆ.', t_quick: 'ವಿವರಗಳನ್ನು ಯೋಜಕಕ್ಕೆ ನಕಲಿಸಲಾಗಿದೆ.',
    cul_title: 'ರುಚಿ, ಪರಂಪರೆ ಮತ್ತು ಭಾಷೆ',
    cul_sub: 'ಇಲ್ಲಿ ಕನ್ನಡ ಹೆಚ್ಚುವರಿ ಅಲ್ಲ; ಪ್ರವಾಸದ ಕಥೆಯನ್ನು ಹೇಳುವ ಭಾಷೆಯೇ ಅದು.',
    cul_food: 'ಸವಿಯಲೇಬೇಕಾದ ಸ್ಥಳೀಯ ಆಹಾರ', cul_heritage: 'ಸ್ಮಾರಕಗಳ ಹಿಂದಿನ ರಾಜವಂಶಗಳು',
    cul_phrases: 'ಉಪಯುಕ್ತ ಕನ್ನಡ ವಾಕ್ಯಗಳು', cul_resp: 'ಜವಾಬ್ದಾರಿಯುತ ಪ್ರವಾಸೋದ್ಯಮ',
    ab_title: 'ವಿವರಿಸಬಹುದಾದ ಪಾರದರ್ಶಕ ಎಂಜಿನ್',
    ab_sub: 'ಯಾವುದೇ ಗುಪ್ತ ಎಐ ಇಲ್ಲ, ಕಲ್ಪಿತ ದತ್ತಾಂಶವೂ ಇಲ್ಲ. ಬಟನ್ ಒತ್ತಿದಾಗ ಏನಾಗುತ್ತದೆ ಎಂಬುದು ಇಲ್ಲಿದೆ.',
    s1_t: 'ಅಂಕ ನೀಡಿಕೆ', s1_d: 'ನಿಮ್ಮ ಆಸಕ್ತಿ, ಇಷ್ಟದ ಸ್ಥಳ, ಬಜೆಟ್ ಹೊಂದಾಣಿಕೆ, ಆರಂಭಿಕ ನಗರದಿಂದ ದೂರ, ಮತ್ತು ಕುಟುಂಬ ಅಥವಾ ಪ್ರವೇಶ ಅಗತ್ಯಗಳಿಗೆ ಅನುಗುಣವಾಗಿ ಪ್ರತಿ ಸ್ಥಳಕ್ಕೆ ಅಂಕ ನೀಡಲಾಗುತ್ತದೆ.',
    s2_t: 'ಆಯ್ಕೆ', s2_d: 'ನಿಲುಗಡೆಗಳ ಸಂಖ್ಯೆ ನಿಮ್ಮ ದಿನಗಳು ಮತ್ತು ವೇಗದ ಮೇಲೆ ಅವಲಂಬಿತ. ಹೆಚ್ಚು ಅಂಕದ ಸ್ಥಳಗಳನ್ನು ಆರಿಸಿ, ಒಂದೇ ರೀತಿಯವುಗಳನ್ನು ತಪ್ಪಿಸುತ್ತದೆ.',
    s3_t: 'ಮಾರ್ಗ', s3_d: 'ಆರಂಭಿಕ ನಗರದಿಂದ ಹತ್ತಿರದ ಸ್ಥಳದ ಕ್ರಮದಲ್ಲಿ ನಿಲುಗಡೆಗಳನ್ನು ಜೋಡಿಸಲಾಗುತ್ತದೆ, ಮತ್ತು ಸೂಚಿತ ಅವಧಿಗೆ ಅನುಗುಣವಾಗಿ ದಿನಗಳನ್ನು ಹಂಚಲಾಗುತ್ತದೆ.',
    s4_t: 'ವೆಚ್ಚ', s4_d: 'ವಸತಿ, ಸಾರಿಗೆ, ಊಟ, ಚಟುವಟಿಕೆ ಮತ್ತು 8% ಹೆಚ್ಚುವರಿ ನಿಧಿಯನ್ನು ಕಡಿಮೆ, ಮಧ್ಯಮ ಮತ್ತು ಹೆಚ್ಚಿನ ಯೋಜನಾ ದರಗಳಲ್ಲಿ ಕೂಡಿಸಲಾಗುತ್ತದೆ.',
    s5_t: 'ಪ್ರಾಮಾಣಿಕತೆ', s5_d: 'ಬಜೆಟ್ ತೀರಾ ಕಡಿಮೆಯಿದ್ದರೆ, ಯೋಜನೆ ಹೊಂದುತ್ತದೆ ಎಂದು ನಟಿಸದೆ ಅಪ್ಲಿಕೇಶನ್ ಅದನ್ನು ಹೇಳುತ್ತದೆ.',
    ab_limits: 'ದತ್ತಾಂಶ ಮಿತಿಗಳು', ab_ready: 'ನಂತರ ನಿಜವಾದ ಎಐಗೆ ಸಿದ್ಧ',
    ab_ready_text: 'ಯೋಜಕವನ್ನು ದತ್ತಾಂಶ, ಎಂಜಿನ್ ಮತ್ತು ಪ್ರದರ್ಶನ ಎಂಬ ಪ್ರತ್ಯೇಕ ಪದರಗಳಲ್ಲಿ ರಚಿಸಲಾಗಿದೆ. ಅದೇ ರೂಪದ ಯೋಜನೆ ನೀಡುವ ಸುರಕ್ಷಿತ ಬ್ಯಾಕ್‌ಎಂಡ್ ಹಿಂದೆ ನಿಜವಾದ ಎಐ ಮಾದರಿಯನ್ನು ನಂತರ ಸೇರಿಸಬಹುದು. ಎಪಿಐ ಕೀಗಳನ್ನು ಬ್ರೌಸರ್ ಕೋಡ್‌ನಲ್ಲಿ ಎಂದಿಗೂ ಇಡಬಾರದು.',
    ab_credits: 'ಶ್ರೇಯಸ್ಸು',
    ab_credits_text: 'ಹ್ಯಾಕಥಾನ್‌ಗಾಗಿ ಬಿಸಿಎ ವಿದ್ಯಾರ್ಥಿ ರಚಿಸಿದ್ದು. ಬದಲಿ ಚಿತ್ರಗಳು ಮೂಲ ಎಸ್‌ವಿಜಿ ರೇಖಾಚಿತ್ರಗಳು. ಗಮ್ಯಸ್ಥಾನದ ಫೋಟೋಗಳನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದಾಗ ವಿಕಿಪೀಡಿಯ ಮತ್ತು ವಿಕಿಮೀಡಿಯಾ ಕಾಮನ್ಸ್‌ನಿಂದ ಲೋಡ್ ಮಾಡಲಾಗುತ್ತದೆ; ಪ್ರತಿ ಫೋಟೋ ಅದರ ಕಾಮನ್ಸ್ ಪುಟದಲ್ಲಿರುವ ಪರವಾನಗಿಯಡಿ ಅದರ ಸೃಷ್ಟಿಕರ್ತರಿಗೆ ಸೇರಿದೆ. ಅಕ್ಷರಶೈಲಿಗಳು: ಗೂಗಲ್ ಫಾಂಟ್ಸ್‌ನ Fraunces, Hanken Grotesk ಮತ್ತು ನೊಟೊ ಕನ್ನಡ.',
    photo_credit: 'ಫೋಟೋ: ವಿಕಿಪೀಡಿಯ',
    m_title: 'ನಕ್ಷೆ ಮತ್ತು ಪ್ರಯಾಣ ಮಾರ್ಗಗಳು',
    m_sub: 'ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಲು ಪ್ರಯಾಣ ವಿಧಾನ ಆರಿಸಿ. ರಸ್ತೆ ದತ್ತಾಂಶ ಎಂದು ಗುರುತಿಸದ ಹೊರತು ಸಮಯ ಮತ್ತು ವೆಚ್ಚ ಅಂದಾಜು.',
    mode_car: 'ಕಾರು', mode_bus: 'ಬಸ್', mode_plane: 'ವಿಮಾನ', mode_walk: 'ನಡಿಗೆ',
    m_loading: 'ನಕ್ಷೆ ಲೋಡ್ ಆಗುತ್ತಿದೆ...', m_offline: 'ಸಂವಾದಾತ್ಮಕ ನಕ್ಷೆಗೆ ಇಂಟರ್ನೆಟ್ ಬೇಕು. ಕೆಳಗಿನ ಕೋಷ್ಟಕ ಈಗಲೂ ಕೆಲಸ ಮಾಡುತ್ತದೆ.',
    m_leg: 'ಹಂತ', m_distance: 'ದೂರ', m_car: 'ಕಾರು', m_bus: 'ಬಸ್', m_plane: 'ವಿಮಾನ', m_links: 'ನಕ್ಷೆ ತೆರೆಯಿರಿ',
    m_row: '{from} ನಿಂದ {to} ಗೆ', m_hm: '{h} ಗಂ {m} ನಿಮಿ', m_pp: 'ವ್ಯಕ್ತಿಗೆ', m_live: 'ರಸ್ತೆ ದತ್ತಾಂಶ', m_estimated: 'ಅಂದಾಜು',
    m_car_note: 'ಕಾರಿನ ವೆಚ್ಚವನ್ನು 4 ಜನರ ವಾಹನದಲ್ಲಿ ಹಂಚಲಾಗಿದೆ (ಪ್ರತಿ ಕಿ.ಮೀ.ಗೆ ₹12 ಎಂಬ ಊಹೆ). ಲಭ್ಯವಿದ್ದರೆ ಸಮಯಕ್ಕೆ ರಸ್ತೆ ದತ್ತಾಂಶ ಬಳಸಲಾಗುತ್ತದೆ.',
    m_bus_note: 'ಬಸ್ ವೆಚ್ಚ: ಪ್ರತಿ ಕಿ.ಮೀ.ಗೆ ವ್ಯಕ್ತಿಗೆ ₹1.5 ರಿಂದ ₹3 ಎಂಬ ಊಹೆ, ಕಾರಿಗಿಂತ ಸುಮಾರು 30% ಹೆಚ್ಚು ಸಮಯ. ಕೆಎಸ್‌ಆರ್‌ಟಿಸಿ ಮತ್ತು ಖಾಸಗಿ ಬಸ್ ವೇಳೆ ಪರಿಶೀಲಿಸಿ.',
    m_plane_note: 'ನಮ್ಮ ಪಟ್ಟಿಯಲ್ಲಿ ಎರಡೂ ಸ್ಥಳಗಳಿಗೆ ವಿಮಾನ ನಿಲ್ದಾಣ ಇದ್ದು 150 ಕಿ.ಮೀ. ಅಥವಾ ಹೆಚ್ಚು ದೂರವಿದ್ದರೆ ಮಾತ್ರ ತೋರಿಸಲಾಗುತ್ತದೆ. ನಿಜವಾದ ವಿಮಾನ ಮತ್ತು ದರಕ್ಕಾಗಿ ವಿಮಾನಯಾನ ಸಂಸ್ಥೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
    m_walk_note: 'ನಗರಗಳ ನಡುವೆ ನಡೆಯುವುದು ಪ್ರಾಯೋಗಿಕವಲ್ಲ. ದಿನವಾರು ಯೋಜನೆಯಲ್ಲಿರುವ ನಡಿಗೆ ಲಿಂಕ್‌ಗಳನ್ನು ಬಳಸಿ.',
    m_plane_none: 'ವಿಮಾನ ನಿಲ್ದಾಣ ಮಾಹಿತಿ ಇಲ್ಲ', m_price_varies: 'ದರ ಬದಲಾಗುತ್ತದೆ', m_flights: 'ವಿಮಾನ ಹುಡುಕಿ', m_drive: 'ಕಾರಿನ ಮಾರ್ಗ', m_transit: 'ಬಸ್ ಅಥವಾ ರೈಲು ಮಾರ್ಗ',
    m_walk_day: 'ಇಂದಿನ ಸ್ಥಳಗಳ ನಡುವಿನ ನಡಿಗೆ ಮಾರ್ಗ', m_walk_list: 'ದಿನವಾರು ನಡಿಗೆ ಮಾರ್ಗಗಳು',

    ft_tag: 'ಕನ್ನಡದಲ್ಲಿ ನಿಮ್ಮ ಕರ್ನಾಟಕ ಪ್ರವಾಸದ ಸಂಗಾತಿ', ft_text: 'ಕೋಡ್. ಸೃಷ್ಟಿಸಿ. ಕನ್ನಡವನ್ನು ಸಂಭ್ರಮಿಸಿ.'
  }
};

// Bilingual content lists (kept as data, drawn by the UI)
const FOODS = [
  { en: 'Mysore Pak', kn: 'ಮೈಸೂರು ಪಾಕ್', d: { en: 'A ghee-rich sweet associated with Mysuru.', kn: 'ಮೈಸೂರಿಗೆ ಸಂಬಂಧಿಸಿದ ತುಪ್ಪದ ಸಿಹಿ.' } },
  { en: 'Bisi bele bath', kn: 'ಬಿಸಿಬೇಳೆ ಬಾತ್', d: { en: 'A spiced rice and lentil one-pot dish.', kn: 'ಮಸಾಲೆ ಅನ್ನ ಮತ್ತು ಬೇಳೆಯ ಒಂದೇ ಪಾತ್ರೆಯ ಖಾದ್ಯ.' } },
  { en: 'Ragi mudde', kn: 'ರಾಗಿ ಮುದ್ದೆ', d: { en: 'Finger-millet balls eaten with saaru or curry.', kn: 'ಸಾರು ಅಥವಾ ಪಲ್ಯದೊಂದಿಗೆ ಸವಿಯುವ ರಾಗಿಯ ಮುದ್ದೆ.' } },
  { en: 'Neer dosa', kn: 'ನೀರ್ ದೋಸೆ', d: { en: 'Thin, lacy rice crepes popular on the coast.', kn: 'ಕರಾವಳಿಯಲ್ಲಿ ಜನಪ್ರಿಯವಾದ ತೆಳು ಅಕ್ಕಿ ದೋಸೆ.' } },
  { en: 'Jolada rotti', kn: 'ಜೋಳದ ರೊಟ್ಟಿ', d: { en: 'Sorghum flatbread, a staple of North Karnataka meals.', kn: 'ಜೋಳದ ರೊಟ್ಟಿ, ಉತ್ತರ ಕರ್ನಾಟಕದ ಊಟದ ಮುಖ್ಯ ಭಾಗ.' } },
  { en: 'Dharwad pedha', kn: 'ಧಾರವಾಡ ಪೇಡಾ', d: { en: 'A milk sweet from Dharwad.', kn: 'ಧಾರವಾಡದ ಹಾಲಿನ ಸಿಹಿ.' } }
];
const DYNASTIES = [
  { en: 'Chalukyas', kn: 'ಚಾಲುಕ್ಯರು', p: { en: 'Badami, Pattadakal', kn: 'ಬಾದಾಮಿ, ಪಟ್ಟದಕಲ್ಲು' }, d: { en: 'Early rock-cut and structural temples.', kn: 'ಆರಂಭಿಕ ಗುಹಾ ಮತ್ತು ರಚನಾತ್ಮಕ ದೇವಾಲಯಗಳು.' } },
  { en: 'Hoysalas', kn: 'ಹೊಯ್ಸಳರು', p: { en: 'Belur, Halebidu', kn: 'ಬೇಲೂರು, ಹಳೇಬೀಡು' }, d: { en: 'Star-shaped temples with fine soapstone carving.', kn: 'ನಕ್ಷತ್ರಾಕಾರದ ದೇವಾಲಯಗಳು, ಸೂಕ್ಷ್ಮ ಶಿಲ್ಪಕಲೆ.' } },
  { en: 'Vijayanagara', kn: 'ವಿಜಯನಗರ', p: { en: 'Hampi', kn: 'ಹಂಪಿ' }, d: { en: 'Capital of a powerful empire, now ruins in Hampi.', kn: 'ಶಕ್ತಿಶಾಲಿ ಸಾಮ್ರಾಜ್ಯದ ರಾಜಧಾನಿ; ಈಗ ಹಂಪಿಯಲ್ಲಿ ಅವಶೇಷಗಳು.' } },
  { en: 'Wodeyars', kn: 'ಒಡೆಯರು', p: { en: 'Mysuru', kn: 'ಮೈಸೂರು' }, d: { en: 'Rulers of Mysore, patrons of arts and the Dasara festival.', kn: 'ಮೈಸೂರಿನ ಅರಸರು; ಕಲೆ ಮತ್ತು ದಸರಾ ಉತ್ಸವದ ಪೋಷಕರು.' } }
];
const PHRASES = [
  { kn: 'ನಮಸ್ಕಾರ', rom: 'Namaskara', en: 'Hello' },
  { kn: 'ಧನ್ಯವಾದಗಳು', rom: 'Dhanyavadagalu', en: 'Thank you' },
  { kn: 'ಇದು ಎಷ್ಟು?', rom: 'Idu eshtu?', en: 'How much is this?' },
  { kn: 'ಬಸ್ ನಿಲ್ದಾಣ ಎಲ್ಲಿದೆ?', rom: 'Bus nildana ellide?', en: 'Where is the bus stand?' },
  { kn: 'ನನಗೆ ಸಹಾಯ ಬೇಕು', rom: 'Nanage sahaya beku', en: 'I need help' },
  { kn: 'ತುಂಬಾ ರುಚಿಯಾಗಿದೆ', rom: 'Tumba ruchiyagide', en: 'It is very tasty' },
  { kn: 'ಸ್ವಲ್ಪ ನಿಧಾನವಾಗಿ ಹೇಳಿ', rom: 'Swalpa nidhanavagi heli', en: 'Please speak a little slowly' },
  { kn: 'ನೀರು ಬೇಕು', rom: 'Neeru beku', en: 'I need water' },
  { kn: 'ಹೋಗೋಣ', rom: 'Hogona', en: "Let's go" },
  { kn: 'ಕ್ಷಮಿಸಿ', rom: 'Kshamisi', en: 'Excuse me / sorry' }
];
const PHRASE_MEANING_KN = ['ನಮಸ್ಕಾರ', 'ಧನ್ಯವಾದಗಳು', 'ಬೆಲೆ ಕೇಳಲು', 'ಬಸ್ ನಿಲ್ದಾಣದ ದಾರಿ ಕೇಳಲು', 'ಸಹಾಯ ಕೇಳಲು', 'ಊಟ ಮೆಚ್ಚಿದಾಗ', 'ನಿಧಾನವಾಗಿ ಮಾತನಾಡಲು ಕೇಳಲು', 'ಕುಡಿಯುವ ನೀರು ಕೇಳಲು', 'ಹೊರಡೋಣ ಎನ್ನಲು', 'ಕ್ಷಮೆ ಕೇಳಲು ಅಥವಾ ಗಮನ ಸೆಳೆಯಲು'];
const RESPONSIBLE = [
  { en: 'Carry your waste back and avoid single-use plastic, especially at waterfalls, beaches and forests.', kn: 'ನಿಮ್ಮ ಕಸವನ್ನು ವಾಪಸ್ ತೆಗೆದುಕೊಂಡು ಹೋಗಿ; ವಿಶೇಷವಾಗಿ ಜಲಪಾತ, ಕಡಲತೀರ ಮತ್ತು ಕಾಡುಗಳಲ್ಲಿ ಒಮ್ಮೆ ಬಳಸಿ ಎಸೆಯುವ ಪ್ಲಾಸ್ಟಿಕ್ ಬೇಡ.' },
  { en: 'Dress modestly at temples and follow local rules about footwear and photography.', kn: 'ದೇವಾಲಯಗಳಲ್ಲಿ ಸಭ್ಯ ಉಡುಪು ಧರಿಸಿ; ಪಾದರಕ್ಷೆ ಮತ್ತು ಛಾಯಾಗ್ರಹಣದ ಸ್ಥಳೀಯ ನಿಯಮಗಳನ್ನು ಪಾಲಿಸಿ.' },
  { en: 'Ask before photographing people, and respect private homes and worship.', kn: 'ಜನರ ಫೋಟೋ ತೆಗೆಯುವ ಮೊದಲು ಅನುಮತಿ ಕೇಳಿ; ಖಾಸಗಿ ಮನೆಗಳು ಮತ್ತು ಪೂಜೆಯನ್ನು ಗೌರವಿಸಿ.' },
  { en: 'Do not touch or climb protected monuments, and keep to marked paths.', kn: 'ರಕ್ಷಿತ ಸ್ಮಾರಕಗಳನ್ನು ಮುಟ್ಟಬೇಡಿ, ಹತ್ತಬೇಡಿ; ಗುರುತಿಸಿದ ಹಾದಿಯಲ್ಲೇ ನಡೆಯಿರಿ.' },
  { en: 'Support local homestays, guides, artisans and small eateries.', kn: 'ಸ್ಥಳೀಯ ಹೋಮ್‌ಸ್ಟೇ, ಮಾರ್ಗದರ್ಶಿಗಳು, ಕುಶಲಕರ್ಮಿಗಳು ಮತ್ತು ಸಣ್ಣ ಹೋಟೆಲ್‌ಗಳನ್ನು ಬೆಂಬಲಿಸಿ.' },
  { en: 'Follow safety signs at waterfalls and beaches, and keep a respectful distance from wildlife.', kn: 'ಜಲಪಾತ ಮತ್ತು ಕಡಲತೀರಗಳಲ್ಲಿ ಸುರಕ್ಷತಾ ಫಲಕಗಳನ್ನು ಪಾಲಿಸಿ; ವನ್ಯಜೀವಿಗಳಿಂದ ಗೌರವಯುತ ಅಂತರ ಕಾಯ್ದುಕೊಳ್ಳಿ.' }
];
const LIMITS = [
  { en: 'Costs are team planning ranges, not live prices.', kn: 'ವೆಚ್ಚಗಳು ತಂಡದ ಯೋಜನಾ ಶ್ರೇಣಿಗಳು, ಲೈವ್ ದರಗಳಲ್ಲ.' },
  { en: 'Distances are straight-line estimates with a road factor. There are no live transport schedules.', kn: 'ದೂರಗಳು ರಸ್ತೆ ಅಂಶದೊಂದಿಗೆ ನೇರ ದೂರದ ಅಂದಾಜು. ಲೈವ್ ಸಾರಿಗೆ ವೇಳಾಪಟ್ಟಿ ಇಲ್ಲ.' },
  { en: 'No ratings, opening hours or availability are shown.', kn: 'ರೇಟಿಂಗ್, ತೆರೆಯುವ ಸಮಯ ಅಥವಾ ಲಭ್ಯತೆಯನ್ನು ತೋರಿಸುವುದಿಲ್ಲ.' },
  { en: 'Official links are limited to the Karnataka Tourism portal and UNESCO pages. Please verify before travel.', kn: 'ಅಧಿಕೃತ ಲಿಂಕ್‌ಗಳು ಕರ್ನಾಟಕ ಪ್ರವಾಸೋದ್ಯಮ ಪೋರ್ಟಲ್ ಮತ್ತು ಯುನೆಸ್ಕೋ ಪುಟಗಳಿಗೆ ಸೀಮಿತ. ಪ್ರಯಾಣದ ಮೊದಲು ಪರಿಶೀಲಿಸಿ.' },
  { en: 'Accessibility and interest ratings are editorial estimates by the team.', kn: 'ಪ್ರವೇಶ ಸುಲಭತೆ ಮತ್ತು ಆಸಕ್ತಿ ರೇಟಿಂಗ್‌ಗಳು ತಂಡದ ಸಂಪಾದಕೀಯ ಅಂದಾಜುಗಳು.' },
  { en: 'The Kannada text should be reviewed by a native speaker before final submission.', kn: 'ಅಂತಿಮ ಸಲ್ಲಿಕೆಯ ಮೊದಲು ಕನ್ನಡ ಪಠ್ಯವನ್ನು ಕನ್ನಡ ಮಾತೃಭಾಷಿಕರು ಪರಿಶೀಲಿಸಬೇಕು.' },
  { en: 'Photos load from Wikipedia and Wikimedia Commons when you are online. Offline, original illustrations are shown instead.', kn: 'ಆನ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದಾಗ ಫೋಟೋಗಳು ವಿಕಿಪೀಡಿಯ ಮತ್ತು ವಿಕಿಮೀಡಿಯಾ ಕಾಮನ್ಸ್‌ನಿಂದ ಲೋಡ್ ಆಗುತ್ತವೆ. ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಬದಲಿಗೆ ಮೂಲ ಚಿತ್ರಗಳು ಕಾಣಿಸುತ್ತವೆ.' },
  { en: 'Maps use OpenStreetMap data. Road distances and times come from the public OSRM demo server when online, and are estimates otherwise. Plane options are guides only, not flight schedules.', kn: 'ನಕ್ಷೆಗಳು ಓಪನ್‌ಸ್ಟ್ರೀಟ್‌ಮ್ಯಾಪ್ ದತ್ತಾಂಶ ಬಳಸುತ್ತವೆ. ರಸ್ತೆ ದೂರ ಮತ್ತು ಸಮಯ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಸಾರ್ವಜನಿಕ OSRM ಡೆಮೊ ಸರ್ವರ್‌ನಿಂದ ಬರುತ್ತವೆ; ಇಲ್ಲದಿದ್ದರೆ ಅಂದಾಜು. ವಿಮಾನ ಆಯ್ಕೆಗಳು ಮಾರ್ಗದರ್ಶಿ ಮಾತ್ರ, ವಿಮಾನ ವೇಳಾಪಟ್ಟಿಯಲ್ಲ.' },
  { en: 'This is a prototype. The engine is rule-based, not a live AI model.', kn: 'ಇದು ಮೂಲಮಾದರಿ. ಎಂಜಿನ್ ನಿಯಮಾಧಾರಿತ, ಲೈವ್ ಎಐ ಮಾದರಿಯಲ್ಲ.' }
];
const TIPS = [
  { en: 'Book trains and buses early for weekends and festival periods.', kn: 'ವಾರಾಂತ್ಯ ಮತ್ತು ಹಬ್ಬದ ಸಮಯದಲ್ಲಿ ರೈಲು ಮತ್ತು ಬಸ್ ಮುಂಚಿತವಾಗಿ ಕಾಯ್ದಿರಿಸಿ.' },
  { en: 'Start early at outdoor and heritage sites to avoid heat and crowds.', kn: 'ಬಿಸಿಲು ಮತ್ತು ಜನಜಂಗುಳಿ ತಪ್ಪಿಸಲು ಹೊರಾಂಗಣ ಮತ್ತು ಪರಂಪರೆ ತಾಣಗಳಿಗೆ ಬೇಗ ಹೊರಡಿ.' },
  { en: 'Confirm opening days and ticket rules on the official site or at the venue.', kn: 'ತೆರೆಯುವ ದಿನಗಳು ಮತ್ತು ಟಿಕೆಟ್ ನಿಯಮಗಳನ್ನು ಅಧಿಕೃತ ತಾಣದಲ್ಲಿ ಅಥವಾ ಸ್ಥಳದಲ್ಲಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.' },
  { en: 'Keep a time buffer on hill and ghat roads. Travel can be slower than expected.', kn: 'ಬೆಟ್ಟ ಮತ್ತು ಘಟ್ಟ ರಸ್ತೆಗಳಲ್ಲಿ ಹೆಚ್ಚುವರಿ ಸಮಯ ಇಟ್ಟುಕೊಳ್ಳಿ. ಪ್ರಯಾಣ ನಿರೀಕ್ಷೆಗಿಂತ ನಿಧಾನವಾಗಬಹುದು.' },
  { en: 'Learn a few Kannada phrases. Locals appreciate the effort.', kn: 'ಕೆಲವು ಕನ್ನಡ ವಾಕ್ಯಗಳನ್ನು ಕಲಿಯಿರಿ. ಸ್ಥಳೀಯರು ಪ್ರಯತ್ನವನ್ನು ಮೆಚ್ಚುತ್ತಾರೆ.' },
  { en: 'Share your plan with family and keep emergency contacts handy.', kn: 'ನಿಮ್ಮ ಯೋಜನೆಯನ್ನು ಕುಟುಂಬದೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ; ತುರ್ತು ಸಂಪರ್ಕಗಳನ್ನು ಕೈಯಲ್ಲಿ ಇಟ್ಟುಕೊಳ್ಳಿ.' }
];
// `when` lists the interests that make an item useful. No `when` means always included.
const PACKING = [
  { en: 'Photo ID and ticket copies', kn: 'ಫೋಟೋ ಗುರುತಿನ ಚೀಟಿ ಮತ್ತು ಟಿಕೆಟ್ ಪ್ರತಿಗಳು' },
  { en: 'Refillable water bottle', kn: 'ಮರುಬಳಕೆಯ ನೀರಿನ ಬಾಟಲಿ' },
  { en: 'Comfortable walking shoes', kn: 'ಆರಾಮದಾಯಕ ನಡಿಗೆ ಶೂ ಅಥವಾ ಚಪ್ಪಲಿ' },
  { en: 'Power bank and charger', kn: 'ಪವರ್ ಬ್ಯಾಂಕ್ ಮತ್ತು ಚಾರ್ಜರ್' },
  { en: 'Some cash and a UPI-ready phone', kn: 'ಸ್ವಲ್ಪ ನಗದು ಮತ್ತು ಯುಪಿಐ ಸಿದ್ಧ ಫೋನ್' },
  { en: 'Basic first-aid kit and personal medicines', kn: 'ಪ್ರಾಥಮಿಕ ಚಿಕಿತ್ಸಾ ಕಿಟ್ ಮತ್ತು ವೈಯಕ್ತಿಕ ಔಷಧಿಗಳು' },
  { en: 'Sunscreen and a hat', kn: 'ಸನ್‌ಸ್ಕ್ರೀನ್ ಮತ್ತು ಟೋಪಿ' },
  { en: 'Modest clothing for temples', kn: 'ದೇವಾಲಯಗಳಿಗೆ ಸಭ್ಯ ಉಡುಪು', when: ['temples', 'heritage'] },
  { en: 'Socks for hot stone floors', kn: 'ಬಿಸಿ ಕಲ್ಲಿನ ನೆಲಕ್ಕೆ ಸಾಕ್ಸ್', when: ['temples', 'heritage'] },
  { en: 'Rain jacket', kn: 'ಮಳೆ ಕೋಟ್', when: ['waterfalls', 'nature', 'adventure'] },
  { en: 'Non-slip footwear', kn: 'ಜಾರದ ಪಾದರಕ್ಷೆ', when: ['waterfalls', 'nature', 'adventure'] },
  { en: 'Insect repellent', kn: 'ಕೀಟ ನಿವಾರಕ', when: ['nature', 'wildlife', 'waterfalls'] },
  { en: 'Swimwear and a quick-dry towel', kn: 'ಈಜುಡುಗೆ ಮತ್ತು ಬೇಗ ಒಣಗುವ ಟವೆಲ್', when: ['beaches'] },
  { en: 'Binoculars (optional)', kn: 'ದುರ್ಬೀನು (ಐಚ್ಛಿಕ)', when: ['wildlife'] },
  { en: 'Spare memory card', kn: 'ಹೆಚ್ಚುವರಿ ಮೆಮೊರಿ ಕಾರ್ಡ್', when: ['photography'] },
  { en: 'Sturdy trekking shoes', kn: 'ಗಟ್ಟಿಮುಟ್ಟಾದ ಚಾರಣ ಶೂ', when: ['adventure'] }
];

/* =====================================================================
   3. ENGINE (pure logic, no DOM)
   ===================================================================== */

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const getDest = id => DESTINATIONS.find(d => d.id === id);
const getPoint = id => START_CITIES.find(c => c.id === id) || getDest(id);

/** Straight-line distance between two {lat,lng} points (haversine formula), in km. */
function haversineKm(a, b) {
  const R = 6371, rad = d => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
/** Rough road distance: straight line times RATE.roadFactor. */
const roadKm = (a, b) => Math.round(haversineKm(a, b) * RATE.roadFactor);
const hoursFor = km => Math.round((km / RATE.avgSpeedKmh) * 10) / 10;

/** Pick the low / mid / high value of a [low, high] range. */
function rateOf(range, level) {
  if (level === 'low') return range[0];
  if (level === 'high') return range[1];
  return (range[0] + range[1]) / 2;
}

/** Cost per person per day at a destination (stay is shared: 2 people per room). */
function dailyCostPerPerson(dest, travellers, level) {
  const rooms = Math.ceil(travellers / 2);
  return (rateOf(dest.cost.stay, level) * rooms) / travellers + rateOf(dest.cost.food, level) + rateOf(dest.cost.act, level);
}

/**
 * Validate raw form values. Returns { ok, errors, values }.
 * `errors` maps a field name to a translation key, so the UI can show it in either language.
 */
function validateTripInputs(raw) {
  const errors = {};
  const days = Number(raw.days), travellers = Number(raw.travellers), budget = Number(raw.budget);

  if (!START_CITIES.some(c => c.id === raw.startCity)) errors.start = 'e_start';
  if (String(raw.days).trim() === '' || !Number.isInteger(days) || days < 1 || days > 14) errors.days = 'e_days';
  if (String(raw.travellers).trim() === '' || !Number.isInteger(travellers) || travellers < 1 || travellers > 20) errors.travellers = 'e_trav';
  if (String(raw.budget).trim() === '' || !Number.isFinite(budget) || budget < 2000 || budget > 1000000) errors.budget = 'e_budget';
  if (raw.startDate && Number.isNaN(Date.parse(raw.startDate))) errors.date = 'e_date';
  const interests = (raw.interests || []).filter(k => INTEREST_KEYS.includes(k));
  const preferred = (raw.preferred || []).filter(id => getDest(id));
  if (interests.length === 0 && preferred.length === 0) errors.interests = 'e_interest';

  const ok = Object.keys(errors).length === 0;
  const pace = PACE_DAYS_PER_STOP[raw.pace] ? raw.pace : 'balanced';
  return {
    ok, errors,
    values: ok ? {
      startCity: raw.startCity, days, travellers, budget: Math.round(budget), startDate: raw.startDate || '',
      interests, preferred, pace, accessibility: !!raw.accessibility, family: !!raw.family
    } : null
  };
}

/** Give one destination a score out of roughly 100 and remember WHY (for explanations). */
function scoreDestination(dest, inputs) {
  const start = getPoint(inputs.startCity);
  const reasons = { matched: [], preferred: false };
  let score = 0;

  // 1) Interests: up to 50 points. Each selected interest earns weight/3.
  if (inputs.interests.length) {
    let pts = 0;
    const weighted = [];
    inputs.interests.forEach(k => {
      const w = dest.interests[INTEREST_KEYS.indexOf(k)] || 0;
      pts += w;
      if (w >= 2) weighted.push({ k, w });
    });
    score += (pts / (3 * inputs.interests.length)) * 50;
    reasons.matched = weighted.sort((a, b) => b.w - a.w).slice(0, 3).map(x => x.k);
  } else {
    score += 25; // no interests chosen (only wishes): stay neutral
  }

  // 2) Wishes: +25 if the traveller asked for this place.
  if (inputs.preferred.includes(dest.id)) { score += 25; reasons.preferred = true; }

  // 3) Distance from the start city: up to -20, harsher for short trips.
  const km = roadKm(start, dest);
  score -= Math.min(20, (20 * km) / (inputs.days * 150));

  // 4) Budget fit: compare the destination's mid daily cost with ~75% of the budget per person per day.
  const groundBudget = (inputs.budget / (inputs.travellers * inputs.days)) * 0.75;
  const ratio = dailyCostPerPerson(dest, inputs.travellers, 'mid') / groundBudget;
  if (ratio > 1) score -= Math.min(15, (ratio - 1) * 25);
  else if (ratio < 0.8) score += 3;

  // 5) Family and accessibility preferences.
  if (inputs.family) score += (dest.interests[INTEREST_KEYS.indexOf('family')] / 3) * 10;
  if (inputs.accessibility) score += { easy: 4, moderate: -6, demanding: -20 }[dest.access];

  return { id: dest.id, score, km, reasons };
}

/** Order stop ids by nearest neighbour, starting from the start city. */
function orderByNearest(startCity, ids) {
  const left = [...ids];
  const ordered = [];
  let here = getPoint(startCity);
  while (left.length) {
    let best = 0;
    left.forEach((id, i) => { if (haversineKm(here, getDest(id)) < haversineKm(here, getDest(left[best]))) best = i; });
    const [next] = left.splice(best, 1);
    ordered.push(next);
    here = getDest(next);
  }
  return ordered;
}

/** Choose which destinations to visit. Returns an ordered array of ids. */
function selectStops(inputs) {
  const scores = new Map(DESTINATIONS.map(d => [d.id, scoreDestination(d, inputs)]));
  const start = getPoint(inputs.startCity);
  const target = clamp(Math.round(inputs.days / PACE_DAYS_PER_STOP[inputs.pace]), 1, MAX_STOPS);
  const count = Math.min(inputs.days, MAX_STOPS, Math.max(target, Math.min(inputs.preferred.length, MAX_STOPS)));

  const chosen = inputs.preferred.slice(0, count);
  const groupOf = id => (getDest(id).tags[0] || 'city');

  while (chosen.length < count) {
    let bestId = null, bestVal = -Infinity;
    DESTINATIONS.forEach(d => {
      if (chosen.includes(d.id)) return;
      let val = scores.get(d.id).score;
      // Closer to what is already chosen saves travel time: up to +8.
      const refs = chosen.length ? chosen.map(getDest) : [start];
      const nearest = Math.min(...refs.map(r => roadKm(r, d)));
      val += Math.max(0, 8 - nearest / 50);
      // Avoid repetition: -3 for each chosen stop of the same kind.
      val -= 3 * chosen.filter(id => groupOf(id) === groupOf(d.id)).length;
      if (val > bestVal) { bestVal = val; bestId = d.id; }
    });
    chosen.push(bestId);
  }
  return orderByNearest(inputs.startCity, chosen);
}

/** Share `totalDays` between stops using each stop's suggested duration. Every stop gets at least 1 day. */
function allocateDays(ids, totalDays) {
  const alloc = ids.map(() => 1);
  let remaining = totalDays - ids.length;
  while (remaining > 0) {
    let best = 0;
    ids.forEach((id, i) => { if (getDest(id).days / alloc[i] > getDest(ids[best]).days / alloc[best]) best = i; });
    alloc[best] += 1;
    remaining -= 1;
  }
  return alloc;
}

/** Add up the estimated costs for one price level: 'low' | 'mid' | 'high'. */
function computeCosts(stops, legs, inputs, totalDays, level) {
  const rooms = Math.ceil(inputs.travellers / 2);
  let stay = 0, food = 0, activities = 0;
  stops.forEach((s, i) => {
    const d = getDest(s.id);
    const nights = i === stops.length - 1 ? Math.max(0, s.days - 1) : s.days;
    stay += rateOf(d.cost.stay, level) * rooms * nights;
    food += rateOf(d.cost.food, level) * inputs.travellers * s.days;
    activities += rateOf(d.cost.act, level) * inputs.travellers * s.days;
  });
  const km = legs.reduce((sum, l) => sum + l.km, 0);
  const transport = km * RATE.transportPerKmPerPerson[level] * inputs.travellers
    + RATE.localPerDayPerPerson[level] * inputs.travellers * totalDays;
  const subtotal = stay + food + activities + transport;
  const contingency = subtotal * RATE.contingency;
  const r = Math.round;
  return { stay: r(stay), transport: r(transport), food: r(food), activities: r(activities), contingency: r(contingency), total: r(subtotal + contingency) };
}

/**
 * Build a full plan from an ORDERED list of stop ids. Used both for a fresh plan
 * and every time the traveller reorders, adds or removes a stop.
 */
function buildPlanFromStops(stopIds, inputs, meta = {}) {
  const addedIds = meta.addedIds || [];
  const warnings = [];
  const totalDays = Math.max(inputs.days, stopIds.length);
  if (totalDays > inputs.days) warnings.push({ code: 'more_stops', params: { n: totalDays } });

  const alloc = allocateDays(stopIds, totalDays);
  const start = getPoint(inputs.startCity);

  // Legs: start -> stop1 -> stop2 ... and a final return leg
  const legs = [];
  let prev = start, prevId = inputs.startCity;
  stopIds.forEach(id => {
    const km = roadKm(prev, getDest(id));
    legs.push({ fromId: prevId, toId: id, km, hours: hoursFor(km) });
    prev = getDest(id); prevId = id;
  });
  const retKm = roadKm(prev, start);
  const returnLeg = { fromId: prevId, toId: inputs.startCity, km: retKm, hours: hoursFor(retKm) };

  const stops = stopIds.map((id, i) => {
    const sc = scoreDestination(getDest(id), inputs);
    return {
      id, days: alloc[i], km: legs[i].km,
      why: { matched: sc.reasons.matched, preferred: inputs.preferred.includes(id), added: addedIds.includes(id) }
    };
  });

  // Day-by-day itinerary
  const days = [];
  let dayNo = 1;
  const startDate = inputs.startDate ? parseDate(inputs.startDate) : null;
  stops.forEach((s, i) => {
    const attractions = getDest(s.id).attractions;
    const n = attractions.length;
    for (let k = 0; k < s.days; k++) {
      const date = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + dayNo - 1) : null;
      days.push({
        n: dayNo, date, stopId: s.id,
        travel: k === 0 ? legs[i] : null,
        ret: i === stops.length - 1 && k === s.days - 1 ? returnLeg : null,
        items: [
          { slot: 'morning', idx: (2 * k) % n },
          { slot: 'afternoon', idx: (2 * k + 1) % n },
          { slot: 'evening', idx: null }
        ]
      });
      dayNo += 1;
    }
  });

  // Costs at three planning levels
  const allLegs = [...legs, returnLeg];
  const costs = {
    low: computeCosts(stops, allLegs, inputs, totalDays, 'low'),
    mid: computeCosts(stops, allLegs, inputs, totalDays, 'mid'),
    high: computeCosts(stops, allLegs, inputs, totalDays, 'high')
  };
  let verdict = 'comfortable';
  if (inputs.budget < costs.low.total) verdict = 'insufficient';
  else if (inputs.budget < costs.mid.total) verdict = 'tight';
  else if (inputs.budget < costs.high.total) verdict = 'fits';

  // Warnings: long legs, accessibility, season
  legs.forEach(l => { if (l.km > 400) warnings.push({ code: 'long', params: { id: l.toId, km: l.km } }); });
  stops.forEach(s => {
    const d = getDest(s.id);
    if (inputs.accessibility && d.access === 'demanding') warnings.push({ code: 'access', params: { id: s.id } });
    if (d.season && days.some(day => day.stopId === s.id && day.date && d.season.months.includes(day.date.getMonth() + 1))) {
      warnings.push({ code: 'season', params: { id: s.id } });
    }
  });

  return {
    engine: 'rule-based-v1', inputs, totalDays, stops, legs, returnLeg, days, costs,
    budget: inputs.budget, diff: inputs.budget - costs.mid.total, verdict, warnings
  };
}

/** Create a complete plan from validated inputs. */
function generatePlan(inputs) {
  return buildPlanFromStops(selectStops(inputs), inputs);
}

function parseDate(str) { // 'YYYY-MM-DD' -> local Date (avoids timezone shifts)
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const airportOf = id => AIRPORTS[id] || null;

/**
 * Ways to travel one leg. `road` is optional live data { km, minutes } from a routing
 * service; without it we fall back to the estimate stored on the leg.
 * Everything here is an ESTIMATE (assumptions are in RATE).
 */
function transportOptions(leg, travellers, road) {
  const from = getPoint(leg.fromId), to = getPoint(leg.toId);
  const km = road ? road.km : leg.km;
  const carMin = road ? road.minutes : Math.round((km / RATE.avgSpeedKmh) * 60);
  const vehicles = Math.ceil(travellers / 4);
  const carTotal = km * RATE.carPerKm * vehicles;
  const straight = haversineKm(from, to);
  const a = airportOf(leg.fromId), b = airportOf(leg.toId);
  const planeOk = !!(a && b && a !== b && straight >= 150);
  return {
    km, live: !!road,
    car: { minutes: carMin, total: Math.round(carTotal), perPerson: Math.round(carTotal / travellers) },
    bus: { minutes: Math.round(carMin * 1.3), perPerson: [Math.round(km * RATE.busPerKmPerPerson[0]), Math.round(km * RATE.busPerKmPerPerson[1])] },
    plane: planeOk ? { minutes: Math.round((straight / RATE.flightKmh) * 60 + RATE.airportOverheadMin), from: a, to: b } : null
  };
}

/** Small self-test you can run in the browser console: NammaEngine.selfTest() */
function selfTest() {
  const base = { startCity: 'bengaluru', days: 5, travellers: 2, budget: 30000, startDate: '', interests: ['heritage'], preferred: [], pace: 'balanced', accessibility: false, family: false };
  const results = [];
  const check = (name, ok) => { results.push({ name, ok }); if (typeof console !== 'undefined') console.log((ok ? 'PASS ' : 'FAIL ') + name); };

  const p1 = generatePlan(base);
  check('days are fully allocated', p1.days.length === p1.totalDays && p1.stops.reduce((a, s) => a + s.days, 0) === p1.totalDays);
  check('costs are ordered low <= mid <= high', p1.costs.low.total <= p1.costs.mid.total && p1.costs.mid.total <= p1.costs.high.total);
  const p2 = generatePlan({ ...base, interests: ['beaches', 'food'], startCity: 'mangaluru' });
  check('different interests give different stops', p1.stops.map(s => s.id).join() !== p2.stops.map(s => s.id).join());
  const p3 = generatePlan({ ...base, budget: 3000, days: 6 });
  check('tiny budget is flagged as insufficient', p3.verdict === 'insufficient');
  const rev = buildPlanFromStops([...p1.stops.map(s => s.id)].reverse(), base);
  check('reordering rebuilds the legs', rev.legs[0].toId === p1.stops[p1.stops.length - 1].id);
  check('validation rejects bad days', !validateTripInputs({ ...base, days: 0 }).ok);
  check('validation rejects no interests', !validateTripInputs({ ...base, interests: [] }).ok);
  const leg = { fromId: 'bengaluru', toId: 'hampi', km: 367, hours: 8.2 };
  const opt = transportOptions(leg, 5, null);
  check('car cost uses 2 vehicles for 5 travellers', opt.car.total === Math.round(367 * RATE.carPerKm * 2));
  check('plane offered for Bengaluru to Hampi (both have airports)', !!opt.plane);
  check('no plane for a leg without airport data', transportOptions({ fromId: 'bengaluru', toId: 'belur', km: 200, hours: 4 }, 2, null).plane === null);
  check('live road data replaces the estimate', transportOptions(leg, 2, { km: 340, minutes: 360 }).km === 340);
  return results;
}

/* =====================================================================
   4. UI (everything below touches the page)
   ===================================================================== */

const NammaEngine = { generatePlan, buildPlanFromStops, selectStops, scoreDestination, validateTripInputs, orderByNearest, allocateDays, computeCosts, transportOptions, airportOf, selfTest, DESTINATIONS, T };

if (typeof module !== 'undefined' && module.exports) module.exports = NammaEngine;

if (typeof document !== 'undefined') {
  window.NammaEngine = NammaEngine;

  const SAMPLES = [
    { startCity: 'bengaluru', days: 5, travellers: 2, budget: 30000, startDate: '', interests: ['heritage', 'temples', 'photography'], preferred: [], pace: 'balanced', accessibility: false, family: false },
    { startCity: 'mangaluru', days: 4, travellers: 4, budget: 36000, startDate: '', interests: ['beaches', 'food', 'family'], preferred: [], pace: 'relaxed', accessibility: false, family: true }
  ];
  const ALLOC = [['stay', 38, 'c-stay'], ['transport', 22, 'c-transport'], ['food', 20, 'c-food'], ['act', 10, 'c-act'], ['cont', 10, 'c-cont']];
  const COST_KEYS = [['stay', 'c_stay', 'c-stay'], ['transport', 'c_transport', 'c-transport'], ['food', 'c_food', 'c-food'], ['activities', 'c_act', 'c-act'], ['contingency', 'c_cont', 'c-cont']];

  const state = { lang: 'en', filter: 'all', plan: null, inputs: null, addedIds: [], sampleIndex: 0, currentDest: null, photos: {}, route: null, dragId: null, focusAfter: null, dragging: false, map: null, layer: null, roads: [], mode: 'car', mapToken: 0, leafletPromise: null };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Translate a key. `{name}` placeholders are replaced from `params`. */
  function t(key, params = {}, lang = state.lang) {
    const str = (T[lang] && T[lang][key]) || T.en[key] || key;
    return str.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m));
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const nameOf = (obj, lang = state.lang) => obj[lang];
  const placeName = (id, lang = state.lang) => { const o = getDest(id) || START_CITIES.find(c => c.id === id); return o ? o[lang] : id; };
  const mapsUrl = d => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(d.en + ', Karnataka, India');

  /* ---------- small helpers ---------- */
  function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' error' : '');
    el.textContent = message;
    $('#toast-region').appendChild(el);
    $('#sr-status').textContent = message;
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, 3400);
  }
  function scrollToEl(el) { el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }); }

  /* ---------- destination artwork (original SVG, no external images) ---------- */
  function artSvg(dest, suffix = 'c') {
    const pal = { palace: ['#F4E3C1', '#E9B88A'], temple: ['#F1DDB5', '#D9A26B'], hills: ['#DDE7D2', '#A9BBA0'], falls: ['#D7E4D3', '#8FAE98'], beach: ['#FBE6C8', '#E8A87C'], city: ['#E6E9DD', '#B8C5B0'] }[dest.scene];
    const gid = `sky-${dest.id}-${suffix}`;
    let s = '';
    switch (dest.scene) {
      case 'palace':
        s = `<path d="M0 205 Q100 170 200 195 T400 185 V275H0Z" fill="#5E8C6A"/>
          <rect x="90" y="150" width="220" height="70" fill="#8A4A2B"/>
          <path d="M170 150 Q200 80 230 150Z" fill="#B9532F"/><path d="M105 150 Q125 112 145 150Z" fill="#B9532F"/><path d="M255 150 Q275 112 295 150Z" fill="#B9532F"/>
          <rect x="94" y="122" width="14" height="30" fill="#8A4A2B"/><rect x="292" y="122" width="14" height="30" fill="#8A4A2B"/>
          <rect x="196" y="72" width="8" height="16" fill="#C49A3C"/>
          <g fill="#F8F3E6"><rect x="120" y="175" width="14" height="30" rx="7"/><rect x="165" y="175" width="14" height="30" rx="7"/><rect x="221" y="175" width="14" height="30" rx="7"/><rect x="266" y="175" width="14" height="30" rx="7"/></g>
          <rect y="220" width="400" height="55" fill="#0F3D2E"/>`; break;
      case 'temple':
        s = `<path d="M0 205 Q120 165 230 195 T400 190 V275H0Z" fill="#8FAE98"/>
          <g fill="#7A3E22"><rect x="130" y="190" width="140" height="30"/><rect x="142" y="162" width="116" height="28"/><rect x="154" y="136" width="92" height="26"/><rect x="166" y="112" width="68" height="24"/><rect x="178" y="90" width="44" height="22"/><rect x="192" y="72" width="16" height="18"/></g>
          <circle cx="200" cy="66" r="7" fill="#C49A3C"/>
          <g fill="#F1DDB5"><rect x="192" y="200" width="16" height="20" rx="8"/></g>
          <rect y="220" width="400" height="55" fill="#17513C"/>`; break;
      case 'hills':
        s = `<path d="M0 170 Q80 105 160 160 T320 140 T400 135 V275H0Z" fill="#8FAE98"/>
          <path d="M0 205 Q100 145 200 195 T400 180 V275H0Z" fill="#4F8A66"/>
          <path d="M0 238 Q120 205 240 232 T400 226 V275H0Z" fill="#17513C"/>
          <g fill="#0F3D2E" opacity="0.8"><circle cx="70" cy="226" r="9"/><circle cx="96" cy="230" r="8"/><circle cx="310" cy="222" r="9"/><circle cx="334" cy="226" r="8"/></g>`; break;
      case 'falls':
        s = `<path d="M0 90 H150 V275 H0Z" fill="#3E6B52"/><path d="M250 90 H400 V275 H250Z" fill="#2F5E48"/>
          <rect x="150" y="90" width="100" height="150" fill="#F3F7F2" opacity="0.9"/>
          <g stroke="#B9D3C8" stroke-width="3"><line x1="170" y1="92" x2="170" y2="236"/><line x1="195" y1="92" x2="195" y2="240"/><line x1="222" y1="92" x2="222" y2="236"/></g>
          <ellipse cx="200" cy="245" rx="70" ry="14" fill="#CFE3DD"/>
          <g fill="#0F3D2E"><circle cx="30" cy="84" r="20"/><circle cx="70" cy="80" r="24"/><circle cx="110" cy="86" r="18"/><circle cx="290" cy="82" r="22"/><circle cx="336" cy="80" r="24"/><circle cx="376" cy="86" r="18"/></g>`; break;
      case 'beach':
        s = `<rect y="165" width="400" height="110" fill="#2F6F6B"/>
          <g fill="none" stroke="#DCEFE9" stroke-width="3" stroke-linecap="round"><path d="M20 190 q20 -10 40 0 t40 0"/><path d="M180 205 q20 -10 40 0 t40 0"/><path d="M260 180 q20 -10 40 0 t40 0"/></g>
          <path d="M0 238 Q200 205 400 240 V275H0Z" fill="#E9D2A3"/>
          <path d="M300 245 Q312 195 296 150" fill="none" stroke="#6B4A2B" stroke-width="7" stroke-linecap="round"/>
          <g fill="none" stroke="#1F6B45" stroke-width="6" stroke-linecap="round"><path d="M296 150 q-34 -22 -64 -4"/><path d="M296 150 q34 -26 66 -6"/><path d="M296 150 q-12 -34 -40 -40"/><path d="M296 150 q14 -34 44 -36"/></g>`; break;
      default: // city
        s = `<g fill="#17513C"><rect x="40" y="130" width="50" height="95"/><rect x="100" y="95" width="56" height="130"/><rect x="166" y="145" width="44" height="80"/><rect x="220" y="75" width="60" height="150"/><rect x="290" y="120" width="56" height="105"/></g>
          <g fill="#F4E3C1" opacity="0.85"><rect x="110" y="110" width="8" height="10"/><rect x="130" y="110" width="8" height="10"/><rect x="110" y="140" width="8" height="10"/><rect x="130" y="140" width="8" height="10"/><rect x="232" y="92" width="8" height="10"/><rect x="254" y="92" width="8" height="10"/><rect x="232" y="124" width="8" height="10"/><rect x="254" y="124" width="8" height="10"/><rect x="52" y="146" width="8" height="10"/><rect x="302" y="136" width="8" height="10"/></g>
          <rect y="225" width="400" height="50" fill="#0F3D2E"/><g fill="#5E8C6A"><circle cx="25" cy="220" r="14"/><circle cx="375" cy="220" r="14"/></g>`;
    }
    return `<svg viewBox="0 0 400 275" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(dest.en)}">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal[0]}"/><stop offset="1" stop-color="${pal[1]}"/></linearGradient></defs>
      <rect width="400" height="275" fill="url(#${gid})"/><circle cx="${(dest.lng * 13) % 200 + 60}" cy="58" r="24" fill="#D9A441" opacity="0.8"/>${s}</svg>`;
  }

  /* ---------- real photos from Wikipedia (with graceful fallback) ---------- */
  async function fetchPhoto(id) {
    const key = 'nammatrip-photo-v1-' + id;
    try { const cached = sessionStorage.getItem(key); if (cached) return JSON.parse(cached); } catch (e) { /* ignore */ }
    for (const title of PHOTO_TITLES[id] || []) {
      try {
        const res = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title) + '?redirect=true');
        if (!res.ok) continue;
        const data = await res.json();
        const thumb = data.thumbnail, orig = data.originalimage;
        if (!thumb && !orig) continue;
        // Use the original when it is small; otherwise ask for a 960px-wide version of the thumbnail.
        let src = orig && orig.width <= 960 ? orig.source : (thumb ? thumb.source.replace(/\/\d+px-/, '/960px-') : orig.source);
        if (!/^https:\/\/upload\.wikimedia\.org\//.test(src)) continue;
        const photo = { src, title: data.title, page: (data.content_urls && data.content_urls.desktop && data.content_urls.desktop.page) || '' };
        try { sessionStorage.setItem(key, JSON.stringify(photo)); } catch (e) { /* ignore */ }
        return photo;
      } catch (err) { /* offline or blocked: try the next title, then fall back to the SVG */ }
    }
    return null;
  }
  /** Put each loaded photo on top of its SVG illustration. Safe to call any number of times. */
  function applyPhotos() {
    $$('[data-photo-for]').forEach(box => {
      const photo = state.photos[box.dataset.photoFor];
      if (!photo || box.querySelector('img.photo')) return;
      const img = document.createElement('img');
      img.className = 'photo'; img.src = photo.src; img.alt = placeName(box.dataset.photoFor);
      img.loading = 'lazy'; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
      img.addEventListener('load', () => img.classList.add('ready'));
      img.addEventListener('error', () => img.remove()); // keep the SVG if the image fails
      box.appendChild(img);
    });
    $$('[data-credit-for]').forEach(p => {
      const photo = state.photos[p.dataset.creditFor];
      p.innerHTML = photo && photo.page ? `${esc(t('photo_credit'))}: <a href="${esc(photo.page)}" target="_blank" rel="noopener noreferrer">${esc(photo.title)}</a>` : '';
    });
  }
  function loadPhotos() {
    if (typeof fetch !== 'function') return;
    DESTINATIONS.forEach(d => fetchPhoto(d.id).then(photo => { if (photo) { state.photos[d.id] = photo; applyPhotos(); } }));
  }

  /* ---------- translations applied to the page ---------- */
  function applyStaticTranslations() {
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    $$('[data-dest-name]').forEach(el => { el.textContent = placeName(el.dataset.destName); });
    document.documentElement.lang = state.lang === 'kn' ? 'kn' : 'en';
    document.title = t('doc_title');
    const btn = $('#lang-toggle');
    btn.setAttribute('aria-label', t('lang_aria'));
    btn.setAttribute('lang', state.lang === 'kn' ? 'en' : 'kn');
  }
  function fillCitySelect(sel) {
    const cur = sel.value;
    sel.innerHTML = `<option value="">${esc(t('select_city'))}</option>` + START_CITIES.map(c => `<option value="${c.id}">${esc(c[state.lang])}</option>`).join('');
    sel.value = cur;
  }

  /* ---------- explorer: cards, carousel, dialog ---------- */
  function renderCards() {
    const list = DESTINATIONS.filter(d => state.filter === 'all' || d.tags.includes(state.filter));
    const track = $('#carousel-track');
    track.innerHTML = list.map(d => `
      <article class="dest-card" role="listitem">
        <div class="dest-art" data-open="${d.id}" data-photo-for="${d.id}">${artSvg(d, 'card')}</div>
        <div class="dest-body">
          <p class="dest-region">${esc(nameOf(d.region))}</p>
          <h3>${esc(d[state.lang])}</h3>
          <p class="dest-desc">${esc(nameOf(d.desc))}</p>
          <div class="dest-meta">
            <span class="dest-days">${d.days === 1 ? esc(t('card_days_one')) : esc(t('card_days', { n: t('r_days_n', { n: d.days }) }))}</span>
            <button type="button" class="btn btn-ghost btn-sm" data-open="${d.id}">${esc(t('card_open'))}</button>
          </div>
        </div>
      </article>`).join('');
    track.scrollTo({ left: 0 });
    applyPhotos();
  }

  function renderDialog() {
    const d = getDest(state.currentDest);
    if (!d) return;
    const wished = !!$('#pref-' + d.id) && $('#pref-' + d.id).checked;
    const link = d.official
      ? `<a href="${d.official.url}" target="_blank" rel="noopener noreferrer">${esc(t('link_unesco'))}</a>`
      : `<a href="${KARNATAKA_TOURISM_URL}" target="_blank" rel="noopener noreferrer">${esc(t('link_kt'))}</a>`;
    $('#dialog-content').innerHTML = `
      <div class="dlg-art" data-photo-for="${d.id}">${artSvg(d, 'dlg')}</div>
      <button type="button" class="icon-btn dlg-close" data-close aria-label="${esc(t('dlg_close'))}">&#10005;</button>
      <div class="dlg-body">
        <h2 id="dialog-title">${esc(d[state.lang])}</h2>
        <p class="dest-region">${esc(nameOf(d.region))}</p>
        <p>${esc(nameOf(d.desc))}</p>
        <div class="dlg-section"><h3>${esc(t('dlg_attractions'))}</h3>
          <ul>${d.attractions.map(a => `<li>${esc(state.lang === 'kn' ? a[1] : a[0])}</li>`).join('')}</ul></div>
        <div class="dlg-section"><h3>${esc(t('dlg_cost'))}</h3>
          <table class="cost-table"><tbody>
            <tr><th scope="row">${esc(t('cost_stay'))}</th><td>${fmt(d.cost.stay[0])} to ${fmt(d.cost.stay[1])}</td></tr>
            <tr><th scope="row">${esc(t('cost_food'))}</th><td>${fmt(d.cost.food[0])} to ${fmt(d.cost.food[1])}</td></tr>
            <tr><th scope="row">${esc(t('cost_act'))}</th><td>${fmt(d.cost.act[0])} to ${fmt(d.cost.act[1])}</td></tr>
          </tbody></table>
          <p class="hint">${esc(t('dlg_cost_note'))}</p></div>
        ${d.season ? `<div class="dlg-section"><h3>${esc(t('dlg_season'))}</h3><p>${esc(nameOf(d.season))}</p></div>` : ''}
        <div class="dlg-section"><h3>${esc(t('dlg_access'))}</h3><p>${esc(t('access_' + d.access))}</p></div>
        <div class="dlg-section"><h3>${esc(t('dlg_official'))}</h3><p>${link}</p></div>
        <p class="hint photo-credit" data-credit-for="${d.id}"></p>
        <div class="dlg-actions">
          <button type="button" class="btn btn-primary" data-wish="${d.id}">${esc(t(wished ? 'dlg_remove' : 'dlg_add'))}</button>
          <a class="btn btn-ghost" href="${mapsUrl(d)}" target="_blank" rel="noopener noreferrer">${esc(t('dlg_maps'))}</a>
        </div>
      </div>`;
    applyPhotos();
  }
  function openDestination(id) {
    state.currentDest = id;
    renderDialog();
    const dlg = $('#destination-dialog');
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
  }
  function closeDialog() {
    const dlg = $('#destination-dialog');
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
  }

  /* ---------- planner form ---------- */
  function buildFormControls() {
    $('#interest-grid').innerHTML = INTEREST_KEYS.map(k =>
      `<label class="chip"><input type="checkbox" name="interest" value="${k}"><span data-i18n="int_${k}"></span></label>`).join('');
    $('#preferred-grid').innerHTML = DESTINATIONS.map(d =>
      `<label class="chip"><input type="checkbox" name="preferred" id="pref-${d.id}" value="${d.id}"><span data-dest-name="${d.id}"></span></label>`).join('');
  }

  function readForm() {
    return {
      startCity: $('#f-start').value, days: $('#f-days').value, travellers: $('#f-travellers').value,
      budget: $('#f-budget').value, startDate: $('#f-date').value,
      interests: $$('input[name=interest]:checked').map(i => i.value),
      preferred: $$('input[name=preferred]:checked').map(i => i.value),
      pace: ($('input[name=pace]:checked') || {}).value || 'balanced',
      accessibility: $('#f-access').checked, family: $('#f-family').checked
    };
  }
  function writeForm(v) {
    $('#f-start').value = v.startCity; $('#f-days').value = v.days; $('#f-travellers').value = v.travellers;
    $('#f-budget').value = v.budget; $('#f-date').value = v.startDate || '';
    $$('input[name=interest]').forEach(i => { i.checked = v.interests.includes(i.value); });
    $$('input[name=preferred]').forEach(i => { i.checked = v.preferred.includes(i.value); });
    $$('input[name=pace]').forEach(i => { i.checked = i.value === v.pace; });
    $('#f-access').checked = !!v.accessibility; $('#f-family').checked = !!v.family;
    syncBudgetFromNumber();
  }
  const ERR_FIELDS = { start: 'f-start', days: 'f-days', travellers: 'f-travellers', budget: 'f-budget', date: 'f-date', interests: null };
  function clearErrors() {
    Object.keys(ERR_FIELDS).forEach(k => {
      const p = $('#err-' + k); if (p) p.textContent = '';
      if (ERR_FIELDS[k]) $('#' + ERR_FIELDS[k]).removeAttribute('aria-invalid');
    });
  }
  function showErrors(errors) {
    let first = null;
    Object.entries(errors).forEach(([k, key]) => {
      $('#err-' + k).textContent = t(key);
      const id = ERR_FIELDS[k];
      if (id) { $('#' + id).setAttribute('aria-invalid', 'true'); if (!first) first = $('#' + id); }
      else if (!first) first = $('input[name=interest]');
    });
    if (first) first.focus();
  }

  // Budget slider: number box and range stay in sync; the allocation bars update live.
  function syncBudgetFromNumber() {
    const n = Number($('#f-budget').value);
    $('#f-budget-range').value = clamp(Number.isFinite(n) ? n : 0, 5000, 200000);
    renderBudget(n);
  }
  function renderBudget(n) {
    $('#budget-display').textContent = Number.isFinite(n) && n > 0 ? fmt(n) : '-';
    $('#alloc-list').innerHTML = ALLOC.map(([key, pct, cls]) => `
      <li><span>${esc(t('c_' + key))}</span>
        <span class="alloc-track"><span class="alloc-fill ${cls}" style="display:block;width:${pct}%"></span></span>
        <span class="alloc-amt">${Number.isFinite(n) && n > 0 ? fmt((n * pct) / 100) : '-'}</span></li>`).join('');
  }

  /* ---------- results ---------- */
  function setResultsState(kind) {
    const root = $('#results-content');
    if (kind === 'empty') {
      root.innerHTML = `<div class="state-box"><h2>${esc(t('r_empty_title'))}</h2><p>${esc(t('r_empty_text'))}</p></div>`;
    } else if (kind === 'loading') {
      root.innerHTML = `<div class="state-box" role="status"><div class="spinner" aria-hidden="true"></div><p>${esc(t('r_loading'))}</p><div class="skeleton"></div><div class="skeleton" style="width:70%"></div></div>`;
    } else if (kind === 'error') {
      root.innerHTML = `<div class="state-box state-error" role="alert"><p>${esc(t('r_error'))}</p></div>`;
    }
  }

  function whyText(stop) {
    const parts = [];
    if (stop.why.added) parts.push(t('why_added'));
    else if (stop.why.preferred) parts.push(t('why_pref'));
    if (stop.why.matched.length) parts.push(t('why_match', { interests: stop.why.matched.map(k => t('int_' + k)).join(', ') }));
    if (!parts.length) parts.push(t('why_none'));
    parts.push(t('why_km', { km: stop.km }));
    return parts.join(' ');
  }
  function warningText(w) {
    const d = getDest(w.params.id);
    const place = d ? d[state.lang] : '';
    switch (w.code) {
      case 'more_stops': return t('w_more_stops', { n: w.params.n });
      case 'access': return t('w_access', { place });
      case 'long': return t('w_long', { place, km: w.params.km });
      case 'season': return t('w_season', { place, note: nameOf(d.season) });
      default: return '';
    }
  }
  const dateText = date => date ? date.toLocaleDateString(state.lang === 'kn' ? 'kn-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
  const daysText = n => (n === 1 ? t('r_day_one') : t('r_days_n', { n }));

  // Project latitude/longitude onto a small SVG canvas (simple equirectangular projection)
  function projectPoints(points, W = 600, H = 340, pad = 60) {
    const lats = points.map(p => p.lat), lngs = points.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const kx = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    const spanX = Math.max(0.5, (maxLng - minLng) * kx), spanY = Math.max(0.5, maxLat - minLat);
    const scale = Math.min((W - 2 * pad) / spanX, (H - 2 * pad) / spanY);
    const offX = (W - spanX * scale) / 2, offY = (H - spanY * scale) / 2;
    return points.map(p => ({ x: offX + (p.lng - minLng) * kx * scale, y: offY + (maxLat - p.lat) * scale }));
  }
  function curveTo(a, b, sign) { // quadratic curve with a gentle bend
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
    return `Q ${(mx - dy * 0.16 * sign).toFixed(1)} ${(my + dx * 0.16 * sign).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }

  function routeCardHtml(plan) {
    const pts = [getPoint(plan.inputs.startCity), ...plan.stops.map(s => getDest(s.id))];
    const xy = projectPoints(pts);
    let outbound = `M ${xy[0].x.toFixed(1)} ${xy[0].y.toFixed(1)}`;
    for (let i = 1; i < xy.length; i++) outbound += ' ' + curveTo(xy[i - 1], xy[i], 1);
    const back = `M ${xy[xy.length - 1].x.toFixed(1)} ${xy[xy.length - 1].y.toFixed(1)} ${curveTo(xy[xy.length - 1], xy[0], 1)}`;
    const pins = plan.stops.map((s, i) => {
      const p = xy[i + 1];
      return `<g class="map-pin" style="--i:${i + 1}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">
        <circle r="14"/><text class="num">${i + 1}</text><text class="name" x="18" y="-12">${esc(placeName(s.id))}</text></g>`;
    }).join('');
    const sp = xy[0];
    return `
      <div class="card">
        <h3>${esc(t('r_route'))}</h3>
        <svg class="route-svg" id="route-svg" viewBox="0 0 600 340" role="group" aria-label="${esc(t('r_route'))}">
          <path class="route-return" d="${back}"/>
          <path class="route-line" id="route-path" d="${outbound}"/>
          <g class="map-pin map-start" transform="translate(${sp.x.toFixed(1)} ${sp.y.toFixed(1)})">
            <rect x="-11" y="-11" width="22" height="22" rx="5"/><text class="name" x="16" y="-14">${esc(t('map_start'))}: ${esc(placeName(plan.inputs.startCity))}</text></g>
          ${pins}
          <g class="route-marker" id="route-marker" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"
             aria-label="${esc(t('r_progress'))}">
            <circle class="halo" r="20"/><circle class="core" r="9"/>
          </g>
        </svg>
        <div class="progress">
          <label for="progress-range">${esc(t('r_progress'))}</label>
          <input class="range" id="progress-range" type="range" min="0" max="100" step="1" value="0">
          <p class="progress-val" id="progress-val"></p>
        </div>
        <p class="map-note">${esc(t('r_route_note'))}</p>
      </div>`;
  }

  function stopsCardHtml(plan) {
    const used = plan.stops.map(s => s.id);
    const available = DESTINATIONS.filter(d => !used.includes(d.id));
    const items = plan.stops.map((s, i) => {
      const d = getDest(s.id), name = d[state.lang];
      return `<li class="stop-item" draggable="true" data-stop-id="${s.id}">
        <span class="stop-num" aria-hidden="true">${i + 1}</span>
        <div class="stop-main">
          <strong>${esc(name)}</strong><span class="stop-days">${esc(daysText(s.days))}</span>
          <p class="stop-why">${esc(whyText(s))}</p>
          <div class="stop-links"><button type="button" class="link-btn" data-open="${s.id}">${esc(t('r_details'))}</button>
            <a href="${mapsUrl(d)}" target="_blank" rel="noopener noreferrer">${esc(t('r_maps'))}</a></div>
        </div>
        <div class="stop-thumb" data-photo-for="${s.id}" aria-hidden="true"></div>
        <div class="stop-controls">
          <button type="button" class="icon-btn" data-action="up" aria-label="${esc(t('r_up'))}: ${esc(name)}" ${i === 0 ? 'disabled' : ''}>&#9650;</button>
          <button type="button" class="icon-btn" data-action="down" aria-label="${esc(t('r_down'))}: ${esc(name)}" ${i === plan.stops.length - 1 ? 'disabled' : ''}>&#9660;</button>
          <button type="button" class="icon-btn" data-action="remove" aria-label="${esc(t('r_remove'))}: ${esc(name)}">&#10005;</button>
        </div></li>`;
    }).join('');
    return `
      <div class="card">
        <h3>${esc(t('r_stops'))}</h3>
        <p class="hint">${esc(t('r_stops_hint'))}</p>
        <ol class="stop-list" id="stop-list">${items}</ol>
        ${available.length ? `<div class="add-stop">
          <label class="visually-hidden" for="add-select">${esc(t('r_add_label'))}</label>
          <select id="add-select">${available.map(d => `<option value="${d.id}">${esc(d[state.lang])}</option>`).join('')}</select>
          <button type="button" class="btn btn-primary btn-sm" data-action="add">${esc(t('r_add'))}</button></div>` : ''}
        <div class="stop-tools"><button type="button" class="btn btn-ghost btn-sm" data-action="optimise">${esc(t('r_optimise'))}</button></div>
      </div>`;
  }

  function timelineHtml(plan) {
    return `<h3>${esc(t('r_itin'))}</h3><ol class="timeline">` + plan.days.map((day, i) => {
      const d = getDest(day.stopId);
      const note = day.travel ? `<p class="travel-note">${esc(t('travel_note', { from: placeName(day.travel.fromId), to: placeName(day.travel.toId), km: day.travel.km, h: day.travel.hours }))}</p>` : '';
      const ret = day.ret ? `<p class="travel-note">${esc(t('return_note', { to: placeName(day.ret.toId), km: day.ret.km, h: day.ret.hours }))}</p>` : '';
      const items = day.items.map(it => `<li><span class="slot">${esc(t('slot_' + it.slot))}</span><span>${esc(it.idx === null ? t('evening_local') : (state.lang === 'kn' ? d.attractions[it.idx][1] : d.attractions[it.idx][0]))}</span></li>`).join('');
      return `<li class="day-card" style="--i:${i}">
        <div class="day-badge"><span>${esc(t('day_label'))}</span><strong>${day.n}</strong></div>
        <div class="day-body"><h4>${esc(d[state.lang])}<span class="day-date">${esc(dateText(day.date))}</span></h4>${note}<ul class="slot-list">${items}</ul>${walkLinkHtml(d, day)}${ret}</div></li>`;
    }).join('') + '</ol>';
  }

  function costHtml(plan) {
    const mid = plan.costs.mid;
    const stack = COST_KEYS.map(([k, , cls]) => `<span class="${cls}" style="width:${((mid[k] / mid.total) * 100).toFixed(1)}%"></span>`).join('');
    const legend = COST_KEYS.map(([k, label, cls]) => `<li><i class="${cls}"></i><span>${esc(t(label))} <small>${Math.round((mid[k] / mid.total) * 100)}%</small></span><b>${fmt(mid[k])}</b></li>`).join('');
    const max = Math.max(plan.budget, plan.costs.high.total) * 1.05;
    const pct = n => ((n / max) * 100).toFixed(1);
    const over = plan.diff < 0;
    return `
      <div class="card cost-card">
        <h3>${esc(t('r_cost'))}</h3>
        <p>${esc(t('r_est_total'))}: <strong>${fmt(mid.total)}</strong></p>
        <div class="stack-bar" role="img" aria-label="${esc(t('r_cost'))}">${stack}</div>
        <ul class="legend">${legend}</ul>
        <div class="vs" aria-label="${esc(t('r_budget_vs'))}">
          <div class="vs-row"><div class="vs-label"><span>${esc(t('r_your_budget'))}</span><span>${fmt(plan.budget)}</span></div>
            <div class="bar-track"><div class="bar-fill" style="width:${pct(plan.budget)}%"></div></div></div>
          <div class="vs-row"><div class="vs-label"><span>${esc(t('r_est_total'))}</span><span>${fmt(mid.total)}</span></div>
            <div class="bar-track"><div class="bar-fill est" style="width:${pct(mid.total)}%"></div>
              <div class="bar-band" style="left:${pct(plan.costs.low.total)}%;width:${(pct(plan.costs.high.total) - pct(plan.costs.low.total)).toFixed(1)}%"></div></div></div>
        </div>
        <p class="diff-line ${over ? 'diff-over' : 'diff-under'}">${esc(over ? t('r_diff_over', { x: fmt(-plan.diff) }) : t('r_diff_under', { x: fmt(plan.diff) }))}</p>
        <p class="hint">${esc(t('r_range', { lo: fmt(plan.costs.low.total), hi: fmt(plan.costs.high.total) }))}<br>${esc(t('r_cost_note'))}</p>
      </div>`;
  }

  function packingItems(plan) {
    const wanted = new Set(plan.inputs.interests);
    plan.stops.forEach(s => getDest(s.id).tags.forEach(tag => { if (tag === 'heritage' || tag === 'temples') wanted.add(tag); if (tag === 'coast') wanted.add('beaches'); if (tag === 'nature') wanted.add('nature'); }));
    const monsoon = plan.days.some(d => d.date && [6, 7, 8, 9].includes(d.date.getMonth() + 1));
    return PACKING.filter(p => !p.when || p.when.some(w => wanted.has(w)) || (monsoon && p.en === 'Rain jacket'));
  }

  function renderResults() {
    const plan = state.plan;
    if (!plan) { setResultsState('empty'); return; }
    const verdictMsg = t('v_' + plan.verdict, { lo: fmt(plan.costs.low.total), gap: fmt(plan.costs.low.total - plan.budget) });
    const warns = plan.warnings.map(warningText).filter(Boolean);
    warns.push(t('w_verify'));
    state.mapToken += 1; // cancels any map still loading for the old plan
    if (state.map) { state.map.remove(); state.map = null; state.layer = null; }
    $('#results-content').innerHTML = `
      <div class="result-head">
        <div>
          <h3 class="result-title">${esc(t('r_title'))}</h3>
          <p class="result-summary">${esc(t('r_summary', { days: plan.totalDays, n: plan.inputs.travellers, budget: fmt(plan.budget) }))}</p>
          <span class="engine-badge">${esc(t('badge_engine'))}</span>
        </div>
        <div class="result-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-action="print">${esc(t('a_print'))}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="json">${esc(t('a_json'))}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="txt">${esc(t('a_txt'))}</button>
          <button type="button" class="btn btn-primary btn-sm" data-action="share">${esc(t('a_share'))}</button>
        </div>
      </div>
      <div class="verdict verdict-${plan.verdict}" role="status">${esc(verdictMsg)}</div>
      <ul class="warn-list">${warns.map(w => `<li>${esc(w)}</li>`).join('')}</ul>
      <div class="result-grid">${routeCardHtml(plan)}${stopsCardHtml(plan)}</div>
      ${transportCardHtml(plan)}
      ${timelineHtml(plan)}
      ${costHtml(plan)}
      <div class="two-col">
        <div class="card"><h3>${esc(t('r_pack'))}</h3><ul class="pack-list">${packingItems(plan).map((p, i) => `<li><label><input type="checkbox" id="pk-${i}"><span>${esc(p[state.lang])}</span></label></li>`).join('')}</ul></div>
        <div class="card"><h3>${esc(t('r_tips'))}</h3><ul class="tips-list">${TIPS.map(x => `<li>${esc(x[state.lang])}</li>`).join('')}</ul></div>
      </div>
      <p class="disclaimer">${esc(t('w_verify'))}</p>`;
    initRoute();
    applyPhotos();
    setupTransport(plan);
    if (state.focusAfter) {
      const f = state.focusAfter; state.focusAfter = null;
      const el = $(`[data-stop-id="${f.id}"] [data-action="${f.action}"]:not([disabled])`) || $(`[data-stop-id="${f.id}"] [data-action]:not([disabled])`);
      if (el) el.focus();
    }
  }

  /* ---------- route marker (draggable + keyboard + slider) ---------- */
  function initRoute() {
    const svg = $('#route-svg'), path = $('#route-path');
    if (!svg || !path) { state.route = null; return; }
    const len = path.getTotalLength();
    path.style.setProperty('--len', len);
    const N = 120, samples = [];
    for (let i = 0; i < N; i++) samples.push(path.getPointAtLength((len * i) / (N - 1)));
    state.route = { svg, samples, N };
    setProgress(0);
  }
  function setProgress(p) {
    const r = state.route; if (!r) return;
    p = clamp(Math.round(p), 0, 100);
    const pt = r.samples[Math.round((p / 100) * (r.N - 1))];
    $('#route-marker').setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
    $('#route-marker').setAttribute('aria-valuenow', p);
    $('#progress-range').value = p;
    const total = state.plan.days.length;
    const dayNo = clamp(1 + Math.round((p / 100) * (total - 1)), 1, total);
    const place = placeName(state.plan.days[dayNo - 1].stopId);
    const txt = t('r_progress_val', { d: dayNo, n: total, place });
    $('#progress-val').textContent = txt;
    $('#route-marker').setAttribute('aria-valuetext', txt);
  }
  function progressFromPointer(e) {
    const r = state.route; if (!r) return;
    const pt = r.svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const loc = pt.matrixTransform(r.svg.getScreenCTM().inverse());
    let best = 0, bestD = Infinity;
    r.samples.forEach((s, i) => { const d = (s.x - loc.x) ** 2 + (s.y - loc.y) ** 2; if (d < bestD) { bestD = d; best = i; } });
    setProgress((best / (r.N - 1)) * 100);
  }

  /* ---------- editing the stop list ---------- */
  function currentIds() { return state.plan.stops.map(s => s.id); }
  function rebuild(ids, focus) {
    state.plan = buildPlanFromStops(ids, state.inputs, { addedIds: state.addedIds });
    state.focusAfter = focus || null;
    renderResults();
  }
  function moveStop(id, dir) {
    const ids = currentIds(), i = ids.indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    rebuild(ids, { id, action: dir < 0 ? 'up' : 'down' });
    toast(t('t_moved', { place: placeName(id), n: j + 1 }));
  }
  function removeStop(id) {
    const ids = currentIds();
    if (ids.length <= 1) { toast(t('t_last_stop'), 'error'); return; }
    const i = ids.indexOf(id);
    ids.splice(i, 1);
    state.addedIds = state.addedIds.filter(x => x !== id);
    rebuild(ids, { id: ids[Math.min(i, ids.length - 1)], action: 'remove' });
    toast(t('t_removed', { place: placeName(id) }));
  }
  function addStop() {
    const sel = $('#add-select'); if (!sel) return;
    const id = sel.value, ids = currentIds();
    if (!id || ids.includes(id)) return;
    ids.push(id); state.addedIds.push(id);
    rebuild(ids, { id, action: 'up' });
    toast(t('t_added', { place: placeName(id) }));
  }
  function dropStop(targetId) {
    const ids = currentIds(), from = ids.indexOf(state.dragId), to = ids.indexOf(targetId);
    if (from < 0 || to < 0 || from === to) return;
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    rebuild(ids, { id: moved, action: 'up' });
    toast(t('t_moved', { place: placeName(moved), n: to + 1 }));
  }

  /* ---------- export: print, download, share ---------- */
  function planToObject(plan) {
    return {
      generatedBy: 'NammaTrip AI rule-based engine (runs in the browser). Not a live AI response.',
      disclaimer: T.en.w_verify,
      inputs: plan.inputs,
      stops: plan.stops.map(s => ({ id: s.id, name: placeName(s.id, 'en'), kannada: placeName(s.id, 'kn'), days: s.days, kmFromPrevious: s.km })),
      itinerary: plan.days.map(d => ({ day: d.n, date: d.date ? d.date.toISOString().slice(0, 10) : null, place: placeName(d.stopId, 'en'),
        morning: getDest(d.stopId).attractions[d.items[0].idx][0], afternoon: getDest(d.stopId).attractions[d.items[1].idx][0] })),
      costEstimateINR: plan.costs, budgetINR: plan.budget, differenceFromMidEstimateINR: plan.diff, verdict: plan.verdict
    };
  }
  function planToText(plan) {
    const L = state.lang, lines = [];
    lines.push('NammaTrip AI - ' + t('r_title'));
    lines.push(t('r_summary', { days: plan.totalDays, n: plan.inputs.travellers, budget: fmt(plan.budget) }));
    lines.push(t('badge_engine'), '');
    plan.days.forEach(d => {
      const dest = getDest(d.stopId);
      lines.push(`${t('day_n', { n: d.n })}${d.date ? ' (' + dateText(d.date) + ')' : ''} - ${dest[L]}`);
      if (d.travel) lines.push('  ' + t('travel_note', { from: placeName(d.travel.fromId), to: placeName(d.travel.toId), km: d.travel.km, h: d.travel.hours }));
      d.items.forEach(it => lines.push(`  ${t('slot_' + it.slot)}: ${it.idx === null ? t('evening_local') : dest.attractions[it.idx][L === 'kn' ? 1 : 0]}`));
      if (d.ret) lines.push('  ' + t('return_note', { to: placeName(d.ret.toId), km: d.ret.km, h: d.ret.hours }));
    });
    lines.push('', `${t('r_est_total')}: ${fmt(plan.costs.mid.total)} (${t('r_range', { lo: fmt(plan.costs.low.total), hi: fmt(plan.costs.high.total) })})`);
    COST_KEYS.forEach(([k, label]) => lines.push(`  ${t(label)}: ${fmt(plan.costs.mid[k])}`));
    lines.push(`${t('r_your_budget')}: ${fmt(plan.budget)}`, '', t('w_verify'));
    return lines.join('\n');
  }
  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast(t('t_downloaded'));
  }
  async function sharePlan() {
    const text = planToText(state.plan);
    try {
      if (navigator.share) { await navigator.share({ title: 'NammaTrip AI', text }); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); toast(t('t_copied')); return; }
      toast(t('t_share_fail'), 'error');
    } catch (err) {
      if (err && err.name === 'AbortError') return; // the user closed the share sheet
      try { await navigator.clipboard.writeText(text); toast(t('t_copied')); } catch (e) { toast(t('t_share_fail'), 'error'); }
    }
  }

  /* ---------- maps and ways to travel ---------- */
  const dirUrl = (from, to, mode) => 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(from + ', Karnataka, India')
    + '&destination=' + encodeURIComponent(to + ', Karnataka, India') + '&travelmode=' + mode;
  const fmtHM = min => t('m_hm', { h: Math.floor(min / 60), m: min % 60 });
  const MODE_ICONS = {
    car: '<path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v4h-3v-2H6v2H3z"/><circle cx="7.5" cy="13.5" r="1"/><circle cx="16.5" cy="13.5" r="1"/>',
    bus: '<rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 11h16"/><circle cx="8" cy="19.5" r="1.4"/><circle cx="16" cy="19.5" r="1.4"/>',
    plane: '<path d="M21 15l-8-4V5a1 1 0 0 0-2 0v6l-8 4v2l8-2v4l-2 1.5V22l3-1 3 1v-1.5L13 19v-4l8 2z"/>',
    walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M12 8l-2 5 3 2 1 5M10 13l-3 2M12 8l3 2 2 3"/>'
  };
  const modeIcon = m => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MODE_ICONS[m]}</svg>`;

  // Live road data (distance, time, geometry) from the public OSRM demo server. Failures fall back to estimates.
  const roadCache = new Map();
  async function fetchRoad(a, b) {
    if (haversineKm(a, b) < 1) return null;
    const key = `${a.lng},${a.lat};${b.lng},${b.lat}`;
    if (roadCache.has(key)) return roadCache.get(key);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    try {
      const res = await fetch('https://router.project-osrm.org/route/v1/driving/' + key + '?overview=simplified&geometries=geojson', { signal: ctrl.signal });
      const j = await res.json();
      if (j.code !== 'Ok' || !j.routes || !j.routes.length) throw new Error('no route');
      const r = j.routes[0];
      const out = { km: Math.round(r.distance / 1000), minutes: Math.round(r.duration / 60), coords: r.geometry.coordinates.map(c => [c[1], c[0]]) };
      roadCache.set(key, out);
      return out;
    } catch (e) { return null; } finally { clearTimeout(timer); }
  }

  // The map library is loaded only when needed, so the site still works offline.
  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (state.leafletPromise) return state.leafletPromise;
    state.leafletPromise = new Promise((resolve, reject) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(css);
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      s.onload = () => resolve();
      s.onerror = () => { state.leafletPromise = null; reject(new Error('leaflet failed')); };
      document.head.appendChild(s);
    });
    return state.leafletPromise;
  }

  function transportTableHtml(plan, roads) {
    const legs = [...plan.legs, plan.returnLeg];
    const rows = legs.map((leg, i) => {
      const o = transportOptions(leg, plan.inputs.travellers, roads[i] || null);
      const fromEn = placeName(leg.fromId, 'en'), toEn = placeName(leg.toId, 'en');
      const planeCell = o.plane
        ? `${esc(fmtHM(o.plane.minutes))}<br><small>${esc(t('m_price_varies'))}</small><br><a href="${esc('https://www.google.com/travel/flights?q=' + encodeURIComponent('Flights from ' + o.plane.from + ' to ' + o.plane.to))}" target="_blank" rel="noopener noreferrer">${esc(t('m_flights'))} (${o.plane.from} - ${o.plane.to})</a>`
        : `<small>${esc(t('m_plane_none'))}</small>`;
      return `<tr>
        <th scope="row">${esc(t('m_row', { from: placeName(leg.fromId), to: placeName(leg.toId) }))}</th>
        <td>${o.km} km<br><small>${esc(t(o.live ? 'm_live' : 'm_estimated'))}</small></td>
        <td class="col-car">${esc(fmtHM(o.car.minutes))}<br><b>${fmt(o.car.perPerson)}</b> <small>${esc(t('m_pp'))}</small></td>
        <td class="col-bus">${esc(fmtHM(o.bus.minutes))}<br><b>${fmt(o.bus.perPerson[0])} - ${fmt(o.bus.perPerson[1])}</b> <small>${esc(t('m_pp'))}</small></td>
        <td class="col-plane">${planeCell}</td>
        <td class="col-links"><a href="${esc(dirUrl(fromEn, toEn, 'driving'))}" target="_blank" rel="noopener noreferrer">${esc(t('m_drive'))}</a><br>
          <a href="${esc(dirUrl(fromEn, toEn, 'transit'))}" target="_blank" rel="noopener noreferrer">${esc(t('m_transit'))}</a></td></tr>`;
    }).join('');
    return `<table class="transport-table"><thead><tr>
      <th scope="col">${esc(t('m_leg'))}</th><th scope="col">${esc(t('m_distance'))}</th>
      <th scope="col" class="col-car">${esc(t('m_car'))}</th><th scope="col" class="col-bus">${esc(t('m_bus'))}</th>
      <th scope="col" class="col-plane">${esc(t('m_plane'))}</th><th scope="col">${esc(t('m_links'))}</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function walkListHtml(plan) {
    const items = plan.days.map(day => {
      const d = getDest(day.stopId);
      const a = d.attractions[day.items[0].idx][0], b = d.attractions[day.items[1].idx][0];
      if (a === b) return '';
      return `<li><strong>${esc(t('day_n', { n: day.n }))}</strong>, ${esc(d[state.lang])}: <a href="${esc(dirUrl(a + ', ' + d.en, b + ', ' + d.en, 'walking'))}" target="_blank" rel="noopener noreferrer">${esc(state.lang === 'kn' ? d.attractions[day.items[0].idx][1] : a)} &rarr; ${esc(state.lang === 'kn' ? d.attractions[day.items[1].idx][1] : b)}</a></li>`;
    }).join('');
    return `<h4>${esc(t('m_walk_list'))}</h4><ul class="walk-list">${items}</ul>`;
  }

  function transportCardHtml(plan) {
    const modes = ['car', 'bus', 'plane', 'walk'];
    return `
      <div class="card transport-card mode-${state.mode}" id="transport-card">
        <h3>${esc(t('m_title'))}</h3>
        <p class="hint">${esc(t('m_sub'))}</p>
        <div class="mode-tabs" role="group" aria-label="${esc(t('m_title'))}">
          ${modes.map(m => `<button type="button" class="mode-btn" data-mode="${m}" aria-pressed="${state.mode === m}">${modeIcon(m)}<span>${esc(t('mode_' + m))}</span></button>`).join('')}
        </div>
        <div class="leaflet-box" id="leaflet-map" role="region" aria-label="${esc(t('m_title'))}"><p class="map-msg">${esc(t('m_loading'))}</p></div>
        <p class="hint" id="mode-note"></p>
        <div class="walk-panel" id="walk-panel" hidden>${walkListHtml(plan)}</div>
        <div class="table-scroll" id="transport-table">${transportTableHtml(plan, [])}</div>
      </div>`;
  }

  function walkLinkHtml(d, day) {
    const a = d.attractions[day.items[0].idx][0], b = d.attractions[day.items[1].idx][0];
    if (a === b) return '';
    return `<p class="walk-link"><a href="${esc(dirUrl(a + ', ' + d.en, b + ', ' + d.en, 'walking'))}" target="_blank" rel="noopener noreferrer">${modeIcon('walk')} ${esc(t('m_walk_day'))}</a></p>`;
  }

  function setMode(mode) {
    state.mode = mode;
    const card = $('#transport-card');
    if (!card) return;
    card.className = card.className.replace(/mode-\w+/, 'mode-' + mode);
    $$('.mode-btn', card).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    $('#mode-note').textContent = t('m_' + mode + '_note');
    $('#walk-panel').hidden = mode !== 'walk';
    drawLayers();
  }

  // Draw the lines for the chosen travel mode on the real map.
  function drawLayers() {
    if (!state.map || !state.layer || !state.plan || !window.L) return;
    const plan = state.plan;
    state.layer.clearLayers();
    const legs = [...plan.legs, plan.returnLeg];
    legs.forEach((leg, i) => {
      const a = getPoint(leg.fromId), b = getPoint(leg.toId), road = state.roads[i];
      const A = [a.lat, a.lng], B = [b.lat, b.lng], isReturn = i === legs.length - 1;
      if (state.mode === 'car' || state.mode === 'bus') {
        L.polyline(road ? road.coords : [A, B], {
          color: state.mode === 'car' ? '#A8481F' : '#17513C', weight: 5, lineCap: 'round',
          opacity: isReturn ? 0.55 : 0.9, dashArray: road ? (isReturn ? '2 10' : null) : '6 8'
        }).addTo(state.layer);
      } else if (state.mode === 'plane') {
        const o = transportOptions(leg, plan.inputs.travellers, null);
        const line = L.polyline([A, B], { color: o.plane ? '#C49A3C' : '#8A948E', weight: o.plane ? 4 : 2, opacity: o.plane ? 0.95 : 0.5, dashArray: '10 10' }).addTo(state.layer);
        if (o.plane) line.bindTooltip(`${o.plane.from} - ${o.plane.to}`, { sticky: true });
      }
    });
  }

  function buildMap(plan, box) {
    box.innerHTML = '';
    const pts = [getPoint(plan.inputs.startCity), ...plan.stops.map(s => getDest(s.id))];
    const map = L.map(box, { scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: false });
    state.map = map;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    pts.forEach((p, i) => {
      const id = i === 0 ? plan.inputs.startCity : plan.stops[i - 1].id;
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({ className: 'lf-pin' + (i === 0 ? ' lf-start' : ''), html: `<span>${i === 0 ? 'S' : i}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }),
        keyboard: false
      }).addTo(map).bindTooltip(placeName(id), { permanent: i > 0, direction: 'right', offset: [16, 0], className: 'lf-label' });
    });
    map.fitBounds(L.latLngBounds(pts.map(p => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 9 });
    state.layer = L.layerGroup().addTo(map);
    drawLayers();
    setTimeout(() => { if (state.map === map) map.invalidateSize(); }, 300);
  }

  async function setupTransport(plan) {
    const token = ++state.mapToken;
    const legs = [...plan.legs, plan.returnLeg];
    state.roads = legs.map(() => null);
    setMode(state.mode);
    let leafletOk = true;
    const [roads] = await Promise.all([
      Promise.all(legs.map(l => fetchRoad(getPoint(l.fromId), getPoint(l.toId)))),
      loadLeaflet().catch(() => { leafletOk = false; })
    ]);
    if (token !== state.mapToken) return;
    state.roads = roads;
    const table = $('#transport-table');
    if (table) table.innerHTML = transportTableHtml(plan, roads);
    const box = $('#leaflet-map');
    if (!box) return;
    if (!leafletOk || !window.L) { box.innerHTML = `<p class="map-msg">${esc(t('m_offline'))}</p>`; return; }
    buildMap(plan, box);
  }

  /* ---------- culture & about sections ---------- */
  function renderCulture() {
    const L = state.lang;
    $('#food-grid').innerHTML = FOODS.map(f => `<div class="info-card"><h4>${esc(f[L])}</h4><p class="alt">${esc(f[L === 'kn' ? 'en' : 'kn'])}</p><p>${esc(f.d[L])}</p></div>`).join('');
    $('#dynasty-grid').innerHTML = DYNASTIES.map(x => `<div class="info-card"><h4>${esc(x[L])}</h4><p class="alt">${esc(x.p[L])}</p><p>${esc(x.d[L])}</p></div>`).join('');
    $('#phrase-grid').innerHTML = PHRASES.map((p, i) => `<div class="phrase"><p class="kn" lang="kn">${esc(p.kn)}</p><p class="rom">${esc(p.rom)}</p><p class="mean">${esc(L === 'kn' ? PHRASE_MEANING_KN[i] : p.en)}</p></div>`).join('');
    $('#resp-list').innerHTML = RESPONSIBLE.map(r => `<li>${esc(r[L])}</li>`).join('');
    $('#limits-list').innerHTML = LIMITS.map(x => `<li>${esc(x[L])}</li>`).join('');
  }

  /* ---------- page-wide render ---------- */
  function renderAll() {
    applyStaticTranslations();
    fillCitySelect($('#f-start')); fillCitySelect($('#quick-city'));
    renderCards(); renderCulture();
    renderBudget(Number($('#f-budget').value));
    if (state.plan) renderResults(); else if (!$('#results-content').children.length || $('.state-box', $('#results-content'))) setResultsState('empty');
    if ($('#destination-dialog').open) renderDialog();
  }

  function setLanguage(lang) {
    state.lang = lang;
    try { localStorage.setItem('nammatrip-lang', lang); } catch (e) { /* storage may be blocked: ignore */ }
    renderAll();
  }

  /* ---------- trip creation ---------- */
  function handleSubmit(e) {
    if (e) e.preventDefault();
    clearErrors();
    const res = validateTripInputs(readForm());
    if (!res.ok) { showErrors(res.errors); toast(t('e_form'), 'error'); return; }
    const btn = $('#generate-btn');
    btn.disabled = true;
    state.plan = null;
    setResultsState('loading');
    scrollToEl($('#results'));
    setTimeout(() => {
      try {
        state.inputs = res.values; state.addedIds = [];
        state.plan = generatePlan(res.values);
        renderResults();
        toast(t('t_ready', { n: state.plan.stops.length }));
      } catch (err) {
        console.error(err);
        setResultsState('error');
      } finally {
        btn.disabled = false;
      }
    }, reduceMotion() ? 120 : 800);
  }
  function loadSample() {
    const sample = SAMPLES[state.sampleIndex % SAMPLES.length];
    state.sampleIndex += 1;
    clearErrors(); writeForm(sample);
    toast(t('t_sample'));
    handleSubmit();
  }
  function resetTrip() {
    $('#trip-form').reset();
    clearErrors();
    state.plan = null; state.inputs = null; state.addedIds = [];
    syncBudgetFromNumber();
    setResultsState('empty');
    toast(t('t_reset'));
  }
  function quickPlan(e) {
    e.preventDefault();
    if ($('#quick-city').value) $('#f-start').value = $('#quick-city').value;
    $('#f-days').value = $('#quick-days').value;
    $('#f-budget').value = $('#quick-budget').value;
    syncBudgetFromNumber();
    clearErrors();
    scrollToEl($('#planner'));
    toast(t('t_quick'));
    setTimeout(() => $('#f-start').focus({ preventScroll: true }), reduceMotion() ? 0 : 600);
  }

  /* ---------- events ---------- */
  function bindEvents() {
    $('#lang-toggle').addEventListener('click', () => setLanguage(state.lang === 'en' ? 'kn' : 'en'));

    // Mobile menu
    const header = $('#site-header'), menuBtn = $('#menu-toggle');
    const setMenu = open => { header.classList.toggle('nav-open', open); menuBtn.setAttribute('aria-expanded', String(open)); };
    menuBtn.addEventListener('click', () => setMenu(!header.classList.contains('nav-open')));
    $$('#primary-nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 8), { passive: true });

    // Filters and carousel
    $('#filters').addEventListener('click', e => {
      const b = e.target.closest('[data-filter]'); if (!b) return;
      state.filter = b.dataset.filter;
      $$('.filter-btn').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      renderCards();
    });
    const track = $('#carousel-track');
    const scrollTrack = dir => track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: reduceMotion() ? 'auto' : 'smooth' });
    $('#carousel-prev').addEventListener('click', () => scrollTrack(-1));
    $('#carousel-next').addEventListener('click', () => scrollTrack(1));
    track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') scrollTrack(1); if (e.key === 'ArrowLeft') scrollTrack(-1); });

    // Opening destination details (works from cards and from the results list)
    document.addEventListener('click', e => {
      const open = e.target.closest('[data-open]');
      if (open) { openDestination(open.dataset.open); return; }
      if (e.target.closest('[data-close]')) { closeDialog(); return; }
      const wish = e.target.closest('[data-wish]');
      if (wish) {
        const box = $('#pref-' + wish.dataset.wish); box.checked = !box.checked;
        toast(t(box.checked ? 't_wish_added' : 't_wish_removed', { place: placeName(wish.dataset.wish) }));
        renderDialog();
      }
    });
    $('#destination-dialog').addEventListener('click', e => { if (e.target === e.currentTarget) closeDialog(); });

    // Planner form
    $('#trip-form').addEventListener('submit', handleSubmit);
    $('#sample-btn').addEventListener('click', loadSample);
    $('#reset-btn').addEventListener('click', resetTrip);
    $('#quick-form').addEventListener('submit', quickPlan);
    $('#f-budget').addEventListener('input', syncBudgetFromNumber);
    $('#f-budget-range').addEventListener('input', e => { $('#f-budget').value = e.target.value; renderBudget(Number(e.target.value)); });

    // Everything inside the results area uses event delegation, because it is redrawn often.
    const results = $('#results-content');
    results.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]'); if (!btn || !state.plan) return;
      const li = btn.closest('[data-stop-id]'), id = li ? li.dataset.stopId : null;
      switch (btn.dataset.action) {
        case 'up': moveStop(id, -1); break;
        case 'down': moveStop(id, 1); break;
        case 'remove': removeStop(id); break;
        case 'add': addStop(); break;
        case 'optimise': rebuild(orderByNearest(state.inputs.startCity, currentIds())); toast(t('t_optimised')); break;
        case 'print': window.print(); break;
        case 'json': download('nammatrip-itinerary.json', JSON.stringify(planToObject(state.plan), null, 2), 'application/json'); break;
        case 'txt': download('nammatrip-itinerary.txt', '\ufeff' + planToText(state.plan), 'text/plain;charset=utf-8'); break;
        case 'share': sharePlan(); break;
      }
    });
    results.addEventListener('click', e => { const m = e.target.closest('[data-mode]'); if (m) setMode(m.dataset.mode); });
    results.addEventListener('input', e => { if (e.target.id === 'progress-range') setProgress(Number(e.target.value)); });
    // Drag the marker with mouse or touch
    results.addEventListener('pointerdown', e => {
      const m = e.target.closest('#route-marker'); if (!m || !state.route) return;
      state.dragging = true; state.route.svg.setPointerCapture(e.pointerId); m.focus({ preventScroll: true }); e.preventDefault();
    });
    results.addEventListener('pointermove', e => { if (state.dragging) progressFromPointer(e); });
    const endDrag = () => { state.dragging = false; };
    results.addEventListener('pointerup', endDrag); results.addEventListener('pointercancel', endDrag);
    // Keyboard alternative for the marker
    results.addEventListener('keydown', e => {
      if (!e.target.matches('#route-marker')) return;
      const cur = Number(e.target.getAttribute('aria-valuenow'));
      const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[e.key];
      if (step) { setProgress(cur + step); e.preventDefault(); }
      else if (e.key === 'Home') { setProgress(0); e.preventDefault(); }
      else if (e.key === 'End') { setProgress(100); e.preventDefault(); }
    });
    // Drag and drop reordering (mouse). Touch and keyboard users have the arrow buttons.
    results.addEventListener('dragstart', e => {
      const li = e.target.closest && e.target.closest('.stop-item'); if (!li) return;
      state.dragId = li.dataset.stopId; li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', state.dragId);
    });
    results.addEventListener('dragover', e => {
      const li = e.target.closest('.stop-item'); if (!li || !state.dragId) return;
      e.preventDefault(); e.dataTransfer.dropEffect = 'move';
      $$('.drop-target').forEach(x => x.classList.remove('drop-target')); li.classList.add('drop-target');
    });
    results.addEventListener('drop', e => {
      const li = e.target.closest('.stop-item'); if (!li || !state.dragId) return;
      e.preventDefault(); dropStop(li.dataset.stopId); state.dragId = null;
    });
    results.addEventListener('dragend', () => { state.dragId = null; $$('.dragging, .drop-target').forEach(x => x.classList.remove('dragging', 'drop-target')); });
  }

  // Gentle hero parallax (skipped for reduced motion and touch screens)
  function setupParallax() {
    const hero = $('.hero'), art = $('.hero-art');
    if (reduceMotion() || window.matchMedia('(pointer: coarse)').matches) return;
    let ticking = false;
    hero.addEventListener('mousemove', e => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        art.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        art.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
        ticking = false;
      });
    });
  }

  function initApp() {
    try { const saved = localStorage.getItem('nammatrip-lang'); if (saved === 'kn' || saved === 'en') state.lang = saved; } catch (e) { /* ignore */ }
    buildFormControls();
    bindEvents();
    renderAll();
    syncBudgetFromNumber();
    setupParallax();
    loadPhotos();
    $('#site-header').classList.toggle('scrolled', window.scrollY > 8);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp); else initApp();
}
