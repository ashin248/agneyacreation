import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { FiX, FiCheck, FiRefreshCcw, FiMaximize2, FiMinimize2 } from 'react-icons/fi';

const CropModal = ({ image, onCropComplete, onClose }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onRotationChange = (rotation) => {
        setRotation(rotation);
    };

    const onCropCompleteInternal = useCallback((_croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        const rotRad = (rotation * Math.PI) / 180;
        const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
            image.width,
            image.height,
            rotation
        );

        canvas.width = bBoxWidth;
        canvas.height = bBoxHeight;

        ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
        ctx.rotate(rotRad);
        ctx.translate(-image.width / 2, -image.height / 2);

        ctx.drawImage(image, 0, 0);

        const data = ctx.getImageData(
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height
        );

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.putImageData(data, 0, 0);

        return canvas.toDataURL('image/png');
    };

    function rotateSize(width, height, rotation) {
        const rotRad = (rotation * Math.PI) / 180;
        return {
            width:
                Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
            height:
                Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
        };
    }

    const handleSave = async () => {
        try {
            const croppedImage = await getCroppedImg(
                image,
                croppedAreaPixels,
                rotation
            );
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
            <div className="w-full max-w-4xl bg-white rounded-[48px] overflow-hidden shadow-2xl flex flex-col h-[85vh] sm:h-[80vh] border border-white/20">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex flex-col">
                        <h2 className="text-sm sm:text-lg font-black text-[#0c0c2a] uppercase tracking-widest">Crop Image</h2>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Refine your design element</span>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-rose-500 transition-all">
                        <FiX size={20} />
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="flex-1 relative bg-slate-50">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={null}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={onZoomChange}
                        onRotationChange={onRotationChange}
                        classes={{
                            containerClassName: "rounded-none",
                            mediaClassName: "rounded-none",
                            cropAreaClassName: "border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                        }}
                    />
                </div>

                {/* Controls */}
                <div className="p-8 sm:p-10 space-y-8 shrink-0 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
                        {/* Zoom Control */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black text-[#0c0c2a] uppercase tracking-widest">
                                <span className="flex items-center gap-2"><FiMaximize2 /> Zoom</span>
                                <span>{Math.round(zoom * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full accent-[#0c0c2a] h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Rotation Control */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black text-[#0c0c2a] uppercase tracking-widest">
                                <span className="flex items-center gap-2"><FiRefreshCcw /> Rotate</span>
                                <span>{rotation}°</span>
                            </div>
                            <input
                                type="range"
                                value={rotation}
                                min={0}
                                max={360}
                                step={1}
                                onChange={(e) => setRotation(Number(e.target.value))}
                                className="w-full accent-[#0c0c2a] h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-2">
                        <button 
                            onClick={onClose}
                            className="flex-1 h-16 border-2 border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-3xl hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Discard
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex-[2] h-16 bg-[#0c0c2a] text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-3xl shadow-xl shadow-[#0c0c2a]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <FiCheck size={18} /> Apply Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CropModal;
