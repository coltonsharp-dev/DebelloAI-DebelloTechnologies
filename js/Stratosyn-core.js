/* ============================================================
   STRATOSYN · CORE JAVASCRIPT
   stratosyn-core.js
   DebelloAI-DebelloTechnologies / js / stratosyn-core.js
   https://debelloai-debellotechnologies.github.io/DebelloAI-DebelloTechnologies/js/stratosyn-core.js

   Architecture:
     Single namespace — window.Stratosyn
     No global scope pollution.
     Each sub-system is a property with its own methods and state.
     HTML files call specific inits. The engine provides capability.

   Sub-systems:
     S.Utils          — DOM helpers, hex→rgb, color maps, data lookups
     S.ElData         — All 118 elements, BY_AN lookup, category data
     S.Slides         — Slide engine: nav, dots, HUD, keyboard, touch
     S.FlipCards      — Element flip cards (D01 S2)
     S.FamilyCards    — Element family flip cards (D02)
     S.Callouts       — Interactive element box glow callouts (D01 S4)
     S.PeriodicTable  — Full interactive PT: build, filter, panel (D01 S6)
     S.RegionMap      — Mini PT metal/nonmetal/metalloid map (D01 S8)
     S.ShellBuilder   — SVG electron shell diagram (D02)
     S.BondBuilder    — Ionic/covalent bond interactive (D03)
     S.ReviewCards    — Click-to-reveal review cards (D03)
     S.Games          — Shared game engine: tiles, zones, scores
     S.Games.Round1   — Order in Row (D01 S5)
     S.Games.Round2   — Group Sort (D01 S7)
     S.Games.Round3   — Metal / Nonmetal / Metalloid sort (D01 S9)
     S.CanvasPost     — Copy Canvas HTML to clipboard
     S.Quiz           — Data-driven quiz engine (all quiz pages)
   ============================================================ */

