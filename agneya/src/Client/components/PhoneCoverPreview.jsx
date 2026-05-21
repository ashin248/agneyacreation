import React, { useId } from 'react';

/**
 * PhoneCoverPreview Component
 * Renders a customized design masked inside a realistic phone cover shape with camera cutouts.
 * Fallbacks to standard image tag if not a phone case product.
 */
const PhoneCoverPreview = ({ phoneMask, designImage, productImage, className = '', style = {} }) => {
    const id = useId();
    const maskId = `phone-mask-${id.replace(/:/g, '')}`;

    // Normalize phoneMask if it is stringified JSON
    let mask = null;
    if (phoneMask) {
        try {
            mask = typeof phoneMask === 'string' ? JSON.parse(phoneMask) : phoneMask;
        } catch (e) {
            console.error("Failed to parse phoneMask in PhoneCoverPreview", e);
        }
    }

    // Determine the source image to display
    const displayImage = designImage || productImage;

    // Fallback: If no mask is present or shape/camera is incomplete, render a normal image
    if (!mask || !mask.shape || !mask.camera) {
        return (
            <img
                src={displayImage}
                className={`object-cover rounded-md ${className}`}
                style={style}
                alt="Product Preview"
                onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.target.src = 'https://placehold.co/150x300?text=Design+Preview';
                }}
            />
        );
    }

    const { shape, camera } = mask;
    const shapeWidth = shape.width || 310;
    const shapeHeight = shape.height || 640;
    const shapeRx = shape.rx !== undefined ? shape.rx : 30;

    return (
        <div 
            className={`relative flex items-center justify-center overflow-hidden aspect-[1/2] ${className}`}
            style={{ 
                maxHeight: '100%',
                ...style 
            }}
        >
            <svg 
                viewBox="0 0 400 800" 
                preserveAspectRatio="xMidYMid meet" 
                className="w-full h-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)] filter"
            >
                <defs>
                    <mask id={maskId}>
                        {/* Whole canvas is transparent by default */}
                        {/* Mask body is white (visible) */}
                        <rect
                            x={200 - (shapeWidth / 2)}
                            y={400 - (shapeHeight / 2)}
                            width={shapeWidth}
                            height={shapeHeight}
                            rx={shapeRx}
                            fill="white"
                        />
                        {/* Camera cutouts are black (cutout / transparent) */}
                        {camera.type === 'rounded-rect' && (
                            <rect
                                x={(200 - shapeWidth / 2) + (camera.x || 20)}
                                y={(400 - shapeHeight / 2) + (camera.y || 20)}
                                width={camera.width || 45}
                                height={camera.height || 110}
                                rx={camera.rx !== undefined ? camera.rx : 15}
                                fill="black"
                            />
                        )}
                        {camera.type === 'circle' && (
                            <circle
                                cx={(200 - shapeWidth / 2) + (camera.cx || 155)}
                                cy={(400 - shapeHeight / 2) + (camera.cy || 110)}
                                r={camera.r || 55}
                                fill="black"
                            />
                        )}
                        {camera.type === 'lenses' && Array.isArray(camera.lenses) && camera.lenses.map((lens, idx) => (
                            <circle
                                key={idx}
                                cx={(200 - shapeWidth / 2) + (lens.cx || 0)}
                                cy={(400 - shapeHeight / 2) + (lens.cy || 0)}
                                r={lens.r || 15}
                                fill="black"
                            />
                        ))}
                    </mask>
                </defs>

                {/* Masked Customized Design Image */}
                <image
                    href={displayImage}
                    x="0"
                    y="0"
                    width="400"
                    height="800"
                    preserveAspectRatio="xMidYMid slice"
                    mask={`url(#${maskId})`}
                />

                {/* Camera Cutout Accent / Bezel */}
                {camera.type === 'rounded-rect' && (
                    <rect
                        x={(200 - shapeWidth / 2) + (camera.x || 20)}
                        y={(400 - shapeHeight / 2) + (camera.y || 20)}
                        width={camera.width || 45}
                        height={camera.height || 110}
                        rx={camera.rx !== undefined ? camera.rx : 15}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="2"
                        opacity="0.85"
                    />
                )}
                {camera.type === 'circle' && (
                    <circle
                        cx={(200 - shapeWidth / 2) + (camera.cx || 155)}
                        cy={(400 - shapeHeight / 2) + (camera.cy || 110)}
                        r={camera.r || 55}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="2"
                        opacity="0.85"
                    />
                )}
                {camera.type === 'lenses' && Array.isArray(camera.lenses) && camera.lenses.map((lens, idx) => (
                    <circle
                        key={idx}
                        cx={(200 - shapeWidth / 2) + (lens.cx || 0)}
                        cy={(400 - shapeHeight / 2) + (lens.cy || 0)}
                        r={lens.r || 15}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="1.5"
                        opacity="0.85"
                    />
                ))}

                {/* 3D Model style Border (Yellow / Orange accent) */}
                <rect
                    x={200 - (shapeWidth / 2)}
                    y={400 - (shapeHeight / 2)}
                    width={shapeWidth}
                    height={shapeHeight}
                    rx={shapeRx}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                />

                {/* Inner Highlight for 3D Feel */}
                <rect
                    x={200 - (shapeWidth / 2) + 1.75}
                    y={400 - (shapeHeight / 2) + 1.75}
                    width={shapeWidth - 3.5}
                    height={shapeHeight - 3.5}
                    rx={Math.max(0, shapeRx - 1.75)}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.7)"
                    strokeWidth="1.5"
                />
            </svg>
        </div>
    );
};

export default PhoneCoverPreview;
