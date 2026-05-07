import React, { useEffect, useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import * as fabric from 'fabric';
import { phoneBrands } from '../../../data/MobileCasesDB';
import * as templateLib from '../../TwoD/TwoDTemplateLibrary';

const Workspace2D = forwardRef(({
    isOpen,
    canvasRef,
    viewportRef,
    fabricRef,
    resizeRef,
    historyRef,
    isHistoryRecording,
    product,
    activeTemplateId,
    initialMode,
    handleSwitchSide,
    activeStudioTab, setActiveStudioTab,
    current2DImageUrl, viewSide, 
    setActiveObject, setCanvasObjects, canvasObjects,
    historyStep, setHistoryStep, 
    setIsMobileUiMinimized,
    twoDModels, active2DModelIdx, activeSupportSide, setActiveSupportSide
}, ref) => {
    const historyStepRef = React.useRef(historyStep);
    useEffect(() => {
        historyStepRef.current = historyStep;
    }, [historyStep]);
    const lastSavedHistoryStep = React.useRef(-1);

    const [canvasScale, setCanvasScale] = useState(1);
    const [canvasIntrinsicDimensions, setCanvasIntrinsicDimensions] = useState(null);

    const effectiveMockupProfile = product?.mockupProfile;
    const effectiveCanvasConfig = product?.canvasConfig;
    const effectiveShapeConfig = product?.shapeConfig;

    const syncPositionalOffsets = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas || !canvas.contextContainer) return;
        const snapshots = canvas.getObjects().filter(o => !o.excludeFromExport).map(obj => ({
            uid: obj.uid,
            type: obj.type,
            isSlot: obj.isSlot,
            isPhoto: obj.isPhoto,
            isTemplateObject: obj.isSlot || obj.isPhoto,
            dataUrl: obj._cachedDataUrl || obj.toDataURL({ format: 'png', quality: 0.1 }), // Low-res fallback
            offsetX: ((obj.getCenterPoint ? obj.getCenterPoint().x : obj.left) - canvas.width / 2) / (canvas.width / 2),
            offsetY: ((obj.getCenterPoint ? obj.getCenterPoint().y : obj.top) - canvas.height / 2) / (canvas.height / 2),
            rotation: obj.angle || 0,
            scaleX: obj.scaleX || 1,
            scaleY: obj.scaleY || 1,
            width: obj.width,
            height: obj.height,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height
        }));
        setCanvasObjects(snapshots);
    }, [setCanvasObjects]);

    const fastSync = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas || !canvas.contextContainer) return;
        setCanvasObjects(prev => prev.map(snap => {
            const obj = canvas.getObjects().find(o => o.uid === snap.uid);
            if (!obj) return null;
            return {
                ...snap,
                offsetX: ((obj.getCenterPoint ? obj.getCenterPoint().x : obj.left) - canvas.width / 2) / (canvas.width / 2),
                offsetY: ((obj.getCenterPoint ? obj.getCenterPoint().y : obj.top) - canvas.height / 2) / (canvas.height / 2),
                rotation: obj.angle || 0,
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1
            };
        }).filter(Boolean));
    }, [setCanvasObjects]);

    const updateTexture = useCallback((isFullUpdate = true) => {
        const canvas = fabricRef.current;
        if (!canvas || !canvas.contextContainer) return;

        try {
            // Full update generates DataURLs, Fast sync only updates matrices
            const snapshots = canvas.getObjects().filter(o => !o.excludeFromExport).map(obj => {
                if (isFullUpdate || !obj._cachedDataUrl) {
                    // Reduced multiplier to 1.2 to balance quality and GPU memory
                    obj._cachedDataUrl = obj.toDataURL({ format: 'png', quality: 0.9, multiplier: 1.2 });
                }
                return {
                    uid: obj.uid,
                    type: obj.type,
                    isSlot: obj.isSlot,
                    isPhoto: obj.isPhoto,
                    isTemplateObject: obj.isSlot || obj.isPhoto,
                    dataUrl: obj._cachedDataUrl || obj.toDataURL({ format: 'png', quality: 0.1 }),
                    offsetX: ((obj.getCenterPoint ? obj.getCenterPoint().x : obj.left) - canvas.width / 2) / (canvas.width / 2),
                    offsetY: ((obj.getCenterPoint ? obj.getCenterPoint().y : obj.top) - canvas.height / 2) / (canvas.height / 2),
                    rotation: obj.angle || 0,
                    scaleX: obj.scaleX || 1,
                    scaleY: obj.scaleY || 1,
                    width: obj.width,
                    height: obj.height,
                    canvasWidth: canvas.width,
                    canvasHeight: canvas.height
                };
            });
            setCanvasObjects(snapshots);
        } catch (err) {
            console.warn("Studio Texture Update Failure:", err);
        }
    }, [setCanvasObjects]);

    const enforceLayering = useCallback(() => {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        const objects = canvas.getObjects();
        
        const photosBackground = [];
        const photosForeground = [];
        const models = [];
        const slots = [];
        const topLayers = [];

        objects.forEach(obj => {
            if (obj.id === '2d_model_mask') {
                models.push(obj);
            } else if (obj.isSlot) {
                slots.push(obj);
            } else if (obj.uid?.startsWith('upload_') || obj.uid?.startsWith('up_') || obj.type === 'image' || obj.type === 'FabricImage' || obj.isPhoto) {
                if (obj.bringToFront) {
                    photosForeground.push(obj);
                } else {
                    photosBackground.push(obj);
                }
            } else {
                topLayers.push(obj);
            }
        });

        // Hierarchy: Photos Background (Bottom) -> Slots -> Model Mask -> Photos Foreground -> Top Layers (Text/Stickers)
        const sortedObjects = [...photosBackground, ...slots, ...models, ...photosForeground, ...topLayers];
        
        // Re-order without breaking internal Fabric state
        sortedObjects.forEach((obj, idx) => {
            const currentIdx = canvas.getObjects().indexOf(obj);
            if (currentIdx !== -1 && currentIdx !== idx) {
                if (obj.moveTo) {
                    obj.moveTo(idx);
                } else {
                    canvas.moveObjectTo?.(obj, idx);
                }
            }
        });
        
        canvas.requestRenderAll();
    }, []);

    useEffect(() => {
        if (!isOpen || !canvasRef.current || !viewportRef.current) return;

        const baseWidth = product?.phoneMask ? 400 : (effectiveCanvasConfig?.width || 500);
        const baseHeight = product?.phoneMask ? 800 : (effectiveCanvasConfig?.height || 600);

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: baseWidth,
            height: baseHeight,
            backgroundColor: 'transparent',
            preserveObjectStacking: true
        });
        
        fabricRef.current = canvas;

        const handleResize = () => {
            if (!viewportRef.current || !fabricRef.current || fabricRef.current.disposed) return;
            const { clientWidth: width, clientHeight: height } = viewportRef.current;
            
            const currentWidth = fabricRef.current.width || baseWidth;
            const currentHeight = fabricRef.current.height || baseHeight;

            const scaleX = width / currentWidth;
            const scaleY = height / currentHeight;
            const newScale = Math.min(scaleX, scaleY, 1.2) * 0.95;

            setCanvasScale(newScale);

            if (product?.phoneMask) {
                fabricRef.current.setDimensions({
                    width: '100%',
                    height: '100%'
                }, { cssOnly: true });
            } else {
                fabricRef.current.setDimensions({
                    width: currentWidth * newScale,
                    height: currentHeight * newScale
                }, { cssOnly: true });
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            handleResize();
        });

        resizeObserver.observe(viewportRef.current);
        resizeRef.current = handleResize;

        const ObjectClass = fabric.FabricObject || fabric.Object;
        if (ObjectClass && ObjectClass.prototype) {
            ObjectClass.prototype.set({
                cornerColor: '#0c0c2a', cornerStrokeColor: '#ffffff', cornerStyle: 'circle',
                transparentCorners: false, cornerSize: 10, borderColor: '#0c0c2a', borderScaleFactor: 2, padding: 10
            });
        }

        const saveHistory = () => {
            if (isHistoryRecording.current) return;
            const json = canvas.toJSON(['uid', 'id', 'isPhoto', 'isSlot', 'slotId', 'excludeFromExport', 'selectable', 'evented']);
            
            // Prevent excluded items from bloating or duplicating in history
            json.objects = json.objects.filter(obj => !obj.excludeFromExport);
            
            const currentStep = historyStepRef.current;
            const newHistory = historyRef.current.slice(0, currentStep + 1);
            newHistory.push(json);
            historyRef.current = newHistory;
            const newStep = newHistory.length - 1;
            lastSavedHistoryStep.current = newStep;
            setHistoryStep(newStep);
        };

        const handleSelection = () => {
            const active = canvas.getActiveObject();
            if (!active) { setActiveObject(null); return; }
            setActiveObject({
                uid: active.uid, type: active.type, text: active.text || '',
                fill: active.fill || '#000000', scaleX: active.scaleX || 1, scaleY: active.scaleY || 1,
                angle: active.angle || 0, opacity: active.opacity || 1, fontFamily: active.fontFamily || 'Inter',
                left: active.left, top: active.top, bringToFront: !!active.bringToFront
            });
            setIsMobileUiMinimized(false);
        };

        let debounceTimer;
        const debouncedUpdateAndSave = () => {
            if (isHistoryRecording.current) return;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (isHistoryRecording.current) return;
                enforceLayering();
                updateTexture(true);
                saveHistory();
            }, 300);
        };

        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', () => setActiveObject(null));
        canvas.on('object:moving', fastSync);
        canvas.on('object:scaling', fastSync);
        canvas.on('object:rotating', fastSync);
        canvas.on('object:modified', debouncedUpdateAndSave);
        canvas.on('object:added', debouncedUpdateAndSave);
        canvas.on('object:removed', debouncedUpdateAndSave);
        canvas.on('path:created', debouncedUpdateAndSave);

        return () => {
            clearTimeout(debounceTimer);
            resizeObserver.disconnect();
            if (fabricRef.current) {
                const c = fabricRef.current;
                fabricRef.current = null;
                try {
                    c.off('selection:created');
                    c.off('selection:updated');
                    c.off('selection:cleared');
                    c.off('object:moving', fastSync);
                    c.off('object:scaling', fastSync);
                    c.off('object:rotating', fastSync);
                    c.off('object:modified');
                    c.off('object:added');
                    c.off('object:removed');
                    c.off('path:created');
                    c.dispose();
                } catch (e) {
                    console.error("Studio Canvas Dispose Error:", e);
                }
            }
        };
    }, [
        isOpen, 
        product?.customizationType, 
        fastSync, 
        updateTexture, 
        enforceLayering,
        setActiveObject,
        setIsMobileUiMinimized,
        setHistoryStep
    ]);

    // Handle Template Loading
    useEffect(() => {
        if (!fabricRef.current || !activeTemplateId) return;
        const canvas = fabricRef.current;

        // Clear existing slots AND their labels
        canvas.getObjects().filter(o => o.isSlot || o.isSlotLabel).forEach(o => canvas.remove(o));

        const lib = templateLib;
        const template = lib.getTemplateById?.(activeTemplateId) || lib.TWOD_TEMPLATES[activeTemplateId];
        if (!template || !template.objects) return;

        template.objects.forEach((objDef, idx) => {
            const currentSlotId = objDef.slotId || `slot_${idx}`;
            let fabricObj;
            if (objDef.type === 'rect') {
                fabricObj = new fabric.Rect({
                    ...objDef,
                    fill: 'rgba(0,0,0,0.05)',
                    stroke: '#000000',
                    strokeWidth: 1,
                    strokeDashArray: [5, 5],
                    selectable: true,
                    evented: true,
                    isSlot: true,
                    slotId: currentSlotId
                });
            } else if (objDef.type === 'path') {
                fabricObj = new fabric.Path(objDef.path, {
                    ...objDef,
                    fill: 'rgba(0,0,0,0.05)',
                    stroke: '#000000',
                    strokeWidth: 1,
                    strokeDashArray: [5, 5],
                    selectable: true,
                    evented: true,
                    isSlot: true,
                    slotId: currentSlotId
                });
            }

            if (fabricObj) {
                canvas.add(fabricObj);
                
                // Add "ADD PHOTO" Label
                const label = new fabric.IText('ADD PHOTO', {
                    left: fabricObj.left + (fabricObj.width * fabricObj.scaleX / 2),
                    top: fabricObj.top + (fabricObj.height * fabricObj.scaleY / 2),
                    fontSize: 12,
                    fontFamily: 'Inter',
                    fontWeight: '900',
                    fill: '#000000',
                    originX: 'center',
                    originY: 'center',
                    selectable: false,
                    evented: false,
                    excludeFromExport: true,
                    isSlotLabel: true,
                    slotId: currentSlotId
                });
                canvas.add(label);
            }
        });

        enforceLayering();
        updateTexture(true);
    }, [activeTemplateId, viewSide, enforceLayering, updateTexture]);

    useEffect(() => {
        if (!fabricRef.current || !current2DImageUrl) return;
        const canvas = fabricRef.current;
        
        if (product?.phoneMask) return; 

        const existing = canvas.getObjects().find(o => o.id === '2d_model_mask');

        const ImgClass = fabric.FabricImage || fabric.Image;
        const imgElement = new Image();
        imgElement.crossOrigin = 'anonymous';

        let worker = null;
        let workerUrl = null;
        let isEffectActive = true;

        imgElement.onload = () => {
            if (!isEffectActive || fabricRef.current !== canvas) return;
            if (existing) canvas.remove(existing);
            
            const img = new ImgClass(imgElement, {
                id: '2d_model_mask',
                selectable: false,
                evented: false,
                excludeFromExport: true,
                originX: 'left',
                originY: 'top',
            });
            
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempCtx.drawImage(img.getElement(), 0, 0);
            
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;
            
            const workerCode = `
                self.onmessage = function(e) {
                    const data = e.data.imageData;
                    const width = e.data.width;
                    const height = e.data.height;
                    
                    let minX = width, minY = height, maxX = 0, maxY = 0;
                    let found = false;
                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            const alpha = data[(y * width + x) * 4 + 3];
                            if (alpha > 10) {
                                if (x < minX) minX = x;
                                if (y < minY) minY = y;
                                if (x > maxX) maxX = x;
                                if (y > maxY) maxY = y;
                                found = true;
                            }
                        }
                    }
                    self.postMessage({ found, minX, minY, maxX, maxY });
                };
            `;
            
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            workerUrl = URL.createObjectURL(blob);
            worker = new Worker(workerUrl);
            
            worker.postMessage({ imageData, width: tempCanvas.width, height: tempCanvas.height });
            
            worker.onmessage = (e) => {
                if (!isEffectActive || fabricRef.current !== canvas) {
                    worker?.terminate();
                    return;
                }
                const { found, minX, minY, maxX, maxY } = e.data;
                const contentWidth = found ? (maxX - minX + 1) : img.width;
                const contentHeight = found ? (maxY - minY + 1) : img.height;
                const offsetX = found ? minX : 0;
                const offsetY = found ? minY : 0;
                
                // Final safety check before canvas operations
                if (canvas.disposed || !canvas.lowerCanvasEl) return;

                canvas.setDimensions({ width: contentWidth, height: contentHeight });
                setCanvasIntrinsicDimensions({ width: contentWidth, height: contentHeight });
                
                img.set({ 
                    scaleX: 1, 
                    scaleY: 1, 
                    left: -offsetX, 
                    top: -offsetY
                });
                canvas.add(img);
                
                if (resizeRef.current) resizeRef.current();
                enforceLayering();
                
                worker.terminate();
                if (workerUrl) URL.revokeObjectURL(workerUrl);
            };
            
            worker.onerror = (err) => {
                console.error("Auto-crop worker failed", err);
                if (!isEffectActive || fabricRef.current !== canvas || canvas.disposed || !canvas.lowerCanvasEl) {
                    worker?.terminate();
                    return;
                }
                canvas.setDimensions({ width: img.width, height: img.height });
                setCanvasIntrinsicDimensions({ width: img.width, height: img.height });
                img.set({ scaleX: 1, scaleY: 1, left: 0, top: 0 });
                canvas.add(img);
                if (resizeRef.current) resizeRef.current();
                enforceLayering();
                worker.terminate();
                if (workerUrl) URL.revokeObjectURL(workerUrl);
            };
        };
        imgElement.src = current2DImageUrl;

        return () => {
            isEffectActive = false;
            imgElement.onload = null;
            if (worker) worker.terminate();
            if (workerUrl) URL.revokeObjectURL(workerUrl);
        };
    }, [current2DImageUrl, product?.phoneMask, viewSide, enforceLayering]);

    useEffect(() => {
        if (historyStep === -1 || historyStep === lastSavedHistoryStep.current || isHistoryRecording.current || !fabricRef.current) return;
        lastSavedHistoryStep.current = historyStep;
        isHistoryRecording.current = true;
        
        // Preserve excluded objects (like model masks) that are not saved in history
        const excludedObjects = fabricRef.current.getObjects().filter(o => o.excludeFromExport);
        
        fabricRef.current.loadFromJSON(historyRef.current[historyStep]).then(() => {
            excludedObjects.forEach(obj => fabricRef.current.add(obj));
            enforceLayering();
            fabricRef.current.renderAll();
            updateTexture(true);
            isHistoryRecording.current = false;
        });
    }, [historyStep, updateTexture, enforceLayering]);

    useImperativeHandle(ref, () => ({
        updateTexture,
        fastSync,
        enforceLayering
    }));

    return (
        <div className="absolute inset-0 transition-opacity duration-300" style={{ 
            opacity: activeStudioTab === '2D_STUDIO' ? 1 : 0, 
            pointerEvents: activeStudioTab === '2D_STUDIO' ? 'auto' : 'none', 
            zIndex: activeStudioTab === '2D_STUDIO' ? 10 : -10,
            visibility: activeStudioTab === '2D_STUDIO' ? 'visible' : 'hidden'
        }}>
            <div className="w-full h-full flex items-center justify-center relative bg-slate-100/30">
                <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-12">
                    <div className={`relative ${product?.phoneMask ? 'h-full max-h-[800px] aspect-[1/2]' : (effectiveMockupProfile === 'mug-wrap' ? 'w-[98%] max-w-[1000px] aspect-[2.22]' : 'w-full h-full')} flex items-center justify-center group transition-all duration-700`}>
                        
                        {/* Layer -1: Phone Base Mockup Image (Behind the canvas) */}
                        {product?.phoneMask && (
                            <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center p-6 lg:p-12 opacity-80 transition-opacity">
                            </div>
                        )}

                        {/* Layer -1: Generic 2D Backdrop (Acrylics, Frames, Mugs) */}
                        {!product?.phoneMask && current2DImageUrl && (
                            <div className={`absolute inset-0 z-0 pointer-events-none flex items-center justify-center p-4 transition-opacity ${activeStudioTab === '2D_STUDIO' ? 'opacity-0' : 'opacity-100'}`}>
                                <img loading="lazy" 
                                    src={current2DImageUrl} 
                                    alt="Product Backdrop"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        )}

                        {/* Layer 10: Fabric.js Canvas Overlay */}
                        <div className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none`}>
                            <div className="pointer-events-auto" style={{ 
                                width: product?.phoneMask ? '100%' : `${(canvasIntrinsicDimensions?.width || fabricRef.current?.width || effectiveCanvasConfig?.width || 500) * canvasScale}px`, 
                                height: product?.phoneMask ? '100%' : `${(canvasIntrinsicDimensions?.height || fabricRef.current?.height || effectiveCanvasConfig?.height || 600) * canvasScale}px`,
                                marginLeft: `${(canvasIntrinsicDimensions ? 0 : (effectiveCanvasConfig?.offsetX || 0)) * canvasScale}px`,
                                marginTop: `${(canvasIntrinsicDimensions ? 0 : (effectiveCanvasConfig?.offsetY || 0)) * canvasScale}px`,
                                transform: product?.phoneMask ? 'none' : `scale(1)`, 
                                transformOrigin: 'center' 
                            }}>
                                <canvas ref={canvasRef} />
                            </div>
                        </div>
                        
                        {/* Phone Masking Logic */}
                        {product?.phoneMask && (
                            <div className="absolute inset-0 z-20 pointer-events-none">
                                <svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid meet" className="drop-shadow-2xl">
                                    <defs>
                                        <mask id="phone-mask-inverted">
                                            <rect width="100%" height="100%" fill="white" />
                                            <rect 
                                                x={200 - (product.phoneMask.shape.width/2)} 
                                                y={400 - (product.phoneMask.shape.height/2)} 
                                                width={product.phoneMask.shape.width} 
                                                height={product.phoneMask.shape.height} 
                                                rx={product.phoneMask.shape.rx} 
                                                fill="black" 
                                            />
                                            {product.phoneMask.camera.type === 'rounded-rect' && (
                                                <rect 
                                                    x={(200 - product.phoneMask.shape.width/2) + product.phoneMask.camera.x} 
                                                    y={(400 - product.phoneMask.shape.height/2) + product.phoneMask.camera.y} 
                                                    width={product.phoneMask.camera.width} 
                                                    height={product.phoneMask.camera.height} 
                                                    rx={product.phoneMask.camera.rx} 
                                                    fill="white" 
                                                />
                                            )}
                                            {product.phoneMask.camera.type === 'circle' && (
                                                <circle 
                                                    cx={(200 - product.phoneMask.shape.width/2) + product.phoneMask.camera.cx} 
                                                    cy={(400 - product.phoneMask.shape.height/2) + product.phoneMask.camera.cy} 
                                                    r={product.phoneMask.camera.r} 
                                                    fill="white" 
                                                />
                                            )}
                                            {product.phoneMask.camera.type === 'lenses' && product.phoneMask.camera.lenses.map((lens, i) => (
                                                <circle 
                                                    key={i}
                                                    cx={(200 - product.phoneMask.shape.width/2) + lens.cx} 
                                                    cy={(400 - product.phoneMask.shape.height/2) + lens.cy} 
                                                    r={lens.r} 
                                                    fill="white" 
                                                />
                                            ))}
                                        </mask>
                                    </defs>
                                    <rect width="100%" height="100%" fill="#f8fafc" mask="url(#phone-mask-inverted)" />
                                    
                                    <rect 
                                        x={200 - (product.phoneMask.shape.width/2)} 
                                        y={400 - (product.phoneMask.shape.height/2)} 
                                        width={product.phoneMask.shape.width} 
                                        height={product.phoneMask.shape.height} 
                                        rx={product.phoneMask.shape.rx} 
                                        fill="none" 
                                        stroke="#e2e8f0"
                                        strokeWidth="1"
                                    />
                                </svg>
                            </div>
                        )}

                        {/* Layer 25: Case Reflection Overlay (Above the design) */}
                        {product?.phoneMask && (
                            <div className="absolute inset-0 z-[25] pointer-events-none flex items-center justify-center p-6 lg:p-12 opacity-40 mix-blend-screen transition-opacity">
                            </div>
                        )}

                        {/* Layer: Code-Driven 2D Template Viewport (Universal) */}
                        {product?.shapeConfig && !product?.phoneMask && (!current2DImageUrl || product?.mockupProfile === 'mug-wrap') && (
                            <div className={`absolute inset-0 z-20 pointer-events-none flex items-center justify-center ${product?.mockupProfile === 'mug-wrap' ? 'visible' : 'overflow-hidden'}`}>
                                <div className="relative" style={{ 
                                    width: `${(product?.canvasConfig?.width || 500) * canvasScale}px`, 
                                    height: `${(product?.canvasConfig?.height || 600) * canvasScale}px`,
                                    marginLeft: `${(product?.canvasConfig?.offsetX || 0) * canvasScale}px`, 
                                    marginTop: `${(product?.canvasConfig?.offsetY || 0) * canvasScale}px`
                                }}>
                                    {/* Optional CSS Mug Handle (Protruding Left) */}
                                    {product?.mockupProfile === 'mug-wrap' && (
                                        <div className="absolute top-1/2 -translate-y-1/2 h-[65%] border-r-0 rounded-l-[120px] shadow-[-15px_15px_30px_rgba(0,0,0,0.06),inset_8px_8px_20px_rgba(0,0,0,0.03)] pointer-events-none" style={{
                                            left: `-${Math.max(40, 80 * canvasScale)}px`,
                                            width: `${Math.max(40, 80 * canvasScale)}px`,
                                            borderWidth: `${Math.max(12, 24 * canvasScale)}px`,
                                            borderColor: '#fcfdfd',
                                            background: 'linear-gradient(to right, #ffffff, #f1f5f9)',
                                            zIndex: -1
                                        }}></div>
                                    )}
                                    
                                    {/* The Workspace Canvas Backdrop */}
                                    <div className={`absolute inset-0 shadow-inner flex items-center justify-center ${product?.mockupProfile === 'mug-wrap' ? 'rounded-[16px] shadow-[inset_10px_0_20px_rgba(0,0,0,0.03)]' : 'bg-white'}`} style={{
                                        background: product?.mockupProfile === 'mug-wrap' ? 'linear-gradient(to right, #fcfdfd 0%, #ffffff 50%, #fcfdfd 100%)' : 'white'
                                    }}>
                                         <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                    </div>

                                    {/* Dynamic SVG Frame / Mask / Border */}
                                    <svg 
                                        width="100%" 
                                        height="100%" 
                                        viewBox={`0 0 ${product.canvasConfig?.width || 500} ${product.canvasConfig?.height || 600}`} 
                                        className="absolute inset-0 z-30"
                                    >
                                        <defs>
                                            <mask id={`shape-mask-${product._id || 'new'}`}>
                                                <rect width="100%" height="100%" fill="white" />
                                                {product.shapeConfig.type === 'circle' && <circle cx="50%" cy="50%" r={product.shapeConfig.radius} fill="black" />}
                                                {product.shapeConfig.type === 'rectangle' && <rect x="50%" y="50%" width={product.shapeConfig.width} height={product.shapeConfig.height} style={{ transform: 'translate(-50%, -50%)' }} fill="black" />}
                                                {product.shapeConfig.type === 'rounded-rectangle' && <rect x="50%" y="50%" width={product.shapeConfig.width} height={product.shapeConfig.height} rx={product.shapeConfig.rx} style={{ transform: 'translate(-50%, -50%)' }} fill="black" />}
                                                {product.shapeConfig.type === 'polygon' && <polygon points={product.shapeConfig.points} fill="black" />}
                                            </mask>
                                        </defs>
                                        
                                        <rect width="100%" height="100%" fill="#fafafa" mask={`url(#shape-mask-${product._id || 'new'})`} />
                                        
                                        <g 
                                            fill={`rgba(255,255,255,${product.shapeConfig.overlayOpacity || 0.05})`} 
                                            stroke={product.shapeConfig.borderColor || '#e2e8f0'} 
                                            strokeWidth={product.shapeConfig.strokeWidth || 1}
                                        >
                                            {product.shapeConfig.type === 'circle' && <circle cx="50%" cy="50%" r={product.shapeConfig.radius} />}
                                            {product.shapeConfig.type === 'rectangle' && <rect x="50%" y="50%" width={product.shapeConfig.width} height={product.shapeConfig.height} style={{ transform: 'translate(-50%, -50%)' }} />}
                                            {product.shapeConfig.type === 'rounded-rectangle' && <rect x="50%" y="50%" width={product.shapeConfig.width} height={product.shapeConfig.height} rx={product.shapeConfig.rx} style={{ transform: 'translate(-50%, -50%)' }} />}
                                            {product.shapeConfig.type === 'polygon' && <polygon points={product.shapeConfig.points} />}
                                        </g>
                                    </svg>
                                </div>
                            </div>
                        )}

                        {/* Legacy 2D Mask/Overlay */}
                        {!product?.phoneMask && !product?.shapeConfig && (product?.frontMaskImage || product?.frontOverlayImage) && (
                            <div className="absolute inset-0 z-[25] pointer-events-none flex items-center justify-center p-4 transition-opacity">
                                {product.frontMaskImage && (
                                    <img loading="lazy" 
                                        src={product.frontMaskImage} 
                                        alt="Model Mask"
                                        className="absolute inset-0 w-full h-full object-contain mix-blend-multiply opacity-50"
                                    />
                                )}
                                {product.frontOverlayImage && (
                                    <img loading="lazy" 
                                        src={product.frontOverlayImage} 
                                        alt="Model Overlay"
                                        className="absolute inset-0 w-full h-full object-contain mix-blend-screen opacity-40"
                                    />
                                )}
                            </div>
                        )}

                        {/* Quick Side Toggle */}
                        {(product?.blankFrontImage && product?.blankBackImage && twoDModels.length === 0) && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex bg-white/90 backdrop-blur-md p-1 rounded-2xl shadow-xl z-30 border border-slate-100">
                                <button onClick={() => handleSwitchSide('front')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewSide === 'front' ? 'bg-[#0c0c2a] text-white' : 'text-slate-400 hover:text-slate-900'}`}>Front View</button>
                                <button onClick={() => handleSwitchSide('back')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewSide === 'back' ? 'bg-[#0c0c2a] text-white' : 'text-slate-400 hover:text-slate-900'}`}>Back View</button>
                            </div>
                        )}

                        {/* Dynamic 2D Models Navigation */}
                        {twoDModels.length > 0 && twoDModels[active2DModelIdx] && (
                            <div className="absolute top-4 right-4 flex flex-row items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-2xl z-30 border border-slate-100/50 pointer-events-auto">
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-3 hidden sm:block">Views</div>
                                <div className="w-[1px] h-6 bg-slate-200 hidden sm:block"></div>
                                <button 
                                    onClick={() => {
                                        handleSwitchSide(`model_${active2DModelIdx}_main`);
                                        setActiveSupportSide('Main');
                                    }}
                                    className={`px-3 h-10 rounded-full flex items-center gap-2 transition-all ${activeSupportSide === 'Main' ? 'bg-[#0c0c2a] text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <img loading="lazy" src={twoDModels[active2DModelIdx].mainModelUrl} alt="Main" className={`w-5 h-5 object-contain drop-shadow-sm ${activeSupportSide === 'Main' ? 'brightness-0 invert' : ''}`} />
                                    <span className="text-[8px] font-black uppercase hidden sm:block">Main</span>
                                </button>
                                
                                {twoDModels[active2DModelIdx].supportModels?.map((sm, smIdx) => (
                                    <button 
                                        key={smIdx}
                                        onClick={() => {
                                            handleSwitchSide(`model_${active2DModelIdx}_support_${sm.side}`);
                                            setActiveSupportSide(sm.side);
                                        }}
                                        className={`px-3 h-10 rounded-full flex items-center gap-2 transition-all ${activeSupportSide === sm.side ? 'bg-[#0c0c2a] text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                    >
                                        <img loading="lazy" src={sm.url} alt={sm.side} className={`w-5 h-5 object-contain drop-shadow-sm ${activeSupportSide === sm.side ? 'brightness-0 invert' : ''}`} />
                                        <span className="text-[8px] font-black uppercase hidden sm:block">{sm.side}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default Workspace2D;
