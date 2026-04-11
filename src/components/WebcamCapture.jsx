import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, CameraOff, ZapOff } from 'lucide-react';

const WebcamCapture = ({ onCapture, isScanning }) => {
    const videoRef  = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError]   = useState(null);

    const startCamera = async () => {
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', frameRate: { ideal: 60, min: 30 }, width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            setStream(mediaStream);
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
        } catch (err) {
            setError('Camera access denied. Please allow camera access and try again.');
        }
    };

    const stopCamera = () => {
        if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    };

    const capture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const video  = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        onCapture(canvas.toDataURL('image/jpeg', 0.92)); // High quality for Face++
    }, [onCapture]);

    // Cleanup on unmount
    useEffect(() => () => { if (stream) stream.getTracks().forEach(t => t.stop()); }, [stream]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {/* Viewfinder */}
            <div style={{
                position: 'relative',
                width: '100%', maxWidth: '420px',
                aspectRatio: '4/3',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: `2px solid ${isScanning ? 'var(--color-success)' : 'var(--color-border)'}`,
                background: '#0A0A0A',
                transition: 'border-color 0.3s ease',
                boxShadow: isScanning ? '0 0 0 3px rgba(16,185,129,0.15)' : 'none',
            }}>
                {/* Idle placeholder */}
                {!stream && !error && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <Camera size={36} color="#4B5563" />
                        <p style={{ color: '#6B7280', fontSize: '13px' }}>Camera is off</p>
                    </div>
                )}

                {/* Error placeholder */}
                {error && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px', textAlign: 'center' }}>
                        <ZapOff size={30} color="#EF4444" />
                        <p style={{ color: '#EF4444', fontSize: '13px', lineHeight: '1.5' }}>{error}</p>
                    </div>
                )}

                {/* Live video */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: stream ? 'block' : 'none', transform: 'scaleX(-1)' /* Mirror video */ }}
                />

                {/* Face alignment guide */}
                {stream && !isScanning && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none',
                    }}>
                        <div style={{
                            width: '140px', height: '170px',
                            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                            border: '1.5px dashed rgba(255,255,255,0.35)',
                        }} />
                    </div>
                )}

                {/* Scanning overlay + animated scan line */}
                {isScanning && (
                    <>
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(16,185,129,0.05)' }} />
                        <div style={{
                            position: 'absolute', left: 0, right: 0, height: '2px',
                            background: 'linear-gradient(90deg, transparent, var(--color-success), transparent)',
                            boxShadow: '0 0 12px var(--color-success)',
                            animation: 'scanLine 2s linear infinite',
                        }} />
                        <div style={{ position: 'absolute', bottom: '12px', left: 0, right: 0, textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--color-success)', background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: '999px', fontWeight: '600', letterSpacing: '0.05em' }}>
                                SCANNING...
                            </span>
                        </div>
                    </>
                )}

                {/* Corner brackets for live mode */}
                {stream && (
                    <>
                        {[['0 auto auto 0','top left'], ['0 0 auto auto','top right'], ['auto auto 0 0','bottom left'], ['auto 0 0 auto','bottom right']].map(([inset, key]) => (
                            <div key={key} style={{
                                position: 'absolute',
                                inset: inset.split(' ').reduce((obj, v, i) => {
                                    const dirs = ['top','right','bottom','left'];
                                    if (v !== 'auto') obj[dirs[i]] = 0;
                                    return obj;
                                }, {}),
                                width: '20px', height: '20px',
                                borderColor: isScanning ? 'var(--color-success)' : 'rgba(255,255,255,0.6)',
                                borderStyle: 'solid',
                                borderWidth: key.includes('top left') ? '2px 0 0 2px' : key.includes('top right') ? '2px 2px 0 0' : key.includes('bottom left') ? '0 0 2px 2px' : '0 2px 2px 0',
                                transition: 'border-color 0.3s ease',
                            }} />
                        ))}
                    </>
                )}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Controls */}
            <div style={{ display: 'flex', gap: '10px' }}>
                {!stream ? (
                    <button type="button" className="btn-primary" onClick={startCamera} style={{ gap: '7px' }}>
                        <Camera size={15} /> Activate Camera
                    </button>
                ) : (
                    <>
                        <button type="button" className="btn-primary" onClick={capture} disabled={isScanning} style={{ gap: '7px' }}>
                            {isScanning ? 'Scanning via Face++...' : '📸 Capture & Authenticate'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={stopCamera} style={{ gap: '7px' }}>
                            <CameraOff size={14} />
                        </button>
                    </>
                )}
            </div>

            <style>{`
                @keyframes scanLine {
                    0%   { top: 0%; opacity: 0; }
                    5%   { opacity: 1; }
                    95%  { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default WebcamCapture;
