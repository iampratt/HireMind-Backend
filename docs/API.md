# HireMind API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /auth/signup

Register a new user account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securepassword123",
  "geminiApiKey": "YOUR_GEMINI_API_KEY"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/login

Login with existing credentials.

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "geminiApiKey": "YOUR_GEMINI_API_KEY"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET /auth/profile

Get current user profile and resume list.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "resumes": [
      {
        "id": "507f1f77bcf86cd799439012",
        "fileName": "resume.pdf",
        "uploadedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Resume Management

#### POST /resume/upload

Upload and parse a resume using AI.

**Headers:**

```
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**Form Data:**

- `resumeFile`: Resume file (PDF, DOC, DOCX, TXT)

**Response (200):**

```json
{
  "success": true,
  "message": "Resume processed successfully",
  "data": {
    "resumeId": "507f1f77bcf86cd799439012",
    "fileName": "resume.pdf",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "extractedData": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "123-456-7890",
      "location": "San Francisco, CA",
      "skills": ["JavaScript", "Node.js", "React", "MongoDB", "Express.js"],
      "experience": [
        {
          "title": "Senior Software Engineer",
          "company": "Tech Corp",
          "duration": "2020-Present",
          "description": "Full-stack development with React and Node.js"
        },
        {
          "title": "Software Engineer",
          "company": "Startup Inc",
          "duration": "2018-2020",
          "description": "Backend development with Python and Django"
        }
      ],
      "education": [
        {
          "degree": "Bachelor of Science in Computer Science",
          "institution": "University of California",
          "years": "2014-2018"
        }
      ],
      "summary": "Experienced software engineer with 5+ years in full-stack development"
    }
  }
}
```

#### GET /resume

Get all user resumes.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "fileName": "resume.pdf",
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "extractedData": {
        "name": "John Doe",
        "skills": ["JavaScript", "React"],
        "location": "San Francisco, CA"
      }
    }
  ]
}
```

#### GET /resume/:id

Get specific resume details.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "fileName": "resume.pdf",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "extractedData": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "skills": ["JavaScript", "React"],
      "location": "San Francisco, CA"
    }
  }
}
```

#### DELETE /resume/:id

Delete a resume.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Resume deleted successfully"
}
```

#### POST /resume/:id/reparse

Re-parse a resume with updated AI extraction.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Resume re-parsed successfully",
  "data": {
    "resumeId": "507f1f77bcf86cd799439012",
    "fileName": "resume.pdf",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "extractedData": {
      "name": "John Doe",
      "skills": ["JavaScript", "React", "Node.js"],
      "location": "San Francisco, CA"
    }
  }
}
```

### Job Search

#### GET /jobs/search

Search for jobs on LinkedIn.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**

- `resumeId` (optional): Use extracted data from specific resume
- `keywords` (optional): Custom search keywords
- `location` (optional): Job location
- `experienceLevel` (optional): Experience level filter (1-6)
- `jobType` (optional): Job type filter (F,P,C,I)
- `workSchedule` (optional): Work schedule filter (1,2,3)
- `postedWithin` (optional): Time filter (r86400,r604800,r2592000)
- `start` (optional): Pagination offset
- `simplifiedApplication` (optional): Filter for simplified applications
- `lessThan10Applicants` (optional): Filter for jobs with <10 applicants

**Example Request:**

```
GET /api/jobs/search?keywords=software engineer&location=San Francisco&experienceLevel=3&jobType=F&postedWithin=r604800
```

**Response (200):**

```json
{
  "success": true,
  "message": "Jobs fetched successfully",
  "data": {
    "jobs": [
      {
        "id": "123456789",
        "title": "Senior Software Engineer",
        "company": "Tech Company Inc",
        "location": "San Francisco, CA",
        "postTime": "2 days ago",
        "jobUrl": "https://www.linkedin.com/jobs/view/123456789",
        "applicationUrl": "https://www.linkedin.com/jobs/view/123456789"
      },
      {
        "id": "987654321",
        "title": "Full Stack Developer",
        "company": "Startup XYZ",
        "location": "San Francisco Bay Area",
        "postTime": "1 week ago",
        "jobUrl": "https://www.linkedin.com/jobs/view/987654321",
        "applicationUrl": "https://www.linkedin.com/jobs/view/987654321"
      }
    ],
    "searchParams": {
      "keywords": "software engineer",
      "location": "San Francisco",
      "experienceLevel": "3",
      "jobType": "F",
      "postedWithin": "r604800"
    },
    "totalResults": 2
  }
}
```

#### GET /jobs/:jobId/details

Get detailed job information.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "title": "Senior Software Engineer",
    "company": "Tech Company Inc",
    "location": "San Francisco, CA",
    "description": "We are looking for a Senior Software Engineer...",
    "requirements": [
      "5+ years of experience in software development",
      "Proficiency in JavaScript, React, and Node.js",
      "Experience with cloud platforms (AWS, GCP)"
    ],
    "benefits": ["Competitive salary", "Health insurance", "401k matching"],
    "applicationUrl": "https://www.linkedin.com/jobs/view/123456789"
  }
}
```

#### GET /jobs/recommendations

Get AI-powered job recommendations based on resume data.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Job recommendations generated successfully",
  "data": {
    "jobs": [
      {
        "id": "123456789",
        "title": "Senior Software Engineer",
        "company": "Tech Company Inc",
        "location": "San Francisco, CA",
        "postTime": "2 days ago",
        "jobUrl": "https://www.linkedin.com/jobs/view/123456789",
        "recommendationReason": "Jobs matching your primary skills"
      }
    ],
    "totalRecommendations": 1,
    "basedOnResume": "Most recent resume"
  }
}
```

#### GET /jobs/recommendations/:resumeId

Get job recommendations for specific resume.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Job recommendations generated successfully",
  "data": {
    "jobs": [
      {
        "id": "123456789",
        "title": "Senior Software Engineer",
        "company": "Tech Company Inc",
        "location": "San Francisco, CA",
        "postTime": "2 days ago",
        "jobUrl": "https://www.linkedin.com/jobs/view/123456789",
        "recommendationReason": "Jobs matching your primary skills"
      }
    ],
    "totalRecommendations": 1,
    "basedOnResume": "507f1f77bcf86cd799439012"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

**400 Bad Request:**

```json
{
  "success": false,
  "message": "Validation error",
  "details": ["Email is required", "Password must be at least 6 characters"]
}
```

**401 Unauthorized:**

```json
{
  "success": false,
  "message": "Access token required"
}
```

**404 Not Found:**

```json
{
  "success": false,
  "message": "Resume not found"
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "message": "Internal server error",
  "details": {
    "message": "Database connection failed",
    "stack": "...",
    "name": "DatabaseError"
  }
}
```

## LinkedIn API Parameters

### Experience Level (f_E)

- `1`: Intern
- `2`: Entry level
- `3`: Associate
- `4`: Mid-Senior level
- `5`: Director
- `6`: Executive

### Job Type (f_JT)

- `F`: Full-time
- `P`: Part-time
- `C`: Contract
- `I`: Internship

### Work Schedule (f_WT)

- `1`: On-site
- `2`: Remote
- `3`: Hybrid

### Posted Within (f_TPR)

- `r86400`: 24 hours
- `r604800`: 7 days
- `r2592000`: 30 days

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window**: 15 minutes
- **Limit**: 100 requests per IP address
- **Headers**: Rate limit information is included in response headers

## File Upload Limits

- **Maximum file size**: 10MB
- **Supported formats**: PDF, DOC, DOCX, TXT
- **Storage**: Local file system (configurable for cloud storage)
