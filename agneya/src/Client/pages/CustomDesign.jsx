import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Link, useParams } from 'react-router-dom';
import * as fabric from 'fabric'; 
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LoginModal from '../components/LoginModal';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { 
    FiType, FiImage, FiSmile, FiEdit3, FiLayers, 
    FiChevronLeft, FiPlus, FiTrash2, FiX, FiZap, FiBox, FiArrowRight, FiShoppingBag,
    FiArrowUp, FiRotateCcw, FiSave, FiMove, FiActivity, FiMaximize, FiCheckCircle, FiFeather, FiCloud
} from 'react-icons/fi';
import { MODELS } from '../components/Three/ProductLibrary';

function Model3D({ url, textureUrl, scale = 1.5, rotation = [0,0,0] }) {
    if (!url) return null;
    const { scene } = useGLTF(url);
    const textureRef = useRef(null);

    useEffect(() => {
        if (!textureUrl || !scene) return;

        let loadedTexture = null;
        try {
            const loader = new THREE.TextureLoader();
            loader.load(textureUrl, (texture) => {
                texture.flipY = false;
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                loadedTexture = texture;

                scene.traverse((child) => {
                    if (!child.isMesh) return;
                    const name = child.name.toLowerCase();
                    const isAuxiliary = name.includes('handle') || name.includes('inside') || name.includes('bottom') || name.includes('sole') || name.includes('lace');
                    if (isAuxiliary) return;

                    if (child.material) {
                        if (child.material.map && child.material.map !== texture) {
                            child.material.map.dispose();
                        }
                        
                        if (!child.userData.isCloned) {
                            child.material.dispose();
                            child.material = child.material.clone();
                            child.userData.isCloned = true;
                        }
                    }

                    child.material.map = texture;
                    child.material.transparent = true;
                    child.material.alphaTest = 0.1;
                    child.material.needsUpdate = true;
                });
            });
        } catch (err) {
            console.error('Model3D Sync Error:', err);
        }

        return () => {
             if (loadedTexture) loadedTexture.dispose();
             if (scene) {
                 scene.traverse((child) => {
                     if (child.isMesh && child.material) {
                         if (child.material.map) child.material.map.dispose();
                         child.material.dispose();
                     }
                 });
             }
        };
    }, [textureUrl, scene]);

    return <primitive object={scene} scale={scale} rotation={rotation} />;
}


