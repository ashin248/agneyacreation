const express = require("express");
const compression = require('compression');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
dotenv.config()

const connectDB = require('./db');
const bootstrapAdmin = require('./services/adminBootstrap');
const { initializeWhatsApp } = require('./services/whatsappService'); // WhatsApp Bot Logic

const app = express();
const PORT = process.env.PORT || process.env.Server_port || 5000;

app.use(compression()); // Compress all responses for faster transfer

// Set Permissions-Policy headers to allow accelerometer/gyro/magnetometer
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "accelerometer=*, gyroscope=*, magnetometer=*");
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Sanitization middleware to replace stale localhost/127.0.0.1 image URLs with placeholder
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (obj) {
    const sanitize = (val) => {
      if (typeof val === 'string') {
        if (val.startsWith('http://localhost:') || val.startsWith('http://127.0.0.1:')) {
          if (val.match(/\.(png|jpg|jpeg|gif|svg|webp|glb|gltf)/i) || val.includes('/uploads/')) {
            return 'https://placehold.co/150x150/f1f5f9/a2a9b1?text=Image';
          }
        }
      } else if (Array.isArray(val)) {
        return val.map(sanitize);
      } else if (val !== null && typeof val === 'object') {
        const copy = {};
        for (const key in val) {
          if (Object.prototype.hasOwnProperty.call(val, key)) {
            copy[key] = sanitize(val[key]);
          }
        }
        return copy;
      }
      return val;
    };
    let sanitized = obj;
    if (obj && typeof obj === 'object') {
      try {
        const plainObj = JSON.parse(JSON.stringify(obj));
        sanitized = sanitize(plainObj);
      } catch (err) {
        console.error('Sanitization failed, passing original object:', err);
      }
    }
    return originalJson.call(this, sanitized);
  };
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Razorpay-Signature'],
  exposedHeaders: ['X-Razorpay-Signature']
}));

const bulkOrderRoutes = require('./routes/admin/bulkOrderRoutes');
const customDesignRoutes = require('./routes/admin/customDesignRoutes');
const customerRoutes = require('./routes/admin/customers');
const dashboardRoutes = require('./routes/admin/dashboard');
const marketingRoutes = require('./routes/admin/marketingRoutes');
const orderRoutes = require('./routes/admin/orders');
const productRoutes = require('./routes/admin/products');
const settingRoutes = require('./routes/admin/settingsRoutes');
const authRoutes = require('./routes/admin/authRoutes');
const categoryRoutes = require('./routes/admin/categoryRoutes');
const collectionRoutes = require('./routes/admin/collectionRoutes');

// Load API Security Shield dynamically resolving internal nodes inherently natively explicitly natively
const { protectAdmin } = require('./middleware/authMiddleware');

app.use("/api/admin/bulk-orders", protectAdmin, bulkOrderRoutes);
app.use("/api/admin/custom-designs", protectAdmin, customDesignRoutes);
app.use("/api/admin/customers", protectAdmin, customerRoutes);
app.use("/api/admin/dashboard", protectAdmin, dashboardRoutes);
app.use("/api/admin/marketing", protectAdmin, marketingRoutes);
app.use("/api/admin/orders", protectAdmin, orderRoutes);
app.use("/api/admin/products", protectAdmin, productRoutes);
app.use("/api/admin/settings", protectAdmin, settingRoutes);
app.use("/api/admin/categories", protectAdmin, categoryRoutes);
app.use("/api/admin/collections", protectAdmin, collectionRoutes);
app.use("/api/admin/auth", authRoutes);

// Public Storefront API Routes
app.use("/api/public", require('./routes/public/storefrontRoutes'));


// Serve static files with aggressive caching (1 year for immutable assets)
app.use(express.static(path.join(__dirname, '../agneya/dist'), {
  maxAge: '1y',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache'); // Don't cache HTML to ensure updates
    }
  }
}));

// Healthy check route for Render
app.get("/health", (req, res) => {
  res.status(200).send("Server is running smoothly");
});

// Wildcard route (Disabled for Vercel deployment)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../agneya/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', async () => {
  try {
    await connectDB();
    await bootstrapAdmin();
    initializeWhatsApp(); // Start WhatsApp Bot in background after server is up
  } catch (err) {
    console.error('SERVER FATAL: Initialization failed:', err.message);
  }
});