import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getAssignmentsByCourse } from '../../api/management';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { getEnrolledCourses } from '../../api/student';
import { Progress } from '../../components/ui/progress';
import {
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const StudentAssignments = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, submitted, graded
  const [userId, setUserId] = useState(null);
  
  // Determine if viewing all assignments or course-specific
  const isAllAssignments = location.pathname === '/student/assignments';

  useEffect(() => {
    const id = localStorage.getItem('userId');
    setUserId(id);
    fetchAssignments();
  }, [courseId, isAllAssignments]);

const fetchAssignments = async () => {
  try {
    setLoading(true);

    if (isAllAssignments) {
      // 👉 Fetch all assignments across enrolled courses
      const coursesRes = await getEnrolledCourses();
      console.log("ENROLLMENTS:", coursesRes.data);
      
      const enrollmentData = Array.isArray(coursesRes.data.data?.enrollments)
        ? coursesRes.data.data.enrollments
        : [];
      if (!Array.isArray(enrollmentData) || enrollmentData.length === 0) {
        console.warn('No enrollments found');
        setAssignments([]);
        setLoading(false);
        return;
      }

      const mappedCourses = enrollmentData
        .map(e => e.courseId)
        .filter(Boolean); // safety
      console.log("EXTRACTED COURSES:", mappedCourses);
      
      const promises = mappedCourses.map(course => {
        const courseId = course._id;
        if (!courseId) {
          console.warn('Invalid course object:', course);
          return Promise.resolve([]);
        }
        
        return getAssignmentsByCourse(courseId)
          .then(res => {
            console.log(`ASSIGNMENTS FOR COURSE ${courseId}:`, res.data);
            const assignments = res.data?.data || [];
            return assignments.map(a => ({
              ...a,
              courseId: courseId, // store ID string
              courseName: course.courseName,
              courseCode: course.courseCode
            }));
          })
          .catch(err => {
            console.error(`Failed to fetch assignments for course ${courseId}:`, err);
            return [];
          });
      });

      const allAssignments = await Promise.all(promises);
      const flat = allAssignments.flat();
      console.log("ALL ASSIGNMENTS AGGREGATED:", flat);
      setAssignments(flat);

    } else {
      // Fetch for specific course
      const safeCourseId = courseId?._id || courseId;
      const res = await getAssignmentsByCourse(safeCourseId);
      const assignmentsData = res.data?.data || [];

      // Ensure courseId is set on all assignments
      const assignmentsWithCourseId = assignmentsData
        .filter(a => a.isPublished !== false)
        .map(a => ({
          ...a,
          courseId: a.courseId?._id || safeCourseId // Extract ID or use fallback
        }));

      setAssignments(assignmentsWithCourseId);
    }

  } catch (error) {
    console.error('Error fetching assignments:', error);
    toast.error('Failed to load assignments');
    setAssignments([]);
  } finally {
    setLoading(false);
  }
};

  const getSubmissionStatus = (assignment) => {
    const userId = localStorage.getItem('userId');
    const submission = assignment.submissions?.find(s => s.studentId === userId);

    if (!submission) return 'not-submitted';
    if (submission.grade !== null && submission.grade !== undefined) return 'graded';
    return 'submitted';
  };

  const getGradePercentage = (assignment) => {
    const userId = localStorage.getItem('userId');
    const submission = assignment.submissions?.find(s => s.studentId === userId);
    if (!submission || submission.grade === null) return null;
    return Math.round((submission.grade / assignment.totalPoints) * 100);
  };

  const isOverdue = (assignment) => {
    return new Date() > new Date(assignment.dueDate);
  };

  const getDaysRemaining = (assignment) => {
    const days = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    const status = getSubmissionStatus(assignment);
    if (filter === 'pending') return status === 'not-submitted';
    if (filter === 'submitted') return status === 'submitted';
    if (filter === 'graded') return status === 'graded';
    return true;
  });

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => getSubmissionStatus(a) === 'not-submitted').length,
    submitted: assignments.filter(a => getSubmissionStatus(a) === 'submitted').length,
    graded: assignments.filter(a => getSubmissionStatus(a) === 'graded').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-slate-600 font-medium">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">
            {isAllAssignments ? 'All Assignments' : 'Course Assignments'}
          </h1>
          <p className="text-slate-600 font-medium mt-2">
            {isAllAssignments 
              ? 'View all assignments across your enrolled courses' 
              : 'Track and submit your course assignments'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-md rounded-xl">
            <CardContent className="p-6">
              <p className="text-sm font-semibold text-slate-600 mb-2">Total</p>
              <p className="text-3xl font-black text-slate-900">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md rounded-xl">
            <CardContent className="p-6">
              <p className="text-sm font-semibold text-yellow-700 mb-2">Pending</p>
              <p className="text-3xl font-black text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md rounded-xl">
            <CardContent className="p-6">
              <p className="text-sm font-semibold text-blue-700 mb-2">Submitted</p>
              <p className="text-3xl font-black text-blue-600">{stats.submitted}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md rounded-xl">
            <CardContent className="p-6">
              <p className="text-sm font-semibold text-green-700 mb-2">Graded</p>
              <p className="text-3xl font-black text-green-600">{stats.graded}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {['all', 'pending', 'submitted', 'graded'].map(f => (
          <Button
            key={f}
            onClick={() => setFilter(f)}
            variant={filter === f ? 'default' : 'outline'}
            className="rounded-xl capitalize font-semibold"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <Card className="border-none shadow-lg rounded-2xl">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-700 mb-2">No assignments</h3>
              <p className="text-slate-500 mb-4">
                {isAllAssignments
                  ? filter === 'all' 
                    ? 'No assignments across your enrolled courses'
                    : `No ${filter} assignments found`
                  : filter === 'all' 
                  ? 'No assignments have been added to this course yet'
                  : `No ${filter} assignments in this course`}
              </p>
              {isAllAssignments && filter === 'all' && (
                <p className="text-sm text-slate-400">
                  Once you enroll in courses, assignments will appear here
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map(assignment => {
            const status = getSubmissionStatus(assignment);
            const gradePercentage = getGradePercentage(assignment);
            const overdue = isOverdue(assignment);
            const daysRemaining = getDaysRemaining(assignment);
            const submission = assignment.submissions?.find(s => s.studentId === userId);

            return (
              <Card
                key={assignment._id}
                className="border-none shadow-lg rounded-2xl hover:shadow-xl transition overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    {/* Left Content */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          {isAllAssignments && assignment.courseId?.title && (
                            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
                              {assignment.courseId.title}
                            </p>
                          )}
                          <h3 className="text-2xl font-bold text-slate-900 mb-1">
                            {assignment.title}
                          </h3>
                          <p className="text-slate-600 text-sm">
                            Assignment #{assignment.assignmentNumber}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {status === 'not-submitted' && (
                            <Badge className="bg-yellow-500 text-white">
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {status === 'submitted' && (
                            <Badge className="bg-blue-500 text-white">
                              <Clock className="w-4 h-4 mr-1" />
                              Submitted
                            </Badge>
                          )}
                          {status === 'graded' && (
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Graded
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-slate-700 line-clamp-2">{assignment.description}</p>

                      {/* Info Grid */}
                      <div className="grid md:grid-cols-3 gap-4 pt-4">
                        {/* Due Date */}
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <Calendar className={`w-5 h-5 flex-shrink-0 ${
                            overdue ? 'text-red-600' : daysRemaining <= 3 ? 'text-yellow-600' : 'text-slate-600'
                          }`} />
                          <div>
                            <p className="text-xs font-semibold text-slate-600">Due Date</p>
                            <p className={`font-semibold text-sm ${
                              overdue ? 'text-red-600' : 'text-slate-900'
                            }`}>
                              {new Date(assignment.dueDate).toLocaleDateString()}
                            </p>
                            <p className={`text-xs mt-0.5 ${
                              overdue ? 'text-red-600 font-semibold' : daysRemaining <= 3 ? 'text-yellow-600' : 'text-slate-500'
                            }`}>
                              {overdue 
                                ? '⚠️ Overdue' 
                                : daysRemaining === 0 
                                ? 'Today'
                                : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`}
                            </p>
                          </div>
                        </div>

                        {/* Points */}
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <MessageSquare className="w-5 h-5 flex-shrink-0 text-primary" />
                          <div>
                            <p className="text-xs font-semibold text-slate-600">Total Points</p>
                            <p className="font-bold text-lg text-slate-900">{assignment.totalPoints}</p>
                          </div>
                        </div>

                        {/* Submission Type */}
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <FileText className="w-5 h-5 flex-shrink-0 text-slate-600" />
                          <div>
                            <p className="text-xs font-semibold text-slate-600">Type</p>
                            <Badge className="capitalize bg-slate-200 text-slate-800 mt-1">
                              {assignment.submissionType}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Grade Display */}
                      {status === 'graded' && gradePercentage !== null && (
                        <div className="space-y-2 p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-green-900">Grade: {submission?.grade}/{assignment.totalPoints}</p>
                            <p className="text-lg font-black text-green-700">{gradePercentage}%</p>
                          </div>
                          <Progress value={gradePercentage} className="h-2" />
                          {submission?.feedback && (
                            <div className="mt-3 p-3 bg-white rounded border border-green-200">
                              <p className="text-xs font-semibold text-slate-700 mb-1">Teacher Feedback</p>
                              <p className="text-slate-700 text-sm line-clamp-2">{submission.feedback}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Submitted Date */}
                      {status !== 'not-submitted' && submission?.submittedAt && (
                        <p className="text-xs text-slate-500">
                          Submitted on {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>

                    {/* Right Action Button */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => navigate(`/assignments/${assignment._id}`)}
                        className="rounded-xl font-semibold whitespace-nowrap flex items-center gap-2"
                      >
                        {status === 'not-submitted' ? 'Submit Now' : 'View Details'}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentAssignments;
