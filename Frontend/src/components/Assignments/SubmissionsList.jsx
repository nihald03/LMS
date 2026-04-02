import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import './SubmissionsList.css';

const SubmissionsList = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId, page, filterStatus]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
      });
      if (filterStatus) params.append('status', filterStatus);

      const response = await api.get(
        `/assignments/${assignmentId}/submissions?${params}`
      );
      setSubmissions(response.data?.data || []);
      setTotalPages(response.data?.pagination?.pages || 1);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch submissions');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = (submissionId) => {
    navigate(`/teacher/submissions/${submissionId}/grade`);
  };

const handleViewSubmission = (submissionId) => {
  navigate(`/teacher/submissions/${submissionId}?mode=view`);
};

  if (loading) return <div className="loading">Loading submissions...</div>;

  return (
    <div className="submissions-list-container">
      <button className="btn btn-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="submissions-header">
        <h1>Student Submissions</h1>
        <div className="filter-section">
          <label>Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
            <option value="resubmitted">Resubmitted</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {submissions.length === 0 ? (
        <div className="no-data">No submissions found.</div>
      ) : (
        <div className="submissions-table-container">
          <table className="submissions-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Submitted At</th>
                <th>Status</th>
                <th>Late</th>
                <th>Marks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission._id}>
                  <td>{submission.studentId?.name || submission.studentId?.email || 'N/A'}</td>
                  <td>{new Date(submission.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`status ${submission.status}`}>
                      {submission.status}
                    </span>
                  </td>
                  <td>{submission.isLate ? '⚠️ Yes' : '✓ No'}</td>
                  <td>{submission.marks !== undefined ? submission.marks : '-'}</td>
                  <td className="actions">
                    <button
                      className="btn btn-small btn-info"
                      onClick={() => handleViewSubmission(submission._id)}
                    >
                      View
                    </button>
                    {submission.status !== 'graded' && (
                      <button
                        className="btn btn-small btn-primary"
                        onClick={() => handleGradeSubmission(submission._id)}
                      >
                        Grade
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SubmissionsList;
