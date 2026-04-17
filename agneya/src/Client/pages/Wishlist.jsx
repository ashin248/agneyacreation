import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiHeart, FiArrowLeft, FiShoppingBag } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import StudioOverlay from '../components/StudioOverlay';

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
                // 1. Get raw products to map IDs
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || '/api'}/public/products?limit=100`);
                const allProducts = res.data.data || [];

                // 2. Determine wishlist IDs
                let listIds = JSON.parse(localStorage.getItem('wishlist') || '[]');

                // If user is logged in, sync from Database and merge
                if (currentUser && userData?.phone) {
                    const token = await currentUser.getIdToken(true);
                    try {
                        const dbRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL || '/api'}/public/user/wishlist/${userData.phone}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        
                        const dbWishlist = dbRes.data.data.map(item => item._id || item);
                        
                        // Merge local and DB, avoiding duplicates
                        const mergedIds = [...new Set([...listIds, ...dbWishlist])];
                        
                        // Update local list
                        listIds = mergedIds;
                        localStorage.setItem('wishlist', JSON.stringify(listIds));
                    } catch (err) {
                        console.error("Failed to fetch DB wishlist:", err);
                    }
                }

                setWishlistIds(listIds);

                // 3. Filter products matching wishlist
                const matchedProducts = allProducts.filter(p => listIds.includes(p._id));
                setWishlistProducts(matchedProducts);

            } catch (err) {
                console.error("Error loading wishlist products:", err);
                toast.error("Failed to load wishlist");
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, [currentUser, userData]);

    const toggleWishlist = async (id) => {
        const newWishlistIds = wishlistIds.includes(id) 
            ? wishlistIds.filter(item => item !== id)
            : [...wishlistIds, id];
            
        setWishlistIds(newWishlistIds);
        localStorage.setItem('wishlist', JSON.stringify(newWishlistIds));
        
        // Update displayed products immediately
        if (wishlistIds.includes(id)) {
            setWishlistProducts(prev => prev.filter(p => p._id !== id));
        }

        if (currentUser && userData?.phone) {
            try {
                const token = await currentUser.getIdToken(true);
                await axios.post(`${import.meta.env.VITE_API_BASE_URL || '/api'}/public/user/wishlist/toggle`, {
                    phone: userData.phone,
                    productId: id
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                console.error("Failed to sync wishlist with DB:", error);
            }
        }
    };

    const requireLogin = (callback, actionName = "order") => {
        if (!currentUser) {
            toast.error(`Please login to ${actionName}.`);
        } else {
            callback();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-[10px] font-black tracking-[0.3em] uppercase text-slate-400 animate-pulse">Syncing Library</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans pb-24 md:pb-12 text-slate-950">
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col relative z-10">
                
                <div className="flex items-center gap-4 mb-8 md:mb-12">
                    <button 
                        onClick={() => navigate('/')}
                        className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white rounded-full shadow-sm hover:shadow-md border border-slate-200 transition-all active:scale-95 text-slate-600 hover:text-indigo-600"
                    >
                        <FiArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-950 uppercase tracking-tighter flex items-center gap-3">
                            <FiHeart className="text-rose-500 fill-rose-500" /> Saved Assets
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Your personal collection library</p>
                    </div>
                </div>

                {wishlistProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                        {wishlistProducts.map(product => (
                            <ProductCard 
                                key={product._id} 
                                product={product} 
                                wishlist={wishlistIds} 
                                toggleWishlist={toggleWishlist} 
                                addToCart={addToCart} 
                                onQuickView={() => {}} // Could wire this later if needed
                                onCustomize={(p) => requireLogin(() => setCustomizingProduct(p))} 
                                requireLogin={requireLogin} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-[2rem] border border-dashed border-slate-200 shadow-sm mt-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                            <FiHeart size={32} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Library Empty</h2>
                        <p className="text-xs text-slate-500 font-medium mb-8 text-center max-w-sm">You haven't saved any assets yet. Browse the inventory and mark targets with a heart to save them here.</p>
                        
                        <Link to="/" className="px-8 py-4 bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.25rem] hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center gap-2">
                            <FiShoppingBag size={14}/> Access Inventory
                        </Link>
                    </div>
                )}
            </main>

            <StudioOverlay isOpen={!!customizingProduct} onClose={() => setCustomizingProduct(null)} product={customizingProduct} requireLogin={requireLogin} />
        </div>
    );
};

export default Wishlist;
