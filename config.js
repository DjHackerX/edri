/* ONLY US — the one place to edit. */
window.CONFIG = {
  driveFolderId: '1Vo4W6SR7s6rVEy_Q7BZW6GlSDWh6iZk9',
  // Choose ONE listing method (see README):
  driveApiKey: 'AIzaSyD2wKe-cpD8OSiidmlZg822A4NPuJX6WWw',      // A) restricted, read-only Drive API key
  appsScriptUrl: '',    // B) Google Apps Script web-app URL (apps-script/Code.gs)

  syncSeconds: 60,      // how often an open page re-checks the folder
  cacheMinutes: 30,     // saved list is used for instant paint (and as offline fallback) up to this age
  sort: 'name',         // 'name' | 'date' (upload time, oldest first) | 'newest'
  limit: 0,             // 0 = no limit
  music: 'assets/our-song.mp3',   // '' to hide the music button
  vinylSeconds: 40,     // one full rotation
  longPressMs: 450,
  filenameCaptions: true,         // fall back to the filename as caption
  captions: {           // fileId or filename -> caption
    // 'IMG_1234.jpg': 'Our first coffee',
  },

  start: '2024-07-15T15:30:00+05:30',
  timezone: 'Asia/Kolkata',
  herName: '',          // optional: shown above the credits, e.g. 'Anu'

  story: [
    ['Memory 01 — The beginning', 'Somewhere along the way, an ordinary day became my favourite memory.'],
    ['Memory 02 — Your little things', 'It was never only the big moments. It was the little things that became everything.'],
    ['Memory 03 — Miles apart', 'Different places. Different days. Still, somehow, you feel close to me.'],
    ['Memory 04 — My favourite person', 'Out of all the people I could have met, I’m glad life brought me to you.'],
    ['Memory 05 — Still choosing you', 'Not just for the beautiful days, but for every ordinary day we haven’t lived yet.']
  ],
  // '' = a long pause. [text,'big'|'small'] for styled lines.
  credits: [
    ['AND THAT’S OUR STORY… SO FAR.', 'big'], '',
    'Thank you for being my favourite part of ordinary days.', '',
    'For every laugh, every little memory, every moment I wish could last longer.', '',
    'For the miles between us, and the love that makes them feel smaller.', '',
    'I don’t know every chapter that’s waiting for us.',
    'But I know who I want beside me when we read them.', '',
    'Thank you for being you.', '',
    'Happy us.', ['15 July 2024 · 3:30 PM', 'small'], '',
    ['ONLY US.', 'big']
  ]
};
