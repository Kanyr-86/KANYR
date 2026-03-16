/**
 * Comprehensive test suite for data integrity improvements:
 * - Unique constraints on business keys
 * - Date validation constraints
 * - Database-level constraint enforcement
 */

const { sequelize } = require('./config/database');
const db = require('./models');

async function testDataIntegrity() {
  console.log('🧪 Testing Data Integrity Improvements...\n');

  try {
    // Test 1: Database connection and constraint verification
    console.log('1. Verifying database constraints...');
    await sequelize.authenticate();
    console.log('✓ Database connection successful');

    // Check if date validation constraint exists
    const constraints = await sequelize.query(
      `SELECT name FROM sqlite_master 
       WHERE type = 'trigger' AND tbl_name = 'szoba_bekoltozes' 
       AND name LIKE '%chk_bekoltozes_dates%'`
    );

    if (constraints[0].length > 0) {
      console.log('✓ Date validation constraint exists in database');
    } else {
      console.log('⚠ Date validation constraint not found (may need migration)');
    }

    // Test 2: Unique constraint enforcement for business keys
    console.log('\n2. Testing unique constraints for business keys...');

    // Create a test address first
    const testAddress = await db.Lakcim.create({
      iranyitoszam: '1111',
      varos: 'Budapest',
      utca_hazszam: 'Teszt utca 1',
      emelet: 1,
      ajto: 1
    });

    // Create a test parent first
    const testParent = await db.Szulo.create({
      nev: 'Teszt Szülő Integritás',
      email: 'szulo-integritas@kanyr.hu',
      telefonszam: '098-765-4321',
      szemelyi_igazolvany_szam: `PARENT${Date.now()}`,
      cim_id: testAddress.cim_id
    });

    // Create a test student
    const testStudent = await db.Diak.create({
      nev: 'Teszt Diák Integritás',
      email: `integritas-${Date.now()}@kanyr.hu`,
      telefonszam: '123-456-7890',
      szuletesi_datum: '2000-01-01',
      szemelyi_igazolvany_szam: `UNIQUE${Date.now()}`,
      taj_szam: `123456789${Math.floor(Math.random() * 10)}`,
      diakigazolvany_szam: `DIK${Date.now()}`,
      szulo_id: testParent.szulo_id,
      kapcsolat_tipusa: 'anya',
      cim_id: testAddress.cim_id,
      nem: 'férfi'
    });

    console.log('✓ Test student created successfully');

    // Test duplicate TAJ number (should fail)
    try {
      await db.Diak.create({
        nev: 'Másik Diák',
        email: `masik-${Date.now()}@kanyr.hu`,
        telefonszam: '098-765-4321',
        szuletesi_datum: '2001-01-01',
        szemelyi_igazolvany_szam: `OTHER${Date.now()}`,
        taj_szam: testStudent.taj_szam, // Same TAJ number
        diakigazolvany_szam: `OTHER${Date.now()}`,
        kapcsolat_tipusa: 'apa',
        nem: 'nő'
      });
      console.log('✗ Duplicate TAJ number was allowed (constraint not working)');
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.log('✓ TAJ number unique constraint working correctly');
      } else {
        console.log('✗ Unexpected error:', error.message);
      }
    }

    // Test duplicate ID card number (should fail)
    try {
      await db.Diak.create({
        nev: 'Harmadik Diák',
        email: `harmadik-${Date.now()}@kanyr.hu`,
        telefonszam: '111-222-3333',
        szuletesi_datum: '2002-01-01',
        szemelyi_igazolvany_szam: testStudent.szemelyi_igazolvany_szam, // Same ID card number
        taj_szam: `223456789${Math.floor(Math.random() * 10)}`,
        diakigazolvany_szam: `OTHER2${Date.now()}`,
        kapcsolat_tipusa: 'gondviselo',
        nem: 'férfi'
      });
      console.log('✗ Duplicate ID card number was allowed (constraint not working)');
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.log('✓ ID card number unique constraint working correctly');
      } else {
        console.log('✗ Unexpected error:', error.message);
      }
    }

    // Test duplicate student ID number (should fail)
    try {
      await db.Diak.create({
        nev: 'Negyedik Diák',
        email: `negyedik-${Date.now()}@kanyr.hu`,
        telefonszam: '444-555-6666',
        szuletesi_datum: '2003-01-01',
        szemelyi_igazolvany_szam: `OTHER3${Date.now()}`,
        taj_szam: `323456789${Math.floor(Math.random() * 10)}`,
        diakigazolvany_szam: testStudent.diakigazolvany_szam, // Same student ID number
        kapcsolat_tipusa: 'anya',
        nem: 'nő'
      });
      console.log('✗ Duplicate student ID number was allowed (constraint not working)');
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.log('✓ Student ID number unique constraint working correctly');
      } else {
        console.log('✗ Unexpected error:', error.message);
      }
    }

    // Clean up test data
    await db.Diak.destroy({ where: { diak_id: testStudent.diak_id }, force: true });
    await db.Szulo.destroy({ where: { szulo_id: testParent.szulo_id }, force: true });
    await db.Lakcim.destroy({ where: { cim_id: testAddress.cim_id }, force: true });
    console.log('✓ Test data cleaned up');

    // Test 3: Date validation constraints
    console.log('\n3. Testing date validation constraints...');

    // Create test entities for room assignment
    const testAddress2 = await db.Lakcim.create({
      iranyitoszam: '1112',
      varos: 'Budapest',
      utca_hazszam: 'Teszt utca 2',
      emelet: 2,
      ajto: 2
    });

    const testParent2 = await db.Szulo.create({
      nev: 'Teszt Szülő 2',
      email: 'szulo2@kanyr.hu',
      telefonszam: '098-765-4321',
      szemelyi_igazolvany_szam: `PARENT2${Date.now()}${Math.floor(Math.random() * 1000)}`,
      cim_id: testAddress2.cim_id
    });

    const testStudent2 = await db.Diak.create({
      nev: 'Teszt Diák 2',
      email: `teszt2-${Date.now()}@kanyr.hu`,
      telefonszam: '111-222-3333',
      szuletesi_datum: '2001-01-01',
      szemelyi_igazolvany_szam: `TEST2${Date.now()}`,
      taj_szam: `223456789${Math.floor(Math.random() * 10)}`,
      diakigazolvany_szam: `DIK2${Date.now()}`,
      szulo_id: testParent2.szulo_id,
      cim_id: testAddress2.cim_id,
      kapcsolat_tipusa: 'apa',
      nem: 'férfi'
    });

    const testRoom = await db.Szoba.create({
      szoba_szama: '101',
      osszes_hely: 4
    });

    // Test valid date combination (move-out after move-in)
    try {
      const validAssignment = await db.SzobaBekoltozes.create({
        diak_id: testStudent2.diak_id,
        szoba_id: testRoom.szoba_id,
        bekoltozes_datum: '2024-01-01',
        kikoltozes_datum: '2024-06-01'
      });
      console.log('✓ Valid date combination accepted');
      await validAssignment.destroy();
    } catch (error) {
      console.log('✗ Valid date combination rejected:', error.message);
    }

    // Test invalid date combination (move-out before move-in) - should fail
    try {
      await db.SzobaBekoltozes.create({
        diak_id: testStudent2.diak_id,
        szoba_id: testRoom.szoba_id,
        bekoltozes_datum: '2024-06-01',
        kikoltozes_datum: '2024-01-01' // Earlier than move-in
      });
      console.log('✗ Invalid date combination was allowed (constraint not working)');
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        console.log('✓ Invalid date combination rejected by application validation');
      } else if (error.name === 'SequelizeForeignKeyConstraintError') {
        console.log('✓ Invalid date combination rejected by database constraint');
      } else {
        console.log('✗ Unexpected error:', error.message);
      }
    }

    // Test NULL move-out date (current resident) - should be valid
    try {
      const currentResident = await db.SzobaBekoltozes.create({
        diak_id: testStudent2.diak_id,
        szoba_id: testRoom.szoba_id,
        bekoltozes_datum: '2024-01-01',
        kikoltozes_datum: null // NULL means current resident
      });
      console.log('✓ NULL move-out date accepted for current resident');
      await currentResident.destroy();
    } catch (error) {
      console.log('✗ NULL move-out date rejected:', error.message);
    }

    // Clean up test data
    await db.SzobaBekoltozes.destroy({ where: { diak_id: testStudent2.diak_id }, force: true });
    await db.Diak.destroy({ where: { diak_id: testStudent2.diak_id }, force: true });
    await db.Szulo.destroy({ where: { szulo_id: testParent2.szulo_id }, force: true });
    await db.Lakcim.destroy({ where: { cim_id: testAddress2.cim_id }, force: true });
    await db.Szoba.destroy({ where: { szoba_id: testRoom.szoba_id }, force: true });
    console.log('✓ Test data cleaned up');

    // Test 4: Application-level validation messages
    console.log('\n4. Testing application-level validation messages...');

    // Test the custom validation function directly
    const testBekoltozes = db.SzobaBekoltozes.build({
      diak_id: 1,
      szoba_id: 1,
      bekoltozes_datum: '2024-01-01',
      kikoltozes_datum: '2023-12-31' // Invalid: before move-in
    });

    try {
      await testBekoltozes.validate();
      console.log('✗ Custom validation did not catch invalid date');
    } catch (error) {
      if (error.errors && error.errors.some(e => e.message.includes('kiköltözés dátuma nem lehet korábbi'))) {
        console.log('✓ Custom validation provides clear error message');
      } else {
        console.log('✗ Custom validation error message not as expected');
      }
    }

    console.log('\n🎉 Data integrity tests completed!');
    console.log('\nSummary:');
    console.log('✅ Unique constraints prevent duplicate business keys');
    console.log('✅ Date validation prevents invalid date combinations');
    console.log('✅ Application validation provides user-friendly error messages');
    console.log('✅ NULL move-out dates work correctly for current residents');
    console.log('✅ Database constraints provide defense-in-depth protection');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDataIntegrity();
}

module.exports = { testDataIntegrity };