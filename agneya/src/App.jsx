import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './utils/axiosConfig'; 
import { Toaster } from 'react-hot-toast';

// Layouts and Security Guards
import AdminLayout from './layout/AdminLayout';
import ProtectedRoute from './Admin/components/ProtectedRoute';
import ClientLayout from './Client/components/ClientLayout';
import NotAvailable from './SorryPage/SorryPage';

// Lazy Load Admin Pages
const AdminLogin = lazy(() => import('./Admin/page/AdminLogin'));
const Dashboard = lazy(() => import('./Admin/page/Dashboard'));
const Products = lazy(() => import('./Admin/page/Products'));
const Orders = lazy(() => import('./Admin/page/Orders'));
const CustomDesigns = lazy(() => import('./Admin/page/CustomDesigns'));
const BulkOrders = lazy(() => import('./Admin/page/BulkOrders'));
const Customers = lazy(() => import('./Admin/page/Customers'));
const Marketing = lazy(() => import('./Admin/page/Marketing'));
const Settings = lazy(() => import('./Admin/page/Settings'));
const DesignAssistance = lazy(() => import('./Admin/page/DesignAssistance'));
const Collections = lazy(() => import('./Admin/page/Collections'));


// Lazy Load Client Pages
const Shop = lazy(() => import('./Client/pages/Shop'));
const ProductDetails = lazy(() => import('./Client/pages/ProductDetails'));
const BulkOrderMaster = lazy(() => import('./Client/pages/BulkOrderMaster'));
const Checkout = lazy(() => import('./Client/pages/Checkout'));
const TrackOrder = lazy(() => import('./Client/pages/TrackOrder'));
const UserDashboard = lazy(() => import('./Client/pages/UserDashboard'));
const BulkInquiry = lazy(() => import('./Client/pages/BulkInquiry'));
const Wishlist = lazy(() => import('./Client/pages/Wishlist'));
const CustomRequest = lazy(() => import('./Client/pages/CustomRequest'));
const CustomMobileCases = lazy(() => import('./Client/pages/CustomMobileCases'));
const Cart = lazy(() => import('./Client/pages/Cart'));

// Loader for Suspense
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen gap-8" style={{ backgroundColor: 'var(--color-neu-bg)' }}>
    <div className="relative w-20 h-20">
      <div className="absolute inset-0 rounded-3xl neu-flat animate-pulse"></div>
      <div className="absolute inset-4 rounded-full border-4 border-[var(--color-neu-dark)] border-t-[var(--color-neu-accent)] animate-spin"></div>
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 animate-pulse" style={{ color: 'var(--color-neu-text)' }}>Initializing Experience</p>
  </div>
);

function App() {
  return (
    <div className="mainPage">
      <Toaster position="top-right" reverseOrder={false} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* === Public Client Storefront === */}
          <Route path="/" element={<ClientLayout />}>
            <Route index element={<Shop />} />
            <Route path="shop" element={<Shop />} />
            <Route path="custom-mobile-cases" element={<CustomMobileCases />} />
            <Route path="product/:productId" element={<ProductDetails />} />
            <Route path="customize/:productId" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="bulk-order" element={<BulkOrderMaster />} />
            <Route path="bulk-inquiry" element={<BulkInquiry />} />
            <Route path="track-order" element={<TrackOrder />} />
            <Route path="manual-custom/:productId" element={<CustomRequest />} />
            <Route path="wishlist" element={<Wishlist />} />
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
              <Route path="collections/*" element={<Collections />} />


              {/* Catch-all for undefined admin routes */}
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<NotAvailable />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;

