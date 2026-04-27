import React, { useEffect, useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import * as fabric from 'fabric';
import { useStudio } from '../context/StudioContext';
import { phoneBrands } from '../../../data/MobileCasesDB';

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
    handleSwitchSide
}, ref) => {
    const { 
        activeStudioTab, setActiveStudioTab,
        current2DImageUrl, viewSide, 
        setActiveObject, setCanvasObjects, canvasObjects,
        historyStep, setHistoryStep, 
        setIsMobileUiMinimized 
    } = useStudio();

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
    }, []);

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
    }, []);

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
                    dataUrl: obj._cachedDataUrl,
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
    }, []);

    const enforceLayering = useCallback(() => {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        const objects = canvas.getObjects();
        
        const photos = [];
        const models = [];
        const slots = [];
        const topLayers = [];

        objects.forEach(obj => {
            if (obj.id === '2d_model_mask') {
                models.push(obj);
            } else if (obj.isSlot) {
                slots.push(obj);
            } else if (obj.uid?.startsWith('upload_') || obj.uid?.startsWith('up_') || obj.type === 'image' || obj.type === 'FabricImage' || obj.isPhoto) {
                photos.push(obj);
            } else {
                topLayers.push(obj);
            }
        });

        // Hierarchy: Photos (Bottom) -> Slots (Optional) -> Model Mask -> Top Layers (Text/Stickers)
        const sortedObjects = [...photos, ...slots, ...models, ...topLayers];
        
        // Re-order without breaking internal Fabric state
        sortedObjects.forEach((obj, idx) => {
            if (canvas.getObjects().indexOf(obj) !== idx) {
                canvas.moveObjectTo(obj, idx);
            }
        });
        
        canvas.requestRenderAll();
    }, []);

    useEffect(() => {
        if (!isOpen || !canvasRef.current || !viewportRef.current) return;

        const effectiveCanvasConfig = product?.canvasConfig;
        const baseWidth = effectiveCanvasConfig?.width || 500;
        const baseHeight = effectiveCanvasConfig?.height || 600;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: baseWidth,
            height: baseHeight,
            backgroundColor: 'transparent',
            preserveObjectStacking: true
        });
        
        fabricRef.current = canvas;

        const handleResize = () => {
            if (!viewportRef.current || !fabricRef.current) return;
            const { clientWidth: width, clientHeight: height } = viewportRef.current;
            
            const currentWidth = fabricRef.current.width || baseWidth;
            const currentHeight = fabricRef.current.height || baseHeight;

            const scaleX = width / currentWidth;
            const scaleY = height / currentHeight;
            const newScale = Math.min(scaleX, scaleY, 1.2) * 0.95;

            setCanvasScale(newScale);

            fabricRef.current.setDimensions({
                width: currentWidth * newScale,
                height: currentHeight * newScale
            }, { cssOnly: true });
        };

        const resizeObserver = new ResizeObserver(() => {
            handleResize();
        });

        resizeObserver.observe(viewportRef.current);
        resizeRef.current = handleResize;

        fabric.Object.prototype.set({
            cornerColor: '#0c0c2a', cornerStrokeColor: '#ffffff', cornerStyle: 'circle',
            transparentCorners: false, cornerSize: 10, borderColor: '#0c0c2a', borderScaleFactor: 2, padding: 10
        });

        const saveHistory = () => {
            if (isHistoryRecording.current) return;
            const json = canvas.toJSON(['uid', 'id', 'isPhoto', 'isSlot', 'slotId', 'excludeFromExport', 'selectable', 'evented']);
            const newHistory = historyRef.current.slice(0, historyStep + 1);
            newHistory.push(json);
            historyRef.current = newHistory;
            setHistoryStep(newHistory.length - 1);
        };

        const handleSelection = () => {
            const active = canvas.getActiveObject();
            if (!active) { setActiveObject(null); return; }
            setActiveObject({
                uid: active.uid, type: active.type, text: active.text || '',
                fill: active.fill || '#000000', scaleX: active.scaleX || 1, scaleY: active.scaleY || 1,
                angle: active.angle || 0, opacity: active.opacity || 1, fontFamily: active.fontFamily || 'Inter',
                left: active.left, top: active.top
            });
            setIsMobileUiMinimized(false);
        };

        let debounceTimer;
        const debouncedUpdateAndSave = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
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
    }, [isOpen, product?.customizationType, fastSync, updateTexture, enforceLayering]);

    // Handle Template Loading
    useEffect(() => {
        if (!fabricRef.current || !activeTemplateId) return;
        const canvas = fabricRef.current;

        // Clear existing slots/templates but keep user uploads
        canvas.getObjects().filter(o => o.isSlot).forEach(o => canvas.remove(o));

        import('../TwoD/TwoDTemplateLibrary').then(lib => {
            const template = lib.getTemplateById?.(activeTemplateId) || lib.TWOD_TEMPLATES[activeTemplateId];
            if (!template || !template.objects) return;

            template.objects.forEach(objDef => {
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
                        isSlot: true
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
                        isSlot: true
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
                        excludeFromExport: true
                    });
                    canvas.add(label);
                }
            });

            enforceLayering();
            updateTexture(true);
        });
    }, [activeTemplateId, enforceLayering, updateTexture]);

    useEffect(() => {
        if (!fabricRef.current || !current2DImageUrl) return;
        const canvas = fabricRef.current;
        
        if (product?.phoneMask) return; 

        const existing = canvas.getObjects().find(o => o.id === '2d_model_mask');

        const ImgClass = fabric.FabricImage || fabric.Image;
        const imgElement = new Image();
        imgElement.crossOrigin = 'anonymous';
        imgElement.onload = () => {
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
            const workerUrl = URL.createObjectURL(blob);
            const worker = new Worker(workerUrl);
            
            worker.postMessage({ imageData, width: tempCanvas.width, height: tempCanvas.height });
            
            worker.onmessage = (e) => {
                const { found, minX, minY, maxX, maxY } = e.data;
                const contentWidth = found ? (maxX - minX + 1) : img.width;
                const contentHeight = found ? (maxY - minY + 1) : img.height;
                const offsetX = found ? minX : 0;
                const offsetY = found ? minY : 0;

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
                URL.revokeObjectURL(workerUrl);
            };
            
            worker.onerror = (err) => {
                console.error("Auto-crop worker failed", err);
                canvas.setDimensions({ width: img.width, height: img.height });
                setCanvasIntrinsicDimensions({ width: img.width, height: img.height });
                img.set({ scaleX: 1, scaleY: 1, left: 0, top: 0 });
                canvas.add(img);
                if (resizeRef.current) resizeRef.current();
                enforceLayering();
                worker.terminate();
                URL.revokeObjectURL(workerUrl);
            };
        };
        imgElement.src = current2DImageUrl;
    }, [current2DImageUrl, product?.phoneMask, viewSide]);

    useEffect(() => {
        if (historyStep === -1 || isHistoryRecording.current || !fabricRef.current) return;
        isHistoryRecording.current = true;
        fabricRef.current.loadFromJSON(historyRef.current[historyStep]).then(() => {
            enforceLayering();
            fabricRef.current.renderAll();
            updateTexture(true);
            isHistoryRecording.current = false;
        });
    }, [historyStep, updateTexture]);

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
                    <div className={`relative ${product?.phoneMask ? 'w-full max-w-[400px] aspect-[1/2]' : (effectiveMockupProfile === 'mug-wrap' ? 'w-[98%] max-w-[1000px] aspect-[2.22]' : 'w-full h-full')} flex items-center justify-center group transition-all duration-700`}>
                        
                        {product?.phoneMask && (
                            <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center p-6 lg:p-12 opacity-80 transition-opacity">
                                <img 
                                    src={product.phoneMask.bodyImage || phoneBrands.find(b => b.id === product.phoneMask.brand)?.mockup || "https://i.ibb.co/L5hY5M0/samsung-mockup.png"} 
                                    alt="Phone Body"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        )}

                        <div className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none`}>
                            <div className="pointer-events-auto" style={{ 
                                width: `${(product?.phoneMask ? 400 : (canvasIntrinsicDimensions?.width || fabricRef.current?.width || effectiveCanvasConfig?.width || 500)) * canvasScale}px`, 
                                height: `${(product?.phoneMask ? 800 : (canvasIntrinsicDimensions?.height || fabricRef.current?.height || effectiveCanvasConfig?.height || 600)) * canvasScale}px`,
                                transformOrigin: 'center' 
                            }}>
                                <canvas ref={canvasRef} />
                            </div>
                        </div>
                        
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
                                        </mask>
                                    </defs>
                                    <rect width="100%" height="100%" fill="#f8fafc" mask="url(#phone-mask-inverted)" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default Workspace2D;
