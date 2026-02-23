/**
 * Async Handler Wrapper for Express Route Handlers
 * Eliminates the need for try-catch blocks in controller functions
 */

/**
 * Wraps an async function to catch errors and pass them to Express's next()
 * @param {Function} fn - Async function to wrap (Express route handler)
 * @returns {Function} - Express middleware function with error handling
 * 
 * @example
 * // Usage in a controller:
 * const getUser = asyncHandler(async (req, res, next) => {
 *   const user = await UserService.getById(req.params.id);
 *   res.json(user);
 * });
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;