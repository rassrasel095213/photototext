    const { Telegraf } = require('telegraf');
    const Tesseract = require('tesseract.js');
    const axios = require('axios');
    const fs = require('fs');
    const path = require('path');

    // আপনার টেলিগ্রাম বটের টোকেন দিয়ে বটটি শুরু করুন
    const bot = new Telegraf('7397269564:AAFny8rHIXJBTCDPtKyBJBZTQHvt7lqrpn8'); // টোকেনটি এখানে বসান

    // বটকে স্টার্ট করার সময় একটি বার্তা পাঠায়
    bot.start((ctx) => {
      ctx.reply('ফটো আপলোড করুন এবং আমি আপনাকে ফটো থেকে টেক্সটে কনভার্ট করে দেব!');
    });

    // ফটো প্রসেস করার ফাংশন
    bot.on('photo', async (ctx) => {
      try {
        // টেলিগ্রাম থেকে ফটো ফাইল আইডি নিয়ে আসুন
        const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        const fileUrl = await ctx.telegram.getFileLink(fileId);

        // ফাইলটি একটি লোকাল ফাইলে ডাউনলোড করুন
        const filePath = path.resolve(__dirname, 'uploaded_image.jpg');
        const response = await axios({
          url: fileUrl.href,
          responseType: 'stream',
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        // ফাইল ডাউনলোড শেষ হলে প্রসেস চালিয়ে যাব
        writer.on('finish', async () => {
          ctx.reply('ফটো প্রসেস করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...');

          // Tesseract এর মাধ্যমে ফটো থেকে টেক্সট এক্সট্রাক্ট করুন
          Tesseract.recognize(filePath, 'eng+ben', {
            logger: (m) => console.log(m),
          })
            .then(({ data: { text } }) => {
              // এক্সট্রাক্ট করা টেক্সট পাঠান
              ctx.reply(`কনভার্ট করা টেক্সট: \n\n${text}`);

              // কনভার্ট করার পর টেক্সট কপি করার জন্য বাটন তৈরি করুন
              ctx.reply('এই টেক্সটটি কপি করুন:', {
                reply_markup: {
                  inline_keyboard: [[{ text: 'কপি করুন', callback_data: 'copy_text' }]],
                },
              });
            })
            .catch((error) => {
              console.error(error);
              ctx.reply('দুঃখিত, ফটো থেকে টেক্সট কনভার্ট করার সময় একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।');
            });
        });

        writer.on('error', (error) => {
          console.error(error);
          ctx.reply('ফাইল ডাউনলোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
        });

      } catch (error) {
        console.error(error);
        ctx.reply('ফটো প্রসেস করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
      }
    });

    // কপি বাটন হ্যান্ডলার
bot.action('copy_text', (ctx) => {
  ctx.reply('টেক্সট কপি করা হয়েছে!'); // ইউজারকে জানানোর জন্য
  ctx.answerCbQuery('টেক্সট কপি করা হয়েছে!'); // Callback query এর উত্তর দিন
});


    // বট চালু করুন
    bot.launch();

    // বট বন্ধ করার জন্য SIGINT এবং SIGTERM সিগন্যাল হ্যান্ডলিং
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
