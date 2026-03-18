// Vercel serverless proxy — forwards all requests to Google Apps Script.
// This exists purely to avoid CORS: browsers can't POST directly to script.google.com
// from a different origin, but a server-to-server call has no such restriction.

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
      // Debug: ?url=1 returns the GAS_URL this build is using — remove once confirmed
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
      const bodyStr = rawBody.toString("utf8");

      console.log("=== PROXY POST START ===");
      console.log("Initial GAS URL:", GAS_URL);
      console.log("Body length (bytes):", rawBody.length);
      console.log("Body prefix (first 200 chars):", bodyStr.substring(0, 200));

      // Follow redirects manually, keeping POST at every hop
      let currentUrl = GAS_URL;
      let response;
      let hop = 0;

      while (hop < 5) {
        hop++;
        const reqHeaders = { "Content-Type": "application/json" };
        console.log(`--- Hop ${hop}: POST ${currentUrl}`);
        console.log(`--- Hop ${hop}: sending headers:`, JSON.stringify(reqHeaders));

        response = await fetch(currentUrl, {
          method: "POST",
          headers: reqHeaders,
          body: rawBody,
          redirect: "manual",
        });

        console.log(`--- Hop ${hop}: response status:`, response.status);
        console.log(`--- Hop ${hop}: response headers:`, JSON.stringify(Object.fromEntries(response.headers.entries())));

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location");
          console.log(`--- Hop ${hop}: redirecting to:`, location);
          if (!location) break;
          currentUrl = location;
        } else {
          break; // non-redirect — this is the final response
        }
      }

      const text = await response.text();
      console.log("=== FINAL response status:", response.status);
      console.log("=== FINAL response body (first 600 chars):", text.substring(0, 600));
      console.log("=== PROXY POST END ===");

      return res.status(200).send(text);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[proxy] request failed:", err.message, err.stack);
    return res.status(500).json({ error: err.message });
  }
}
