# LMS Backend - Setup Instructions

## Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

## Installation

1. Navigate to Backend folder:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Update `.env` file with your MongoDB Atlas URI
   - Replace `username` and `password` in MONGODB_URI
   - Keep JWT secrets or generate your own

## Environment Variables

```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lms_db?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
NODE_ENV=development
```

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

## Project Structure

```
Backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── database.js  # MongoDB connection
│   ├── models/          # Mongoose schemas (added in Phase 3)
│   ├── routes/          # Express routes
│   ├── controllers/      # Route controllers
│   ├── middleware/      # Express middleware
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── app.js           # Express app setup
├── postman/             # Postman collections
├── server.js            # Server entry point
├── package.json
├── .env                 # Local environment variables
├── .env.example         # Example environment variables
└── README.md
```

## Testing

### Phase 1 Health Check
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-02-12T10:30:00.000Z"
}
```

## Next Steps

- **Phase 2**: Authentication & Authorization (JWT, login, register)
- **Phase 3**: Database Models & Schema
- **Phase 4+**: Feature implementation

## Troubleshooting

### Port already in use
Change PORT in .env file

### MongoDB connection error
- Verify MongoDB Atlas URI
- Check username and password
- Ensure IP is whitelisted in MongoDB Atlas

### Dependencies not installing
```bash
npm cache clean --force
rm -rf node_modules
npm install
```
