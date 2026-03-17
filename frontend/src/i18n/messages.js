/**
 * Centralized Hungarian localization messages for KANYR application
 * 
 * This file contains all user-facing messages to ensure consistency
 * and make future internationalization easier.
 * 
 * @module i18n/messages
 */

/**
 * Error messages for API operations and general errors
 */
export const ERROR_MESSAGES = {
  // General errors
  UNKNOWN_ERROR: 'Ismeretlen hiba történt',
  SERVER_ERROR: 'Szerver hiba',
  NETWORK_ERROR: 'Hálózati hiba - kérjük, ellenőrizze az internetkapcsolatát',
  UNEXPECTED_ERROR: 'Váratlan hiba történt',
  ACCESS_DENIED: 'Hozzáférés megtagadva',

  // HTTP status specific
  UNAUTHORIZED: 'Bejelentkezés szükséges',
  FORBIDDEN: 'Nincs jogosultsága ehhez a művelethez',
  NOT_FOUND: 'A keresett erőforrás nem található',
  NOT_FOUND_PAGE: 'Az oldal nem található',
  VALIDATION_ERROR: 'Érvénytelen adatok',
  
  // Auth errors
  INVALID_LOGIN: 'Hibás bejelentkezési adatok',
  LOGIN_ERROR: 'Hiba a bejelentkezés során',
  LOGOUT_ERROR: 'Hiba a kijelentkezés során',
  
  // Operation errors
  LOAD_ERROR: 'Hiba az adatok betöltése közben',
  SAVE_ERROR: 'Hiba az adatok mentése közben',
  DELETE_ERROR: 'Hiba a törlés során',
  UPDATE_ERROR: 'Hiba a módosítás során',
  CREATE_ERROR: 'Hiba a létrehozás során',
}

/**
 * Success messages for various operations
 */
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Sikeres bejelentkezés!',
  LOGOUT_SUCCESS: 'Sikeres kijelentkezés!',
  SAVE_SUCCESS: 'Sikeresen mentve!',
  DELETE_SUCCESS: 'Sikeresen törölve!',
  UPDATE_SUCCESS: 'Sikeresen módosítva!',
  CREATE_SUCCESS: 'Sikeresen létrehozva!',
  ROOM_CHANGE_REQUESTED: 'Szobaváltási kérelem sikeresen benyújtva!',
}

/**
 * Form validation messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'A mező kitöltése kötelező',
  REQUIRED_FIELD: 'Kötelező mező',
  MIN_LENGTH: (min) => `Legalább ${min} karakter szükséges`,
  MAX_LENGTH: (max) => `Legfeljebb ${max} karakter engedélyezett`,
  MIN_VALUE: (min) => `Az érték nem lehet kisebb mint ${min}`,
  MAX_VALUE: (max) => `Az érték nem lehet nagyobb mint ${max}`,
  EMAIL_INVALID: 'Érvénytelen email cím',
  PATTERN_INVALID: 'Érvénytelen formátum',
  PHONE_INVALID: 'Érvénytelen telefonszám',
  DATE_INVALID: 'Érvénytelen dátum',
  NUMBER_INVALID: 'Érvénytelen szám',
}

/**
 * UI labels and button texts
 */
export const UI_LABELS = {
  // Common actions
  LOGIN: 'Bejelentkezés',
  LOGOUT: 'Kijelentkezés',
  SAVE: 'Mentés',
  CANCEL: 'Mégse',
  DELETE: 'Törlés',
  EDIT: 'Szerkesztés',
  CREATE: 'Létrehozás',
  CLOSE: 'Bezárás',
  CONFIRM: 'Megerősítés',
  SEARCH: 'Keresés',
  FILTER: 'Szűrés',
  RESET: 'Visszaállítás',
  
  // Loading messages
  LOADING: 'Betöltés...',
  LOADING_DASHBOARD: 'Dashboard betöltése...',
  LOADING_STUDENTS: 'Diákok betöltése...',
  LOADING_PARENTS: 'Szülők betöltése...',
  LOADING_ROOMS: 'Szobák betöltése...',
  LOADING_REPORTS: 'Jelentések betöltése...',
  SAVING: 'Mentés...',
  
  // Confirmation dialog defaults
  CONFIRM_TITLE: 'Megerősítés',
  CONFIRM_MESSAGE: 'Biztosan folytatod?',
  CONFIRM_DELETE: 'Biztosan törölni szeretnéd?',
  
  // Empty states
  NO_DATA: 'Nincs megjeleníthető adat',
  NO_RESULTS: 'Nincs találat',
  
  // Navigation
  DASHBOARD: 'Dashboard',
  STUDENTS: 'Diákok',
  PARENTS: 'Szülők',
  ROOMS: 'Szobák',
  REPORTS: 'Jelentések',
  NOTIFICATIONS: 'Értesítések',
  
  // Form labels
  EMAIL: 'Email cím',
  PASSWORD: 'Jelszó',
  NAME: 'Név',
  PHONE: 'Telefonszám',
  ADDRESS: 'Cím',
  DATE: 'Dátum',
  STATUS: 'Állapot',
}

