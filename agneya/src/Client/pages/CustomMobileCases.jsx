import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { phoneBrands, phoneModels } from '../data/MobileCasesDB';
import { Smartphone, ArrowLeft, Grid3X3, Search } from 'lucide-react';
import SEO from '../components/SEO/SEO';
import LoginModal from '../components/LoginModal';
const StudioOverlay = React.lazy(() => import('../components/StudioOverlay'));
import { useAuth } from '../context/AuthContext';

const CustomMobileCases = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [selectedBrand, setSelectedBrand] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customizingProduct, setCustomizingProduct] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const requireLogin = (callback) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
    } else {
      callback();
    }
  };

  const filteredModels = phoneModels.filter(model => {
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
    <div className="min-h-screen bg-slate-50 pb-16">
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
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-5"
          >
            <ArrowLeft size={16} /> Back to Shop
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Design Your Mobile Case</h1>
          <p className="text-sm text-slate-500 max-w-xl">
            Select your brand and model below, then upload or create a design in our studio. We use precise vector masking so your design fits perfectly.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── BRAND SIDEBAR ── */}
          <aside className="w-full lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sticky top-24">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Grid3X3 size={12} /> Brand
              </p>
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible no-scrollbar pb-1 lg:pb-0">
                <button
                  onClick={() => setSelectedBrand(null)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold text-left transition-all whitespace-nowrap ${
                    !selectedBrand ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Devices
                </button>
                {phoneBrands.map(brand => (
                  <button
                    key={brand.id}
                    onClick={() => setSelectedBrand(brand.id)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold text-left transition-all whitespace-nowrap ${
                      selectedBrand === brand.id ? 'text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
                    }`}
                    style={selectedBrand === brand.id ? { backgroundColor: brand.theme, borderColor: brand.theme } : {}}
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
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search for your model…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all shadow-sm"
              />
            </div>

            {filteredModels.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <Smartphone size={36} className="mx-auto text-slate-200 mb-4" />
                <p className="text-sm font-medium text-slate-400">No matching devices found.</p>
                <p className="text-xs text-slate-400 mt-1">Try a different brand or model name.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400 mb-4 font-medium">{filteredModels.length} models available</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredModels.map(model => (
                    <button
                      key={model.id}
                      onClick={() => handleCustomize(model)}
                      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all group text-center cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-50 transition-colors">
                        <Smartphone size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                        {model.name}
                      </h4>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">Soft Case</span>
                        <span className="text-xs font-bold text-indigo-600">₹{model.price}</span>
                      </div>
                      <span className="mt-3 inline-block text-[10px] font-semibold text-white bg-indigo-600 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        Design Now
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
