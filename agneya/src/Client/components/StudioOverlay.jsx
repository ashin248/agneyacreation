import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Canvas, createPortal, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, Decal, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import {
    FiType, FiImage, FiEdit3, FiLayers,
    FiPlus, FiTrash2, FiCornerUpLeft, FiCornerUpRight,
    FiArrowUp, FiArrowDown, FiZap, FiX, FiBox, FiActivity,
    FiSmile, FiGrid, FiInfo, FiShoppingBag, FiMaximize, FiMinimize, FiRepeat, FiMove,
    FiShoppingCart, FiArrowRight, FiCreditCard, FiMaximize2, FiMinimize2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { calculateWholesalePriceTotal, calculateSavings } from '../utils/pricingUtils';
import { MODELS } from './Three/ProductLibrary';

const dummyDecal = new THREE.Object3D();

function ProjectedDecalWrapper({ mesh, dataUrl, position, rotation, scale, active, zIndex }) {
    const texture = useTexture(dataUrl);
    
    // Safety: Do not render the decal until the texture is fully loaded
    // This prevents the "white patches" (default material color) from appearing
    if (!texture) return null;

    texture.anisotropy = 16;
    texture.needsUpdate = true;

    return (
        <Decal
            position={position}
            rotation={rotation}
            scale={scale}
            debug={false} 
        >
            <meshStandardMaterial
                map={texture}
                transparent={true}
                alphaTest={0.01} 
                depthTest={true}
                depthWrite={false}
                polygonOffset={true}
                polygonOffsetFactor={-50} // Forced priority to stay on top of frame glass/default textures
                polygonOffsetUnits={-50}
                side={THREE.DoubleSide}
                color={texture ? '#ffffff' : '#000000'}
                opacity={texture ? 1 : 0}
                emissive={active ? '#4f46e5' : '#000000'}
                emissiveIntensity={active ? 0.3 : 0}
            />
        </Decal>
    );
}

// 2. Main 3D Model Component (Hoisted helper)
function Model3D({
    baseModelId, url, canvasObjects, objectAnchors, onAnchorUpdate, onPartSelect,
    activeObjectId, previewRotation = 0
}) {
    const modelGroupRef = useRef();
    const modelKey = baseModelId?.toString().toUpperCase();
    const modelConfig = modelKey ? MODELS[modelKey] : null;
    const modelUrl = modelConfig ? modelConfig.path : url;

    // 1. Initial Logic & Asset Discovery
    let rawUrl = (modelUrl && typeof modelUrl === 'string' && modelUrl.length > 5) ? modelUrl : '/models/mug/mug.glb';
    if (rawUrl.includes('t-shirt.glb') && !rawUrl.includes('oversized')) {
        rawUrl = '/models/Tshirt/oversized_t-shirt.glb'; // legacy interceptor
    }
    const safeModelUrl = rawUrl;

    // 2. Resource Initialization (Hook must come before effects that use its output)
    const { scene } = useGLTF(safeModelUrl);
    const [defaultAnchor, setDefaultAnchor] = useState(null);

    // 3. Effects & Post-Processing
    // CLEANUP LOGIC: Remove default textures from Photoframe models to provide a clean canvas
    useLayoutEffect(() => {
        if (!scene || !modelConfig) return;
        
        const isPhotoframe = modelConfig.category === 'Photoframe';

        scene.traverse((node) => {
            if (node.isMesh) {
                const lowerName = node.name.toLowerCase();
                
                // GLASS PASS-THROUGH: Prevent glass from intercepting clicks meant for photos
                if (lowerName.includes('glass')) {
                    node.raycast = () => null; // Make invisible to Raycaster
                    if (node.material) {
                        node.material = node.material.clone();
                        node.material.transparent = true;
                        node.material.opacity = 0.4;
                        node.material.needsUpdate = true;
                    }
                }

                // Photoframes: Proactive "Blank Canvas" logic
                // Strip ALL maps from photo areas or anything that isn't clearly the wall
                const isWallOrBase = lowerName.includes('wall') || lowerName.includes('base') || lowerName.includes('ground');
                const shouldStrip = isPhotoframe && !isWallOrBase && node.material?.map;

                if (shouldStrip) {
                    node.material = node.material.clone();
                    // Strip ALL maps to ensure a completely blank canvas
                    node.material.map = null;
                    node.material.lightMap = null;
                    node.material.aoMap = null;
                    node.material.emissiveMap = null;
                    node.material.metalnessMap = null;
                    node.material.roughnessMap = null;
                    
                    node.material.color.set('#ffffff'); // Pure blank white
                    node.material.roughness = 0.9;
                    node.material.metalness = 0.0;
                    node.material.needsUpdate = true;
                } else if (node.material && node.material.roughness !== undefined) {
                     node.material.roughness = 0.6;
                }
            }
        });
    }, [scene, modelConfig]);


    useEffect(() => {
        let bestTarget = null;
        let largestArea = 0;
        const priorityNamesFromLibrary = modelConfig?.printableMeshes || [];
        const genericPriorityNames = [
            'mug_again', '191,191,191',
            'printable_area', 'design_area', 'main_body', 'body', 'shirt', 'front', 'surface'
        ];

        scene.traverse((child) => {
            if (child.isMesh) {
                const name = child.name || '';
                const lowerName = name.toLowerCase();
                const isPhotoframe = modelConfig?.category === 'Photoframe';

                if (priorityNamesFromLibrary?.includes(name)) {
                    bestTarget = child;
                    return;
                }
                const isGenericPriority = genericPriorityNames.some(p => lowerName.includes(p));
                let isAuxiliary = lowerName.includes('handle') || 
                    lowerName.includes('bottom') || lowerName.includes('sole') ||
                    lowerName.includes('lace') || lowerName.includes('decal') ||
                    lowerName.includes('shadow');
                
                // Exception for photoframes: 'inside' meshes ARE printable areas
                if (!isPhotoframe && lowerName.includes('inside')) isAuxiliary = true;

                if (isGenericPriority && !isAuxiliary && !bestTarget) {
                    bestTarget = child;
                }
                if (!isAuxiliary && !bestTarget) {
                    child.geometry.computeBoundingBox();
                    const box = child.geometry.boundingBox;
                    const area = (box.max.x - box.min.x) * (box.max.y - box.min.y);
                    if (area > largestArea) {
                        largestArea = area;
                        bestTarget = child;
                    }
                }
            }
        });

        if (bestTarget) {
            bestTarget.geometry.computeBoundingBox();
            const box = bestTarget.geometry.boundingBox;
            
            const w = (box.max.x - box.min.x);
            const h = (box.max.y - box.min.y);
            const d = (box.max.z - box.min.z);
            
            // Smarter default anchor: Look for the 'Front' face by inspecting normals if possible
            // or default to a safe standard for the given model category
            const isPlanar = modelConfig?.projectionType === 'planar' || 
                             modelConfig?.projectionType === 'decal' ||
                             modelConfig?.category === 'Photoframe' ||
                             !modelConfig?.projectionType;
                             
            const defaultPos = isPlanar ? 
                [(box.max.x + box.min.x) / 2, box.max.y, (box.max.z + box.min.z) / 2] : // Center Top for flat items
                [(box.max.x + box.min.x) / 2, (box.max.y + box.min.y) / 2, box.max.z];  // Center Front for mugs
                
            const defaultRot = isPlanar ? [-Math.PI / 2, 0, 0] : [0, 0, 0];

            setDefaultAnchor({
                meshId: bestTarget.uuid,
                meshName: bestTarget.name,
                pos: defaultPos,
                rot: defaultRot,
                dim: [w, h, d]
            });
        }
    }, [scene, modelConfig]);

    const handleMeshClick = (e) => {
        e.stopPropagation();
        const clickedMesh = e.object;
        if (!clickedMesh.isMesh) return;
        
        const lowerName = clickedMesh.name.toLowerCase();
        console.log("3D Selection Clicked:", lowerName, clickedMesh.uuid); // CRITICAL DEBUG LOG

        // Strict Model Selection Guard: Prevent selecting non-printable parts (like handles)
        // For Photoframes, we want to be much more permissive as almost every part is a frame
        const isPhotoframe = modelConfig?.category === 'Photoframe';

        if (modelConfig?.printableMeshes && modelConfig.printableMeshes.length > 0) {
            if (!modelConfig.printableMeshes.some(p => lowerName.includes(p.toLowerCase()) || p.toLowerCase().includes(lowerName))) {
                if (!isPhotoframe) return; // Ignore clicks on non-printable areas ONLY if not a photoframe
            }
        } else {
            // Fallback generic guard
            let isAuxiliary = lowerName.includes('handle') || 
                lowerName.includes('bottom') || lowerName.includes('sole') ||
                lowerName.includes('shadow') || lowerName.includes('decal');
            
            // Note: 'inside' is usually auxiliary for mugs/boxes, but for photo frames it is the photo area!
            if (!isPhotoframe && lowerName.includes('inside')) isAuxiliary = true;

            if (isAuxiliary) return;
        }
        
        const localPos = clickedMesh.worldToLocal(e.point.clone());
        const localNormal = e.face ? e.face.normal.clone() : new THREE.Vector3(0, 0, 1);
        
        // Robust orientation logic: Handles vertical normals (horizontal surfaces)
        const dummyNode = new THREE.Object3D();
        dummyNode.position.copy(localPos);
        
        // Use a different 'Up' vector if the normal is nearly vertical to avoid Gimbal lock
        const upVector = Math.abs(localNormal.y) > 0.99 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
        
        const targetPoint = localPos.clone().sub(localNormal); // MIRROR FIX: Look IN to the mesh
        const m4 = new THREE.Matrix4();
        m4.lookAt(localPos, targetPoint, upVector);
        dummyNode.quaternion.setFromRotationMatrix(m4);
        
        const rot = [dummyNode.rotation.x, dummyNode.rotation.y, dummyNode.rotation.z];
        
        const scale = new THREE.Vector3();
        clickedMesh.getWorldScale(scale);
        
        // Push the position minimally outward along the normal to prevent Z-fighting without missing the surface
        const pushedPos = localPos.clone().add(localNormal.clone().multiplyScalar(0.001));

        clickedMesh.geometry.computeBoundingBox();
        const box = clickedMesh.geometry.boundingBox;
        const newAnchor = {
            meshId: clickedMesh.uuid,
            meshName: clickedMesh.name,
            pos: [pushedPos.x, pushedPos.y, pushedPos.z],
            rot,
            dim: [
                (box.max.x - box.min.x),
                (box.max.y - box.min.y),
                (box.max.z - box.min.z)
            ]
        };

        if (onAnchorUpdate) onAnchorUpdate(newAnchor);
        if (onPartSelect) onPartSelect(clickedMesh.name);
    };

    return (
        <group>
            <group ref={modelGroupRef} 
                rotation={[0, (previewRotation * Math.PI) / 180, 0]} 
            >
                {scene && (
                    <primitive
                        object={scene}
                        scale={modelConfig?.defaultScale || 1.5}
                        rotation={modelConfig?.defaultRotation || [0, 0, 0]}
                        position={modelConfig?.defaultPosition || [0, 0, 0]}
                        onPointerDown={handleMeshClick}
                    />
                )}
            </group>
            {canvasObjects && canvasObjects.map((obj, index) => {
                if (!obj || !obj.dataUrl) return null;
                const active = activeObjectId === obj.uid;
                const anchor = objectAnchors[obj.uid] || defaultAnchor;
                if (!anchor) return null;
                let targetMesh = null;
                if (modelGroupRef.current) {
                    if (anchor.meshName) targetMesh = modelGroupRef.current.getObjectByName(anchor.meshName);
                    if (!targetMesh) targetMesh = modelGroupRef.current.getObjectByProperty('uuid', anchor.meshId);
                }
                if (!targetMesh) return null;

                const isPlanar = modelConfig?.projectionType === 'planar' || 
                                 modelConfig?.projectionType === 'decal' || 
                                 modelConfig?.category === 'Photoframe' ||
                                 !modelConfig?.projectionType;
                
                let finalPos = [...anchor.pos];
                let finalRotation = [anchor.rot[0], anchor.rot[1], anchor.rot[2]];
                
                // Use the largest mesh dimension for stable unit scaling on flat surfaces
                const maxDim = Math.max(anchor.dim[0], anchor.dim[1], anchor.dim[2]);
                const pixelsPerUnitUniform = obj.canvasHeight / (isPlanar ? maxDim : anchor.dim[1]);
                const decalWidth = (obj.width * Math.abs(obj.scaleX || 1)) / pixelsPerUnitUniform;
                const decalHeight = (obj.height * Math.abs(obj.scaleY || 1)) / pixelsPerUnitUniform;
                // Robust depth logic: Apparel needs deep projection for wrinkles, flat goods need shallow depth
                let decalDepth = isPlanar ? 
                    (modelConfig?.category === 'Tshirt' ? 0.15 : 
                     modelConfig?.category === 'Plate' ? 0.015 : 
                     modelConfig?.category === 'Photoframe' ? 0.05 : 0.02) 
                    : 1;

                if (isPlanar) {
                    // PLANAR MAPPING (For Books, Sheets, etc.)
                    // Use a lookAt dummy to find the specific local axes of the clicked surface
                    dummyDecal.position.set(0, 0, 0);
                    dummyDecal.rotation.set(anchor.rot[0], anchor.rot[1], anchor.rot[2]);
                    dummyDecal.updateMatrixWorld();
                    
                    const localX = new THREE.Vector3(1, 0, 0).applyQuaternion(dummyDecal.quaternion);
                    const localY = new THREE.Vector3(0, 1, 0).applyQuaternion(dummyDecal.quaternion);
                    
                    // Map canvas offsets to the surface geometry
                    const xShift = obj.offsetX * (maxDim * 0.5);
                    const yShift = -obj.offsetY * (maxDim * 0.5);
                    
                    finalPos[0] += localX.x * xShift + localY.x * yShift;
                    finalPos[1] += localX.y * xShift + localY.y * yShift;
                    finalPos[2] += localX.z * xShift + localY.z * yShift;

                    dummyDecal.rotateZ(obj.rotation * Math.PI / 180);
                    finalRotation = [dummyDecal.rotation.x, dummyDecal.rotation.y, dummyDecal.rotation.z];
                } else {
                    // CYLINDRICAL WRAPPING (For Mugs)
                    const trueDiameter = Math.min(anchor.dim[0], anchor.dim[2]);
                    const radius = trueDiameter * 0.5;
                    const wrapAngle = -obj.offsetX * (Math.PI / 1.5);
                    const yOffset = -obj.offsetY * (anchor.dim[1] * 0.5);
                    
                    finalPos[0] = anchor.pos[0] + radius * Math.sin(wrapAngle);
                    finalPos[1] = anchor.pos[1] + yOffset;
                    finalPos[2] = anchor.pos[2] - radius * (1 - Math.cos(wrapAngle));

                    dummyDecal.rotation.set(anchor.rot[0], anchor.rot[1], anchor.rot[2]);
                    dummyDecal.rotateY(-wrapAngle);
                    dummyDecal.rotateZ(obj.rotation * Math.PI / 180);
                    finalRotation = [dummyDecal.rotation.x, dummyDecal.rotation.y, dummyDecal.rotation.z];
                    decalDepth = radius * 1.5;
                }

                return (
                    <group key={`portal-${obj.uid}`}>
                        {createPortal(
                            <React.Suspense fallback={null}>
                                <ProjectedDecalWrapper
                                    mesh={targetMesh}
                                    dataUrl={obj.dataUrl}
                                    position={finalPos}
                                    rotation={finalRotation}
                                    scale={[decalWidth, decalHeight, decalDepth]}
                                    active={active}
                                    zIndex={index * 2}
                                />
                            </React.Suspense>,
                            targetMesh
                        )}
                    </group>
                );
            })}
        </group>
    );
};

const StudioOverlay = ({ isOpen, onClose, product, requireLogin, initialMode = 'self' }) => {
    const { userData } = useAuth();
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [designMode, setDesignMode] = useState(initialMode); // 'self' or 'company'
    const [companyInstructions, setCompanyInstructions] = useState('');
    const [companyReferences, setCompanyReferences] = useState([]);
    const [activeStudioView, setActiveStudioView] = useState('3D'); // '2D' or '3D'
    const [isMobileUiMinimized, setIsMobileUiMinimized] = useState(false);
    const [contextKey, setContextKey] = useState(0); 




    const [activeTab, setActiveTab] = useState('uploads');
    const [viewSide, setViewSide] = useState('front'); // 'front' or 'back' for 2D mode
    const [previewRotation] = useState(0);
    const [brushSize, setBrushSize] = useState(10);
    const [brushColor, setBrushColor] = useState('#0c0c2a');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRemovingBg, setIsRemovingBg] = useState(false);

    const [variations, setVariations] = useState([{ 
        id: Date.now(), name: 'Item 1', 
        frontCanvasData: null, frontCanvasObjects: [], frontAnchors: {},
        backCanvasData: null, backCanvasObjects: [], backAnchors: {} 
    }]);
    const [activeVariationId, setActiveVariationId] = useState(variations[0].id);

    const historyRef = useRef([]);
    const [historyStep, setHistoryStep] = useState(-1);
    const isHistoryRecording = useRef(false);

    const [canvasObjects, setCanvasObjects] = useState([]);
    const [objectAnchors, setObjectAnchors] = useState({});
    const [pendingAnchor, setPendingAnchor] = useState(null); // Stores click target if no asset is selected
    const [activeObject, setActiveObject] = useState(null);
    const [uploadedAssets, setUploadedAssets] = useState([]);

    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const fileRef = useRef(null);
    const viewportRef = useRef(null);
    const [canvasScale, setCanvasScale] = useState(1);

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
            setPendingAnchor(null); // Clear pending if we have active
        } else {
            setPendingAnchor(anchorData); // Store for next upload
            toast.success("Frame Target Selected", { icon: '🎯', style: { borderRadius: '15px', background: '#0c0c2a', color: '#fff', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' } });
        }
    }, []);

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

    useEffect(() => {
        if (!isOpen || !canvasRef.current || !viewportRef.current) return;
        
        const baseWidth = 500;
        const baseHeight = 600;
        
        const canvas = new fabric.Canvas(canvasRef.current, { 
            width: baseWidth, 
            height: baseHeight, 
            backgroundColor: 'transparent', 
            preserveObjectStacking: true 
        });
        fabricRef.current = canvas;

        // Resize Observer for Dynamic Scaling
        const resizeObserver = new ResizeObserver(entries => {
            if (!entries[0] || !fabricRef.current) return;
            const { width, height } = entries[0].contentRect;
            
            // Calculate scale to fit within container while maintaining aspect
            const scaleX = width / baseWidth;
            const scaleY = height / baseHeight;
            const newScale = Math.min(scaleX, scaleY, 1.2) * 0.95; // 0.95 for safe padding
            
            setCanvasScale(newScale);
            
            // Adjust canvas display size without changing internal coordinate space
            canvas.setDimensions({
                width: baseWidth * newScale,
                height: baseHeight * newScale
            }, { cssOnly: true });
            
            canvas.setZoom(newScale);
        });

        resizeObserver.observe(viewportRef.current);

        fabric.Object.prototype.set({
            cornerColor: '#0c0c2a', cornerStrokeColor: '#ffffff', cornerStyle: 'circle',
            transparentCorners: false, cornerSize: 10, borderColor: '#0c0c2a', borderScaleFactor: 2, padding: 10
        });

        const saveHistory = () => {
            if (isHistoryRecording.current) return;
            const json = canvas.toJSON(['uid', 'excludeFromExport']);
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
                left: active.left, top: active.top, text: active.text || ''
            });
            setIsMobileUiMinimized(false);
        };

        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', () => setActiveObject(null));
        canvas.on('object:moving', fastSync);
        canvas.on('object:scaling', fastSync);
        canvas.on('object:rotating', fastSync);
        canvas.on('object:modified', () => { updateTexture(true); saveHistory(); });
        canvas.on('object:added', () => { updateTexture(true); saveHistory(); });
        canvas.on('object:removed', () => { updateTexture(true); saveHistory(); });
        canvas.on('path:created', () => { updateTexture(true); saveHistory(); });

        return () => {
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
    }, [isOpen, product?.customizationType, fastSync, updateTexture]);

    useEffect(() => {
        if (historyStep === -1 || isHistoryRecording.current || !fabricRef.current) return;
        isHistoryRecording.current = true;
        fabricRef.current.loadFromJSON(historyRef.current[historyStep]).then(() => {
            fabricRef.current.renderAll();
            updateTexture(true);
            isHistoryRecording.current = false;
        });
    }, [historyStep, updateTexture]);

    // Product Isolation: Reset state when product changes or studio toggles
    useEffect(() => {
        const resetStudio = () => {
            setCanvasObjects([]);
            setUploadedAssets([]);
            setObjectAnchors({});
            setPendingAnchor(null);
            historyRef.current = [];
            setHistoryStep(-1);
            setActiveObject(null);
            if (fabricRef.current) {
                fabricRef.current.clear();
                fabricRef.current.backgroundColor = 'transparent';
                fabricRef.current.renderAll();
            }
        };

        if (isOpen) {
            resetStudio();
            setDesignMode(initialMode);
            // Strict View Selection: Directly driven by Admin's customizationType
            if (product?.customizationType === '3D') {
                setActiveStudioView('3D');
            } else {
                setActiveStudioView('2D');
            }
        } else {
            resetStudio(); // Clean up on close to be safe
        }
    }, [product?._id, isOpen]);

    const [isDrawing, setIsDrawing] = useState(false);

    // Sync Drawing Mode
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
        const currentData = fabricRef.current.toJSON(['uid', 'excludeFromExport']);
        setVariations(prev => prev.map(v => v.id === activeVariationId ? {
            ...v, 
            [`${viewSide}CanvasData`]: currentData,
            [`${viewSide}CanvasObjects`]: [...canvasObjects],
            [`${viewSide}Anchors`]: {...objectAnchors}
        } : v));
    }, [activeVariationId, canvasObjects, objectAnchors, viewSide]);

    const addVariation = () => {
        saveCurrentToVariation();
        const newId = Date.now();
        const newItem = { 
            id: newId, name: `Item ${variations.length + 1}`, 
            frontCanvasData: null, frontCanvasObjects: [], frontAnchors: {},
            backCanvasData: null, backCanvasObjects: [], backAnchors: {}
        };
        setVariations(prev => [...prev, newItem]);
        setActiveVariationId(newId);
        if (fabricRef.current) fabricRef.current.clear();
        setCanvasObjects([]);
        setObjectAnchors({});
        historyRef.current = [];
        setHistoryStep(-1);
    };

    const removeVariation = (id) => {
        if (variations.length <= 1) return;
        const remaining = variations.filter(v => v.id !== id);
        setVariations(remaining);
        if (activeVariationId === id) {
            switchVariation(remaining[remaining.length - 1].id);
        }
    };

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

    const handleSwitchSide = (side) => {
        if (side === viewSide) return;
        
        // 1. Capture current side
        if (fabricRef.current) {
            const currentData = fabricRef.current.toJSON(['uid', 'excludeFromExport']);
            
            setVariations(prev => {
                // Update current variation with what we just captured
                const updatedVars = prev.map(v => v.id === activeVariationId ? {
                    ...v,
                    [`${viewSide}CanvasData`]: currentData,
                    [`${viewSide}CanvasObjects`]: [...canvasObjects],
                    [`${viewSide}Anchors`]: {...objectAnchors}
                } : v);
                
                // 2. Switch side state and load the target side data
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
                    if (!canvas) { console.error('Canvas missing'); return; }
                    
                    const ImgClass = fabric.FabricImage || fabric.Image;
                    const img = new ImgClass(imgElement, {
                        width: imgElement.naturalWidth || imgElement.width || 100,
                        height: imgElement.naturalHeight || imgElement.height || 100
                    });
                    
                    const targetWidth = canvas.width ? canvas.width * 0.4 : 200;
                    img.scaleToWidth(targetWidth);
                    const uid = `upload_${Date.now()}`;
                    img.set({ originX: 'center', originY: 'center', left: canvas.width ? canvas.width / 2 : 250, top: canvas.height ? canvas.height / 2 : 300, uid });
                    
                    if (pendingAnchor) {
                        setObjectAnchors(prev => ({ ...prev, [uid]: pendingAnchor }));
                        setPendingAnchor(null);
                    }

                    canvas.add(img);
                    canvas.setActiveObject(img);
                    canvas.renderAll();
                    updateTexture(true); // Ensure texture sync runs
                } catch (err) {
                    console.error("Fabric Upload Error:", err);
                }
            };
            imgElement.onerror = (e) => console.error("Image Element failed to load", e);
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

        if (pendingAnchor) {
            setObjectAnchors(prev => ({ ...prev, [uid]: pendingAnchor }));
            setPendingAnchor(null);
        }

        fabricRef.current.add(itext);
        fabricRef.current.setActiveObject(itext);
        fabricRef.current.renderAll();
        updateTexture();
    };

    const addSticker = async (svgString) => {
        const { objects, options } = await fabric.loadSVGFromString(svgString);
        const obj = fabric.util.groupSVGElements(objects, options);
        const uid = `sticker_${Date.now()}`;
        obj.set({ left: 250, top: 300, originX: 'center', originY: 'center', fill: brushColor, uid });
        obj.scaleToWidth(150);

        if (pendingAnchor) {
            setObjectAnchors(prev => ({ ...prev, [uid]: pendingAnchor }));
            setPendingAnchor(null);
        }

        fabricRef.current.add(obj);
        fabricRef.current.setActiveObject(obj);
        fabricRef.current.renderAll();
        updateTexture();
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
                const img = new fabric.FabricImage(imgElement, {
                    width: imgElement.naturalWidth || imgElement.width,
                    height: imgElement.naturalHeight || imgElement.height
                });
                img.set({ left: activeObj.left, top: activeObj.top, scaleX: activeObj.scaleX, scaleY: activeObj.scaleY, angle: activeObj.angle, uid: `ai_${Date.now()}` });
                fabricRef.current.remove(activeObj);
                fabricRef.current.add(img);
                fabricRef.current.setActiveObject(img);
                fabricRef.current.renderAll();
                updateTexture();
            };
            imgElement.src = url;
        } catch (e) { toast.error("AI Sync Error."); } finally { setIsRemovingBg(false); }
    };

    const handleDiscardDraft = () => {
        if (fabricRef.current) {
            fabricRef.current.getObjects().filter(o => !o.excludeFromExport).forEach(o => fabricRef.current.remove(o));
            fabricRef.current.clear();
            fabricRef.current.backgroundColor = 'transparent';
            fabricRef.current.renderAll();
        }
        setCanvasObjects([]);
        setObjectAnchors({});
        toast.success("Design Cleared.");
    };

    const handlePurgeGallery = () => {
        setUploadedAssets([]);
        toast.success("Gallery Purged.");
    };

    const handleFinalSubmit = async (isBuyNow = false) => {
        if (!userData) return requireLogin(() => handleFinalSubmit(isBuyNow), "finalize your order");
        
        if (designMode === 'company' && !companyInstructions.trim() && companyReferences.length === 0) {
            return toast.error("Please provide instructions or reference images.");
        }

        setIsSubmitting(true);
        saveCurrentToVariation();
        
        try {
            // Process ALL variations
            const allItems = variations.map(v => {
                const isCurrent = v.id === activeVariationId && fabricRef.current;
                const frontData = isCurrent && viewSide === 'front' ? fabricRef.current.toJSON(['uid', 'excludeFromExport']) : v.frontCanvasData;
                const backData = isCurrent && viewSide === 'back' ? fabricRef.current.toJSON(['uid', 'excludeFromExport']) : v.backCanvasData;
                
                const designPayload = designMode === 'self' 
                    ? { mode: 'self', frontCanvasData: frontData, backCanvasData: backData }
                    : { mode: 'company', instructions: companyInstructions, references: companyReferences };
                
                const wMin = (product.isBulkEnabled && product.bulkRules?.length > 0) ? Math.min(...product.bulkRules.map(r=>r.minQty)) : (product.minOrder || 1);
                const itemQty = isBuyNow ? 1 : wMin;
                
                const frontSnapshot = isCurrent && viewSide === 'front' ? fabricRef.current.toDataURL({ format: 'png', quality: 0.8, multiplier: 1.0 }) : null;
                const backSnapshot = isCurrent && viewSide === 'back' ? fabricRef.current.toDataURL({ format: 'png', quality: 0.8, multiplier: 1.0 }) : null;

                return {
                    productId: product._id,
                    name: `[Custom] ${product.name} - ${v.name}`,
                    unitPrice: product.discountPrice || product.basePrice,
                    quantity: itemQty,
                    itemType: 'Custom',
                    selectedVariation: { sku: `custom_${v.id}`, size: 'Custom' },
                    image: frontSnapshot || backSnapshot || product.thumbnail || product.images?.[0], // The preview mockup
                    designImage: frontSnapshot || backSnapshot || product.thumbnail || product.images?.[0], 
                    isBulkEnabled: product.isBulkEnabled,
                    bulkRules: product.bulkRules,
                    gstRate: product.gstRate || 0,
                    customData: { 
                        design: designPayload, 
                        variationName: v.name,
                        appliedFrontDesign: frontSnapshot,
                        appliedBackDesign: backSnapshot 
                    }
                };
            });

            if (isBuyNow) {
                navigate('/checkout', { state: { buyNowItems: allItems } });
            } else {
                for (const item of allItems) {
                    await addToCart(item);
                }
                toast.success(`${allItems.length} Designs Synced.`);
                onClose();
                navigate('/cart');
            }
        } catch (e) {
            toast.error("Execution Failure.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeAsset = (id) => {
        setUploadedAssets(prev => prev.filter(a => a.id !== id));
        toast.success("Asset Purged.");
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1000] bg-[#fafafa] flex flex-col transition-all duration-500 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <style>{`
                .pill-btn { border-radius: 9999px; transition: all 0.3s; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em; font-size: 10px; }
                .floating-card { background: white; border-radius: 42px; box-shadow: 0 20px 50px rgba(0,0,0,0.04); border: 1px solid rgba(255,255,255,0.8); }
                .accent-btn { background: #0c0c2a; color: white; }
                .accent-btn:hover { background: #1a1a4a; }
                input[type=range] { -webkit-appearance: none; background: #f0f1f4; height: 6px; border-radius: 3px; }
                input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #0c0c2a; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>

            <header className="h-[100px] shrink-0 px-4 sm:px-10 flex items-center justify-between z-[100] border-b border-slate-100 bg-white/50 backdrop-blur-3xl">
                <button onClick={onClose} className="w-12 h-12 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all active:scale-90"><FiX size={24}/></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-sm sm:text-xl font-bold text-[#0c0c2a] tracking-tight truncate max-w-[150px] sm:max-w-none">{product?.name || 'Agneya Design'}</h1>
                    <div className="flex bg-slate-100 p-1 rounded-full mt-2">
                        {product.customizationType !== 'None' && (
                            <button onClick={() => setDesignMode('self')} className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${designMode === 'self' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Customer Designs</button>
                        )}
                        <button onClick={() => setDesignMode('company')} className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${designMode === 'company' || product.customizationType === 'None' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Design Assistance</button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-[1px] h-8 bg-slate-100 mx-2" />
                    <div className="w-[40px]"></div> {/* Spacer for symmetry */}
                </div>
            </header>

            <main className="flex-1 relative flex flex-col xl:flex-row px-0 sm:px-10 pb-0 sm:pb-10 gap-0 sm:gap-8 min-h-0 min-w-0 overflow-hidden">
                {designMode === 'self' ? (
                    <>
                    {/* Variation Selector - Floating at top */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-slate-100 shadow-2xl z-[100] max-w-[90%] overflow-x-auto no-scrollbar">
                        {variations.map((v, i) => (
                            <div key={v.id} className="flex items-center">
                                <button onClick={() => switchVariation(v.id)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeVariationId === v.id ? 'bg-[#0c0c2a] text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>
                                    <span>{v.name}</span>
                                    {variations.length > 1 && (
                                        <FiX onClick={(e) => { e.stopPropagation(); removeVariation(v.id); }} className="hover:text-rose-500 cursor-pointer" />
                                    )}
                                </button>
                                {i < variations.length - 1 && <div className="w-[1px] h-4 bg-slate-100 mx-1" />}
                            </div>
                        ))}
                        <button onClick={addVariation} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all ml-2 shadow-sm">
                            <FiPlus size={14} />
                        </button>
                    </div>

                    {/* Left Panel: High-Contrast Desktop Designer Tools */}
                    <div className="hidden xl:flex w-[320px] flex-col gap-6">
                        <div className="floating-card flex-1 p-8 flex flex-col gap-6 overflow-y-auto no-scrollbar border border-slate-100 shadow-xl bg-white/95">
                            <div className="space-y-2 mb-2">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.30em] text-[#0c0c2a]/40">Creation Suite</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => addText()} className="h-20 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-[#0c0c2a] hover:text-white transition-all group active:scale-95 shadow-sm">
                                        <FiType size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Add Text</span>
                                    </button>
                                    <button onClick={() => document.getElementById('desktop-image-upload')?.click()} className="h-20 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-[#0c0c2a] hover:text-white transition-all group active:scale-95 shadow-sm">
                                        <FiImage size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Add Image</span>
                                    </button>
                                    <input id="desktop-image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                    <button onClick={() => setIsDrawing(!isDrawing)} className={`h-14 col-span-2 rounded-2xl flex items-center justify-center gap-3 font-black text-[9px] uppercase tracking-widest transition-all ${isDrawing ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-50 text-[#0c0c2a] border border-slate-100 hover:bg-slate-100'}`}>
                                        <FiZap size={14}/> {isDrawing ? 'Stop Drawing' : 'Ink Mode'}
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100 w-full" />

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.30em] text-[#0c0c2a]/40">Designer Tools</h4>
                                <div className="flex items-center gap-2">
                                    <div className="h-1 w-8 bg-[#0c0c2a] rounded-full"></div>
                                    <span className="text-[11px] font-black uppercase text-[#0c0c2a]">{activeObject ? activeObject.type : 'Master Studio'}</span>
                                </div>
                            </div>

                            {/* Theme Palette (Visible for both global and selected) */}
                            <div className="space-y-4">
                                <div className="text-[10px] font-black text-[#0c0c2a]/60 uppercase tracking-widest">Theme Palette</div>
                                <div className="grid grid-cols-5 gap-3">
                                    {['#0c0c2a', '#3b82f6', '#ec4899', '#fbbf24', '#ffffff', '#ef4444', '#10b981', '#6366f1', '#f97316', '#000000'].map((color, i) => (
                                        <button key={i} onClick={() => { 
                                            const active = fabricRef.current?.getActiveObject(); 
                                            if(active) { active.set('fill', color); active.set('stroke', color); fabricRef.current.renderAll(); updateTexture(); setActiveObject({...active, fill: color}); } 
                                            setBrushColor(color);
                                        }} className={`aspect-square rounded-full border-2 transition-all ${brushColor === color ? 'border-[#0c0c2a] scale-110 shadow-md' : 'border-slate-100 hover:border-[#0c0c2a]/20'}`} style={{ backgroundColor: color }}></button>
                                    ))}
                                </div>
                            </div>

                            {activeObject ? (
                                <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
                                    {/* Property Matrix */}
                                    <div className="grid gap-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Scale Matrix</span><span>{Math.round(activeObject.scaleX * 100)}%</span></div>
                                            <input type="range" min="0.1" max="5" step="0.1" value={activeObject.scaleX} onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                const active = fabricRef.current.getActiveObject();
                                                active.set({scaleX: val, scaleY: val}).setCoords();
                                                fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({...prev, scaleX: val}));
                                            }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Angular Rotation</span><span>{Math.round(activeObject.angle)}°</span></div>
                                            <input type="range" min="0" max="360" value={activeObject.angle} onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                const active = fabricRef.current.getActiveObject();
                                                active.set('angle', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({...prev, angle: val}));
                                            }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Pos X</span><span>{Math.round(activeObject.left)}</span></div>
                                                <input type="range" min="0" max="500" value={activeObject.left} onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    const active = fabricRef.current.getActiveObject();
                                                    active.set('left', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({...prev, left: val}));
                                                }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Pos Y</span><span>{Math.round(activeObject.top)}</span></div>
                                                <input type="range" min="0" max="600" value={activeObject.top} onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    const active = fabricRef.current.getActiveObject();
                                                    active.set('top', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({...prev, top: val}));
                                                }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Layer Opacity</span><span>{Math.round(activeObject.opacity * 100)}%</span></div>
                                            <input type="range" min="0" max="1" step="0.01" value={activeObject.opacity} onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                const active = fabricRef.current.getActiveObject();
                                                active.set('opacity', val); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({...prev, opacity: val}));
                                            }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                        </div>
                                    </div>

                                    {/* Typography Suite */}
                                    {(activeObject.type === 'i-text' || activeObject.type === 'text') && (
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-[#0c0c2a]/60 uppercase tracking-widest">Update Design Text</h4>
                                                <textarea value={activeObject.text} onChange={(e) => {
                                                    const val = e.target.value;
                                                    const active = fabricRef.current.getActiveObject();
                                                    active.set('text', val); 
                                                    fabricRef.current.renderAll(); 
                                                    fastSync(); 
                                                    setActiveObject(prev => ({...prev, text: val}));
                                                    if (window.textSyncTimer) clearTimeout(window.textSyncTimer);
                                                    window.textSyncTimer = setTimeout(() => {
                                                        updateTexture(true);
                                                    }, 300);
                                                }} className="w-full h-28 bg-slate-50 border border-slate-100 rounded-3xl p-6 text-[14px] font-bold text-[#0c0c2a] focus:bg-white focus:border-[#0c0c2a]/20 transition-all outline-none resize-none" placeholder="Type here..." />
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-[#0c0c2a]/60 uppercase tracking-widest leading-relaxed">Studio Fonts</h4>
                                                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2 no-scrollbar">
                                                    {premiumFonts.map(font => (
                                                        <button key={font} onClick={() => {
                                                            const active = fabricRef.current.getActiveObject();
                                                            active.set('fontFamily', font); fabricRef.current.renderAll(); updateTexture(); setActiveObject({...active, fontFamily: font});
                                                        }} className={`h-11 rounded-[14px] text-[10px] border transition-all font-black uppercase tracking-tighter ${activeObject.fontFamily === font ? 'bg-[#0c0c2a] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-[#0c0c2a]/10'}`} style={{ fontFamily: font }}>{font}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Object Actions */}
                                    <div className="space-y-3 pt-4 border-t border-slate-50">
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => { fabricRef.current.centerObject(fabricRef.current.getActiveObject()); fabricRef.current.renderAll(); updateTexture(); }} className="h-14 bg-slate-50 text-[#0c0c2a] rounded-2xl flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-all active:scale-95"><FiMove size={14}/> Center Obj</button>
                                            <button onClick={() => {
                                                const active = fabricRef.current.getActiveObject();
                                                active.clone().then(cloned => {
                                                    cloned.set({ left: active.left + 20, top: active.top + 20, uid: `clone_${Date.now()}` });
                                                    fabricRef.current.add(cloned); fabricRef.current.setActiveObject(cloned); fabricRef.current.renderAll(); updateTexture();
                                                });
                                            }} className="h-14 bg-slate-50 text-[#0c0c2a] rounded-2xl flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-all active:scale-95"><FiRepeat size={14}/> Clone</button>
                                        </div>
                                        <button onClick={() => { fabricRef.current.remove(fabricRef.current.getActiveObject()); fabricRef.current.renderAll(); updateTexture(); setActiveObject(null); }} className="w-full h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all active:scale-95"><FiTrash2 size={16}/> Delete Layer</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 rounded-[48px] border-2 border-dashed border-slate-100">
                                    <FiBox size={40} className="text-slate-200 mb-6 animate-pulse"/>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] leading-relaxed">Select Layer<br/>to Configure</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Center Viewport */}
                    <div className="flex-1 flex flex-col relative h-full">

                                {isDrawing && (
                                    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[200]">
                                        <button onClick={() => setIsDrawing(false)} className="px-8 h-12 bg-rose-500 text-white rounded-full shadow-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 animate-bounce">
                                            <FiX/> Exit Ink Mode
                                        </button>
                                    </div>
                                )}

                                <div className="flex-1 flex items-center justify-center relative">
                                    <div ref={viewportRef} id="studio-design-viewport" className="w-full h-full relative z-10 bg-white/50 rounded-[40px] overflow-hidden shadow-inner">
                                        {/* View Multiplexer: Conditional Rendering based on activeStudioView */}
                                        {activeStudioView === '2D' ? (
                                            <div className="w-full h-full flex items-center justify-center relative bg-slate-100/30">
                                                {/* Blueprint Background */}                                                <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-12">
                                                    <div className="relative aspect-[5/6] h-full flex items-center justify-center shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden bg-white group">
                                                         <img 
                                                            src={viewSide === 'front' ? product.blankFrontImage : product.blankBackImage} 
                                                            className="w-full h-full object-contain"
                                                            alt="Product Base"
                                                         />
                                                         {/* Fabric.js Canvas Overlay */}
                                                         <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                                                               <div className="pointer-events-auto" style={{ width: `${500 * canvasScale}px`, height: `${600 * canvasScale}px` }}>
                                                                     <canvas ref={canvasRef} />
                                                               </div>
                                                         </div>
                                                         
                                                         {/* Quick Side Toggle */}
                                                         {(product.blankFrontImage && product.blankBackImage) && (
                                                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex bg-white/90 backdrop-blur-md p-1 rounded-2xl shadow-xl z-30 border border-slate-100">
                                                                <button onClick={() => handleSwitchSide('front')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewSide === 'front' ? 'bg-[#0c0c2a] text-white' : 'text-slate-400 hover:text-slate-900'}`}>Front View</button>
                                                                <button onClick={() => handleSwitchSide('back')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewSide === 'back' ? 'bg-[#0c0c2a] text-white' : 'text-slate-400 hover:text-slate-900'}`}>Back View</button>
                                                            </div>
                                                         )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* 3D DESIGN MODE: Interactive Three.js Studio with Calibrated Viewport */
                                            <div id="studio-3d-canvas" className={`w-full relative cursor-grab active:cursor-grabbing transition-all duration-700 ease-in-out ${window.innerWidth < 1280 ? (isMobileUiMinimized ? 'h-[85vh]' : 'h-[55vh]') : 'h-[88vh] mt-4'}`}>
                                                {/* Invisible source for 3D textures */}
                                                <div style={{ position: 'absolute', left: '-9999px', pointerEvents: 'none' }}>
                                                    <div style={{ width: `${500 * canvasScale}px`, height: `${600 * canvasScale}px` }}>
                                                        <canvas ref={canvasRef} />
                                                    </div>
                                                </div>

                                                <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Initializing 3D Engine...</div>}>
                                                        <Canvas 
                                                            shadows 
                                                            camera={{ position: [0, 0, 5], fov: 45 }}
                                                            gl={{ preserveDrawingBuffer: true, powerPreference: 'high-performance', alpha: true, antialias: true }}
                                                            dpr={[1, 2]}
                                                            onCreated={({ gl }) => {
                                                                gl.domElement.addEventListener('webglcontextlost', (e) => {
                                                                    console.warn("3D Canvas WebGL Context Lost. Recovering...");
                                                                    e.preventDefault();
                                                                    // Force remount of 3D Canvas
                                                                    setTimeout(() => setContextKey(prev => prev + 1), 500);
                                                                    setTimeout(() => { if (fabricRef.current) updateTexture(true); }, 1000);
                                                                }, false);
                                                            }}
                                                            onPointerMissed={() => console.log("Pointer Missed - No interactive object hit")}
                                                            key={contextKey}
                                                        >
                                                            <ambientLight intensity={1.8} />
                                                            <spotLight position={[10, 20, 10]} intensity={3} />
                                                            <Stage intensity={0.6} environment={null} adjustCamera={1.2}>
                                                                <Model3D baseModelId={product?.baseModelId} url={product?.model3d || product?.base3DModelUrl} canvasObjects={canvasObjects} objectAnchors={objectAnchors} onAnchorUpdate={handleAnchorUpdate} activeObjectId={activeObject?.uid} />
                                                            </Stage>
                                                            <OrbitControls makeDefault enablePan={false} maxDistance={10} minDistance={0.1} />
                                                        </Canvas>
                                                </React.Suspense>

                                                {/* Vertical Floating Designer Rail (Desktop & Large Screens) */}
                                                <div className="hidden xl:flex absolute top-1/2 -translate-y-1/2 right-6 flex-col gap-4 bg-white/90 backdrop-blur-3xl p-3 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 z-50 animate-in fade-in slide-in-from-right-4 duration-700">
                                                    {[
                                                        { id: 'uploads', icon: <FiImage size={20}/>, label: 'Images' },
                                                        { id: 'text', icon: <FiType size={20}/>, label: 'Text' },
                                                        { id: 'stickers', icon: <FiSmile size={20}/>, label: 'Emotes' },
                                                        { id: 'draw', icon: <FiEdit3 size={20}/>, label: 'Ink' },
                                                        { id: 'layers', icon: <FiLayers size={21}/>, label: 'Nodes' }
                                                    ].map(item => (
                                                        <button 
                                                            key={item.id} 
                                                            onClick={() => { setActiveTab(item.id); if(item.id !== 'draw') setIsDrawing(false); }} 
                                                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all group relative ${activeTab === item.id ? 'bg-[#0c0c2a] text-white shadow-xl scale-110' : 'text-slate-400 hover:bg-slate-50 hover:text-[#0c0c2a]'}`}
                                                        >
                                                            {item.icon}
                                                            <span className="absolute right-full mr-4 px-3 py-1 bg-[#0c0c2a] text-white text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">{item.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="absolute top-4 left-4 flex gap-3">
                                    <button onClick={handleUndo} disabled={historyStep <= 0} className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-800 disabled:opacity-20 hover:scale-110 active:scale-95 transition-all"><FiCornerUpLeft size={18}/></button>
                                    <button onClick={handleRedo} disabled={historyStep >= historyRef.current.length - 1} className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-800 disabled:opacity-20 hover:scale-110 active:scale-95 transition-all"><FiCornerUpRight size={18}/></button>
                                </div>
                                 {/* Mockup Redesign: Floating Commerce Pill (Responsive) */}
                                 {designMode === 'self' && (
                                    <div className="xl:hidden absolute bottom-24 right-4 z-[200] flex gap-2 animate-in fade-in slide-in-from-bottom-4">
                                        <button onClick={() => handleFinalSubmit(true)} className="h-14 px-6 bg-white border-2 border-[#0c0c2a] text-[#0c0c2a] rounded-2xl shadow-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                                            <FiArrowRight/> Buy Now
                                        </button>
                                        <button onClick={() => handleFinalSubmit(false)} disabled={isSubmitting} className="h-14 px-6 bg-[#0c0c2a] text-white rounded-2xl shadow-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50">
                                            <FiShoppingCart/> {isSubmitting ? '...' : 'Add to Cart'}
                                        </button>
                                    </div>
                                 )}
                    </div>

                    {/* Right Panel: Transaction Suite */}
                    <div className="hidden xl:flex w-[320px] flex-col gap-6">
                        <div className="floating-card flex-1 p-8 flex flex-col gap-6 overflow-y-auto no-scrollbar">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Order Summary</h4>
                            </div>
                            
                            <div className="p-6 bg-slate-50/80 rounded-[32px] space-y-4">
                                <div className="flex justify-between items-center text-[11px] font-bold">
                                    <span className="text-slate-400 uppercase">Per Unit Cost</span>
                                    <span className="text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm text-sm">₹ {(product.discountPrice || product.basePrice || 0).toLocaleString()}</span>
                                </div>
                                <div className="h-px bg-slate-200/50 w-full"></div>
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest text-center">Quantity & Sizes apply in cart</p>
                            </div>

                            {product.isBulkEnabled && product.bulkRules?.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Wholesale Ready</h4>
                                    </div>
                                    <div className="overflow-hidden border border-slate-50 rounded-2xl">
                                        <table className="w-full text-[9px] font-bold">
                                            <thead className="bg-slate-50 text-slate-400">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">BATCH RANGE</th>
                                                    <th className="px-3 py-2 text-right">UNIT OFF</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {product.bulkRules.sort((a,b)=>a.minQty-b.minQty).map((rule, idx) => (
                                                    <tr key={idx} className="text-slate-500">
                                                        <td className="px-3 py-2">ABOVE {rule.minQty}</td>
                                                        <td className="px-3 py-2 text-right">₹{rule.pricePerUnit}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto space-y-4">
                                <div className="flex justify-between items-end pb-2">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase">Subtotal</span>
                                    <span className="text-2xl font-black text-[#0c0c2a]">₹ {((product.discountPrice || product.basePrice || 0) * variations.length).toLocaleString()}</span>
                                </div>
                                <button onClick={() => handleFinalSubmit(true)} className="w-full h-14 bg-white border-2 border-[#0c0c2a] text-[#0c0c2a] rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm">
                                    <FiArrowRight size={18}/> Buy Now
                                </button>
                                <button onClick={() => handleFinalSubmit(false)} disabled={isSubmitting} className="w-full h-16 bg-[#0c0c2a] text-white rounded-[24px] flex items-center justify-center gap-4 font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50">
                                    {isSubmitting ? <span className="animate-pulse">Syncing...</span> : <><FiShoppingCart size={18}/> Add to Cart</>}
                                </button>
                                
                                <button onClick={handleDiscardDraft} className="w-full text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-rose-500 transition-colors">Abort Custom Design</button>
                            </div>
                        </div>
                    </div>
                    </>
                ) : (
                    /* Mode 2: Company Design (Instructions Only) */
                    <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8">
                        <div className="w-full bg-white rounded-[48px] p-12 shadow-2xl border border-slate-100 flex flex-col gap-10">
                            <header className="space-y-4">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Design Assistance</h2>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Describe your vision. Our professional design team will craft a high-fidelity version for your approval.</p>
                            </header>

                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Brief & Instructions</label>
                                <textarea 
                                    value={companyInstructions}
                                    onChange={(e) => setCompanyInstructions(e.target.value)}
                                    placeholder="e.g., Use my logo on the center, add 'Agneya' in gold font below it. Keep the background minimal..."
                                    className="w-full h-48 bg-slate-50 border border-slate-100 rounded-[32px] p-8 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all outline-none resize-none"
                                />
                            </div>

                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference Assets (Logos, Sketches, Inspiration)</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="relative aspect-square border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-[#0c0c2a] hover:bg-slate-50 transition-all cursor-pointer group">
                                        <input 
                                            type="file" 
                                            multiple 
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files);
                                                files.forEach(file => {
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => setCompanyReferences(prev => [...prev, { id: Date.now() + Math.random(), url: ev.target.result }]);
                                                    reader.readAsDataURL(file);
                                                });
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                        />
                                        <FiArrowUp size={20} className="text-slate-300 group-hover:text-[#0c0c2a] transition-colors" />
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Upload</span>
                                    </div>
                                    {companyReferences.map(ref => (
                                        <div key={ref.id} className="relative aspect-square bg-slate-50 rounded-3xl overflow-hidden group">
                                            <img src={ref.url} className="w-full h-full object-cover" />
                                            <button onClick={() => setCompanyReferences(prev => prev.filter(r => r.id !== ref.id))} className="absolute top-2 right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><FiX size={12}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button onClick={() => setDesignMode('self')} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors italic">Switch to 3D Creator Mode</button>
                        </div>

                        {/* Order Summary floating bar for company design */}
                        <div className="mt-8 w-full bg-slate-900 rounded-3xl p-6 flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Est. Base Price</span>
                                    <span className="text-xl font-black text-white">₹ {(product.discountPrice || product.basePrice || 0).toLocaleString()}</span>
                                </div>
                                <div className="w-[1px] h-8 bg-white/10" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Final pricing via design verification</span>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => handleFinalSubmit(false)} 
                                    disabled={isSubmitting} 
                                    className="h-12 px-8 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all disabled:opacity-50 flex items-center gap-3 border border-slate-200"
                                >
                                    {isSubmitting ? 'Syncing...' : <>Add to Cart <FiShoppingCart size={14}/></>}
                                </button>
                                <button 
                                    onClick={() => handleFinalSubmit(true)} 
                                    disabled={isSubmitting} 
                                    className="h-12 px-8 bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center gap-3 shadow-xl shadow-indigo-500/20"
                                >
                                    {isSubmitting ? 'Processing...' : <>Buy Now & Checkout <FiCreditCard size={14}/></>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>


            {/* NEW: PREMIUM MOBILE DASHBOARD (HIGH-CONTRAST LIGHT FOR PERFECT VISIBILITY) */}
            {designMode === 'self' && (
                <div className={`xl:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl rounded-t-[48px] shadow-[0_-20px_60px_rgba(0,0,0,0.1)] p-6 pb-12 flex flex-col gap-6 z-[600] transition-all duration-700 ease-out border-t border-slate-100 ${isMobileUiMinimized ? 'translate-y-[85%]' : 'translate-y-0 h-[40%]'}`}>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-200 rounded-full" />
                    
                    <div className="flex justify-between items-center shrink-0 pt-2 text-[#0c0c2a]">
                        <div className="flex flex-col" onClick={() => setIsMobileUiMinimized(!isMobileUiMinimized)}>
                            <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                                Design Tools {isMobileUiMinimized ? <FiArrowUp size={14} className="animate-bounce" /> : <FiArrowDown size={14}/>}
                            </h3>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{activeObject ? activeObject.type : 'Studio Canvas'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                             {activeObject && (
                                <button onClick={() => { fabricRef.current.discardActiveObject(); fabricRef.current.renderAll(); setActiveObject(null); }} className="px-5 py-2 bg-[#0c0c2a]/10 text-[#0c0c2a] rounded-full text-[9px] font-black uppercase tracking-tight active:scale-95 transition-all">Deselect</button>
                            )}
                            <button onClick={() => setIsMobileUiMinimized(!isMobileUiMinimized)} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#0c0c2a] shadow-sm">
                                {isMobileUiMinimized ? <FiMaximize2 size={16}/> : <FiMinimize2 size={16}/>}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex gap-6 overflow-hidden">
                        {/* Middle Section: Tool Hierarchy (Sliders -> Input -> Colors) */}
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pb-10">
                            
                            {activeObject ? (
                                <div className="space-y-8 pt-2">
                                    {/* 1. SLIDERS (Size, Rotate, Pos X, Pos Y, Opacity) */}
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Size</span><span>{Math.round(activeObject.scaleX * 100)}%</span></div>
                                            <input type="range" min="0.1" max="5" step="0.1" value={activeObject.scaleX} onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                const active = fabricRef.current.getActiveObject();
                                                active.set({scaleX: val, scaleY: val}).setCoords();
                                                fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({...prev, scaleX: val}));
                                            }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Rotate</span><span>{Math.round(activeObject.angle)}°</span></div>
                                            <input type="range" min="0" max="360" value={activeObject.angle} onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                const active = fabricRef.current.getActiveObject();
                                                active.set('angle', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({...prev, angle: val}));
                                            }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Position X</span><span>{Math.round(activeObject.left)}</span></div>
                                            <input type="range" min="0" max="500" value={activeObject.left} onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                const active = fabricRef.current.getActiveObject();
                                                active.set('left', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({...prev, left: val}));
                                            }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Position Y</span><span>{Math.round(activeObject.top)}</span></div>
                                            <input type="range" min="0" max="600" value={activeObject.top} onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                const active = fabricRef.current.getActiveObject();
                                                active.set('top', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({...prev, top: val}));
                                            }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                        </div>
                                        <div className="space-y-3 col-span-2">
                                            <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Transparency</span><span>{Math.round(activeObject.opacity * 100)}%</span></div>
                                            <input type="range" min="0" max="1" step="0.01" value={activeObject.opacity} onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                const active = fabricRef.current.getActiveObject();
                                                active.set('opacity', val); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({...prev, opacity: val}));
                                            }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                        </div>
                                    </div>

                                    {/* 2. TEXT INPUT (Middle) - Visible only for text layers */}
                                    {(activeObject.type === 'i-text' || activeObject.type === 'text') && (
                                        <div className="space-y-4 px-1">
                                            <div className="text-[10px] font-black text-[#0c0c2a] uppercase tracking-widest">Edit Text Content</div>
                                            <textarea rows="2" value={activeObject.text} onChange={(e) => {
                                                const val = e.target.value;
                                                const active = fabricRef.current.getActiveObject();
                                                active.set('text', val); 
                                                fabricRef.current.renderAll(); 
                                                // Immediate projection sync (fast), but debounced texture sync (slow)
                                                fastSync(); 
                                                setActiveObject(prev => ({...prev, text: val}));
                                                
                                                // Clear existing timer
                                                if (window.textSyncTimer) clearTimeout(window.textSyncTimer);
                                                window.textSyncTimer = setTimeout(() => {
                                                    updateTexture(true);
                                                }, 300);
                                            }} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-[14px] font-bold text-[#0c0c2a] focus:border-[#0c0c2a]/20 transition-all outline-none" placeholder="Enter your text..."></textarea>
                                        </div>
                                    )}

                                    {/* 3. COLORS (Bottom) */}
                                    <div className="space-y-4 px-1">
                                        <div className="text-[10px] font-black text-[#0c0c2a] uppercase tracking-widest">Theme Palette</div>
                                        <div className="grid grid-cols-5 gap-3">
                                            {['#0c0c2a', '#3b82f6', '#ec4899', '#fbbf24', '#ffffff', '#ef4444', '#10b981', '#6366f1', '#f97316', '#000000'].map((color, i) => (
                                                <button key={i} onClick={() => { 
                                                    const active = fabricRef.current?.getActiveObject(); 
                                                    if(active) { active.set('fill', color); active.set('stroke', color); fabricRef.current.renderAll(); updateTexture(); setActiveObject({...active, fill: color}); } 
                                                    setBrushColor(color);
                                                }} className={`aspect-square rounded-full border-2 transition-all ${brushColor === color ? 'border-[#0c0c2a] scale-110 shadow-lg' : 'border-slate-100'}`} style={{ backgroundColor: color }}></button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex gap-3 pt-4">
                                        <button onClick={() => { fabricRef.current.centerObject(fabricRef.current.getActiveObject()); fabricRef.current.renderAll(); updateTexture(); }} className="flex-1 h-14 bg-slate-50 border border-slate-100 text-[#0c0c2a] text-[9px] font-black uppercase rounded-[20px] flex items-center justify-center gap-2 shadow-sm active:bg-slate-100"><FiMove size={14}/> Center Object</button>
                                        <button onClick={() => { fabricRef.current.remove(fabricRef.current.getActiveObject()); fabricRef.current.renderAll(); updateTexture(); setActiveObject(null); }} className="flex-1 h-14 bg-rose-50 text-rose-500 text-[9px] font-black uppercase rounded-[20px] flex items-center justify-center gap-2 border border-rose-100 shadow-sm active:bg-rose-100"><FiTrash2 size={14}/> Remove Layer</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-30">
                                    <FiBox size={48} className="text-[#0c0c2a] mb-6 animate-pulse"/>
                                    <p className="text-[10px] font-black text-[#0c0c2a] uppercase tracking-[0.3em] leading-relaxed">No Selection<br/>Active</p>
                                </div>
                            )}
                        </div>

                        {/* Right Section: Integrated Navigation Dock */}
                        <div className="w-16 h-full bg-slate-50 rounded-[32px] p-2 flex flex-col gap-2 border border-slate-100 shrink-0 shadow-sm">
                            {[
                                { id: 'uploads', icon: <FiImage size={20}/> },
                                { id: 'text', icon: <FiType size={20}/> },
                                { id: 'stickers', icon: <FiSmile size={20}/> },
                                { id: 'draw', icon: <FiEdit3 size={20}/> },
                                { id: 'layers', icon: <FiLayers size={20}/> }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => { setActiveTab(tab.id); if(tab.id !== 'draw') setIsDrawing(false); }} className={`flex-1 rounded-[24px] flex items-center justify-center transition-all ${activeTab === tab.id ? 'bg-[#0c0c2a] text-white shadow-xl scale-105' : 'text-slate-400 hover:text-[#0c0c2a]'}`}>
                                    {tab.icon}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Tool Modals (Sub-panels) - Restored for functionality */}
            {activeTab === 'uploads' && (
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[500px] h-[450px] xl:h-[350px] bg-white rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 overflow-y-auto z-[1000] border border-slate-100 animate-in slide-in-from-bottom-full duration-500">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Add Assets</h4>
                        <div className="flex items-center gap-4">
                            {uploadedAssets.length > 0 && <button onClick={handlePurgeGallery} className="text-[9px] font-bold text-rose-500 uppercase tracking-widest hover:underline">Purge All</button>}
                            <button onClick={() => setActiveTab(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100"><FiX size={18} /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5 mb-8">
                        <div className="relative h-32 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center gap-3 hover:border-[#0c0c2a] hover:bg-slate-50 transition-all cursor-pointer group">
                            <input type="file" ref={fileRef} onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <FiArrowUp size={24} className="text-slate-300 group-hover:text-[#0c0c2a] transition-colors" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Import File</span>
                        </div>
                        <button onClick={handleRemoveBg} disabled={isRemovingBg} className="h-32 bg-slate-50 rounded-[32px] flex flex-col items-center justify-center gap-3 hover:bg-[#0c0c2a] hover:text-white transition-all group">
                            {isRemovingBg ? <div className="w-6 h-6 border-2 border-[#0c0c2a] border-t-transparent rounded-full animate-spin"></div> : <FiZap size={24} className="group-hover:animate-pulse" />}
                            <span className="text-[9px] font-black uppercase tracking-widest">Remove Background</span>
                        </button>
                    </div>
                    {uploadedAssets.length > 0 && (
                        <div className="grid grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4">
                            {uploadedAssets.map(a => (
                                <div key={a.id} className="group relative aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                     <img src={a.url} onClick={() => { 
                                        const imgElement = new Image();
                                        imgElement.crossOrigin = 'anonymous';
                                        imgElement.onload = () => {
                                            try {
                                                const ImgClass = fabric.FabricImage || fabric.Image;
                                                const img = new ImgClass(imgElement, {
                                                    width: imgElement.naturalWidth || imgElement.width || 100,
                                                    height: imgElement.naturalHeight || imgElement.height || 100
                                                });
                                                img.scaleToWidth(180);
                                                img.set({left:250, top:300, originX:'center', originY:'center', uid:`up_${Date.now()}`});
                                                if (fabricRef.current) {
                                                    fabricRef.current.add(img);
                                                    fabricRef.current.setActiveObject(img);
                                                    fabricRef.current.renderAll();
                                                    updateTexture(true);
                                                    setIsMobileUiMinimized(false);
                                                }
                                            } catch (err) {
                                                console.error("Fabric Gallery Error:", err);
                                            }
                                        };
                                        imgElement.src = a.url;
                                    }} className="w-full h-full object-contain p-2 cursor-pointer group-hover:scale-110 transition-transform" />
                                    <button onClick={(e) => { e.stopPropagation(); removeAsset(a.id); }} className="absolute top-2 right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-rose-600">
                                        <FiX size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'draw' && (
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[400px] h-[400px] bg-white rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 z-[1000] border border-slate-100 animate-in slide-in-from-bottom-full duration-500">
                    <div className="flex justify-between items-center mb-10"><h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Drawing Tools</h4><button onClick={() => setActiveTab(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><FiX/></button></div>
                    <div className="space-y-10">
                        <div className="space-y-6">
                            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase"><span>Brush Diameter</span><span>{brushSize}px</span></div>
                            <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full" />
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            {['#000000', '#ffffff', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#2dd4bf'].map(c => (
                                <button key={c} onClick={() => setBrushColor(c)} className={`aspect-square rounded-full border-2 ${brushColor === c ? 'border-[#0c0c2a] scale-110 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                            ))}
                        </div>
                        <button onClick={() => { setIsDrawing(true); setActiveTab(null); setIsMobileUiMinimized(false); }} className="w-full h-16 bg-[#0c0c2a] text-white rounded-[24px] font-black uppercase tracking-widest text-[10px]">Initialize Drawing</button>
                    </div>
                </div>
            )}

            {activeTab === 'text' && (
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[400px] h-[350px] bg-white rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 z-[1000] border border-slate-100 animate-in slide-in-from-bottom-full duration-500">
                    <div className="flex justify-between items-center mb-8"><h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Add Text</h4><button onClick={() => setActiveTab(null)}><FiX size={18} className="text-slate-300" /></button></div>
                    <div className="flex flex-col gap-4">
                        <button onClick={() => { addText('heading'); setActiveTab(null); setIsMobileUiMinimized(false); }} className="w-full h-16 bg-slate-50 hover:bg-[#0c0c2a] hover:text-white rounded-[24px] text-left px-8 font-black uppercase text-[10px] transition-all flex justify-between items-center group">Headline <FiMaximize className="group-hover:rotate-45 transition-transform" /></button>
                        <button onClick={() => { addText('body'); setActiveTab(null); setIsMobileUiMinimized(false); }} className="w-full h-16 bg-slate-50 hover:bg-[#0c0c2a] hover:text-white rounded-[24px] text-left px-8 font-black uppercase text-[10px] transition-all flex justify-between items-center group">Sub-headline <FiPlus size={18} /></button>
                    </div>
                </div>
            )}

            {activeTab === 'stickers' && (
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[500px] h-[450px] xl:h-[350px] bg-white rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 overflow-y-auto z-[1000] border border-slate-100 animate-in slide-in-from-bottom-full duration-500">
                    <div className="flex justify-between items-center mb-8"><h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Stickers & Graphics</h4><button onClick={() => setActiveTab(null)}><FiX size={18} className="text-slate-300" /></button></div>
                    <div className="grid grid-cols-4 gap-5">
                        {stickerLibrary.map(s => <div key={s.id} onClick={() => { addSticker(s.svg); setActiveTab(null); setIsMobileUiMinimized(false); }} className="aspect-square bg-slate-50 rounded-[24px] p-6 flex items-center justify-center cursor-pointer hover:bg-slate-100 hover:scale-105 transition-all text-[#0c0c2a]" dangerouslySetInnerHTML={{__html: s.svg}} />)}
                    </div>
                </div>
            )}

            {activeTab === 'layers' && (
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[400px] h-[450px] xl:h-[400px] bg-white rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 z-[1000] border border-slate-100 animate-in slide-in-from-bottom-full duration-500 flex flex-col">
                    <div className="flex justify-between items-center mb-8"><h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Layers</h4><button onClick={() => setActiveTab(null)}><FiX size={18} className="text-slate-400" /></button></div>
                    <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-2">
                        {canvasObjects.length === 0 ? <div className="h-40 flex flex-col items-center justify-center text-slate-300 gap-4"><FiGrid size={24}/><span className="text-[9px] font-black uppercase tracking-[0.2em] italic">No Nodes Active</span></div> : 
                        canvasObjects.map((obj, i) => (
                            <div key={i} onClick={() => {
                                const real = fabricRef.current.getObjects().find(o => o.uid === obj.uid);
                                if(real) { fabricRef.current.setActiveObject(real); fabricRef.current.renderAll(); setActiveObject({...real, uid: real.uid, type: real.type}); }
                            }} className={`flex items-center justify-between p-5 rounded-[24px] transition-all cursor-pointer ${activeObject?.uid === obj.uid ? 'bg-[#0c0c2a] text-white shadow-xl translate-x-1' : 'bg-slate-50 text-slate-800 hover:bg-slate-100'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[10px] font-black">{i+1}</div>
                                    <span className="text-[9px] font-black uppercase tracking-widest">{obj.type}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); const real = fabricRef.current.getObjects().find(o => o.uid === obj.uid); if(real) { fabricRef.current.bringToFront(real); fabricRef.current.renderAll(); updateTexture(); } }} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"><FiArrowUp size={14}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); const real = fabricRef.current.getObjects().find(o => o.uid === obj.uid); if(real) { fabricRef.current.remove(real); fabricRef.current.renderAll(); updateTexture(); setActiveObject(null); } }} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-rose-500"><FiTrash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <footer className="hidden xl:flex h-8 bg-white/50 backdrop-blur-sm border-t border-slate-100 items-center px-10 justify-center shrink-0 font-sans text-[8px] uppercase tracking-widest text-slate-300">
                <div className="flex gap-6"><span>©2026 Agneya Design Studio</span></div>
            </footer>
        </div>
    );
};

export default StudioOverlay;
