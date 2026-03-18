// Vercel serverless proxy — forwards all requests to Google Apps Script.

const GAS_URL =
  "https://script.google.com/macros/s/AKfycby9rmRaKYipf88AuEdfucwTlq1manzjtUEprI00SiRPJv8LUL-n5oASRjN6YG8YeqLf/exec";

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
    if (req.method === "GET") {
      if (req.url && req.url.includes("url=1")) {
        return res.status(200).json({ GAS_URL });
      }
      const gasRes = await fetch(GAS_URL);
      const text = await gasRes.text();
      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(text);
    }

    if (req.method === "POST") {
      const rawBody = await readRawBody(req);

      // Follow redirects manually, re-POSTing at each hop
      let currentUrl = GAS_URL;
      let response;
      const trail = []; // one entry per hop: {url, status, location}

      for (let hop = 0; hop < 6; hop++) {
        response = await fetch(currentUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: rawBody,
          redirect: "manual",
        });

        const location = response.headers.get("location") || "";
        trail.push({ hop: hop + 1, url: currentUrl, status: response.status, location });

        if (response.status >= 300 && response.status < 400 && location) {
          currentUrl = location;
        } else {
          break;
        }
      }

      const text = await response.text();

      // Single-line summary — always visible in Vercel logs regardless of truncation
      console.log("PROXY|hops=" + trail.length
        + "|final_status=" + response.status
        + "|body_prefix=" + text.replace(/\s+/g, " ").substring(0, 200));

      // Full hop trail on one line each
      trail.forEach(t =>
        console.log("HOP|" + t.hop + "|status=" + t.status + "|url=" + t.url + "|location=" + t.location)
      );

      return res.status(200).send(text);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("PROXY_ERROR|" + err.message + "|" + err.stack);
    return res.status(500).json({ error: err.message });
  }
}
