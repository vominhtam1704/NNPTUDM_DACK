// ============================================
// ROLECONTROLLER.JS - ROLE MANAGEMENT
// ============================================
const Role = require('../models/Role');
const { formatSuccess, formatError } = require('../utils/response');

/**
 * Get All Roles - GET /roles
 * Get list of all roles
 */
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });

    res.status(200).json(
      formatSuccess(roles, 'Roles retrieved successfully')
    );
  } catch (error) {
    console.error('Get all roles error:', error);
    res.status(500).json(
      formatError('Failed to fetch roles: ' + error.message)
    );
  }
};

/**
 * Get Role by ID - GET /roles/:id
 * Get single role details
 */
exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json(
        formatError('Role not found')
      );
    }

    res.status(200).json(
      formatSuccess(role, 'Role retrieved successfully')
    );
  } catch (error) {
    console.error('Get role by ID error:', error);
    res.status(500).json(
      formatError('Failed to fetch role: ' + error.message)
    );
  }
};

/**
 * Create Role - POST /roles
 * Admin only - create new role with permissions
 */
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    // ===== VALIDATION =====
    if (!name) {
      return res.status(400).json(
        formatError('Role name is required')
      );
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ name: name.toLowerCase() });
    if (existingRole) {
      return res.status(409).json(
        formatError('Role already exists')
      );
    }

    // ===== CREATE ROLE =====
    const newRole = new Role({
      name: name.trim(),
      description: description || '',
      permissions: permissions || []
    });

    await newRole.save();

    res.status(201).json(
      formatSuccess(newRole, 'Role created successfully')
    );
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json(
      formatError('Failed to create role: ' + error.message)
    );
  }
};

/**
 * Update Role - PUT /roles/:id
 * Admin only - update role details and permissions
 */
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    // ===== VALIDATION =====
    if (!name && !description && !permissions) {
      return res.status(400).json(
        formatError('No fields to update')
      );
    }

    // ===== BUILD UPDATE OBJECT =====
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (permissions) updateData.permissions = permissions;

    // ===== UPDATE ROLE =====
    const role = await Role.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!role) {
      return res.status(404).json(
        formatError('Role not found')
      );
    }

    res.status(200).json(
      formatSuccess(role, 'Role updated successfully')
    );
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json(
      formatError('Failed to update role: ' + error.message)
    );
  }
};

/**
 * Delete Role - DELETE /roles/:id
 * Admin only - delete role (cannot delete default roles)
 */
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const defaultRoles = ['admin', 'barber', 'customer'];

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json(
        formatError('Role not found')
      );
    }

    // Prevent deleting default roles
    if (defaultRoles.includes(role.name.toLowerCase())) {
      return res.status(400).json(
        formatError('Cannot delete default role: ' + role.name)
      );
    }

    await Role.findByIdAndDelete(id);

    res.status(200).json(
      formatSuccess(null, 'Role deleted successfully')
    );
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json(
      formatError('Failed to delete role: ' + error.message)
    );
  }
};

/**
 * Add Permission to Role - POST /roles/:id/permissions
 * Admin only
 */
exports.addPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { permission } = req.body;

    if (!permission) {
      return res.status(400).json(
        formatError('Permission is required')
      );
    }

    const role = await Role.findByIdAndUpdate(
      id,
      { $addToSet: { permissions: permission } },
      { new: true }
    );

    if (!role) {
      return res.status(404).json(
        formatError('Role not found')
      );
    }

    res.status(200).json(
      formatSuccess(role, 'Permission added successfully')
    );
  } catch (error) {
    console.error('Add permission error:', error);
    res.status(500).json(
      formatError('Failed to add permission: ' + error.message)
    );
  }
};

/**
 * Remove Permission from Role - DELETE /roles/:id/permissions/:permission
 * Admin only
 */
exports.removePermission = async (req, res) => {
  try {
    const { id, permission } = req.params;

    const role = await Role.findByIdAndUpdate(
      id,
      { $pull: { permissions: permission } },
      { new: true }
    );

    if (!role) {
      return res.status(404).json(
        formatError('Role not found')
      );
    }

    res.status(200).json(
      formatSuccess(role, 'Permission removed successfully')
    );
  } catch (error) {
    console.error('Remove permission error:', error);
    res.status(500).json(
      formatError('Failed to remove permission: ' + error.message)
    );
  }
};
