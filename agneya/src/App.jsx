import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './utils/axiosConfig'; 
import { Toaster } from 'react-hot-toast';

// Layouts and Security Guards
import AdminLayout from './layout/adminLayout';
import ProtectedRoute from './Admin/components/ProtectedRoute';
import AdminLogin from './Admin/page/AdminLogin';

// admin page 
import Dashboard from './Admin/page/Dashboard';
import Products from './Admin/page/Products';
import Orders from './Admin/page/Orders';
import CustomDesigns from './Admin/page/CustomDesigns';
import BulkOrders from './Admin/page/BulkOrders';
import Customers from './Admin/page/Customers';
import Marketing from './Admin/page/Marketing';
import Settings from './Admin/page/Settings';
import DesignAssistance from './Admin/page/DesignAssistance';

// Error Page
import NotAvailable from './SorryPage/SorryPage';

import ClientLayout from './Client/components/ClientLayout';
import Home from './Client/pages/Home';
import Shop from './Client/pages/Shop';
import CustomCatalog from './Client/pages/CustomCatalog';
import CustomDesign from './Client/pages/CustomDesign';
import ProductDetails from './Client/pages/ProductDetails';
import Cart from './Client/pages/Cart'; // Still keep for compatibility if needed, but route to BulkMaster
import BulkOrderMaster from './Client/pages/BulkOrderMaster';
import Checkout from './Client/pages/Checkout';
import TrackOrder from './Client/pages/TrackOrder';
import UserDashboard from './Client/pages/UserDashboard';
import BulkInquiry from './Client/pages/BulkInquiry';
import Wishlist from './Client/pages/Wishlist';
import CustomRequest from './Client/pages/CustomRequest';

function App() {
  return (
    <div className="mainPage">
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* === Public Client Storefront === */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<Shop />} />
          <Route path="product/:productId" element={<ProductDetails />} />
          <Route path="customize/:productId" element={<CustomDesign />} />
          <Route path="cart" element={<BulkOrderMaster />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="bulk-order" element={<BulkOrderMaster />} />
          <Route path="bulk-inquiry" element={<BulkInquiry />} />
          <Route path="track-order" element={<TrackOrder />} />
          <Route path="manual-custom/:productId" element={<CustomRequest />} />
          <Route path="wishlist" element={<Wishlist />} />
          {/* Future client routes (product details, etc.) go here */}
        </Route>

        {/* Open Authentication Portal explicitly passing root barriers */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* === Secure Administrative Pipelines gracefully locked natively === */}
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            {/* Redirect /admin to dashboard purely */}
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard/*" element={<Dashboard />} />
            <Route path="products/*" element={<Products />} />
            <Route path="orders/*" element={<Orders />} />
            <Route path="design-assistance/*" element={<DesignAssistance />} />
            <Route path="custom-designs/*" element={<CustomDesigns />} />
            <Route path="bulk-orders/*" element={<BulkOrders />} />
            <Route path="gst-manager/*" element={<Customers />} />
            <Route path="marketing/*" element={<Marketing />} />
            <Route path="settings/*" element={<Settings />} />

            {/* Catch-all for undefined admin routes */}
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<NotAvailable />} />
      </Routes>
    </div>
  );
}

export default App;

