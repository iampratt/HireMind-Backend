# HireMind Backend - AI-Powered Job Search Portal

A Node.js/Express backend that uses AI (Google Gemini) to parse resumes and search for jobs on LinkedIn. Users can upload their resumes, extract key details using AI, and then use these details to find relevant job opportunities.

## 🚀 Features

- **AI-Powered Resume Parsing**: Uses Google Gemini via Langchain to extract structured data from resumes
- **LinkedIn Job Search**: Integrates with LinkedIn's job search API to find relevant positions
- **User Authentication**: JWT-based authentication system
- **Resume Management**: Upload, view, delete, and re-parse resumes
- **Smart Job Recommendations**: AI-driven job recommendations based on resume data
- **File Upload Support**: Supports PDF, DOC, DOCX, and TXT files
- **Rate Limiting & Security**: Built-in security features and rate limiting

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI/NLP**: Google Gemini (via Langchain)
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **HTTP Client**: Axios
- **HTML Parsing**: Cheerio
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Google Gemini API key

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd HireMind
npm install
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL="mongodb://localhost:27017/hiremind"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV="development"

# File Upload Configuration
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

```bash
# Test database connection
npm run setup
```

### 4. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/signup

Register a new user.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securepassword123",
  "geminiApiKey": "YOUR_GEMINI_API_KEY"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token"
  }
}
```

#### POST /api/auth/login

Login with existing credentials.

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

#### GET /api/auth/profile

Get user profile (requires authentication).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

### Resume Management Endpoints

#### POST /api/resume/upload

Upload and parse a resume (requires authentication).

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**

- `resumeFile`: Resume file (PDF, DOC, DOCX, TXT)

**Response:**

```json
{
  "success": true,
  "message": "Resume processed successfully",
  "data": {
    "resumeId": "resume_id",
    "fileName": "resume.pdf",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "extractedData": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "123-456-7890",
      "location": "San Francisco, CA",
      "skills": ["JavaScript", "Node.js", "React"],
      "experience": [
        {
          "title": "Software Engineer",
          "company": "Tech Corp",
          "duration": "2020-Present",
          "description": "Full-stack development"
        }
      ],
      "education": [
        {
          "degree": "B.Sc. Computer Science",
          "institution": "University of ABC",
          "years": "2016-2020"
        }
      ]
    }
  }
}
```

#### GET /api/resume

Get all user resumes (requires authentication).

#### GET /api/resume/:id

Get specific resume details (requires authentication).

#### DELETE /api/resume/:id

Delete a resume (requires authentication).

#### POST /api/resume/:id/reparse

Re-parse a resume with updated AI extraction (requires authentication).

### Job Search Endpoints

#### GET /api/jobs/search

Search for jobs on LinkedIn (requires authentication).

**Query Parameters:**

- `resumeId` (optional): Use extracted data from specific resume
- `keywords` (optional): Custom search keywords
- `location` (optional): Job location
- `experienceLevel` (optional): Experience level filter
- `jobType` (optional): Job type filter (F=Full-time, P=Part-time, C=Contract, I=Internship)
- `workSchedule` (optional): Work schedule filter (1=On-site, 2=Remote, 3=Hybrid)
- `postedWithin` (optional): Time filter (r86400=24h, r604800=7d, r2592000=30d)
- `start` (optional): Pagination offset
- `simplifiedApplication` (optional): Filter for simplified applications
- `lessThan10Applicants` (optional): Filter for jobs with <10 applicants

**Response:**

```json
{
  "success": true,
  "message": "Jobs fetched successfully",
  "data": {
    "jobs": [
      {
        "id": "job_id",
        "title": "Software Engineer",
        "company": "Tech Company",
        "location": "San Francisco, CA",
        "postTime": "1 day ago",
        "jobUrl": "https://linkedin.com/jobs/view/...",
        "applicationUrl": "https://linkedin.com/jobs/view/..."
      }
    ],
    "searchParams": {},
    "totalResults": 1
  }
}
```

#### GET /api/jobs/:jobId/details

Get detailed job information (requires authentication).

#### GET /api/jobs/recommendations

Get AI-powered job recommendations based on resume data (requires authentication).

#### GET /api/jobs/recommendations/:resumeId

Get job recommendations for specific resume (requires authentication).

## 🔧 Configuration

### Environment Variables

| Variable                  | Description                | Default           |
| ------------------------- | -------------------------- | ----------------- |
| `DATABASE_URL`            | MongoDB connection string  | Required          |
| `JWT_SECRET`              | Secret key for JWT tokens  | Required          |
| `JWT_EXPIRES_IN`          | JWT token expiration time  | `7d`              |
| `PORT`                    | Server port                | `3000`            |
| `NODE_ENV`                | Environment mode           | `development`     |
| `UPLOAD_DIR`              | File upload directory      | `./uploads`       |
| `MAX_FILE_SIZE`           | Maximum file size in bytes | `10485760` (10MB) |
| `RATE_LIMIT_WINDOW_MS`    | Rate limit window          | `900000` (15min)  |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window    | `100`             |

### LinkedIn API Parameters

The job search supports various LinkedIn API parameters:

- **Experience Level**: `1`=Intern, `2`=Entry level, `3`=Associate, `4`=Mid-Senior level, `5`=Director, `6`=Executive
- **Job Type**: `F`=Full-time, `P`=Part-time, `C`=Contract, `I`=Internship
- **Work Schedule**: `1`=On-site, `2`=Remote, `3`=Hybrid
- **Posted Within**: `r86400`=24 hours, `r604800`=7 days, `r2592000`=30 days

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📁 Project Structure

```
src/
├── config/
│   └── database.js          # Mongoose database configuration
├── models/
│   ├── User.js             # User model
│   └── Resume.js           # Resume model
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── resumeController.js  # Resume management logic
│   └── jobController.js     # Job search logic
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   ├── validation.js       # Request validation middleware
│   ├── upload.js           # File upload middleware
│   └── errorHandler.js     # Global error handling
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── resume.js           # Resume management routes
│   └── jobs.js             # Job search routes
├── services/
│   ├── resumeParser.js     # AI resume parsing service
│   └── linkedinService.js  # LinkedIn API integration
└── server.js               # Main application file
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for password security
- **Input Validation**: Joi schema validation
- **Rate Limiting**: Prevents abuse
- **CORS Protection**: Cross-origin request protection
- **Helmet**: Security headers
- **File Type Validation**: Only allows specific file types
- **File Size Limits**: Prevents large file uploads

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Set all required environment variables
2. **Database**: Use a production MongoDB instance
3. **File Storage**: Consider cloud storage (AWS S3, Google Cloud Storage) for resume files
4. **SSL/TLS**: Enable HTTPS
5. **Monitoring**: Add application monitoring and logging
6. **Backup**: Set up database backups

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the API documentation
- Review the error logs

## 🔄 Changelog

### v1.0.0

- Initial release
- AI-powered resume parsing
- LinkedIn job search integration
- User authentication system
- Resume management features
