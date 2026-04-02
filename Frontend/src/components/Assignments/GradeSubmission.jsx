import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import './GradeSubmission.css';
import { useLocation } from 'react-router-dom';


const GradeSubmission = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode'); // 'view' or null
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gradeData, setGradeData] = useState({
    marks: '',
    feedback: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      // Note: This assumes a GET endpoint for single submission
      // You may need to adjust based on your actual API
      const response = await api.get(`/assignments/submissions/${submissionId}`);
      setSubmission(response.data.data);
      if (response.data.data.marks !== undefined) {
        setGradeData({
          marks: response.data.data.marks,
          feedback: response.data.data.feedback || '',
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch submission');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGradeData({
      ...gradeData,
      [name]: value,
    });
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();

    if (gradeData.marks === '') {
      setError('Marks are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

await api.post(`/assignments/submissions/${submissionId}/grade`, gradeData);

      alert('Submission graded successfully!');
      navigate(-1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to grade submission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading submission...</div>;
  if (!submission) return <div className="error">Submission not found</div>;

  return (
    <div className="grade-submission-container">
      <button className="btn btn-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="grading-container">
        <h1>{mode === 'view' ? 'View Submission' : 'Grade Submission'}</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="submission-info">
          <div className="info-item">
            <label>Student:</label>
            <span>{submission.studentId?.name || 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>Submitted At:</label>
            <span>{new Date(submission.submittedAt).toLocaleString()}</span>
          </div>
          <div className="info-item">
            <label>Late Submission:</label>
            <span>{submission.isLate ? '⚠️ Yes' : '✓ No'}</span>
          </div>
          {submission.fileName && (
            <div className="info-item">
              <label>File:</label>
              <span>{submission.fileName}</span>
            </div>
          )}
        </div>

        <div className="submission-preview">
          <h3>Submission Preview</h3>
{submission.submissionFile?.url ? (
  <div className="file-preview">
    <a
      href={`http://localhost:5000${submission.submissionFile.url}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      📄 {submission.submissionFile.filename}
    </a>
  </div>
) : (
  <p>No file attached</p>
)}
        </div>

        {mode !== 'view' && (
        <form onSubmit={handleSubmitGrade} className="grading-form">
          <div className="form-group">
            <label htmlFor="marks">Marks *</label>
            <input
              id="marks"
              type="number"
              name="marks"
              value={gradeData.marks}
              onChange={handleInputChange}
              min="0"
              required
              placeholder="Enter marks"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="feedback">Feedback (Optional)</label>
            <textarea
              id="feedback"
              name="feedback"
              value={gradeData.feedback}
              onChange={handleInputChange}
              placeholder="Enter detailed feedback for the student"
              rows="6"
              className="form-control"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Grading...' : 'Submit Grade'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>

)}
        {submission.comments && submission.comments.length > 0 && (
          <div className="comments-section">
            <h3>Previous Comments</h3>
            <div className="comments-list">
              {submission.comments.map((comment, index) => (
                <div key={index} className="comment">
                  <span className="comment-author">{comment.addedBy}</span>
                  <span className="comment-date">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                  <p>{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeSubmission;