(function (global) {
  'use strict';

  /* ==========================================================
     NAMESPACE ROOT
     ========================================================== */
  const S = {};


  /* ==========================================================
     UTILS
     Shared helpers used across all sub-systems.
     ========================================================== */
  S.Utils = {

    /** Get element by ID */
    $: function (id) {
      return document.getElementById(id);
    },

    /** Get all elements matching selector as a real array */
    $$: function (sel) {
      return Array.from(document.querySelectorAll(sel));
    },

    /**
     * Convert a 6-char hex color to "R,G,B" string.
     * Used to build rgba() values from the color constants.
     * e.g. h2r('#ef4444') → '239,68,68'
     */
    h2r: function (hex) {
      const h = hex.replace('#', '');
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return r + ',' + g + ',' + b;
    },

    /**
     * Shuffle an array in place using Fisher-Yates.
     * Returns the same array (mutated).
     */
    shuffle: function (arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },

    /**
     * Clamp a number between min and max.
     */
    clamp: function (val, min, max) {
      return Math.min(Math.max(val, min), max);
    },

    /** Category → hex color */
    CC: {
      alkali:     '#ef4444',
      alkaline:   '#f97316',
      transition: '#eab308',
      post:       '#22c55e',
      metalloid:  '#14b8a6',
      nonmetal:   '#3b82f6',
      halogen:    '#8b5cf6',
      noble:      '#a855f7',
      lanthanide: '#ec4899',
      actinide:   '#f43f5e',
      unknown:    '#64748b',
    },

    /** Category key → human-readable label */
    CAT_LABEL: {
      alkali:     'Alkali Metal',
      alkaline:   'Alkaline Earth Metal',
      transition: 'Transition Metal',
      post:       'Post-Transition Metal',
      metalloid:  'Metalloid',
      nonmetal:   'Reactive Nonmetal',
      halogen:    'Halogen',
      noble:      'Noble Gas',
      lanthanide: 'Lanthanide',
      actinide:   'Actinide',
      unknown:    'Unknown',
    },
  };


  /* ==========================================================
     ELEMENT DATA
     All 118 elements.
     Each entry: [an, sym, name, mass, period, group, cat, fact]
     period 8 = lanthanide display row
     period 9 = actinide display row
     ========================================================== */
  S.ElData = {

    /** Raw data array */
    raw: [
      [1,  'H',  'Hydrogen',     '1.008',   1,  1,  'nonmetal',   'Makes up 75% of all matter in the universe'],
      [2,  'He', 'Helium',       '4.003',   1,  18, 'noble',      'Used in balloons and MRI machines'],
      [3,  'Li', 'Lithium',      '6.941',   2,  1,  'alkali',     'Powers your phone\'s rechargeable battery'],
      [4,  'Be', 'Beryllium',    '9.012',   2,  2,  'alkaline',   'Extremely stiff — used in aerospace'],
      [5,  'B',  'Boron',        '10.811',  2,  13, 'metalloid',  'Essential for plant growth'],
      [6,  'C',  'Carbon',       '12.011',  2,  14, 'nonmetal',   'Basis of all known life on Earth'],
      [7,  'N',  'Nitrogen',     '14.007',  2,  15, 'nonmetal',   '78% of the air you breathe'],
      [8,  'O',  'Oxygen',       '15.999',  2,  16, 'nonmetal',   'Most abundant element in Earth\'s crust'],
      [9,  'F',  'Fluorine',     '18.998',  2,  17, 'halogen',    'Most reactive element known'],
      [10, 'Ne', 'Neon',         '20.180',  2,  18, 'noble',      'Glows red-orange in neon signs'],
      [11, 'Na', 'Sodium',       '22.990',  3,  1,  'alkali',     'Explodes in water; safe as table salt (NaCl)'],
      [12, 'Mg', 'Magnesium',    '24.305',  3,  2,  'alkaline',   'Burns with an intense white flame'],
      [13, 'Al', 'Aluminum',     '26.982',  3,  13, 'post',       'Most abundant metal in Earth\'s crust'],
      [14, 'Si', 'Silicon',      '28.086',  3,  14, 'metalloid',  'Every computer chip ever made'],
      [15, 'P',  'Phosphorus',   '30.974',  3,  15, 'nonmetal',   'Essential for DNA and energy (ATP)'],
      [16, 'S',  'Sulfur',       '32.060',  3,  16, 'nonmetal',   'Used in gunpowder and rubber vulcanizing'],
      [17, 'Cl', 'Chlorine',     '35.450',  3,  17, 'halogen',    'Disinfects drinking water and pools'],
      [18, 'Ar', 'Argon',        '39.948',  3,  18, 'noble',      'Fills incandescent light bulbs'],
      [19, 'K',  'Potassium',    '39.098',  4,  1,  'alkali',     'Essential electrolyte — abundant in bananas'],
      [20, 'Ca', 'Calcium',      '40.078',  4,  2,  'alkaline',   'Makes up your bones and teeth'],
      [21, 'Sc', 'Scandium',     '44.956',  4,  3,  'transition', 'Used in high-performance sports equipment'],
      [22, 'Ti', 'Titanium',     '47.867',  4,  4,  'transition', 'Strong as steel at half the weight'],
      [23, 'V',  'Vanadium',     '50.942',  4,  5,  'transition', 'Strengthens steel for tools and springs'],
      [24, 'Cr', 'Chromium',     '51.996',  4,  6,  'transition', 'Makes stainless steel shiny and rust-proof'],
      [25, 'Mn', 'Manganese',    '54.938',  4,  7,  'transition', 'Essential for steel production'],
      [26, 'Fe', 'Iron',         '55.845',  4,  8,  'transition', 'Carries oxygen in your blood via hemoglobin'],
      [27, 'Co', 'Cobalt',       '58.933',  4,  9,  'transition', 'Makes permanent magnets and blue pigment'],
      [28, 'Ni', 'Nickel',       '58.693',  4,  10, 'transition', 'US 5-cent coin is 75% copper, 25% nickel'],
      [29, 'Cu', 'Copper',       '63.546',  4,  11, 'transition', 'Best common electrical conductor for wiring'],
      [30, 'Zn', 'Zinc',         '65.38',   4,  12, 'transition', 'Galvanizing — prevents steel from rusting'],
      [31, 'Ga', 'Gallium',      '69.723',  4,  13, 'post',       'Melts in your hand (melting point 29.8°C)'],
      [32, 'Ge', 'Germanium',    '72.630',  4,  14, 'metalloid',  'Used in semiconductors and fiber optics'],
      [33, 'As', 'Arsenic',      '74.922',  4,  15, 'metalloid',  'Toxic but used in some semiconductors'],
      [34, 'Se', 'Selenium',     '78.971',  4,  16, 'nonmetal',   'Essential trace mineral for human health'],
      [35, 'Br', 'Bromine',      '79.904',  4,  17, 'halogen',    'One of only two liquid elements at room temp'],
      [36, 'Kr', 'Krypton',      '83.798',  4,  18, 'noble',      'Used in high-performance flash photography'],
      [37, 'Rb', 'Rubidium',     '85.468',  5,  1,  'alkali',     'Used in atomic clocks (incredibly precise)'],
      [38, 'Sr', 'Strontium',    '87.62',   5,  2,  'alkaline',   'Makes brilliant red colors in fireworks'],
      [39, 'Y',  'Yttrium',      '88.906',  5,  3,  'transition', 'Used in LED lights and laser crystals'],
      [40, 'Zr', 'Zirconium',    '91.224',  5,  4,  'transition', 'Used in nuclear reactor fuel rod cladding'],
      [41, 'Nb', 'Niobium',      '92.906',  5,  5,  'transition', 'Becomes superconducting at very low temps'],
      [42, 'Mo', 'Molybdenum',   '95.96',   5,  6,  'transition', 'Strengthens high-performance steel alloys'],
      [43, 'Tc', 'Technetium',   '98',      5,  7,  'transition', 'First artificially produced element (1937)'],
      [44, 'Ru', 'Ruthenium',    '101.07',  5,  8,  'transition', 'Used in hard disk drive coatings'],
      [45, 'Rh', 'Rhodium',      '102.906', 5,  9,  'transition', 'Used in catalytic converters'],
      [46, 'Pd', 'Palladium',    '106.42',  5,  10, 'transition', 'Used in catalytic converters and jewelry'],
      [47, 'Ag', 'Silver',       '107.868', 5,  11, 'transition', 'Best electrical conductor of all metals'],
      [48, 'Cd', 'Cadmium',      '112.411', 5,  12, 'transition', 'Used in rechargeable NiCd batteries'],
      [49, 'In', 'Indium',       '114.818', 5,  13, 'post',       'Used in touchscreens (ITO coating)'],
      [50, 'Sn', 'Tin',          '118.710', 5,  14, 'post',       'Used in solder and food cans'],
      [51, 'Sb', 'Antimony',     '121.760', 5,  15, 'metalloid',  'Used in flame retardants'],
      [52, 'Te', 'Tellurium',    '127.60',  5,  16, 'metalloid',  'Used in solar panels and DVDs'],
      [53, 'I',  'Iodine',       '126.904', 5,  17, 'halogen',    'Essential for thyroid hormone production'],
      [54, 'Xe', 'Xenon',        '131.293', 5,  18, 'noble',      'Used in HID car headlights and lasers'],
      [55, 'Cs', 'Cesium',       '132.905', 6,  1,  'alkali',     'Defines the second in atomic clocks'],
      [56, 'Ba', 'Barium',       '137.327', 6,  2,  'alkaline',   'Used as X-ray contrast agent (barium swallow)'],
      [57, 'La', 'Lanthanum',    '138.905', 8,  3,  'lanthanide', 'Used in high-quality camera lenses'],
      [58, 'Ce', 'Cerium',       '140.116', 8,  4,  'lanthanide', 'Used in lighter flints and catalytic converters'],
      [59, 'Pr', 'Praseodymium', '140.908', 8,  5,  'lanthanide', 'Used in powerful neodymium magnets'],
      [60, 'Nd', 'Neodymium',    '144.242', 8,  6,  'lanthanide', 'Makes the strongest permanent magnets known'],
      [61, 'Pm', 'Promethium',   '145',     8,  7,  'lanthanide', 'Radioactive — no stable isotopes exist'],
      [62, 'Sm', 'Samarium',     '150.36',  8,  8,  'lanthanide', 'Used in headphones and guitar pickups'],
      [63, 'Eu', 'Europium',     '151.964', 8,  9,  'lanthanide', 'Makes red and blue colors in TV/phone screens'],
      [64, 'Gd', 'Gadolinium',   '157.25',  8,  10, 'lanthanide', 'Used as MRI contrast agent'],
      [65, 'Tb', 'Terbium',      '158.925', 8,  11, 'lanthanide', 'Used in green phosphors for screens'],
      [66, 'Dy', 'Dysprosium',   '162.500', 8,  12, 'lanthanide', 'Used in hybrid and electric car motors'],
      [67, 'Ho', 'Holmium',      '164.930', 8,  13, 'lanthanide', 'Has the highest magnetic moment of any element'],
      [68, 'Er', 'Erbium',       '167.259', 8,  14, 'lanthanide', 'Used in fiber optic signal amplifiers'],
      [69, 'Tm', 'Thulium',      '168.934', 8,  15, 'lanthanide', 'Used in portable X-ray machines'],
      [70, 'Yb', 'Ytterbium',    '173.054', 8,  16, 'lanthanide', 'Used in stainless steel and atomic clocks'],
      [71, 'Lu', 'Lutetium',     '174.967', 8,  17, 'lanthanide', 'Used in PET scan detectors'],
      [72, 'Hf', 'Hafnium',      '178.49',  6,  4,  'transition', 'Used in nuclear reactor control rods'],
      [73, 'Ta', 'Tantalum',     '180.948', 6,  5,  'transition', 'Used in capacitors for phones and laptops'],
      [74, 'W',  'Tungsten',     '183.84',  6,  6,  'transition', 'Highest melting point of all metals (3422°C)'],
      [75, 'Re', 'Rhenium',      '186.207', 6,  7,  'transition', 'Used in jet engine turbine blades'],
      [76, 'Os', 'Osmium',       '190.23',  6,  8,  'transition', 'Densest naturally occurring element'],
      [77, 'Ir', 'Iridium',      '192.217', 6,  9,  'transition', 'Most corrosion-resistant metal known'],
      [78, 'Pt', 'Platinum',     '195.084', 6,  10, 'transition', 'Used in catalytic converters and jewelry'],
      [79, 'Au', 'Gold',         '196.967', 6,  11, 'transition', 'Most malleable metal — 1g can cover 1 m²'],
      [80, 'Hg', 'Mercury',      '200.592', 6,  12, 'transition', 'Only metal that is liquid at room temperature'],
      [81, 'Tl', 'Thallium',     '204.383', 6,  13, 'post',       'Highly toxic — was used as rat poison'],
      [82, 'Pb', 'Lead',         '207.2',   6,  14, 'post',       'Used in car batteries and radiation shielding'],
      [83, 'Bi', 'Bismuth',      '208.980', 6,  15, 'post',       'Used in Pepto-Bismol and low-melt alloys'],
      [84, 'Po', 'Polonium',     '209',     6,  16, 'metalloid',  'Extremely radioactive — discovered by Marie Curie'],
      [85, 'At', 'Astatine',     '210',     6,  17, 'halogen',    'Rarest naturally occurring element on Earth'],
      [86, 'Rn', 'Radon',        '222',     6,  18, 'noble',      'Radioactive gas from uranium decay in soil'],
      [87, 'Fr', 'Francium',     '223',     7,  1,  'alkali',     'Most unstable naturally occurring element'],
      [88, 'Ra', 'Radium',       '226',     7,  2,  'alkaline',   'Discovered by Marie Curie — intensely radioactive'],
      [89, 'Ac', 'Actinium',     '227',     9,  3,  'actinide',   'Intensely radioactive — glows blue in the dark'],
      [90, 'Th', 'Thorium',      '232.038', 9,  4,  'actinide',   'Potential nuclear fuel — more abundant than uranium'],
      [91, 'Pa', 'Protactinium', '231.036', 9,  5,  'actinide',   'Rare and highly toxic'],
      [92, 'U',  'Uranium',      '238.029', 9,  6,  'actinide',   'Primary nuclear fuel — discovered 1789'],
      [93, 'Np', 'Neptunium',    '237',     9,  7,  'actinide',   'First synthetic transuranic element made'],
      [94, 'Pu', 'Plutonium',    '244',     9,  8,  'actinide',   'Used in nuclear weapons and space power sources'],
      [95, 'Am', 'Americium',    '243',     9,  9,  'actinide',   'Found in household smoke detectors'],
      [96, 'Cm', 'Curium',       '247',     9,  10, 'actinide',   'Named for Marie and Pierre Curie'],
      [97, 'Bk', 'Berkelium',    '247',     9,  11, 'actinide',   'Named for Berkeley, California'],
      [98, 'Cf', 'Californium',  '251',     9,  12, 'actinide',   'Used to start nuclear reactors'],
      [99, 'Es', 'Einsteinium',  '252',     9,  13, 'actinide',   'Named for Albert Einstein'],
      [100,'Fm', 'Fermium',      '257',     9,  14, 'actinide',   'Named for Enrico Fermi'],
      [101,'Md', 'Mendelevium',  '258',     9,  15, 'actinide',   'Named for Dmitri Mendeleev'],
      [102,'No', 'Nobelium',     '259',     9,  16, 'actinide',   'Named for Alfred Nobel'],
      [103,'Lr', 'Lawrencium',   '266',     9,  17, 'actinide',   'Named for Ernest Lawrence'],
      [104,'Rf', 'Rutherfordium','267',     7,  4,  'transition', 'Named for Ernest Rutherford'],
      [105,'Db', 'Dubnium',      '268',     7,  5,  'transition', 'Named for Dubna, Russia'],
      [106,'Sg', 'Seaborgium',   '269',     7,  6,  'transition', 'Named for Glenn Seaborg'],
      [107,'Bh', 'Bohrium',      '270',     7,  7,  'transition', 'Named for Niels Bohr'],
      [108,'Hs', 'Hassium',      '269',     7,  8,  'transition', 'Named for Hesse, Germany'],
      [109,'Mt', 'Meitnerium',   '278',     7,  9,  'unknown',    'Named for Lise Meitner'],
      [110,'Ds', 'Darmstadtium', '281',     7,  10, 'unknown',    'Made at GSI in Darmstadt, Germany'],
      [111,'Rg', 'Roentgenium',  '282',     7,  11, 'unknown',    'Named for Wilhelm Röntgen (X-rays)'],
      [112,'Cn', 'Copernicium',  '285',     7,  12, 'transition', 'Named for Nicolaus Copernicus'],
      [113,'Nh', 'Nihonium',     '286',     7,  13, 'unknown',    'Nihon = Japan — discovered in Japan (2004)'],
      [114,'Fl', 'Flerovium',    '289',     7,  14, 'unknown',    'Named for Flerov Laboratory of Nuclear Reactions'],
      [115,'Mc', 'Moscovium',    '290',     7,  15, 'unknown',    'Named for the Moscow region'],
      [116,'Lv', 'Livermorium',  '293',     7,  16, 'unknown',    'Named for Livermore, California'],
      [117,'Ts', 'Tennessine',   '294',     7,  17, 'halogen',    'Named for Tennessee'],
      [118,'Og', 'Oganesson',    '294',     7,  18, 'noble',      'Named for Yuri Oganessian — heaviest known element'],
    ],

    /** Lookup table: atomic number → element object */
    BY_AN: {},

    /** Lookup table: symbol → element object */
    BY_SYM: {},

    /**
     * Build the lookup tables from raw data.
     * Must be called once before any sub-system uses element data.
     */
    build: function () {
      this.raw.forEach(function (e) {
        const obj = {
          an:     e[0],
          sym:    e[1],
          name:   e[2],
          mass:   e[3],
          period: e[4],
          group:  e[5],
          cat:    e[6],
          fact:   e[7],
        };
        S.ElData.BY_AN[e[0]]  = obj;
        S.ElData.BY_SYM[e[1]] = obj;
      });
    },

    /** Get element by symbol — convenience wrapper */
    bySym: function (sym) {
      return this.BY_SYM[sym] || null;
    },

    /** Get element by atomic number — convenience wrapper */
    byAN: function (an) {
      return this.BY_AN[an] || null;
    },
  };


  /* ==========================================================
     SLIDES
     Slide engine: build dots, navigate, update HUD,
     keyboard arrows, touch swipe.

     Usage:
       Stratosyn.Slides.init();

     HTML requirements:
       <div id="slides"> containing .slide elements
       <div id="hud">  with #hud-sl and .pb > .pf
       <div id="scene-strip">
       <div id="nav">  with #btn-prev, #sl-ctr, #btn-next
     ========================================================== */
  S.Slides = {

    /** Internal state */
    _slides:  [],
    _current: 0,
    _total:   0,

    /** Initialize the slide engine. Builds dots and wires events. */
    init: function () {
      this._slides  = S.Utils.$$('.slide');
      this._total   = this._slides.length;
      this._current = 0;

      if (this._total === 0) return;

      this._buildDots();
      this._wireKeyboard();
      this._wireTouch();
      this.goTo(0);
    },

    /** Build navigation dot strip */
    _buildDots: function () {
      const strip = S.Utils.$('scene-strip');
      if (!strip) return;
      strip.innerHTML = '';

      for (let i = 0; i < this._total; i++) {
        const dot = document.createElement('button');
        dot.className   = 'sdot' + (i === 0 ? ' act' : '');
        dot.setAttribute('aria-label', 'Slide ' + (i + 1));
        dot.addEventListener('click', this.goTo.bind(this, i));
        strip.appendChild(dot);
      }
    },

    /** Navigate to slide n, with optional direction hint (1 or -1) */
    goTo: function (n, dir) {
      const self   = S.Slides;
      const slides = self._slides;
      const N      = self._total;

      if (n < 0 || n >= N) return;

      const d = (dir !== undefined) ? dir : (n > self._current ? 1 : -1);
      const prev = slides[self._current];

      prev.classList.remove('active');
      prev.classList.add(d > 0 ? 'exit-l' : 'exit-r');
      setTimeout(function () {
        prev.classList.remove('exit-l', 'exit-r');
      }, 360);
      prev.scrollTop = 0;

      self._current = n;
      slides[n].classList.add('active');

      /* Update dots */
      S.Utils.$$('.sdot').forEach(function (dot, i) {
        dot.classList.toggle('act', i === n);
      });

      /* Update HUD */
      const hudSl = S.Utils.$('hud-sl');
      if (hudSl) {
        hudSl.textContent =
          String(n + 1).padStart(2, '0') + ' / ' +
          String(N).padStart(2, '0');
      }

      const fill = S.Utils.$$('.pf')[0];
      if (fill) {
        fill.style.width = (N > 1 ? (n / (N - 1)) * 100 : 100) + '%';
      }

      /* Update nav */
      const ctr = S.Utils.$('sl-ctr');
      if (ctr) ctr.textContent = (n + 1) + ' of ' + N;

      const btnPrev = S.Utils.$('btn-prev');
      const btnNext = S.Utils.$('btn-next');
      if (btnPrev) btnPrev.disabled = (n === 0);
      if (btnNext) {
        btnNext.disabled = (n === N - 1);
        btnNext.className = (n === N - 2) ? 'nb prime' : 'nb';
      }
    },

    next: function () {
      S.Slides.goTo(S.Slides._current + 1, 1);
    },

    prev: function () {
      S.Slides.goTo(S.Slides._current - 1, -1);
    },

    _wireKeyboard: function () {
      document.addEventListener('keydown', function (e) {
        const tag = e.target.tagName;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          S.Slides.next();
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          S.Slides.prev();
        }
      });
    },

    _wireTouch: function () {
      let tx0 = 0;
      let ty0 = 0;
      document.addEventListener('touchstart', function (e) {
        tx0 = e.touches[0].clientX;
        ty0 = e.touches[0].clientY;
      }, { passive: true });

      document.addEventListener('touchend', function (e) {
        const dx = e.changedTouches[0].clientX - tx0;
        const dy = e.changedTouches[0].clientY - ty0;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 55) {
          dx < 0 ? S.Slides.next() : S.Slides.prev();
        }
      }, { passive: true });
    },
  };


  /* ==========================================================
     FLIP CARDS — ELEMENT CARDS (D01 S2)
     Builds the element flip gallery.

     Usage:
       Stratosyn.FlipCards.build(galleryId, statusId, elementArray);

     elementArray items: { sym, an, am, cat, name, fact, period, group }
     If elementArray is omitted, uses the default D01 six-element set.
     ========================================================== */
  S.FlipCards = {

    _count: 0,
    _total: 0,

    /** Default six-element set used on D01 S2 */
    DEFAULT_SET: [
      { sym: 'H',  an: 1,  am: '1.008',   cat: 'nonmetal',   name: 'Hydrogen', period: 1, group: 1,
        fact: 'Makes up 75% of all matter in the universe — every water molecule has 2.' },
      { sym: 'O',  an: 8,  am: '15.999',  cat: 'nonmetal',   name: 'Oxygen',   period: 2, group: 16,
        fact: 'You breathe it every few seconds. Most abundant element in Earth\'s crust.' },
      { sym: 'Na', an: 11, am: '22.990',  cat: 'alkali',     name: 'Sodium',   period: 3, group: 1,
        fact: 'Explodes violently in water alone — combined with Cl it becomes table salt.' },
      { sym: 'Fe', an: 26, am: '55.845',  cat: 'transition', name: 'Iron',     period: 4, group: 8,
        fact: 'Carries oxygen in your blood via hemoglobin. Most-used metal in the world.' },
      { sym: 'Si', an: 14, am: '28.086',  cat: 'metalloid',  name: 'Silicon',  period: 3, group: 14,
        fact: 'Every computer chip ever made. Conducts electricity only under conditions.' },
      { sym: 'Au', an: 79, am: '196.967', cat: 'transition', name: 'Gold',     period: 6, group: 11,
        fact: 'Most malleable metal — 1 gram can be hammered to cover a full square meter.' },
    ],

    build: function (galleryId, statusId, elementArray) {
      const gallery  = S.Utils.$(galleryId);
      const statusEl = S.Utils.$(statusId);
      if (!gallery) return;

      const set = elementArray || this.DEFAULT_SET;
      this._count = 0;
      this._total = set.length;
      gallery.innerHTML = '';

      const self = this;
      set.forEach(function (el) {
        const col   = S.Utils.CC[el.cat] || '#888';
        const rgb   = S.Utils.h2r(col);
        const card  = document.createElement('div');
        card.className = 'flip-card';
        card.setAttribute('aria-label', 'Element card: ' + el.name);

        card.innerHTML =
          '<div class="fci">' +
            '<div class="ff z-' + el.cat + '">' +
              '<div class="ff-an">' + el.an + '</div>' +
              '<div class="ff-sym">' + el.sym + '</div>' +
              '<div class="ff-mass">' + el.am + '</div>' +
              '<div class="ff-hint">click to flip</div>' +
            '</div>' +
            '<div class="ff back" style="border-color:' + col + ';background:rgba(' + rgb + ',.12);">' +
              '<div class="fb-top">' +
                '<div class="fb-name" style="color:' + col + ';">' + el.name + '</div>' +
                '<div class="fb-cat" style="color:' + col + ';">' +
                  (S.Utils.CAT_LABEL[el.cat] || el.cat) +
                '</div>' +
              '</div>' +
              '<div class="fb-fact">' + el.fact + '</div>' +
              '<div class="fb-meta">AN: ' + el.an + ' · AM: ' + el.am +
                ' · Period ' + el.period + ' · Group ' + el.group + '</div>' +
            '</div>' +
          '</div>';

        card.addEventListener('click', function () {
          const wasFlipped = card.classList.contains('flipped');
          card.classList.toggle('flipped');

          if (!wasFlipped) {
            self._count++;
          } else {
            self._count--;
          }

          if (statusEl) {
            if (self._count === self._total) {
              statusEl.textContent = '✓ All ' + self._total + ' cards explored — continue →';
              statusEl.classList.add('done');
            } else {
              statusEl.textContent = self._count + ' / ' + self._total + ' flipped';
              statusEl.classList.remove('done');
            }
          }
        });

        gallery.appendChild(card);
      });
    },
  };


  /* ==========================================================
     FAMILY CARDS — ELEMENT FAMILY FLIP CARDS (D02)
     Builds the element family flip gallery.

     Usage:
       Stratosyn.FamilyCards.build(galleryId, statusId, familyArray);

     familyArray items:
       { group, name, ve, examples:[], trait, realWorld, color }
     ========================================================== */
  S.FamilyCards = {

    _count: 0,
    _total: 0,

    build: function (galleryId, statusId, familyArray) {
      const gallery  = S.Utils.$(galleryId);
      const statusEl = S.Utils.$(statusId);
      if (!gallery || !familyArray) return;

      this._count = 0;
      this._total = familyArray.length;
      gallery.innerHTML = '';

      const self = this;
      familyArray.forEach(function (fam) {
        const col = fam.color || '#888';
        const rgb = S.Utils.h2r(col);
        const card = document.createElement('div');
        card.className = 'fam-card';
        card.setAttribute('aria-label', 'Family card: ' + fam.name);

        const exampleSyms = fam.examples
          .map(function (s) { return '<span class="ff-ex-el" style="color:' + col + ';">' + s + '</span>'; })
          .join('');

        card.innerHTML =
          '<div class="fci">' +
            '<div class="ff" style="border-color:' + col + ';background:rgba(' + rgb + ',.08);">' +
              '<div class="ff-group">Group ' + fam.group + '</div>' +
              '<div class="ff-fname" style="color:' + col + ';">' + fam.name + '</div>' +
              '<div class="ff-examples">' + exampleSyms + '</div>' +
              '<div class="ff-hint">click to flip</div>' +
            '</div>' +
            '<div class="ff back" style="border-color:' + col + ';background:rgba(' + rgb + ',.10);">' +
              '<div class="fb-ve">' +
                '<div class="fb-ve-num" style="color:' + col + ';">' + fam.ve + '</div>' +
                '<div class="fb-ve-lbl">valence<br>electrons</div>' +
              '</div>' +
              '<div class="fb-trait">' + fam.trait + '</div>' +
              '<div class="fb-real">' + fam.realWorld + '</div>' +
            '</div>' +
          '</div>';

        card.addEventListener('click', function () {
          const wasFlipped = card.classList.contains('flipped');
          card.classList.toggle('flipped');
          if (!wasFlipped) self._count++; else self._count--;

          if (statusEl) {
            if (self._count === self._total) {
              statusEl.textContent = '✓ All ' + self._total + ' families explored — continue →';
              statusEl.classList.add('done');
            } else {
              statusEl.textContent = self._count + ' / ' + self._total + ' flipped';
              statusEl.classList.remove('done');
            }
          }
        });

        gallery.appendChild(card);
      });
    },
  };


  /* ==========================================================
     CALLOUTS — INTERACTIVE ELEMENT BOX GLOW (D01 S4)
     Highlights individual parts of the element box when
     the corresponding label button is clicked.

     Usage:
       Stratosyn.Callouts.init();
       — HTML buttons call Stratosyn.Callouts.highlight('an')
         where the argument matches a part id prefix:
         'an' | 'sym' | 'nm' | 'am'
     ========================================================== */
  S.Callouts = {

    _active: null,
    _parts:  ['an', 'sym', 'nm', 'am'],

    init: function () {
      /* No setup needed — highlight() is called directly by HTML buttons */
    },

    highlight: function (part) {
      const self = S.Callouts;

      /* Clear all glow classes */
      self._parts.forEach(function (p) {
        const el = S.Utils.$(p + '-part');
        if (el) el.classList.remove('glow-active');
      });

      /* Toggle off if same part clicked again */
      if (self._active === part) {
        self._active = null;
        return;
      }

      self._active = part;
      const target = S.Utils.$(part + '-part');
      if (target) target.classList.add('glow-active');
    },
  };


  /* ==========================================================
     PERIODIC TABLE — FULL INTERACTIVE PT (D01 S6)
     Builds the complete 118-element grid, handles
     category / period / group filters, and the element
     info panel.

     Usage:
       Stratosyn.PeriodicTable.build('pt-table-wrap', 'el-panel');

     Optional filter call (from toolbar buttons):
       Stratosyn.PeriodicTable.filter('alkali', btnElement);
     ========================================================== */
  S.PeriodicTable = {

    _filter:   'all',
    _selected: null,

    /* Row layout: atomic numbers, null = gap,
       '*la' = lanthanide placeholder, '*ac' = actinide placeholder */
    TABLE: [
      [1,   null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 2],
      [3,   4,    null, null, null, null, null, null, null, null, null, null, 5,   6,   7,   8,   9,   10],
      [11,  12,   null, null, null, null, null, null, null, null, null, null, 13,  14,  15,  16,  17,  18],
      [19,  20,   21,  22,  23,  24,  25,  26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  36],
      [37,  38,   39,  40,  41,  42,  43,  44,  45,  46,  47,  48,  49,  50,  51,  52,  53,  54],
      [55,  56,   '*la',72,  73,  74,  75,  76,  77,  78,  79,  80,  81,  82,  83,  84,  85,  86],
      [87,  88,   '*ac',104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118],
    ],

    LANTHA: [57,58,59,60,61,62,63,64,65,66,67,68,69,70,71],
    ACTIN:  [89,90,91,92,93,94,95,96,97,98,99,100,101,102,103],

    build: function (wrapId, panelId) {
      const wrap = S.Utils.$(wrapId);
      if (!wrap) return;

      /* Main grid */
      const mainGrid = document.createElement('div');
      mainGrid.className = 'pt-grid';
      mainGrid.style.flex = '1';

      this.TABLE.forEach(function (row, rowIdx) {
        row.forEach(function (cell) {
          if (cell === null) {
            mainGrid.appendChild(_gap());
            return;
          }
          if (cell === '*la' || cell === '*ac') {
            const ph = document.createElement('div');
            ph.className = 'pt-placeholder';
            ph.textContent = (cell === '*la') ? '57–71' : '89–103';
            mainGrid.appendChild(ph);
            return;
          }
          const d = S.ElData.byAN(cell);
          if (!d) { mainGrid.appendChild(document.createElement('div')); return; }
          mainGrid.appendChild(S.PeriodicTable._makeCell(d, panelId));
        });
      });
      wrap.appendChild(mainGrid);

      /* Spacer */
      const sp = document.createElement('div');
      sp.className = 'pt-spacer';
      wrap.appendChild(sp);

      /* Lanthanide row */
      const laGrid = document.createElement('div');
      laGrid.className = 'pt-fgrid';
      [null, null, ...this.LANTHA, null].forEach(function (an) {
        if (an === null) { laGrid.appendChild(_gap()); return; }
        const d = S.ElData.byAN(an);
        if (!d) { laGrid.appendChild(document.createElement('div')); return; }
        laGrid.appendChild(S.PeriodicTable._makeCell(d, panelId));
      });
      wrap.appendChild(laGrid);

      /* Actinide row */
      const acGrid = document.createElement('div');
      acGrid.className = 'pt-fgrid';
      [null, null, ...this.ACTIN, null].forEach(function (an) {
        if (an === null) { acGrid.appendChild(_gap()); return; }
        const d = S.ElData.byAN(an);
        if (!d) { acGrid.appendChild(document.createElement('div')); return; }
        acGrid.appendChild(S.PeriodicTable._makeCell(d, panelId));
      });
      wrap.appendChild(acGrid);

      function _gap() {
        const g = document.createElement('div');
        g.className = 'pt-gap';
        return g;
      }
    },

    _makeCell: function (d, panelId) {
      const cell = document.createElement('div');
      cell.className = 'pt-cell z-' + d.cat;
      cell.dataset.an      = d.an;
      cell.dataset.cat     = d.cat;
      cell.dataset.period  = d.period <= 7 ? d.period : (d.period === 8 ? 6 : 7);
      cell.dataset.group   = d.group;
      cell.title = d.name + ' (' + d.an + ')';
      cell.innerHTML =
        '<div class="pt-an">' + d.an + '</div>' +
        '<div class="pt-sym">' + d.sym + '</div>';

      cell.addEventListener('click', function () {
        S.PeriodicTable.showPanel(d, cell, panelId);
      });
      return cell;
    },

    showPanel: function (d, cellEl, panelId) {
      const panel = S.Utils.$(panelId || 'el-panel');
      if (!panel) return;

      if (this._selected) this._selected.classList.remove('selected');
      this._selected = cellEl;
      cellEl.classList.add('selected');

      const col = S.Utils.CC[d.cat] || '#888';
      const rgb = S.Utils.h2r(col);

      S.Utils.$('ep-empty').style.display = 'none';
      const cont = S.Utils.$('ep-content');
      if (cont) { cont.style.display = 'flex'; }

      const epBox = S.Utils.$('ep-box');
      if (epBox) {
        epBox.style.borderColor = col;
        epBox.style.background  = 'rgba(' + rgb + ',.1)';
      }

      [['ep-an',   d.an,    col],
       ['ep-sym',  d.sym,   col],
       ['ep-nm',   d.name,  null],
       ['ep-mass', d.mass,  null],
      ].forEach(function (item) {
        const el = S.Utils.$(item[0]);
        if (!el) return;
        el.textContent = item[1];
        if (item[2]) el.style.color = item[2];
      });

      const epCat = S.Utils.$('ep-cat');
      if (epCat) {
        epCat.textContent = S.Utils.CAT_LABEL[d.cat] || d.cat;
        epCat.style.color = col;
      }

      const epPeriod = S.Utils.$('ep-period');
      if (epPeriod) {
        epPeriod.textContent = d.period <= 7
          ? 'Period ' + d.period
          : (d.period === 8 ? 'Lanthanide' : 'Actinide');
      }

      const epGroup = S.Utils.$('ep-group');
      if (epGroup) {
        epGroup.textContent = d.group <= 18 ? 'Group ' + d.group : 'f-block';
      }

      const epFact = S.Utils.$('ep-fact');
      if (epFact) epFact.textContent = d.fact;

      panel.classList.remove('hidden');
    },

    closePanel: function (panelId) {
      if (this._selected) this._selected.classList.remove('selected');
      this._selected = null;

      const panel = S.Utils.$(panelId || 'el-panel');
      if (!panel) return;

      const empty = S.Utils.$('ep-empty');
      const cont  = S.Utils.$('ep-content');
      if (empty) empty.style.display = 'flex';
      if (cont)  cont.style.display  = 'none';
      panel.classList.add('hidden');
    },

    filter: function (mode, btnEl) {
      this._filter = mode;

      S.Utils.$$('.tb-btn').forEach(function (b) { b.classList.remove('act'); });
      if (btnEl) btnEl.classList.add('act');

      S.Utils.$$('.pt-cell').forEach(function (cell) {
        cell.classList.remove('dim', 'hl');
        if (mode === 'all') return;

        const cat    = cell.dataset.cat;
        const period = parseInt(cell.dataset.period, 10);
        const group  = parseInt(cell.dataset.group, 10);

        let match = false;
        if      (mode === 'period3') match = (period === 3);
        else if (mode === 'group1')  match = (group  === 1);
        else if (mode === 'group18') match = (group  === 18);
        else                         match = (cat    === mode);

        cell.classList.add(match ? 'hl' : 'dim');
      });
    },
  };


  /* ==========================================================
     REGION MAP — MINI PT METAL/NONMETAL/METALLOID (D01 S8)
     Builds a simplified 7×18 color-coded periodic table
     showing the three main regions.

     Usage:
       Stratosyn.RegionMap.build('region-map');
     ========================================================== */
  S.RegionMap = {

    /** Row patterns: M=Metal, N=Nonmetal, T=Metalloid, E=empty/gap */
    ROWS: [
      ['N','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','N'],
      ['M','M','E','E','E','E','E','E','E','E','E','E','T','N','N','N','N','N'],
      ['M','M','E','E','E','E','E','E','E','E','E','E','M','T','N','N','N','N'],
      ['M','M','M','M','M','M','M','M','M','M','M','M','M','T','T','N','N','N'],
      ['M','M','M','M','M','M','M','M','M','M','M','M','M','M','T','T','N','N'],
      ['M','M','E','M','M','M','M','M','M','M','M','M','M','M','M','T','N','N'],
      ['M','M','E','M','M','M','M','M','M','M','M','M','M','M','M','M','N','N'],
    ],

    RC: {
      M: 'rgba(234,179,8,.3)',
      N: 'rgba(59,130,246,.25)',
      T: 'rgba(20,184,166,.25)',
      E: 'rgba(255,255,255,.03)',
    },

    build: function (containerId) {
      const el = S.Utils.$(containerId);
      if (!el) return;

      const grid = document.createElement('div');
      grid.className = 'rm-grid';

      this.ROWS.forEach(function (row) {
        row.forEach(function (t) {
          const cell = document.createElement('div');
          cell.className = 'rm-cell';
          cell.style.background = S.RegionMap.RC[t];
          grid.appendChild(cell);
        });
      });

      el.appendChild(grid);
    },
  };


  /* ==========================================================
     SHELL BUILDER — SVG ELECTRON SHELL DIAGRAM (D02)
     Renders concentric shell rings with electron dots
     for a selected element.

     Usage:
       Stratosyn.ShellBuilder.init(svgId, shellData);

     shellData is an array of element config objects:
       { sym, an, name, cat, shells: [2, 8, 1], ve: 1 }
     shells = electrons per shell from innermost outward.
     ========================================================== */
  S.ShellBuilder = {

    _svgId:    null,
    _data:     null,
    _active:   null,

    RING_RADII: [32, 56, 80, 104, 128, 152, 176],

    init: function (svgId, shellData) {
      this._svgId  = svgId;
      this._data   = shellData;
      this._active = null;

      /* Build the shell selector buttons */
      const ctrlWrap = S.Utils.$$('.shell-controls')[0];
      if (!ctrlWrap || !shellData) return;

      /* Clear existing buttons except label */
      const existing = ctrlWrap.querySelectorAll('.shell-btn');
      existing.forEach(function (b) { b.remove(); });

      shellData.forEach(function (item) {
        const col = S.Utils.CC[item.cat] || '#888';
        const btn = document.createElement('button');
        btn.className = 'shell-btn';
        btn.dataset.sym = item.sym;
        btn.innerHTML =
          '<span class="sb-sym" style="color:' + col + ';">' + item.sym + '</span>' +
          '<span class="sb-info">' +
            '<span class="sb-name">' + item.name + '</span>' +
            '<span class="sb-an">AN: ' + item.an + '</span>' +
          '</span>';

        btn.addEventListener('click', function () {
          S.Utils.$$('.shell-btn').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          S.ShellBuilder.render(item);
        });

        ctrlWrap.appendChild(btn);
      });

      /* Auto-select first */
      if (shellData.length > 0) {
        ctrlWrap.querySelectorAll('.shell-btn')[0].click();
      }
    },

    render: function (item) {
      this._active = item;
      const svgEl = S.Utils.$(this._svgId);
      if (!svgEl) return;

      const cx   = 170;
      const cy   = 170;
      const col  = S.Utils.CC[item.cat] || '#888';
      const rgb  = S.Utils.h2r(col);
      const RADII = this.RING_RADII;

      const ns = 'http://www.w3.org/2000/svg';

      /* Clear SVG */
      svgEl.innerHTML = '';
      svgEl.setAttribute('viewBox', '0 0 340 340');

      /* Nucleus */
      const nucleus = document.createElementNS(ns, 'circle');
      nucleus.setAttribute('cx', cx);
      nucleus.setAttribute('cy', cy);
      nucleus.setAttribute('r', 18);
      nucleus.setAttribute('fill', 'rgba(' + rgb + ',.25)');
      nucleus.setAttribute('stroke', col);
      nucleus.setAttribute('stroke-width', '1');
      svgEl.appendChild(nucleus);

      const nucLabel = document.createElementNS(ns, 'text');
      nucLabel.setAttribute('x', cx);
      nucLabel.setAttribute('y', cy + 5);
      nucLabel.setAttribute('text-anchor', 'middle');
      nucLabel.setAttribute('fill', col);
      nucLabel.setAttribute('font-family', 'Impact, sans-serif');
      nucLabel.setAttribute('font-size', '14');
      nucLabel.textContent = item.sym;
      svgEl.appendChild(nucLabel);

      /* Total valence electron count */
      const totalShells = item.shells.length;

      item.shells.forEach(function (count, shellIdx) {
        const r      = RADII[shellIdx];
        const isLast = (shellIdx === totalShells - 1);

        /* Ring */
        const ring = document.createElementNS(ns, 'circle');
        ring.setAttribute('cx', cx);
        ring.setAttribute('cy', cy);
        ring.setAttribute('r', r);
        ring.setAttribute('class', 'shell-ring' + (isLast ? ' active' : ''));
        ring.setAttribute('stroke', isLast ? col : 'rgba(221,230,245,.35)');
        svgEl.appendChild(ring);

        /* Shell label */
        const label = document.createElementNS(ns, 'text');
        label.setAttribute('x', cx + r + 4);
        label.setAttribute('y', cy + 4);
        label.setAttribute('fill', 'rgba(221,230,245,.3)');
        label.setAttribute('font-family', 'monospace');
        label.setAttribute('font-size', '8');
        label.textContent = 'n=' + (shellIdx + 1);
        svgEl.appendChild(label);

        /* Electron dots evenly distributed around ring */
        for (let i = 0; i < count; i++) {
          const angle = (2 * Math.PI * i / count) - (Math.PI / 2);
          const ex    = cx + r * Math.cos(angle);
          const ey    = cy + r * Math.sin(angle);
          const dot   = document.createElementNS(ns, 'circle');
          dot.setAttribute('cx', ex);
          dot.setAttribute('cy', ey);
          dot.setAttribute('r', isLast ? 4.5 : 3.5);
          dot.setAttribute('fill', isLast ? col : 'rgba(221,230,245,.55)');
          dot.setAttribute('class', 'e-dot' + (isLast ? ' valence' : ''));
          svgEl.appendChild(dot);
        }
      });

      /* Update info panel if present */
      const infoPanel = S.Utils.$$('.shell-info-panel')[0];
      if (!infoPanel || !item.info) return;
      infoPanel.innerHTML = '';

      item.info.forEach(function (row) {
        const div = document.createElement('div');
        div.className = 'sip-row';
        div.innerHTML =
          '<div class="sip-key">' + row.key + '</div>' +
          '<div class="sip-val">' + row.val + '</div>';
        infoPanel.appendChild(div);
      });
    },
  };


  /* ==========================================================
     BOND BUILDER — IONIC / COVALENT INTERACTIVE (D03)
     Renders atom diagrams, transfer/sharing arrow, and
     the resulting compound for a selected element pair.

     Usage:
       Stratosyn.BondBuilder.init(stageId, pairsId, bondPairs);

     bondPairs is an array of bond config objects:
       { label, type: 'ionic'|'covalent', formula, name,
         atomA: { sym, shells:[], cat }, atomB: { sym, shells:[], cat },
         info: [{ key, val }] }
     ========================================================== */
  S.BondBuilder = {

    _active: null,

    init: function (stageId, pairsId, bondPairs) {
      if (!bondPairs || !bondPairs.length) return;

      const pairsEl = S.Utils.$(pairsId);
      if (pairsEl) {
        pairsEl.innerHTML = '';
        bondPairs.forEach(function (pair) {
          const btn = document.createElement('button');
          btn.className = 'bb-pair-btn';
          btn.innerHTML =
            '<span class="bb-sym">' + pair.atomA.sym + '</span>' +
            '<span>+</span>' +
            '<span class="bb-sym">' + pair.atomB.sym + '</span>';

          btn.addEventListener('click', function () {
            S.Utils.$$('.bb-pair-btn').forEach(function (b) {
              b.classList.remove('active-ionic', 'active-covalent');
            });
            btn.classList.add('active-' + pair.type);
            S.BondBuilder.render(stageId, pair);
          });

          pairsEl.appendChild(btn);
        });
      }

      /* Auto-select first pair */
      if (bondPairs.length > 0) {
        const firstBtn = pairsEl ? pairsEl.querySelector('.bb-pair-btn') : null;
        if (firstBtn) firstBtn.click();
      }
    },

    render: function (stageId, pair) {
      this._active = pair;
      const stage = S.Utils.$(stageId);
      if (!stage) return;

      const ionicColor    = getComputedStyle(document.documentElement)
        .getPropertyValue('--ionic').trim()    || '#3effa0';
      const covalentColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--covalent').trim() || '#c084fc';
      const typeCol = (pair.type === 'ionic') ? ionicColor : covalentColor;
      const typeRgb = S.Utils.h2r(typeCol);

      stage.innerHTML =
        '<div class="bb-atom">' +
          '<div class="bb-atom-label">' + pair.atomA.sym + ' — ' + S.ElData.bySym(pair.atomA.sym)?.name + '</div>' +
          '<div class="bb-atom-box">' + _atomSVG(pair.atomA) + '</div>' +
        '</div>' +
        '<div class="bb-arrow">' +
          '<div class="bb-arrow-icon" style="color:' + typeCol + ';">' +
            (pair.type === 'ionic' ? '→' : '⇌') +
          '</div>' +
          '<div class="bb-arrow-lbl" style="color:' + typeCol + ';">' +
            (pair.type === 'ionic' ? 'transfers' : 'shares') +
          '</div>' +
        '</div>' +
        '<div class="bb-atom">' +
          '<div class="bb-atom-label">' + pair.atomB.sym + ' — ' + S.ElData.bySym(pair.atomB.sym)?.name + '</div>' +
          '<div class="bb-atom-box">' + _atomSVG(pair.atomB) + '</div>' +
        '</div>' +
        '<div class="bb-result">' +
          '<div class="bb-result-formula" style="color:' + typeCol + ';">' + pair.formula + '</div>' +
          '<div class="bb-result-name">' + pair.name + '</div>' +
          '<div class="bb-result-type" style="color:' + typeCol + ';">' + pair.type.toUpperCase() + ' BOND</div>' +
        '</div>' +
        '<div class="bb-info">' +
          (pair.info || []).map(function (row) {
            return '<div class="bb-info-row">' +
              '<div class="bb-info-key">' + row.key + '</div>' +
              '<div class="bb-info-val">' + row.val + '</div>' +
              '</div>';
          }).join('') +
        '</div>';

      function _atomSVG(atom) {
        const col   = S.Utils.CC[atom.cat] || '#888';
        const rgb   = S.Utils.h2r(col);
        const radii = [22, 38, 54, 70];
        const cx = 80; const cy = 80;
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 160 160');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');

        const nucleus = document.createElementNS(ns, 'circle');
        nucleus.setAttribute('cx', cx); nucleus.setAttribute('cy', cy);
        nucleus.setAttribute('r', '14');
        nucleus.setAttribute('fill', 'rgba(' + rgb + ',.25)');
        nucleus.setAttribute('stroke', col); nucleus.setAttribute('stroke-width', '1');
        svg.appendChild(nucleus);

        const label = document.createElementNS(ns, 'text');
        label.setAttribute('x', cx); label.setAttribute('y', cy + 5);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', col);
        label.setAttribute('font-family', 'Impact,sans-serif');
        label.setAttribute('font-size', '11');
        label.textContent = atom.sym;
        svg.appendChild(label);

        (atom.shells || []).forEach(function (count, si) {
          const r = radii[si] || (radii[radii.length - 1] + si * 16);
          const ring = document.createElementNS(ns, 'circle');
          ring.setAttribute('cx', cx); ring.setAttribute('cy', cy);
          ring.setAttribute('r', r);
          ring.setAttribute('fill', 'none');
          ring.setAttribute('stroke', 'rgba(221,230,245,.2)');
          ring.setAttribute('stroke-dasharray', '3 2');
          svg.appendChild(ring);

          for (let i = 0; i < count; i++) {
            const angle = (2 * Math.PI * i / count) - (Math.PI / 2);
            const ex = cx + r * Math.cos(angle);
            const ey = cy + r * Math.sin(angle);
            const dot = document.createElementNS(ns, 'circle');
            dot.setAttribute('cx', ex); dot.setAttribute('cy', ey);
            dot.setAttribute('r', '3');
            dot.setAttribute('fill', col);
            svg.appendChild(dot);
          }
        });

        const div = document.createElement('div');
        div.appendChild(svg);
        return div.innerHTML;
      }
    },
  };


  /* ==========================================================
     REVIEW CARDS — CLICK-TO-REVEAL GRID (D03)
     Builds a grid of Q&A cards that reveal answers on click.

     Usage:
       Stratosyn.ReviewCards.build(containerId, cardData);

     cardData is an array of: { question, answer }
     ========================================================== */
  S.ReviewCards = {

    build: function (containerId, cardData) {
      const container = S.Utils.$(containerId);
      if (!container || !cardData) return;

      container.innerHTML = '';

      cardData.forEach(function (item) {
        const card = document.createElement('div');
        card.className = 'review-card';

        card.innerHTML =
          '<div class="rc-q">' + item.question + '</div>' +
          '<div class="rc-a">' + item.answer   + '</div>' +
          '<div class="rc-hint">click to reveal</div>';

        card.addEventListener('click', function () {
          card.classList.toggle('revealed');
        });

        container.appendChild(card);
      });
    },
  };


  /* ==========================================================
     GAMES — SHARED ENGINE
     Common tile/zone mechanics used by all three game rounds.
     ========================================================== */
  S.Games = {

    /** Currently selected tile element */
    _selected: null,

    /** Per-round score counters */
    scores: { 1: 0, 2: 0, 3: 0 },

    /** Select a tile, deselect if already selected */
    selTile: function (el) {
      if (el.classList.contains('placed')) return;
      if (this._selected === el) {
        this.clearSel();
        return;
      }
      this.clearSel();
      this._selected = el;
      el.classList.add('sel');
    },

    /** Clear current selection */
    clearSel: function () {
      S.Utils.$$('.tile.sel').forEach(function (t) { t.classList.remove('sel'); });
      S.Games._selected = null;
    },

    /** Flash a zone red to indicate wrong placement */
    wrongFlash: function (zone) {
      zone.classList.add('bad');
      this.clearSel();
      setTimeout(function () { zone.classList.remove('bad'); }, 460);
    },

    /**
     * Build a clickable element tile from a symbol string.
     * Returns an HTMLElement.
     */
    makeTile: function (sym) {
      const d   = S.ElData.bySym(sym);
      const col = d ? (S.Utils.CC[d.cat] || '#888') : '#888';
      const rgb = S.Utils.h2r(col);

      const el = document.createElement('button');
      el.className    = 'tile';
      el.dataset.sym  = sym;
      el.style.borderColor = col;
      el.style.background  = 'rgba(' + rgb + ',.1)';
      el.setAttribute('aria-label', (d ? d.name : sym) + ' — atomic number ' + (d ? d.an : ''));

      el.innerHTML =
        '<span class="t-an" style="color:' + col + ';">' + (d ? d.an : '') + '</span>' +
        '<span class="t-sym" style="color:' + col + ';">' + sym + '</span>' +
        '<span class="t-nm">' + (d ? d.name : '') + '</span>';

      el.addEventListener('click', function () { S.Games.selTile(el); });
      return el;
    },

    /**
     * Build a small placed element chip for inside zones.
     * Returns an HTMLElement.
     */
    miniEl: function (sym) {
      const d   = S.ElData.bySym(sym);
      const col = d ? (S.Utils.CC[d.cat] || '#888') : '#888';
      const rgb = S.Utils.h2r(col);

      const el = document.createElement('div');
      el.className = 'mini-el';
      el.style.borderColor = col;
      el.style.background  = 'rgba(' + rgb + ',.12)';
      el.innerHTML =
        '<span class="mini-sym" style="color:' + col + ';">' + sym + '</span>' +
        '<span class="mini-nm">' + (d ? d.name : '') + '</span>';
      return el;
    },

    /** Reset a round by round number */
    reset: function (n) {
      this.clearSel();
      if (n === 1) this.Round1.build();
      if (n === 2) this.Round2.build();
      if (n === 3) this.Round3.build();
    },
  };


  /* ==========================================================
     GAMES — ROUND 1: ORDER IN THE ROW (D01 S5)
     Place Period 3 elements into correct atomic-number slots.

     Config:
       S.Games.Round1.CONFIG = {
         bankId:   'bank1',
         gridId:   'grid1',
         scoreId:  'g1-sc',
         elements: ['Na','Mg','Al','Si','P','Cl'],
         anMap:    { Na:11, Mg:12, Al:13, Si:14, P:15, Cl:17 }
       };
     ========================================================== */
  S.Games.Round1 = {

    CONFIG: {
      bankId:   'bank1',
      gridId:   'grid1',
      scoreId:  'g1-sc',
      elements: ['Na', 'Mg', 'Al', 'Si', 'P', 'Cl'],
      anMap:    { Na: 11, Mg: 12, Al: 13, Si: 14, P: 15, Cl: 17 },
    },

    build: function (cfg) {
      const c = cfg || this.CONFIG;
      const bank  = S.Utils.$(c.bankId);
      const grid  = S.Utils.$(c.gridId);
      const score = S.Utils.$(c.scoreId);
      if (!bank || !grid) return;

      bank.innerHTML  = '';
      grid.innerHTML  = '';
      S.Games.scores[1] = 0;
      if (score) { score.textContent = 'Placed: 0 / ' + c.elements.length; score.className = 'g-score'; }

      const shuffled = S.Utils.shuffle([...c.elements]);
      shuffled.forEach(function (sym) { bank.appendChild(S.Games.makeTile(sym)); });

      const total = c.elements.length;
      c.elements.forEach(function (sym) {
        const zone = document.createElement('div');
        zone.className    = 'zone g1-z';
        zone.dataset.expects = sym;
        zone.innerHTML    =
          '<div class="z-lbl a">' + c.anMap[sym] + '</div>' +
          '<div class="z-lbl" style="font-size:clamp(.4rem,.62vw,.5rem);margin-top:2px;">Period 3</div>';

        zone.addEventListener('click', function () {
          if (!S.Games._selected) return;
          const s = S.Games._selected.dataset.sym;
          if (s === zone.dataset.expects) {
            zone.innerHTML = '';
            zone.classList.add('ok');
            zone.appendChild(S.Games.miniEl(s));
            S.Games._selected.classList.add('placed');
            S.Games.clearSel();
            S.Games.scores[1]++;
            if (score) {
              score.textContent = 'Placed: ' + S.Games.scores[1] + ' / ' + total;
              if (S.Games.scores[1] === total) score.className = 'g-score g-done';
            }
          } else {
            S.Games.wrongFlash(zone);
          }
        });

        grid.appendChild(zone);
      });
    },
  };


  /* ==========================================================
     GAMES — ROUND 2: GROUP SORT (D01 S7)
     Sort elements into Group 1 or Group 18.

     Config:
       S.Games.Round2.CONFIG = { bankId, scoreId, zoneG1Id, zoneG18Id,
         contentG1Id, contentG18Id, elements, groupMap }
     ========================================================== */
  S.Games.Round2 = {

    CONFIG: {
      bankId:       'bank2',
      scoreId:      'g2-sc',
      zoneG1Id:     'zone-g1',
      zoneG18Id:    'zone-g18',
      contentG1Id:  'c-g1',
      contentG18Id: 'c-g18',
      elements: ['Li', 'Na', 'K', 'He', 'Ne', 'Ar'],
      groupMap: { Li: 1, Na: 1, K: 1, He: 18, Ne: 18, Ar: 18 },
    },

    build: function (cfg) {
      const c    = cfg || this.CONFIG;
      const bank = S.Utils.$(c.bankId);
      if (!bank) return;

      bank.innerHTML = '';
      S.Games.scores[2] = 0;

      const score = S.Utils.$(c.scoreId);
      if (score) { score.textContent = 'Placed: 0 / ' + c.elements.length; score.className = 'g-score'; }

      const cG1  = S.Utils.$(c.contentG1Id);
      const cG18 = S.Utils.$(c.contentG18Id);
      if (cG1)  cG1.innerHTML  = '';
      if (cG18) cG18.innerHTML = '';

      [c.zoneG1Id, c.zoneG18Id].forEach(function (id) {
        const z = S.Utils.$(id);
        if (z) z.classList.remove('ok');
      });

      const shuffled = S.Utils.shuffle([...c.elements]);
      shuffled.forEach(function (sym) { bank.appendChild(S.Games.makeTile(sym)); });

      /* Wire zone click handlers */
      [c.zoneG1Id, c.zoneG18Id].forEach(function (zoneId) {
        const zone = S.Utils.$(zoneId);
        if (!zone) return;
        zone.onclick = function () {
          if (!S.Games._selected) return;
          const sym = S.Games._selected.dataset.sym;
          const zg  = parseInt(zone.dataset.group, 10);
          if (c.groupMap[sym] === zg) {
            const contentEl = S.Utils.$(zg === 1 ? c.contentG1Id : c.contentG18Id);
            if (contentEl) contentEl.appendChild(S.Games.miniEl(sym));
            S.Games._selected.classList.add('placed');
            S.Games.clearSel();
            S.Games.scores[2]++;
            const total = c.elements.length;
            if (score) {
              score.textContent = 'Placed: ' + S.Games.scores[2] + ' / ' + total;
              if (S.Games.scores[2] === total) {
                score.className = 'g-score g-done';
                [c.zoneG1Id, c.zoneG18Id].forEach(function (id) {
                  const z = S.Utils.$(id);
                  if (z) z.classList.add('ok');
                });
              }
            }
          } else {
            S.Games.wrongFlash(zone);
          }
        };
      });
    },
  };


  /* ==========================================================
     GAMES — ROUND 3: METAL / NONMETAL / METALLOID (D01 S9)
     Sort elements into the three region bins.

     Config:
       S.Games.Round3.CONFIG = { bankId, scoreId,
         binIds: { metal, nonmetal, metalloid },
         contentIds: { metal, nonmetal, metalloid },
         elements, regionMap }
     ========================================================== */
  S.Games.Round3 = {

    CONFIG: {
      bankId:  'bank3',
      scoreId: 'g3-sc',
      binIds: {
        metal:     'bin-m',
        nonmetal:  'bin-n',
        metalloid: 'bin-t',
      },
      contentIds: {
        metal:     'bmc',
        nonmetal:  'bnc',
        metalloid: 'btc',
      },
      elements: ['Fe', 'Ca', 'O', 'Cl', 'Si', 'Ge'],
      regionMap: {
        Fe: 'metal', Ca: 'metal',
        O:  'nonmetal', Cl: 'nonmetal',
        Si: 'metalloid', Ge: 'metalloid',
      },
    },

    build: function (cfg) {
      const c    = cfg || this.CONFIG;
      const bank = S.Utils.$(c.bankId);
      if (!bank) return;

      bank.innerHTML = '';
      S.Games.scores[3] = 0;

      const score = S.Utils.$(c.scoreId);
      if (score) { score.textContent = 'Placed: 0 / ' + c.elements.length; score.className = 'g-score'; }

      Object.values(c.contentIds).forEach(function (id) {
        const el = S.Utils.$(id);
        if (el) el.innerHTML = '';
      });
      Object.values(c.binIds).forEach(function (id) {
        const el = S.Utils.$(id);
        if (el) el.classList.remove('ok');
      });

      const shuffled = S.Utils.shuffle([...c.elements]);
      shuffled.forEach(function (sym) { bank.appendChild(S.Games.makeTile(sym)); });

      const regions = Object.keys(c.binIds);
      regions.forEach(function (region) {
        const zone = S.Utils.$(c.binIds[region]);
        if (!zone) return;
        zone.onclick = function () {
          if (!S.Games._selected) return;
          const sym = S.Games._selected.dataset.sym;
          const bin = zone.dataset.bin;
          if (c.regionMap[sym] === bin) {
            const contentEl = S.Utils.$(c.contentIds[region]);
            if (contentEl) contentEl.appendChild(S.Games.miniEl(sym));
            S.Games._selected.classList.add('placed');
            S.Games.clearSel();
            S.Games.scores[3]++;
            const total = c.elements.length;
            if (score) {
              score.textContent = 'Placed: ' + S.Games.scores[3] + ' / ' + total;
              if (S.Games.scores[3] === total) {
                score.className = 'g-score g-done';
                Object.values(c.binIds).forEach(function (id) {
                  const z = S.Utils.$(id);
                  if (z) z.classList.add('ok');
                });
              }
            }
          } else {
            S.Games.wrongFlash(zone);
          }
        };
      });
    },
  };


  /* ==========================================================
     CANVAS POST — COPY HTML UTILITY
     Copies the inner HTML of the canvas post container
     to the clipboard.

     Usage:
       Stratosyn.CanvasPost.init(postId, btnId);
       — postId: id of the .canvas-post element
       — btnId:  id of the copy button
     ========================================================== */
  S.CanvasPost = {

    init: function (postId, btnId) {
      const post = S.Utils.$(postId);
      const btn  = S.Utils.$(btnId);
      if (!btn) return;

      btn.addEventListener('click', function () {
        S.CanvasPost.copy(postId, btnId);
      });
    },

    copy: function (postId, btnId) {
      const post = S.Utils.$(postId);
      const btn  = S.Utils.$(btnId);
      if (!post) return;

      navigator.clipboard.writeText(post.outerHTML).then(function () {
        if (btn) {
          const original = btn.textContent;
          btn.textContent = '✓ Copied — Paste into Canvas HTML Editor';
          btn.classList.add('done');
          setTimeout(function () {
            btn.textContent = original;
            btn.classList.remove('done');
          }, 4000);
        }
      }).catch(function () {
        alert('Copy failed — view page source and copy the canvas-post div manually.');
      });
    },
  };


  /* ==========================================================
     QUIZ ENGINE — DATA-DRIVEN QUIZ (ALL QUIZ PAGES)

     The quiz engine is completely data-driven. The HTML page
     defines a QUIZ_CONFIG object and calls:
       Stratosyn.Quiz.init(QUIZ_CONFIG);

     The engine handles:
       — Rendering all parts and questions from config
       — MC: first-click-locks-permanently
       — Classify (sort): click-tile then click-zone,
         wrong attempts recorded but correctable
       — Rank/Order: click-tile then click-slot,
         same wrong-attempt recording
       — Score calculation across all parts
       — Submission payload text generation
       — Copy-to-clipboard with unlock-on-complete logic
       — Time-on-task tracking

     ── QUIZ_CONFIG SHAPE ──────────────────────────────────────

     const QUIZ_CONFIG = {
       title:     "Day 4 · Periodic Table Review Quiz",
       teacher:   "Ms. Madewell",
       room:      "Room 501",
       subject:   "7th Grade Science",
       infoFields: ['firstName', 'lastName', 'classPeriod'],

       parts: [
         {
           id:    "part1",
           type:  "multiple-choice",
           label: "Part 1 · Multiple Choice",
           color: "orange",
           points: 10,
           questions: [
             {
               id:   "q1",
               text: "What property organizes the modern periodic table?",
               options: [
                 { letter: "A", text: "Atomic mass",    correct: false },
                 { letter: "B", text: "Atomic number",  correct: true  },
                 { letter: "C", text: "Alphabetical",   correct: false },
                 { letter: "D", text: "Neutron count",  correct: false },
               ],
             },
           ],
         },
         {
           id:    "part2",
           type:  "classify",
           label: "Part 2 · Element Classification",
           color: "yellow",
           points: 6,
           elements: ["Na", "O", "Si", "Fe", "Cl", "B"],
           zones: [
             { id: "metal",     label: "Metal",     correct: ["Na","Fe"] },
             { id: "nonmetal",  label: "Nonmetal",  correct: ["O","Cl"]  },
             { id: "metalloid", label: "Metalloid", correct: ["Si","B"]  },
           ],
         },
         {
           id:    "part3",
           type:  "classify",
           label: "Part 3 · Period Placement",
           color: "green",
           points: 6,
           elements: ["H","Li","Na","B","O","Al"],
           zones: [
             { id: "p1", label: "Period 1", correct: ["H"]        },
             { id: "p2", label: "Period 2", correct: ["Li","B","O"] },
             { id: "p3", label: "Period 3", correct: ["Na","Al"]  },
           ],
         },
         {
           id:    "part4",
           type:  "rank",
           label: "Part 4 · Ordering & Ranking",
           color: "blue",
           points: 9,
           questions: [
             {
               id:        "q23",
               text:      "Rank alkali metals from most to least reactive.",
               elements:  ["Li","Na","K","Rb"],
               correct:   ["Rb","K","Na","Li"],
               posLabels: ["Most Reactive","","","Least Reactive"],
             },
             {
               id:        "q24",
               text:      "Order Period 3 elements by increasing atomic number.",
               elements:  ["Cl","Na","Si","Mg","Al"],
               correct:   ["Na","Mg","Al","Si","Cl"],
               posLabels: ["","","","",""],
             },
           ],
         },
       ],
     };
     ========================================================== */
  S.Quiz = {

    /** Internal state */
    _config:    null,
    _state:     {},     /* id → { answered, correct, attempts } */
    _startTime: null,
    _selected:  null,   /* Currently selected element tile */

    /**
     * Initialize the quiz from a config object.
     * Renders all parts into #quiz-body or the container
     * specified by config.containerId.
     */
    init: function (config) {
      if (!config) { console.error('Stratosyn.Quiz.init: no config provided'); return; }
      this._config    = config;
      this._state     = {};
      this._startTime = Date.now();
      this._selected  = null;

      const container = S.Utils.$(config.containerId || 'quiz-body');
      if (!container) { console.error('Stratosyn.Quiz: container not found'); return; }

      container.innerHTML = '';

      /* Render each part */
      config.parts.forEach(function (part) {
        container.appendChild(S.Quiz._renderPart(part));
      });

      /* Wire the copy button */
      const copyBtn = S.Utils.$(config.copyBtnId || 'quiz-copy-btn');
      if (copyBtn) {
        copyBtn.disabled = true;
        copyBtn.addEventListener('click', function () {
          S.Quiz._copyResults();
        });
      }

      /* Wire student info fields */
      if (config.infoFields) {
        config.infoFields.forEach(function (fieldId) {
          const input = S.Utils.$(fieldId);
          if (input) {
            input.addEventListener('input', function () {
              S.Quiz._checkAllComplete();
            });
          }
        });
      }
    },

    /** Render a single part section */
    _renderPart: function (part) {
      const section = document.createElement('div');
      section.className = 'quiz-part';
      section.id = part.id;

      /* Part header */
      const header = document.createElement('div');
      header.className = 'quiz-part-header ' + (part.color || 'orange');
      header.innerHTML =
        '<span class="quiz-part-title ' + (part.color || 'orange') + '">' + part.label + '</span>' +
        '<span class="quiz-part-pts">' + part.points + ' pts</span>';
      section.appendChild(header);

      if (part.type === 'multiple-choice') {
        part.questions.forEach(function (q) {
          section.appendChild(S.Quiz._renderMC(q, part));
        });
      } else if (part.type === 'classify') {
        section.appendChild(S.Quiz._renderClassify(part));
      } else if (part.type === 'rank') {
        part.questions.forEach(function (q) {
          section.appendChild(S.Quiz._renderRank(q, part));
        });
      }

      return section;
    },

    /** Render a multiple-choice question block */
    _renderMC: function (q, part) {
      /* Initialize state */
      S.Quiz._state[q.id] = { answered: false, correct: false, attempts: 0 };

      const block = document.createElement('div');
      block.className = 'quiz-question';
      block.id = 'q-' + q.id;

      block.innerHTML =
        '<div class="quiz-q-num">Q' + q.id.replace(/\D/g, '') + '</div>' +
        '<div class="quiz-q-text">' + q.text + '</div>' +
        '<div class="quiz-options" id="opts-' + q.id + '"></div>';

      const optsEl = block.querySelector('#opts-' + q.id);

      q.options.forEach(function (opt) {
        const optEl = document.createElement('div');
        optEl.className = 'quiz-option';
        optEl.dataset.correct = opt.correct ? 'true' : 'false';
        optEl.innerHTML =
          '<span class="quiz-option-letter">' + opt.letter + '</span>' +
          '<span>' + opt.text + '</span>';

        optEl.addEventListener('click', function () {
          /* First click locks permanently */
          const st = S.Quiz._state[q.id];
          if (st.answered) return;

          st.answered = true;
          st.attempts++;

          /* Lock all options in this question */
          optsEl.querySelectorAll('.quiz-option').forEach(function (o) {
            o.classList.add(
              o.dataset.correct === 'true' ? 'locked-correct' : 'locked-wrong'
            );
          });

          st.correct = (opt.correct === true);
          S.Quiz._updateScore();
          S.Quiz._checkAllComplete();
        });

        optsEl.appendChild(optEl);
      });

      return block;
    },

    /** Render a classify (sort) question block */
    _renderClassify: function (part) {
      /* Initialize state per element */
      part.elements.forEach(function (sym) {
        S.Quiz._state[part.id + '_' + sym] = {
          placed: false, correct: false, attempts: 0, currentZone: null,
        };
      });

      const block = document.createElement('div');
      block.className = 'quiz-question';
      block.id = 'classify-' + part.id;

      /* Element bank */
      const bankEl = document.createElement('div');
      bankEl.className = 'quiz-sort-bank';
      bankEl.id = 'bank-' + part.id;

      const shuffled = S.Utils.shuffle([...part.elements]);
      shuffled.forEach(function (sym) {
        const tile = S.Games.makeTile(sym);
        tile.addEventListener('click', function () {
          S.Quiz._selectTile(tile);
        });
        /* Remove default game engine listener — we override it */
        bankEl.appendChild(tile);
      });

      block.appendChild(bankEl);

      /* Zone row */
      const zonesEl = document.createElement('div');
      zonesEl.className = 'quiz-sort-zones';

      part.zones.forEach(function (zone) {
        const zoneEl = document.createElement('div');
        zoneEl.className = 'quiz-sort-zone';
        zoneEl.id = 'zone-' + part.id + '-' + zone.id;
        zoneEl.dataset.zoneId = zone.id;
        zoneEl.innerHTML =
          '<div class="quiz-zone-label">' + zone.label + '</div>' +
          '<div class="quiz-zone-content" id="content-' + part.id + '-' + zone.id + '"></div>';

        zoneEl.addEventListener('click', function () {
          S.Quiz._placeInZone(part, zone, zoneEl);
        });

        zonesEl.appendChild(zoneEl);
      });

      block.appendChild(zonesEl);
      return block;
    },

    /** Render a rank/ordering question block */
    _renderRank: function (q, part) {
      S.Quiz._state[q.id] = {
        placements: {},  /* position index → sym */
        attempts: 0,
        complete: false,
      };

      const block = document.createElement('div');
      block.className = 'quiz-question';
      block.id = 'q-' + q.id;

      block.innerHTML =
        '<div class="quiz-q-num">Q' + q.id.replace(/\D/g, '') + '</div>' +
        '<div class="quiz-q-text">' + q.text + '</div>';

      /* Element bank */
      const bankEl = document.createElement('div');
      bankEl.className = 'quiz-sort-bank';
      bankEl.id = 'rank-bank-' + q.id;

      const shuffled = S.Utils.shuffle([...q.elements]);
      shuffled.forEach(function (sym) {
        const tile = S.Games.makeTile(sym);
        tile.addEventListener('click', function () { S.Quiz._selectTile(tile); });
        bankEl.appendChild(tile);
      });

      block.appendChild(bankEl);

      /* Ranking slots */
      const track = document.createElement('div');
      track.className = 'quiz-rank-track';

      q.correct.forEach(function (_, idx) {
        const slot = document.createElement('div');
        slot.className = 'quiz-rank-slot';
        slot.innerHTML =
          '<div class="quiz-rank-position">' +
            (q.posLabels && q.posLabels[idx] ? q.posLabels[idx] : (idx + 1)) +
          '</div>' +
          '<div class="quiz-rank-drop" id="slot-' + q.id + '-' + idx + '" data-idx="' + idx + '">' +
            '<span style="color:var(--tx3);font-size:9px;">—</span>' +
          '</div>';

        slot.querySelector('.quiz-rank-drop').addEventListener('click', function (e) {
          S.Quiz._placeInSlot(q, idx, e.currentTarget);
        });

        track.appendChild(slot);
      });

      block.appendChild(track);
      return block;
    },

    /** Select a quiz tile — unified handler */
    _selectTile: function (tile) {
      if (tile.classList.contains('placed')) return;
      S.Utils.$$('.tile.sel').forEach(function (t) { t.classList.remove('sel'); });

      if (S.Quiz._selected === tile) {
        S.Quiz._selected = null;
        return;
      }
      S.Quiz._selected = tile;
      tile.classList.add('sel');
    },

    /** Place a tile into a classify zone */
    _placeInZone: function (part, zone, zoneEl) {
      if (!S.Quiz._selected) return;

      const sym     = S.Quiz._selected.dataset.sym;
      const stKey   = part.id + '_' + sym;
      const st      = S.Quiz._state[stKey];
      if (!st) return;

      /* If tile is already placed somewhere, remove it from that zone first */
      if (st.currentZone) {
        const prevContent = S.Utils.$('content-' + part.id + '-' + st.currentZone);
        if (prevContent) {
          const existing = prevContent.querySelector('[data-sym="' + sym + '"]');
          if (existing) existing.remove();
        }
        /* Restore the tile in the bank as unplaced */
        const bankTile = S.Utils.$('bank-' + part.id)
          ? S.Utils.$('bank-' + part.id).querySelector('[data-sym="' + sym + '"]')
          : null;
        if (bankTile) bankTile.classList.remove('placed');
      }

      const isCorrect = zone.correct.indexOf(sym) !== -1;
      st.attempts++;
      st.correct     = isCorrect;
      st.placed      = true;
      st.currentZone = zone.id;

      /* Mark tile as placed in bank */
      S.Quiz._selected.classList.add('placed');
      S.Quiz._selected.classList.remove('sel');
      S.Quiz._selected = null;

      /* Add mini chip to zone content */
      const contentEl = S.Utils.$('content-' + part.id + '-' + zone.id);
      if (contentEl) {
        const chip = S.Games.miniEl(sym);
        chip.dataset.sym = sym;
        if (!isCorrect) chip.style.opacity = '0.5';
        contentEl.appendChild(chip);
      }

      if (!isCorrect) {
        /* Flash zone red but do NOT lock — student can correct */
        zoneEl.classList.add('bad');
        setTimeout(function () { zoneEl.classList.remove('bad'); }, 460);
      }

      S.Quiz._updateScore();
      S.Quiz._checkAllComplete();
    },

    /** Place a tile into a rank slot */
    _placeInSlot: function (q, idx, slotEl) {
      if (!S.Quiz._selected) return;

      const sym = S.Quiz._selected.dataset.sym;
      const st  = S.Quiz._state[q.id];
      if (!st) return;

      /* If slot already filled, remove previous occupant */
      const prevSym = st.placements[idx];
      if (prevSym) {
        const prevBank = S.Utils.$('rank-bank-' + q.id);
        if (prevBank) {
          const prevTile = prevBank.querySelector('[data-sym="' + prevSym + '"]');
          if (prevTile) prevTile.classList.remove('placed');
        }
      }

      st.attempts++;
      st.placements[idx] = sym;

      /* Mark tile as placed */
      S.Quiz._selected.classList.add('placed');
      S.Quiz._selected.classList.remove('sel');
      S.Quiz._selected = null;

      /* Update slot display */
      slotEl.classList.add('filled');
      slotEl.innerHTML = '';

      const chip = S.Games.miniEl(sym);
      slotEl.appendChild(chip);

      /* Check if all slots filled → score */
      const totalSlots   = q.correct.length;
      const filledSlots  = Object.keys(st.placements).length;
      if (filledSlots === totalSlots) {
        st.complete = true;
        let correctCount = 0;
        q.correct.forEach(function (expected, i) {
          if (st.placements[i] === expected) {
            correctCount++;
            const slotDrop = S.Utils.$('slot-' + q.id + '-' + i);
            if (slotDrop) slotDrop.classList.add('correct');
          }
        });
        st.correctPlacements = correctCount;
      }

      S.Quiz._updateScore();
      S.Quiz._checkAllComplete();
    },

    /** Calculate and display current total score */
    _updateScore: function () {
      const config = S.Quiz._config;
      if (!config) return;

      let total   = 0;
      let earned  = 0;

      config.parts.forEach(function (part) {
        if (part.type === 'multiple-choice') {
          part.questions.forEach(function (q) {
            total++;
            const st = S.Quiz._state[q.id];
            if (st && st.correct) earned++;
          });
        } else if (part.type === 'classify') {
          part.elements.forEach(function (sym) {
            total++;
            const st = S.Quiz._state[part.id + '_' + sym];
            if (st && st.correct) earned++;
          });
        } else if (part.type === 'rank') {
          part.questions.forEach(function (q) {
            const st = S.Quiz._state[q.id];
            if (st && st.complete) {
              total  += q.correct.length;
              earned += (st.correctPlacements || 0);
            } else {
              total += q.correct.length;
            }
          });
        }
      });

      const scoreVal  = S.Utils.$(config.scoreValueId  || 'quiz-score-value');
      const scoreFrac = S.Utils.$(config.scoreFracId    || 'quiz-score-fraction');
      if (scoreVal)  scoreVal.textContent  = earned;
      if (scoreFrac) scoreFrac.textContent = '/ ' + total;
    },

    /** Check whether all sections are complete and unlock copy button */
    _checkAllComplete: function () {
      const config = S.Quiz._config;
      if (!config) return;

      /* Verify all info fields have content */
      if (config.infoFields) {
        for (let i = 0; i < config.infoFields.length; i++) {
          const input = S.Utils.$(config.infoFields[i]);
          if (!input || !input.value.trim()) return;
        }
      }

      /* Verify all questions answered */
      let allDone = true;

      config.parts.forEach(function (part) {
        if (part.type === 'multiple-choice') {
          part.questions.forEach(function (q) {
            const st = S.Quiz._state[q.id];
            if (!st || !st.answered) allDone = false;
          });
        } else if (part.type === 'classify') {
          part.elements.forEach(function (sym) {
            const st = S.Quiz._state[part.id + '_' + sym];
            if (!st || !st.placed) allDone = false;
          });
        } else if (part.type === 'rank') {
          part.questions.forEach(function (q) {
            const st = S.Quiz._state[q.id];
            if (!st || !st.complete) allDone = false;
          });
        }
      });

      if (!allDone) return;

      /* Unlock the copy button */
      const copyBtn = S.Utils.$(config.copyBtnId || 'quiz-copy-btn');
      if (copyBtn) copyBtn.disabled = false;
    },

    /** Build the text payload for Canvas submission */
    _buildPayload: function () {
      const config = S.Quiz._config;
      if (!config) return '';

      const elapsed = Math.round((Date.now() - (S.Quiz._startTime || Date.now())) / 1000);
      const mins    = Math.floor(elapsed / 60);
      const secs    = elapsed % 60;

      let lines = [];
      lines.push('=== STRATOSYN QUIZ SUBMISSION ===');
      lines.push(config.title || 'Quiz');
      lines.push(config.teacher + ' · ' + config.room + ' · ' + config.subject);
      lines.push('');

      /* Student info */
      if (config.infoFields) {
        config.infoFields.forEach(function (fieldId) {
          const input = S.Utils.$(fieldId);
          if (input) lines.push(fieldId + ': ' + (input.value.trim() || '—'));
        });
        lines.push('');
      }

      lines.push('Time on task: ' + mins + 'm ' + secs + 's');
      lines.push('');

      /* Per-part results */
      config.parts.forEach(function (part) {
        lines.push('--- ' + part.label.toUpperCase() + ' ---');

        if (part.type === 'multiple-choice') {
          let partEarned = 0;
          part.questions.forEach(function (q) {
            const st = S.Quiz._state[q.id];
            const ok = st && st.correct;
            if (ok) partEarned++;
            lines.push(
              'Q' + q.id.replace(/\D/g, '') + ': ' +
              (ok ? 'CORRECT' : 'INCORRECT') +
              (st && st.attempts > 1 ? ' (' + st.attempts + ' attempts)' : '')
            );
          });
          lines.push('Part score: ' + partEarned + ' / ' + part.questions.length);
        } else if (part.type === 'classify') {
          let partEarned = 0;
          part.elements.forEach(function (sym) {
            const st   = S.Quiz._state[part.id + '_' + sym];
            const ok   = st && st.correct;
            if (ok) partEarned++;
            lines.push(
              sym + ': ' +
              (ok ? 'CORRECT' : 'INCORRECT') +
              (st && st.attempts > 1 ? ' (' + st.attempts + ' attempts)' : '')
            );
          });
          lines.push('Part score: ' + partEarned + ' / ' + part.elements.length);
        } else if (part.type === 'rank') {
          let partEarned = 0;
          let partTotal  = 0;
          part.questions.forEach(function (q) {
            const st = S.Quiz._state[q.id];
            const correctPlacements = (st && st.correctPlacements) || 0;
            partEarned += correctPlacements;
            partTotal  += q.correct.length;
            lines.push(
              'Q' + q.id.replace(/\D/g, '') + ': ' +
              correctPlacements + '/' + q.correct.length + ' correct positions' +
              (st && st.attempts > 0 ? ' (' + st.attempts + ' placement attempts)' : '')
            );
          });
          lines.push('Part score: ' + partEarned + ' / ' + partTotal);
        }

        lines.push('');
      });

      /* Total */
      let totalEarned = 0;
      let totalPts    = 0;
      config.parts.forEach(function (part) { totalPts += part.points; });
      config.parts.forEach(function (part) {
        if (part.type === 'multiple-choice') {
          part.questions.forEach(function (q) {
            const st = S.Quiz._state[q.id];
            if (st && st.correct) totalEarned++;
          });
        } else if (part.type === 'classify') {
          part.elements.forEach(function (sym) {
            const st = S.Quiz._state[part.id + '_' + sym];
            if (st && st.correct) totalEarned++;
          });
        } else if (part.type === 'rank') {
          part.questions.forEach(function (q) {
            const st = S.Quiz._state[q.id];
            totalEarned += (st && st.correctPlacements) || 0;
          });
        }
      });

      lines.push('=== TOTAL: ' + totalEarned + ' / ' + totalPts + ' ===');
      lines.push('=== END SUBMISSION ===');

      return lines.join('\n');
    },

    /** Copy the payload to clipboard */
    _copyResults: function () {
      const payload = S.Quiz._buildPayload();
      const copyBtn = S.Utils.$(
        (S.Quiz._config && S.Quiz._config.copyBtnId) || 'quiz-copy-btn'
      );

      navigator.clipboard.writeText(payload).then(function () {
        if (copyBtn) {
          const orig = copyBtn.textContent;
          copyBtn.textContent = '✓ Copied — Paste into Canvas Text Entry';
          copyBtn.classList.add('done');
          setTimeout(function () {
            copyBtn.textContent = orig;
            copyBtn.classList.remove('done');
          }, 5000);
        }
      }).catch(function () {
        /* Fallback — show in a textarea for manual copy */
        const area = document.createElement('textarea');
        area.value = payload;
        area.style.cssText =
          'position:fixed;bottom:0;left:0;width:100%;height:200px;' +
          'z-index:9999;font-family:monospace;font-size:12px;background:#0b0f1e;color:#dde6f5;padding:12px;';
        document.body.appendChild(area);
        area.focus();
        area.select();
        alert('Auto-copy failed. Select all text in the box below and copy manually.');
      });
    },
  };


  /* ==========================================================
     EXPORT — Attach to global window object
     ========================================================== */
  global.Stratosyn = S;

  /* Auto-build element lookup tables on load */
  S.ElData.build();

})(window);
