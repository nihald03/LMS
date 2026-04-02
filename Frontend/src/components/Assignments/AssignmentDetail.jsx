import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import './AssignmentDetail.css';

const AssignmentDetail = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState('not-submitted'); // not-submitted, submitted, graded
  const [userSubmission, setUserSubmission] = useState(null);

useEffect(() => {
  fetchAssignment();

  const user = JSON.parse(localStorage.getItem('user'));

 
  if (user?.role) {
    setUserRole(user.role);
  }
}, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/assignments/${assignmentId}`);
      setAssignment(response.data.data);
      setError('');

      // Fetch student's submission status (only for students)
      if (userRole?.toLowerCase() === 'student') {
        try {
          const submissionRes = await api.get(`/assignments/${assignmentId}/submissions/me`);
          if (submissionRes.data?.data) {
            setUserSubmission(submissionRes.data.data);
            
            // Determine submission status
            if (submissionRes.data.data.grade !== null && submissionRes.data.data.grade !== undefined) {
              setSubmissionStatus('graded');
            } else {
              setSubmissionStatus('submitted');
            }
          } else {
            setSubmissionStatus('not-submitted');
          }
        } catch (err) {
          // No submission found
          setSubmissionStatus('not-submitted');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAssignment = () => {
    navigate(`/assignments/${assignmentId}/edit`);
  };

  const handlePublish = async () => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');
      
      const response = await api.post(
        `/assignments/${assignmentId}/publish`,
        {}
      );
      
      // Update assignment state with new status
      setAssignment({
        ...assignment,
        status: 'published'
      });
      
      setSuccess('✅ Assignment published successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to publish assignment';
      setError('❌ ' + errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');
      
      const response = await api.post(
        `/assignments/${assignmentId}/close`,
        {}
      );
      
      // Update assignment state with new status
      setAssignment({
        ...assignment,
        status: 'closed'
      });
      
      setSuccess('✅ Assignment closed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to close assignment';
      setError('❌ ' + errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewSubmissions = () => {
    navigate(`/teacher/assignments/${assignmentId}/submissions`);
  };

  const handleDelete = async () => {
    if (!window.confirm('🗑️ Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      await api.delete(`/assignments/${assignmentId}`);

      setSuccess('✅ Assignment deleted successfully! Redirecting...');
      
    setTimeout(() => {
      navigate(-1);
    }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete assignment';
      setError('❌ ' + errorMsg);
      setActionLoading(false);
    }
  };

  const handleViewAnalytics = () => {
    navigate(`/teacher/assignments/${assignmentId}/analytics`);
  };

  if (loading) return <div className="loading">Loading assignment...</div>;
  if (!assignment) return <div className="error">Assignment not found</div>;

  return (
    <div className="assignment-detail-container">
      <button className="btn btn-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {error && <div className="alert alert-error">{error}</div>}

      {success && <div className="alert alert-success">{success}</div>}

      <div className="assignment-detail">
        <div className="detail-header">
          <h1>{assignment.title}</h1>
          <div className="header-actions">
            <span className={`status ${assignment.status}`}>{assignment.status}</span>
            {/* Show submission status for students */}
            {userRole?.toLowerCase() === 'student' && (
              <span className={`submission-status ${submissionStatus}`}>
                {submissionStatus === 'not-submitted' && '❌ Not Submitted'}
                {submissionStatus === 'submitted' && '✅ Submitted'}
                {submissionStatus === 'graded' && userSubmission?.grade !== undefined && (
                  <>⭐ Graded: {userSubmission.grade}/{assignment.maxMarks}</>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="detail-content">
          <section className="section">
            <h3>Description</h3>
            <p>{assignment.description}</p>
          </section>

          <section className="section">
            <h3>Assignment Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Due Date:</label>
                <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <label>Max Marks:</label>
                <span>{assignment.maxMarks}</span>
              </div>
              <div className="detail-item">
                <label>Submission Type:</label>
                <span>{assignment.submissionType}</span>
              </div>
              <div className="detail-item">
                <label>Late Submission Allowed:</label>
                <span>{assignment.allowLateSubmission ? 'Yes' : 'No'}</span>
              </div>
              {assignment.allowLateSubmission && (
                <div className="detail-item">
                  <label>Late Penalty (%):</label>
                  <span>{assignment.latePenalty}%</span>
                </div>
              )}
            </div>
          </section>

          {assignment.rubric && (
            <section className="section">
              <h3>Rubric</h3>
              <div className="rubric">{assignment.rubric}</div>
            </section>
          )}

          {userRole?.toLowerCase() === 'teacher' && (
            <section className="section">
              <h3>Teacher Actions</h3>
              <div className="action-buttons">
                <button className="btn btn-secondary" onClick={handleEditAssignment} disabled={actionLoading}>
                  Edit Assignment
                </button>
                {assignment.status === 'draft' && (
                  <button 
                    className="btn btn-success" 
                    onClick={handlePublish}
                    disabled={actionLoading}
                  >
                    {actionLoading ? '⏳ Publishing...' : '📤 Publish Assignment'}
                  </button>
                )}
                {assignment.status === 'published' && (
                  <button 
                    className="btn btn-warning" 
                    onClick={handleClose}
                    disabled={actionLoading}
                  >
                    {actionLoading ? '⏳ Closing...' : '🔒 Close Assignment'}
                  </button>
                )}
                <button className="btn btn-info" onClick={handleViewSubmissions} disabled={actionLoading}>
                  View Submissions
                </button>
                <button className="btn btn-info" onClick={handleViewAnalytics} disabled={actionLoading}>
                  View Analytics
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleDelete}
                  disabled={actionLoading}
                >
                  {actionLoading && assignment.status === 'closed' ? '⏳ Deleting...' : '🗑️ Delete Assignment'}
                </button>
              </div>
            </section>
          )}

          {userRole === 'student' && assignment.status === 'published' && (
            <section className="section">
              <h3>Student Actions</h3>
              <button className="btn btn-success" onClick={() => navigate(`/assignments/${assignmentId}/submit`)}>
                Submit Assignment
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;
