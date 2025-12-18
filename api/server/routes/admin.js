const express = require('express');
const router = express.Router();
const requireJwtAuth = require('../middleware/requireJwtAuth');
const checkAdmin = require('../middleware/roles/admin');
const mongoose = require('mongoose');

// Use JWT Auth for all routes in this router
router.use(requireJwtAuth);

// Get models safely from Mongoose registry
const User = mongoose.models.User;
const License = mongoose.models.License;

// --- USER MANAGEMENT ---

// Get all users
router.get('/users', checkAdmin, async (req, res) => {
  try {
    const User = mongoose.models.User;
    console.log('[AdminAPI] Fetching users...');
    if (!User) { throw new Error('User model is undefined'); }
    const users = await User.find({}, '-password').lean();
    console.log(`[AdminAPI] Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('[AdminAPI] Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message, stack: error.stack });
  }
});

// Create user
router.post('/users', checkAdmin, async (req, res) => {
  try {
    const User = mongoose.models.User;
    const { username, email, password, role, license } = req.body;
    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check existing
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
        return res.status(409).json({ message: 'User already exists' });
    }

    const newUser = await User.create({
        username,
        email,
        password, // Pre-save hook hashes this usually, or we use bcrypt here if not
        role: role || 'USER',
        license,
        emailVerified: true
    });
    
    // Casbin policy update would happen here (omitted for brevity, handled by hooks usually or service)
    
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Update user
router.put('/users/:id', checkAdmin, async (req, res) => {
  try {
    const User = mongoose.models.User;
    const { id } = req.params;
    const updates = req.body;
    delete updates.password; // Handle password change separately or securely
    
    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    res.json(user);
  } catch (error) {
     res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Delete user
router.delete('/users/:id', checkAdmin, async (req, res) => {
  try {
    const User = mongoose.models.User;
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// --- LICENSE MANAGEMENT ---

// Get all licenses
router.get('/licenses', checkAdmin, async (req, res) => {
  try {
    const License = mongoose.models.License;
    console.log('[AdminAPI] Fetching licenses...');
    if (!License) { throw new Error('License model is undefined'); }
    const licenses = await License.find({});
    console.log(`[AdminAPI] Found ${licenses.length} licenses`);
    res.json(licenses);
  } catch (error) {
    console.error('[AdminAPI] Error fetching licenses:', error);
    res.status(500).json({ message: 'Error fetching licenses', error: error.message, stack: error.stack });
  }
});

// Create license
router.post('/licenses', checkAdmin, async (req, res) => {
    try {
        const License = mongoose.models.License;
        const licenseData = req.body;
        const newLicense = await License.create(licenseData);
        res.status(201).json(newLicense);
    } catch (error) {
        res.status(500).json({ message: 'Error creating license', error: error.message });
    }
});

// Update license
router.put('/licenses/:id', checkAdmin, async (req, res) => {
    try {
        const License = mongoose.models.License;
        const { id } = req.params;
        const updated = await License.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error updating license', error: error.message });
    }
});

// Delete license
router.delete('/licenses/:id', checkAdmin, async (req, res) => {
    try {
        const License = mongoose.models.License;
        await License.findByIdAndDelete(req.params.id);
        res.json({ message: 'License deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting license', error: error.message });
    }
});

// --- ROLE MANAGEMENT ---

// Get all roles
router.get('/roles', checkAdmin, async (req, res) => {
  try {
    const Role = mongoose.models.Role;
    console.log('[AdminAPI] Fetching roles...');
    if (!Role) { throw new Error('Role model is undefined'); }
    const roles = await Role.find({});
    console.log(`[AdminAPI] Found ${roles.length} roles`);
    res.json(roles);
  } catch (error) {
    console.error('[AdminAPI] Error fetching roles:', error);
    res.status(500).json({ message: 'Error fetching roles', error: error.message });
  }
});

// Create role
router.post('/roles', checkAdmin, async (req, res) => {
  try {
    const Role = mongoose.models.Role;
    const { name, permissions } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Role name is required' });
    }

    const existing = await Role.findOne({ name });
    if (existing) {
        return res.status(409).json({ message: 'Role already exists' });
    }

    const newRole = await Role.create({
        name,
        permissions: permissions || {}
    });
    res.status(201).json(newRole);
  } catch (error) {
    res.status(500).json({ message: 'Error creating role', error: error.message });
  }
});

// Update role permissions
router.put('/roles/:id', checkAdmin, async (req, res) => {
  try {
    const Role = mongoose.models.Role;
    const { id } = req.params;
    
    const role = await Role.findByIdAndUpdate(id, req.body, { new: true });
    res.json(role);
  } catch (error) {
    res.status(500).json({ message: 'Error updating role', error: error.message });
  }
});

// Delete role
router.delete('/roles/:id', checkAdmin, async (req, res) => {
  try {
    const Role = mongoose.models.Role;
    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting role', error: error.message });
  }
});

module.exports = router;
