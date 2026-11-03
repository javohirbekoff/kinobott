# kinobott v3 — faqat kinolar doimiy saqlanadi

Bot ma’lumotlar bazasiga ulanmaydi. Faqat kino kodi, nomi va Telegram file_id shifrlangan `catalog.enc` faylida saqlanadi. Video Telegram serverida turadi. Foydalanuvchi, kanal, qoralama va xabar navbati faqat operativ xotirada; restartda yo‘qoladi. Eski kutilayotgan Telegram update’lari ishga tushishda tashlanadi.

Admin: kino qo‘shish/o‘chirish, majburiy kanallar, ommaviy xabar. Adminni ADMIN_IDS belgilaydi, bu muhit sozlamasi restartda saqlanadi. Har restartdan keyin kanallarni qayta qo‘shing. Kanal qo‘shilmaguncha obuna talab qilinmaydi. Ommaviy xabar faqat shu ishga tushishdan beri botdan foydalanganlarga boradi.

Node.js 22+: `npm ci`, `npm test`, `npm start`. `.env.example` asosida `.env` yarating. Token/kalitni GitHub’ga yubormang. Railway uchun [RAILWAY.md](RAILWAY.md).

pg va crypto.mjs faqat eski PostgreSQL’dan kinolarni bir martalik eksport qilish uchun qolgan. Bot ularni ishlatmaydi. `npm run migrate` endi eksport buyrug‘i: eski bazadan Volume’dagi faylga faqat kinolarni oladi. Eski baza avtomatik o‘chirilmaydi.

Foydalanuvchi faoliyati logga yozilmaydi. SAFE_DIAGNOSTICS=false bo‘lsa dastur xato kodini ham chiqarmaydi. Platformaning texnik loglari alohida. Server va kalit egasidan mutlaq maxfiylik yoki barcha qurilmalarda nusxa olishni taqiqlash kafolatlanmaydi. Restartda navbat yo‘qoladi; bu versiyada bardavom navbat hamda 100 ming bir paytdagi foydalanuvchi kafolati yo‘q.
