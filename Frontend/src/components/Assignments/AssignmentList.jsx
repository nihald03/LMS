import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import './AssignmentList.css';

const AssignmentList = () => {
  const { courseId } = useParams();
  const safeCourseId = courseId?._id || courseId;
  const navigate = useNavigate();
  console.log("COURSE ID PARAM:", courseId);

  // Safety check for [object Object]
  if (!courseId || courseId === '[object Object]') {
    return <div className="alert alert-error">❌ Invalid course ID. Please navigate from a valid course.</div>;
  }

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAssignments();
  }, [courseId, page]);

const fetchAssignments = async () => {
  try {
    setLoading(true);
    setError('');

    const response = await api.get(
      `/assignments/course/${safeCourseId}?page=${page}&limit=10`
    );

    console.log("API RESPONSE:", response.data);

    // ✅ safe data extraction
    const assignments = response.data?.data || [];

    setAssignments(assignments);

    // ✅ handle pagination safely
    if (response.data.pagination) {
      setTotalPages(response.data.pagination.pages || 1);
    } else {
      setTotalPages(1); // fallback
    }

  } catch (err) {
    console.error(err);
    const errorMsg = err.response?.data?.message || 'Failed to fetch assignments';
    setError('❌ ' + errorMsg);
    setAssignments([]);
  } finally {
    setLoading(false);
  }
};

  const handleViewAssignment = (assignmentId) => {
    navigate(`/teacher/assignments/${assignmentId}`);
  };

  const handleCreateAssignment = () => {
    navigate(`/courses/${safeCourseId}/assignments/create`);
  };

  if (loading) return <div className="loading">Loading assignments...</div>;

  return (
    <div className="assignment-list-container">
      <div className="assignment-header">
        <h1>Assignments</h1>
        <button className="btn btn-primary" onClick={handleCreateAssignment}>
          + Create Assignment
        </button>
      </div>

      {error && assignments.length === 0 && (
        <div className="alert alert-error">{error}</div>
      )}

      {success && <div className="alert alert-success">{success}</div>}

      {assignments.length === 0 && !loading ? (
        <div className="no-data">
          <div className="no-data-icon">📋</div>
          <h2>No assignments yet</h2>
          <p>Create your first assignment to get started</p>
          <button className="btn btn-primary" onClick={handleCreateAssignment}>
            + Create First Assignment
          </button>
        </div>
      ) : (
        <div className="assignment-grid">
          {assignments.map((assignment) => (
            <div key={assignment._id} className="assignment-card">
              <div className="card-header">
                <div className="card-title-section">
                  <h3>{assignment.title}</h3>
                </div>
                <span className={`status ${assignment.status}`}>
                  {assignment.status === 'draft' && '📝 Draft'}
                  {assignment.status === 'published' && '✅ Published'}
                  {assignment.status === 'closed' && '🔒 Closed'}
                </span>
              </div>
              <p className="description">{assignment.description}</p>
              <div className="assignment-meta">
                <span className="due-date">📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                <span className="max-marks">⭐ Max Marks: {assignment.maxMarks}</span>
                <span className="submission-count">📥 {assignment.submissionCount || 0} submissions</span>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => handleViewAssignment(assignment._id)}
              >
                View Details
              </button>
            </div>
          ))}
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

export default AssignmentList;
