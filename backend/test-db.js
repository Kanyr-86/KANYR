const db = require('./models');
const logger = require('./utils/logger');

async function testDatabase() {
  try {
    await db.sequelize.authenticate();
    logger.info('✓ Database connected successfully');
    
    // Táblák létezésének ellenőrzése
    const tables = await db.sequelize.getQueryInterface().showAllTables();
    logger.info('✓ Tables found', { tables });
    
    // Tesztadatok létezésének ellenőrzése
    const users = await db.Felhasznalo.findAll();
    logger.info('✓ Users found', { count: users.length });
    
    const diaks = await db.Diak.findAll();
    logger.info('✓ Students found', { count: diaks.length });
    
    // Konkrét felhasználó tesztelése
    const user = await db.Felhasznalo.findOne({
      where: { email: 'nagy.bernadett@student.hu' }
    });
    
    if (user) {
      logger.info('✓ Test user found', { username: user.username, diak_id: user.diak_id });
    } else {
      logger.warn('✗ Test user not found');
    }
    
  } catch (error) {
    logger.error('✗ Database connection error', { message: error.message, stack: error.stack });
  } finally {
    await db.sequelize.close();
  }
}

testDatabase();
