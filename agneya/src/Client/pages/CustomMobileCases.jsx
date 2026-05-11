import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Smartphone, ArrowLeft, Grid3X3, Search, Loader2, ChevronRight } from 'lucide-react';
import SEO from '../components/SEO/SEO';
import LoginModal from '../components/LoginModal';
const StudioOverlay = React.lazy(() => import('../components/StudioOverlay'));
import { useAuth } from '../context/AuthContext';

const CustomMobileCases = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [brands, setBrands] = useState([]);
  const [allModels, setAllModels] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customizingProduct, setCustomizingProduct] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || ''}/api/public/phone-models`);
        if (res.data && res.data.success) {
          // Store brands
          setBrands(res.data.data.map(b => ({
            id: b.brand,
            name: b.brandName,
            logo: b.logo,
            theme: b.theme
          })));
          
          // Flatten models for easy searching
          const flattened = res.data.data.reduce((acc, b) => {
            return acc.concat(b.models.map(m => ({ ...m, brand: b.brand })));
          }, []);
          setAllModels(flattened);
        }
      } catch (err) {
        console.error('Failed to fetch phone models:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  const requireLogin = (callback) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
    } else {
      callback();
    }
  };

  const filteredModels = allModels.filter(model => {
    const matchBrand = selectedBrand ? model.brand === selectedBrand : true;
    const matchSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchBrand && matchSearch;
  });

  const handleCustomize = (model) => {
    requireLogin(() => {
      setCustomizingProduct({
        _id: `custom-case-${model.id}`,
        name: `Custom Mobile Case — ${model.name}`,
        category: 'Mobile Covers',
        basePrice: model.price,
        customizationType: '2D',
        isCustomizable: true,
        description: `Design your own premium mobile cover for ${model.name}.`,
        phoneMask: model
      });
    });
  };

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: 'var(--color-neu-bg)' }}>
      <SEO
        title="Custom Mobile Cases | Agneya Design"
        description="Design your own custom mobile cover. Select your brand and model to start printing."
        type="product"
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => setIsLoginModalOpen(false)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── HEADER ── */}
        <div className="mb-7">
          <button
            onClick={() => navigate('/shop')}
            className="flex items-center gap-2 text-sm font-medium transition-colors mb-5 opacity-70 hover:opacity-100"
            style={{ color: 'var(--color-neu-text)' }}
          >
            <ArrowLeft size={16} /> Back to Shop
          </button>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase" style={{ color: 'var(--color-neu-text)' }}>Design Your Mobile Case</h1>
          <p className="text-sm max-w-xl font-medium mt-2" style={{ color: 'var(--color-neu-text)', opacity: 0.7 }}>
            Select your brand and model below, then upload or create a design in our studio. We use precise vector masking so your design fits perfectly.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── BRAND SIDEBAR ── */}
          <aside className="w-full lg:w-56 flex-shrink-0">
            <div className="neu-flat p-4 sticky top-24">
              <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'var(--color-neu-text)', opacity: 0.5 }}>
                <Grid3X3 size={12} /> Brand
              </p>
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible no-scrollbar pb-1 lg:pb-0">
                <button
                  onClick={() => setSelectedBrand(null)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold text-left transition-all whitespace-nowrap ${
                    !selectedBrand ? 'neu-button-accent' : 'neu-button'
                  }`}
                  style={!selectedBrand ? {} : { color: 'var(--color-neu-text)' }}
                >
                  All Devices
                </button>
                {brands.map(brand => (
                  <button
                    key={brand.id}
                    onClick={() => setSelectedBrand(brand.id)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold text-left transition-all whitespace-nowrap ${
                      selectedBrand === brand.id ? 'neu-button-accent' : 'neu-button'
                    }`}
                    style={selectedBrand === brand.id ? { backgroundColor: brand.theme, borderColor: brand.theme } : { color: 'var(--color-neu-text)' }}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── MODEL GRID ── */}
          <div className="flex-1 min-w-0">
            {/* Search */}
            <div className="relative mb-5">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-neu-text)', opacity: 0.4 }} />
              <input
                type="text"
                placeholder="Search for your model…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-12 neu-input rounded-xl pl-10 pr-4 text-sm font-medium outline-none transition-all"
                style={{ color: 'var(--color-neu-text)' }}
              />
            </div>

            {loading ? (
              <div className="py-24 text-center">
                <Loader2 size={48} className="animate-spin mx-auto mb-4 text-[var(--color-neu-accent)] opacity-40" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: 'var(--color-neu-text)' }}>Syncing Catalog</p>
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="py-24 text-center neu-pressed border-dashed border-[var(--color-neu-dark)]">
                <Smartphone size={36} className="mx-auto mb-5 opacity-20" style={{ color: 'var(--color-neu-text)' }} strokeWidth={1} />
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--color-neu-text)', opacity: 0.6 }}>No matching gear found</p>
                <p className="text-[10px] font-bold mt-2 uppercase tracking-widest opacity-30" style={{ color: 'var(--color-neu-text)' }}>Try a different brand or search term</p>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 opacity-30" style={{ color: 'var(--color-neu-text)' }}>{filteredModels.length} variations engineered</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredModels.map(model => (
                    <button
                      key={model.id}
                      onClick={() => handleCustomize(model)}
                      className="neu-button p-6 group text-center cursor-pointer transition-all hover:neu-pressed"
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 neu-pressed">
                        <Smartphone size={20} className="opacity-40 group-hover:opacity-100 transition-colors" style={{ color: 'var(--color-neu-accent)' }} />
                      </div>
                      <h4 className="text-[10px] font-black uppercase tracking-tight leading-tight mb-3 transition-colors" style={{ color: 'var(--color-neu-text)' }}>
                        {model.name}
                      </h4>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-[9px] font-black uppercase tracking-widest neu-pressed px-2.5 py-1 rounded-md" style={{ color: 'var(--color-neu-text)', opacity: 0.5 }}>Standard</span>
                        <span className="text-xs font-black" style={{ color: 'var(--color-neu-accent)' }}>₹{model.price}</span>
                      </div>
                      <span className="mt-5 w-full inline-block text-[9px] font-black uppercase tracking-[0.2em] neu-button-accent text-white py-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        Design →
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <React.Suspense fallback={null}>
        <StudioOverlay
          isOpen={!!customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          product={customizingProduct}
          requireLogin={requireLogin}
          initialMode="self"
        />
      </React.Suspense>
    </div>
  );
};

export default CustomMobileCases;
