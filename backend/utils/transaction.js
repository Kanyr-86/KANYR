/**
 * Transaction Utility for Sequelize ORM
 * Provides a helper function to handle database transactions
 */

/**
 * Execute a callback within a database transaction
 * Automatically commits on success, rolls back on error
 * 
 * @param {Object} db - Sequelize database instance (from models/index.js)
 * @param {Function} callback - Async function that receives transaction object
 * @returns {Promise<any>} - Result of the callback function
 * @throws {Error} - Re-throws any error after rollback
 * 
 * @example
 * // Basic usage in a service:
 * const { withTransaction } = require('../utils/transaction');
 * 
 * const createDiakWithUser = async (db, diakData, userData) => {
 *   return withTransaction(db, async (transaction) => {
 *     const user = await db.Felhasznalo.create(userData, { transaction });
 *     const diak = await db.Diak.create(
 *       { ...diakData, user_id: user.id },
 *       { transaction }
 *     );
 *     return diak;
 *   });
 * };
 * 
 * @example
 * // Usage in controller:
 * const createOrder = async (req, res, next) => {
 *   try {
 *     const result = await withTransaction(req.app.locals.db, async (t) => {
 *       const order = await db.Order.create(orderData, { transaction: t });
 *       await db.OrderItem.bulkCreate(items, { transaction: t });
 *       return order;
 *     });
 *     res.json(result);
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 */
const withTransaction = async (db, callback) => {
  // Start a new transaction
  const transaction = await db.sequelize.transaction();

  try {
    // Execute the callback with the transaction
    const result = await callback(transaction);

    // Commit the transaction if successful
    await transaction.commit();

    return result;
  } catch (error) {
    // Rollback the transaction on error
    await transaction.rollback();

    // Re-throw the error for handling upstream
    throw error;
  }
};

module.exports = withTransaction;