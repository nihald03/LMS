import React, { useState, useRef } from 'react';
import axios from 'axios';
import './VideoUploadModal.css';

/**
 * PHASE 5: Video Upload Modal Component
 * 
 * Features:
 * - File selection with drag & drop
 * - Progress bar for upload percentage
 * - Phase status display (Upload → Confirm → Duration → Ready)
 * - Real-time feedback and error handling
 * - Video preview after successful upload
 * - Responsive design
 * 
 * Props:
 *   - lectureId: ID of the lecture to upload video for
 *   - courseId: ID of the course (for context)
 *   - onUploadSuccess: Callback when video is ready for streaming
 *   - onUploadCancel: Callback when user closes modal
 */

const VideoUploadModal = ({ lectureId, courseId, onUploadSuccess, onUploadCancel }) => {
  // State Management
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('idle'); // idle, uploading, confirming, extracting, ready
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState(null);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  // ==================== PHASE 1: UPLOAD VIDEO ====================
  const uploadVideo = async (file) => {
    try {
      setCurrentPhase('uploading');
      setError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('video', file);

      const response = await axios.post(
        `${API_BASE_URL}/api/lectures/${lectureId}/upload-video`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        }
      );

      if (response.data.success) {
        console.log('✅ Phase 1 Complete: Video uploaded to temp storage');
        console.log('Temp path:', response.data.data.tempPath);
        
        // Move to Phase 2
        await confirmVideo(file.name, response.data.data.tempPath);
      } else {
        setError(response.data.message || 'Upload failed');
        setCurrentPhase('idle');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Error uploading video');
      setCurrentPhase('idle');
    }
  };

  // ==================== PHASE 2: CONFIRM VIDEO ====================
  const confirmVideo = async (fileName, tempPath) => {
    try {
      setCurrentPhase('confirming');
      setUploadProgress(100); // Phase 1 complete
      setError(null);

      const response = await axios.post(
        `${API_BASE_URL}/api/lectures/${lectureId}/confirm-video`,
        {
          tempPath,
          fileName
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        console.log('✅ Phase 2 Complete: Video moved to permanent storage');
        console.log('Permanent path:', response.data.data.videoPath);
        
        // Move to Phase 3
        await extractDuration(response.data.data.videoPath);
      } else {
        setError(response.data.message || 'Confirmation failed');
        setCurrentPhase('uploading');
      }
    } catch (err) {
      console.error('Confirmation error:', err);
      setError(err.response?.data?.message || 'Error confirming video');
      setCurrentPhase('uploading');
    }
  };

  // ==================== PHASE 3: EXTRACT DURATION ====================
  const extractDuration = async (videoPath) => {
    try {
      setCurrentPhase('extracting');
      setError(null);

      const response = await axios.post(
        `${API_BASE_URL}/api/lectures/${lectureId}/extract-duration`,
        {
          videoPath
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        console.log('✅ Phase 3 Complete: Duration extracted');
        console.log('Duration:', response.data.data.duration);
        
        // Move to Phase 4: Fetch metadata
        await fetchVideoMetadata();
      } else {
        setError(response.data.message || 'Duration extraction failed');
        setCurrentPhase('confirming');
      }
    } catch (err) {
      console.error('Duration extraction error:', err);
      setError(err.response?.data?.message || 'Error extracting duration');
      setCurrentPhase('confirming');
    }
  };

  // ==================== PHASE 4: READY FOR STREAMING ====================
  const fetchVideoMetadata = async () => {
    try {
      setCurrentPhase('ready');
      setError(null);

      const response = await axios.get(
        `${API_BASE_URL}/api/lectures/${lectureId}/video-metadata`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        console.log('✅ Phase 4 Complete: Video ready for streaming');
        setVideoMetadata(response.data.data);
        setSuccess(true);
        setUploadProgress(100);

        // Call success callback after 2 seconds
        setTimeout(() => {
          if (onUploadSuccess) {
            onUploadSuccess(response.data.data);
          }
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to fetch metadata');
        setCurrentPhase('extracting');
      }
    } catch (err) {
      console.error('Metadata fetch error:', err);
      setError(err.response?.data?.message || 'Error fetching metadata');
      setCurrentPhase('extracting');
    }
  };

  // ==================== FILE HANDLING ====================
  const handleFileSelect = (file) => {
    // Validate file
    if (!file) return;

    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const maxSize = 500 * 1024 * 1024; // 500MB

    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please select MP4, WebM, or MOV video.');
      return;
    }

    if (file.size > maxSize) {
      setError('File too large. Maximum size is 500MB.');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploadProgress(0);
    
    // Start upload
    uploadVideo(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // ==================== PHASE STATUS INFO ====================
  const phaseInfo = {
    idle: {
      title: 'Upload Video',
      description: 'Select a video file to upload',
      steps: ['Select', 'Upload', 'Confirm', 'Extract Duration', 'Ready']
    },
    uploading: {
      title: 'Uploading Video',
      description: 'Uploading to temporary storage...',
      currentStep: 1,
      steps: ['Uploading', 'Confirm', 'Extract Duration', 'Ready']
    },
    confirming: {
      title: 'Confirming Upload',
      description: 'Moving to permanent storage...',
      currentStep: 2,
      steps: ['Uploaded', 'Confirming', 'Extract Duration', 'Ready']
    },
    extracting: {
      title: 'Extracting Duration',
      description: 'Analyzing video metadata...',
      currentStep: 3,
      steps: ['Uploaded', 'Confirmed', 'Extracting', 'Ready']
    },
    ready: {
      title: 'Video Ready!',
      description: 'Video is ready for streaming',
      currentStep: 4,
      steps: ['Uploaded', 'Confirmed', 'Duration Extracted', 'Ready']
    }
  };

  const info = phaseInfo[currentPhase];

  return (
    <div className="video-upload-modal-overlay" onClick={onUploadCancel}>
      <div className="video-upload-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>{info.title}</h2>
          <button className="close-btn" onClick={onUploadCancel}>×</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Phase Progress */}
          <div className="phase-progress">
            <div className="progress-steps">
              {info.steps.map((step, index) => (
                <div
                  key={index}
                  className={`step ${
                    index <= (info.currentStep || 0) ? 'active' : ''
                  } ${index === (info.currentStep || 0) ? 'current' : ''}`}
                >
                  <div className="step-number">{index + 1}</div>
                  <div className="step-label">{step}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          {currentPhase === 'idle' ? (
            // Idle State: File Selection
            <div
              className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="drop-icon">📹</div>
              <h3>Drop video here or click to select</h3>
              <p>Supported: MP4, WebM, MOV (Max 500MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            // Upload Progress
            <div className="upload-progress-container">
              <div className="description">{info.description}</div>
              
              {selectedFile && (
                <div className="file-info">
                  <p><strong>File:</strong> {selectedFile.name}</p>
                  <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}

              {/* Progress Bar */}
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="progress-text">{uploadProgress}%</span>
              </div>

              {/* Phase Status */}
              <div className="phase-status">
                {currentPhase === 'uploading' && (
                  <div className="status uploading">⬆️ Uploading...</div>
                )}
                {currentPhase === 'confirming' && (
                  <div className="status confirming">✓ Upload complete, confirming...</div>
                )}
                {currentPhase === 'extracting' && (
                  <div className="status extracting">🔍 Extracting video metadata...</div>
                )}
                {currentPhase === 'ready' && (
                  <div className="status ready">✅ Video ready!</div>
                )}
              </div>

              {/* Video Metadata Display (when ready) */}
              {videoMetadata && currentPhase === 'ready' && (
                <div className="video-metadata">
                  <h4>Video Information</h4>
                  <ul>
                    <li><strong>Duration:</strong> {formatDuration(videoMetadata.videoDuration)}</li>
                    <li><strong>Size:</strong> {(videoMetadata.videoSize / 1024 / 1024).toFixed(2)} MB</li>
                    <li><strong>Status:</strong> <span className="status-badge ready">{videoMetadata.videoUploadStatus}</span></li>
                    <li><strong>Course:</strong> {videoMetadata.courseTitle}</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="success-message">
              <span>✅ Video uploaded and ready for streaming!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {!success ? (
            <>
              <button className="btn btn-cancel" onClick={onUploadCancel}>
                {currentPhase === 'idle' ? 'Cancel' : 'Close'}
              </button>
              {currentPhase === 'idle' && (
                <button
                  className="btn btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={currentPhase !== 'idle'}
                >
                  Select Video
                </button>
              )}
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => {
              onUploadSuccess?.(videoMetadata);
              onUploadCancel();
            }}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to format duration
const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

export default VideoUploadModal;