/**
 * Room/Szoba specific messages
 */
export const ROOM_MESSAGES = {
  NO_AVAILABLE_ROOMS: 'Nincs elérhető szabad szoba',
  NO_AVAILABLE_ROOMS_FOR_TRANSFER: 'Nincs elérhető szabad szoba a diák áthelyezéséhez!',
  ROOM_FULL: 'A szoba betelt',
  ROOM_EMPTY: 'Nincs bent lakó ebben a szobában',
  SELECT_ROOM_REQUIRED: 'Kérjük, válasszon szobát!',
  ROOM_CHANGE_ERROR: 'Hiba történt a kérelem benyújtásakor!',
  ROOM_CHANGE_LIMIT_REACHED: 'Elérte a szobaváltási kérelmek maximális számát',
}

/**
 * Student/Diák specific messages
 */
export const STUDENT_MESSAGES = {
  STUDENT_NOT_FOUND: 'A diák nem található',
  STUDENT_ALREADY_EXISTS: 'Ez a diák már létezik',
  INVALID_STUDENT_DATA: 'Érvénytelen diák adatok',
  ENROLL_SUCCESS: 'Diák sikeresen felvéve',
  TRANSFER_SUCCESS: 'Diák sikeresen áthelyezve',
}

/**
 * Parent/Szülő specific messages
 */
export const PARENT_MESSAGES = {
  PARENT_NOT_FOUND: 'A szülő nem található',
  PARENT_ALREADY_EXISTS: 'Ez a szülő már létezik',
}

/**
 * Validation summary messages
 */
export const VALIDATION_SUMMARY = {
  TITLE: 'Kérjük, javítsa a következő hibákat:',
  REQUIRED_FIELDS: 'Kötelező mezők hiányoznak',
}

/**
 * Dirty form warning messages
 */
export const DIRTY_FORM_MESSAGES = {
  UNSAVED_CHANGES: 'Mentetlen változtatások vannak.',
  CONFIRM_LEAVE: 'Mentetlen változtatások vannak. Biztosan elhagyja az oldalt?',
  CONFIRM_DISCARD: 'Biztosan elveti a módosításokat?',
  STAY_ON_PAGE: 'Maradok az oldalon',
  LEAVE_PAGE: 'Elhagyom az oldalt',
  DISCARD_CHANGES: 'Módosítások elvetése',
}

/**
 * Error boundary messages
 */
export const ERROR_BOUNDARY_MESSAGES = {
  TITLE: 'Hiba történt az alkalmazásban',
  ERROR_LABEL: 'Hiba üzenet:',
  STACK_TRACE: 'Stack trace:',
  RETRY: 'Újrapróbálkozás',
  REFRESH: 'Oldal frissítése',
}

/**
 * Export all messages as a single object for easy importing
 */
export const MESSAGES = {
  ERROR: ERROR_MESSAGES,
  SUCCESS: SUCCESS_MESSAGES,
  VALIDATION: VALIDATION_MESSAGES,
  UI: UI_LABELS,
  ROOM: ROOM_MESSAGES,
  STUDENT: STUDENT_MESSAGES,
  PARENT: PARENT_MESSAGES,
  VALIDATION_SUMMARY: VALIDATION_SUMMARY,
  ERROR_BOUNDARY: ERROR_BOUNDARY_MESSAGES,
  DIRTY_FORM: DIRTY_FORM_MESSAGES,
}

export default MESSAGES
