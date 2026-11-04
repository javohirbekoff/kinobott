# Railway v3

## Kanalga kirish so‘rovlarini tasdiqlash

Kanal sozlamalarida so‘rov yuboriladigan taklif havolasi yarating (Request Admin Approval). Botga kanal admini sifatida Invite Users/can_invite_users huquqini bering. Botning majburiy kanal qo‘shish bosqichida aynan shu https://t.me/+... havolasini kiriting. Oddiy @kanal havolasi har doim qo‘shilish so‘rovi yaratmaydi.

Bot sozlangan majburiy kanaldan kelgan chat_join_request xabarini olganda, foydalanuvchi botda tanilgan bo‘lsa yoki sozlangan taklif havolasidan kelgan bo‘lsa, approveChatJoinRequest orqali tasdiqlaydi. Begona kanallarning so‘rovlarini tasdiqlamaydi. Foydalanuvchi «Tekshirish»ni bosganda uning ID’si bilan kutilayotgan eski so‘rovni ham tasdiqlashga urinadi va a’zolikni qayta tekshiradi. Bot barcha eski so‘rovlar ro‘yxatini yuklab olmaydi. So‘rov bo‘lmasa yoki huquq yetmasa kirish ochilmaydi. Kanal bloklagan foydalanuvchilar avtomatik ochilmaydi.

Mahalliy testlar o‘tdi; Telegramdagi haqiqiy sinov yangi versiya deploy qilingach bajariladi. Manba: https://core.telegram.org/bots/api#approvechatjoinrequest

1. Yangi kodni GitHub’ga push qiling.
2. Railway’da BOT xizmatiga Volume qo‘shing, mount path `/data`. Bu PostgreSQL Volume’i emas: aynan bot xizmatiga ulangan Volume bo‘lsin. Railway `RAILWAY_VOLUME_MOUNT_PATH`ni avtomatik beradi. Volume bo‘lmasa bot kino yo‘qolishining oldini olish uchun ishga tushmaydi.
3. Bot Variables: BOT_TOKEN, ADMIN_IDS, oldingi DATA_KEY. SAFE_DIAGNOSTICS=false. DATABASE_URL kerak emas; uni olib tashlang. DATA_DIR=/data qoldirish mumkin, lekin bu o‘zgaruvchining o‘zi Volume yaratmaydi.
4. Bitta replica ishlating. Kompyuterdagi shu tokenli botni to‘xtating, Deploy qiling.
5. Telegram’da /start va admin ni tekshiring. Kino qo‘shing, restart qilib kod orqali qayta oling. Kino, statistika va majburiy kanallar saqlanadi; tarqatish uchun foydalanuvchi ro‘yxati yo‘qoladi. Admin panel → 📊 Statistika orqali kunlik yangi obunachilar, jami obunachilar va jami yuborilgan kinolar soni ko‘rinadi. Statistika yangi versiyadan boshlanadi.

DATA_KEY ni almashtirmang. Volume’ni o‘chirsangiz kino kodlari ro‘yxati yo‘qoladi; videolar Telegramda tursa ham kod→video bog‘lanishini qayta kiritish kerak. Volume backup shifrlangan kino katalogi, statistika va kanallarni saqlaydi. Eski mahalliy catalog.enc fayli yuklansa, kinolari va mavjud kanallari saqlanadi, eski foydalanuvchi yozuvlari qayta yozishda olib tashlanadi; oldingi backup nusxalari avtomatik o‘chirilmaydi.

## Eski PostgreSQL’da kinolar bo‘lsa

PostgreSQL xizmatini avval o‘chirmang. Botni to‘xtating, Volume ulang, eski DATA_KEY va vaqtincha DATABASE_URL bilan Railway xizmatining shell’ida `npm run migrate` bajaring. Bu faqat kino yozuvlarini faylga eksport qiladi, mavjud kodlar to‘qnashsa to‘xtaydi. So‘ng DATABASE_URL ni botdan olib tashlab `node bot.mjs` start buyrug‘ini ishlating. Eksport va kino olish tekshirilgandan keyingina eski PostgreSQL xizmatini hamda kerakmas eski backup’larni o‘zingiz o‘chirishingiz mumkin. Haqiqiy baza bilan eksport bu yerda bajarilmadi.

## Natijalar va cheklovlar

Mahalliy sinov: qayta ochilganda kino, statistika va kanallar saqlanadi, users bo‘sh, offset nol; noto‘g‘ri kalit va buzilgan fayl rad etiladi. Telegram admin ruxsati, sodda kino qo‘shish, obuna tekshiruvi, protect_content va maxfiy diagnostika testlari o‘tdi. Railway deploy va haqiqiy Volume restart sinovi hali bajarilmagan.

Majburiy kanallar endi shifrlangan faylda saqlanadi. Admin o‘chirgan kanal restartdan keyin qaytmaydi. Oldingi versiyada yo‘qolgan kanallarni yangi deploy’dan keyin bir marta qayta qo‘shish kerak. Ommaviy xabar faqat joriy ishga tushish davomida ko‘ringan foydalanuvchilarga boradi; davom etayotgan tarqatish restartda bekor bo‘ladi. Bot o‘chgan paytdagi kutilayotgan xabarlar yangi startda tashlanadi. Bu talabga mos ravishda doimiy foydalanuvchi bazasi va so‘rov navbati yo‘q.
