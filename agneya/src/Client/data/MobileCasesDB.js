  {
    id: "apple",
    name: "Apple",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    series: ["iPhone 15", "iPhone 14", "iPhone 13", "iPhone 12"]
  },
  {
    id: "samsung",
    name: "Samsung",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg",
    series: ["Galaxy S24", "Galaxy S23", "Galaxy A Series"]
  },
  {
    id: "oneplus",
    name: "OnePlus",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f8/OnePlus_logo.svg",
    series: ["OnePlus 12", "OnePlus 11", "Nord Series"]
  },
  {
    id: "xiaomi",
    name: "Xiaomi",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg",
    series: ["Redmi Note 13", "Xiaomi 14", "Mi Series"]
  },
  {
    id: "poco",
    name: "Poco",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/8b/Poco_logo.svg",
    series: ["X6 Pro", "F5", "M6 Pro"]
  },
  {
    id: "vivo",
    name: "Vivo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Vivo_logo_2019.svg",
    series: ["X100", "V30", "Y200"]
  },
  {
    id: "realme",
    name: "Realme",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/13/Realme-realme_logo_box-RGB-01.svg",
    series: ["12 Pro", "Narzo 70", "C67"]
  },
  {
    id: "oppo",
    name: "Oppo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f8/OPPO_Logo_2019.svg",
    series: ["Reno 11", "Find N3", "A79"]
  },
  {
    id: "iqoo",
    name: "iQOO",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/90/IQOO_logo.svg",
    series: ["12", "Neo 9", "Z9"]
  },
  {
    id: "infinix",
    name: "Infinix",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f5/Infinix_logo.png", // fallback image format
    series: ["Zero 30", "Note 30", "Smart 8"]
  },
  {
    id: "google",
    name: "Google",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
    series: ["Pixel 8", "Pixel 7a", "Pixel Fold"]
  },
  {
    id: "tecno",
    name: "Tecno",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/TECNO_logo.svg",
    series: ["Phantom V Fold", "Camon 20", "Spark 20"]
  },
  {
    id: "nothing",
    name: "Nothing",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/87/Nothing_Logo.svg",
    series: ["Phone (2)", "Phone (2a)", "Phone (1)"]
  },
  {
    id: "motorola",
    name: "Motorola",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/dd/Motorola_logo.svg",
    series: ["Edge 50 Pro", "Moto G84", "Razr 40"]
  }
];

