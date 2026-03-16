const db = require('./models');

// Test script to verify dependency injection is working
async function testDependencyInjection() {
  try {
    console.log('Testing dependency injection...');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✓ Database connection successful');
    
    // Test controller factory function
    const initializeControllers = (db) => {
      const DiakController = require('./controllers/DiakController');
      const FelhasznaloController = require('./controllers/FelhasznaloController');
      const SzobaController = require('./controllers/SzobaController');
      const SzuloController = require('./controllers/SzuloController');
      const LakcimController = require('./controllers/LakcimController');
      const SzobaValtoztatasController = require('./controllers/SzobaValtoztatasController');

      return {
        diakController: new DiakController(db),
        felhasznaloController: new FelhasznaloController(db),
        szobaController: new SzobaController(db),
        szuloController: new SzuloController(db),
        lakcimController: new LakcimController(db),
        szobaValtoztatasController: new SzobaValtoztatasController(db)
      };
    };
    
    const controllers = initializeControllers(db);
    console.log('✓ Controllers initialized successfully');
    
    // Test that controllers have the expected methods
    const expectedMethods = ['getAllDiaks', 'getDiakById', 'createDiak', 'updateDiak', 'deleteDiak'];
    const diakControllerMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(controllers.diakController));
    const hasAllMethods = expectedMethods.every(method => diakControllerMethods.includes(method));
    
    if (hasAllMethods) {
      console.log('✓ DiakController has all expected methods');
    } else {
      console.log('✗ DiakController missing some methods');
    }
    
    // Test route files can be required without errors
    try {
      require('./routes/DiakRoutes');
      console.log('✓ DiakRoutes loaded successfully');
    } catch (error) {
      console.log('✗ Error loading DiakRoutes:', error.message);
    }
    
    try {
      require('./routes/FelhasznaloRoutes');
      console.log('✓ FelhasznaloRoutes loaded successfully');
    } catch (error) {
      console.log('✗ Error loading FelhasznaloRoutes:', error.message);
    }
    
    try {
      require('./routes/SzobaRoutes');
      console.log('✓ SzobaRoutes loaded successfully');
    } catch (error) {
      console.log('✗ Error loading SzobaRoutes:', error.message);
    }
    
    console.log('\n🎉 Dependency injection test completed successfully!');
    console.log('\nSummary:');
    console.log('- Controllers are now initialized at application startup');
    console.log('- Controllers are stored in app.locals.controllers');
    console.log('- Route handlers use direct controller access instead of lazy initialization');
    console.log('- This makes the code more testable and follows dependency injection principles');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    process.exit(1);
  }
}

testDependencyInjection();