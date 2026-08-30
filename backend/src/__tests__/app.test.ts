process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

import request from 'supertest';
import { createApp } from '@/app';
import { signToken } from '@/middleware/auth';

const app = createApp();

describe('health endpoint', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('datenight-api');
  });
});

describe('auth middleware', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/groups');
    expect(res.status).toBe(401);
  });

  it('rejects garbage tokens', async () => {
    const res = await request(app)
      .get('/api/groups')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});

describe('signToken', () => {
  it('produces a JWT with three segments', () => {
    const token = signToken('user-1', 'a@b.com');
    expect(token.split('.')).toHaveLength(3);
  });
});

describe('unknown routes', () => {
  it('404s', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
  });
});
