# Railway va PostgreSQL — v2

## Ishga tushirish

1. Railway’da New Project → Deploy from GitHub repo → kinobott ni tanlang.
2. Shu loyihaga PostgreSQL xizmati qo‘shing. PostgreSQL xizmatining doimiy Volume’i mavjud bo‘lsin. Bot xizmatiga alohida Volume shart emas.
3. Bot xizmatining Variables bo‘limiga quyidagilarni kiriting:

```env
BOT_TOKEN=BotFather bergan token
ADMIN_IDS=raqamli Telegram ID
DATA_KEY=mavjud 32 baytli base64 shifrlash kaliti
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

PostgreSQL xizmatini boshqacha nomlasangiz, reference variable’dagi `Postgres` o‘rniga shu xizmatni tanlang. Railway private database URL ishlating. Tashqi manzil ishlatilsa sertifikat tekshiruvi yoqiladi; noto‘g‘ri sertifikat bilan ulanish rad etiladi. Token yoki kalitni GitHub’ga yozmang. Railway Variables ochiq matndagi sirlar saqlanadigan joy: loyiha a’zolariga kirishni cheklang.

4. Bitta bot replica qoldiring. Dockerfile avtomatik kutubxonalarni o‘rnatadi va botni ishga tushiradi. Public domain shart emas. Railway sog‘lomlik tekshiruvi `/health` orqali bajariladi.
5. Shu token bilan kompyuterdagi botni Ctrl+C orqali to‘xtating. So‘ng Railway’da Deploy qiling. Bir xil tokenni ikki joyda ishlatmang. PostgreSQL advisory lock aynan shu bazaga ulangan ikkinchi botni ham to‘xtatadi.
6. Telegram’da `/start`, admin hisobida `admin` yozing. Kanal qo‘shishdan oldin botni kanalda admin qiling.
7. PostgreSQL uchun Railway panelida backup yoqing va tiklashni alohida test bazasida sinang. DATABASE_URL va DATA_KEY ni alohida xavfsiz joyda saqlang.

## Eski kinolarni ko‘chirish

Railway’da yangi baza ochish kompyuterdagi katalogni avtomatik ko‘chirmaydi. Eski .env va data/catalog.enc faylini o‘chirmang. Botni to‘xtatib, kompyuterdagi loyiha papkasiga yangi kodni o‘rnating. `.env`da oldingi DATA_KEY saqlansin, vaqtincha Railway PostgreSQL tashqi ulanish manzilini DATABASE_URL ga kiriting (sertifikati ishonchli TLS kerak).

```powershell
npm.cmd ci
npm.cmd run migrate -- "C:\to‘liq\yo‘l\data\catalog.enc"
```

Migratsiya faqat bo‘sh katalog va foydalanuvchi bazasiga ishlaydi, eski faylni o‘chirmaydi. Bot ishlayotgan bazaga migratsiya qilinmaydi. Tashqi TLS ulanishi mavjud bo‘lmasa, xuddi shu buyruqni Railway private tarmog‘idagi bir martalik xizmatda bajarish kerak; kalit yoki katalogni GitHub’ga yuklamang. Muvaffaqiyatdan keyin Railway botni ishga tushiring, tekshirib chiqing, kompyuterdagi botni o‘chiq qoldiring.

## Saqlash va maxfiylik

- Video Telegram serverlarida saqlanadi. Bot videoni yuklab olmaydi, Telegram file_id orqali yuboradi.
- PostgreSQL’da kino kodi/nomi/file_id, kanal sozlamalari va tarqatish uchun foydalanuvchi ID alohida AES-256-GCM shifrlangan yozuvlarda saqlanadi. Indekslar HMAC orqali hosil qilinadi. Navbatdagi so‘rovlar ham shifrlanadi, bajarilgach o‘chiriladi.
- Jadval nomi, yozuv turi, navbat vaqti, urinish soni kabi operatsion metama’lumotlar shifrlanmaydi. Ular xabar matni, token yoki Telegram ID emas.
- Bot stdout/stderr’da foydalanuvchi xabarlari, ID, token, xato tafsilotlari yoki faoliyat loglarini chiqarmaydi. Railway build, jarayon va PostgreSQL texnik loglari platforma nazoratida; ularni admin ham hech qachon o‘qiy olmasligi kafolatlanmaydi.
- Bot admin tugmalari faqat ADMIN_IDS uchun. Railway loyiha egasi, server xotirasi va DATA_KEY’ga kiruvchi shaxs ma’lumotni ochishi mumkin. Telegram ham xabarlarni ko‘radi. Bu end-to-end shifrlangan chat emas.
- DATA_KEY yo‘qolsa ma’lumot tiklanmaydi. Uni oddiy almashtirish mumkin emas, oldindan qayta shifrlash migratsiyasi zarur. Backup’dan tiklash uchun aynan o‘sha kalit kerak.

## Katta yuklama

So‘rovlar PostgreSQL navbatiga yozilgandan keyingina Telegram offset’i oldinga o‘tadi. 16 ta parallel ishlovchi turli foydalanuvchilarni qayta ishlaydi; bir foydalanuvchining so‘rovlari tartibli bajariladi. Ommaviy xabarlar alohida navbat va 2 ta ishlovchi orqali ketadi. Bir foydalanuvchi uchun kamida 700 ms kutish, jo‘natiladigan xabarlar uchun bir chatga kamida 1100 ms oraliq saqlanadi. Telegram API so‘rovlari konservativ 20/sek tezlik bilan boshlanadi; 429 bo‘lsa server ko‘rsatgan vaqt kutiladi.

Telegram bepul ommaviy xabar uchun taxminan 30/sek chegarasini belgilaydi. Shuning uchun 100 ming foydalanuvchiga darhol javob berish imkoni yo‘q. Ushbu konservativ limitda faqat 100 mingta API so‘rovining o‘zi kamida 83 daqiqa; obuna tekshiruvlari, chat cheklovi, tarmoq va boshqa trafik vaqtni oshiradi. Pullik broadcast avtomatik yoqilmagan.

Qayta ishga tushishda navbatdagi ishlar davom etadi. Telegram yuborishni qabul qilib, bazaga bajarildi belgisi yozilishidan oldin jarayon o‘chsa, ayrim xabar takrorlanishi mumkin (at-least-once). Tahrirlanayotgan, hali tasdiqlanmagan admin shakllari va ommaviy xabar qoralamalari xotirada: restartdan keyin qayta kiritiladi. Uzoq navbatda tugma tasdiqlari eskirishi mumkin.

Katalog va foydalanuvchilar ishchi xotiraga yuklanadi; xotira sarfi foydalanuvchilar soni bilan o‘sadi. Bu bir bot jarayonli navbat arxitekturasi, cheksiz avtomatik masshtablanish emas. 100 ming bir paytdagi haqiqiy foydalanuvchi uchun alohida yuklama sinovi, server o‘lchami, queue lag va PostgreSQL quvvatini kuzatish zarur. Telegram so‘rovlarni cheklangan muddat saqlaydi; uzoq uzilishlar uchun mutlaq yetkazish kafolati yo‘q.

## Tekshirilgan va tekshirilmagan joylar

Mahalliy unit testlar: shifrlash, buzilgan fayl/noto‘g‘ri kalit rad etilishi, admin ruxsati, kino qo‘shish, obuna tekshiruvi va protect_content.

PGlite (PostgreSQL WASM) bilan 100 000 sun’iy foydalanuvchini shifrlab yozish va qayta yuklash, bir yozuvni yangilash, navbat tartibi, retry, restart recovery va noto‘g‘ri kalit sinovi o‘tdi. Bu Railway’dagi real PostgreSQL, tarmoq yoki 100 ming Telegram foydalanuvchisi bilan sinov emas. Railway deploy, haqiqiy restart va backup restore sinovi sozlamalar kiritilgach bajariladi.

Manbalar: https://docs.railway.com/databases/postgresql va https://core.telegram.org/bots/faq
