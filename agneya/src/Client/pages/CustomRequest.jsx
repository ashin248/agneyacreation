import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  MessageSquare, 
  CheckCircle, 
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Plus
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const CustomRequest = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const product = location.state?.product;

    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [instructions, setInstructions] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [currentPrice, setCurrentPrice] = useState(product?.discountPrice || product?.basePrice || 0);

    // GST/Direct Order States
    const [isCompany, setIsCompany] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [gstNumber, setGstNumber] = useState('');

    useEffect(() => {
        if (!product) {
            toast.error("No product selected. Returning to shop.");
            navigate('/');
        }
    }, [product, navigate]);

    useEffect(() => {
        if (product && product.isBulkEnabled && product.bulkRules?.length > 0) {
            const applicableRule = [...product.bulkRules]
                .sort((a, b) => b.minQty - a.minQty)
                .find(rule => quantity >= rule.minQty);
            
            if (applicableRule) {
                setCurrentPrice((product.basePrice || 0) - (applicableRule.pricePerUnit || 0));
            } else {
                setCurrentPrice(product.discountPrice || product.basePrice || 0);
            }
        } else {
            setCurrentPrice(product.discountPrice || product.basePrice || 0);
        }
    }, [quantity, product]);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (files.length + selectedFiles.length > 10) {
            return toast.error("Maximum 10 images allowed.");
        }

        const newFiles = [...files, ...selectedFiles];
        setFiles(newFiles);

        const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeFile = (index) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);

        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
    };

    const handleSubmission = async (mode = 'checkout') => {
        if (files.length === 0) {
            return toast.error("Please upload at least one image.");
        }

        setIsUploading(true);
        const loadingToast = toast.loading(mode === 'inquiry' ? "Registering Designer Brief..." : "Syncing assets to Agneya Cloud...");

        try {
            // 1. Upload files to backend
            const formData = new FormData();
            files.forEach(file => {
                formData.append('images', file);
            });

            const uploadRes = await axios.post('/api/public/manual-design/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (!uploadRes.data.success) throw new Error("Upload failed.");

            const imageUrls = uploadRes.data.urls;

            if (mode === 'checkout' || mode === 'cart') {
                // 2a. Prepare Cart Item with Manual Custom metadata
                const cartItem = {
                    productId: product._id,
                    name: `[MANUAL REQUEST] ${product.name}`,
                    unitPrice: currentPrice,
                    quantity: quantity,
                    itemType: 'Custom',
                    selectedVariation: { sku: 'custom_manual', size: 'Manual Custom' },
                    image: product.galleryImages?.[0] || product.images?.[0],
                    customData: {
                        mode: 'manual',
                        instructions: instructions,
                        manualAttachments: imageUrls,
                        appliedFrontDesign: imageUrls[0], // Use first image as main preview
                        design: {
                            instructions: instructions,
                            references: imageUrls.map(url => ({ url, type: 'manual_attachment' }))
                        }
                    }
                };

                if (isCompany) {
                    if (!companyName.trim()) return toast.error("Company Name is required when billing with GST.");
                    if (!gstNumber.trim()) return toast.error("GST Number is required when billing with GST.");
                    if (gstNumber.length < 15) return toast.error("Invalid GST Number.");
                    window.localStorage.setItem('temp_company_name', companyName);
                    window.localStorage.setItem('temp_gst_number', gstNumber);
                }

                if (mode === 'checkout') {
                    // BYPASS CART: Direct "Buy Now" protocol
                    toast.success("Design assets stabilized. Proceeding to direct checkout.", { id: loadingToast });
                    navigate('/checkout', { state: { buyNowItem: cartItem } });
                } else {
                    // ADD TO CART logic
                    addToCart(cartItem);
                    toast.success("Design saved to your cart pipeline.", { id: loadingToast });
                    navigate('/cart');
                }
            } else {
                // 2b. Submit as Inquiry only
                const inquiryData = {
                   name: (currentUser?.displayName || "Manual Requester"),
                   phone: (currentUser?.phoneNumber || "TBD"),
                   email: (currentUser?.email || "TBD"),
                   productCategory: product.category || product.name,
                   productId: product._id,
                   description: instructions,
                   printAssets: imageUrls,
                   status: 'Pending'
                };

                await axios.post('/api/public/custom-designs', inquiryData);
                toast.success("Brief delivered to designers. We will contact you shortly.", { id: loadingToast });
                navigate('/dashboard'); 
            }

        } catch (err) {
            console.error("Custom Request Failed:", err);
            toast.error("Cloud Sync Failure. Please try again.", { id: loadingToast });
        } finally {
            setIsUploading(false);
        }
    };

    if (!product) return null;

    return (
        <div className="min-h-screen bg-[#FBFCFE] font-sans selection:bg-indigo-600 selection:text-white pb-32">
            
            {/* PROGRESS HEADER */}
            <div className="bg-white border-b border-gray-100 py-6 sticky top-0 z-50 backdrop-blur-md bg-white/80">
                <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <Upload size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Manual Design Hub</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Protocol: Direct Asset Submission</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                            <ShieldCheck size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Secure Uplink</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 pt-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* LEFT: ASSET CONFIGURATION */}
                    <div className="lg:col-span-7 space-y-10">
                        
                        {/* 1. PRODUCT CONTEXT CARD */}
                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/40 flex items-center gap-8 group">
                            <div className="w-32 h-32 bg-gray-50 rounded-[30px] overflow-hidden p-4 border border-gray-100 transition-transform duration-500 group-hover:scale-105">
                                <img src={product.galleryImages?.[0] || product.images?.[0]} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                            </div>
                            <div className="space-y-2">
                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md uppercase tracking-widest leading-none block w-fit">Target Resource</span>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none">{product.name}</h3>
                                <div className="flex items-center gap-3">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Base Rate: ₹{(product.discountPrice || product.basePrice).toLocaleString('en-IN')}</p>
                                    {quantity >= 20 && product.isBulkEnabled && (
                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-widest border border-emerald-100 animate-pulse">Bulk Pricing Applied</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* NEW: QUANTITY SELECTOR */}
                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/40 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none">Order Volume</h4>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Adjust quantity for wholesale rates</p>
                                </div>
                                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                                    <button 
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-900 hover:bg-gray-900 hover:text-white transition-all active:scale-95"
                                    >
                                        <X size={14} className="rotate-45" /> {/* Use as minus symbol */}
                                    </button>
                                    <input 
                                        type="number" 
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-20 text-center bg-transparent text-lg font-black text-gray-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button 
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-900 hover:bg-gray-900 hover:text-white transition-all active:scale-95"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2. MULTI-FILE UPLOAD ZONE */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Design Assets (Up to 10)</h4>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{files.length}/10 Files Attached</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {previews.map((preview, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-3xl overflow-hidden group shadow-md border border-gray-100">
                                        <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <button 
                                                onClick={() => removeFile(idx)}
                                                className="w-10 h-10 bg-white text-red-500 rounded-full flex items-center justify-center shadow-2xl hover:bg-red-500 hover:text-white transition-all transform hover:scale-110 active:scale-95"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                {files.length < 10 && (
                                    <label className="aspect-square border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-600 hover:bg-indigo-50/30 transition-all group overflow-hidden relative">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-indigo-600 shadow-sm border border-gray-100 group-hover:border-indigo-100 transition-all group-hover:rotate-6">
                                            <Plus size={24} />
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sync File</span>
                                        <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* 3. INSTRUCTIONS */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 ml-2">
                                <MessageSquare size={16} className="text-gray-400" />
                                <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Fabrication Instructions</h4>
                            </div>
                            <textarea 
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                rows="6"
                                placeholder="SPECIFY POSITIONING, TEXT CONTENT, COLOR PREFERENCES, OR ANY OTHER TECHNICAL DETAILS OUR DESIGNERS SHOULD FOLLOW..."
                                className="w-full bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/20 text-[13px] font-bold text-gray-600 uppercase tracking-tight focus:ring-4 focus:ring-indigo-600/5 outline-none focus:border-indigo-600 transition-all resize-none placeholder:text-gray-300"
                            ></textarea>
                        </div>
                    </div>

                    {/* RIGHT: SUMMARY & CHECKOUT */}
                    <div className="lg:col-span-5 relative">
                        <div className="sticky top-32 space-y-8">
                            
                            {/* NEW: DIRECT ORDER GST PROTOCOL */}
                            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group/fields">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 mb-6 flex items-center gap-2">
                                    <CreditCard className="text-indigo-600" size={16} /> Direct Billing Setup
                                </h3>
                                
                                <div className="flex flex-col gap-3 mb-6">
                                    <label className="flex items-center gap-3 p-4 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setIsCompany(false)}>
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${!isCompany ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                            {!isCompany && <CheckCircle size={12} className="text-white" />}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Proceed as Individual (No GST)</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setIsCompany(true)}>
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${isCompany ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                            {isCompany && <CheckCircle size={12} className="text-white" />}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Company Invoice (With GST)</span>
                                    </label>
                                </div>

                                {isCompany && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <input 
                                                type="text" 
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                placeholder="Legal Company Name"
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[11px] font-bold text-gray-900 uppercase tracking-widest outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <input 
                                                type="text" 
                                                value={gstNumber}
                                                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                                                placeholder="15-Digit GSTIN Number"
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[11px] font-bold text-gray-900 uppercase tracking-widest outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-900 rounded-[50px] p-10 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
                                
                                <h3 className="text-3xl font-black mb-10 tracking-tighter uppercase italic leading-none">Checkout <br/>Summaries</h3>
                                
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Unit Price</span>
                                        <span className="text-white">₹{currentPrice.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Volume</span>
                                        <span className="text-white">{quantity} Units</span>
                                    </div>
                                    <div className="h-px bg-white/10 w-full my-6"></div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payable</p>
                                            <p className="text-4xl font-black text-indigo-400 tracking-tighter uppercase leading-none">₹{(currentPrice * quantity).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="text-[10px] font-black text-indigo-400 uppercase text-right leading-tight">
                                            *Tax & Delivery <br/> calculated next
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-3 mt-10">
                                    <button 
                                        onClick={() => handleSubmission('cart')}
                                        disabled={isUploading || files.length === 0}
                                        className={`w-full bg-white text-slate-900 py-6 rounded-[30px] font-black text-[12px] uppercase tracking-[0.3em] transition-all shadow-xl hover:bg-indigo-50 flex items-center justify-center gap-4 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                                    >
                                        Add to Cart <Plus size={18} />
                                    </button>

                                    <button 
                                        onClick={() => handleSubmission('checkout')}
                                        disabled={isUploading || files.length === 0}
                                        className={`w-full bg-indigo-600 text-white py-6 rounded-[30px] font-black text-[12px] uppercase tracking-[0.3em] transition-all shadow-xl hover:bg-indigo-700 group/btn flex items-center justify-center gap-4 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                                    >
                                        {isUploading ? (
                                            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> SYNCING...</>
                                        ) : (
                                            <>Buy Now & Checkout <CreditCard size={18} className="group-hover/btn:translate-x-2 transition-transform" /></>
                                        )}
                                    </button>
                                </div>

                                <button 
                                    onClick={() => handleSubmission('inquiry')}
                                    disabled={isUploading || files.length === 0}
                                    className={`w-full bg-transparent text-white/50 border border-white/10 py-5 rounded-[30px] font-black text-[10px] uppercase tracking-[0.3em] mt-6 transition-all hover:bg-white/10 hover:text-white ${isUploading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                                >
                                    Submit Brief for Designer Quote
                                </button>
                                
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.4em] text-center mt-8 leading-relaxed px-8">
                                    Secure gateway protocol encrypted using high-fidelity hash tokens.
                                </p>
                            </div>

                            <div className="bg-white/60 backdrop-blur-xl border border-white p-10 rounded-[40px] shadow-sm">
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <CheckCircle size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Priority Review</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manual submissions enter priority manufacturing queue.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <ShieldCheck size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Quality Assurance</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Our designers manually optimize your images for maximum fidelity.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomRequest;
