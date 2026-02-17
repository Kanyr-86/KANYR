const db = require('./models');

async function testDatabase() {
  try {
    await db.sequelize.authenticate();
    console.log('✓ Database connected successfully');
    
    // Test if tables exist
    const tables = await db.sequelize.getQueryInterface().showAllTables();
    console.log('✓ Tables found:', tables);
    
    // Test if test data exists
    const users = await db.Felhasznalo.findAll();
    console.log('✓ Users found:', users.length);
    
    const diaks = await db.Diak.findAll();
    console.log('✓ Students found:', diaks.length);
    
    // Test specific user
    const user = await db.Felhasznalo.findOne({
      where: { email: 'nagy.bernadett@student.hu' }
    });
    
    if (user) {
      console.log('✓ Test user found:', user.username, 'diak_id:', user.diak_id);
    } else {
      console.log('✗ Test user not found');
    }
    
  } catch (error) {
    console.error('✗ Database connection error:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

testDatabase();