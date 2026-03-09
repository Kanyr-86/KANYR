/**
 * Tranzakció segédprogram Sequelize ORM-hez
 * Segédfüggvényt biztosít adatbázis tranzakciók kezeléséhez
 */

/**
 * Callback végrehajtása adatbázis tranzakción belül
 * Siker esetén automatikusan commit-ol, hiba esetén rollback-et végez
 * 
 * @param {Object} db - Sequelize adatbázis példány (a models/index.js-ből)
 * @param {Function} callback - Async függvény, amely megkapja a tranzakció objektumot
 * @returns {Promise<any>} - A callback függvény eredménye
 * @throws {Error} - Bármely hibát újradob a rollback után
 * 
 * @example
 * // Alapvető használat egy szervizben:
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
 * // Használat kontrollerben:
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
  // Új tranzakció indítása
  const transaction = await db.sequelize.transaction();

  try {
    // Callback végrehajtása a tranzakcióval
    const result = await callback(transaction);

    // Tranzakció commit-olása siker esetén
    await transaction.commit();

    return result;
  } catch (error) {
    // Tranzakció rollback-je hiba esetén
    await transaction.rollback();

    // Hiba újradobása a felsőbb szintű kezeléshez
    throw error;
  }
};

module.exports = withTransaction;