import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Enhanced video player component with in-lecture question support
 * Features:
 * - Time tracking for question popups
 * - Quality/playback rate controls
 * - Fullscreen support
 * - Volume control
 */
const EnhancedVideoPlayer = ({
    videoUrl,
    poster,
    onTimeUpdate,
    onVideoReady,
    className,
    autoPlay = true,
    controls = true
}) => {
    const internalRef = useRef(null);
    const videoRef = internalRef;
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const hideControlsTimeout = useRef(null);
    const [finalVideoUrl, setFinalVideoUrl] = useState(null);

    // Get JWT token and add to video URL if needed
    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token || token === 'undefined' || token === 'null') {
            console.error('❌ Invalid token for video stream:', token);
            return;
        }
        if (videoUrl) {
            // If videoUrl is a relative path to stream endpoint, add token as query param
            if (videoUrl.includes('/stream')) {
                const separator = videoUrl.includes('?') ? '&' : '?';
                const urlWithToken = `${videoUrl}${separator}token=${encodeURIComponent(token)}`;
                console.log('[EnhancedVideoPlayer] Setting video URL:', urlWithToken);
                setFinalVideoUrl(urlWithToken);
            } else {
                console.log('[EnhancedVideoPlayer] Using direct video URL:', videoUrl);
                setFinalVideoUrl(videoUrl);
            }
        } else {
            console.log('[EnhancedVideoPlayer] No videoUrl provided');
        }
    }, [videoUrl]);

    // Handle time update for question triggers
const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const time = Math.floor(video.currentTime);
    setCurrentTime(time);

    // Call parent
    const shouldPause = onTimeUpdate?.(time);

    // 🔥 FORCE pause (more reliable)
    if (shouldPause === true) {
        video.pause();
        setIsPlaying(false);
    }
};

    const handleMetadataLoaded = () => {
        const video = videoRef.current;
        if (video) {
            setDuration(Math.floor(video.duration));
            onVideoReady?.();
        }
    };

    const handlePlayPause = () => {
        const video = videoRef.current;
        if (video) {
            if (isPlaying) {
                video.pause();
            } else {
                video.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
        if (newVolume > 0) {
            setIsMuted(false);
        }
    };

    const handleMuteToggle = () => {
        const video = videoRef.current;
        if (video) {
            if (isMuted) {
                video.volume = volume || 0.5;
                setIsMuted(false);
            } else {
                video.volume = 0;
                setIsMuted(true);
            }
        }
    };

    const handlePlaybackRateChange = (rate) => {
        const video = videoRef.current;
        if (video) {
            video.playbackRate = rate;
            setPlaybackRate(rate);
        }
    };

    const handleProgressClick = (e) => {
        const progress = e.currentTarget;
        const rect = progress.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = percentage * duration;

        const video = videoRef.current;
        if (video) {
            video.currentTime = newTime;
        }
    };

    const toggleFullscreen = () => {
        const video = videoRef.current;
        if (video) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                video.parentElement?.requestFullscreen?.();
            }
        }
    };

    const handleShowControls = () => {
        setShowControls(true);
        clearTimeout(hideControlsTimeout.current);
        hideControlsTimeout.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, 3000);
    };

    useEffect(() => {
        return () => clearTimeout(hideControlsTimeout.current);
    }, []);

    const formatTime = (seconds) => {
        if (!seconds) return '0:00';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${minutes}:${String(secs).padStart(2, '0')}`;
    };

    const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

    if (!videoUrl) {
        return (
            <div className={cn(
                "w-full bg-black flex items-center justify-center",
                className
            )}>
                <div className="text-center">
                    <p className="text-slate-400 font-bold">No video available</p>
                </div>
            </div>
        );
    }

    // Wait for finalVideoUrl to be set
    if (!finalVideoUrl) {
        return (
            <div className={cn(
                "w-full bg-black flex items-center justify-center",
                className
            )}>
                <div className="text-center">
                    <p className="text-slate-400 font-bold">Preparing video stream...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn("relative w-full bg-black group", className)}
            onMouseMove={handleShowControls}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                src={finalVideoUrl}
                poster={poster}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleMetadataLoaded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />

            {/* Controls Overlay */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300",
                showControls ? "opacity-100" : "opacity-0"
            )}>
                {/* Top Controls */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                    {/* Playback Rate Selector */}
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <button className="px-3 py-1 text-sm font-bold text-white bg-black/50 rounded hover:bg-black/70 transition-colors flex items-center gap-1">
                                {playbackRate}x
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            <div className="absolute hidden group-hover:flex flex-col bg-black/90 rounded-lg mt-1 left-0 z-50 border border-white/10">
                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                    <button
                                        key={rate}
                                        onClick={() => handlePlaybackRateChange(rate)}
                                        className={cn(
                                            "px-4 py-2 text-sm text-white hover:bg-primary/30 transition-colors",
                                            playbackRate === rate && "bg-primary/50 font-bold"
                                        )}
                                    >
                                        {rate}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                    {/* Progress Bar */}
                    <div
                        className="h-1 bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all group/progress"
                        onClick={handleProgressClick}
                    >
                        <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            {/* Play/Pause */}
                            <button
                                onClick={handlePlayPause}
                                className="p-2 hover:bg-white/10 rounded transition-colors"
                                title={isPlaying ? "Pause" : "Play"}
                            >
                                {isPlaying ? (
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )}
                            </button>

                            {/* Volume */}
                            <div className="flex items-center gap-2 group/volume">
                                <button
                                    onClick={handleMuteToggle}
                                    className="p-2 hover:bg-white/10 rounded transition-colors"
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-5 h-5" />
                                    ) : (
                                        <Volume2 className="w-5 h-5" />
                                    )}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-0 group-hover/volume:w-24 transition-all cursor-pointer accent-primary"
                                />
                            </div>

                            {/* Time Display */}
                            <span className="text-sm font-mono">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        {/* Fullscreen */}
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 hover:bg-white/10 rounded transition-colors"
                            title="Toggle fullscreen"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedVideoPlayer;
