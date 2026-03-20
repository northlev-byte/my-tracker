// Vercel serverless proxy — forwards file upload POSTs to the ConnectIn Supplier DB Apps Script.

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbx43ILL71R_N4G-6wsq2wXDtHau_ky1Ei78Xfu1TLcQpvWv8OPSX9lDCkBgKm_ckIFp/exec";

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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "POST") {
      const rawBody = await readRawBody(req);

      let currentUrl = GAS_URL;
      let response;

      for (let hop = 0; hop < 6; hop++) {
        const isFirstHop = hop === 0;
        response = await fetch(currentUrl, {
          method: isFirstHop ? "POST" : "GET",
          headers: isFirstHop ? { "Content-Type": "application/json" } : {},
          body: isFirstHop ? rawBody : undefined,
          redirect: "manual",
        });

        const location = response.headers.get("location") || "";
        if (response.status >= 300 && response.status < 400 && location) {
          currentUrl = location;
        } else {
          break;
        }
      }

      const text = await response.text();
      return res.status(200).send(text);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
