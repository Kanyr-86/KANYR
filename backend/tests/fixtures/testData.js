/**
 * Teszt adatok a KANYR backend teszteléshez
 * Magyar nyelvű teszt adatok a különböző entitásokhoz
 */

// Teszt lakcím adatok
const testLakcimok = [
  {
    orszag: 'Magyarország',
    iranyitoszam: '1234',
    varos: 'Budapest',
    utca_hazszam: 'Teszt utca 1.'
  },
  {
    orszag: 'Magyarország',
    iranyitoszam: '5678',
    varos: 'Debrecen',
    utca_hazszam: 'Minta út 42.'
  },
  {
    orszag: 'Magyarország',
    iranyitoszam: '9012',
    varos: 'Szeged',
    utca_hazszam: 'Példa köz 3.'
  }
];

// Teszt szülő adatok
const testSzulok = [
  {
    nev: 'Kovács János',
    email: 'kovacs.janos@email.hu',
    telefonszam: '+36301234567',
    szemelyi_igazolvany_szam: '123456AB'
  },
  {
    nev: 'Nagy Mária',
    email: 'nagy.maria@email.hu',
    telefonszam: '+36309876543',
    szemelyi_igazolvany_szam: '789012CD'
  },
  {
    nev: 'Tóth Péter',
    email: 'toth.peter@email.hu',
    telefonszam: '+36304567891',
    szemelyi_igazolvany_szam: '345678EF'
  }
];

// Teszt diák adatok
const testDiakok = [
  {
    nev: 'Kovács Anna',
    email: 'kovacs.anna@diak.hu',
    telefonszam: '+36701234567',
    szuletesi_datum: '2005-03-15',
    szemelyi_igazolvany_szam: '111111AA',
    taj_szam: '111111111',
    diakigazolvany_szam: 'DI111111',
    kapcsolat_tipusa: 'apa',
    nem: 'nő'
  },
  {
    nev: 'Nagy Bence',
    email: 'nagy.bence@diak.hu',
    telefonszam: '+36709876543',
    szuletesi_datum: '2004-07-22',
    szemelyi_igazolvany_szam: '222222BB',
    taj_szam: '222222222',
    diakigazolvany_szam: 'DI222222',
    kapcsolat_tipusa: 'anya',
    nem: 'férfi'
  },
  {
    nev: 'Tóth Csilla',
    email: 'toth.csilla@diak.hu',
    telefonszam: '+36704567891',
    szuletesi_datum: '2006-01-10',
    szemelyi_igazolvany_szam: '333333CC',
    taj_szam: '333333333',
    diakigazolvany_szam: 'DI333333',
    kapcsolat_tipusa: 'gondviselo',
    nem: 'nő'
  }
];

// Teszt szoba adatok
const testSzobak = [
  {
    szoba_szama: '101',
    osszes_hely: 2
  },
  {
    szoba_szama: '102',
    osszes_hely: 3
  },
  {
    szoba_szama: '201',
    osszes_hely: 2
  },
  {
    szoba_szama: '202',
    osszes_hely: 4
  }
];

// Teszt felhasználó adatok
const testFelhasznalok = {
  admin: {
    username: 'admin',
    email: 'admin@kanyr.hu',
    password: 'Admin12345678!',
    admin: true
  },
  titkar: {
    username: 'titkar',
    email: 'titkar@kanyr.hu',
    password: 'Titkar12345678!',
    admin: false
  },
  diak: {
    username: 'diak',
    email: 'diak@kanyr.hu',
    password: 'Diak12345678!',
    admin: false
  }
};

// Beköltözés teszt adatok
const testBekoltozesek = [
  {
    bekoltozes_datum: '2024-09-01',
    kikoltozes_datum: null // jelenleg is lakik
  },
  {
    bekoltozes_datum: '2024-09-01',
    kikoltozes_datum: '2025-01-15' // kiköltözött
  }
];

