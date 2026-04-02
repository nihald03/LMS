import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import './CreateAssignment.css';

const CreateAssignment = () => {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(assignmentId);
  const [loading, setLoading] = useState(isEditMode); // Load if edit mode
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxMarks: 100,
    submissionType: 'file',
    rubric: '',
    allowLateSubmission: true,
    latePenalty: 10,
  });

  // Load assignment data in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchAssignment();
    }
  }, [assignmentId, isEditMode]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/assignments/${assignmentId}`);
      const assignment = response.data.data;

      // Format dueDate for datetime-local input
      const dueDate = new Date(assignment.dueDate);
      const formattedDueDate = dueDate.toISOString().slice(0, 16);

      setFormData({
        title: assignment.title || '',
        description: assignment.description || '',
        dueDate: formattedDueDate,
        maxMarks: assignment.maxMarks || 100,
        submissionType: assignment.submissionType || 'file',
        rubric: assignment.rubric || '',
        allowLateSubmission: assignment.allowLateSubmission !== false,
        latePenalty: assignment.latePenalty || 10,
      });
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load assignment';
      setError('❌ ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const payload = {
        ...formData,
        maxMarks: Number(formData.maxMarks),
        latePenalty: Number(formData.latePenalty),
        allowedFormats: ['.pdf'],
        dueDate: new Date(formData.dueDate).toISOString(),
      };

      // Add courseId only for create mode
      if (!isEditMode) {
        payload.courseId = courseId;
      }

      let response;
      if (isEditMode) {
        // Update existing assignment
        response = await api.put(`/assignments/${assignmentId}`, payload);
        setSuccess('✅ Assignment updated successfully! Redirecting...');
      } else {
        // Create new assignment
        response = await api.post('/assignments', payload);
        setSuccess('✅ Assignment created successfully! Redirecting...');
      }

    setTimeout(() => {
      navigate(`/teacher/assignments/${isEditMode ? assignmentId : response.data.data._id}`);
    }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || (isEditMode ? 'Failed to update assignment' : 'Failed to create assignment');
      setError('❌ ' + errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-assignment-container">
      <button className="btn btn-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="form-container">
        <h1>{isEditMode ? '📝 Edit Assignment' : '✍️ Create New Assignment'}</h1>

        {loading && isEditMode && <div className="loading">Loading assignment...</div>}

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {!loading && (
        <form onSubmit={handleSubmit} className="assignment-form">
          <div className="form-group">
            <label htmlFor="title">Assignment Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter assignment title"
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter detailed assignment description"
              required
              rows="5"
              className="form-control"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dueDate">Due Date *</label>
              <input
                id="dueDate"
                type="datetime-local"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxMarks">Max Marks *</label>
              <input
                id="maxMarks"
                type="number"
                name="maxMarks"
                value={formData.maxMarks}
                onChange={handleInputChange}
                min="1"
                required
                className="form-control"
              />
            </div>
          </div>

          <div className="form-row">
           <div className="form-group">
            <label htmlFor="submissionType">Submission Type *</label>
            <select
              id="submissionType"
              name="submissionType"
              value={formData.submissionType}
              onChange={handleInputChange}
              className="form-control"
            >
              <option value="file">PDF Only</option>
            </select>
          </div>

            <div className="form-group checkbox">
              <label htmlFor="allowLateSubmission">
                <input
                  id="allowLateSubmission"
                  type="checkbox"
                  name="allowLateSubmission"
                  checked={formData.allowLateSubmission}
                  onChange={handleInputChange}
                />
                Allow Late Submission
              </label>
            </div>
          </div>

          {formData.allowLateSubmission && (
            <div className="form-group">
              <label htmlFor="latePenalty">Late Penalty (%) *</label>
              <input
                id="latePenalty"
                type="number"
                name="latePenalty"
                value={formData.latePenalty}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="form-control"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="rubric">Rubric (Optional)</label>
            <textarea
              id="rubric"
              name="rubric"
              value={formData.rubric}
              onChange={handleInputChange}
              placeholder="Enter grading rubric details"
              rows="4"
              className="form-control"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? '⏳ ' + (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? '💾 Update Assignment' : '✍️ Create Assignment')}
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
      </div>
    </div>
  );
};

export default CreateAssignment;
