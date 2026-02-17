# Adatbázis séma – V3

A rendszer egy kollégiumi nyilvántartó alkalmazás, amely a kollégiumban lakó diákok,
szüleik/gondviselőik, valamint a szobák és beköltözések adatait kezeli.
Az adatbázis relációs modellre épül, normalizált szerkezetben.

## Diák tábla
- diák_id (PK)
- név
- email
- telefonszám
- születési_dátum
- személyi_igazolvány_szám
- taj_szám
- diákigazolvány_szám
- szülő_id (FK → Szülő)
- kapcsolat_típusa (anya, apa, gondviselő)
- cím_id (FK → Lakcím)
- nem (férfi, nő)

A Diák tábla a rendszer központi eleme, amely a kollégiumban lakó diákok személyes
adatait tartalmazza. Egy diákhoz egy kapcsolattartó szülő vagy gondviselő tartozik.
A nem mező alapján történik a szobák elkülönítése (fiúk és lányok külön szobákban).

## Szülő tábla
- szülő_id (PK)
- név
- email
- telefonszám
- személyi_igazolvány_szám
- cím_id (FK → Lakcím)

A Szülő tábla a diákok szüleinek vagy gondviselőinek adatait tárolja, elsősorban
kapcsolattartási célból.

## Lakcím tábla
- cím_id (PK)
- ország
- irányítószám
- város
- utca_házszám

A Lakcím tábla külön kezeli a címadatokat, amelyeket diákok és szülők is használhatnak.
Ez csökkenti az adatok ismétlődését.

## Szoba tábla
- szoba_id (PK)
- szoba_száma
- összes_hely

A Szoba tábla a kollégium szobáinak alapadatait tartalmazza, beleértve a férőhelyek számát.

## Szoba_Beköltözés tábla
- beköltözés_id (PK)
- diák_id (FK → Diák)
- szoba_id (FK → Szoba)
- beköltözés_dátuma
- kiköltözés_dátuma (NULL érték esetén a diák jelenleg is a szobában lakik)

Ez a tábla a diákok szobába történő beköltözésének és kiköltözésének történetét kezeli,
így nyomon követhető az aktuális és korábbi elhelyezésük.

## Felhasználó tábla
- user_id (PK)
- username
- email
- password
- admin (boolean)
- diak_id (FK → Diák, lehet NULL)

A Felhasználó tábla az alkalmazásba belépő felhasználók és jogosultságaik kezelésére szolgál.
Admin felhasználók (titkár) nem rendelkeznek diák azonosítóval, diákokhoz pedig hozzárendelhető
a diák azonosító a személyes adatok eléréséhez.
