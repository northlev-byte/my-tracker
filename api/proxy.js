// Vercel serverless proxy — forwards all requests to Google Apps Script.
// Uses Edge Runtime for 30s timeout (GAS redirect chain can exceed 10s on hobby plan).

export const config = {
  runtime: "edge",
};

const GAS_URL =
  "https://script.google.com/macros/s/AKfycby9rmRaKYipf88AuEdfucwTlq1manzjtUEprI00SiRPJv8LUL-n5oASRjN6YG8YeqLf/exec";

export default async function handler(req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      if (url.searchParams.get("url") === "1") {
        return new Response(JSON.stringify({ GAS_URL }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const gasRes = await fetch(GAS_URL);
      const text = await gasRes.text();
      return new Response(text, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const rawBody = await req.text();

      // Follow redirects manually — GAS /exec POSTs redirect, final GET triggers doPost
      let currentUrl = GAS_URL;
      let response;
      const trail = [];

      for (let hop = 0; hop < 6; hop++) {
        const isFirstHop = hop === 0;
        response = await fetch(currentUrl, {
          method: isFirstHop ? "POST" : "GET",
          headers: isFirstHop ? { "Content-Type": "application/json" } : {},
          body: isFirstHop ? rawBody : undefined,
          redirect: "manual",
        });

        const location = response.headers.get("location") || "";
        trail.push({
          hop: hop + 1,
          method: isFirstHop ? "POST" : "GET",
          url: currentUrl,
          status: response.status,
          location,
        });

        if (response.status >= 300 && response.status < 400 && location) {
          currentUrl = location;
        } else {
          break;
        }
      }

      const text = await response.text();
      console.log(
        "PROXY|hops=" + trail.length +
        "|final_status=" + response.status +
        "|body_prefix=" + text.replace(/\s+/g, " ").substring(0, 200)
      );

      return new Response(text, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("PROXY_ERROR|" + err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
