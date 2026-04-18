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
    FiChevronLeft, FiPlus, FiTrash2, 
    FiArrowUp, FiRotateCcw, FiSave, FiMove, FiActivity, FiZap, FiMaximize, FiCheckCircle
} from 'react-icons/fi';

function Model3D({ url, textureUrl }) {
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

                    // Optimization: Only clone the material once to prevent memory explosion
                    if (child.material) {
                        if (child.material.map && child.material.map !== texture) {
                            child.material.map.dispose();
                        }
                        
                        // Use child.userData as a persistent flag across re-renders for the same scene object
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
             // Traverse and dispose materials if the component unmounts
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

    return <primitive object={scene} scale={1.5} />;
}


const CustomDesign = () => {
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
    const [is3DMode, setIs3DMode] = useState(false);
    const [contextKey, setContextKey] = useState(0); 
    const [variations, setVariations] = useState([
        { id: 1, name: 'Item 1', frontCanvasData: null, backCanvasData: null }
    ]);
    const [activeVariationId, setActiveVariationId] = useState(1);
    const [pricing, setPricing] = useState({ unitPrice: 0, totalPrice: 0, bulkApplied: false });
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [orderForm, setOrderForm] = useState({ name: '', phone: '', email: '', address: '', quantity: 1, note: '' });
    const [orderSuccess, setOrderSuccess] = useState(null);

    // Refs
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
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
                    if (!p.blankFrontImage && p.blankBackImage) setViewSide('back');
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
            const applicableRule = [...product.bulkRules]
                .sort((a,b) => b.minQty - a.minQty)
                .find(r => qty >= r.minQty);
            
            if (applicableRule) {
                unitPrice = applicableRule.pricePerUnit;
                bulkApplied = true;
            }
        }

        setPricing({
            unitPrice,
            totalPrice: unitPrice * qty,
            bulkApplied
        });
    }, [product, orderForm.quantity]);

    // Fabric Initialization
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 500,
            height: 600,
            backgroundColor: 'transparent',
            preserveObjectStacking: true
        });

        fabricRef.current = canvas;

        const updateTexture = () => {
            if (fabricRef.current && fabricRef.current.contextContainer) {
                try {
                    const dataURL = fabricRef.current.toDataURL({
                        format: 'png',
                        quality: 1,
                        multiplier: 2,
                        withoutBackgroundImage: true
                    });
                    setCanvasTexture(dataURL);
                } catch (err) {
                    console.warn('Silent Texture Sync Failure:', err);
                }
            }
        };

        canvas.on('object:modified', updateTexture);
        canvas.on('object:added', updateTexture);
        canvas.on('object:removed', updateTexture);
        canvas.on('path:created', updateTexture);

        // Grid system
        const currentVar = variations.find(v => v.id === activeVariationId);
        const data = currentVar ? currentVar[`${viewSide}CanvasData`] : null;
        if (data) {
            canvas.loadFromJSON(data).then(() => canvas.renderAll());
        }

        return () => {
            if (fabricRef.current) {
                const c = fabricRef.current;
                fabricRef.current = null; // Immediate nullification to prevent effect race conditions
                try {
                    c.off('object:modified', updateTexture);
                    c.off('object:added', updateTexture);
                    c.off('object:removed', updateTexture);
                    c.off('path:created', updateTexture);
                    c.dispose();
                } catch (e) {
                    console.error("Canvas Cleanup Error:", e);
                }
            }
        };
    }, [customizationType, productId, activeVariationId]);

    // Background Transitions
    useEffect(() => {
        const applyBg = async () => {
            const bgUrl = modelImages[viewSide];
            if (fabricRef.current && bgUrl && customizationType !== '3D') {
                try {
                    const img = await fabric.FabricImage.fromURL(bgUrl, { crossOrigin: 'anonymous' });
                    const scale = Math.min(500 / img.width, 600 / img.height);
                    img.scale(scale);
                    img.set({
                        originX: 'center',
                        originY: 'center',
                        left: 250,
                        top: 300,
                        selectable: false,
                        evented: false,
                        excludeFromExport: true 
                    });
                    fabricRef.current.backgroundImage = img;
                    fabricRef.current.renderAll();
                } catch (e) {
                    console.error("BG load failure:", e);
                }
            }
        };
        applyBg();
    }, [viewSide, modelImages, customizationType, loading]);

    // Canvas Operations
    const handleSwitchSide = async (side) => {
        if (side === viewSide || !fabricRef.current) return;
        
        const json = fabricRef.current.toJSON();
        setVariations(prev => prev.map(v => 
            v.id === activeVariationId ? { ...v, [`${viewSide}CanvasData`]: json } : v
        ));
        
        fabricRef.current.clear();
        setViewSide(side);
        
        const targetVar = variations.find(v => v.id === activeVariationId);
        const targetData = targetVar ? targetVar[`${side}CanvasData`] : null;
        if (targetData) {
            await fabricRef.current.loadFromJSON(targetData);
            fabricRef.current.renderAll();
        }
    };

    const addText = (preset = 'body') => {
        if (!fabricRef.current) return;
        const conf = {
            heading: { text: 'HELLO WORLD', size: 60, weight: '900' },
            subhead: { text: 'Subheading Text', size: 30, weight: '700' },
            body: { text: 'Double click to edit', size: 20, weight: '500' }
        }[preset];

        const itext = new fabric.IText(conf.text, {
            left: 250,
            top: 300,
            originX: 'center',
            originY: 'center',
            fontSize: conf.size,
            fontWeight: conf.weight,
            fill: brushColor,
            fontFamily: 'Inter, sans-serif'
        });
        fabricRef.current.add(itext).setActiveObject(itext).renderAll();
    };

    const addImageFromURL = (url) => {
        if (!fabricRef.current) return;
        const imgElement = new Image();
        imgElement.crossOrigin = "anonymous";
        imgElement.onload = () => {
            try {
                if (!fabricRef.current) return;
                const ImgClass = fabric.FabricImage || fabric.Image;
                const img = new ImgClass(imgElement, {
                    width: imgElement.naturalWidth || imgElement.width || 100,
                    height: imgElement.naturalHeight || imgElement.height || 100
                });
                img.scaleToWidth(200);
                img.set({ originX: 'center', originY: 'center', left: 250, top: 300 });
                fabricRef.current.add(img).centerObject(img).setActiveObject(img).renderAll();
            } catch (err) {
                console.error("CustomDesign Add Image Error:", err);
            }
        };
        imgElement.src = url;
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (f) => {
            if (fabricRef.current) {
                addImageFromURL(f.target.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveBg = async () => {
        const activeObj = fabricRef.current?.getActiveObject();
        if (!activeObj) {
            alert("No target identified. Select a canvas element to initiate AI removal.");
            return;
        }

        try {
            setIsRemovingBg(true);
            let sourceUrl = activeObj.toDataURL({ format: 'png', quality: 1 });
            
            const response = await fetch(sourceUrl);
            const blob = await response.blob();
            const fd = new FormData();
            fd.append('image', blob, 'design.png');

            const res = await axios.post('/api/public/remove-bg', fd, { 
                responseType: 'arraybuffer',
                timeout: 60000 
            });

            if (!res.data || res.data.byteLength < 100) throw new Error("Invalid AI synchronization data.");

            const processedUrl = URL.createObjectURL(new Blob([res.data], { type: 'image/png' }));

            const imgElement = new Image();
            imgElement.crossOrigin = "anonymous";
            imgElement.onload = () => {
                const img = new fabric.FabricImage(imgElement, {
                    width: imgElement.naturalWidth || imgElement.width,
                    height: imgElement.naturalHeight || imgElement.height
                });
                img.set({
                    left: activeObj.left, 
                    top: activeObj.top,
                    scaleX: activeObj.scaleX, 
                    scaleY: activeObj.scaleY,
                    angle: activeObj.angle, 
                    originX: activeObj.originX, 
                    originY: activeObj.originY,
                    flipX: activeObj.flipX,
                    flipY: activeObj.flipY
                });
                fabricRef.current.add(img);
                fabricRef.current.remove(activeObj);
                fabricRef.current.setActiveObject(img);
                fabricRef.current.renderAll();
            };
            imgElement.src = processedUrl;
        } catch (e) {
            console.error("BG Removal failed", e);
            alert("Failed to synchronize AI image removal.");
        } finally {
            setIsRemovingBg(false);
        }
    };

    const toggleDrawing = () => {
        if (!fabricRef.current) return;
        const next = !isDrawingMode;
        setIsDrawingMode(next);
        fabricRef.current.isDrawingMode = next;
        if (next) {
            fabricRef.current.freeDrawingBrush = new fabric.PencilBrush(fabricRef.current);
            fabricRef.current.freeDrawingBrush.width = parseInt(brushSize);
            fabricRef.current.freeDrawingBrush.color = brushColor;
        }
    };

    const canvasWidthScale = Math.min(1, (windowWidth - 40) / 600);
    const canvasHeightScale = Math.min(1, (windowHeight - 200) / 800);
    const canvasScale = Math.min(canvasWidthScale, canvasHeightScale);

    useEffect(() => {
        if (userData) setOrderForm(prev => ({
            ...prev,
            name: userData.name || '',
            phone: userData.phone || '',
            email: userData.email || '',
            address: userData.addresses?.[0] ? `${userData.addresses[0].houseNo}, ${userData.addresses[0].area}, ${userData.addresses[0].city}` : ''
        }));
    }, [userData]);

    const handleFinalSubmit = async (mode = 'cart') => {
        if (!orderForm.name || !orderForm.phone || !orderForm.address) return alert("Required operational metadata missing.");
        
        setIsSubmitting(true);
        try {
            // ... (rest of the logic remains same, just ensure we use 'mode' at the end)
            const frontDesignOnly = fabricRef.current?.toDataURL({ format: 'png', quality: 1.0, multiplier: 2 });
            const frontCanvasData = fabricRef.current?.toJSON(['uid', 'excludeFromExport']);
            
            let backDesignOnly = null;
            let backCanvasState = null;
            
            if (customizationType === '2D' && modelImages.back) {
                const currentVar = variations.find(v => v.id === activeVariationId);
                const currentFrontState = fabricRef.current?.toJSON(['uid', 'excludeFromExport']);
                if (currentVar.backCanvasData) {
                    await fabricRef.current.loadFromJSON(currentVar.backCanvasData);
                    backDesignOnly = fabricRef.current.toDataURL({ format: 'png', quality: 1.0, multiplier: 2 });
                    backCanvasState = currentVar.backCanvasData;
                    await fabricRef.current.loadFromJSON(currentFrontState); 
                }
            }

            const generateComposite = async (designDataUrl, bgUrl) => {
                return new Promise((resolve) => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 500;
                    canvas.height = 600;
                    const bgImg = new Image();
                    bgImg.crossOrigin = "anonymous";
                    bgImg.onload = () => {
                        ctx.drawImage(bgImg, 0, 0, 500, 600);
                        const designImg = new Image();
                        designImg.crossOrigin = "anonymous";
                        designImg.onload = () => {
                            ctx.drawImage(designImg, 0, 0, 500, 600);
                            resolve(canvas.toDataURL('image/png'));
                        };
                        designImg.src = designDataUrl;
                    };
                    bgImg.src = bgUrl;
                });
            };

            const cartThumbnail = await generateComposite(frontDesignOnly, modelImages.front);

            const registryData = {
                name: orderForm.name,
                phone: orderForm.phone,
                email: orderForm.email,
                productType: product.name,
                productId: product._id,
                quantity: parseInt(orderForm.quantity),
                address: orderForm.address,
                designImage: cartThumbnail,
                appliedFrontDesign: frontDesignOnly,
                appliedBackDesign: backDesignOnly,
                frontCanvasData: frontCanvasData,
                backCanvasData: backCanvasState,
                frontAnchors: product.frontAnchors || {},
                backAnchors: product.backAnchors || {},
                status: 'Draft' 
            };
            
            const registryRes = await axios.post('/api/public/custom-designs', registryData);
            const registryId = registryRes.data.success ? registryRes.data.data?._id : null;

            const cartItem = {
                productId: product._id,
                name: `[STUDIO DESIGN] ${product.name}`,
                unitPrice: pricing.unitPrice,
                quantity: parseInt(orderForm.quantity),
                itemType: 'Custom',
                selectedVariation: { sku: 'custom_design', size: 'Custom Design' },
                image: cartThumbnail,
                customData: {
                    ...registryData,
                    mode: 'self',
                    registryId: registryId
                }
            };

            if (mode === 'checkout') {
                navigate('/checkout', { state: { buyNowItem: cartItem } });
            } else {
                await addToCart(cartItem);
                navigate('/cart');
            }
            
        } catch (e) {
            console.error("Integration failed:", e);
            alert("Sync Error: Failed to add custom asset to cart.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-white gap-6">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse">Loading Studio...</p>
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden select-none font-sans relative">
            {customizationType === '3D' && (
                <button 
                    onClick={() => setIs3DMode(!is3DMode)}
                    className="fixed bottom-32 right-8 z-[60] bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 hover:scale-105 transition-all text-gray-900 font-bold"
                >
                    <FiLayers className={is3DMode ? 'text-indigo-600' : 'text-gray-400'} />
                    <span className="text-[10px] uppercase tracking-widest">{is3DMode ? 'Close 3D View' : 'Live 3D Preview'}</span>
                </button>
            )}

            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-emerald-200/20 blur-[100px] rounded-full pointer-events-none"></div>

            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={() => setIsLoginModalOpen(false)} />

            {isRemovingBg && (
                <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-2xl flex items-center justify-center p-6 text-center">
                    <div className="bg-white/80 backdrop-blur-xl p-12 rounded-[50px] shadow-2xl space-y-8 max-w-sm animate-in zoom-in-95 duration-500 border border-white">
                        <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 rounded-full border-8 border-indigo-50"></div>
                            <div className="absolute inset-0 rounded-full border-8 border-indigo-600 border-t-transparent animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-3xl">🤖</div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">AI Processing</h2>
                            <p className="text-xs font-bold text-gray-400 mt-2 px-6 italic">Removing background automatically...</p>
                        </div>
                    </div>
                </div>
            )}

            <header className="h-16 md:h-20 bg-white/60 backdrop-blur-xl border-b border-white/40 flex items-center justify-between px-6 md:px-10 z-50 relative">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 hover:bg-white/50 rounded-xl transition-all border border-transparent hover:border-white shadow-sm">
                        <FiChevronLeft className="w-5 h-5 text-gray-900" />
                    </button>
                    <div className="h-10 w-px bg-gray-200/50 mx-2"></div>
                    <div className="flex flex-col">
                        <h1 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none italic">{product?.name}</h1>
                        <div className="flex items-center gap-2 mt-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Studio is ready</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button onClick={() => setShowOrderModal(true)} className="bg-indigo-600 text-white px-8 md:px-12 py-4 rounded-[22px] font-black text-[10px] md:text-xs uppercase tracking-[0.2em] hover:bg-gray-900 shadow-2xl shadow-indigo-200 transition-all hover:-translate-y-1 active:scale-95">
                         Complete Design
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
                
                <aside className="hidden md:flex w-20 bg-white border-r border-gray-100 flex-col items-center py-6 gap-6 overflow-y-auto no-scrollbar">
                    {[
                        { id: 'text', icon: <FiType size={18}/>, label: 'Type' },
                        { id: 'uploads', icon: <FiImage size={18}/>, label: 'Cloud' },
                        { id: 'stickers', icon: <FiSmile size={18}/>, label: 'Assets' },
                        { id: 'draw', icon: <FiEdit3 size={18}/>, label: 'Draw' },
                        { id: 'layers', icon: <FiLayers size={18}/>, label: 'Stack' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`group relative flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-300 hover:text-gray-900'}`}
                        >
                            <div className={`p-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-indigo-50 shadow-inner' : 'group-hover:bg-gray-50'}`}>
                                {tab.icon}
                            </div>
                            <span className="text-[7.5px] font-black uppercase tracking-widest">{tab.label}</span>
                            {activeTab === tab.id && <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-600 rounded-r-full"></div>}
                        </button>
                    ))}
                </aside>

                <div className={`${activeTab ? 'flex' : 'hidden md:flex'} fixed inset-0 md:relative md:inset-auto md:w-80 bg-white h-screen md:h-full border-r border-gray-50 shadow-2xl md:shadow-none z-[60] flex-col p-6 animate-in slide-in-from-left duration-300`}>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                             <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Workspace tools</h2>
                             <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{activeTab} node synced</p>
                        </div>
                        <button onClick={() => setActiveTab(null)} className="md:hidden p-3 bg-gray-50 rounded-xl text-gray-400">
                             <FiChevronLeft size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar pb-12">
                        {activeTab === 'text' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <button onClick={() => addText('heading')} className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-slate-900 hover:text-white border border-transparent transition-all">
                                        <span className="text-xl font-black uppercase">Headline</span>
                                        <FiPlus className="text-gray-300 group-hover:text-white" />
                                    </button>
                                    <button onClick={() => addText('subhead')} className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-slate-900 hover:text-white border border-transparent transition-all">
                                        <span className="text-sm font-bold">Sub-script</span>
                                        <FiPlus className="text-gray-300 group-hover:text-white" />
                                    </button>
                                    <button onClick={() => addText('body')} className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-slate-900 hover:text-white border border-transparent transition-all">
                                        <span className="text-xs font-medium">Atomic Text</span>
                                        <FiPlus className="text-gray-300 group-hover:text-white" />
                                    </button>
                                </div>
                                
                                <div className="pt-6 mt-6 border-t border-gray-50 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Chromatic Flow</label>
                                        <div className="flex gap-1.5">
                                            {['#000000', '#FFFFFF', '#6366F1', '#EF4444', '#10B981'].map(c => (
                                                <button key={c} onClick={() => setBrushColor(c)} className="w-4 h-4 rounded-full border border-gray-100 shadow-sm" style={{backgroundColor: c}} />
                                            ))}
                                        </div>
                                    </div>
                                    <input type="color" value={brushColor} onChange={e => setBrushColor(e.target.value)} className="w-full h-10 rounded-xl border-none cursor-pointer bg-gray-50 p-1" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'uploads' && (
                            <div className="space-y-6">
                                <div className="relative group overflow-hidden">
                                     <div className="h-48 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-4 group-hover:border-indigo-600/30 group-hover:bg-white transition-all cursor-pointer">
                                        <input type="file" ref={fileRef} onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        <div className="w-12 h-12 rounded-xl bg-white shadow-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                            <FiPlus size={24}/>
                                        </div>
                                        <div className="text-center px-4">
                                            <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Initialize Upload</p>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5 tracking-tight">PNG, JPG or SVG formats</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <button onClick={handleRemoveBg} disabled={isRemovingBg} className="relative w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-gray-100 overflow-hidden group/ai active:scale-95 transition-all">
                                    <div className="absolute inset-0 bg-indigo-600 -translate-x-full group-hover/ai:translate-x-0 transition-transform duration-500"></div>
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        <FiZap size={14} /> Execute AI removal
                                    </span>
                                </button>
                                
                                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                                     <div className="flex items-center gap-2 text-indigo-600 mb-1.5">
                                          <FiActivity size={14} />
                                          <span className="text-[9px] font-black uppercase tracking-widest">Neural node active</span>
                                     </div>
                                     <p className="text-[8px] font-bold text-indigo-400 leading-relaxed italic uppercase tracking-tighter">AI processor standby. Select target asset to begin.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'stickers' && (
                            <div className="grid grid-cols-3 gap-6">
                                {[
                                    'https://cdn-icons-png.flaticon.com/512/2107/2107845.png',
                                    'https://cdn-icons-png.flaticon.com/512/2107/2107957.png',
                                    'https://cdn-icons-png.flaticon.com/512/2589/2589175.png',
                                    'https://cdn-icons-png.flaticon.com/512/1048/1048953.png',
                                    'https://cdn-icons-png.flaticon.com/512/742/742751.png',
                                    'https://cdn-icons-png.flaticon.com/512/3128/3128340.png',
                                    'https://cdn-icons-png.flaticon.com/512/3128/3128319.png',
                                    'https://cdn-icons-png.flaticon.com/512/3128/3128299.png',
                                    'https://cdn-icons-png.flaticon.com/512/3128/3128280.png',
                                    'https://cdn-icons-png.flaticon.com/512/3128/3128261.png',
                                    'https://cdn-icons-png.flaticon.com/512/190/190411.png',
                                    'https://cdn-icons-png.flaticon.com/512/190/190414.png',
                                ].map((s, i) => (
                                    <button key={i} onClick={() => addImageFromURL(s)} className="aspect-square bg-gray-50 rounded-3xl p-5 hover:bg-white hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center border border-transparent hover:border-gray-100">
                                        <img src={s} alt="sticker" className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {activeTab === 'draw' && (
                            <div className="space-y-10">
                                <button onClick={toggleDrawing} className={`w-full py-12 rounded-[40px] flex flex-col items-center gap-6 transition-all border-2 ${isDrawingMode ? 'bg-gray-900 border-gray-900 text-white shadow-2xl shadow-gray-400 rotate-2' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-white'}`}>
                                    <FiEdit3 size={32} className={isDrawingMode ? 'animate-pulse' : ''}/>
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">{isDrawingMode ? 'Mode: Freeform' : 'Access Ink Node'}</span>
                                </button>
                                
                                <div className="space-y-6">
                                     <div className="flex items-center justify-between">
                                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tip Diameter</span>
                                          <span className="text-xs font-black text-gray-900">{brushSize}px</span>
                                     </div>
                                     <input type="range" min="1" max="50" value={brushSize} onChange={e => setBrushSize(e.target.value)} className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-indigo-600" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'layers' && (
                            <div className="space-y-4">
                                 <button onClick={() => fabricRef.current?.getActiveObject()?.bringToFront() && fabricRef.current.renderAll()} className="w-full flex items-center justify-between p-6 bg-gray-50 rounded-[24px] hover:bg-white border border-transparent hover:border-gray-100 transition-all group">
                                     <span className="font-black text-[10px] uppercase tracking-widest text-gray-900">Elevate Element</span>
                                     <FiArrowUp size={18} className="text-gray-300 group-hover:text-indigo-600" />
                                 </button>
                                 <button onClick={() => fabricRef.current?.remove(...fabricRef.current.getActiveObjects()) && fabricRef.current.discardActiveObject().renderAll()} className="w-full flex items-center justify-between p-6 border-2 border-red-50 text-red-500 rounded-[24px] hover:bg-red-50 transition-all font-black text-[10px] uppercase tracking-widest">
                                     <span>Discard Selective</span>
                                     <FiTrash2 size={18}/>
                                 </button>
                                 
                                 <div className="pt-20">
                                     <div className="h-px w-full bg-gray-50 mb-8"></div>
                                     <button onClick={() => fabricRef.current?.clear() && setViewSide(viewSide)} className="w-full flex items-center justify-between p-6 bg-red-600 text-white rounded-[24px] hover:bg-gray-900 transition-all shadow-xl shadow-red-200 font-black text-[10px] uppercase tracking-[0.2em] active:scale-95">
                                         <span>Purge Workspace</span>
                                         <FiRotateCcw size={18}/>
                                     </button>
                                 </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center relative bg-[#F4F6F9] px-4 md:px-12">
                    
                    {/* Floating Island for View Controls */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-1.5 rounded-full border border-white/50 flex gap-1">
                        {customizationType === '2D' && (
                            <>
                                <button 
                                    onClick={() => handleSwitchSide('front')} 
                                    className={`relative px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 overflow-hidden ${viewSide === 'front' ? 'text-white shadow-md' : 'text-gray-500 hover:text-gray-900 bg-transparent'}`}
                                >
                                    {viewSide === 'front' && <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]"></div>}
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        Front View
                                    </span>
                                </button>
                                <button 
                                    onClick={() => handleSwitchSide('back')} 
                                    className={`relative px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 overflow-hidden ${viewSide === 'back' ? 'text-white shadow-md' : 'text-gray-500 hover:text-gray-900 bg-transparent'}`}
                                >
                                    {viewSide === 'back' && <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]"></div>}
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        Back View
                                    </span>
                                </button>
                            </>
                        )}
                        {customizationType === '3D' && (
                            <div className="px-8 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                                <FiMaximize size={12} className="animate-pulse" /> Neural Space
                            </div>
                        )}
                    </div>

                    <div 
                        className="relative z-10 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] mt-12"
                        style={{ transform: `scale(${canvasScale})` }}
                    >
                        {/* Premium Glassmorphic Editing Box */}
                        <div className="relative group bg-white/40 backdrop-blur-3xl rounded-[60px] shadow-[0_40px_100px_rgba(8,14,33,0.06),_inset_0_2px_4px_rgba(255,255,255,0.9)] p-8 md:p-10 border border-white/60 flex items-center justify-center gap-12 before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:from-indigo-100/50 before:to-purple-50/50 before:rounded-[60px] before:blur-2xl before:opacity-60">
                            
                            {/* Inner Canvas Container */}
                            <div className="bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05),_inset_0_0_0_1px_rgba(0,0,0,0.03)] overflow-hidden relative">
                                <div className={`${is3DMode ? 'w-[400px]' : 'w-[500px]'} h-[600px] relative transition-all duration-700`}>
                                    <canvas ref={canvasRef} />
                                </div>
                                {/* Corner Accents */}
                                <div className="absolute top-4 left-4 w-2 h-2 border-t-2 border-l-2 border-indigo-200"></div>
                                <div className="absolute top-4 right-4 w-2 h-2 border-t-2 border-r-2 border-indigo-200"></div>
                                <div className="absolute bottom-4 left-4 w-2 h-2 border-b-2 border-l-2 border-indigo-200"></div>
                                <div className="absolute bottom-4 right-4 w-2 h-2 border-b-2 border-r-2 border-indigo-200"></div>
                            </div>

                            {is3DMode && (
                                <div className="w-[400px] h-[600px] bg-gradient-to-br from-gray-50 to-white rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05),_inset_0_0_0_1px_rgba(0,0,0,0.03)] animate-in slide-in-from-right duration-700 relative">
                                     <Canvas 
                                        camera={{ position: [0, 0, 5], fov: 50 }} 
                                        gl={{ precision: 'highp', powerPreference: 'high-performance' }}
                                        onCreated={({ gl }) => {
                                            gl.domElement.addEventListener('webglcontextlost', (e) => {
                                                console.warn("WebGL Context Lost. Recovering...");
                                                e.preventDefault();
                                                setTimeout(() => setContextKey(prev => prev + 1), 500);
                                            }, false);
                                        }}
                                        key={contextKey}
                                    >
                                        <ambientLight intensity={1.2} />
                                        <spotLight position={[10, 10, 10]} intensity={1.5} />
                                         <React.Suspense fallback={null}>
                                            <Model3D url={product?.base3DModelUrl} textureUrl={canvasTexture} />
                                        </React.Suspense>
                                        <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.5} />
                                    </Canvas>
                                    
                                    {/* 3D indicator */}
                                    <div className="absolute top-6 right-6 flex gap-1.5 backdrop-blur-md bg-white/50 px-3 py-1.5 rounded-full border border-white/60 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse mt-0.5"></div>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-indigo-900 leading-none mt-0.5">Live 3D</span>
                                    </div>
                                </div>
                            )}

                            {/* Outer dashed indicator ring */}
                            <div className="absolute inset-4 border-[2px] border-dashed border-indigo-200/40 rounded-[48px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            {/* Floating manipulation badge */}
                            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-slate-900 text-white shadow-2xl rounded-full scale-90 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                <FiMove size={14} className="animate-bounce" />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em]">{customizationType === '3D' ? 'Rotate Matrix' : 'Manipulation Active'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Matrix Variations Selector */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-gray-100 shadow-xl">
                         <div className="flex gap-2.5 items-center px-2">
                              {variations.map(v => (
                                  <button
                                     key={v.id}
                                     onClick={() => setActiveVariationId(v.id)}
                                     className={`w-10 h-10 rounded-lg font-black text-[10px] transition-all flex items-center justify-center border-2 ${activeVariationId === v.id ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105' : 'bg-white border-gray-100 text-gray-300 hover:border-slate-400 hover:text-slate-600'}`}
                                  >
                                      {v.id < 10 ? `0${v.id}` : v.id}
                                  </button>
                              ))}
                              <button onClick={() => setVariations([...variations, { id: variations.length+1, name: `X`, frontCanvasData: null, backCanvasData: null }])} className="w-10 h-10 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300 hover:bg-slate-50 hover:border-slate-900 hover:text-slate-900 transition-all">
                                  <FiPlus size={20}/>
                              </button>
                         </div>
                    </div>
                </div>
            </main>

            {/* Production Request Modal */}
            {showOrderModal && (
                <div className="fixed inset-0 z-[200] bg-gray-900/40 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[60px] shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col md:flex-row border border-white">
                        
                        {/* Summary Visualization */}
                        <div className="md:w-[480px] bg-gray-50 flex flex-col items-center justify-center p-12 relative border-r border-gray-100">
                            <button onClick={() => setShowOrderModal(false)} className="absolute top-10 left-10 w-14 h-14 bg-white rounded-3xl shadow-xl flex items-center justify-center text-gray-900 hover:bg-red-500 hover:text-white transition-all active:scale-95">
                                <FiChevronLeft size={24}/>
                            </button>
                            
                             <div className="text-center mb-12">
                                 <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Production Summary</h3>
                                 <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2">Exporting high-res matrix</p>
                             </div>
                             
                             <div className="relative group perspective-1000 w-full max-w-sm">
                                 <div className="bg-white p-4 rounded-[48px] shadow-2xl border-[16px] border-white transform rotate-2 group-hover:rotate-0 transition-all duration-700 ease-out">
                                     <img 
                                        src={fabricRef.current?.toDataURL({ format: 'png', quality: 1.0, multiplier: 2 })} 
                                        alt="Asset Preview" 
                                        className="w-full h-auto rounded-[32px] bg-gray-50"
                                     />
                                 </div>
                                 <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-[0.4em] shadow-2xl whitespace-nowrap">
                                     SECURE 300DPI EXPORT
                                 </div>
                             </div>

                             <div className="mt-20 flex items-center gap-2 px-8 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600">
                                   <FiCheckCircle size={14} />
                                   <span className="text-[9px] font-black uppercase tracking-widest">Asset Ready for Fulfillment</span>
                             </div>
                        </div>

                        {/* Integration Form */}
                        <div className="flex-1 p-12 md:p-20 overflow-y-auto no-scrollbar">
                            {!orderSuccess ? (
                                <>
                                    <div className="mb-12">
                                        <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Initialize Production</h2>
                                        <p className="text-sm font-bold text-gray-400 mt-4 tracking-tight">Synchronize shipment coordinates for physical asset realization.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block mb-3">Operator Name</label>
                                            <input type="text" value={orderForm.name} onChange={e => setOrderForm({...orderForm, name: e.target.value})} className="w-full h-16 bg-gray-50 border-transparent rounded-[24px] px-8 font-black text-sm focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 focus:border-indigo-100 transition-all" placeholder="Full Legal Identity"/>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block mb-3">Communications Link</label>
                                            <input type="tel" value={orderForm.phone} onChange={e => setOrderForm({...orderForm, phone: e.target.value})} className="w-full h-16 bg-gray-50 border-transparent rounded-[24px] px-8 font-black text-sm focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 focus:border-indigo-100 transition-all" placeholder="+91 0000 000 000"/>
                                        </div>
                                        <div className="md:col-span-2">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block mb-3">Logistics Destination</label>
                                             {userData?.addresses?.length > 0 && (
                                                 <div className="flex gap-3 mb-6 overflow-x-auto no-scrollbar pb-2">
                                                     {userData.addresses.map((addr, idx) => (
                                                         <button
                                                             key={idx}
                                                             onClick={() => setOrderForm({ ...orderForm, address: `${addr.houseNo}, ${addr.area}, ${addr.city}, ${addr.state} - ${addr.pincode}` })}
                                                             className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${orderForm.address.includes(addr.houseNo) ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200 hover:text-indigo-600'}`}
                                                         >
                                                             VAULT 0{idx + 1}
                                                         </button>
                                                     ))}
                                                 </div>
                                             )}
                                            <textarea 
                                                value={orderForm.address} 
                                                onChange={e => setOrderForm({...orderForm, address: e.target.value})} 
                                                className="w-full h-32 bg-gray-50 border-transparent rounded-[32px] px-8 py-6 font-black text-sm focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 focus:border-indigo-100 transition-all resize-none" 
                                                placeholder="Complete logistical coordinates..."
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Batch Size</label>
                                                {pricing.bulkApplied && (
                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">Wholesale Active</span>
                                                )}
                                            </div>
                                            <input type="number" min="1" value={orderForm.quantity} onChange={e => setOrderForm({...orderForm, quantity: e.target.value})} className="w-full h-16 bg-gray-50 border-transparent rounded-[24px] px-8 font-black text-sm focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 focus:border-indigo-100 transition-all text-center"/>
                                        </div>
                                        <div className="flex flex-col justify-end">
                                            <div className="flex justify-between items-center mb-6 px-4">
                                                <div className="flex flex-col">
                                                     <span className="text-[10px] font-black text-gray-400 uppercase">Unit Price</span>
                                                     <span className="text-lg font-black text-gray-900 tracking-tighter">₹{pricing.unitPrice.toLocaleString()}</span>
                                                </div>
                                                <div className="text-right flex flex-col">
                                                     <span className="text-[10px] font-black text-gray-400 uppercase">Total Estimate</span>
                                                     <span className="text-2xl font-black text-indigo-600 tracking-tighter">₹{pricing.totalPrice.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <button 
                                                    onClick={() => handleFinalSubmit('cart')} 
                                                    disabled={isSubmitting} 
                                                    className="w-full h-16 bg-white border-2 border-indigo-100 text-indigo-600 rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] shadow-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                                                >
                                                    {isSubmitting ? 'Syncing...' : 'Add to Cart Archive'}
                                                </button>
                                                <button 
                                                    onClick={() => handleFinalSubmit('checkout')} 
                                                    disabled={isSubmitting} 
                                                    className="w-full h-20 bg-indigo-600 text-white rounded-[32px] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                                                >
                                                    {isSubmitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <>Buy Now & Checkout <CreditCard size={18} /></>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-10 animate-in zoom-in-95 duration-700">
                                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[32px] flex items-center justify-center shadow-xl shadow-emerald-50">
                                        <FiCheckCircle size={48} />
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Request Registered</h2>
                                        <p className="text-sm font-bold text-gray-400 mt-4 max-w-sm mx-auto">Asset ID: {orderSuccess.data?._id?.toUpperCase()} has been captured. Our production unit will initiate contact shortly.</p>
                                    </div>
                                    <button onClick={() => navigate('/dashboard')} className="px-12 py-5 bg-gray-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-600 shadow-2xl transition-all">
                                        View Commission Hub
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDesign;

