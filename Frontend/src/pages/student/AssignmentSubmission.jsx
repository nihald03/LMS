import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssignmentById, submitAssignment, resubmitAssignment } from '../../api/management';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import {
  Upload,
  FileText,
  X,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Send,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AssignmentSubmission = () => {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [studentSubmission, setStudentSubmission] = useState(null);
  const [isResubmitMode, setIsResubmitMode] = useState(false);

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const res = await getAssignmentById(assignmentId);
      const assignmentData = res.data.data || res.data;
      setAssignment(assignmentData);

      // Check if student already submitted
      const userId = localStorage.getItem('userId');
      const existingSubmission = assignmentData.submissions?.find(
        s => s.studentId === userId
      );
      if (existingSubmission) {
        setStudentSubmission(existingSubmission);
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast.error('Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file format
      const allowedFormats = assignment?.allowedFormats || [];
      const fileExtension = '.' + file.name.split('.').pop();
      
      if (allowedFormats.length > 0 && !allowedFormats.includes(fileExtension)) {
        toast.error(`File format not allowed. Allowed: ${allowedFormats.join(', ')}`);
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (assignment.submissionType === 'file' && !selectedFile) {
      toast.error('Please select a file to submit');
      return;
    }

    if (assignment.submissionType === 'text' && !submissionText.trim()) {
      toast.error('Please enter submission text');
      return;
    }

    if (assignment.submissionType === 'link' && !submissionLink.trim()) {
      toast.error('Please enter submission link');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('assignmentId', assignmentId);
      formData.append('submissionType', assignment.submissionType);

      if (assignment.submissionType === 'file' && selectedFile) {
        formData.append('file', selectedFile);
      } else if (assignment.submissionType === 'text') {
        formData.append('submissionText', submissionText);
      } else if (assignment.submissionType === 'link') {
        formData.append('submissionLink', submissionLink);
      }
      // Extract courseId from assignment object - handle both object and string formats
      const assignmentCourseId =
        typeof assignment.courseId === "object"
          ? assignment.courseId._id
          : assignment.courseId;

      console.log("FINAL COURSE ID:", assignmentCourseId);

      // Verify courseId is valid before appending
      if (!assignmentCourseId) {
        toast.error('Course ID is missing. Please refresh and try again.');
        return;
      }

      formData.append('courseId', assignmentCourseId);
      // Call appropriate submit function based on mode
      let res;
      if (isResubmitMode) {
        res = await resubmitAssignment(assignmentId, formData, assignmentCourseId);
        toast.success('Assignment resubmitted successfully!');
      } else {
        res = await submitAssignment(assignmentId, formData, assignmentCourseId);
        toast.success('Assignment submitted successfully!');
      }
      
      console.log("SUBMISSION RESPONSE:", res.data);

      // Safely extract submission data
      const responseData = res?.data?.data;
      if (!responseData) {
        console.warn("No submission data in response");
        setSubmitted(true);
        setIsResubmitMode(false);
        // Reset form
        setSelectedFile(null);
        setSubmissionText('');
        setSubmissionLink('');
        return;
      }

      setStudentSubmission(responseData);
      setSubmitted(true);
      setIsResubmitMode(false);
      
      // Reset form
      setSelectedFile(null);
      setSubmissionText('');
      setSubmissionLink('');
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = assignment && new Date() > new Date(assignment.dueDate);
  const daysRemaining = assignment ? Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-slate-600 font-medium">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Assignment Not Found</h1>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-4xl font-black tracking-tight">{assignment.title}</h1>
          </div>
          <p className="text-slate-600 font-medium">Assignment #{assignment.assignmentNumber}</p>
        </div>
        {submitted && (
          <Badge className="bg-green-500 text-white text-lg px-4 py-2">
            <CheckCircle className="w-5 h-5 mr-2" />
            Submitted
          </Badge>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Assignment Details Card */}
          <Card className="border-none shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">Description</h3>
                <p className="text-slate-600">{assignment.description}</p>
              </div>

              {assignment.instructions && (
                <div>
                  <h3 className="font-semibold text-slate-700 mb-2">Instructions</h3>
                  <p className="text-slate-600 whitespace-pre-wrap">{assignment.instructions}</p>
                </div>
              )}

              {assignment.rubric && (
                <div>
                  <h3 className="font-semibold text-slate-700 mb-2">Grading Rubric</h3>
                  <p className="text-slate-600 whitespace-pre-wrap">{assignment.rubric}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submission Form */}
          {!submitted ? (
            <Card className="border-none shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle>Submit Assignment</CardTitle>
                <CardDescription>Submit your work before the deadline</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* File Upload */}
                  {assignment.submissionType === 'file' && (
                    <div className="space-y-4">
                      <label className="block">
                        <div 
                          className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition duration-200"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                            const files = e.dataTransfer.files;
                            if (files.length > 0) {
                              const file = files[0];
                              // Check file format
                              const allowedFormats = assignment?.allowedFormats || [];
                              const fileExtension = '.' + file.name.split('.').pop();
                              
                              if (allowedFormats.length > 0 && !allowedFormats.includes(fileExtension)) {
                                toast.error(`File format not allowed. Allowed: ${allowedFormats.join(', ')}`);
                                return;
                              }
                              
                              setSelectedFile(file);
                            }
                          }}
                        >
                          <Upload className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                          <p className="font-bold text-slate-700 text-lg">Drag & drop your file here</p>
                          <p className="text-sm text-slate-500 mt-2">or click to browse</p>
                          <p className="text-xs text-slate-400 mt-3">
                            Allowed formats: {assignment.allowedFormats?.join(', ') || 'Any'}
                          </p>
                          <input
                            type="file"
                            onChange={handleFileSelect}
                            className="hidden"
                            accept={assignment.allowedFormats?.join(',')}
                          />
                        </div>
                      </label>

                      {selectedFile && (
                        <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-2xl border-2 border-primary/20">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                              <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-base">{selectedFile.name}</p>
                              <p className="text-sm text-slate-600">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-2 hover:bg-red-100 rounded-xl transition text-red-500 hover:text-red-700"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text Submission */}
                  {assignment.submissionType === 'text' && (
                    <div className="space-y-2">
                      <label className="block font-semibold text-slate-700">Your Answer</label>
                      <textarea
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        placeholder="Enter your submission text..."
                        className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-slate-500">
                        {submissionText.length} characters
                      </p>
                    </div>
                  )}

                  {/* Link Submission */}
                  {assignment.submissionType === 'link' && (
                    <div className="space-y-2">
                      <label className="block font-semibold text-slate-700">Submission Link</label>
                      <Input
                        type="url"
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                        placeholder="https://example.com/your-submission"
                        className="h-12 rounded-xl"
                      />
                      <p className="text-sm text-slate-500">
                        Provide a link to your submission (Google Drive, GitHub, etc.)
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={submitting || (assignment.submissionType === 'file' && !selectedFile) || (assignment.submissionType === 'text' && !submissionText.trim()) || (assignment.submissionType === 'link' && !submissionLink.trim())}
                    className="w-full h-14 bg-primary hover:bg-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition duration-200"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-6 h-6" />
                        <span>Submit Assignment</span>
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : !isResubmitMode ? (
            <Card className="border-none shadow-lg rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500">
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center gap-3 text-2xl">
                  <CheckCircle className="w-8 h-8" />
                  Submission Received
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-white p-6 rounded-xl border-2 border-green-200">
                  <p className="text-sm text-slate-600 font-semibold mb-2">Submitted on</p>
                  <p className="font-bold text-slate-900 text-lg">
                    {new Date(studentSubmission?.submittedAt).toLocaleString()}
                  </p>
                </div>

                {studentSubmission?.submissionText && (
                  <div>
                    <p className="text-sm text-slate-600 font-semibold mb-3">Your Submission</p>
                    <div className="bg-white p-4 rounded-xl border-2 border-green-200">
                      <p className="text-slate-700 line-clamp-4">{studentSubmission.submissionText}</p>
                    </div>
                  </div>
                )}

                {studentSubmission?.submissionFile?.filename && (
                  <div>
                    <p className="text-sm text-slate-600 font-semibold mb-2">Submitted File</p>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-xl border-2 border-green-200">
                      <FileText className="w-6 h-6 text-primary" />
                      <a
                        href={studentSubmission.submissionFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-slate-900 hover:text-primary transition"
                      >
                        {studentSubmission.submissionFile.filename}
                      </a>
                    </div>
                  </div>
                )}

                {studentSubmission?.submissionLink && (
                  <div>
                    <p className="text-sm text-slate-600 font-semibold mb-2">Submission Link</p>
                    <a
                      href={studentSubmission.submissionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-white px-4 py-2 rounded-xl border-2 border-green-200 text-primary hover:text-primary/80 font-semibold transition"
                    >
                      Open Submission →
                    </a>
                  </div>
                )}

                {studentSubmission?.grade !== null && studentSubmission?.grade !== undefined && (
                  <div className="bg-white p-6 rounded-xl border-2 border-green-200">
                    <p className="text-sm text-slate-600 font-semibold mb-2">Grade</p>
                    <p className="text-4xl font-black text-green-700">
                      {studentSubmission.grade}/{assignment.totalPoints}
                    </p>
                  </div>
                )}

                {studentSubmission?.feedback && (
                  <div>
                    <p className="text-sm text-slate-600 font-semibold mb-3">Feedback</p>
                    <div className="bg-white p-4 rounded-xl border-2 border-green-200">
                      <p className="text-slate-700">{studentSubmission.feedback}</p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => {
                    setIsResubmitMode(true);
                    setSelectedFile(null);
                    setSubmissionText('');
                    setSubmissionLink('');
                  }}
                  className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold"
                >
                  Resubmit Assignment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-lg rounded-2xl border-l-4 border-blue-500 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-700 flex items-center gap-2">
                  📝 Resubmit Assignment
                </CardTitle>
                <CardDescription>Upload an improved version of your submission</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* File Upload */}
                  {assignment.submissionType === 'file' && (
                    <div className="space-y-4">
                      <label className="block">
                        <div 
                          className="border-2 border-dashed border-blue-300 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-100 transition duration-200"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('border-blue-500', 'bg-blue-100');
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
                            const files = e.dataTransfer.files;
                            if (files.length > 0) {
                              const file = files[0];
                              const allowedFormats = assignment?.allowedFormats || [];
                              const fileExtension = '.' + file.name.split('.').pop();
                              
                              if (allowedFormats.length > 0 && !allowedFormats.includes(fileExtension)) {
                                toast.error(`File format not allowed. Allowed: ${allowedFormats.join(', ')}`);
                                return;
                              }
                              
                              setSelectedFile(file);
                            }
                          }}
                        >
                          <Upload className="w-16 h-16 text-blue-400 mx-auto mb-3" />
                          <p className="font-bold text-blue-700 text-lg">Upload improved file</p>
                          <p className="text-sm text-blue-600 mt-2">or click to browse</p>
                          <input
                            type="file"
                            onChange={handleFileSelect}
                            className="hidden"
                            accept={assignment.allowedFormats?.join(',')}
                          />
                        </div>
                      </label>

                      {selectedFile && (
                        <div className="flex items-center justify-between bg-blue-100 p-6 rounded-2xl border-2 border-blue-300">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-300 rounded-xl flex items-center justify-center">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-blue-900 text-base">{selectedFile.name}</p>
                              <p className="text-sm text-blue-700">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-2 hover:bg-red-200 rounded-xl transition text-red-600 hover:text-red-800"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text Submission */}
                  {assignment.submissionType === 'text' && (
                    <div className="space-y-2">
                      <label className="block font-semibold text-slate-700">Updated Answer</label>
                      <textarea
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        placeholder="Enter your updated submission text..."
                        className="w-full h-64 p-4 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Link Submission */}
                  {assignment.submissionType === 'link' && (
                    <div className="space-y-2">
                      <label className="block font-semibold text-slate-700">Updated Submission Link</label>
                      <Input
                        type="url"
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                        placeholder="https://example.com/your-updated-submission"
                        className="h-12 rounded-xl border-2 border-blue-300"
                      />
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={submitting || (assignment.submissionType === 'file' && !selectedFile) || (assignment.submissionType === 'text' && !submissionText.trim()) || (assignment.submissionType === 'link' && !submissionLink.trim())}
                      className="flex-1 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-xl font-semibold"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Resubmitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Resubmit
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setIsResubmitMode(false)}
                      className="px-6 h-12 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Due Date Card */}
          <Card className="border-none shadow-lg rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <div className={`flex items-start gap-3 p-4 rounded-xl ${
                isOverdue ? 'bg-red-50' : daysRemaining <= 3 ? 'bg-yellow-50' : 'bg-green-50'
              }`}>
                <Calendar className={`w-5 h-5 flex-shrink-0 ${
                  isOverdue ? 'text-red-600' : daysRemaining <= 3 ? 'text-yellow-600' : 'text-green-600'
                }`} />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Due Date</p>
                  <p className="font-bold text-lg">
                    {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className={`text-sm font-semibold mt-1 ${
                    isOverdue ? 'text-red-600' : daysRemaining <= 3 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {isOverdue ? '⚠️ Overdue' : `${daysRemaining} days remaining`}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Total Points</p>
                <p className="text-3xl font-black text-primary">{assignment.totalPoints}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Submission Type</p>
                <Badge className="bg-slate-700 text-white capitalize">
                  {assignment.submissionType}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className="border-none shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <p className="text-sm font-semibold text-slate-700 mb-2">Status</p>
              <Badge className={submitted ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}>
                {submitted ? '✓ Submitted' : '⏳ Pending'}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssignmentSubmission;
