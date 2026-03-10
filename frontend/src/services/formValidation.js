import * as yup from 'yup'

// Student validation schema
export const studentSchema = yup.object().shape({
  nev: yup.string().required('A név kötelező').min(2, 'Minimum 2 karakter'),
  email: yup.string().email('Érvényes email címet adjon meg').required('Az email kötelező'),
  telefonszam: yup.string().required('A telefonszám kötelező'),
  szuletesi_datum: yup.date().required('A születési dátum kötelező'),
  szemelyi_igazolvany_szam: yup.string().required('A személyi igazolvány szám kötelező'),
  taj_szam: yup.string().required('A TAJ szám kötelező'),
  diakigazolvany_szam: yup.string().required('A diákigazolvány szám kötelező'),
  kapcsolat_tipusa: yup.string().oneOf(['anya', 'apa', 'gondviselo']).required('A kapcsolat típusa kötelező'),
  szulo_id: yup.number().positive('Érvényes szülő ID-t adjon meg').integer(),
  cim_id: yup.number().positive('Érvényes cím ID-t adjon meg').integer(),
})

// Parent validation schema
export const parentSchema = yup.object().shape({
  nev: yup.string().required('A név kötelező').min(2, 'Minimum 2 karakter'),
  email: yup.string().email('Érvényes email címet adjon meg').required('Az email kötelező'),
  telefonszam: yup.string().required('A telefonszám kötelező'),
  szemelyi_igazolvany_szam: yup.string().required('A személyi igazolvány szám kötelező'),
})

// Address validation schema
export const addressSchema = yup.object().shape({
  orszag: yup.string().required('Az ország kötelező'),
  iranyitoszam: yup.string().required('Az irányítószám kötelező'),
  varos: yup.string().required('A város kötelező'),
  utca_hazszam: yup.string().required('Az utca és házszám kötelező'),
})

// Room validation schema
export const roomSchema = yup.object().shape({
  szoba_szama: yup.string().required('A szoba száma kötelező'),
  osszes_hely: yup.number().required('A férőhelyek száma kötelező').min(1, 'Minimum 1 férőhely'),
})

// Password validation schema - strong password requirements
const passwordSchema = yup.string()
  .min(8, 'A jelszónak legalább 8 karakter hosszúnak kell lennie')
  .matches(/[A-Z]/, 'A jelszónak tartalmaznia kell legalább egy nagybetűt')
  .matches(/[a-z]/, 'A jelszónak tartalmaznia kell legalább egy kisbetűt')
  .matches(/[0-9]/, 'A jelszónak tartalmaznia kell legalább egy számot')
  .matches(/[^A-Za-z0-9]/, 'A jelszónak tartalmaznia kell legalább egy speciális karaktert')

// User validation schema
export const userSchema = yup.object().shape({
  username: yup.string().required('A felhasználónév kötelező').min(3, 'Minimum 3 karakter'),
  email: yup.string().email('Érvényes email címet adjon meg').required('Az email kötelező'),
  password: passwordSchema.required('A jelszó kötelező'),
  admin: yup.boolean().default(false),
})

// Login validation schema
export const loginSchema = yup.object().shape({
  email: yup.string().email('Érvényes email címet adjon meg').required('Az email kötelező'),
  password: yup.string().required('A jelszó kötelező'),
})

// Export all schemas
export const schemas = {
  student: studentSchema,
  parent: parentSchema,
  address: addressSchema,
  room: roomSchema,
  user: userSchema,
  login: loginSchema,
}