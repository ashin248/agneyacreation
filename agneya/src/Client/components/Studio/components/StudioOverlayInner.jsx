import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { 
    FiX,
    FiShoppingCart, FiArrowRight, FiArrowUp
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { TWOD_TEMPLATES } from '../../TwoD/TwoDTemplateLibrary';
import { useStudio } from '../context/StudioContextInstance';
import TopNavigation from './TopNavigation';
import CheckoutPanel from './CheckoutPanel';
import ToolSidebar from './ToolSidebar';
import PropertyDock from './PropertyDock';
import ToolModals from './ToolModals';
const Workspace3D = React.lazy(() => import('./Workspace3D'));
const Workspace2D = React.lazy(() => import('./Workspace2D'));
import CropModal from './CropModal';

export default function StudioOverlayInner({ isOpen, onClose, requireLogin, initialMode = 'self', activeTemplateId = null, initial2DModelIdx = 0 }) {
    const { userData } = useAuth();
    const { addToCart } = useCart();
    const navigate = useNavigate();

    const {
        product,
        activeStudioTab, setActiveStudioTab,
        designMode, setDesignMode,
        activeTab, setActiveTab,
        isMobileUiMinimized, setIsMobileUiMinimized,
        activeObject, setActiveObject,
        canvasObjects, setCanvasObjects,
        historyStep, setHistoryStep,
        twoDModels, active2DModelIdx, setActive2DModelIdx,
        activeSupportSide, setActiveSupportSide,
        viewSide, setViewSide,
        current2DImageUrl,
        isSubmitting, setIsSubmitting
    } = useStudio();

    const [companyInstructions, setCompanyInstructions] = useState('');
    const [companyReferences, setCompanyReferences] = useState([]);
    const activeTemplate = React.useMemo(() => {
        if (!activeTemplateId) return null;
        return TWOD_TEMPLATES[activeTemplateId] || Object.values(TWOD_TEMPLATES).find(t => t.id?.toUpperCase() === activeTemplateId?.toUpperCase()) || null;
    }, [activeTemplateId]);
    const [contextKey, setContextKey] = useState(0);

    const [brushSize, setBrushSize] = useState(10);
    const [brushColor, setBrushColor] = useState('#0c0c2a');
    const [isRemovingBg, setIsRemovingBg] = useState(false);

    const [variations, setVariations] = useState([{
        id: Date.now(), name: 'Item 1',
        frontCanvasData: null, frontCanvasObjects: [], frontAnchors: {},
        backCanvasData: null, backCanvasObjects: [], backAnchors: {}
    }]);
    const [activeVariationId, setActiveVariationId] = useState(variations[0].id);

    const historyRef = useRef([]);
    const isHistoryRecording = useRef(false);

    const [objectAnchors, setObjectAnchors] = useState({});
    const [pendingAnchor, setPendingAnchor] = useState(null); 
    const [uploadedAssets, setUploadedAssets] = useState([]);

    const workspace2DRef = useRef(null);
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const fileRef = useRef(null);
    const viewportRef = useRef(null);
    const resizeRef = useRef(null);
    const [cropModalData, setCropModalData] = useState(null);

    const premiumFonts = [
        'Inter', 'Montserrat', 'Bebas Neue', 'Playfair Display', 'Pacifico', 'Oswald', 'Dancing Script', 'Righteous',
        'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Raleway', 'Ubuntu', 'Merriweather', 'Lora',
        'Abel', 'Anton', 'Archivo', 'Arvo', 'Asap', 'Cabin', 'Cairo', 'Cinzel',
        'Comfortaa', 'Exo 2', 'Fira Sans', 'Inconsolata', 'Josefin Sans', 'Kanit'
    ];
    const stickerLibrary = [
        { id: 'badge_1', name: 'Premium Shield', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>' },
        { id: 'star_1', name: 'Glory Star', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>' },
        { id: 'logo_agneya', name: 'Agneya Emblem', svg: '<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="40" stroke-width="8"/><path d="M30 50 L50 30 L70 50 L50 70 Z"/></svg>' },
        { id: 's1', name: 'Circle', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>' },
        { id: 's2', name: 'Square', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>' },
        { id: 's3', name: 'Heart', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' },
        { id: 's4', name: 'Cloud', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 19c-3.037 0-5.5-2.463-5.5-5.5 0-2.43 1.57-4.487 3.733-5.193C15.91 7.424 16 6.55 16 6.5c0-2.485-2.015-4.5-4.5-4.5S7 4.015 7 6.5c0 .351.026.69.076 1.018C5.464 8.243 4.5 9.756 4.5 11.5c0 1.933 1.567 3.5 3.5 3.5.114 0 .225-.005.335-.015C8.905 16.78 11.022 18.5 13.5 18.5c1.171 0 2.257-.384 3.132-1.033C17.062 18.428 17.275 19 17.5 19z"/></svg>' },
        { id: 's5', name: 'Check', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' },
        { id: 's6', name: 'Flame', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/></svg>' },
        { id: 's7', name: 'Zap', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>' },
        { id: 's8', name: 'Moon', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' },
        { id: 's9', name: 'Sun', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM2 13h2v-2H2v2zm18 0h2v-2h-2v2zM11 2v2h2V2h-2zm0 18v2h2v-2h-2zM5.99 4.58L4.58 5.99l1.41 1.41 1.41-1.41-1.41-1.41zm12.02 12.02l-1.41-1.41-1.41 1.41 1.41 1.41 1.41-1.41zM5.99 19.42l1.41-1.41-1.41-1.41-1.41 1.41 1.41 1.41zm12.02-14.84l-1.41 1.41 1.41 1.41 1.41-1.41-1.41-1.41z"/></svg>' },
        { id: 's10', name: 'Bell', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 16v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>' },
        { id: 's11', name: 'Globe', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7 6h-3c-.1-1.57-.47-3.04-1.12-4.38a8.03 8.03 0 0 1 4.12 4.38zm-1.89 8a8.04 8.04 0 0 1-4.11 4.38c.65-1.34 1.02-2.81 1.11-4.38h3zm-5.11 4.38c-.76-1.33-1.19-2.79-1.29-4.38H7.3c.12 1.59.55 3.05 1.3 4.38a8.1 8.1 0 0 0 9.4 0zm-1.29-6.38h-4.38a16.8 16.8 0 0 1 0-4h4.38a16.8 16.8 0 0 1 0 4z"/></svg>' },
        { id: 's12', name: 'Flag', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>' },
        { id: 's13', name: 'Anchor', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 4c2.2 0 4-1.8 4-4S14.2-2 12-2 8-.2 8 2s1.8 4 4 4zM12 22C6.48 22 2 17.52 2 12h2c0 4.41 3.59 8 8 8s8-3.59 8-8h2c0 5.52-4.48 10-10 10z"/></svg>' },
        { id: 's14', name: 'Trophy', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1c2.45-.19 4.44-1.92 4.92-4.14C20.4 10.45 22 8.42 22 6V5c0-1.1-.9-2-2-2z"/></svg>' },
        { id: 's15', name: 'Cake', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 6a2 2 0 0 0 2-2c0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm7 11v-5l-7-4-7 4v5c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2z"/></svg>' },
        { id: 's16', name: 'Apple', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm6 16.5c0 1.93-1.57 3.5-3.5 3.5-.83 0-1.59-.29-2.19-.77-.55.45-1.25.77-2.03.77-1.93 0-3.5-1.57-3.5-3.5 0-.96.39-1.82 1.02-2.45C6.18 15.42 5 13.85 5 12c0-3.87 3.13-7 7-7s7 3.13 7 7c0 1.85-1.18 3.42-2.82 4.05.63.63 1.02 1.49 1.02 2.45z"/></svg>' },
        { id: 's17', name: 'Coffee', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 3H6c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-12 2h11v14h-11V5zm12 11V8h2v8h-2z"/></svg>' },
        { id: 's18', name: 'Rocket', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5s-2.5 4.5-2.5 8h5c0-3.5-2.5-8-2.5-8zM7 12c0 2.76 2.24 5 5 5s5-2.24 5-5H7zm5 7c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>' },
        { id: 's19', name: 'Plane', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l7 2.5z"/></svg>' },
        { id: 's20', name: 'Briefcase', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-8-2h4v2h-4V4z"/></svg>' },
        { id: 's21', name: 'Camera', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06z"/></svg>' },
        { id: 's22', name: 'Music', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>' },
        { id: 's23', name: 'Gift', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.65-.5-.65C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h16v6z"/></svg>' },
        { id: 's24', name: 'Diamond', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.16 3h-.32L3 12l9 9 9-9-8.84-9zM12 18.5L5.5 12 12 5.5l6.5 6.5-6.5 6.5z"/></svg>' },
        { id: 's25', name: 'Key', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>' },
        { id: 's26', name: 'Home', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>' },
        { id: 's27', name: 'Lock', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"/></svg>' },
        { id: 's28', name: 'Power', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 2.03v2.02c2.81.91 5 3.52 5 6.61a7.99 7.99 0 0 1-15.34 3.08l-2.02-.38A9.99 9.99 0 0 0 12 22a10 10 0 0 0 10-10 10 10 0 0 0-6-9.97zM12 2v10h2V2h-2z"/></svg>' },
        { id: 's29', name: 'Leaf', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 1.38c-3.1 0-6 2.1-7 5-1.1 3-1 6 1 8 0 0 0 0-1 1-1 1-2 2-3 3l2 2s2-1 3-2l1-1c2 2 5 2.1 8 1 3-1.1 5-4 5-7.1 0-4.82-3.88-8.9-9-8.9z"/></svg>' },
        { id: 's30', name: 'Drop', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2S6 10 6 14.5A6 6 0 0 0 18 14.5C18 10 12 2 12 2z"/></svg>' }
    ];

    const handleAnchorUpdate = useCallback((anchorData) => {
        const activeItem = fabricRef.current?.getActiveObject();
        if (activeItem) {
            setObjectAnchors(prev => ({ ...prev, [activeItem.uid]: anchorData }));
            setPendingAnchor(null); 
        } else {
            setPendingAnchor(anchorData); 
            toast.success("Frame Target Selected", { icon: '🎯', style: { borderRadius: '15px', background: 'linear-gradient(135deg, #F7941D, #7B1760)', color: '#fff', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' } });
        }
    }, []);

    const fastSync = useCallback(() => {
        workspace2DRef.current?.fastSync();
    }, []);

    const updateTexture = useCallback((isFullUpdate = true) => {
        workspace2DRef.current?.updateTexture(isFullUpdate);
    }, []);

    const enforceLayering = useCallback(() => {
        workspace2DRef.current?.enforceLayering();
    }, []);


    const [tabStates, setTabStates] = useState({
        '3D_STUDIO': { canvasData: null, canvasObjects: [], anchors: {} },
        '2D_STUDIO': { canvasData: null, canvasObjects: [], anchors: {} },
        'DESIGN_ASSISTANCE': { canvasData: null, canvasObjects: [], anchors: {} }
    });

    const lastOpenedProductId = useRef(null);
    const lastActiveTab = useRef(null);

    // Save current state before switching
    const saveTabState = useCallback(() => {
        if (!fabricRef.current || !lastActiveTab.current) return;
        const currentTab = lastActiveTab.current;
        const data = fabricRef.current.toJSON(['uid', 'id', 'excludeFromExport', 'isPhoto', 'isSlot', 'slotId', 'selectable', 'evented']);
        setTabStates(prev => ({
            ...prev,
            [currentTab]: {
                canvasData: data,
                canvasObjects: [...canvasObjects],
                anchors: { ...objectAnchors }
            }
        }));
    }, [canvasObjects, objectAnchors]);

    useEffect(() => {
        const resetStudio = () => {
            setCanvasObjects([]);
            setUploadedAssets([]);
            setObjectAnchors({});
            setPendingAnchor(null);
            historyRef.current = [];
            setHistoryStep(-1);
            setActiveObject(null);
            setTabStates({
                '3D_STUDIO': { canvasData: null, canvasObjects: [], anchors: {} },
                '2D_STUDIO': { canvasData: null, canvasObjects: [], anchors: {} },
                'DESIGN_ASSISTANCE': { canvasData: null, canvasObjects: [], anchors: {} }
            });
            setCompanyInstructions('');
            setCompanyReferences([]);
            if (fabricRef.current) {
                fabricRef.current.clear();
                fabricRef.current.backgroundColor = 'transparent';
                fabricRef.current.renderAll();
            }
        };

        if (isOpen && lastOpenedProductId.current !== product?._id) {
            lastOpenedProductId.current = product?._id;
            resetStudio();
            let initialTab = '2D_STUDIO';
            if (initialMode === '2d' || activeTemplateId) {
                initialTab = '2D_STUDIO';
            } else if (initialMode === 'company') {
                initialTab = 'DESIGN_ASSISTANCE';
            } else if (initialMode === '3d') {
                initialTab = '3D_STUDIO';
            } else if (product?.customizationType === '3D' || product?.baseModelId || product?.base3DModelUrl || product?.model3d || product?.customizationType === 'Both') {
                initialTab = '3D_STUDIO';
            }
            setActiveStudioTab(initialTab);
            lastActiveTab.current = initialTab;
        } else if (!isOpen) {
            lastOpenedProductId.current = null;
            resetStudio(); 
        }
    }, [product?._id, isOpen, activeTemplateId, initialMode, setActiveStudioTab, setCanvasObjects, setActiveObject, setHistoryStep, product?.customizationType, product?.baseModelId, product?.base3DModelUrl, product?.model3d]);

    // Handle Tab Switching with State Isolation
    const handleTabSwitch = (newTab) => {
        if (newTab === activeStudioTab) return;
        
        // 1. Save current state
        if (fabricRef.current) {
            const data = fabricRef.current.toJSON(['uid', 'id', 'excludeFromExport', 'isPhoto', 'isSlot', 'slotId', 'selectable', 'evented']);
            const currentTab = activeStudioTab;
            
            setTabStates(prev => {
                const newState = {
                    ...prev,
                    [currentTab]: {
                        canvasData: data,
                        canvasObjects: [...canvasObjects],
                        anchors: { ...objectAnchors }
                    }
                };

                // 2. Load target state
                const targetState = newState[newTab];
                if (targetState && targetState.canvasData) {
                    fabricRef.current.loadFromJSON(targetState.canvasData).then(() => {
                        fabricRef.current.renderAll();
                        setCanvasObjects(targetState.canvasObjects || []);
                        setObjectAnchors(targetState.anchors || {});
                        updateTexture(true);
                        historyRef.current = [];
                        setHistoryStep(-1);
                    });
                } else {
                    fabricRef.current.clear();
                    setCanvasObjects([]);
                    setObjectAnchors({});
                    updateTexture(true);
                    historyRef.current = [];
                    setHistoryStep(-1);
                }
                
                return newState;
            });
        }
        
        setActiveStudioTab(newTab);
        lastActiveTab.current = newTab;
        setActiveObject(null);
    };

    useEffect(() => {
        const handleOpenCropper = (e) => {
            setCropModalData(e.detail);
        };
        window.addEventListener('OPEN_CROPPER', handleOpenCropper);
        return () => window.removeEventListener('OPEN_CROPPER', handleOpenCropper);
    }, []);

    const handleCropComplete = async (croppedImage) => {
        if (!cropModalData || !fabricRef.current) return;
        const canvas = fabricRef.current;
        const active = canvas.getObjects().find(o => o.uid === cropModalData.uid);
        
        if (active) {
            const imgElement = new Image();
            imgElement.crossOrigin = 'anonymous';
            imgElement.onload = () => {
                const ImgClass = fabric.FabricImage || fabric.Image;
                const newImg = new ImgClass(imgElement, {
                    left: active.left,
                    top: active.top,
                    scaleX: active.scaleX,
                    scaleY: active.scaleY,
                    angle: active.angle,
                    opacity: active.opacity,
                    uid: active.uid,
                    isPhoto: active.isPhoto,
                    isSlot: active.isSlot,
                    slotId: active.slotId,
                    clipPath: active.clipPath,
                    bringToFront: active.bringToFront
                });
                
                canvas.remove(active);
                canvas.add(newImg);
                canvas.setActiveObject(newImg);
                canvas.renderAll();
                updateTexture(true);
                setCropModalData(null);
            };
            imgElement.src = croppedImage;
        }
    };

    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        canvas.isDrawingMode = isDrawing;
        if (canvas.isDrawingMode) {
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.width = brushSize;
            canvas.freeDrawingBrush.color = brushColor;
        }
    }, [isDrawing, brushSize, brushColor]);

    const handleUndo = () => { if (historyStep > 0) setHistoryStep(historyStep - 1); };
    const handleRedo = () => { if (historyStep < historyRef.current.length - 1) setHistoryStep(historyStep + 1); };

    const saveCurrentToVariation = useCallback(() => {
        if (!fabricRef.current) return;
        const currentData = fabricRef.current.toJSON(['uid', 'id', 'excludeFromExport', 'isPhoto', 'isSlot', 'slotId', 'selectable', 'evented']);
        const snapshot = fabricRef.current.toDataURL({ format: 'png', quality: 0.5, multiplier: 0.5 });
        setVariations(prev => prev.map(v => v.id === activeVariationId ? {
            ...v,
            [`${viewSide}CanvasData`]: currentData,
            [`${viewSide}CanvasObjects`]: [...canvasObjects],
            [`${viewSide}Anchors`]: { ...objectAnchors },
            [`${viewSide}Snapshot`]: snapshot
        } : v));
    }, [activeVariationId, canvasObjects, objectAnchors, viewSide]);

    const switchVariation = (id) => {
        if (id === activeVariationId) return;
        saveCurrentToVariation();
        const target = variations.find(v => v.id === id);
        setActiveVariationId(id);
        const savedData = target[`${viewSide}CanvasData`];
        if (savedData) {
            fabricRef.current.loadFromJSON(savedData).then(() => {
                fabricRef.current.renderAll();
                setCanvasObjects(target[`${viewSide}CanvasObjects`] || []);
                setObjectAnchors(target[`${viewSide}Anchors`] || {});
                updateTexture(true);
            });
        } else {
            fabricRef.current.clear();
            setCanvasObjects([]);
            setObjectAnchors({});
            updateTexture(true);
        }
    };

    const handleAddPage = () => {
        saveCurrentToVariation();
        const newId = Date.now();
        const newVariation = {
            id: newId, name: `Page ${variations.length + 1}`,
            frontCanvasData: null, frontCanvasObjects: [], frontAnchors: {},
            backCanvasData: null, backCanvasObjects: [], backAnchors: {}
        };
        setVariations(prev => [...prev, newVariation]);
        setActiveVariationId(newId);
        if (fabricRef.current) {
            fabricRef.current.clear();
            setCanvasObjects([]);
            setObjectAnchors({});
            updateTexture(true);
        }
        toast.success(`Page ${variations.length + 1} Added`, { style: { borderRadius: '15px', background: 'var(--color-neu-bg)', color: 'var(--color-neu-text)' } });
    };

    const handleSwitchSide = (side) => {
        if (side === viewSide) return;
        if (fabricRef.current) {
            const currentData = fabricRef.current.toJSON(['uid', 'id', 'excludeFromExport', 'isPhoto', 'isSlot', 'slotId', 'selectable', 'evented']);
            const snapshot = fabricRef.current.toDataURL({ format: 'png', quality: 0.5, multiplier: 0.5 });
            setVariations(prev => {
                const updatedVars = prev.map(v => v.id === activeVariationId ? {
                    ...v,
                    [`${viewSide}CanvasData`]: currentData,
                    [`${viewSide}CanvasObjects`]: [...canvasObjects],
                    [`${viewSide}Anchors`]: { ...objectAnchors },
                    [`${viewSide}Snapshot`]: snapshot
                } : v);
                const target = updatedVars.find(v => v.id === activeVariationId);
                const targetData = target[`${side}CanvasData`];
                setTimeout(() => {
                    setViewSide(side);
                    if (targetData && fabricRef.current) {
                        fabricRef.current.loadFromJSON(targetData).then(() => {
                            fabricRef.current.renderAll();
                            setCanvasObjects(target[`${side}CanvasObjects`] || []);
                            setObjectAnchors(target[`${side}Anchors`] || {});
                            updateTexture(true);
                            historyRef.current = [];
                            setHistoryStep(-1);
                        });
                    } else if (fabricRef.current) {
                        fabricRef.current.clear();
                        setCanvasObjects([]);
                        setObjectAnchors({});
                        updateTexture(true);
                        historyRef.current = [];
                        setHistoryStep(-1);
                    }
                }, 0);
                return updatedVars;
            });
        } else {
            setViewSide(side);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            setUploadedAssets(prev => [{ id: Date.now(), url: dataUrl }, ...prev]);
            const imgElement = new Image();
            imgElement.crossOrigin = 'anonymous';
            imgElement.onload = () => {
                try {
                    const canvas = fabricRef.current;
                    if (!canvas) return;
                    const ImgClass = fabric.FabricImage || fabric.Image;
                    const img = new ImgClass(imgElement, {
                        width: imgElement.naturalWidth || imgElement.width || 100,
                        height: imgElement.naturalHeight || imgElement.height || 100
                    });
                    const uid = `upload_${Date.now()}`;
                    const activeObj = canvas.getActiveObject();
                    if (activeObj && activeObj.isSlot) {
                        const slotX = activeObj.left;
                        const slotY = activeObj.top;
                        const slotW = activeObj.width;
                        const slotH = activeObj.height;
                        const scaleX = slotW / img.width;
                        const scaleY = slotH / img.height;
                        const fillScale = Math.max(scaleX, scaleY);
                        img.set({ left: slotX, top: slotY, scaleX: fillScale, scaleY: fillScale, uid, originX: 'left', originY: 'top' });
                        const isCircle = activeObj.rx > 0 && activeObj.width === activeObj.height;
                        const isHeart = activeObj.type === 'path';
                        let clipPath;
                        if (isHeart) {
                            const heartPath = `M 0 10 A 10 10 0 0 1 20 10 A 10 10 0 0 1 40 10 Q 40 25 20 40 Q 0 25 0 10 Z`;
                            clipPath = new fabric.Path(heartPath, { left: slotX, top: slotY, width: slotW, height: slotH, absolutePositioned: true });
                            const sX = slotW / clipPath.width;
                            const sY = slotH / clipPath.height;
                            clipPath.set({ scaleX: sX, scaleY: sY });
                        } else {
                            clipPath = new fabric.Rect({ left: slotX, top: slotY, width: slotW, height: slotH, rx: activeObj.rx || 0, ry: activeObj.ry || 0, absolutePositioned: true });
                        }
                        img.set({ clipPath, stroke: '#000000', strokeWidth: 2, strokeUniform: true, isPhoto: true });
                        const targetSlotId = activeObj.slotId;
                        const objectsToRemove = canvas.getObjects().filter(o => (o.isSlot && o.slotId === targetSlotId) || (o.isSlotLabel && o.slotId === targetSlotId));
                        objectsToRemove.forEach(o => canvas.remove(o));
                    } else {
                        const targetWidth = canvas.width ? canvas.width * 0.4 : 200;
                        img.scaleToWidth(targetWidth);
                        img.set({ originX: 'center', originY: 'center', left: canvas.width / 2, top: canvas.height / 2, uid });
                        if (product?.canvasConfig) {
                            const cw = product.canvasConfig.width || 500;
                            const ch = product.canvasConfig.height || 600;
                            const cx = canvas.width / 2 + (product.canvasConfig.offsetX || 0);
                            const cy = canvas.height / 2 + (product.canvasConfig.offsetY || 0);
                            const clipPath = new fabric.Rect({ left: cx, top: cy, width: cw, height: ch, originX: 'center', originY: 'center', absolutePositioned: true });
                            img.set({ clipPath });
                        }
                    }
                    if (pendingAnchor) { setObjectAnchors(prev => ({ ...prev, [uid]: pendingAnchor })); setPendingAnchor(null); }
                    canvas.add(img); canvas.setActiveObject(img); enforceLayering(); canvas.renderAll(); updateTexture(true);
                } catch (err) { console.error("Fabric Upload Error:", err); }
            };
            imgElement.src = dataUrl;
        };
        reader.readAsDataURL(file);
    };

    const addText = (preset = 'body') => {
        const uid = `text_${Date.now()}`;
        const itext = new fabric.IText(preset === 'heading' ? 'BRAND_ID' : 'Double click', {
            left: 250, top: 300, originX: 'center', originY: 'center',
            fontSize: preset === 'heading' ? 40 : 16, fontWeight: preset === 'heading' ? '900' : '500',
            fill: brushColor, fontFamily: 'Inter', uid
        });
        if (pendingAnchor) { setObjectAnchors(prev => ({ ...prev, [uid]: pendingAnchor })); setPendingAnchor(null); }
        fabricRef.current.add(itext); fabricRef.current.setActiveObject(itext); enforceLayering(); fabricRef.current.renderAll(); updateTexture();
    };

    const addSticker = async (svgString) => {
        const { objects, options } = await fabric.loadSVGFromString(svgString);
        const obj = fabric.util.groupSVGElements(objects, options);
        const uid = `sticker_${Date.now()}`;
        obj.set({ left: 250, top: 300, originX: 'center', originY: 'center', fill: brushColor, uid });
        obj.scaleToWidth(150);
        if (pendingAnchor) { setObjectAnchors(prev => ({ ...prev, [uid]: pendingAnchor })); setPendingAnchor(null); }
        fabricRef.current.add(obj); fabricRef.current.setActiveObject(obj); enforceLayering(); fabricRef.current.renderAll(); updateTexture();
    };

    const handleRemoveBg = async () => {
        const activeObj = fabricRef.current?.getActiveObject();
        if (!activeObj) return toast.error("Select image target.");
        setIsRemovingBg(true);
        try {
            const blob = await (await fetch(activeObj.toDataURL())).blob();
            const fd = new FormData(); fd.append('image', blob, 'design.png');
            const res = await axios.post('/api/public/remove-bg', fd, { responseType: 'arraybuffer' });
            const imgElement = new Image();
            const url = URL.createObjectURL(new Blob([res.data]));
            imgElement.onload = () => {
                const img = new fabric.FabricImage(imgElement, { width: imgElement.naturalWidth || imgElement.width, height: imgElement.naturalHeight || imgElement.height });
                img.set({ left: activeObj.left, top: activeObj.top, scaleX: activeObj.scaleX, scaleY: activeObj.scaleY, angle: activeObj.angle, uid: `ai_${Date.now()}` });
                fabricRef.current.remove(activeObj); fabricRef.current.add(img); fabricRef.current.setActiveObject(img); fabricRef.current.renderAll(); updateTexture();
            };
            imgElement.src = url;
        } catch (e) { toast.error("AI Sync Error."); } finally { setIsRemovingBg(false); }
    };

    const handleDiscardDraft = () => {
        if (fabricRef.current) { fabricRef.current.getObjects().filter(o => !o.excludeFromExport).forEach(o => fabricRef.current.remove(o)); fabricRef.current.clear(); fabricRef.current.backgroundColor = 'transparent'; fabricRef.current.renderAll(); }
        setCanvasObjects([]); setObjectAnchors({}); toast.success("Design Cleared.");
    };

    const handlePurgeGallery = () => { setUploadedAssets([]); toast.success("Gallery Purged."); };

    const handleFinalSubmit = async (isBuyNow = false) => {
        if (!userData) return requireLogin(() => handleFinalSubmit(isBuyNow), "finalize your order");
        const isCompanyMode = activeStudioTab === 'DESIGN_ASSISTANCE';
        if (isCompanyMode && !companyInstructions.trim() && companyReferences.length === 0) return toast.error("Please provide instructions or reference images.");
        setIsSubmitting(true);
        saveCurrentToVariation();
        try {
            const allItems = variations.map(v => {
                const isCurrent = v.id === activeVariationId && fabricRef.current;
                
                // Get snapshots - use live canvas for current view, otherwise use stored snapshots
                const frontSnap = (isCurrent && viewSide === 'front') 
                    ? fabricRef.current.toDataURL({ format: 'png', quality: 0.5, multiplier: 0.5 }) 
                    : v.frontSnapshot;
                const backSnap = (isCurrent && viewSide === 'back') 
                    ? fabricRef.current.toDataURL({ format: 'png', quality: 0.5, multiplier: 0.5 }) 
                    : v.backSnapshot;

                const frontData = isCurrent && viewSide === 'front' ? fabricRef.current.toJSON(['uid', 'id', 'excludeFromExport', 'isPhoto', 'isSlot', 'slotId', 'selectable', 'evented']) : v.frontCanvasData;
                const backData = isCurrent && viewSide === 'back' ? fabricRef.current.toJSON(['uid', 'id', 'excludeFromExport', 'isPhoto', 'isSlot', 'slotId', 'selectable', 'evented']) : v.backCanvasData;
                
                // Merge explicit references from Design Assistance with images uploaded to the Studio
                const combinedRefs = [
                    ...(companyReferences || []),
                    ...(uploadedAssets || [])
                ];

                const designPayload = { 
                    mode: 'unified', 
                    designSource: activeStudioTab,
                    frontCanvasData: frontData, 
                    backCanvasData: backData,
                    instructions: companyInstructions,
                    manualAttachments: combinedRefs.map(r => typeof r === 'string' ? r : r.url)
                };

                const wMin = (product?.isBulkEnabled && product?.bulkRules?.length > 0) ? Math.min(...product.bulkRules.map(r => r.minQty)) : (product?.minOrder || 1);
                const itemQty = isBuyNow ? 1 : wMin;

                return {
                    productId: product?._id,
                    name: `[Custom] ${product?.name} - ${v.name}`,
                    unitPrice: product?.discountPrice || product?.basePrice,
                    quantity: itemQty,
                    itemType: 'Custom',
                    selectedVariation: { sku: `custom_${v.id}`, size: 'Custom' },
                    image: frontSnap || backSnap || product?.thumbnail || product?.images?.[0],
                    designImage: frontSnap || backSnap || product?.thumbnail || product?.images?.[0],
                    isBulkEnabled: product?.isBulkEnabled,
                    bulkRules: product?.bulkRules,
                    gstRate: product?.gstRate || 0,
                    customData: { 
                        ...designPayload,
                        variationName: v.name, 
                        appliedFrontDesign: frontSnap, 
                        appliedBackDesign: backSnap 
                    }
                };
            });
            if (isBuyNow) { navigate('/checkout', { state: { buyNowItems: allItems } }); } else { for (const item of allItems) { await addToCart(item); } toast.success(`${allItems.length} Designs Synced.`); onClose(); navigate('/cart'); }
        } catch (e) { toast.error("Execution Failure."); } finally { setIsSubmitting(false); }
    };

    const removeAsset = (id) => { setUploadedAssets(prev => prev.filter(a => a.id !== id)); toast.success("Asset Purged."); };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1000] flex flex-col transition-all duration-500 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)', backgroundColor: 'var(--color-neu-bg)' }}>
            <style>{`
                input[type=range] { -webkit-appearance: none; background: rgba(0,0,0,0.05); height: 6px; border-radius: 3px; }
                input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: var(--color-neu-accent); border-radius: 50%; border: 3px solid var(--color-neu-bg); box-shadow: 3px 3px 6px rgba(0,0,0,0.1), -3px -3px 6px rgba(255,255,255,0.8); cursor: pointer; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-neu-dark); border-radius: 10px; }
            `}</style>

            <header className="h-16 md:h-20 shrink-0 px-4 sm:px-10 flex items-center justify-between z-[100] border-b" style={{ backgroundColor: 'var(--color-neu-bg)', borderColor: 'var(--color-neu-dark)' }}>
                <button onClick={onClose} className="w-12 h-12 rounded-full neu-button flex items-center justify-center transition-all active:scale-90" style={{ color: 'var(--color-neu-text)' }}><FiX size={24} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-sm sm:text-xl font-bold tracking-tight truncate max-w-[150px] sm:max-w-none" style={{ color: 'var(--color-neu-text)' }}>{product?.name || 'Agneya Design'}</h1>
                    <div className="flex neu-pressed p-1 rounded-full mt-2">
                        {(product?.customizationType === 'Both' || product?.customizationType === '3D') && (
                            <button onClick={() => handleTabSwitch('3D_STUDIO')} className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${activeStudioTab === '3D_STUDIO' ? 'neu-button-accent' : 'neu-button'}`} style={activeStudioTab !== '3D_STUDIO' ? { color: 'var(--color-neu-text)' } : {}}>3D STUDIO</button>
                        )}
                        <button onClick={() => handleTabSwitch('DESIGN_ASSISTANCE')} className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${activeStudioTab === 'DESIGN_ASSISTANCE' || product?.customizationType === 'None' ? 'neu-button-accent' : 'neu-button'}`} style={activeStudioTab !== 'DESIGN_ASSISTANCE' && product?.customizationType !== 'None' ? { color: 'var(--color-neu-text)' } : {}}>DESIGN ASSISTANCE</button>
                        {(product?.customizationType === 'Both' || product?.customizationType === '2D') && (
                            <button onClick={() => handleTabSwitch('2D_STUDIO')} className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${activeStudioTab === '2D_STUDIO' ? 'neu-button-accent' : 'neu-button'}`} style={activeStudioTab !== '2D_STUDIO' ? { color: 'var(--color-neu-text)' } : {}}>2D STUDIO</button>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-[1px] h-8 bg-slate-100 mx-2" />
                    <div className="w-[40px]"></div> 
                </div>
            </header>


            <main className="flex-1 relative flex flex-col xl:flex-row px-0 sm:px-10 pb-[100px] xl:pb-10 gap-0 sm:gap-8 min-h-0 min-w-0 overflow-hidden">
                {activeStudioTab !== 'DESIGN_ASSISTANCE' ? (
                    <>
                        <ToolSidebar 
                            addText={addText} 
                            handleFileUpload={handleFileUpload} 
                            isDrawing={isDrawing} 
                            setIsDrawing={setIsDrawing} 
                            fabricRef={fabricRef} 
                            brushColor={brushColor} 
                            setBrushColor={setBrushColor} 
                            updateTexture={updateTexture} 
                            fastSync={fastSync} 
                            premiumFonts={premiumFonts}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            activeObject={activeObject}
                            setActiveObject={setActiveObject}
                            canvasObjects={canvasObjects}
                            twoDModels={twoDModels}
                            active2DModelIdx={active2DModelIdx}
                            activeSupportSide={activeSupportSide}
                            handleSwitchSide={handleSwitchSide}
                        />
                        <div className="flex-1 flex flex-col relative h-full">
                            {isDrawing && (
                                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[200]">
                                    <button onClick={() => setIsDrawing(false)} className="px-8 h-12 neu-pressed text-rose-500 shadow-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 animate-bounce active:scale-95 transition-all">
                                        <FiX /> Exit Studio Ink
                                    </button>
                                </div>
                            )}
                            <div className={`flex-1 flex items-center justify-center relative transition-all duration-500 ease-out ${!isMobileUiMinimized && activeObject ? 'xl:translate-y-0 xl:scale-100 -translate-y-[15vh] scale-95' : 'translate-y-0 scale-100'}`}>
                                <div ref={viewportRef} id="studio-design-viewport" className="w-full h-full relative z-10 neu-pressed rounded-[40px] overflow-hidden">
                                    <React.Suspense fallback={<div className="absolute inset-0 flex items-center justify-center z-50"><div className="w-10 h-10 border-4 border-[var(--color-neu-accent)] border-t-transparent rounded-full animate-spin"></div></div>}>
                                        <Workspace2D 
                                            ref={workspace2DRef} 
                                            isOpen={isOpen} 
                                            canvasRef={canvasRef} 
                                            viewportRef={viewportRef} 
                                            fabricRef={fabricRef} 
                                            resizeRef={resizeRef} 
                                            historyRef={historyRef} 
                                            isHistoryRecording={isHistoryRecording} 
                                            product={product} 
                                            activeTemplateId={activeTemplateId} 
                                            initialMode={initialMode} 
                                            handleSwitchSide={handleSwitchSide}
                                            activeStudioTab={activeStudioTab}
                                            setActiveStudioTab={setActiveStudioTab}
                                            current2DImageUrl={current2DImageUrl}
                                            viewSide={viewSide}
                                            setActiveObject={setActiveObject}
                                            setCanvasObjects={setCanvasObjects}
                                            canvasObjects={canvasObjects}
                                            historyStep={historyStep}
                                            setHistoryStep={setHistoryStep}
                                            setIsMobileUiMinimized={setIsMobileUiMinimized}
                                            twoDModels={twoDModels}
                                            active2DModelIdx={active2DModelIdx}
                                            activeSupportSide={activeSupportSide}
                                            setActiveSupportSide={setActiveSupportSide}
                                            handleAddPage={handleAddPage}
                                            variations={variations}
                                            activeVariationId={activeVariationId}
                                            switchVariation={switchVariation}
                                        />
                                        <Workspace3D 
                                            product={product} 
                                            objectAnchors={objectAnchors} 
                                            handleAnchorUpdate={handleAnchorUpdate} 
                                            contextKey={contextKey} 
                                            setContextKey={setContextKey} 
                                            fabricRef={fabricRef} 
                                            updateTexture={updateTexture} 
                                            activeStudioTab={activeStudioTab}
                                            activeObject={activeObject}
                                            canvasObjects={canvasObjects}
                                        />
                                    </React.Suspense>
                                </div>
                            </div>
                            <TopNavigation 
                                handleUndo={handleUndo} 
                                handleRedo={handleRedo} 
                                canUndo={historyStep > 0} 
                                canRedo={historyStep < historyRef.current.length - 1} 
                                handleSwitchSide={handleSwitchSide}
                                twoDModels={twoDModels}
                                active2DModelIdx={active2DModelIdx}
                                activeSupportSide={activeSupportSide}
                                setActiveSupportSide={setActiveSupportSide}
                            />
                            {activeStudioTab !== 'DESIGN_ASSISTANCE' && (
                                <div className="xl:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 neu-flat p-2 rounded-full shadow-2xl border border-[var(--color-neu-dark)] animate-in fade-in slide-in-from-bottom-4 pointer-events-auto" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                    <button onClick={() => handleFinalSubmit(true)} className="h-12 px-6 neu-button flex items-center gap-2 font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all" style={{ color: 'var(--color-neu-text)' }}>
                                        <FiArrowRight size={14} /> Buy Now
                                    </button>
                                    <button 
                                        onClick={() => handleFinalSubmit(false)} 
                                        disabled={isSubmitting} 
                                        className="h-12 px-6 neu-button-accent flex items-center gap-2 font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        <FiShoppingCart size={14} /> {isSubmitting ? 'Syncing...' : 'Add to Cart'}
                                    </button>
                                </div>
                            )}
                        </div>
                        <CheckoutPanel 
                            variations={variations} 
                            handleFinalSubmit={handleFinalSubmit} 
                            handleDiscardDraft={handleDiscardDraft}
                            product={product}
                            isSubmitting={isSubmitting}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col w-full h-full relative">
                        <div className="flex-1 overflow-y-auto px-4 sm:px-0 pb-[150px] pt-6 custom-scrollbar">
                            <div className="max-w-3xl mx-auto w-full neu-flat rounded-[40px] p-6 sm:p-10 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8">
                                <header className="space-y-2">
                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--color-neu-text)' }}>Design Assistance</h2>
                                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-relaxed opacity-70" style={{ color: 'var(--color-neu-text)' }}>Describe your vision. Our professional design team will craft a high-fidelity version for your approval.</p>
                                </header>
                                <div className="space-y-4">
                                    <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--color-neu-text)' }}>Project Brief & Instructions</label>
                                    <textarea value={companyInstructions} onChange={(e) => setCompanyInstructions(e.target.value)} placeholder="e.g., Use my logo on the center, add 'Agneya' in gold font below it. Keep the background minimal..." className="w-full h-32 sm:h-40 neu-input rounded-[24px] p-6 text-sm font-medium transition-all resize-none" style={{ color: 'var(--color-neu-text)' }} />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference Assets (Logos, Sketches, Inspiration)</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                        <div className="relative aspect-square neu-pressed border-2 border-dashed border-[var(--color-neu-dark)] rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[var(--color-neu-accent)] transition-all cursor-pointer group">
                                            <input type="file" multiple onChange={(e) => { const files = Array.from(e.target.files); files.forEach(file => { const reader = new FileReader(); reader.onload = (ev) => setCompanyReferences(prev => [...prev, { id: Date.now() + Math.random(), url: ev.target.result }]); reader.readAsDataURL(file); }); }} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <FiArrowUp size={20} className="opacity-30 group-hover:opacity-100 transition-all" style={{ color: 'var(--color-neu-text)' }} />
                                            <span className="text-[8px] font-black uppercase tracking-widest opacity-30" style={{ color: 'var(--color-neu-text)' }}>Upload Ref</span>
                                        </div>
                                        {companyReferences.map(ref => (
                                            <div key={ref.id} className="relative aspect-square neu-button rounded-2xl overflow-hidden group p-1">
                                                <img loading="lazy" src={ref.url} className="w-full h-full object-cover rounded-xl" alt="Reference" />
                                                <button onClick={() => setCompanyReferences(prev => prev.filter(r => r.id !== ref.id))} className="absolute top-2 right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><FiX size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={() => handleTabSwitch((product?.customizationType === 'Both' || product?.customizationType === '3D') ? '3D_STUDIO' : '2D_STUDIO')} className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors italic">Switch to Creator Mode</button>
                            </div>
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 neu-flat rounded-t-[40px] px-4 sm:px-10 py-4 z-50 flex items-center justify-between animate-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-3 sm:gap-6" style={{ color: 'var(--color-neu-text)' }}>
                                <div className="flex flex-col"><span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest opacity-70">Est. Base Price</span><span className="text-lg sm:text-xl font-black">₹ {(product?.discountPrice || product?.basePrice || 0).toLocaleString()}</span></div>
                                <div className="hidden sm:block w-[1px] h-8" style={{ backgroundColor: 'var(--color-neu-dark)' }} />
                                <span className="hidden sm:block text-[9px] font-bold uppercase tracking-widest opacity-70">Final pricing via design verification</span>
                            </div>
                            <button 
                                onClick={() => handleFinalSubmit(false)} 
                                disabled={isSubmitting} 
                                className="h-12 sm:h-14 px-6 sm:px-8 neu-button-accent font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 sm:gap-3 shrink-0"
                            >
                                {isSubmitting ? 'Syncing...' : <><FiShoppingCart size={16} /> Request Design</>}
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <PropertyDock 
                fabricRef={fabricRef} 
                brushColor={brushColor} 
                setBrushColor={setBrushColor} 
                updateTexture={updateTexture} 
                fastSync={fastSync} 
                isDrawing={isDrawing} 
                setIsDrawing={setIsDrawing}
                activeObject={activeObject}
                setActiveObject={setActiveObject}
                canvasObjects={canvasObjects}
                premiumFonts={premiumFonts}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                activeStudioTab={activeStudioTab}
                isMobileUiMinimized={isMobileUiMinimized}
                setIsMobileUiMinimized={setIsMobileUiMinimized}
                twoDModels={twoDModels}
            />
            <ToolModals 
                uploadedAssets={uploadedAssets} 
                handlePurgeGallery={handlePurgeGallery} 
                fileRef={fileRef} 
                handleFileUpload={handleFileUpload} 
                handleRemoveBg={handleRemoveBg} 
                isRemovingBg={isRemovingBg} 
                removeAsset={removeAsset} 
                fabricRef={fabricRef} 
                updateTexture={updateTexture} 
                brushSize={brushSize} 
                setBrushSize={setBrushSize} 
                brushColor={brushColor} 
                setBrushColor={setBrushColor} 
                setIsDrawing={setIsDrawing} 
                addText={addText} 
                stickerLibrary={stickerLibrary} 
                addSticker={addSticker}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setIsMobileUiMinimized={setIsMobileUiMinimized}
                canvasObjects={canvasObjects}
                activeObject={activeObject}
                setActiveObject={setActiveObject}
                twoDModels={twoDModels}
                active2DModelIdx={active2DModelIdx}
                activeSupportSide={activeSupportSide}
                setActiveSupportSide={setActiveSupportSide}
                handleSwitchSide={handleSwitchSide}
            />
            {cropModalData && (
                <CropModal 
                    image={cropModalData.image} 
                    onCropComplete={handleCropComplete} 
                    onClose={() => setCropModalData(null)} 
                />
            )}
        </div>
    );
}
 

