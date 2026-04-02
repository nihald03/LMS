import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import './AssignmentAnalytics.css';

const AssignmentAnalytics = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [assignmentId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/assignments/${assignmentId}/analytics`
      );
      setAnalytics(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (!analytics) return <div className="error">Analytics not available</div>;

  return (
    <div className="analytics-container">
      <button className="btn btn-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="analytics-content">
        <h1>Assignment Analytics</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="analytics-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Total Submissions</h3>
              <p className="stat-value">{analytics.totalSubmissions}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Graded Submissions</h3>
              <p className="stat-value">{analytics.gradedSubmissions}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>Pending Submissions</h3>
              <p className="stat-value">{analytics.pendingSubmissions}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>Average Marks</h3>
              <p className="stat-value">{analytics.averageMarks}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Submission Rate</h3>
              <p className="stat-value">{analytics.submissionRate}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h3>Late Submissions</h3>
              <p className="stat-value">{analytics.lateSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="detailed-analytics">
          <h3>Submission Summary</h3>
          <div className="summary-table">
            <div className="summary-row">
              <span>Total Submissions:</span>
              <strong>{analytics.totalSubmissions}</strong>
            </div>
            <div className="summary-row">
              <span>Graded:</span>
              <strong>{analytics.gradedSubmissions}</strong>
            </div>
            <div className="summary-row">
              <span>Pending Grades:</span>
              <strong>{analytics.pendingSubmissions}</strong>
            </div>
            <div className="summary-row">
              <span>Late Submissions:</span>
              <strong>{analytics.lateSubmissions}</strong>
            </div>
            <div className="summary-row">
              <span>Average Score:</span>
              <strong>{analytics.averageMarks}</strong>
            </div>
            <div className="summary-row">
              <span>Submission Rate:</span>
              <strong>{analytics.submissionRate}</strong>
            </div>
          </div>
        </div>

        <div className="actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/assignments/${assignmentId}/submissions`)}
          >
            View All Submissions
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentAnalytics;
