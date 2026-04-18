import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

// Local Thumbnails
const mugThumb = "/thumbnails/mug.png";
const bookThumb = "/thumbnails/book.png";
const cardThumb = "/thumbnails/business_card.png";
const tshirtThumb = "/thumbnails/tshirt.png";
const capThumb = "/thumbnails/cap.png";
const plateThumb = "/thumbnails/plate.png";

// Professional Placeholders for remaining models
const boxThumb = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=512&auto=format&fit=crop";
const cerealThumb = "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=512&auto=format&fit=crop";
const coffeeCupThumb = "https://images.unsplash.com/photo-1517256010506-653f930e423e?q=80&w=512&auto=format&fit=crop";
const glassThumb = "https://images.unsplash.com/photo-1516550893923-42d28e5677af?q=80&w=512&auto=format&fit=crop";
const canThumb = "https://images.unsplash.com/photo-1527960669566-f882ba85a4c6?q=80&w=512&auto=format&fit=crop";
const frameThumb = "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=512&auto=format&fit=crop";
const trophyThumb = "https://images.unsplash.com/photo-1579548122064-00626359bc73?q=80&w=512&auto=format&fit=crop";

useGLTF.preload('/models/mug/mug.glb');
useGLTF.preload('/models/book/book.glb');
useGLTF.preload('/models/BusinessCard/Business_Card.glb');
useGLTF.preload('/models/cap/cap.glb');
useGLTF.preload('/models/Tshirt/oversized_t-shirt.glb');
useGLTF.preload('/models/Plate/plate.glb');
useGLTF.preload('/models/Box/box.glb');
useGLTF.preload('/models/Cereal_Box/lucky_charms_in_ups_box.glb');
useGLTF.preload('/models/coffee_cup/coffee_cup_-_realistic_3d_model.glb');
useGLTF.preload('/models/Glass Cup/5x5cm_glass_cup.glb');
useGLTF.preload('/models/Soda can/soda_can_033l.glb');
useGLTF.preload('/models/Photoframe/photo_collage_wall.glb');
useGLTF.preload('/models/Photoframe/y-frame.glb');
useGLTF.preload('/models/Photoframe/picture_frame.glb');
useGLTF.preload('/models/Photoframe/circle_photo_frame.glb');
useGLTF.preload('/models/TrophyModel/trophy_model.glb');

/**
 * Agneya 3D Engine Hub
 * This file is now cleared of hardcoded data.
 * It only maintains the technical loader to prevent Studio crashes.
 */

// Generic GLB Loader Factory
export function MasterProductModel({ url, onClick, ...props }) {
  if (!url) return null;
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => {
    const cloned = scene.clone();
    // Normalise material colors and transforms for printable areas
    cloned.traverse((child) => {
      if (child.isMesh) {
        const isPrintable = props.printableMeshes?.includes(child.name);

        // Ensure its base color is white for accurate decal rendering
        if (isPrintable && child.material) {
          child.material = child.material.clone();
          child.material.color.set(0xffffff);
        }

        // Reset internal transforms so the ProductLibrary config is the source of truth
        if (isPrintable) {
          child.rotation.set(0, 0, 0);
          child.position.set(0, 0, 0);
        }
      }
    });
    return cloned;
  }, [scene, props.printableMeshes]);

  return (
    <primitive
      object={clonedScene}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(e);
      }}
      {...props}
    />
  );
}

