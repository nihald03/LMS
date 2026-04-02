import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import AssignmentRoutes from './routes/assignmentRoutes';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Course Pages
import CourseCatalog from './pages/courses/CourseCatalog';
import CourseDetails from './pages/courses/CourseDetails';
import MyCourses from './pages/courses/MyCourses';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import LectureViewer from './pages/learning/LectureViewer';
import CourseLectures from './pages/student/CourseLectures';
import StudentAssignments from './pages/student/StudentAssignments';
import AssignmentSubmission from './pages/student/AssignmentSubmission';
import StudentProfile from './pages/profile/StudentProfile';
import Certificates from './pages/profile/Certificates';
import QuizList from './pages/quizzes/QuizList';
import QuizAttempt from './pages/quizzes/QuizAttempt';
import QuizResult from './pages/quizzes/QuizResult';

// Placeholder Pages (To be developed in later phases)
// const Dashboard = () => <Navigate to="/courses/my" replace />;
// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ManageCourse from './pages/teacher/ManageCourse';
import CourseManagement from './pages/teacher/CourseManagement';
import CreateCourse from './pages/teacher/CreateCourse';
import StudentRoster from './pages/teacher/StudentRoster';
import StudentPerformance from './pages/teacher/StudentPerformance';
import TeacherQuizBuilder from './pages/teacher/TeacherQuizBuilder';
import GradingDashboard from './pages/teacher/GradingDashboard';
import AssignmentGrading from './pages/teacher/AssignmentGrading';
import AssignmentManagement from './pages/teacher/AssignmentManagement';
import GradeAnalytics from './pages/teacher/GradeAnalytics';

const Unauthorized = () => <div className="flex items-center justify-center min-h-[400px] text-red-600 font-bold text-xl">403 - Access Denied</div>;
const NotFound = () => <div className="flex items-center justify-center min-h-[400px] text-slate-500 font-bold text-xl">404 - Page Not Found</div>;

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background font-sans antialiased text-slate-900">
          <Routes>
            {/* Public Routes - No Layout */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected Routes - With MainLayout */}
            <Route element={<MainLayout />}>

              {/* Protected Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                {/* Real Course Routes */}
                <Route path="/courses" element={<CourseCatalog />} />
                <Route path="/courses/my" element={<MyCourses />} />
                <Route path="/courses/:courseId" element={<CourseDetails />} />
                <Route path="/courses/:courseId/lectures" element={<CourseLectures />} />
                <Route path="/courses/:courseId/assignments" element={<StudentAssignments />} />
                <Route path="/student/assignments" element={<StudentAssignments />} />
                <Route path="/courses/:courseId/assignment/:assignmentId" element={<AssignmentSubmission />} />
                <Route path="/assignments/:assignmentId" element={<AssignmentSubmission />} />


                {/* Remaining Fallback pointers */}
                <Route path="/quizzes" element={<QuizList />} />
                <Route path="/quizzes/attempt/:quizId" element={<QuizAttempt />} />
                <Route path="/quizzes/result/:quizId" element={<QuizResult />} />
                <Route path="/profile" element={<StudentProfile />} />
                <Route path="/certificates" element={<Certificates />} />
              </Route>

              {/* Protected Teacher Routes */}
              <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
                <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                <Route path="/teacher/manage/:courseId" element={<ManageCourse />} />
                <Route path="/teacher/courses" element={<CourseManagement />} />
                <Route path="/teacher/courses/create" element={<CreateCourse />} />
                
                {/* V2 Assignment Routes */}
                {AssignmentRoutes}
                
                <Route path="/teacher/assignments" element={<AssignmentManagement />} />
                <Route path="/teacher/students" element={<StudentRoster />} />
                <Route path="/teacher/analytics" element={<StudentPerformance />} />
                <Route path="/teacher/quiz/new/:courseId" element={<TeacherQuizBuilder />} />
                <Route path="/teacher/quiz/:quizId/edit" element={<TeacherQuizBuilder />} />
                <Route path="/teacher/grading" element={<GradingDashboard />} />
                <Route path="/teacher/grading/assignment/:assignmentId" element={<AssignmentGrading />} />
                <Route path="/teacher/grades" element={<GradeAnalytics />} />
              </Route>

              {/* Protected Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
                <Route path="/admin/users" element={<div className="p-4"><h1 className="text-2xl font-bold">User Management</h1></div>} />
                <Route path="/admin/analytics" element={<div className="p-4"><h1 className="text-2xl font-bold">Site Analytics</h1></div>} />
                <Route path="/admin/settings" element={<div className="p-4"><h1 className="text-2xl font-bold">System Settings</h1></div>} />
              </Route>

              {/* Common Protected Routes */}
              <Route path="/unauthorized" element={<Unauthorized />} />
            </Route>

            {/* Learning Experience - Separate Layout */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/learning/:courseId" element={<LectureViewer />} />
              <Route path="/learning/:courseId/lecture/:lectureId" element={<LectureViewer />} />
            </Route>

            {/* Global Error Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
