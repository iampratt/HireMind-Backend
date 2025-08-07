const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const Resume = require('../src/models/Resume');

describe('HireMind API Tests', () => {
  let authToken;
  let userId;
  let resumeId;

  beforeAll(async () => {
    // Clean up test data
    await Resume.deleteMany();
    await User.deleteMany();
  });

  afterAll(async () => {
    // Mongoose connection is handled by the server
  });

  describe('Authentication', () => {
    test('POST /api/auth/signup - should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        geminiApiKey: 'test-gemini-key',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();

      authToken = response.body.data.token;
      userId = response.body.data.user.id;
    });

    test('POST /api/auth/login - should login existing user', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    test('GET /api/auth/profile - should get user profile', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });
  });

  describe('Resume Management', () => {
    test('GET /api/resume - should get empty resume list initially', async () => {
      const response = await request(app)
        .get('/api/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    // Note: File upload tests would require actual file uploads
    // This is a placeholder for demonstration
    test('POST /api/resume/upload - should reject without file', async () => {
      const response = await request(app)
        .post('/api/resume/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No resume file uploaded');
    });
  });

  describe('Job Search', () => {
    test('GET /api/jobs/search - should require keywords or location', async () => {
      const response = await request(app)
        .get('/api/jobs/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        'Either keywords or location must be provided'
      );
    });

    test('GET /api/jobs/search - should search with keywords', async () => {
      const response = await request(app)
        .get(
          '/api/jobs/search?keywords=software engineer&location=San Francisco'
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('jobs');
      expect(response.body.data).toHaveProperty('totalResults');
    });

    test('GET /api/jobs/recommendations - should require resume data', async () => {
      const response = await request(app)
        .get('/api/jobs/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        'No resume with extracted data found'
      );
    });
  });

  describe('Error Handling', () => {
    test('GET /api/auth/profile - should reject without token', async () => {
      const response = await request(app).get('/api/auth/profile').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });

    test('GET /api/resume - should reject without token', async () => {
      const response = await request(app).get('/api/resume').expect(401);

      expect(response.body.success).toBe(false);
    });

    test('GET /api/jobs/search - should reject without token', async () => {
      const response = await request(app).get('/api/jobs/search').expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