const CustomDesign = ({ initialMode, initial3D }) => {
    const navigate = useNavigate();
    const { productId } = useParams();
    const { currentUser, userData } = useAuth();
    const { addToCart } = useCart();
    
    // UI State
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('text'); 
    const [viewSide, setViewSide] = useState('front');
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [brushSize, setBrushSize] = useState(5);
    const [brushColor, setBrushColor] = useState('#2D3436');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    
    // Product Design State
    const [customizationType, setCustomizationType] = useState('None');
    const [modelImages, setModelImages] = useState({ front: '', back: '' });
    const [uploaded3DTexture, setUploaded3DTexture] = useState(null);
    const [canvasTexture, setCanvasTexture] = useState(null);
    const [contextKey, setContextKey] = useState(0); 
    const [variations, setVariations] = useState([
        { id: 1, name: 'Item 1', frontCanvasData: null, backCanvasData: null }
    ]);
    const [activeVariationId, setActiveVariationId] = useState(1);
    const [designMode, setDesignMode] = useState(initialMode || 'PREVIEW');
    const [activeCanvasSide, setActiveCanvasSide] = useState('front');
    const [is3DMode, setIs3DMode] = useState(initial3D === true);
    const [pricing, setPricing] = useState({ unitPrice: 0, totalPrice: 0, bulkApplied: false });
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [orderForm, setOrderForm] = useState({ name: '', phone: '', email: '', address: '', quantity: 1, note: '' });
    const [orderSuccess, setOrderSuccess] = useState(null);

    // Refs
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const backCanvasRef = useRef(null);
    const backFabricRef = useRef(null);
    const fileRef = useRef(null);

    // Initialization
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            setWindowHeight(window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/api/public/products/${productId}`);
                if (res.data) {
                    const p = res.data;
                    setProduct(p);
                    setCustomizationType(p.customizationType || 'None');
                    setModelImages({ front: p.blankFrontImage, back: p.blankBackImage });
                }
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        if (productId) fetchProduct();
    }, [productId]);
    
    // Live Pricing Logic
    useEffect(() => {
        if (!product) return;
        const qty = parseInt(orderForm.quantity) || 1;
        let unitPrice = product.discountPrice || product.basePrice;
        let bulkApplied = false;
        if (product.isBulkEnabled && product.bulkRules?.length > 0) {
            const applicableRule = [...product.bulkRules].sort((a,b) => b.minQty - a.minQty).find(r => qty >= r.minQty);
            if (applicableRule) {
                unitPrice = applicableRule.pricePerUnit;
                bulkApplied = true;
            }
        }
        setPricing({ unitPrice, totalPrice: unitPrice * qty, bulkApplied });
    }, [product, orderForm.quantity]);

    // Fabric Initialization
    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = new fabric.Canvas(canvasRef.current, { width: 500, height: 600, backgroundColor: 'transparent', preserveObjectStacking: true });
        fabricRef.current = canvas;

        const updateTexture = () => {
            if (fabricRef.current && fabricRef.current.contextContainer) {
                const dataURL = fabricRef.current.toDataURL({ format: 'png', quality: 1, multiplier: 2, withoutBackgroundImage: true });
                setCanvasTexture(dataURL);
            }
        };

        canvas.on('object:modified', updateTexture);
        canvas.on('object:added', updateTexture);
        canvas.on('object:removed', updateTexture);
        canvas.on('path:created', updateTexture);

        return () => {
            if (fabricRef.current) {
                const c = fabricRef.current;
                fabricRef.current = null;
                c.dispose();
            }
        };
    }, [productId]);

    const addText = (preset = 'body') => {
        if (!fabricRef.current) return;
        const conf = { heading: { text: 'HEADING', size: 60, weight: '900' }, subhead: { text: 'Secondary Text', size: 30, weight: '700' }, body: { text: 'Edit this text', size: 20, weight: '500' } }[preset];
        const itext = new fabric.IText(conf.text, { left: 250, top: 300, originX: 'center', originY: 'center', fontSize: conf.size, fontWeight: conf.weight, fill: brushColor, fontFamily: 'Inter, sans-serif' });
        fabricRef.current.add(itext).setActiveObject(itext).renderAll();
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !fabricRef.current) return;
        const reader = new FileReader();
        reader.onload = (f) => {
            const imgElement = new Image();
            imgElement.crossOrigin = "anonymous";
            imgElement.onload = () => {
                const img = new fabric.FabricImage(imgElement, { width: imgElement.naturalWidth, height: imgElement.naturalHeight });
                img.scaleToWidth(200);
                fabricRef.current.add(img).centerObject(img).setActiveObject(img).renderAll();
            };
            imgElement.src = f.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleFinalSubmit = async (mode = 'cart') => {
        if (!currentUser) return setIsLoginModalOpen(true);
        setIsSubmitting(true);
        try {
            const frontDesignOnly = fabricRef.current?.toDataURL({ format: 'png', quality: 1.0, multiplier: 2 });
            const cartItem = {
                productId: product._id,
                name: `[STUDIO] ${product.name}`,
                unitPrice: pricing.unitPrice,
                quantity: 1,
                itemType: 'Custom',
                image: frontDesignOnly || product.blankFrontImage,
                customData: { mode: 'self', designImage: frontDesignOnly }
            };
            if (mode === 'checkout') {
                navigate('/checkout', { state: { buyNowItem: cartItem } });
            } else {
                await addToCart(cartItem);
                navigate('/cart');
            }
        } catch (e) {
            console.error("Cart integration failed:", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-white gap-6">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-[#f0f2f5] overflow-hidden select-none font-sans relative">
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={() => setIsLoginModalOpen(false)} />

            {/* TOP BAR / TABS */}
            <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-50">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-900 transition-all">
                    <FiX size={24} />
                </button>
                
                <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest italic">{product?.name}</h1>

                <div className="flex items-center gap-2">
                    <div className="bg-gray-50 p-1.5 rounded-full flex gap-1 border border-gray-100">
                        <button 
                            onClick={() => { setDesignMode('PREVIEW'); setIs3DMode(true); }}
                            className={`px-8 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${designMode === 'PREVIEW' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Customer Designs
                        </button>
                        <button 
                            onClick={() => { setDesignMode('ASSISTANCE'); setIs3DMode(false); }}
                            className={`px-8 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${designMode === 'ASSISTANCE' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Design Assistance
                        </button>
                    </div>
                </div>

                <div className="w-24"></div>
            </header>

            <main className="flex-1 flex overflow-hidden p-6 gap-6 relative">
                
                {/* LEFT PANEL: CREATION SUITE */}
                <aside className="w-[300px] bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col p-8 overflow-y-auto no-scrollbar z-10">
                    <div className="space-y-10">
                        <section>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Creation Suite</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => addText('heading')} className="aspect-square bg-white rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-indigo-50 border border-gray-50 hover:border-indigo-200 group transition-all shadow-sm">
                                    <div className="w-12 h-12 bg-gray-50 group-hover:bg-white rounded-2xl flex items-center justify-center">
                                        <FiType size={20} className="text-gray-400 group-hover:text-indigo-600" />
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 group-hover:text-indigo-900">Add Text</span>
                                </button>
                                <button onClick={() => fileRef.current?.click()} className="aspect-square bg-white rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-indigo-50 border border-gray-50 hover:border-indigo-200 group transition-all shadow-sm">
                                    <div className="w-12 h-12 bg-gray-50 group-hover:bg-white rounded-2xl flex items-center justify-center">
                                        <FiImage size={20} className="text-gray-400 group-hover:text-indigo-600" />
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 group-hover:text-indigo-900">Add Image</span>
                                </button>
                            </div>
                            <button className="w-full mt-6 py-5 bg-gray-50 rounded-2xl flex items-center justify-center gap-4 hover:bg-white border border-transparent hover:border-gray-100 transition-all font-black text-[9px] uppercase tracking-[0.3em] text-gray-900">
                                <FiZap size={16} className="text-indigo-600" /> Ink Mode
                            </button>
                        </section>

                        <section>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Designer Tools</h3>
                            <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border-2 border-slate-900">
                                <div className="h-1 w-8 bg-slate-900 rounded-full"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Master Studio</span>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Theme Palette</h3>
                            <div className="flex flex-wrap gap-4">
                                {['#0F172A', '#38BDF8', '#F43F5E', '#FBBF24', '#FFFFFF', '#EF4444', '#10B981', '#6366F1', '#F97316', '#000000'].map(c => (
                                    <button 
                                        key={c} 
                                        onClick={() => setBrushColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${brushColor === c ? 'border-indigo-600 scale-125 shadow-xl' : 'border-gray-50 shadow-sm'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="mt-auto pt-10">
                        <div className="p-8 bg-white border border-dashed border-gray-200 rounded-[32px] flex flex-col items-center gap-4 text-center group cursor-pointer hover:border-indigo-300 transition-all">
                            <FiBox size={32} className="text-gray-200 group-hover:text-indigo-600 transition-colors" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300">Select Layer</span>
                        </div>
                    </div>
                </aside>

                {/* CENTER AREA: WORKSPACE */}
                <div className="flex-1 flex flex-col items-center justify-center relative">
                    <div className="w-full h-full flex items-center justify-center gap-12 p-12">
                         {designMode === 'PREVIEW' ? (
                            <div className="w-full h-full relative flex items-center justify-center transition-all duration-1000">
                                {/* Invisible Canvas for Fabric Engine */}
                                <div className="fixed -left-[2000px] pointer-events-none opacity-0">
                                     <canvas ref={canvasRef} />
                                </div>
                                
                                <div className="w-full h-full max-w-4xl aspect-square relative">
                                    <Canvas camera={{ position: [0, 0, 4.5], fov: 40 }}>
                                        <ambientLight intensity={1.5} />
                                        <spotLight position={[10, 10, 10]} intensity={2} angle={0.15} penumbra={1} />
                                        <React.Suspense fallback={null}>
                                            {(product?.base3DModelUrl || (product?.baseModelId && MODELS[product.baseModelId]?.path)) ? (
                                                <Model3D 
                                                    url={product.base3DModelUrl || MODELS[product.baseModelId].path} 
                                                    textureUrl={canvasTexture}
                                                    scale={product.baseModelId && MODELS[product.baseModelId] ? MODELS[product.baseModelId].defaultScale : 1.5}
                                                    rotation={product.baseModelId && MODELS[product.baseModelId] ? MODELS[product.baseModelId].defaultRotation : [0,0,0]}
                                                />
                                            ) : null}
                                        </React.Suspense>
                                        <OrbitControls enablePan={false} maxDistance={8} minDistance={3} />
                                    </Canvas>
                                </div>

                                {/* Floating Tool Pill */}
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-[0_32px_64px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col p-4 gap-8 z-40">
                                    <FiImage size={24} className="text-gray-300 hover:text-indigo-600 cursor-pointer" onClick={() => fileRef.current?.click()}/>
                                    <FiType size={24} className="text-gray-300 hover:text-indigo-600 cursor-pointer" onClick={() => addText('body')}/>
                                    <FiSmile size={24} className="text-gray-300 hover:text-indigo-600 cursor-pointer" />
                                    <FiEdit3 size={24} className="text-gray-300 hover:text-indigo-600 cursor-pointer" />
                                    <FiLayers size={24} className="text-gray-300 hover:text-indigo-600 cursor-pointer" />
                                </div>

                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10">
                                     <img src={canvasTexture} alt="" className="w-[400px] h-[500px] object-contain" />
                                </div>
                            </div>
                         ) : (
                             <div className="max-w-xl text-center space-y-10 animate-in zoom-in-95 duration-700 bg-white/40 backdrop-blur-3xl p-16 rounded-[48px] border border-white shadow-2xl">
                                 <div className="w-24 h-24 bg-indigo-600 rounded-[32px] mx-auto flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                                     <FiFeather size={40} />
                                 </div>
                                 <div className="space-y-4">
                                     <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Design Assistance</h2>
                                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Collaborate with our neural engineering team</p>
                                 </div>
                                 <button onClick={() => navigate(`/request-design?productId=${productId}`)} className="h-24 w-full bg-slate-900 text-white rounded-[32px] font-black text-[11px] uppercase tracking-[0.5em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">
                                     Initialize Brief
                                 </button>
                             </div>
                         )}
                    </div>
                </div>

                {/* RIGHT PANEL: ORDER SUMMARY */}
                <aside className="w-[340px] bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col p-10 overflow-y-auto no-scrollbar z-10">
                    <div className="space-y-12">
                        <section>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-10">Order Summary</h3>
                            <div className="space-y-10">
                                <div className="flex items-center justify-between p-8 bg-gray-50 rounded-[32px] border border-gray-100">
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Per Unit Cost</span>
                                    <span className="text-3xl font-black text-gray-900 tracking-tighter">₹{pricing.unitPrice}</span>
                                </div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] text-center px-8 leading-relaxed">Quantity & sizes apply in cart based on variation selection</p>
                            </div>
                        </section>

                        {product?.isBulkEnabled && product?.bulkRules?.length > 0 && (
                            <section>
                                <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                                    WHOLESALE READY
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between px-3 text-[9px] font-black text-gray-300 uppercase tracking-widest">
                                        <span>Batch Range</span>
                                        <span>Unit Off</span>
                                    </div>
                                    <div className="space-y-2">
                                        {product.bulkRules.map((rule, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-emerald-100 transition-all">
                                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Above {rule.minQty}</span>
                                                <span className="text-[11px] font-black text-emerald-600">₹{rule.pricePerUnit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        <div className="pt-10 space-y-8 mt-auto">
                            <div className="flex items-end justify-between px-3 border-t border-gray-50 pt-10">
                                <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Subtotal</span>
                                <span className="text-5xl font-black text-gray-900 tracking-tighter">₹{pricing.unitPrice}</span>
                            </div>

                            <div className="space-y-4">
                                <button onClick={() => handleFinalSubmit('checkout')} className="w-full h-24 bg-white border-2 border-slate-900 rounded-[32px] flex items-center justify-center gap-4 text-slate-900 font-black text-[12px] uppercase tracking-[0.4em] hover:bg-slate-50 transition-all shadow-sm">
                                    <FiArrowRight size={20} /> Buy Now
                                </button>
                                <button onClick={() => handleFinalSubmit('cart')} className="w-full h-24 bg-slate-950 text-white rounded-[32px] flex items-center justify-center gap-4 font-black text-[12px] uppercase tracking-[0.4em] hover:bg-black transition-all shadow-2xl shadow-indigo-100">
                                    <FiShoppingBag size={20} /> Add to Cart
                                </button>
                            </div>
                            
                            <button className="w-full text-center text-[9px] font-black text-gray-300 uppercase tracking-widest hover:text-red-500 transition-all">
                                Abort Custom Design
                            </button>
                        </div>
                    </div>
                </aside>
            </main>

            <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
        </div>
    );
};

export default CustomDesign;
