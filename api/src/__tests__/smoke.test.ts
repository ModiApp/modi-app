import request from 'supertest';
import app from '@/index';

describe('smoke', () => {
  it('GET / returns 200 and expected text', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Herro herro');
  });
});