// We define mathematically the shape of the phone case mask.
// width/height represent the physical aspect ratio (scaled down).
// camera defines the cutout. This can be complex paths if needed.
export const phoneModels = [
  {
    id: "oneplus-12",
    brand: "oneplus",
    name: "OnePlus 12",
    shape: { width: 310, height: 640, rx: 35 },
    camera: { type: 'circle', cx: 80, cy: 90, r: 65 },
    price: 399
  },
  {
    id: "iphone-15-pro-max",
    brand: "apple",
    name: "iPhone 15 Pro Max",
    shape: { width: 320, height: 650, rx: 45 },
    // Complex SVG path for camera or standard shapes
    camera: { type: 'rounded-rect', x: 20, y: 20, width: 110, height: 120, rx: 25 },
    price: 399
  },
  {
    id: "iphone-15",
    brand: "apple",
    name: "iPhone 15",
    shape: { width: 300, height: 610, rx: 42 },
    camera: { type: 'rounded-rect', x: 20, y: 20, width: 95, height: 95, rx: 22 },
    price: 399
  },
    {
    id: "iphone-14-pro",
    brand: "apple",
    name: "iPhone 14 Pro",
    shape: { width: 300, height: 610, rx: 42 },
    camera: { type: 'rounded-rect', x: 20, y: 20, width: 105, height: 115, rx: 25 },
    price: 399
  },
  {
    id: "galaxy-s24-ultra",
    brand: "samsung",
    name: "Galaxy S24 Ultra",
    shape: { width: 330, height: 670, rx: 10 }, // sharp corners
    // P-shaped triple lens layout simulated using multiple cutouts or an SVG path
    camera: { 
      type: 'lenses', 
      lenses: [
        { cx: 45, cy: 50, r: 14 },
        { cx: 45, cy: 90, r: 14 },
        { cx: 45, cy: 130, r: 14 },
        { cx: 80, cy: 70, r: 10 },
        { cx: 80, cy: 110, r: 8 }
      ]
    },
    price: 399
  },
  {
    id: "galaxy-s23",
    brand: "samsung",
    name: "Galaxy S23",
    shape: { width: 290, height: 600, rx: 35 },
    camera: { 
      type: 'lenses', 
      lenses: [
        { cx: 35, cy: 40, r: 12 },
        { cx: 35, cy: 75, r: 12 },
        { cx: 35, cy: 110, r: 12 }
      ]
    },
    price: 399
  },

  {
    id: "pixel-8-pro",
    brand: "google",
    name: "Pixel 8 Pro",
    shape: { width: 300, height: 620, rx: 40 },
    camera: { type: 'rounded-rect', x: 0, y: 50, width: 300, height: 40, rx: 10 }, // Visa bar design
    price: 399
  },
  {
    id: "nothing-phone-2",
    brand: "nothing",
    name: "Nothing Phone (2)",
    shape: { width: 310, height: 640, rx: 40 },
    camera: { 
      type: 'lenses', 
      lenses: [
        { cx: 35, cy: 40, r: 15 },
        { cx: 35, cy: 75, r: 15 }
      ]
    },
    price: 399
  },
  {
    id: "moto-edge-50",
    brand: "motorola",
    name: "Edge 50 Pro",
    shape: { width: 300, height: 630, rx: 35 },
    camera: { type: 'rounded-rect', x: 15, y: 15, width: 90, height: 120, rx: 20 },
    price: 399
  },
  {
    id: "redmi-note-13",
    brand: "xiaomi",
    name: "Redmi Note 13 Pro+",
    shape: { width: 300, height: 630, rx: 35 },
    camera: { type: 'rounded-rect', x: 20, y: 20, width: 110, height: 110, rx: 20 },
    price: 399
  },
  {
    id: "poco-x6-pro",
    brand: "poco",
    name: "Poco X6 Pro",
    shape: { width: 310, height: 640, rx: 30 },
    camera: { type: 'rounded-rect', x: 10, y: 10, width: 290, height: 100, rx: 15 }, // Large top block
    price: 399
  },
  {
    id: "vivo-x100",
    brand: "vivo",
    name: "Vivo X100",
    shape: { width: 310, height: 640, rx: 35 },
    camera: { type: 'circle', cx: 155, cy: 150, r: 80 }, // Large center circle
    price: 399
  },
  {
    id: "realme-12-pro",
    brand: "realme",
    name: "Realme 12 Pro",
    shape: { width: 300, height: 640, rx: 30 },
    camera: { type: 'circle', cx: 150, cy: 160, r: 75 }, // Large center circle
    price: 399
  },
  {
    id: "oppo-reno-11",
    brand: "oppo",
    name: "Oppo Reno 11",
    shape: { width: 300, height: 630, rx: 35 },
    camera: { type: 'rounded-rect', x: 20, y: 20, width: 80, height: 140, rx: 40 }, // Pill shape
    price: 399
  },
  {
    id: "iqoo-12",
    brand: "iqoo",
    name: "iQOO 12",
    shape: { width: 310, height: 640, rx: 35 },
    camera: { type: 'rounded-rect', x: 20, y: 25, width: 100, height: 100, rx: 35 }, // Squircle
    price: 399
  },
  {
    id: "infinix-zero-30",
    brand: "infinix",
    name: "Infinix Zero 30",
    shape: { width: 310, height: 640, rx: 30 },
    camera: { type: 'rounded-rect', x: 20, y: 20, width: 100, height: 130, rx: 20 },
    price: 399
  },
  {
    id: "tecno-camon-20",
    brand: "tecno",
    name: "Tecno Camon 20",
    shape: { width: 310, height: 640, rx: 25 },
    camera: { type: 'rounded-rect', x: 20, y: 20, width: 120, height: 140, rx: 25 }, // Geometric
    price: 399
  }
];
