/**
 * Role constants for the KANYR system
 * Centralized role definitions to ensure consistency across the application
 */

/**
 * Role hierarchy (from highest to lowest permissions):
 * - FOTITKAR (főtitkár/chief secretary): Full system access
 * - TITKAR (titkár/secretary): Standard administrative access
 * - DIAK (diák/student): Limited access to own data only
 */

const ROLES = {
  /** Főtitkár - Chief secretary, full admin access */
  FOTITKAR: 'főtitkár',
  /** Titkár - Secretary, standard administrative access */
  TITKAR: 'titkár',
  /** Diák - Student, limited access */
  DIAK: 'diák'
};

/**
 * Legacy boolean mapping for backward compatibility
 * Maps the old admin boolean to new role system
 * @param {boolean} admin - The admin boolean from database
 * @returns {string} The corresponding role
 */
const mapAdminToRole = (admin) => {
  return admin ? ROLES.FOTITKAR : ROLES.TITKAR;
};

/**
 * Check if a role has administrative privileges
 * @param {string} role - The role to check
 * @returns {boolean} True if role has admin privileges
 */
const isAdminRole = (role) => {
  return role === ROLES.FOTITKAR;
};

/**
 * Check if a role can modify data (create, update, delete)
 * Both főtitkár and titkár can modify data
 * @param {string} role - The role to check
 * @returns {boolean} True if role can modify data
 */
const canModifyRole = (role) => {
  return role === ROLES.FOTITKAR || role === ROLES.TITKAR;
};

/**
 * Array of all valid roles for validation purposes
 */
const VALID_ROLES = Object.values(ROLES);

/**
 * Role display names for UI/error messages
 */
const ROLE_DISPLAY_NAMES = {
  [ROLES.FOTITKAR]: 'Főtitkár',
  [ROLES.TITKAR]: 'Titkár',
  [ROLES.DIAK]: 'Diák'
};

module.exports = {
  ROLES,
  VALID_ROLES,
  ROLE_DISPLAY_NAMES,
  mapAdminToRole,
  isAdminRole,
  canModifyRole
};