// Érvénytelen teszt adatok hibaesetek teszteléséhez
const invalidTestData = {
  lakcim: {
    hiányzóMezők: {
      orszag: '',
      iranyitoszam: '',
      varos: '',
      utca_hazszam: ''
    },
    érvénytelenIrányítószám: {
      orszag: 'Magyarország',
      iranyitoszam: 'abc',
      varos: 'Budapest',
      utca_hazszam: 'Teszt utca 1.'
    }
  },
  szulo: {
    hiányzóMezők: {
      nev: '',
      email: '',
      telefonszam: '',
      szemelyi_igazolvany_szam: ''
    },
    érvénytelenEmail: {
      nev: 'Teszt Elek',
      email: 'nem-email',
      telefonszam: '+36301234567',
      szemelyi_igazolvany_szam: '123456AB'
    },
    rövidNév: {
      nev: 'A',
      email: 'test@email.hu',
      telefonszam: '+36301234567',
      szemelyi_igazolvany_szam: '123456AB'
    }
  },
  diak: {
    hiányzóMezők: {
      nev: '',
      email: '',
      telefonszam: ''
    },
    érvénytelenEmail: {
      nev: 'Teszt Diák',
      email: 'nem-email',
      telefonszam: '+36301234567',
      szuletesi_datum: '2000-01-01',
      szemelyi_igazolvany_szam: '123456AB',
      taj_szam: '123456789',
      diakigazolvany_szam: 'DI123456',
      kapcsolat_tipusa: 'apa',
      nem: 'férfi'
    },
    érvénytelenKapcsolatTipus: {
      nev: 'Teszt Diák',
      email: 'diak@test.hu',
      telefonszam: '+36301234567',
      szuletesi_datum: '2000-01-01',
      szemelyi_igazolvany_szam: '123456AB',
      taj_szam: '123456789',
      diakigazolvany_szam: 'DI123456',
      kapcsolat_tipusa: 'tetszőleges',
      nem: 'férfi'
    },
    érvénytelenNem: {
      nev: 'Teszt Diák',
      email: 'diak@test.hu',
      telefonszam: '+36301234567',
      szuletesi_datum: '2000-01-01',
      szemelyi_igazolvany_szam: '123456AB',
      taj_szam: '123456789',
      diakigazolvany_szam: 'DI123456',
      kapcsolat_tipusa: 'apa',
      nem: 'egyéb'
    }
  },
  szoba: {
    hiányzóMezők: {
      szoba_szama: '',
      osszes_hely: 0
    },
    negatívFérőhely: {
      szoba_szama: '999',
      osszes_hely: -1
    },
    nullaFérőhely: {
      szoba_szama: '998',
      osszes_hely: 0
    }
  },
  felhasznalo: {
    rövidJelszó: {
      username: 'testuser',
      email: 'test@email.hu',
      password: 'rövid',
      admin: false
    },
    érvénytelenEmail: {
      username: 'testuser2',
      email: 'nem-email',
      password: 'Jelszo123456!',
      admin: false
    },
    rövidUsername: {
      username: 'ab',
      email: 'test3@email.hu',
      password: 'Jelszo123456!',
      admin: false
    }
  },
  bekoltozes: {
    hiányzóDiakId: {
      szoba_id: 1,
      bekoltozes_datum: '2024-09-01'
    },
    hiányzóSzobaId: {
      diak_id: 1,
      bekoltozes_datum: '2024-09-01'
    },
    hiányzóDátum: {
      diak_id: 1,
      szoba_id: 1
    },
    érvénytelenDátum: {
      diak_id: 1,
      szoba_id: 1,
      bekoltozes_datum: 'nem-dátum'
    }
  },
  login: {
    hiányzóEmail: {
      password: 'Jelszo123456!'
    },
    hiányzóJelszó: {
      email: 'test@email.hu'
    },
    üresMezők: {
      email: '',
      password: ''
    },
    érvénytelenEmailFormátum: {
      email: 'nem-email',
      password: 'Jelszo123456!'
    }
  }
};

// Segédfüggvény teszt adatok másolásához
function cloneTestData(data) {
  return JSON.parse(JSON.stringify(data));
}

// Segédfüggvény egyedi azonosítók generálásához
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Segédfüggvény egyedi email cím generálásához
function generateUniqueEmail(prefix = 'test') {
  return `${prefix}${generateUniqueId()}@test.hu`;
}

module.exports = {
  testLakcimok,
  testSzulok,
  testDiakok,
  testSzobak,
  testFelhasznalok,
  testBekoltozesek,
  invalidTestData,
  cloneTestData,
  generateUniqueId,
  generateUniqueEmail
};