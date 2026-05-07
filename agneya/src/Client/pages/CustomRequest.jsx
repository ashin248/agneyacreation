import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Upload, X, MessageSquare, CheckCircle, ShieldCheck,
  CreditCard, Plus, ArrowLeft, Image as ImageIcon
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CustomRequest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const product = location.state?.product;

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currentPrice, setCurrentPrice] = useState(product?.discountPrice || product?.basePrice || 0);
  const [isCompany, setIsCompany] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  useEffect(() => {
    if (!product) {
      toast.error('No product selected. Redirecting…');
      navigate('/');
    }
  }, [product, navigate]);

  useEffect(() => {
    if (product?.isBulkEnabled && product.bulkRules?.length > 0) {
      const rule = [...product.bulkRules]
        .sort((a, b) => b.minQty - a.minQty)
        .find(r => quantity >= r.minQty);
      setCurrentPrice(rule
        ? (product.basePrice || 0) - (rule.pricePerUnit || 0)
        : product.discountPrice || product.basePrice || 0
      );
    } else {
      setCurrentPrice(product?.discountPrice || product?.basePrice || 0);
    }
  }, [quantity, product]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (files.length + selected.length > 10) return toast.error('Maximum 10 images allowed.');
    setFiles(prev => [...prev, ...selected]);
    setPreviews(prev => [...prev, ...selected.map(f => URL.createObjectURL(f))]);
  };

  const removeFile = (idx) => {
    URL.revokeObjectURL(previews[idx]);
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmission = async (mode = 'checkout') => {
    if (files.length === 0) return toast.error('Please upload at least one image.');
    setIsUploading(true);
    const tid = toast.loading(mode === 'inquiry' ? 'Submitting design brief…' : 'Uploading your designs…');

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      const uploadRes = await axios.post('/api/public/manual-design/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (!uploadRes.data.success) throw new Error('Upload failed.');
      const imageUrls = uploadRes.data.urls;

      if (mode === 'checkout' || mode === 'cart') {
        if (isCompany) {
          if (!companyName.trim()) return toast.error('Company name is required.');
          if (!gstNumber.trim() || gstNumber.length < 15) return toast.error('Valid GSTIN is required (15 characters).');
          localStorage.setItem('temp_company_name', companyName);
          localStorage.setItem('temp_gst_number', gstNumber);
        }
        const cartItem = {
          productId: product._id,
          name: `[Custom] ${product.name}`,
          unitPrice: currentPrice,
          quantity,
          itemType: 'Custom',
          selectedVariation: { sku: 'custom_manual', size: 'Manual Custom' },
          image: product.galleryImages?.[0] || product.images?.[0],
          customData: {
            mode: 'manual',
            instructions,
            manualAttachments: imageUrls,
            appliedFrontDesign: imageUrls[0],
            design: { instructions, references: imageUrls.map(url => ({ url, type: 'manual_attachment' })) }
          }
        };
        if (mode === 'checkout') {
          toast.success('Designs uploaded. Proceeding to checkout…', { id: tid });
          navigate('/checkout', { state: { buyNowItem: cartItem } });
        } else {
          addToCart(cartItem);
          toast.success('Added to cart!', { id: tid });
          navigate('/cart');
        }
      } else {
        await axios.post('/api/public/custom-designs', {
          name: currentUser?.displayName || 'Customer',
          phone: currentUser?.phoneNumber || 'N/A',
          email: currentUser?.email || 'N/A',
          productCategory: product.category || product.name,
          productId: product._id,
          description: instructions,
          printAssets: imageUrls,
          status: 'Pending'
        });
      toast.success("Brief submitted! We'll contact you shortly.", { id: tid });
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Custom request failed:', err);
      toast.error('Upload failed. Please try again.', { id: tid });
    } finally {
      setIsUploading(false);
    }
  };

  if (!product) return null;

  const totalPrice = currentPrice * quantity;
  const bulkApplied = quantity >= 20 && product?.isBulkEnabled;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">

      {/* ── HEADER BAR ── */}
      <div className="sticky top-[70px] z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-900">Custom Design Request</h1>
              <p className="text-[11px] text-slate-400">Upload your artwork</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
            <ShieldCheck size={13} />
            <span className="text-[11px] font-semibold">Secure Upload</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── LEFT: UPLOAD AREA ── */}
          <div className="lg:col-span-7 space-y-6">

            {/* Product Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-5 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0">
                <img loading="lazy"                   src={product.galleryImages?.[0] || product.images?.[0]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md">Custom Order</span>
                <h2 className="text-base font-bold text-slate-900 mt-1">{product.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-slate-500">Base price: <strong className="text-slate-900">₹{(product.discountPrice || product.basePrice).toLocaleString('en-IN')}</strong></span>
                  {bulkApplied && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Bulk Pricing Active</span>}
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Quantity</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Order 20+ units for wholesale pricing</p>
                </div>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 text-xl border-r border-slate-200 transition-colors">−</button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 h-10 text-center font-bold text-slate-900 outline-none bg-white text-sm"
                  />
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 text-xl border-l border-slate-200 transition-colors">+</button>
                </div>
              </div>
            </div>

            {/* Upload Zone */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Design Files</h3>
                <span className="text-xs text-slate-400">{files.length} / 10 uploaded</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100 bg-slate-50">
                    <img loading="lazy" src={src} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => removeFile(idx)} className="w-8 h-8 bg-white text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-md">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {files.length < 10 && (
                  <label className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all group">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                      <Plus size={18} className="text-slate-400 group-hover:text-orange-500" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-orange-500">Upload</span>
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={16} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900">Design Instructions</h3>
              </div>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                rows={5}
                placeholder="Describe how you'd like your design placed — positioning, text, colors, special requirements…"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition-all resize-none font-medium"
              />
            </div>
          </div>

          {/* ── RIGHT: SUMMARY ── */}
          <div className="lg:col-span-5">
            <div className="sticky top-[130px] space-y-5">

              {/* GST / Billing */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Billing Type</h3>
                <div className="space-y-2">
                  {[
                    { id: false, label: 'Individual (No GST Invoice)' },
                    { id: true, label: 'Business (With GSTIN Invoice)' }
                  ].map(({ id, label }) => (
                    <label key={String(id)} onClick={() => setIsCompany(id)} className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50" style={{ borderColor: isCompany === id ? '#F7941D' : '#f1f5f9' }}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isCompany === id ? 'bg-orange-600 border-orange-600' : 'border-slate-300'}`}>
                        {isCompany === id && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
                {isCompany && (
                  <div className="mt-3 space-y-2">
                    <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Legal Company Name *" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all" />
                    <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())} placeholder="GSTIN (15 characters) *" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all" />
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg">
                <h3 className="text-sm font-bold mb-5">Order Summary</h3>
                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Unit Price</span>
                    <span className="font-semibold">₹{currentPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Quantity</span>
                    <span className="font-semibold">{quantity} units</span>
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-slate-400">Total (excl. tax & delivery)</span>
                      <span className="text-2xl font-bold text-orange-400">₹{totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleSubmission('cart')}
                    disabled={isUploading || files.length === 0}
                    className="w-full py-3 bg-white text-slate-900 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-all disabled:opacity-50 active:scale-[0.98]"
                  >
                    <Plus size={16} /> Add to Cart
                  </button>
                  <button
                    onClick={() => handleSubmission('checkout')}
                    disabled={isUploading || files.length === 0}
                    className="w-full py-3 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #F7941D, #7B1760)' }}
                  >
                    {isUploading ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
                    ) : (
                      <><CreditCard size={16} /> Buy Now</>
                    )}
                  </button>
                  <button
                    onClick={() => handleSubmission('inquiry')}
                    disabled={isUploading || files.length === 0}
                    className="w-full py-3 text-slate-400 border border-white/10 rounded-xl font-medium text-sm hover:text-white hover:border-white/30 transition-all disabled:opacity-50"
                  >
                    Submit Brief for Designer Quote
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 text-center mt-4">🔒 Your files are encrypted and securely stored.</p>
              </div>

              {/* Guarantees */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                {[
                  { icon: CheckCircle, title: 'Priority Review', desc: 'Manual orders enter our priority production queue.' },
                  { icon: ShieldCheck, title: 'Quality Check', desc: 'Our designers optimise your images before printing.' }
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomRequest;
