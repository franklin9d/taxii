import express from "express";
import path from "path";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import { createServer as createViteServer } from "vite";
import fs from "fs";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper function to send text message to Telegram
async function sendTelegramMessage(text: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID");
    return null;
  }
  
  // Add inline keyboard for approve/reject
  const replyMarkup = {
    inline_keyboard: [
      [
        { text: "✅ الذهاب للوحة الإدارة للموافقة", url: "https://tarmiya-taxi.web.app/admin" }
      ]
    ]
  };

  try {
    const res = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_ADMIN_CHAT_ID,
      text: text,
      parse_mode: 'HTML',
      reply_markup: JSON.stringify(replyMarkup)
    });
    return res.data;
  } catch (err: any) {
    console.error("Telegram Error:", err.response?.data || err.message);
    throw err;
  }
}

app.post("/api/driver/apply", upload.any(), async (req, res) => {
  try {
    const data = req.body;
    const files = req.files as Express.Multer.File[];

    // Extracting fields
    const { fullName, phone, email, area, carType, carModel, carColor, plateNumber, seats, uid } = data;

    const messageText = `
🚕 <b>طلب تسجيل كابتن جديد</b>

👤 <b>معلومات الكابتن:</b>
الاسم: ${fullName}
رقم الهاتف: ${phone}
المنطقة: ${area}
البريد: ${email || "غير متوفر"}

🚘 <b>معلومات السيارة:</b>
نوع السيارة: ${carType}
الموديل / السنة: ${carModel}
اللون: ${carColor}
رقم اللوحة: ${plateNumber}
عدد المقاعد: ${seats}

🕒 وقت الإرسال:
${new Date().toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad' })}

🆔 <b>UID:</b>
<code>${uid}</code>

📌 <b>الحالة:</b>
بانتظار مراجعة الإدارة`;

    // 1. Send text message with admin panel link instead of callback buttons, because we don't have Firebase Admin SDK to update the db directly.
    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "✅ الذهاب للوحة الإدارة للقبول/الرفض", url: "https://tarmiyah-taxi-app.vercel.app/admin" }, // Replace with real domain if available
          { text: "ℹ️ تفاصيل", callback_data: `info_${uid}` }
        ]
      ]
    };

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_ADMIN_CHAT_ID) {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_ADMIN_CHAT_ID,
        text: messageText,
        parse_mode: 'HTML',
        reply_markup: JSON.stringify(replyMarkup)
      });
      
      // 2. Send images
      for (const file of files) {
        const formData = new FormData();
        formData.append('chat_id', TELEGRAM_ADMIN_CHAT_ID);
        formData.append('document', file.buffer, file.originalname); // using document so it keeps quality
        formData.append('caption', `${file.fieldname} - ${fullName}`);

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, formData, {
          headers: formData.getHeaders()
        });
      }
    } else {
        console.warn("TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID is missing. Emulating success.");
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("Error sending to telegram", err);
    res.status(500).json({ success: false, error: "فشل الإرسال إلى تلغرام" });
  }
});

app.post("/api/telegram/webhook", async (req, res) => {
  // Telegram sends webhook POST requests here
  try {
    const { callback_query, message } = req.body;
    
    if (callback_query && TELEGRAM_BOT_TOKEN) {
      const callbackData = callback_query.data;
      const callbackId = callback_query.id;

      // Ensure we reply to telegram to dismiss the loading state on the button
      let alertText = "يرجى التوجه إلى لوحة الإدارة لإكمال العملية.";
      if (callbackData.startsWith('info_')) {
        alertText = "هذا الطلب لم يتم الموافقة عليه بعد. يرجى الذهاب للوحة الإدارة.";
      }

      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        callback_query_id: callbackId,
        text: alertText,
        show_alert: true
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(200).send('OK'); // Always send 200 OK to Telegram
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