// Data Registry: Approved Master Models per Category
export const MODELS = {
  MASTER_CUP: {
    id: 'MASTER_CUP',
    category: 'Mug',
    name: 'Master Mug',
    path: '/models/mug/mug.glb',
    thumbnail: mugThumb,
    defaultScale: 1.2,
    projectionType: 'cylindrical',
    printableMeshes: ['Mug_again_191,191,191_0'] // Specific mesh name provided by user
  },
  MASTER_BOOK: {
    id: 'MASTER_BOOK',
    category: 'Book',
    name: 'Master Book',
    path: '/models/book/book.glb',
    thumbnail: bookThumb,
    defaultScale: 1.0, // Reduced to match Mug's visual size within the Stage
    projectionType: 'planar',
    printableMeshes: ['Books_Dominostransform1_3_blinn2_0'] // Blinn2 is the cover mesh for the new Hardcover model
  },
  MASTER_CARD: {
    id: 'MASTER_CARD',
    category: 'BusinessCard',
    name: 'Master Business Card',
    path: '/models/BusinessCard/Business_Card.glb',
    thumbnail: cardThumb,
    defaultScale: 3.5,
    defaultRotation: [0, 0, 0.20], // Fine-tuned to 0.20 for perfect corner leveling
    defaultPosition: [0, 0, 0],
    projectionType: 'planar',
    printableMeshes: ['Object_4']
  },
  MASTER_TSHIRT: {
    id: 'MASTER_TSHIRT',
    category: 'Tshirt',
    name: 'Oversized T-Shirt',
    path: '/models/Tshirt/oversized_t-shirt.glb',
    thumbnail: tshirtThumb,
    defaultScale: 1.0,
    defaultRotation: [0, 0, 0],
    projectionType: 'planar',
    printableMeshes: ['Object_2', 'Object_3', 'Object_4', 'Object_5']
  },
  MASTER_CAP: {
    id: 'MASTER_CAP',
    category: 'Cap',
    name: 'Master Cap',
    path: '/models/cap/cap.glb',
    thumbnail: capThumb,
    defaultScale: 1.5,
    defaultRotation: [0, 0, 0],
    projectionType: 'cylindrical',
    printableMeshes: ['Object_4', 'Object_5']
  },
  MASTER_PLATE: {
    id: 'MASTER_PLATE',
    category: 'Plate',
    name: 'Master Plate',
    path: '/models/Plate/plate.glb',
    thumbnail: plateThumb,
    defaultScale: 1.5,
    defaultRotation: [Math.PI / 2, 0, 0],
    projectionType: 'planar',
    printableMeshes: ['plate_plate_0']
  },
  MASTER_BOX: {
    id: 'MASTER_BOX',
    category: 'Box',
    name: 'Premium Gift Box',
    path: '/models/Box/box.glb',
    thumbnail: boxThumb,
    defaultScale: 1.5,
    defaultRotation: [0, 0, 0],
    projectionType: 'planar',
    printableMeshes: [] // Empty array triggers the intelligent fallback (allows all faces)
  },
  MASTER_CEREAL_BOX: {
    id: 'MASTER_CEREAL_BOX',
    category: 'CerealBox',
    name: 'Cereal Packaging',
    path: '/models/Cereal_Box/lucky_charms_in_ups_box.glb',
    thumbnail: cerealThumb,
    defaultScale: 1.0,
    defaultRotation: [0, 0, 0],
    projectionType: 'planar',
    printableMeshes: ['Object_2', 'Object_3', 'Object_4', 'Object_5', 'Object_6', 'Object_7', 'Object_8', 'Object_9', 'Object_10', 'Object_11', 'Object_12', 'Object_13', 'Object_14', 'Object_15', 'Object_16', 'Object_17', 'Object_18', 'Object_19', 'Object_20']
  },
  MASTER_COFFEE_CUP: {
    id: 'MASTER_COFFEE_CUP',
    category: 'Cup',
    name: 'Realistic Coffee Cup',
    path: '/models/coffee_cup/coffee_cup_-_realistic_3d_model.glb',
    thumbnail: coffeeCupThumb,
    defaultScale: 2.0,
    defaultRotation: [0, 0, 0],
    projectionType: 'cylindrical',
    printableMeshes: ['Object_4']
  },
  MASTER_GLASS_CUP: {
    id: 'MASTER_GLASS_CUP',
    category: 'Cup',
    name: 'Drinking Glass (5x5)',
    path: '/models/Glass Cup/5x5cm_glass_cup.glb',
    thumbnail: glassThumb,
    defaultScale: 5.0,
    defaultRotation: [0, 0, 0],
    projectionType: 'cylindrical',
    printableMeshes: ['#GLS0002_Tall_Drinking_Glass_Empty_#GLS0002_Glass_0']
  },
  MASTER_SODA_CAN: {
    id: 'MASTER_SODA_CAN',
    category: 'Can',
    name: 'Soda Can (0.33L)',
    path: '/models/Soda can/soda_can_033l.glb',
    thumbnail: canThumb,
    defaultScale: 15.0,
    defaultRotation: [0, 0, 0],
    projectionType: 'cylindrical',
    printableMeshes: ['bluesoda_blue-soda_0']
  },
  MASTER_PHOTO_COLLAGE: {
    id: 'MASTER_PHOTO_COLLAGE',
    category: 'Photoframe',
    name: 'Photo Collage Wall',
    path: '/models/Photoframe/photo_collage_wall.glb',
    thumbnail: frameThumb,
    defaultScale: 3.0,
    defaultRotation: [0, 0, 0],
    projectionType: 'decal',
    printableMeshes: ['photo', 'frame', 'mesh', 'basecolor', 'inside', 'surface'] // Exhaustive hints for selection
  },
  MASTER_Y_FRAME: {
    id: 'MASTER_Y_FRAME',
    category: 'Photoframe',
    name: 'Classic Y-Frame',
    path: '/models/Photoframe/y-frame.glb',
    thumbnail: frameThumb,
    defaultScale: 4.0,
    defaultRotation: [0, 0, 0],
    projectionType: 'decal',
    printableMeshes: ['polySurface37_lambert4_0', 'polySurface31_phong1_0', 'polySurface32_phong1_0', 'polySurface33_phong1_0', 'polySurface34_phong1_0', 'polySurface39_phong1_0']
  },
  MASTER_PICTURE_FRAME: {
    id: 'MASTER_PICTURE_FRAME',
    category: 'Photoframe',
    name: 'Minimalists Frame',
    path: '/models/Photoframe/picture_frame.glb',
    thumbnail: frameThumb,
    defaultScale: 0.02, // Large unit scale adjustments
    defaultRotation: [0, 0, 0],
    projectionType: 'decal',
    printableMeshes: ['Object_4']
  },
  MASTER_CIRCLE_FRAME: {
    id: 'MASTER_CIRCLE_FRAME',
    category: 'Photoframe',
    name: 'Circle Designer Frame',
    path: '/models/Photoframe/circle_photo_frame.glb',
    thumbnail: frameThumb,
    defaultScale: 10.0,
    defaultRotation: [0, 0, 0],
    projectionType: 'decal',
    printableMeshes: ['pCylinder1_standardSurface1_0']
  },
  MASTER_TROPHY: {
    id: 'MASTER_TROPHY',
    category: 'Trophy',
    name: 'Award Trophy',
    path: '/models/TrophyModel/trophy_model.glb',
    thumbnail: trophyThumb,
    defaultScale: 1.5,
    defaultRotation: [0, 0, 0],
    projectionType: 'planar',
    printableMeshes: ['Base_Base Texture_0', 'Cup_Cup Texture_0', 'Handle_Handles Texture_0', 'Base', 'Cup']
  }
};

// Simplified Bridge
export const LibraryProduct = ({ modelId, onClick, ...props }) => {
  const modelConfig = MODELS[modelId];
  if (!modelConfig || !modelConfig.path) return null;

  return (
    <MasterProductModel
      url={modelConfig.path}
      onClick={onClick}
      scale={modelConfig.defaultScale}
      rotation={modelConfig.defaultRotation || [0, 0, 0]}
      {...props}
    />
  );
};
