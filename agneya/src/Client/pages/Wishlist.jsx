import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
const StudioOverlay = React.lazy(() => import('../components/StudioOverlay'));

const Wishlist = () => {
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userData } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [customizingProduct, setCustomizingProduct] = useState(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || ''}/api/public/products?limit=100`);
        const allProducts = res.data.data || [];

        let listIds = JSON.parse(localStorage.getItem('wishlist') || '[]');

        if (currentUser && userData?.phone) {
          const token = await currentUser.getIdToken(true);
          try {
            const dbRes = await axios.get(
              `${import.meta.env.VITE_API_BASE_URL || ''}/api/public/user/wishlist/${userData.phone}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const dbIds = dbRes.data.data.map(item => item._id || item);
            listIds = [...new Set([...listIds, ...dbIds])];
            localStorage.setItem('wishlist', JSON.stringify(listIds));
          } catch (err) {
            console.error('DB wishlist fetch failed:', err);
          }
        }

        setWishlistIds(listIds);
        setWishlistProducts(allProducts.filter(p => listIds.includes(p._id)));
      } catch (err) {
        console.error('Error loading wishlist:', err);
        toast.error('Failed to load wishlist.');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [currentUser, userData]);

  const toggleWishlist = async (id) => {
    const next = wishlistIds.includes(id)
      ? wishlistIds.filter(i => i !== id)
      : [...wishlistIds, id];

    setWishlistIds(next);
    localStorage.setItem('wishlist', JSON.stringify(next));

    if (wishlistIds.includes(id)) {
      setWishlistProducts(prev => prev.filter(p => p._id !== id));
    }

    if (currentUser && userData?.phone) {
      try {
        const token = await currentUser.getIdToken(true);
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || ''}/api/public/user/wishlist/toggle`,
          { phone: userData.phone, productId: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) {
        console.error('Wishlist sync failed:', e);
      }
    }
  };

  const requireLogin = (callback, action = 'order') => {
    if (!currentUser) {
      toast.error(`Please login to ${action}.`);
    } else {
      callback();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading your wishlist…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── HEADER ── */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-500"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Heart size={22} className="text-rose-500 fill-rose-500" />
              Wishlist
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {wishlistProducts.length} saved item{wishlistProducts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {wishlistProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {wishlistProducts.map(product => (
              <ProductCard
                key={product._id}
                product={product}
                wishlist={wishlistIds}
                toggleWishlist={toggleWishlist}
                addToCart={addToCart}
                onQuickView={() => {}}
                onCustomize={(p) => requireLogin(() => setCustomizingProduct(p))}
                requireLogin={requireLogin}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 text-center gap-5">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center">
              <Heart size={24} className="text-rose-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Your wishlist is empty</h2>
              <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                Browse the store and tap the heart icon to save items here.
              </p>
            </div>
            <Link
              to="/shop"
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-all shadow-md"
            >
              <ShoppingBag size={15} /> Browse Products
            </Link>
          </div>
        )}
      </div>

      <React.Suspense fallback={null}>
        <StudioOverlay
          isOpen={!!customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          product={customizingProduct}
          requireLogin={requireLogin}
        />
      </React.Suspense>
    </div>
  );
};

export default Wishlist;
