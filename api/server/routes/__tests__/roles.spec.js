const { z } = require('zod');
const request = require('supertest');
const express = require('express');
const { SystemRoles, roleDefaults } = require('aladin-data-provider');
const { getRoleByName, updateRoleByName } = require('~/models/Role');
const rolesRoute = require('../roles');

// Mock middlewares
jest.mock('~/server/middleware', () => ({
  checkAdmin: (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
      next();
    } else {
      res.status(403).send({ message: 'Forbidden' });
    }
  },
  requireJwtAuth: (req, res, next) => {
    req.user = req.user || { role: 'USER' };
    next();
  },
}));

// Mock Role model
jest.mock('~/models/Role', () => ({
  getRoleByName: jest.fn(),
  updateRoleByName: jest.fn(),
}));

const app = express();
app.use(express.json());
// Add a middleware to easily mock user role
app.use((req, res, next) => {
  if (req.headers['x-mock-role']) {
    req.user = { role: req.headers['x-mock-role'] };
  } else {
    req.user = { role: 'USER' };
  }
  next();
});
app.use('/api/roles', rolesRoute);

describe('Roles Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/roles', () => {
    it('should validate and parse query name, throwing 400 for empty', async () => {
      const response = await request(app).get('/api/roles?name=%20%20%20');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid role name');
      expect(response.body.error[0].message).toBe('Role name cannot be empty');
    });

    it('should uppercase query name and fetch successfully for user', async () => {
      getRoleByName.mockResolvedValueOnce({ name: 'USER', permissions: {} });

      const response = await request(app).get('/api/roles?name=user');

      expect(response.status).toBe(200);
      expect(getRoleByName).toHaveBeenCalledWith('USER', '-_id -__v');
      expect(response.body.name).toBe('USER');
    });

    it('should fallback to USER if no query name is provided', async () => {
      getRoleByName.mockResolvedValueOnce({ name: 'USER', permissions: {} });

      const response = await request(app).get('/api/roles');

      expect(response.status).toBe(200);
      expect(getRoleByName).toHaveBeenCalledWith('USER', '-_id -__v');
      expect(response.body.name).toBe('USER');
    });
  });

  describe('GET /api/roles/:roleName', () => {
    it('should validate and parse roleName, throwing 400 for empty', async () => {
      const response = await request(app).get('/api/roles/%20%20%20');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid role name');
      expect(response.body.error[0].message).toBe('Role name cannot be empty');
    });

    it('should uppercase roleName and fetch successfully for USER', async () => {
      getRoleByName.mockResolvedValueOnce({ name: 'USER', permissions: {} });

      const response = await request(app).get('/api/roles/user');

      expect(response.status).toBe(200);
      expect(getRoleByName).toHaveBeenCalledWith('USER', '-_id -__v');
      expect(response.body.name).toBe('USER');
    });

    it('should return 403 if non-admin tries to fetch ADMIN', async () => {
      const response = await request(app)
        .get('/api/roles/admin')
        .set('x-mock-role', 'USER');

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/roles/:roleName/prompts', () => {
    it('should validate roleName and return 400 for empty', async () => {
      const response = await request(app)
        .put('/api/roles/%20%20%20/prompts')
        .set('x-mock-role', 'ADMIN')
        .send({ USE: true });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid role name');
    });

    it('should parse roleName properly and update', async () => {
      getRoleByName.mockResolvedValueOnce({ name: 'USER', permissions: {} });
      updateRoleByName.mockResolvedValueOnce({ name: 'USER', permissions: { PROMPTS: { USE: true } } });

      const response = await request(app)
        .put('/api/roles/user/prompts')
        .set('x-mock-role', 'ADMIN')
        .send({ USE: true });

      expect(response.status).toBe(200);
      expect(getRoleByName).toHaveBeenCalledWith('USER');
      expect(updateRoleByName).toHaveBeenCalledWith('USER', expect.any(Object));
    });
  });
});
