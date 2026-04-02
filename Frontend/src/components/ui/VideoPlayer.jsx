import React, { useEffect, useRef, useState } from 'react';
import './VideoPlayer.css';

/**
 * PHASE 5: Video Player Component
 * 
 * Features:
 * - HTML5 video player
 * - Play/pause controls
 * - Progress bar with seeking
 * - Volume control
 * - Fullscreen support
 * - Duration display
 * - Loading indicator
 * 
 * Props:
 *   - lectureId: ID of the lecture
 *   - videoTitle: Title of the video
 *   - metadata: Video metadata (duration, size, etc.)
 *   - token: JWT token for authorization
 */

const VideoPlayer = ({ lectureId, videoTitle, metadata, token }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // ==================== STREAM SETUP ====================
  // Setup video stream with JWT token via query parameter
  useEffect(() => {
    if (!lectureId || !token || !videoRef.current) return;

    try {
      // Construct stream URL with token as query parameter
      // The backend will accept token from Authorization header OR query parameter
      const streamUrl = `${API_BASE_URL}/api/lectures/${lectureId}/stream?token=${encodeURIComponent(token)}`;
      
      if (videoRef.current) {
        videoRef.current.src = streamUrl;
      }
    } catch (error) {
      console.error('Stream setup error:', error);
    }
  }, [lectureId, token, API_BASE_URL]);

  // ==================== PLAYBACK CONTROL ====================
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      videoRef.current.currentTime = parseFloat(e.target.value);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        } else if (containerRef.current.webkitRequestFullscreen) {
          containerRef.current.webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    }
  };

  // ==================== FORMAT TIME ====================
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="video-player-container" ref={containerRef}>
      <div className="video-player">
        {/* Video Element with JWT Authorization via Query Parameter */}
        <video
          ref={videoRef}
          className="video-element"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          controls={false}
          crossOrigin="anonymous"
        >
          Your browser does not support the video tag.
        </video>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        {/* Play Button Overlay (when paused) */}
        {!isPlaying && !isLoading && (
          <div
            className="play-button-overlay"
            onClick={togglePlayPause}
          >
            <button className="play-button">▶</button>
          </div>
        )}

        {/* Video Controls */}
        <div className="video-controls">
          {/* Progress Bar */}
          <div className="progress-container">
            <input
              type="range"
              className="progress-bar"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              title={`${formatTime(currentTime)} / ${formatTime(duration)}`}
            />
          </div>

          {/* Control Bar */}
          <div className="controls-bar">
            {/* Left Controls */}
            <div className="controls-left">
              <button
                className={`control-btn play-pause-btn ${isPlaying ? 'playing' : ''}`}
                onClick={togglePlayPause}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>

              <div className="volume-control">
                <button
                  className="control-btn volume-btn"
                  title="Mute"
                >
                  {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                </button>
                <input
                  type="range"
                  className="volume-slider"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  title="Volume"
                />
              </div>

              <span className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right Controls */}
            <div className="controls-right">
              <button
                className="control-btn fullscreen-btn"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? '⛶' : '⛶'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Info */}
      {metadata && (
        <div className="video-info">
          <h3>{videoTitle}</h3>
          <div className="info-details">
            <span className="info-item">
              <strong>Duration:</strong> {formatTime(metadata.videoDuration)}
            </span>
            <span className="info-item">
              <strong>Size:</strong> {(metadata.videoSize / 1024 / 1024).toFixed(2)} MB
            </span>
            <span className="info-item">
              <strong>Status:</strong> <span className="status-badge">{metadata.videoUploadStatus}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
