export const config = {
  runtime: "edge",
};

// آدرس مقصد بدون مسیر اضافه
const BACKEND_URI = "https://ver.switchnet.sbs:8096";

export default async function transport(req) {
  const url = new URL(req.url);
  const ua = req.headers.get("user-agent") || "";

  // --- صفحه فریب زولتریکس کیش ---
  if (url.pathname === "/" || ua.includes("Mozilla")) {
    const uptime = (Math.random() * (99.99 - 99.90) + 99.90).toFixed(2);
    const traffic = (Math.random() * 500).toFixed(1);

    return new Response(
      `<!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
          <meta charset="UTF-8">
          <title>Zoltrix Kish | Infrastructure Monitor</title>
          <style>
              body { background: #020617; color: #cbd5e1; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .box { border: 1px solid #1e293b; padding: 30px; border-radius: 16px; background: #0f172a; width: 350px; border-top: 4px solid #3b82f6; }
              .title { font-weight: 800; color: #fff; margin-bottom: 5px; letter-spacing: 1px; }
              .status { color: #22c55e; font-size: 0.9rem; margin-bottom: 20px; }
              .data { display: flex; justify-content: space-between; font-size: 0.85rem; padding: 10px 0; border-bottom: 1px solid #1e293b; }
              .label { color: #64748b; }
          </style>
      </head>
      <body>
          <div class="box">
              <div class="title">ZOLTRIX KISH</div>
              <div class="status">● سیستم در دسترس است</div>
              <div class="data"><span class="label">آپ‌تایم:</span> <span>%${uptime}</span></div>
              <div class="data"><span class="label">ترافیک لبه:</span> <span>${traffic} MB/s</span></div>
              <div class="data"><span class="label">شناسه گره:</span> <span>IAD-1102</span></div>
              <p style="font-size: 0.6rem; color: #475569; margin-top: 20px; text-align: center;">Vercel Edge Runtime - Production Build</p>
          </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=UTF-8" } }
    );
  }

  // --- عملیات پروکسی مستقیم ---
  try {
    // ارسال مستقیم به مقصد بدون اضافه کردن /switch
    const destination = BACKEND_URI + url.pathname + url.search;
    
    const headers = new Headers();
    for (const [key, value] of req.headers.entries()) {
      const k = key.toLowerCase();
      // حذف ردپای ورسل برای جلوگیری از بن شدن[span_2](start_span)[span_2](end_span)
      if (!k.startsWith("x-vercel") && !["host", "connection", "upgrade"].includes(k)) {
        headers.set(key, value);
      }
    }
    headers.set("Host", "ver.switchnet.sbs");

    const response = await fetch(destination, {
      method: req.method,
      headers: headers,
      body: req.body,
      redirect: "manual",
      duplex: "half"
    });

    const cleanRespHeaders = new Headers(response.headers);
    cleanRespHeaders.delete("transfer-encoding");
    
    // شبیه‌سازی هدرهای مانیتورینگ برای طبیعی جلوه دادن پاسخ[span_3](start_span)[span_3](end_span)
    cleanRespHeaders.set("X-Cache-Status", "HIT");
    cleanRespHeaders.set("Server", "Zoltrix-Edge-Gateway");

    return new Response(response.body, {
      status: response.status,
      headers: cleanRespHeaders,
    });
  } catch (e) {
    return new Response("Service Link Down", { status: 502 });
  }
}
