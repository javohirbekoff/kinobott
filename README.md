# kinobott

O‘zbekcha Telegram kino bot. Foydalanuvchi majburiy kanallarga obuna bo‘lib, kino kodini yuboradi. Admin: kod + nom + video bilan kino qo‘shish, o‘chirish, majburiy kanallar va tasdiqlanadigan ommaviy xabar.

**Railway sozlash, eski bazani ko‘chirish, maxfiylik va yuklama chegaralari: [RAILWAY.md](RAILWAY.md).**

## Tez boshlash

Node.js 22+. `.env.example` nusxasini `.env` deb saqlang, token, ADMIN_IDS va 32 baytli base64 DATA_KEY ni to‘ldiring. Haqiqiy .env ni GitHub’ga yubormang. Mavjud baza bo‘lsa DATA_KEY ni o‘zgartirmang.

```powershell
npm.cmd ci
npm.cmd test
npm.cmd start
```

DATABASE_URL berilsa PostgreSQL va bardavom navbat ishlaydi. Railway’da DATABASE_URL majburiy. Mahalliy DATABASE_URL bo‘sh bo‘lsa eski shifrlangan fayl saqlash rejimi ishlaydi; bu kichik sinovlar uchun.

## Tuzilma

- `bot.mjs` — polling, obuna, admin ruxsati va ishchilar.
- `ui.mjs` — sodda tugmali admin panel.
- `postgres.mjs` — shifrlangan yozuvlar, navbat, tranzaksiya va bitta jarayon qulfi.
- `crypto.mjs` — AES-256-GCM va HMAC.
- `telegram.mjs` — tezlik cheklovi va qayta urinishlar.
- `store.mjs` — eski mahalliy shifrlangan fayl rejimi.
- `migrate.mjs` — eski fayldan bo‘sh PostgreSQL bazaga ko‘chirish.

Videolar Telegramda; server faqat shifrlangan metadata va vaqtincha navbatni saqlaydi. Bot foydalanuvchi faoliyatini logga chiqarmaydi. Server/kalit egasidan mutlaq maxfiylik, barcha qurilmalarda skrinshot bloklash yoki 100 ming bir paytdagi foydalanuvchiga xatosiz tezkor javob kafolatlanmaydi. Telegram cheklovlari sabab so‘rovlar navbatda kutadi. Tafsilotlar RAILWAY.md ichida.
