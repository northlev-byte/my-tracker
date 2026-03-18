// Vercel serverless proxy — forwards all requests to Google Apps Script.
// This exists purely to avoid CORS: browsers can't POST directly to script.google.com
// from a different origin, but a server-to-server call has no such restriction.
//
// IMPORTANT: GAS /exec endpoints issue a 302 redirect. Node fetch follows redirects
// automatically but downgrades POST→GET on a 302, so doPost never fires.
// Fix: use redirect:"manual", detect the 302, and re-POST to the Location URL.

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbx43ILL71R_N4G-6wsq2wXDtHau_ky1Ei78Xfu1TLcQpvWv8OPSX9lDCkBgKm_ckIFp/exec";

export const config = {
  api: {
    bodyParser: false, // read raw bytes so we can forward them unchanged
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
    if (req.method === "GET") {
      const gasRes = await fetch(GAS_URL);
      const text = await gasRes.text();
      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(text);
    }

    if (req.method === "POST") {
      const rawBody = await readRawBody(req);

      // Step 1: send POST with redirect:manual so we catch the 302 ourselves
      const first = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: rawBody,
        redirect: "manual",
      });

      console.log("[proxy] first response status:", first.status, "location:", first.headers.get("location"));

      let gasRes;
      if (first.status >= 300 && first.status < 400) {
        // Step 2: follow the redirect as a POST (not GET) to reach doPost
        const redirectUrl = first.headers.get("location");
        console.log("[proxy] re-POSTing to redirect URL:", redirectUrl);
        gasRes = await fetch(redirectUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: rawBody,
        });
      } else {
        gasRes = first;
      }

      const text = await gasRes.text();
      console.log("[proxy] final GAS response status:", gasRes.status, "body prefix:", text.substring(0, 120));
      return res.status(200).send(text);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[proxy] GAS request failed:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
