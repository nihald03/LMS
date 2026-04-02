/**
 * Assignment Routes
 * Add these routes to your main App Router
 */

import React from 'react';
import { Route } from 'react-router-dom';
import {
  AssignmentList,
  AssignmentDetail,
  CreateAssignment,
  AssignmentSubmit,
  SubmissionsList,
  GradeSubmission,
  AssignmentAnalytics,
} from '../components/Assignments';

const AssignmentRoutes = (
  <>
    {/* List assignments for a course */}
    <Route path="/courses/:courseId/assignments" element={<AssignmentList />} />

    {/* Create new assignment */}
    <Route path="/courses/:courseId/assignments/create" element={<CreateAssignment />} />

    {/* View assignment details */}
    <Route path="/teacher/assignments/:assignmentId" element={<AssignmentDetail />} />
    
    <Route path="/teacher/assignments/:assignmentId/edit" element={<CreateAssignment />} />
    <Route path="/teacher/submissions/:submissionId" element={<GradeSubmission />} />
    {/* Submit assignment (student) */}
    <Route path="/assignments/:assignmentId/submit" element={<AssignmentSubmit />} />

    {/* View all submissions (teacher) */}
    <Route path="/teacher/assignments/:assignmentId/submissions" element={<SubmissionsList />} />

    {/* Grade a submission */}
    <Route path="/teacher/submissions/:submissionId/grade" element={<GradeSubmission />} />

    {/* View assignment analytics */}
    <Route path="/teacher/assignments/:assignmentId/analytics" element={<AssignmentAnalytics />} />
  </>
);

export default AssignmentRoutes;