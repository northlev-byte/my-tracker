// One-off migration script: Google Sheets → Supabase
// Run with: node migrate_to_supabase.mjs

const SUPABASE_URL  = "https://dustykmbxlbcfyvnrlnb.supabase.co";
const SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c3R5a21ieGxiY2Z5dm5ybG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwOTc3MzYsImV4cCI6MjEwMTY3MzczNn0.-qVh6P4tuZbJop_TJmmejJmOAlZc0pY-54kCX2ZRUtk";
const PROXY_URL     = "https://my-tracker-bice.vercel.app/api/proxy";

const headers = {
  "apikey":        SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type":  "application/json",
  "Prefer":        "resolution=merge-duplicates",
};

async function sb(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${text}`);
  return text;
}

function mapToDb(lead) {
  return {
    id:             Number(lead.id),
    client:         lead.client         ?? "",
    event:          lead.event          ?? "",
    ref:            lead.ref            ?? "",
    date:           lead.date           ?? "",
    end_date:       lead.endDate        ?? "",
    venue:          lead.venue          ?? "",
    assignee:       lead.assignee       ?? "",
    stage:          lead.stage          ?? "New Enquiry",
    name:           lead.name           ?? "",
    company:        lead.company        ?? "",
    email:          lead.email          ?? "",
    value:          lead.value          ?? "",
    notes:          lead.notes          ?? "",
    class_code:     lead.classCode      ?? "",
    files:          lead.files          ?? [],
    recontact_date: lead.recontactDate  ?? "",
  };
}

// ── Fetch from Sheets ────────────────────────────────────────────────────────
console.log("Fetching from Sheets...");
const sheetsRes = await fetch(PROXY_URL);
const data = await sheetsRes.json();

const leads     = data.leads     || [];
const owners    = data.owners    || [];
const prospects = data.prospects || [];
const holidays  = data.holidays  || [];

console.log(`Fetched: ${leads.length} events, ${owners.length} owners, ${prospects.length} prospects, ${holidays.length} holidays`);

// ── Migrate events (in batches of 50) ───────────────────────────────────────
console.log("\nMigrating events...");
const dbLeads = leads.map(mapToDb);
const BATCH = 50;
for (let i = 0; i < dbLeads.length; i += BATCH) {
  const batch = dbLeads.slice(i, i + BATCH);
  await sb("events", batch);
  console.log(`  ✓ ${Math.min(i + BATCH, dbLeads.length)} / ${dbLeads.length}`);
}

// ── Migrate owners ───────────────────────────────────────────────────────────
console.log("\nMigrating owners...");
const dbOwners = owners.map((name, i) => ({ name, sort_order: i }));
await sb("owners", dbOwners);
console.log(`  ✓ ${dbOwners.length} owners`);

// ── Migrate prospects + holidays into app_config ─────────────────────────────
console.log("\nMigrating config (prospects + holidays)...");
await sb("app_config", [
  { key: "prospects", value: prospects },
  { key: "holidays",  value: holidays  },
]);
console.log("  ✓ prospects and holidays");

console.log("\n✅ Migration complete!");
