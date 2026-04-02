import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import './AssignmentSubmit.css';

const AssignmentSubmit = () => {
  const { assignmentId } = useParams();
    const navigate = useNavigate();
     
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [checkingSubmission, setCheckingSubmission] = useState(true);
   if (!assignmentId) {
      return <div>Invalid assignment</div>;
    }

  // Check if student already submitted
  useEffect(() => {
    const checkSubmissionStatus = async () => {
      try {
        setCheckingSubmission(true);
        const response = await api.get(`/assignments/${assignmentId}/my-submission`);
        if (response.data?.data) {
          setAlreadySubmitted(true);
          setError('✅ You have already submitted this assignment. You cannot submit again.');
        }
      } catch (err) {
        // No submission found, allow submission
        setAlreadySubmitted(false);
      } finally {
        setCheckingSubmission(false);
      }
    };
    
    checkSubmissionStatus();
  }, [assignmentId]);
  // ✅ Fetch assignment to get courseId automatically
useEffect(() => {
  const fetchAssignment = async () => {
    try {
      const res = await api.get(`/assignments/${assignmentId}`);
      setCourseId(res.data?.data?.courseId?._id || res.data?.data?.courseId || '');
    } catch (err) {
      console.error("Failed to fetch assignment", err);
    }
  };

  if (assignmentId) {
    fetchAssignment();
  }
}, [assignmentId]);
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }



    try {
      setLoading(true);
      setError('');
      setSuccess('');

const formData = new FormData();
formData.append('file', selectedFile);
formData.append('courseId', courseId);

const response = await api.post(
  `/assignments/${assignmentId}/submit`,
  formData
);

      setSuccess('Assignment submitted successfully!');
      setTimeout(() => {
        navigate(`/courses/${courseId}/assignments`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="submit-assignment-container">
      <button className="btn btn-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="submit-form-container">
        <h1>Submit Assignment</h1>

        {checkingSubmission && <div className="alert alert-info">🔍 Checking submission status...</div>}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {alreadySubmitted ? (
          <div className="alert alert-warning">
            <p>✅ You have already submitted this assignment.</p>
            <p>Submissions cannot be re-submitted. If you need to resubmit, please contact your instructor.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="submit-form">
          <p><strong>Course ID:</strong> {courseId || 'Loading...'}</p>

          <div className="form-group">
            <label htmlFor="file">Upload File *</label>
            <div className="file-upload-area" onClick={() => fileInputRef.current?.click()}>
              <div className="upload-icon">📁</div>
              <p>Click to select file or drag and drop</p>
              <p className="file-info">Supported formats: PDF, DOCX, XLSX, Images (Max 10MB)</p>
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
            {selectedFile && (
              <div className="file-selected">
                <span>✓ Selected: {selectedFile.name}</span>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => setSelectedFile(null)}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !selectedFile || alreadySubmitted}
            >
              {loading ? 'Submitting...' : alreadySubmitted ? 'Already Submitted' : 'Submit Assignment'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AssignmentSubmit;
