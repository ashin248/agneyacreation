import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { FiSave, FiCheckCircle, FiXCircle, FiClock, FiSettings, FiImage, FiDownload, FiAlertTriangle, FiRotateCw, FiMaximize2, FiSearch } from 'react-icons/fi';
import { Canvas, createPortal } from '@react-three/fiber';
import { OrbitControls, Stage, Decal, useTexture, useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import * as fabric from 'fabric';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { LibraryProduct, MODELS } from '../../../Client/components/Three/ProductLibrary';

// Helper for Decal Projection (Ported from Studio)
const ProjectedDecalWrapper = ({ mesh, dataUrl, position, rotation, scale }) => {
    const texture = useTexture(dataUrl);
    if (texture) {
        texture.anisotropy = 16;
        texture.needsUpdate = true;
    }

    return (
        <Decal
            position={position}
            rotation={rotation}
            scale={scale}
        >
            <meshStandardMaterial
                map={texture}
                transparent={true}
                depthTest={true}
                depthWrite={false}
                polygonOffset={true}
                polygonOffsetFactor={-20}
                side={THREE.DoubleSide}
            />
        </Decal>
    );
};

// Internal 3D Model Component
const ModelInspector = ({ productType, canvasObjects, objectAnchors }) => {
    const modelGroupRef = useRef();
    
    // Find model config by searching MODELS for the productType (which might be a full name like "[Custom] Mug")
    const modelConfig = useMemo(() => {
        const nameKey = String(productType).toUpperCase();
        return Object.values(MODELS).find(m => nameKey.includes(m.category.toUpperCase())) || MODELS.MASTER_CUP;
    }, [productType]);

    const { scene } = useGLTF(modelConfig.path);
    
    // Default Anchor Logic
    const defaultAnchor = useMemo(() => {
        let bestTarget = null;
        scene.traverse((child) => {
            if (child.isMesh && (modelConfig.printableMeshes?.includes(child.name) || !bestTarget)) {
                bestTarget = child;
            }
        });
        
        if (!bestTarget) return null;
        bestTarget.geometry.computeBoundingBox();
        const box = bestTarget.geometry.boundingBox;
        const w = box.max.x - box.min.x;
        const h = box.max.y - box.min.y;
        const d = box.max.z - box.min.z;
        
        const isPlanar = modelConfig.projectionType === 'planar';
        const pos = isPlanar ? [(box.max.x + box.min.x) / 2, box.max.y, (box.max.z + box.min.z) / 2] : [(box.max.x + box.min.x) / 2, (box.max.y + box.min.y) / 2, box.max.z];
        const rot = isPlanar ? [-Math.PI / 2, 0, 0] : [0, 0, 0];

        return { meshId: bestTarget.uuid, meshName: bestTarget.name, pos, rot, dim: [w, h, d] };
    }, [scene, modelConfig]);

    return (
        <group>
            <group ref={modelGroupRef}>
                <primitive
                    object={scene}
                    scale={modelConfig.defaultScale || 1.5}
                    rotation={modelConfig.defaultRotation || [0, 0, 0]}
                />
            </group>
            {canvasObjects.map((obj) => {
                const anchor = objectAnchors[obj.uid] || defaultAnchor;
                if (!anchor) return null;
                
                let targetMesh = null;
                if (modelGroupRef.current) {
                    targetMesh = modelGroupRef.current.getObjectByName(anchor.meshName) || modelGroupRef.current.getObjectByProperty('uuid', anchor.meshId);
                }
                if (!targetMesh) return null;

                const isPlanar = modelConfig.projectionType === 'planar' || modelConfig.projectionType === 'decal';
                let finalPos = [...anchor.pos];
                let finalRotation = [...anchor.rot];
                const maxDim = Math.max(anchor.dim[0], anchor.dim[1], anchor.dim[2]);
                
                // Use source canvas height (600) for uniform pixels-per-unit scaling
                const sourceCanvasHeight = obj.canvasHeight || 600;
                const sourceCanvasWidth = obj.canvasWidth || 500;
                
                const pixelsPerUnitUniform = sourceCanvasHeight / (isPlanar ? maxDim : anchor.dim[1]);
                const decalWidth = (obj.width * Math.abs(obj.scaleX || 1)) / pixelsPerUnitUniform;
                const decalHeight = (obj.height * Math.abs(obj.scaleY || 1)) / pixelsPerUnitUniform;
                let decalDepth = isPlanar ? 0.05 : 1; // Slight depth for planar to prevent z-fighting

                if (isPlanar) {
                    const dummy = new THREE.Object3D();
                    dummy.rotation.set(anchor.rot[0], anchor.rot[1], anchor.rot[2]);
                    dummy.updateMatrixWorld();
                    
                    const localX = new THREE.Vector3(1, 0, 0).applyQuaternion(dummy.quaternion);
                    const localY = new THREE.Vector3(0, 1, 0).applyQuaternion(dummy.quaternion);
                    
                    // Normalize offsets based on 500x600 original canvas
                    const xShift = obj.offsetX * (maxDim * (sourceCanvasWidth / sourceCanvasHeight));
                    const yShift = -obj.offsetY * (maxDim);
                    
                    finalPos[0] += localX.x * xShift + localY.x * yShift;
                    finalPos[1] += localX.y * xShift + localY.y * yShift;
                    finalPos[2] += localX.z * xShift + localY.z * yShift;
                    
                    dummy.rotateZ(obj.rotation * Math.PI / 180);
                    finalRotation = [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z];
                } else {
                    const radius = Math.min(anchor.dim[0], anchor.dim[2]) * 0.5;
                    // Improved wrapping math for cylindrical models
                    const wrapAngle = -obj.offsetX * (Math.PI / (sourceCanvasWidth/sourceCanvasHeight * 0.8));
                    finalPos[0] = anchor.pos[0] + radius * Math.sin(wrapAngle);
                    finalPos[1] = anchor.pos[1] + (-obj.offsetY * (anchor.dim[1] * 0.5));
                    finalPos[2] = anchor.pos[2] + radius * (Math.cos(wrapAngle) - 1);
                    
                    const dummy = new THREE.Object3D();
                    dummy.rotation.set(anchor.rot[0], anchor.rot[1], anchor.rot[2]);
                    dummy.rotateY(-wrapAngle);
                    dummy.rotateZ(obj.rotation * Math.PI / 180);
                    finalRotation = [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z];
                    decalDepth = radius * 2;
                }

                return createPortal(
                    <ProjectedDecalWrapper
                        key={obj.uid}
                        dataUrl={obj.dataUrl}
                        position={finalPos}
                        rotation={finalRotation}
                        scale={[decalWidth, decalHeight, decalDepth]}
                    />,
                    targetMesh
                );
            })}
        </group>
    );
};

const DesignReviewPanel = () => {
    const [allDesigns, setAllDesigns] = useState([]);
    const [selectedDesign, setSelectedDesign] = useState(null);
    const [contextKey, setContextKey] = useState(0); 
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [adminNotes, setAdminNotes] = useState('');
    
    // UI states
    const [loading, setLoading] = useState(true);
    const [reconstructing, setReconstructing] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Reconstructed 3D Data
    const [reconstructedObjects, setReconstructedObjects] = useState([]);
    const [reconstructedAnchors, setReconstructedAnchors] = useState({});

    const fetchAllDesigns = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`/api/admin/custom-designs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllDesigns(response.data?.data || []);
        } catch (err) {
            setError("Failed to load designs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllDesigns();
    }, []);

    // Status Filtering & Categorization Logic (STRICTLY STUDIO/SELF DESIGN ONLY, MUST BE PAID)
    const filteredDesigns = allDesigns.filter(d => {
        const matchesSearch = (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (d.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const isStudio = !!d.frontCanvasData;
        const isPaidOrder = d.isPaid === true; // Enforce payment prerequisite
        return matchesSearch && isStudio && isPaidOrder;
    });

    // Reconstruction Engine
    useEffect(() => {
        if (!selectedDesign || !selectedDesign.frontCanvasData) {
            setReconstructedObjects([]);
            setReconstructedAnchors({});
            return;
        }

        const reconstruct = async () => {
            setReconstructing(true);
            try {
                const canvasData = typeof selectedDesign.frontCanvasData === 'string' 
                    ? JSON.parse(selectedDesign.frontCanvasData) 
                    : selectedDesign.frontCanvasData;

                const virtualCanvasEl = document.createElement('canvas');
                const canvas = new fabric.Canvas(virtualCanvasEl, { 
                    width: selectedDesign.canvasWidth || 500, 
                    height: selectedDesign.canvasHeight || 600 
                });
                
                await canvas.loadFromJSON(canvasData);
                canvas.renderAll();
                
                const snapshots = canvas.getObjects().filter(o => !o.excludeFromExport).map(obj => {
                    return {
                        uid: obj.uid || Math.random().toString(36).substr(2, 9),
                        type: obj.type,
                        dataUrl: obj.toDataURL({ format: 'png', quality: 0.9, multiplier: 1.5 }),
                        offsetX: ((obj.getCenterPoint().x) - (selectedDesign.canvasWidth || 500) / 2) / ((selectedDesign.canvasWidth || 500) / 2),
                        offsetY: ((obj.getCenterPoint().y) - (selectedDesign.canvasHeight || 600) / 2) / ((selectedDesign.canvasHeight || 600) / 2),
                        rotation: obj.angle || 0,
                        scaleX: obj.scaleX || 1,
                        scaleY: obj.scaleY || 1,
                        width: obj.width,
                        height: obj.height,
                        canvasWidth: selectedDesign.canvasWidth || 500,
                        canvasHeight: selectedDesign.canvasHeight || 600
                    };
                });
                
                setReconstructedObjects(snapshots);
                setReconstructedAnchors(selectedDesign.frontAnchors || {});
            } catch (err) {
                console.error("3D Reconstruction Error:", err);
            } finally {
                setReconstructing(false);
            }
        };

        reconstruct();
    }, [selectedDesign]);

    const handleAction = async (newStatus) => {
        if (!selectedDesign?._id) return;
        setProcessing(true);
        try {
            const token = localStorage.getItem('adminToken');
            await axios.patch(`/api/admin/custom-designs/${selectedDesign._id}/status`, {
                status: newStatus,
                adminNotes
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccessMessage(`Design ${newStatus.toLowerCase()}!`);
            await fetchAllDesigns();
            setSelectedDesign(prev => ({...prev, status: newStatus})); // Preserve selected view but update status
        } catch (err) {
            setError(`Failed to ${newStatus.toLowerCase()} design.`);
        } finally {
            setProcessing(false);
        }
    };

    const handleDownloadForPrint = async () => {
        if (!selectedDesign) return;
        setProcessing(true);
        try {
            const zip = new JSZip();

            // 1. Capture 3D Mockup Image from Active Canvas
            const threeCanvas = document.querySelector('canvas[data-three-canvas]');
            if (threeCanvas) {
                const mockupData = threeCanvas.toDataURL('image/png');
                const mockupBlob = await fetch(mockupData).then(res => res.blob());
                zip.file("1_3D_Mockup_Preview.png", mockupBlob);
            } else {
                // Fallback to static preview if 3D scene capture fails
                const previewUrl = selectedDesign.appliedFrontDesign || selectedDesign.designImage;
                if (previewUrl) {
                    const res = await fetch(previewUrl);
                    const blob = await res.blob();
                    zip.file("1_3D_Mockup_Preview.png", blob);
                }
            }

            // High-Res Canvas Renderer (FIXED ASYNC FLOW)
            const renderCanvasToDataURL = async (canvasDataJSON) => {
                const canvasData = typeof canvasDataJSON === 'string' ? JSON.parse(canvasDataJSON) : canvasDataJSON;
                const virtualCanvasEl = document.createElement('canvas');
                
                // Use source dimensions for 1:1 render basis
                const canvas = new fabric.Canvas(virtualCanvasEl, { 
                    width: selectedDesign.canvasWidth || 500, 
                    height: selectedDesign.canvasHeight || 600,
                    backgroundColor: 'transparent'
                });

                // Ensure all internal images have crossOrigin set before loading
                if (canvasData.objects) {
                    canvasData.objects.forEach(obj => {
                        if (obj.type === 'image' || obj.type === 'FabricImage') {
                            obj.crossOrigin = 'anonymous';
                        }
                    });
                }

                await canvas.loadFromJSON(canvasData);
                canvas.discardActiveObject();
                canvas.renderAll();
                
                // Wait briefly for any remaining asset stabilization
                await new Promise(r => setTimeout(r, 100));
                
                return canvas.toDataURL({ 
                    format: 'png', 
                    quality: 1, 
                    multiplier: 4 // 4x multiplier for high-res print (4000px height approx)
                });
            };

            // 2. Render Plain Front Print File
            if (selectedDesign.frontCanvasData) {
                const frontDataUrl = await renderCanvasToDataURL(selectedDesign.frontCanvasData);
                const frontBlob = await fetch(frontDataUrl).then(res => res.blob());
                zip.file("2_Plain_Front_Canvas.png", frontBlob);
            }
            
            // 3. Render Plain Back Print File
            if (selectedDesign.backCanvasData) {
                const backDataUrl = await renderCanvasToDataURL(selectedDesign.backCanvasData);
                const backBlob = await fetch(backDataUrl).then(res => res.blob());
                zip.file("3_Plain_Back_Canvas.png", backBlob);
            }

            // Export Zip (Strict 3-file output as requested)
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `Agneya_Print_Pack_${selectedDesign._id.slice(-6)}.zip`);
            setSuccessMessage('High-res print pack generated!');
        } catch (err) {
            console.error('Error generating print zip:', err);
            setError('Failed to generate high-resolution print files.');
        } finally {
            setProcessing(false);
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    return (
        <div className="min-h-[85vh] bg-transparent text-gray-800 font-sans">
            {successMessage && (
                <div className="fixed top-24 right-8 z-[100] flex items-center gap-3 px-6 py-4 bg-white border-l-4 border-green-500 shadow-2xl rounded-r-xl animate-bounce-in">
                    <FiCheckCircle className="text-green-500" size={20} />
                    <p className="text-sm font-bold">{successMessage}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[780px]">
                {/* List Column */}
                <div className="lg:col-span-3 bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-xl overflow-hidden flex flex-col border-gray-100">
                    <div className="flex justify-between items-center mb-6 p-6 pb-0">
                        <h2 className="text-lg font-bold">Studio Hub</h2>
                        <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-bold">{filteredDesigns.length} Objects</span>
                    </div>

                    {/* Search Field */}
                    <div className="relative mb-6 px-6">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="SEARCH SIGNATURES..." 
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-[9px] font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-1 space-y-3 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : filteredDesigns.length === 0 ? (
                            <div className="text-center py-20 opacity-20">No matching assets.</div>
                        ) : filteredDesigns.map(design => {
                            let statusColor = "bg-gray-100 text-gray-400 border-gray-100";
                            if (design.status === 'Approved') statusColor = "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm";
                            if (design.status === 'Rejected') statusColor = "bg-red-50 text-red-600 border-red-200 shadow-sm";
                            if (design.status === 'Pending') statusColor = "bg-blue-50 text-blue-600 border-blue-200 shadow-sm";
                            
                            return (
                            <button
                                key={design._id}
                                onClick={() => { setSelectedDesign(design); setAdminNotes(design.adminNotes || ''); }}
                                className={`w-full text-left p-4 rounded-[24px] border transition-all ${selectedDesign?._id === design._id ? 'ring-2 ring-slate-900 shadow-md' : 'border-transparent hover:border-gray-200'} ${statusColor}`}
                            >
                                <div className="flex gap-4 items-center relative">
                                    <div className="w-12 h-14 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-white p-1">
                                        <img src={design.appliedFrontDesign || design.designImage} className="w-full h-full object-contain mix-blend-multiply" alt="preview" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${selectedDesign?._id === design._id ? 'bg-white/10 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                                {design.frontCanvasData ? 'STUDIO' : 'MANUAL'}
                                            </span>
                                            <span className={`text-[8px] font-black uppercase tracking-widest opacity-40`}>#{design._id.slice(-4).toUpperCase()}</span>
                                        </div>
                                        <p className="text-[10px] font-black truncate text-slate-800 leading-none">{design.name || 'Anonymous'}</p>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1 truncate">{design.productType}</p>
                                    </div>
                                </div>
                            </button>
                        )})}
                    </div>
                </div>

                {/* Workspace Column */}
                <div className="lg:col-span-9 bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-2xl flex flex-col h-full overflow-hidden border-gray-100">
                    {!selectedDesign ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <FiImage size={64} className="opacity-10 mb-6" />
                            <p className="text-lg font-bold text-gray-800 opacity-20">Select Artwork to Inspect</p>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row h-full">
                            {/* 3D Workspace / Manual Brief Viewer */}
                            <div className="lg:w-[65%] border-r border-gray-100 relative bg-[#f8f9fb]">
                                {reconstructing && (
                                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
                                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-blue-600">Reconstructing Scene...</p>
                                    </div>
                                )}
                                
                                {!selectedDesign.frontCanvasData && !selectedDesign.backCanvasData ? (
                                    /* MANUAL BRIEF VISUALIZER */
                                    <div className="h-full flex flex-col p-12 overflow-y-auto no-scrollbar">
                                        <div className="space-y-12">
                                            <div className="bg-white rounded-[40px] p-10 border border-indigo-100 shadow-2xl shadow-indigo-100/20">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">Client Specification Brief</span>
                                                </div>
                                                <p className="text-3xl font-black text-slate-900 leading-tight uppercase tracking-tighter italic">
                                                    {selectedDesign.description || "NO WRITTEN INSTRUCTIONS PROVIDED BY CLIENT."}
                                                </p>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Reference Resource Library</h3>
                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                                       {selectedDesign.printAssets?.length || 0} Assets
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                                   {selectedDesign.printAssets?.map((asset, idx) => (
                                                      <div key={idx} className="group relative aspect-[4/5] bg-white rounded-3xl border-4 border-white shadow-xl overflow-hidden hover:scale-105 transition-all">
                                                         <img src={asset} className="w-full h-full object-cover" />
                                                         <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-4">
                                                            <a href={asset} target="_blank" rel="noreferrer" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 mb-2 hover:bg-indigo-600 hover:text-white transition-colors">
                                                               <FiMaximize2 size={20} />
                                                            </a>
                                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Full Quality</span>
                                                         </div>
                                                      </div>
                                                   ))}
                                                   {(!selectedDesign.printAssets || selectedDesign.printAssets.length === 0) && (
                                                      <div className="col-span-full py-20 bg-gray-50 border border-dashed border-gray-200 rounded-[40px] flex flex-col items-center justify-center gap-4 text-gray-300">
                                                         <FiImage size={32} />
                                                         <p className="text-[10px] font-black uppercase tracking-[0.2em]">No reference images provided</p>
                                                      </div>
                                                   )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* 3D WEBGL ENGINE */
                                    <>
                                        <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
                                            <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
                                                <FiRotateCw size={12} className="text-blue-500 animate-spin-slow" />
                                                <span className="text-[9px] font-black tracking-widest text-gray-800 uppercase">3D Design View</span>
                                            </div>
                                        </div>

                                        <Canvas 
                                            shadows 
                                            camera={{ position: [0, 0, 5], fov: 45 }}
                                            gl={{ preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
                                        onCreated={({ gl }) => {
                                            gl.domElement.addEventListener('webglcontextlost', (e) => {
                                                console.warn("Admin Hub: WebGL Context Lost. Re-initializing...");
                                                e.preventDefault();
                                                setTimeout(() => setContextKey(prev => prev + 1), 100);
                                            }, false);
                                        }}
                                        key={contextKey}
                                            data-three-canvas
                                        >
                                            <Stage environment="city" intensity={0.5} contactShadow={{ opacity: 0.2 }}>
                                                <ModelInspector 
                                                    productType={selectedDesign.productType}
                                                    canvasObjects={reconstructedObjects}
                                                    objectAnchors={reconstructedAnchors}
                                                />
                                            </Stage>
                                            <OrbitControls makeDefault enablePan={false} />
                                            <Environment preset="city" />
                                        </Canvas>

                                        <div className="absolute bottom-6 right-6 z-20 flex gap-2">
                                            <button onClick={() => window.open(selectedDesign.appliedFrontDesign, '_blank')} className="bg-white p-3 rounded-full shadow-lg border hover:bg-gray-50 text-gray-600"><FiMaximize2 size={16} /></button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="lg:w-[35%] flex flex-col">
                                <div className="p-8 border-b border-gray-50">
                                    <h2 className="text-xl font-black uppercase tracking-tight">Client Customization Data</h2>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-1 tracking-[0.2em]">Data Sync V2.4</p>
                                </div>
                                
                                <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
                                    <div className="bg-slate-900 text-white p-6 rounded-[2rem] space-y-4 shadow-xl">
                                        <div className="flex justify-between items-center"><span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Client Signature</span><span className="text-[11px] font-black truncate max-w-[140px]">{selectedDesign.email || 'N/A'}</span></div>
                                        <div className="flex justify-between items-center"><span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Product Archetype</span><span className="text-[11px] font-black">{selectedDesign.productType}</span></div>
                                        <div className="flex justify-between items-center"><span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Deployment Scale</span><span className="text-[11px] font-black">{selectedDesign.quantity} Units</span></div>
                                        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                            <span className="text-[9px] font-bold uppercase text-indigo-400 tracking-widest">Protocol Status</span>
                                            <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase">{selectedDesign.status}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-3 ml-2">Internal Production Notes</label>
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Document production complexities or quality control notes..."
                                            className="w-full h-32 bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-indigo-100 transition-all resize-none uppercase"
                                        />
                                    </div>
                                </div>

                                <div className="p-8 bg-white border-t border-gray-100 space-y-3 relative z-10">
                                    <button
                                        disabled={processing || selectedDesign.status === 'Approved'}
                                        onClick={() => handleAction('Approved')}
                                        className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl transition-all flex items-center justify-center gap-2 ${selectedDesign.status === 'Approved' ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-slate-950 text-white hover:bg-emerald-600'}`}
                                    >
                                        <FiCheckCircle /> {selectedDesign.status === 'Approved' ? 'Design Confirmed' : 'Confirm & Authorize Design'}
                                    </button>
                                    
                                    {/* DOWNLOAD FOR PRINT (Only if canvas data available) */}
                                    {(selectedDesign.frontCanvasData || selectedDesign.backCanvasData) ? (
                                        <button
                                            disabled={processing}
                                            onClick={handleDownloadForPrint}
                                            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FiDownload /> Extract Build Pack (.zip)
                                        </button>
                                    ) : (
                                        <div className="bg-gray-100 text-gray-400 py-5 rounded-2xl text-[9px] font-black uppercase text-center tracking-widest border border-dashed border-gray-300">
                                            Production File Required from Client
                                        </div>
                                    )}

                                    <button
                                        disabled={processing || selectedDesign.status === 'Rejected'}
                                        onClick={() => handleAction('Rejected')}
                                        className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedDesign.status === 'Rejected' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white border text-red-500 hover:bg-red-50'}`}
                                    >
                                         {selectedDesign.status === 'Rejected' ? 'Brief Rejected' : 'Reject Assignment'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
            `}</style>
        </div>
    );
};

export default DesignReviewPanel;
