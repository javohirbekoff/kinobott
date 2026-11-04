# Railway v3

1. Yangi kodni GitHub’ga push qiling.
2. Railway’da BOT xizmatiga Volume qo‘shing, mount path `/data`. Bu PostgreSQL Volume’i emas: aynan bot xizmatiga ulangan Volume bo‘lsin. Railway `RAILWAY_VOLUME_MOUNT_PATH`ni avtomatik beradi. Volume bo‘lmasa bot kino yo‘qolishining oldini olish uchun ishga tushmaydi.
3. Bot Variables: BOT_TOKEN, ADMIN_IDS, oldingi DATA_KEY. SAFE_DIAGNOSTICS=false. DATABASE_URL kerak emas; uni olib tashlang. DATA_DIR=/data qoldirish mumkin, lekin bu o‘zgaruvchining o‘zi Volume yaratmaydi.
4. Bitta replica ishlating. Kompyuterdagi shu tokenli botni to‘xtating, Deploy qiling.
5. Telegram’da /start va admin ni tekshiring. Kino qo‘shing, restart qilib kod orqali qayta oling. Kino va statistika saqlanadi; tarqatish uchun foydalanuvchi ro‘yxati va kanallar yo‘qoladi. Admin panel → 📊 Statistika orqali kunlik yangi obunachilar, jami obunachilar va jami yuborilgan kinolar soni ko‘rinadi. Statistika yangi versiyadan boshlanadi.

DATA_KEY ni almashtirmang. Volume’ni o‘chirsangiz kino kodlari ro‘yxati yo‘qoladi; videolar Telegramda tursa ham kod→video bog‘lanishini qayta kiritish kerak. Volume backup faqat shifrlangan kino katalogini saqlaydi. Eski mahalliy catalog.enc fayli yuklansa, kinolari saqlanadi va eski foydalanuvchi/kanal yozuvlari qayta yozishda olib tashlanadi; oldingi backup nusxalari avtomatik o‘chirilmaydi.

## Eski PostgreSQL’da kinolar bo‘lsa

PostgreSQL xizmatini avval o‘chirmang. Botni to‘xtating, Volume ulang, eski DATA_KEY va vaqtincha DATABASE_URL bilan Railway xizmatining shell’ida `npm run migrate` bajaring. Bu faqat kino yozuvlarini faylga eksport qiladi, mavjud kodlar to‘qnashsa to‘xtaydi. So‘ng DATABASE_URL ni botdan olib tashlab `node bot.mjs` start buyrug‘ini ishlating. Eksport va kino olish tekshirilgandan keyingina eski PostgreSQL xizmatini hamda kerakmas eski backup’larni o‘zingiz o‘chirishingiz mumkin. Haqiqiy baza bilan eksport bu yerda bajarilmadi.

## Natijalar va cheklovlar

Mahalliy sinov: qayta ochilganda kinolar saqlanadi, users/channels bo‘sh, offset nol; noto‘g‘ri kalit va buzilgan fayl rad etiladi. Telegram admin ruxsati, sodda kino qo‘shish, obuna tekshiruvi, protect_content va maxfiy diagnostika testlari o‘tdi. Railway deploy va haqiqiy Volume restart sinovi hali bajarilmagan.

Kanallarni har restartdan keyin admin qayta qo‘shadi. Shu paytgacha obuna talab qilinmaydi. Ommaviy xabar faqat joriy ishga tushish davomida ko‘ringan foydalanuvchilarga boradi; davom etayotgan tarqatish restartda bekor bo‘ladi. Bot o‘chgan paytdagi kutilayotgan xabarlar yangi startda tashlanadi. Bu talabga mos ravishda doimiy foydalanuvchi bazasi va so‘rov navbati yo‘q.
