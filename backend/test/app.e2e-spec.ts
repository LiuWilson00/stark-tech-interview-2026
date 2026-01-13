import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('API Health Check (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/health (GET)', () => {
    it('should return API health and info', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'ok');
      expect(response.body.data).toHaveProperty('name', 'TodoList API');
      expect(response.body.data).toHaveProperty('version', '1.0.0');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('documentation', '/api/docs');
      expect(response.body.data).toHaveProperty('endpoints');
    });

    it('should include all endpoint categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      const { endpoints } = response.body.data;

      expect(endpoints).toHaveProperty('auth');
      expect(endpoints).toHaveProperty('users');
      expect(endpoints).toHaveProperty('teams');
      expect(endpoints).toHaveProperty('tasks');

      // Verify auth endpoints
      expect(endpoints.auth).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ method: 'POST', path: '/api/auth/login' }),
          expect.objectContaining({ method: 'POST', path: '/api/auth/register' }),
        ])
      );

      // Verify tasks endpoints
      expect(endpoints.tasks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ method: 'GET', path: '/api/tasks' }),
          expect.objectContaining({ method: 'POST', path: '/api/tasks' }),
        ])
      );
    });

    it('should be accessible without authentication', async () => {
      // Health endpoint should be public (no auth header)
      await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);
    });
  });
});
