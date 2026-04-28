import React, { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { Canvas, createPortal } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, Decal, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { MODELS } from '../../Three/ProductLibrary';
import { useStudio } from '../context/StudioContext';

const dummyDecal = new THREE.Object3D();



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
        const clonedMaterials = [];

        scene.traverse((node) => {
            if (node.isMesh) {
                const lowerName = node.name.toLowerCase();

                // GLASS PASS-THROUGH: Prevent glass from intercepting clicks meant for photos
                if (lowerName.includes('glass')) {
                    node.raycast = () => null; // Make invisible to Raycaster
                    if (node.material) {
                        node.material = node.material.clone();
                        clonedMaterials.push(node.material);
                        node.material.transparent = true;
                        node.material.opacity = 0.4;
                        node.material.needsUpdate = true;
                    }
                }

                // Photoframes: Proactive "Blank Canvas" logic
                // Strip ALL maps from photo areas or anything that isn't clearly the wall
                const isWallOrBase = lowerName.includes('wall') || lowerName.includes('base') || lowerName.includes('ground');
                
                // For photoframes, we want to clear the canvas completely to allow decals to dominate
                const shouldStrip = isPhotoframe && !isWallOrBase;

                if (shouldStrip) {
                    node.material = node.material.clone();
                    clonedMaterials.push(node.material);
                    // Strip ALL maps to ensure a completely blank canvas
                    node.material.map = null;
                    node.material.lightMap = null;
                    node.material.aoMap = null;
                    node.material.emissiveMap = null;
                    node.material.metalnessMap = null;
                    node.material.roughnessMap = null;

                    // User requested: rgba(17, 17, 17, 0) - Rich Matte Black with transparency
                    node.material.color.set('#111111');
                    node.material.transparent = true;
                    node.material.opacity = 0.1; // Nearly invisible but still has subtle presence
                    
                    node.material.roughness = 1.0;
                    node.material.metalness = 0.0;
                    
                    // CRITICAL: Disable depthWrite. This ensures that Decals projected 
                    // on this surface always win the depth test even if they are very close.
                    node.material.depthWrite = false; 
                    
                    node.material.needsUpdate = true;
                } else if (node.material && node.material.roughness !== undefined) {
                    node.material.roughness = 0.6;
                }
            }
        });

        return () => {
            clonedMaterials.forEach(mat => mat.dispose());
        };
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
        const groupPosVec = modelGroupRef.current ? modelGroupRef.current.worldToLocal(e.point.clone()) : pushedPos;

        const newAnchor = {
            meshId: clickedMesh.uuid,
            meshName: clickedMesh.name,
            pos: [pushedPos.x, pushedPos.y, pushedPos.z],
            groupPos: [groupPosVec.x, groupPosVec.y, groupPosVec.z], // Needed for scene-wide projection
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
        </group>
    );
};

const Workspace3D = ({ 
    product, objectAnchors, handleAnchorUpdate, 
    contextKey, setContextKey, fabricRef, updateTexture 
}) => {
    const { activeStudioTab, activeObject, canvasObjects } = useStudio();

    return (
        <div className="absolute inset-0 transition-opacity duration-300" style={{
            opacity: activeStudioTab === '3D_STUDIO' ? 1 : 0, 
            pointerEvents: activeStudioTab === '3D_STUDIO' ? 'auto' : 'none', 
            zIndex: activeStudioTab === '3D_STUDIO' ? 10 : -10,
            visibility: activeStudioTab === '3D_STUDIO' ? 'visible' : 'hidden'
        }}>
            <div id="studio-3d-canvas" className="w-full h-full relative cursor-grab active:cursor-grabbing transition-all duration-700 ease-in-out">
                {/* Loader Overlay (Optional, drawn over the canvas) */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
                    <div className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse" style={{ display: 'none' }} id="three-loader">
                        Initializing 3D Engine...
                    </div>
                </div>
                <Canvas
                    shadows={{ type: THREE.PCFShadowMap }}
                    camera={{ position: [0, 0, 5], fov: 45 }}
                    gl={{ preserveDrawingBuffer: true, powerPreference: 'high-performance', alpha: true, antialias: true }}
                    dpr={[1, 2]}
                    onCreated={({ gl }) => {
                        gl.domElement.addEventListener('webglcontextlost', (e) => {
                            console.warn("3D Canvas WebGL Context Lost. Recovering...");
                            e.preventDefault();
                            setTimeout(() => setContextKey(prev => prev + 1), 500);
                            setTimeout(() => { if (fabricRef.current) updateTexture(true); }, 1000);
                        }, false);
                    }}
                    onPointerMissed={() => console.log("Pointer Missed - No interactive object hit")}
                    key={contextKey}
                >
                    <React.Suspense fallback={null}>
                        <ambientLight intensity={1.8} />
                        <spotLight position={[10, 20, 10]} intensity={3} />
                        <Stage intensity={0.6} environment={null} adjustCamera={1.2}>
                            <Model3D 
                                baseModelId={product?.baseModelId} 
                                url={product?.model3d || product?.base3DModelUrl} 
                                canvasObjects={canvasObjects} 
                                objectAnchors={objectAnchors} 
                                onAnchorUpdate={handleAnchorUpdate} 
                                activeObjectId={activeObject?.uid} 
                            />
                        </Stage>
                        <OrbitControls makeDefault enablePan={false} maxDistance={10} minDistance={0.1} />
                    </React.Suspense>
                </Canvas>
            </div>
        </div>
    );
};

export default Workspace3D;
