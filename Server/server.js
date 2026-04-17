const express = require("express");
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
dotenv.config()

const connectDB = require('./db');
const bootstrapAdmin = require('./services/adminBootstrap');
require('./services/whatsappService'); // Initialize WhatsApp Bot

const app = express();
const PORT = process.env.PORT || process.env.Server_port || 5000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());


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
app.use("/api/admin/auth", authRoutes);

// Public Storefront API Routes
app.use("/api/public", require('./routes/public/storefrontRoutes'));

// Serve static files from the React app's build directory correctly (Disabled for Vercel deployment)
// app.use(express.static(path.join(__dirname, '../agneya/dist')));

// Healthy check route for Render
app.get("/health", (req, res) => {
  res.status(200).send("Server is running smoothly");
});

// Wildcard route (Disabled for Vercel deployment)
// app.get(/.*/, (req, res) => {
//   res.sendFile(path.join(__dirname, '../agneya/dist/index.html'));
// });

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 API Server running on port http://localhost:${PORT}`);
  console.log(`🚀 API Server running on port http://localhost:${PORT}/admin/login`)
  console.log(`🚀 API Server running on port http://localhost:${PORT}/admin/dashboard`)
  
  try {
    await connectDB();
    await bootstrapAdmin();
  } catch (err) {
    console.error('SERVER FATAL: Initialization failed:', err.message);
  }
});