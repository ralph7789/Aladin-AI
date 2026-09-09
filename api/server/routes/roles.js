const express = require('express');
const { z } = require('zod');

/**
 * Schema for validating and parsing role names.
 * Trims whitespace, enforces at least 1 character, and transforms to uppercase.
 */
const roleNameSchema = z.string().trim().min(1, 'Role name cannot be empty').toUpperCase();
const {
  SystemRoles,
  roleDefaults,
  PermissionTypes,
  agentPermissionsSchema,
  promptPermissionsSchema,
  memoryPermissionsSchema,
  marketplacePermissionsSchema,
  peoplePickerPermissionsSchema,
} = require('aladin-data-provider');
const { checkAdmin, requireJwtAuth } = require('~/server/middleware');
const { updateRoleByName, getRoleByName } = require('~/models/Role');

const router = express.Router();
router.use(requireJwtAuth);

/**
 * Permission configuration mapping
 * Maps route paths to their corresponding schemas and permission types
 */
const permissionConfigs = {
  prompts: {
    schema: promptPermissionsSchema,
    permissionType: PermissionTypes.PROMPTS,
    errorMessage: 'Invalid prompt permissions.',
  },
  agents: {
    schema: agentPermissionsSchema,
    permissionType: PermissionTypes.AGENTS,
    errorMessage: 'Invalid agent permissions.',
  },
  memories: {
    schema: memoryPermissionsSchema,
    permissionType: PermissionTypes.MEMORIES,
    errorMessage: 'Invalid memory permissions.',
  },
  'people-picker': {
    schema: peoplePickerPermissionsSchema,
    permissionType: PermissionTypes.PEOPLE_PICKER,
    errorMessage: 'Invalid people picker permissions.',
  },
  marketplace: {
    schema: marketplacePermissionsSchema,
    permissionType: PermissionTypes.MARKETPLACE,
    errorMessage: 'Invalid marketplace permissions.',
  },
};

/**
 * Generic handler for updating permissions
 * @param {string} permissionKey - The key from permissionConfigs
 * @returns {Function} Express route handler
 */
const createPermissionUpdateHandler = (permissionKey) => {
  const config = permissionConfigs[permissionKey];

  return async (req, res) => {
    const { roleName: _r } = req.params;
    let roleName;
    try {
      roleName = roleNameSchema.parse(_r);
    } catch (error) {
      return res.status(400).send({ message: 'Invalid role name', error: error.errors });
    }
    const updates = req.body;

    try {
      const parsedUpdates = config.schema.partial().parse(updates);

      const role = await getRoleByName(roleName);
      if (!role) {
        return res.status(404).send({ message: 'Role not found' });
      }

      const currentPermissions =
        role.permissions?.[config.permissionType] || role[config.permissionType] || {};

      const mergedUpdates = {
        permissions: {
          ...role.permissions,
          [config.permissionType]: {
            ...currentPermissions,
            ...parsedUpdates,
          },
        },
      };

      const updatedRole = await updateRoleByName(roleName, mergedUpdates);
      res.status(200).send(updatedRole);
    } catch (error) {
      return res.status(400).send({ message: config.errorMessage, error: error.errors });
    }
  };
};

/**
 * GET /api/roles/:roleName
 * Get a specific role by name
 */
router.get('/:roleName', async (req, res) => {
  const { roleName: _r } = req.params;
  try {
    const roleName = roleNameSchema.parse(_r);

    if (
      (req.user.role !== SystemRoles.ADMIN && roleName === SystemRoles.ADMIN) ||
      (req.user.role !== SystemRoles.ADMIN && !roleDefaults[roleName])
    ) {
      return res.status(403).send({ message: 'Unauthorized' });
    }
    const role = await getRoleByName(roleName, '-_id -__v');
    if (!role) {
      return res.status(404).send({ message: 'Role not found' });
    }

    res.status(200).send(role);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).send({ message: 'Invalid role name', error: error.errors });
    }
    return res.status(500).send({ message: 'Failed to retrieve role', error: error.message });
  }
});

/**
 * PUT /api/roles/:roleName/prompts
 * Update prompt permissions for a specific role
 */
router.put('/:roleName/prompts', checkAdmin, createPermissionUpdateHandler('prompts'));

/**
 * PUT /api/roles/:roleName/agents
 * Update agent permissions for a specific role
 */
router.put('/:roleName/agents', checkAdmin, createPermissionUpdateHandler('agents'));

/**
 * PUT /api/roles/:roleName/memories
 * Update memory permissions for a specific role
 */
router.put('/:roleName/memories', checkAdmin, createPermissionUpdateHandler('memories'));

/**
 * PUT /api/roles/:roleName/people-picker
 * Update people picker permissions for a specific role
 */
router.put('/:roleName/people-picker', checkAdmin, createPermissionUpdateHandler('people-picker'));

/**
 * PUT /api/roles/:roleName/marketplace
 * Update marketplace permissions for a specific role
 */
router.put('/:roleName/marketplace', checkAdmin, createPermissionUpdateHandler('marketplace'));


/**
 * Retrieve Role based on query/params
 * @route GET /api/roles
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 */
router.get('/', async (req, res) => {
  try {
    const name = req.query.name || req.params.name || SystemRoles.USER;
    const roleName = roleNameSchema.parse(String(name));
    const role = await getRoleByName(roleName, '-_id -__v');

    if (!role) {
      return res.status(404).send('Role not found');
    }

    res.status(200).send(role);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).send({ message: 'Invalid role name', error: error.errors });
    }
    return res.status(500).send({ message: 'Failed to retrieve role', error: error.message });
  }
});

module.exports = router;
