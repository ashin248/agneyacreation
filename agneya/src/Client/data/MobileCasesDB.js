export const phoneBrands = [
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
    series: ["Redmi Note 13", "Xiaomi 14", "Poco Series"]
  }
];

// We define mathematically the shape of the phone case mask.
// width/height represent the physical aspect ratio (scaled down).
// camera defines the cutout. This can be complex paths if needed.
export const phoneModels = [
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
    id: "oneplus-12",
    brand: "oneplus",
    name: "OnePlus 12",
    shape: { width: 310, height: 640, rx: 35 },
    camera: { type: 'circle', cx: 80, cy: 90, r: 65 },
    price: 399
  }
];
