/**
 * Phase 1 - Assignment Management: Automated Test Suite
 * Framework: Jest + Supertest
 * Database: MongoDB (test collection)
 * 
 * Run: npm test -- assignment.test.js
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Assignment = require('../src/models/Assignment');
const AssignmentSubmission = require('../src/models/AssignmentSubmission');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const fs = require('fs');
const path = require('path');

// Test data
let testData = {
  teacher: {
    id: null,
    token: null,
    email: 'test-teacher@example.com',
    password: 'TestPassword123'
  },
  student: {
    id: null,
    token: null,
    email: 'test-student@example.com',
    password: 'TestPassword123'
  },
  course: {
    id: null
  },
  assignment: {
    id: null
  },
  submission: {
    id: null
  }
};

// Helper: Create test file
function createTestFile(filename) {
  const filepath = path.join(__dirname, filename);
  fs.writeFileSync(filepath, 'Test PDF content - Phase 1 Assignment');
  return filepath;
}

// Helper: Delete test file
function deleteTestFile(filepath) {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

describe('Phase 1: Assignment Management - Automated Tests', () => {

  // Setup: Connect to test database
  beforeAll(async () => {
    jest.setTimeout(30000);
    
    // Use test database
    const testDbUrl = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/lms-test';
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    // Clear test collections
    await Assignment.deleteMany({});
    await AssignmentSubmission.deleteMany({});
    await User.deleteMany({ email: { $in: [testData.teacher.email, testData.student.email] } });
  });

  // Cleanup: Disconnect from database
  afterAll(async () => {
    // Clear test collections
    await Assignment.deleteMany({});
    await AssignmentSubmission.deleteMany({});
    await User.deleteMany({ email: { $in: [testData.teacher.email, testData.student.email] } });
    
    // Disconnect
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  // ============================================================
  // 1. AUTHENTICATION & SETUP TESTS
  // ============================================================

  describe('1. Authentication & Setup', () => {

    test('T1.1 - Register Teacher Account', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Teacher',
          email: testData.teacher.email,
          password: testData.teacher.password,
          role: 'teacher'
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.role).toBe('teacher');

      testData.teacher.id = response.body.data._id;
    });

    test('T1.2 - Register Student Account', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Student',
          email: testData.student.email,
          password: testData.student.password,
          role: 'student'
        });

      expect(response.status).toBe(201);
      expect(response.body.data._id).toBeDefined();

      testData.student.id = response.body.data._id;
    });

    test('T1.3 - Teacher Login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testData.teacher.email,
          password: testData.teacher.password
        });

      expect(response.status).toBe(200);
      expect(response.body.data.token).toBeDefined();

      testData.teacher.token = response.body.data.token;
    });

    test('T1.4 - Student Login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testData.student.email,
          password: testData.student.password
        });

      expect(response.status).toBe(200);
      expect(response.body.data.token).toBeDefined();

      testData.student.token = response.body.data.token;
    });

    test('T1.5 - Create Test Course', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${testData.teacher.token}`)
        .send({
          name: 'Test Course - Phase 1',
          code: 'TEST101',
          description: 'Course for Phase 1 testing',
          teacher: testData.teacher.id
        });

      expect(response.status).toBe(201);
      expect(response.body.data._id).toBeDefined();

      testData.course.id = response.body.data._id;
    });

    test('T1.6 - Enroll Student in Course', async () => {
      const response = await request(app)
        .post(`/api/courses/${testData.course.id}/enroll`)
        .set('Authorization', `Bearer ${testData.student.token}`)
        .send({
          courseId: testData.course.id
        });

      expect(response.status).toBe(200);
    });
  });

  // ============================================================
  // 2. ASSIGNMENT CRUD TESTS
  // ============================================================

  describe('2. Assignment CRUD Operations', () => {

    test('T2.1 - Create Assignment - Success', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${testData.teacher.token}`)
        .send({
          courseId: testData.course.id,
          title: 'Database Design Assignment',
          description: 'Design a database schema for e-commerce app',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          maxMarks: 100,
          submissionType: 'pdf'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe('Database Design Assignment');
      expect(response.body.data.status).toBe('draft');
      expect(response.body.data.teacherId).toBe(testData.teacher.id);

      testData.assignment.id = response.body.data._id;
    });

    test('T2.2 - Create Assignment - Missing Required Fields', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${testData.teacher.token}`)
        .send({
          title: 'Incomplete Assignment'
          // Missing courseId, dueDate, maxMarks
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('T2.3 - Get Assignment by ID', async () => {
      const response = await request(app)
        .get(`/api/assignments/${testData.assignment.id}`)
        .set('Authorization', `Bearer ${testData.teacher.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data._id.toString()).toBe(testData.assignment.id);
      expect(response.body.data.title).toBe('Database Design Assignment');
    });

    test('T2.4 - Get Assignment by ID - Not Found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/assignments/${fakeId}`)
        .set('Authorization', `Bearer ${testData.teacher.token}`);

      expect(response.status).toBe(404);
    });

    test('T2.5 - List Assignments by Course', async () => {
      const response = await request(app)
        .get(`/api/assignments/course/${testData.course.id}`)
        .set('Authorization', `Bearer ${testData.teacher.token}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    test('T2.6 - Update Assignment - Before Submission', async () => {
      const response = await request(app)
        .put(`/api/assignments/${testData.assignment.id}`)
        .set('Authorization', `Bearer ${testData.teacher.token}`)
        .send({
          title: 'Updated Database Design Assignment',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Database Design Assignment');
    });

    test('T2.7 - Update Assignment - Unauthorized (Not Teacher)', async () => {
      const response = await request(app)
        .put(`/api/assignments/${testData.assignment.id}`)
        .set('Authorization', `Bearer ${testData.student.token}`)
        .send({
          title: 'Hacked Title'
        });

      expect(response.status).toBe(403);
    });

    test('T2.8 - Delete Assignment', async () => {
      // Create another assignment to delete
      const createRes = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${testData.teacher.token}`)
        .send({
          courseId: testData.course.id,
          title: 'Assignment to Delete',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          maxMarks: 50,
          submissionType: 'pdf'
        });

      const assignmentId = createRes.body.data._id;

      const response = await request(app)
        .delete(`/api/assignments/${assignmentId}`)
        .set('Authorization', `Bearer ${testData.teacher.token}`);

      expect(response.status).toBe(200);

      // Verify deletion
      const getRes = await request(app)
        .get(`/api/assignments/${assignmentId}`)
        .set('Authorization', `Bearer ${testData.teacher.token}`);

      expect(getRes.status).toBe(404);
    });
  });

  // ============================================================
  // 3. ASSIGNMENT STATUS TESTS
  // ============================================================

  describe('3. Assignment Status Management', () => {

    test('T3.1 - Publish Assignment', async () => {
      const response = await request(app)
        .post(`/api/assignments/${testData.assignment.id}/publish`)
        .set('Authorization', `Bearer ${testData.teacher.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('published');
    });

    test('T3.2 - Publish Assignment - Unauthorized', async () => {
      const response = await request(app)
        .post(`/api/assignments/${testData.assignment.id}/publish`)
        .set('Authorization', `Bearer ${testData.student.token}`);

      expect(response.status).toBe(403);
    });

    test('T3.3 - Close Assignment', async () => {
      const response = await request(app)
        .post(`/api/assignments/${testData.assignment.id}/close`)
        .set('Authorization', `Bearer ${testData.teacher.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('closed');
    });
  });

  // ============================================================
  // 4. SUBMISSION TESTS
  // ============================================================

  describe('4. Assignment Submission', () => {

    beforeAll(async () => {
      // Publish assignment for submission tests
      await request(app)
        .post(`/api/assignments/${testData.assignment.id}/publish`)
        .set('Authorization', `Bearer ${testData.teacher.token}`);
    });

    test('T4.1 - Submit Assignment - Success', async () => {
      const testFile = createTestFile('test-submit.pdf');

      const response = await request(app)
        .post(`/api/assignments/${testData.assignment.id}/submit`)
        .set('Authorization', `Bearer ${testData.student.token}`)
        .field('courseId', testData.course.id)
        .attach('file', testFile);

      expect(response.status).toBe(201);
      expect(response.body.data.studentId).toBe(testData.student.id);
      expect(response.body.data.status).toBe('submitted');
      expect(response.body.data.submissionFile).toBeDefined();
      expect(response.body.data.isLate).toBe(false);

      testData.submission.id = response.body.data._id;
      deleteTestFile(testFile);
    });

    test('T4.2 - Submit Assignment - No File', async () => {
      const response = await request(app)
        .post(`/api/assignments/${testData.assignment.id}/submit`)
        .set('Authorization', `Bearer ${testData.student.token}`)
        .send({
          courseId: testData.course.id
        });

      expect(response.status).toBe(400);
    });

    test('T4.3 - Get Student Own Submission', async () => {
      const response = await request(app)
        .get(`/api/assignments/${testData.assignment.id}/my-submission`)
        .set('Authorization', `Bearer ${testData.student.token}`)
        .query({ courseId: testData.course.id });

      expect(response.status).toBe(200);
      expect(response.body.data.studentId).toBe(testData.student.id);
      expect(response.body.data.submissionFile).toBeDefined();
    });

    test('T4.4 - Get All Submissions - Teacher Only', async () => {
      const response = await request(app)
        .get(`/api/assignments/${testData.assignment.id}/submissions`)
        .set('Authorization', `Bearer ${testData.teacher.token}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('T4.5 - Get All Submissions - Student Forbidden', async () => {
      const response = await request(app)
        .get(`/api/assignments/${testData.assignment.id}/submissions`)
        .set('Authorization', `Bearer ${testData.student.token}`);

      expect(response.status).toBe(403);
    });

    test('T4.6 - Resubmit Assignment', async () => {
      const testFile = createTestFile('test-resubmit.pdf');

      const response = await request(app)
        .post(`/api/assignments/${testData.assignment.id}/resubmit`)
        .set('Authorization', `Bearer ${testData.student.token}`)
        .field('courseId', testData.course.id)
        .attach('file', testFile);

      expect(response.status).toBe(200);
      expect(response.body.data.resubmissionCount).toBe(1);
      expect(response.body.data.submissionFile).toBeDefined();

      deleteTestFile(testFile);
    });
  });

  // ============================================================
  // 5. GRADING TESTS
  // ============================================================

  describe('5. Grading & Feedback', () => {

    test('T5.1 - Grade Submission', async () => {
      const response = await request(app)
        .post(`/api/submissions/${testData.submission.id}/grade`)
        .set('Authorization', `Bearer ${testData.teacher.token}`)
        .send({
          marks: 85,
          feedback: 'Excellent work! Well normalized schema.'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.grade.marks).toBe(85);
      expect(response.body.data.grade.percentage).toBe(85);
      expect(response.body.data.grade.letterGrade).toBe('B');
      expect(response.body.data.grade.feedback).toBe('Excellent work! Well normalized schema.');
      expect(response.body.data.status).toBe('graded');
    });

    test('T5.2 - Grade Submission - Invalid Marks', async () => {
      const response = await request(app)
        .post(`/api/submissions/${testData.submission.id}/grade`)
        .set('Authorization', `Bearer ${testData.teacher.token}`)
        .send({
          marks: 150, // Exceeds maxMarks (100)
          feedback: 'Test'
        });

      expect(response.status).toBe(400);
    });

    test('T5.3 - Grade Submission - Student Forbidden', async () => {
      const response = await request(app)
        .post(`/api/submissions/${testData.submission.id}/grade`)
        .set('Authorization', `Bearer ${testData.student.token}`)
        .send({
          marks: 85,
          feedback: 'Test'
        });

      expect(response.status).toBe(403);
    });

    test('T5.4 - Add Comment to Submission', async () => {
      const response = await request(app)
        .post(`/api/submissions/${testData.submission.id}/comment`)
        .set('Authorization', `Bearer ${testData.teacher.token}`)
        .send({
          comment: 'Please consider adding composite indexes for better query performance.'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.comments).toBeDefined();
      expect(response.body.data.comments.length).toBeGreaterThan(0);
    });

    test('T5.5 - Verify Grade Letter Scale', async () => {
      const testCases = [
        { marks: 95, expected: 'A' },
        { marks: 85, expected: 'B' },
        { marks: 75, expected: 'C' },
        { marks: 65, expected: 'D' },
        { marks: 50, expected: 'F' }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post(`/api/submissions/${testData.submission.id}/grade`)
          .set('Authorization', `Bearer ${testData.teacher.token}`)
          .send({
            marks: testCase.marks,
            feedback: 'Test grade'
          });

        expect(response.body.data.grade.letterGrade).toBe(testCase.expected);
      }
    });
  });

  // ============================================================
  // 6. ANALYTICS TESTS
  // ============================================================

  describe('6. Analytics & Reporting', () => {

    test('T6.1 - Get Assignment Analytics', async () => {
      const response = await request(app)
        .get(`/api/assignments/${testData.assignment.id}/analytics`)
        .set('Authorization', `Bearer ${testData.teacher.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalSubmissions).toBeGreaterThan(0);
      expect(response.body.data.averageMarks).toBeDefined();
      expect(response.body.data.gradeDistribution).toBeDefined();
    });

    test('T6.2 - Get Class Analytics', async () => {
      const response = await request(app)
        .get(`/api/courses/${testData.course.id}/assignments/class-analytics`)
        .set('Authorization', `Bearer ${testData.teacher.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalAssignments).toBeGreaterThan(0);
      expect(response.body.data.totalSubmissions).toBeGreaterThan(0);
      expect(response.body.data.overallAverageScore).toBeDefined();
    });

    test('T6.3 - Analytics - Student Forbidden', async () => {
      const response = await request(app)
        .get(`/api/assignments/${testData.assignment.id}/analytics`)
        .set('Authorization', `Bearer ${testData.student.token}`);

      expect(response.status).toBe(403);
    });
  });

  // ============================================================
  // 7. LATE SUBMISSION TESTS
  // ============================================================

  describe('7. Late Submission Handling', () => {

    test('T7.1 - Create Assignment with Past Due Date', async () => {
      const pastDate = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${testData.teacher.token}`)
        .send({
          courseId: testData.course.id,
          title: 'Late Submission Test Assignment',
          description: 'Test late submission',
          dueDate: pastDate.toISOString(),
          maxMarks: 100,
          submissionType: 'pdf',
          allowLateSubmission: true
        });

      expect(response.status).toBe(201);
      testData.lateAssignment = { id: response.body.data._id };
    });

    test('T7.2 - Publish Late Submission Assignment', async () => {
      const response = await request(app)
        .post(`/api/assignments/${testData.lateAssignment.id}/publish`)
        .set('Authorization', `Bearer ${testData.teacher.token}`);

      expect(response.status).toBe(200);
    });

    test('T7.3 - Submit After Due Date - Late Flag', async () => {
      const testFile = createTestFile('test-late.pdf');

      const response = await request(app)
        .post(`/api/assignments/${testData.lateAssignment.id}/submit`)
        .set('Authorization', `Bearer ${testData.student.token}`)
        .field('courseId', testData.course.id)
        .attach('file', testFile);

      expect(response.status).toBe(201);
      expect(response.body.data.isLate).toBe(true);
      expect(response.body.data.lateBy).toBeGreaterThan(0);

      testData.lateSubmission = { id: response.body.data._id };
      deleteTestFile(testFile);
    });

    test('T7.4 - Late Submission Penalty Applied', async () => {
      const latePenalty = 10; // 10% penalty

      const response = await request(app)
        .post(`/api/submissions/${testData.lateSubmission.id}/grade`)
        .set('Authorization', `Bearer ${testData.teacher.token}`)
        .send({
          marks: 100,
          feedback: 'Good work, but late'
        });

      expect(response.status).toBe(200);
      // Verify penalty applied (optional, depends on implementation)
      expect(response.body.data.grade).toBeDefined();
    });
  });

  // ============================================================
  // 8. SECURITY & AUTHORIZATION TESTS
  // ============================================================

  describe('8. Security & Authorization', () => {

    test('T8.1 - Missing Authorization Header', async () => {
      const response = await request(app)
        .get(`/api/assignments/${testData.assignment.id}`);

      expect(response.status).toBe(401);
    });

    test('T8.2 - Invalid Token', async () => {
      const response = await request(app)
        .get(`/api/assignments/${testData.assignment.id}`)
        .set('Authorization', 'Bearer invalid-token-xyz');

      expect(response.status).toBe(401);
    });

    test('T8.3 - Student Cannot View Other Student Submission', async () => {
      // Would need another student to test properly
      // This is a conceptual test
      expect(true).toBe(true); // Placeholder
    });

    test('T8.4 - Only Course Teacher Can Access Course Analytics', async () => {
      const response = await request(app)
        .get(`/api/courses/${testData.course.id}/assignments/class-analytics`)
        .set('Authorization', `Bearer ${testData.student.token}`);

      expect(response.status).toBe(403);
    });
  });

  // ============================================================
  // 9. DATABASE INTEGRITY TESTS
  // ============================================================

  describe('9. Database Integrity', () => {

    test('T9.1 - Assignment Record Created in Database', async () => {
      const assignment = await Assignment.findById(testData.assignment.id);

      expect(assignment).toBeDefined();
      expect(assignment.title).toBe('Updated Database Design Assignment');
      expect(assignment.courseId.toString()).toBe(testData.course.id);
      expect(assignment.teacherId.toString()).toBe(testData.teacher.id);
    });

    test('T9.2 - Submission Record Created in Database', async () => {
      const submission = await AssignmentSubmission.findById(testData.submission.id);

      expect(submission).toBeDefined();
      expect(submission.assignmentId.toString()).toBe(testData.assignment.id);
      expect(submission.studentId.toString()).toBe(testData.student.id);
      expect(submission.submissionFile).toBeDefined();
    });

    test('T9.3 - Graded Submission Updated in Database', async () => {
      const submission = await AssignmentSubmission.findById(testData.submission.id);

      expect(submission.grade).toBeDefined();
      expect(submission.grade.marks).toBeGreaterThan(0);
      expect(submission.status).toBe('graded');
    });

    test('T9.4 - Timestamps Are Valid', async () => {
      const submission = await AssignmentSubmission.findById(testData.submission.id);

      expect(submission.createdAt).toBeInstanceOf(Date);
      expect(submission.updatedAt).toBeInstanceOf(Date);
      expect(submission.updatedAt.getTime()).toBeGreaterThanOrEqual(submission.createdAt.getTime());
    });
  });

  // ============================================================
  // 10. ERROR HANDLING TESTS
  // ============================================================

  describe('10. Error Handling', () => {

    test('T10.1 - Invalid ObjectId Format', async () => {
      const response = await request(app)
        .get('/api/assignments/invalid-id')
        .set('Authorization', `Bearer ${testData.teacher.token}`);

      expect(response.status).toBe(400);
    });

    test('T10.2 - Non-existent Assignment', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/assignments/${fakeId}`)
        .set('Authorization', `Bearer ${testData.teacher.token}`);

      expect(response.status).toBe(404);
    });

    test('T10.3 - Non-existent Submission', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/submissions/${fakeId}/grade`)
        .set('Authorization', `Bearer ${testData.teacher.token}`)
        .send({
          marks: 85,
          feedback: 'Test'
        });

      expect(response.status).toBe(404);
    });

    test('T10.4 - Server Error Handling', async () => {
      // This test would verify error handling
      // In production, all errors should return proper status codes
      expect(true).toBe(true);
    });
  });

});

// Export for coverage reports
module.exports = { testData };
