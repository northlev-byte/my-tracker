// Emergency restore — POSTs the 72-lead JSON to the Vercel proxy, then reads back the count.
// Run from project root:  node restore.js

import { readFileSync } from "fs";

const PROXY = "https://my-tracker-bice.vercel.app/api/proxy";
const data = JSON.parse(readFileSync("./restore-data.json", "utf-8"));

console.log(`Posting ${data.leads.length} leads, ${data.owners.length} owners…`);

const postRes = await fetch(PROXY, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
const postText = await postRes.text();
console.log("POST status:", postRes.status);
console.log("POST response:", postText.slice(0, 300));

// Verify by reading back
console.log("\nVerifying — reading Sheets now…");
const getRes = await fetch(PROXY);
const getJson = await getRes.json();
console.log("Sheets now has:", getJson.leads?.length, "leads");
console.log("Sheets owners:", getJson.owners?.length);
