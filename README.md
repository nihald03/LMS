# LMS (Learning Management System)

A full-stack MERN (MongoDB, Express, React, Node.js) application for managing courses, assignments, quizzes, videos, and student analytics in an educational institution.

## 🎯 Features

- **User Authentication**: Secure JWT-based authentication for Teachers, Students, and Admins
- **Course Management**: Create, update, and manage courses with teacher assignments
- **Lectures & Video Streaming**: Upload and stream lecture videos with timestamps
- **Assignments**: Create assignments, track submissions, and manage grades
- **Quizzes**: Build quizzes with different question types and auto-grading
- **Attendance Tracking**: Real-time attendance tracking with analytics
- **Performance Analytics**: Detailed student performance metrics and reporting
- **Role-Based Access Control**: Different permissions for teachers, students, and admins

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer for video/file handling
- **API Documentation**: RESTful API

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Styling**: CSS/Tailwind CSS
- **UI Components**: Custom React components

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd LMS
```

### 2. Backend Setup
```bash
cd Backend

# Install dependencies
npm install

# Create environment file (copy from template)
cp .env.example .env

# Configure your .env file with:
# - MongoDB connection string
# - JWT secret
# - Port number

# Start the server
npm start
# or for development with auto-reload
npm run dev
```

### 3. Frontend Setup
```bash
cd ../Frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure API base URL in .env if needed

# Start development server
npm run dev
```

### 4. Access the Application
- Frontend: `http://localhost:5173` (Vite default)
- Backend API: `http://localhost:5000/api`

## 📁 Project Structure

```
LMS/
├── Backend/
│   ├── src/
│   │   ├── models/          # MongoDB schemas
│   │   ├── controllers/     # Business logic
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── services/        # Helper services
│   │   ├── utils/           # Utilities and constants
│   │   ├── config/          # Database configuration
│   │   └── app.js           # Express app setup
│   ├── public/              # Static files & uploads (ignored in git)
│   ├── server.js            # Entry point
│   ├── package.json
│   └── .env.example
│
├── Frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page layouts
│   │   ├── services/        # API calls
│   │   ├── hooks/           # Custom hooks
│   │   ├── context/         # State management
│   │   ├── utils/           # Helper functions
│   │   ├── assets/          # Images and fonts
│   │   ├── styles/          # Global styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/              # Static files
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
└── .gitignore
```

## 🔐 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/lms
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
MAX_FILE_SIZE=100000000
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=LMS
```

## 📚 API Documentation

Key API Endpoints:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course (teacher/admin)
- `PUT /api/courses/:courseId` - Update course
- `DELETE /api/courses/:courseId` - Delete course

### Lectures
- `POST /api/lectures` - Create lecture
- `GET /api/lectures/course/:courseId` - Get course lectures
- `PUT /api/lectures/:lectureId` - Update lecture
- `DELETE /api/lectures/:lectureId` - Delete lecture

### Assignments
- `POST /api/assignments` - Create assignment
- `GET /api/assignments/course/:courseId` - Get course assignments
- `POST /api/assignments/:assignmentId/submissions` - Submit assignment

### Quizzes
- `POST /api/quizzes` - Create quiz
- `GET /api/quizzes/course/:courseId` - Get course quizzes
- `POST /api/quizzes/:quizId/attempt` - Submit quiz attempt

### Attendance
- `GET /api/attendance/course/:courseId` - Get attendance records
- `POST /api/attendance/mark` - Mark attendance

### Grades
- `GET /api/grades/course/:courseId` - Get course grades
- `POST /api/grades` - Create/update grade

## 🧪 Testing

### Backend Testing
```bash
cd Backend
# Run tests (if configured)
npm test
```

### Manual Testing with Postman
- Import the Postman collection from documentation
- Set base URL to `http://localhost:5000/api`
- Use JWT token from login response for authenticated requests

## 🚢 Deployment

### Backend Deployment (Node.js)
1. Set production environment variables
2. Build for production: `npm run build` (if applicable)
3. Deploy to: Heroku, AWS, DigitalOcean, Railway, etc.

### Frontend Deployment (React)
1. Build for production: `npm run build`
2. Deploy to: Vercel, Netlify, AWS S3, or any static hosting

## 🤝 Contributing

1. Create a new branch for features: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues, questions, or suggestions:
- Open an GitHub issue
- Contact the development team

## 📞 Development Notes

- Use `.env.example` as a template for `.env` files (never commit actual `.env`)
- Ensure MongoDB is running before starting the backend
- Frontend will automatically proxy API requests to backend in development
- Clear browser cache if experiencing issues with updated styles/components

---

**Happy Learning! 🎓**
