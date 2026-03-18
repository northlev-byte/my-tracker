// Vercel serverless proxy — forwards all requests to Google Apps Script.
// This exists purely to avoid CORS: browsers can't POST directly to script.google.com
// from a different origin, but a server-to-server call has no such restriction.

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbx43ILL71R_N4G-6wsq2wXDtHau_ky1Ei78Xfu1TLcQpvWv8OPSX9lDCkBgKm_ckIFp/exec";

// Disable bodyParser so we can read and forward the raw request body directly.
// Previously bodyParser was enabled but the browser sends no Content-Type header,
// so req.body was undefined and JSON.stringify(undefined) sent an empty body to GAS.
export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  // Allow the Vite dev server and Vercel preview to call this
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "GET") {
      const gasRes = await fetch(GAS_URL);
      const text = await gasRes.text();
      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(text);
    }

    if (req.method === "POST") {
      const rawBody = await readRawBody(req);
      const gasRes = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: rawBody,
      });
      const text = await gasRes.text();
      return res.status(200).send(text);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[proxy] GAS request failed:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
