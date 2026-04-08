// Vercel serverless proxy — forwards requests to HubSpot CRM API.
// Avoids CORS issues; token stays server-side per request.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return res.status(401).json({ error: "Missing HubSpot token" });

  const HS = "https://api.hubapi.com";
  const hdrs = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const action = req.query.action || "deals";

  try {
    // ── Pipeline stages ──────────────────────────────────────
    if (action === "stages") {
      const r = await fetch(`${HS}/crm/v3/pipelines/deals`, { headers: hdrs });
      return res.status(r.status).json(await r.json());
    }

    // ── Owners ───────────────────────────────────────────────
    if (action === "owners") {
      const r = await fetch(`${HS}/crm/v3/owners?limit=100`, { headers: hdrs });
      return res.status(r.status).json(await r.json());
    }

    // ── Deals (with company associations) ────────────────────
    if (action === "deals") {
      const props = [
        "dealname", "amount", "closedate", "dealstage",
        "hubspot_owner_id", "description", "hs_deal_description",
      ];

      // Paginate through all deals
      let allDeals = [], after;
      do {
        const url = new URL(`${HS}/crm/v3/objects/deals`);
        url.searchParams.set("limit", "100");
        url.searchParams.set("properties", props.join(","));
        url.searchParams.set("associations", "company");
        if (after) url.searchParams.set("after", after);

        const r = await fetch(url.toString(), { headers: hdrs });
        if (!r.ok) return res.status(r.status).json(await r.json());
        const data = await r.json();
        allDeals.push(...(data.results || []));
        after = data.paging?.next?.after;
      } while (after);

      // Batch-fetch company names for all associated companies
      const companyIds = [
        ...new Set(
          allDeals.flatMap(d =>
            (d.associations?.companies?.results || []).map(c => c.id)
          )
        ),
      ];

      const companyMap = {};
      if (companyIds.length > 0) {
        const batchRes = await fetch(`${HS}/crm/v3/objects/companies/batch/read`, {
          method: "POST",
          headers: hdrs,
          body: JSON.stringify({
            properties: ["name"],
            inputs: companyIds.map(id => ({ id })),
          }),
        });
        if (batchRes.ok) {
          const bd = await batchRes.json();
          (bd.results || []).forEach(c => {
            companyMap[c.id] = c.properties?.name || "";
          });
        }
      }

      // Attach resolved company name to each deal
      const deals = allDeals.map(d => ({
        id: d.id,
        properties: d.properties,
        company: (d.associations?.companies?.results || [])
          .map(c => companyMap[c.id] || "")
          .filter(Boolean)
          .join(", "),
      }));

      return res.status(200).json({ deals, total: deals.length });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error("HUBSPOT_PROXY_ERROR|" + err.message);
    return res.status(500).json({ error: err.message });
  }
}
