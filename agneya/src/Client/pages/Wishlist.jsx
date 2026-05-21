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
        let listIds = JSON.parse(localStorage.getItem('wishlist') || '[]');
        let productsToSet = [];

        if (currentUser && userData?.phone) {
          const token = await currentUser.getIdToken(true);
          try {
            const dbRes = await axios.get(
              `${import.meta.env.VITE_API_BASE_URL || ''}/api/public/user/wishlist/${userData.phone}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const dbProducts = dbRes.data.data || [];
            productsToSet = dbProducts;
            const dbIds = dbProducts.map(item => item._id);
            listIds = [...new Set([...listIds, ...dbIds])];
            localStorage.setItem('wishlist', JSON.stringify(listIds));
          } catch (err) {
            console.error('DB wishlist fetch failed:', err);
            if (listIds.length > 0) {
              const res = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL || ''}/api/public/products?ids=${listIds.join(',')}&limit=100`
              );
              productsToSet = res.data.data || [];
            }
          }
        } else {
          if (listIds.length > 0) {
            const res = await axios.get(
              `${import.meta.env.VITE_API_BASE_URL || ''}/api/public/products?ids=${listIds.join(',')}&limit=100`
            );
            productsToSet = res.data.data || [];
          }
        }

        setWishlistIds(listIds);
        setWishlistProducts(productsToSet);
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
    const isRemoving = wishlistIds.includes(id);
    const next = isRemoving
      ? wishlistIds.filter(i => i !== id)
      : [...wishlistIds, id];

    setWishlistIds(next);
    localStorage.setItem('wishlist', JSON.stringify(next));

    if (isRemoving) {
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--color-neu-bg)' }}>
        <div className="w-10 h-10 border-4 border-[var(--color-neu-dark)] border-t-[var(--brand-primary)] rounded-full animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}>Syncing Wishlist…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: 'var(--color-neu-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── HEADER ── */}
        <div className="flex items-center gap-6 mb-12">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 flex items-center justify-center neu-button hover:neu-pressed transition-all"
            style={{ color: 'var(--color-neu-text)' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-3" style={{ color: 'var(--color-neu-text)' }}>
              <Heart size={26} className="text-rose-500 fill-rose-500" />
              My Wishlist
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-50" style={{ color: 'var(--color-neu-text)' }}>
              {wishlistProducts.length} curated item{wishlistProducts.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>

        {wishlistProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
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
          <div className="flex flex-col items-center justify-center py-24 neu-flat text-center gap-8">
            <div className="w-20 h-20 neu-pressed rounded-full flex items-center justify-center">
              <Heart size={32} className="opacity-20" style={{ color: 'var(--color-neu-text)' }} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter" style={{ color: 'var(--color-neu-text)' }}>Your wishlist is empty</h2>
              <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-40 max-w-xs mx-auto" style={{ color: 'var(--color-neu-text)' }}>
                Discover premium cases and tap the heart icon to save them for later.
              </p>
            </div>
            <Link
              to="/shop"
              className="flex items-center gap-3 px-8 py-4 btn-primary text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98]"
            >
              <ShoppingBag size={18} /> Browse Collections
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
