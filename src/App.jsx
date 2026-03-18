import { useState, useMemo, useEffect, useRef } from "react";

const PASSWORD = "ConnectinEvents";

const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Closed Won", "Closed Lost"];
const STAGE_COLORS = {
  "New":         { bg: "#e8f4fd", text: "#1a6fa8", dot: "#3b9edd" },
  "Contacted":   { bg: "#fff3e0", text: "#b45309",  dot: "#f59e0b" },
  "Qualified":   { bg: "#f0fdf4", text: "#166534",  dot: "#22c55e" },
  "Proposal":    { bg: "#faf5ff", text: "#7c3aed",  dot: "#a855f7" },
  "Closed Won":  { bg: "#dcfce7", text: "#15803d",  dot: "#16a34a" },
  "Closed Lost": { bg: "#fef2f2", text: "#dc2626",  dot: "#ef4444" },
};

const MONTH_COLORS = {
  "04": { bg: "#fff0f6", border: "#f472b6", text: "#9d174d", bar: "#ec4899", label: "Apr" }, // Hot pink
  "05": { bg: "#fff7ed", border: "#fb923c", text: "#9a3412", bar: "#f97316", label: "May" }, // Vivid orange
  "06": { bg: "#fefce8", border: "#facc15", text: "#854d0e", bar: "#eab308", label: "Jun" }, // Bold yellow
  "07": { bg: "#f0fdf4", border: "#4ade80", text: "#14532d", bar: "#16a34a", label: "Jul" }, // Bright green
  "08": { bg: "#ecfeff", border: "#22d3ee", text: "#164e63", bar: "#06b6d4", label: "Aug" }, // Cyan
  "09": { bg: "#eff6ff", border: "#60a5fa", text: "#1e3a8a", bar: "#2563eb", label: "Sep" }, // Royal blue
  "10": { bg: "#f5f3ff", border: "#a78bfa", text: "#4c1d95", bar: "#7c3aed", label: "Oct" }, // Deep violet
  "11": { bg: "#fdf2f8", border: "#e879f9", text: "#701a75", bar: "#c026d3", label: "Nov" }, // Magenta
  "12": { bg: "#fff1f2", border: "#fb7185", text: "#881337", bar: "#e11d48", label: "Dec" }, // Crimson
  "01": { bg: "#f0fdfa", border: "#34d399", text: "#064e3b", bar: "#059669", label: "Jan" }, // Emerald
  "02": { bg: "#fefce8", border: "#fbbf24", text: "#78350f", bar: "#d97706", label: "Feb" }, // Amber
  "03": { bg: "#f8fafc", border: "#64748b", text: "#1e293b", bar: "#475569", label: "Mar" }, // Slate
};

function getMonthColor(monthKey) {
  if (!monthKey) return { bg:"#f9fafb", border:"#e5e7eb", text:"#374151", bar:"#6b7280", label:"" };
  const mm = monthKey.substring(5, 7);
  return MONTH_COLORS[mm] || { bg:"#f9fafb", border:"#e5e7eb", text:"#374151", bar:"#6b7280", label:"" };
}

// Financial years config
const FINANCIAL_YEARS = [
  {
    id: "fy2627",
    label: "FY 26/27",
    months: [
      "2026-04","2026-05","2026-06","2026-07","2026-08","2026-09",
      "2026-10","2026-11","2026-12","2027-01","2027-02","2027-03"
    ]
  },
  {
    id: "fy2728",
    label: "FY 27/28",
    months: [
      "2027-04","2027-05","2027-06","2027-07","2027-08","2027-09",
      "2027-10","2027-11","2027-12","2028-01","2028-02","2028-03"
    ]
  },
];

const MONTHLY_TARGET = 50000;
const DEFAULT_OWNERS = ["David", "Jordan", "Jess", "Penni", "PP", "David / PP", "Jordan/PP", "Jordan/David", "Jess/PP", "David / Jordan"];
// All requests go through /api/proxy (Vercel serverless) to avoid CORS.
// The proxy forwards to Google Apps Script server-side where CORS doesn't apply.
const SHEET_URL = "/api/proxy";

const REAL_DATA = [
  { id: 1,  client:"ANS",                  event:"Amplify",                          ref:"124", date:"2026-03-05", venue:"Office",               assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 2,  client:"ANS",                  event:"Customer Event March",             ref:"122", date:"2026-03-12", venue:"The Londoner",          assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 3,  client:"Brazen",               event:"Manchester Airport",               ref:"169", date:"2026-03-18", venue:"CO-OP Live",            assignee:"Penni",         stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 4,  client:"COC",                  event:"Joe Gallagher Speaker",            ref:"167", date:"2026-03-26", venue:"MCR",                   assignee:"David / PP",    stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 5,  client:"Herbalife",            event:"Nutrition Club",                   ref:"151", date:"2026-04-17", venue:"TBC",                   assignee:"Jess",          stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 6,  client:"Guinness Partnerships",event:"North Roadshow",                   ref:"208", date:"2026-05-01", venue:"Manchester Central",    assignee:"David",         stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 7,  client:"Women In Property",    event:"Summit",                           ref:"140", date:"2026-04-23", venue:"Lowry Hotel",           assignee:"Jordan/PP",     stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 8,  client:"Godel Technologies",   event:"Customer Event April",             ref:"206", date:"2026-04-30", venue:"Cloud 23",              assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 9,  client:"CPC",                  event:"Digital Supplier Conference",      ref:"177", date:"2026-05-01", venue:"TBC",                   assignee:"David",         stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 10, client:"Wates",                event:"Brighton",                         ref:"137", date:"2026-05-06", venue:"TBC",                   assignee:"Jess/PP",       stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 11, client:"ANS",                  event:"Presidents Club 26",               ref:"181", date:"2026-05-12", venue:"Marrakesh",             assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 12, client:"Beaver Trust",         event:"Beaver Conference",                ref:"105", date:"2026-05-20", venue:"Civic Centre Newcastle", assignee:"Jordan",       stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 13, client:"DBD",                  event:"Spring Party",                     ref:"178", date:"2026-05-23", venue:"Springfield Farm",      assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 14, client:"Diecast",              event:"Youth Foundation Ball",            ref:"143", date:"2026-06-04", venue:"Diecast",               assignee:"PP",            stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 15, client:"One Manchester",       event:"OM Fest 4.0",                      ref:"200", date:"2026-06-12", venue:"Quattro House",         assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 16, client:"Vehicle Consulting",   event:"Golf Day at Styal Golf Club",      ref:"195", date:"2026-06-17", venue:"Styal Golf Club",       assignee:"David",         stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 17, client:"Ignite",               event:"Hive Installer Show",              ref:"189", date:"2026-06-21", venue:"NEC Birmingham",        assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 18, client:"Housing Conference",   event:"Fusion 21",                        ref:"133", date:"2026-06-23", venue:"Impossible",            assignee:"Jordan/PP",     stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 19, client:"Housing Conference",   event:"Novus",                            ref:"132", date:"2026-06-23", venue:"TBC",                   assignee:"Jordan/PP",     stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 20, client:"Housing Conference",   event:"Housing Rocks",                    ref:"134", date:"2026-06-24", venue:"Impossible",            assignee:"Jordan/PP",     stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 21, client:"Housing Conference",   event:"Wates",                            ref:"131", date:"2026-06-24", venue:"Deansgate Manchester",  assignee:"Jordan/PP",     stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 22, client:"CPC",                  event:"CPC Supplier Expo",                ref:"176", date:"2026-06-26", venue:"Lowry Hotel",           assignee:"David",         stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 23, client:"Vehicle Consulting",   event:"Away Day",                         ref:"172", date:"2026-06-26", venue:"TBC",                   assignee:"David",         stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 24, client:"Oliver James",         event:"Summer Party 26",                  ref:"175", date:"2026-07-03", venue:"20 Stories",            assignee:"David",         stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 25, client:"DBD",                  event:"Summer Party 26",                  ref:"192", date:"2026-07-09", venue:"Liverpool or MCR",      assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 26, client:"Fournet",              event:"Staff Conference and Summer Party", ref:"202", date:"2026-07-09", venue:"TBC",                  assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 27, client:"Tpas",                 event:"Conference",                       ref:"106", date:"2026-07-13", venue:"EMCC",                  assignee:"Jordan/David",  stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 28, client:"Ric Moylan",           event:"Reset Conference 26",              ref:"199", date:"2026-07-14", venue:"Lowry Hotel",           assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 29, client:"PXC",                  event:"Summer Party 26",                  ref:"203", date:"2026-07-19", venue:"TBC",                   assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 30, client:"CIH",                  event:"Fusion 21",                        ref:"198", date:"2026-09-05", venue:"TBC",                   assignee:"Penni",         stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 31, client:"Worldline",            event:"Wordfest 26",                      ref:"158", date:"2026-09-05", venue:"The Bond",              assignee:"Jess",          stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 32, client:"CIH",                  event:"Novus",                            ref:"136", date:"2026-09-08", venue:"Daffodil",              assignee:"PP",            stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 33, client:"CIH",                  event:"Wates",                            ref:"135", date:"2026-09-08", venue:"TBC",                   assignee:"PP",            stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 34, client:"CIH",                  event:"Wish",                             ref:"190", date:"2026-09-08", venue:"TBC",                   assignee:"Penni",         stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 35, client:"Dr Oetker",            event:"Brand Planning 26",                ref:"180", date:"2026-09-17", venue:"Diecast",               assignee:"David / PP",    stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 36, client:"Ignite",               event:"Screwfix Live 26",                 ref:"182", date:"2026-09-23", venue:"Farnborough",           assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 37, client:"Herbalife",            event:"Nutrition Club 2",                 ref:"152", date:"2026-09-25", venue:"TBC",                   assignee:"Jess",          stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 38, client:"Ric Moylan",           event:"CBN 26",                           ref:"126", date:"2026-10-03", venue:"Manchester Deansgate",  assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 39, client:"Women In Property",    event:"Annual Dinner 26",                 ref:"127", date:"2026-10-08", venue:"VW",                    assignee:"Jordan/PP",     stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 40, client:"Kids Planet",          event:"Staff Awards",                     ref:"191", date:"2026-10-10", venue:"The Point",             assignee:"PP",            stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 41, client:"Jobs Not Yet Won",     event:"Black Tie Darts",                  ref:"107", date:"2026-10-22", venue:"Hilton",                assignee:"David / Jordan", stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 42, client:"DBD",                  event:"Halloween Party",                  ref:"179", date:"2026-10-30", venue:"Springfield Farm",      assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 43, client:"Onward",               event:"Colleague Conference 26",          ref:"153", date:"2026-11-06", venue:"Manchester Central",    assignee:"David",         stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 44, client:"Torus",                event:"Annual Conference 26",             ref:"129", date:"2026-11-18", venue:"Boxpark",               assignee:"Jordan/PP",     stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 45, client:"Birtenshaw",           event:"Annual Dinner 26",                 ref:"144", date:"2026-11-21", venue:"Manchester Deansgate",  assignee:"PP",            stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 46, client:"UKCF",                 event:"Annual Conference 26",             ref:"128", date:"2026-11-24", venue:"EMMC",                  assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 47, client:"Incommunities",        event:"Colleague Conference 26",          ref:"174", date:"2026-12-03", venue:"Bradford Live",         assignee:"David",         stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 48, client:"Fournet",              event:"Christmas Party 26",               ref:"197", date:"2026-12-04", venue:"Cloud 23",              assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 49, client:"Fusion 21",            event:"Christmas Party 26",               ref:"185", date:"2026-12-04", venue:"Treehouse Hotel",       assignee:"Penni",         stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 50, client:"Canford Law",          event:"Christmas Party 26",               ref:"209", date:"2026-12-05", venue:"TBC",                   assignee:"David",         stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id: 51, client:"PXC",                  event:"Christmas Party 26",               ref:"194", date:"2026-12-16", venue:"TBC",                   assignee:"Jordan",        stage:"Qualified", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:211,  client:"Bathshack",           event:"Launch Event",                        ref:"TBC",  date:"2026-05-01", venue:"TBC",                  assignee:"Jess",   stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:212,  client:"Princes",               event:"Activation",                          ref:"TBC",  date:"2026-05-01", venue:"TBC",                  assignee:"Jess",   stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:213,  client:"Este Medical Group",    event:"Padel Brand Activation",              ref:"TBC",  date:"2026-04-14", venue:"TBC",                  assignee:"Jess",   stage:"New", name:"Lucy Melling", company:"Scene Agency", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:214,  client:"Bacardi",               event:"Brand Conference",                    ref:"TBC",  date:"2026-04-23", venue:"TBC",                  assignee:"Penni",  stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:215,  client:"BGN",                   event:"Geneva Event",                        ref:"TBC",  date:"2026-05-01", venue:"Geneva",               assignee:"Jordan", stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:216,  client:"Herbalife",             event:"Extravaganza Friday",                 ref:"TBC",  date:"2026-06-26", venue:"Krakow",               assignee:"Jess",   stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:217,  client:"Vinci",                 event:"Team Building",                       ref:"TBC",  date:"2026-09-07", venue:"TBC",                  assignee:"Georgie",stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:218,  client:"WIP Central",           event:"Annual Dinner",                       ref:"TBC",  date:"2026-10-29", venue:"TBC",                  assignee:"Penni",  stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:219,  client:"Aldermore",             event:"Colleague Conference & Awards",       ref:"TBC",  date:"2026-12-01", venue:"TBC",                  assignee:"Penni",  stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:220,  client:"TP Bennett",            event:"Traitors Event",                      ref:"TBC",  date:"2026-12-17", venue:"TBC",                  assignee:"Georgie",stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:221,  client:"Oliver James",          event:"Christmas Event",                     ref:"TBC",  date:"2026-12-03", venue:"Treehouse",            assignee:"David",  stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:222,  client:"Worldline",             event:"Tech Conference",                     ref:"TBC",  date:"2026-07-01", venue:"TBC",                  assignee:"Jess",   stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:223,  client:"Kids Planet",           event:"Managers Conference",                 ref:"TBC",  date:"2027-01-01", venue:"TBC",                  assignee:"Penni",  stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:224,  client:"Novus",                 event:"Awards",                              ref:"TBC",  date:"2027-01-28", venue:"The Treehouse",        assignee:"Jordan", stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:225,  client:"Sovini Housing",        event:"Event",                               ref:"TBC",  date:"2027-02-01", venue:"TBC",                  assignee:"Penni",  stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:226,  client:"Girls Out Loud",        event:"Event",                               ref:"TBC",  date:"2027-03-03", venue:"Hilton",               assignee:"Penni",  stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },
  { id:227,  client:"City Of Champions",     event:"Event",                               ref:"TBC",  date:"2027-03-15", venue:"TBC",                  assignee:"Penni",  stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" },

];

const emptyForm = { client:"", event:"", ref:"", date:"", venue:"", assignee:"", stage:"New", name:"", company:"", email:"", value:"", notes:"", files:[], classCode:"" };

// ── Helpers ──────────────────────────────────────────────
function monthKey(dateStr) { return dateStr ? dateStr.substring(0,7) : null; }


// Parse a holiday date string like "29 Apr – 7 May 2026" or "9 Mar 2026" into {start, end} Date objects
function parseHolidayRange(dateStr) {
  if (!dateStr) return null;
  try {
    // Single date: "9 Mar 2026"
    const single = dateStr.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (single) {
      const d = new Date(`${single[2]} ${single[1]} ${single[3]}`);
      return isNaN(d) ? null : { start: d, end: d };
    }
    // Range across months: "29 Apr – 7 May 2026"
    const range = dateStr.match(/^(\d{1,2})\s+([A-Za-z]+)\s*[–-]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (range) {
      const start = new Date(`${range[2]} ${range[1]} ${range[5]}`);
      const end   = new Date(`${range[4]} ${range[3]} ${range[5]}`);
      return (isNaN(start)||isNaN(end)) ? null : { start, end };
    }
    // Range same month: "17 – 21 Feb 2026"
    const sameMonth = dateStr.match(/^(\d{1,2})\s*[–-]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (sameMonth) {
      const start = new Date(`${sameMonth[3]} ${sameMonth[1]} ${sameMonth[4]}`);
      const end   = new Date(`${sameMonth[3]} ${sameMonth[2]} ${sameMonth[4]}`);
      return (isNaN(start)||isNaN(end)) ? null : { start, end };
    }
    // Multi-date "27 Feb & 2 Mar 2026" — treat as separate single dates, return first
    const multi = dateStr.match(/^(\d{1,2})\s+([A-Za-z]+)\s*&\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (multi) {
      const d1 = new Date(`${multi[2]} ${multi[1]} ${multi[5]}`);
      const d2 = new Date(`${multi[4]} ${multi[3]} ${multi[5]}`);
      return isNaN(d1) ? null : { start: d1, end: isNaN(d2)?d1:d2 };
    }
  } catch {}
  return null;
}

function getHolidayClashes(lead, holidays) {
  if (!lead.date || !lead.assignee) return [];
  const eventDate = new Date(lead.date);
  if (isNaN(eventDate)) return [];
  // Extract individual names from assignee (handles "David / Jordan", "Jordan/PP" etc)
  const names = lead.assignee.split(/[/,&]/).map(n=>n.trim()).filter(Boolean);
  const clashes = [];
  holidays.forEach(h => {
    if (!h.dates || !h.person) return;
    const personMatch = names.some(n => n.toLowerCase() === h.person.toLowerCase());
    if (!personMatch) return;
    const range = parseHolidayRange(h.dates);
    if (!range) return;
    const eTime = eventDate.getTime();
    if (eTime >= range.start.getTime() && eTime <= range.end.getTime()) {
      clashes.push({ person: h.person, dates: h.dates });
    }
  });
  return clashes;
}
function fmt(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'}); }
  catch { return d; }
}
function autoClass(lead) {
  if (!lead.client && !lead.event && !lead.ref) return "";
  const month = lead.date ? new Date(lead.date).toLocaleDateString('en-GB',{month:'short',year:'2-digit'}) : "";
  const parts = [lead.client, lead.event, lead.ref ? lead.ref + (month ? " - " + month : "") : month].filter(Boolean);
  return parts.join(", ");
}

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (["pdf"].includes(ext)) return "📄";
  if (["doc","docx"].includes(ext)) return "📝";
  if (["xls","xlsx"].includes(ext)) return "📊";
  if (["jpg","jpeg","png","gif","webp"].includes(ext)) return "🖼️";
  return "📎";
}

// ── Inline Edit Cell ──────────────────────────────────────
function EditCell({ value, onSave, type="text", placeholder="—", mono=false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value||"");
  const ref = useRef();
  useEffect(()=>{ if(editing) ref.current?.focus(); },[editing]);
  function commit() { setEditing(false); if(draft!==(value||"")) onSave(draft); }
  if (editing) return (
    <td style={{padding:"3px 6px"}}>
      <input ref={ref} type={type} value={draft}
        onChange={e=>setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e=>{ if(e.key==="Enter") commit(); if(e.key==="Escape"){setDraft(value||"");setEditing(false);} }}
        style={{width:"100%",padding:"5px 8px",border:"1.5px solid #6366f1",borderRadius:6,fontSize:12,fontFamily:mono?"'DM Mono',monospace":"inherit",outline:"none",background:"#fafafe"}}
      />
    </td>
  );
  return (
    <td onClick={()=>{setDraft(value||"");setEditing(true);}} title="Click to edit"
      style={{padding:"10px 12px",cursor:"text"}} className="edit-cell">
      {value
        ? <span style={{fontSize:13,color:"#374151",fontFamily:mono?"'DM Mono',monospace":"inherit"}}>
            {type==="date"?fmt(value):(mono&&value?`£${Number(value).toLocaleString()}`:value)}
          </span>
        : <span style={{fontSize:12,color:"#d1d5db"}}>{placeholder}</span>}
    </td>
  );
}

// ── Monthly Tracker ───────────────────────────────────────
function MonthlyTracker({ leads, fyMonths }) {
  const today = new Date();
  const currentKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;

  const monthData = useMemo(()=> fyMonths.map(key => {
    const mc = getMonthColor(key);
    const ml = (leads||[]).filter(l=>monthKey(l.date)===key);
    const confirmed = ml.filter(l=>l.stage==="Closed Won").reduce((s,l)=>s+Number(l.value||0),0);
    const warm      = ml.filter(l=>l.stage==="Proposal").reduce((s,l)=>s+Number(l.value||0),0);
    const cold      = ml.filter(l=>l.stage==="New").reduce((s,l)=>s+Number(l.value||0),0);
    const total     = confirmed+warm+cold;
    const BAR_MAX    = 200000;
    const confirmedH= Math.round(Math.min(confirmed,BAR_MAX)/BAR_MAX*100);
    const warmH     = Math.round(Math.min(warm,Math.max(0,BAR_MAX-confirmed))/BAR_MAX*100);
    const coldH     = Math.round(Math.min(cold,Math.max(0,BAR_MAX-confirmed-warm))/BAR_MAX*100);
    const targetLineH= Math.round(MONTHLY_TARGET/BAR_MAX*100);
    const totalPct  = Math.round(confirmed/MONTHLY_TARGET*100);  // only confirmed counts toward target
    const isPast    = key<currentKey;
    const isCurrent = key===currentKey;
    const gap       = Math.max(0,MONTHLY_TARGET-confirmed);  // gap based on confirmed only
    return {key,label:mc.label,mc,confirmed,warm,cold,total,confirmedH,warmH,coldH,totalPct,isPast,isCurrent,gap,eventCount:ml.length};
  }),[leads,fyMonths]);

  const fyC = monthData.reduce((s,m)=>s+m.confirmed,0);
  const fyW = monthData.reduce((s,m)=>s+m.warm,0);
  const fyK = monthData.reduce((s,m)=>s+m.cold,0);

  return (
    <div style={{background:"#fff",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"20px 24px",marginBottom:22}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontWeight:700,fontSize:15,color:"#111827",letterSpacing:"-.01em"}}>Monthly Pipeline Tracker</div>
          <div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>£50,000 target per month</div>
        </div>
        <div style={{display:"flex",gap:14,fontSize:12,color:"#6b7280",flexWrap:"wrap"}}>
          {[["#16a34a","Confirmed (Won)"],["#a855f7","Warm (Proposal)"],["var(--bar)","Cold (New)"]].map(([c,l])=>(
            <span key={l} style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:10,height:10,borderRadius:2,background:c==="var(--bar)"?"#06b6d4":c,display:"inline-block",flexShrink:0}}/>
              {l}
            </span>
          ))}
        </div>
      </div>
      <div style={{overflowX:"auto",paddingBottom:4}}>
        <div style={{display:"flex",gap:8,minWidth:700}}>
          {monthData.map(m=>{
            const hitTarget=m.confirmed>=MONTHLY_TARGET;
            const borderColor=hitTarget?"#16a34a":m.isPast&&m.confirmed>0?"#ef4444":m.mc.border;
            return (
              <div key={m.key} style={{flex:"1 1 0",minWidth:0,border:`2px solid ${borderColor}`,borderRadius:10,padding:"10px 6px 8px",background:m.mc.bg,position:"relative",display:"flex",flexDirection:"column",alignItems:"center"}}>
                {m.isCurrent&&<div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:m.mc.bar,color:"#fff",fontSize:8,fontWeight:700,borderRadius:999,padding:"2px 6px",whiteSpace:"nowrap",zIndex:1}}>NOW</div>}
                <div style={{fontSize:11,fontWeight:800,color:m.mc.text,marginBottom:6,textAlign:"center",letterSpacing:".02em"}}>{m.label}</div>
                <div style={{width:"100%",height:72,borderRadius:6,background:"rgba(0,0,0,.08)",position:"relative",overflow:"hidden",marginBottom:6}}>
                  {m.confirmedH>0&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:`${m.confirmedH}%`,background:"#16a34a"}}/>}
                  {m.warmH>0&&<div style={{position:"absolute",bottom:`${m.confirmedH}%`,left:0,right:0,height:`${m.warmH}%`,background:"#a855f7"}}/>}
                  {m.coldH>0&&<div style={{position:"absolute",bottom:`${m.confirmedH+m.warmH}%`,left:0,right:0,height:`${m.coldH}%`,background:m.mc.bar}}/>}
                  <div style={{position:"absolute",bottom:`${m.targetLineH}%`,left:0,right:0,height:2,background:"#111827",opacity:.4,zIndex:2}} title="£50k target"/>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:hitTarget?"#16a34a":m.isPast&&m.confirmed===0?"rgba(0,0,0,.2)":m.isPast?"#ef4444":m.mc.text,textAlign:"center"}}>
                  {m.confirmed>0?(m.totalPct>100?<span style={{color:"#16a34a"}}>🎉{m.totalPct}%</span>:`${m.totalPct}%`):"—"}
                </div>
                <div style={{fontSize:8,color:"#6b7280",textAlign:"center",marginTop:1,lineHeight:1.2}}>of £50k target</div>
                {m.confirmed>0&&<div style={{fontSize:9,fontWeight:700,color:"#16a34a",textAlign:"center",fontFamily:"'DM Mono',monospace",marginTop:3}}>✓ £{m.confirmed>=1000?(m.confirmed/1000).toFixed(0)+"k":m.confirmed}</div>}
                {m.warm>0&&<div style={{fontSize:9,fontWeight:600,color:"#a855f7",textAlign:"center",fontFamily:"'DM Mono',monospace",marginTop:1}}>~ £{m.warm>=1000?(m.warm/1000).toFixed(0)+"k":m.warm}</div>}
                {m.cold>0&&<div style={{fontSize:9,fontWeight:600,color:"#06b6d4",textAlign:"center",fontFamily:"'DM Mono',monospace",marginTop:1}}>· £{m.cold>=1000?(m.cold/1000).toFixed(0)+"k":m.cold}</div>}
                {m.gap>0&&<div style={{fontSize:9,color:"#ef4444",textAlign:"center",marginTop:2,fontWeight:700,whiteSpace:"nowrap"}}>−£{m.gap>=1000?(m.gap/1000).toFixed(1)+"k":m.gap}</div>}
                <div style={{fontSize:9,color:m.mc.text,textAlign:"center",marginTop:2,opacity:.6}}>{m.eventCount} evt{m.eventCount!==1?"s":""}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:16,paddingTop:14,borderTop:"1px solid #f3f4f6"}}>
        {[{label:"FY Confirmed",value:fyC,color:"#15803d",bg:"#f0fdf4"},{label:"FY Warm",value:fyW,color:"#7c3aed",bg:"#faf5ff"},{label:"FY Cold",value:fyK,color:"#0e7490",bg:"#ecfeff"}].map(s=>(
          <div key={s.label} style={{background:s.bg,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:s.color,fontWeight:600}}>{s.label}</span>
            <span style={{fontSize:14,fontWeight:700,color:s.color,fontFamily:"'DM Mono',monospace"}}>{s.value>0?`£${s.value.toLocaleString()}`:"—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── Holidays Data ─────────────────────────────────────────
const HOLIDAYS_2627 = [
  { person:"Penni",  dates:"9 Mar 2026",                  note:"" },
  { person:"Penni",  dates:"30 Mar – 2 Apr 2026",         note:"" },
  { person:"Penni",  dates:"29 Apr – 7 May 2026",         note:"" },
  { person:"Penni",  dates:"24 Aug – 1 Sep 2026",         note:"" },
  { person:"Jordan", dates:"29 Jan – 9 Feb 2026",         note:"" },
  { person:"Jordan", dates:"11 May 2026",                 note:"" },
  { person:"Jordan", dates:"17 – 22 Jul 2026",            note:"" },
  { person:"David",  dates:"17 – 21 Feb 2026",            note:"" },
  { person:"David",  dates:"9 – 10 Apr 2026",             note:"" },
  { person:"David",  dates:"22 May – 5 Jun 2026",         note:"" },
  { person:"David",  dates:"14 – 19 Aug 2026",            note:"" },
  { person:"Simon",  dates:"",                            note:"None listed" },
  { person:"Jess",   dates:"27 Feb & 2 Mar 2026",         note:"" },
  { person:"Jess",   dates:"12 – 16 Jun 2026",            note:"" },
  { person:"Jess",   dates:"29 Jun – 2 Jul 2026",         note:"" },
  { person:"Jess",   dates:"6 – 14 Sep 2026",             note:"" },
  { person:"Georgie",dates:"8 – 10 Jun 2026",             note:"" },
  { person:"Georgie",dates:"17 – 19 Jun 2026",            note:"" },
];
const HOLIDAYS_2728 = [];

const PERSON_COLORS = {
  "Penni":  { bg:"#fff0f6", border:"#f9a8d4", text:"#9d174d", dot:"#ec4899" },
  "Jordan": { bg:"#eff6ff", border:"#93c5fd", text:"#1e3a8a", dot:"#3b82f6" },
  "David":  { bg:"#f0fdf4", border:"#86efac", text:"#14532d", dot:"#16a34a" },
  "Simon":  { bg:"#f5f3ff", border:"#c4b5fd", text:"#4c1d95", dot:"#7c3aed" },
  "Jess":   { bg:"#fff7ed", border:"#fdba74", text:"#9a3412", dot:"#f97316" },
  "PP":     { bg:"#fdf4ff", border:"#e879f9", text:"#701a75", dot:"#c026d3" },
  "Georgie":{ bg:"#ecfeff", border:"#67e8f9", text:"#164e63", dot:"#06b6d4" },
};

// ── Calendar View ─────────────────────────────────────────
function CalendarView({ leads, onEventClick, holidays=[], recontacts=[] }) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  // Build grid of days for current month
  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay  = new Date(calYear, calMonth+1, 0);
  // Monday-first: 0=Mon … 6=Sun
  const startPad = (firstDay.getDay()+6)%7;
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startPad + 1;
    const date = (dayNum >= 1 && dayNum <= lastDay.getDate())
      ? new Date(calYear, calMonth, dayNum) : null;
    cells.push(date);
  }

  // Map events to their date string
  const eventsByDate = {};
  leads.forEach(lead => {
    if (!lead.date) return;
    const d = new Date(lead.date);
    if (isNaN(d)) return;
    if (d.getFullYear()===calYear && d.getMonth()===calMonth) {
      const key = d.getDate();
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push(lead);
    }
  });

  // Map recontact reminders to their date
  const recontactsByDate = {};
  recontacts.forEach(lead => {
    if (!lead.recontactDate) return;
    const d = new Date(lead.recontactDate);
    if (isNaN(d)) return;
    if (d.getFullYear()===calYear && d.getMonth()===calMonth) {
      const key = d.getDate();
      if (!recontactsByDate[key]) recontactsByDate[key] = [];
      recontactsByDate[key].push(lead);
    }
  });

  // Map holidays to day ranges for this month
  const holidaysByDate = {}; // key=dayNum, value=[{person,dates,color}]
  holidays.forEach(h => {
    if (!h.dates || !h.person) return;
    const range = parseHolidayRange(h.dates);
    if (!range) return;
    const pc = PERSON_COLORS[h.person] || { dot:"#6b7280" };
    // iterate each day in range that falls in current month/year
    const cur = new Date(range.start);
    while (cur <= range.end) {
      if (cur.getFullYear()===calYear && cur.getMonth()===calMonth) {
        const key = cur.getDate();
        if (!holidaysByDate[key]) holidaysByDate[key] = [];
        // avoid duplicate person entries on same day
        if (!holidaysByDate[key].some(x=>x.person===h.person)) {
          holidaysByDate[key].push({ person:h.person, dates:h.dates, color:pc.dot });
        }
      }
      cur.setDate(cur.getDate()+1);
    }
  });

  const todayStr = today.toDateString();

  function prevMonth() {
    if (calMonth===0) { setCalMonth(11); setCalYear(y=>y-1); }
    else setCalMonth(m=>m-1);
  }
  function nextMonth() {
    if (calMonth===11) { setCalMonth(0); setCalYear(y=>y+1); }
    else setCalMonth(m=>m+1);
  }

  // Count events this month
  const totalThisMonth = Object.values(eventsByDate).reduce((s,a)=>s+a.length,0);

  return (
    <div style={{background:"#fff",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1.5px solid #f3f4f6",background:"#fafafa"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={prevMonth} style={{background:"#f3f4f6",border:"none",borderRadius:7,width:30,height:30,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:"#374151"}}>‹</button>
          <div>
            <span style={{fontWeight:700,fontSize:17,color:"#111827"}}>{monthNames[calMonth]} {calYear}</span>
            <span style={{fontSize:12,color:"#9ca3af",marginLeft:10}}>{totalThisMonth} event{totalThisMonth!==1?"s":""}</span>
          </div>
          <button onClick={nextMonth} style={{background:"#f3f4f6",border:"none",borderRadius:7,width:30,height:30,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:"#374151"}}>›</button>
        </div>
        <button onClick={()=>{setCalMonth(today.getMonth());setCalYear(today.getFullYear());}}
          style={{fontSize:12,color:"#6b7280",background:"#f3f4f6",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>
          Today
        </button>
      </div>

      {/* Day headers */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#f9fafb",borderBottom:"1px solid #f3f4f6"}}>
        {dayNames.map(d=>(
          <div key={d} style={{padding:"8px 0",textAlign:"center",fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:".06em"}}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gridAutoRows:"minmax(90px,auto)"}}>
        {cells.map((date,i)=>{
          const dayNum = date ? date.getDate() : null;
          const isToday = date && date.toDateString()===todayStr;
          const isWeekend = date && (date.getDay()===0||date.getDay()===6);
          const events     = dayNum ? (eventsByDate[dayNum]||[])    : [];
          const hols       = dayNum ? (holidaysByDate[dayNum]||[])   : [];
          const recs       = dayNum ? (recontactsByDate[dayNum]||[]) : [];
          const MAX_SHOW = 3;

          return (
            <div key={i} style={{
              borderRight: (i+1)%7===0 ? "none" : "1px solid #f3f4f6",
              borderBottom: "1px solid #f3f4f6",
              padding:"6px 7px",
              background: !date ? "#fafafa" : isWeekend ? "#fdfcff" : "#fff",
              minHeight:90,
            }}>
              {date && (
                <>
                  <div style={{
                    width:24,height:24,borderRadius:"50%",
                    background:isToday?"#111827":"transparent",
                    color:isToday?"#fff":isWeekend?"#9ca3af":"#374151",
                    fontWeight:isToday?700:500,
                    fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",
                    marginBottom:4,
                  }}>{dayNum}</div>
                  {events.slice(0,MAX_SHOW).map(lead=>{
                    const mc = getMonthColor(monthKey(lead.date));
                    const sc = STAGE_COLORS[lead.stage]||STAGE_COLORS["New"];
                    return (
                      <div key={lead.id} onClick={()=>onEventClick(lead)}
                        title={`${lead.client} – ${lead.event}\nOwner: ${lead.assignee||"—"}\nStage: ${lead.stage}`}
                        style={{
                          background:mc.bg, borderLeft:`3px solid ${mc.bar}`,
                          borderRadius:"0 4px 4px 0", padding:"2px 5px",
                          marginBottom:2, cursor:"pointer", overflow:"hidden",
                        }}>
                        <div style={{fontSize:10,fontWeight:700,color:"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lead.client}</div>
                        <div style={{fontSize:9,color:"#6b7280",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:3}}>
                          <span style={{width:5,height:5,borderRadius:"50%",background:sc.dot,display:"inline-block",flexShrink:0}}/>
                          {lead.event}
                        </div>
                      </div>
                    );
                  })}
                  {events.length>MAX_SHOW&&(
                    <div style={{fontSize:9,color:"#6b7280",fontWeight:600,padding:"1px 5px"}}>+{events.length-MAX_SHOW} more</div>
                  )}
                  {hols.length>0&&(
                    <div style={{marginTop:3,display:"flex",flexWrap:"wrap",gap:2}}>
                      {hols.map((h,i)=>(
                        <div key={i} title={`${h.person} on holiday`}
                          style={{display:"flex",alignItems:"center",gap:2,background:`${h.color}18`,border:`1px solid ${h.color}40`,borderRadius:3,padding:"1px 4px"}}>
                          <span style={{width:5,height:5,borderRadius:"50%",background:h.color,display:"inline-block",flexShrink:0}}/>
                          <span style={{fontSize:8,fontWeight:700,color:h.color,whiteSpace:"nowrap"}}>{h.person}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {recs.map(lead=>(
                    <div key={`rc-${lead.id}`}
                      title={`📞 Recontact: ${lead.client} – ${lead.event}\nOriginally lost: ${lead.date||"unknown date"}`}
                      style={{background:"#fffbeb",borderLeft:"3px solid #f59e0b",borderRadius:"0 4px 4px 0",padding:"2px 5px",marginTop:2,cursor:"default"}}>
                      <div style={{fontSize:9,fontWeight:700,color:"#92400e",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>📞 {lead.client}</div>
                      <div style={{fontSize:8,color:"#b45309",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lead.event}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Holidays Tab ───────────────────────────────────────────
function HolidaysTab({ fy }) {
  const baseHols = (fy==="fy2627" ? HOLIDAYS_2627 : HOLIDAYS_2728).map((h,i)=>({...h,id:`base-${i}`}));
  const [allHols, setAllHols] = useState(baseHols);
  const [newEntry, setNewEntry] = useState({ person:"", dates:"", note:"" });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const people = [...new Set(allHols.map(h=>h.person))].filter(Boolean).sort();

  function addEntry() {
    if (!newEntry.person || !newEntry.dates) return;
    setAllHols(h=>[...h, {...newEntry, id:`custom-${Date.now()}`}]);
    setNewEntry({ person:"", dates:"", note:"" });
  }
  function deleteEntry(id) { setAllHols(h=>h.filter(x=>x.id!==id)); }
  function startEdit(h) { setEditingId(h.id); setEditDraft({dates:h.dates,note:h.note||""}); }
  function saveEdit(id) {
    setAllHols(h=>h.map(x=>x.id===id?{...x,...editDraft}:x));
    setEditingId(null);
  }

  return (
    <div>
      {/* Add form */}
      <div style={{background:"#fff",borderRadius:10,border:"1.5px solid #e5e7eb",padding:"16px 20px",marginBottom:20}}>
        <div style={{fontSize:12,fontWeight:700,color:"#374151",marginBottom:12}}>➕ Add Holiday Period</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:".07em",marginBottom:4}}>Person</div>
            <input value={newEntry.person} onChange={e=>setNewEntry(n=>({...n,person:e.target.value}))}
              placeholder="e.g. Jordan" className="form-input" style={{width:120}}/>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:".07em",marginBottom:4}}>Dates</div>
            <input value={newEntry.dates} onChange={e=>setNewEntry(n=>({...n,dates:e.target.value}))}
              placeholder="e.g. 1–5 Jun 2027" className="form-input" style={{width:200}}/>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:".07em",marginBottom:4}}>Note (optional)</div>
            <input value={newEntry.note} onChange={e=>setNewEntry(n=>({...n,note:e.target.value}))}
              onKeyDown={e=>e.key==="Enter"&&addEntry()}
              placeholder="e.g. Annual leave" className="form-input" style={{width:160}}/>
          </div>
          <button className="btn-primary" onClick={addEntry}>+ Add</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {people.map(person=>{
          const pc = PERSON_COLORS[person] || { bg:"#f9fafb",border:"#e5e7eb",text:"#374151",dot:"#6b7280" };
          const personHols = allHols.filter(h=>h.person===person);
          return (
            <div key={person} style={{background:pc.bg,border:`1.5px solid ${pc.border}`,borderRadius:12,padding:"16px 18px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:pc.dot,flexShrink:0}}/>
                <div style={{fontWeight:700,fontSize:15,color:pc.text}}>{person}</div>
                <div style={{marginLeft:"auto",fontSize:11,color:pc.text,opacity:.6,fontWeight:600}}>{personHols.length} period{personHols.length!==1?"s":""}</div>
              </div>
              {personHols.length===0&&<div style={{fontSize:13,color:pc.text,opacity:.4,paddingBottom:4}}>No holidays listed</div>}
              {personHols.map((h,i)=>(
                <div key={h.id} style={{padding:"8px 0",borderTop:i>0?"1px solid rgba(0,0,0,.06)":"none"}}>
                  {editingId===h.id ? (
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      <input value={editDraft.dates} onChange={e=>setEditDraft(d=>({...d,dates:e.target.value}))}
                        className="form-input" style={{fontSize:13,padding:"5px 8px"}} placeholder="Dates"/>
                      <input value={editDraft.note} onChange={e=>setEditDraft(d=>({...d,note:e.target.value}))}
                        className="form-input" style={{fontSize:12,padding:"5px 8px"}} placeholder="Note (optional)"/>
                      <div style={{display:"flex",gap:6,marginTop:2}}>
                        <button onClick={()=>saveEdit(h.id)} style={{background:pc.dot,color:"#fff",border:"none",borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Save</button>
                        <button onClick={()=>setEditingId(null)} style={{background:"#f3f4f6",color:"#374151",border:"none",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                      <span style={{fontSize:13,marginTop:1,flexShrink:0}}>🏖️</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:500,color:pc.text}}>{h.dates||"—"}</div>
                        {h.note&&<div style={{fontSize:11,color:pc.text,opacity:.6,marginTop:1}}>{h.note}</div>}
                      </div>
                      <div style={{display:"flex",gap:4,flexShrink:0}}>
                        <button onClick={()=>startEdit(h)}
                          style={{background:"rgba(0,0,0,.06)",border:"none",borderRadius:5,padding:"3px 7px",fontSize:11,cursor:"pointer",color:pc.text,fontFamily:"inherit"}}>✏️</button>
                        <button onClick={()=>deleteEntry(h.id)}
                          style={{background:"rgba(239,68,68,.1)",border:"none",borderRadius:5,padding:"3px 7px",fontSize:11,cursor:"pointer",color:"#ef4444",fontFamily:"inherit"}}>✕</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {people.length===0&&(
        <div style={{textAlign:"center",color:"#9ca3af",fontSize:14,padding:"40px 0"}}>No holidays added yet. Use the form above to add entries.</div>
      )}
    </div>
  );
}

// ── Prospects Tab ─────────────────────────────────────────
function ProspectsTab({ prospects, setProspects, owners, leads, setLeads, setActiveTab }) {
  const [addingFor, setAddingFor] = useState(null);
  const [form, setForm] = useState({ type: "Client", name: "", notes: "", details: "", phone: "", clientName: "", clientEmail: "" });
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState({});
  const [convertSuccess, setConvertSuccess] = useState(false);
  const [addingLog, setAddingLog] = useState(false);
  const [logForm, setLogForm] = useState({ date: "", note: "" });

  const individualOwners = (owners || DEFAULT_OWNERS).filter(o => !/[/&]/.test(o));

  function startAdd(owner) {
    setAddingFor(owner);
    setForm({ type: "Client", name: "", notes: "", details: "", phone: "", clientName: "", clientEmail: "" });
  }

  function saveProspect() {
    if (!form.name.trim()) return;
    setProspects(p => [...(p || []), {
      id: Date.now(),
      assignee: addingFor,
      type: form.type,
      name: form.name.trim(),
      notes: form.notes.trim(),
      details: form.details.trim(),
      phone: form.phone.trim(),
      clientName: form.clientName.trim(),
      clientEmail: form.clientEmail.trim(),
      createdAt: new Date().toISOString().split("T")[0],
      log: [],
    }]);
    setAddingFor(null);
  }

  function openDetail(p) {
    setSelectedProspect(p);
    setEditing(false);
    setConvertSuccess(false);
    setAddingLog(false);
    setLogForm({ date: new Date().toISOString().split("T")[0], note: "" });
  }

  function closeDetail() {
    setSelectedProspect(null);
    setEditing(false);
    setConvertSuccess(false);
    setAddingLog(false);
  }

  function addLogEntry(prospectId) {
    if (!logForm.date || !logForm.note.trim()) return;
    const entry = { id: Date.now(), date: logForm.date, note: logForm.note.trim() };
    setProspects(ps => ps.map(x => x.id === prospectId
      ? { ...x, log: [...(x.log || []), entry] }
      : x
    ));
    setLogForm({ date: new Date().toISOString().split("T")[0], note: "" });
    setAddingLog(false);
  }

  function deleteLogEntry(prospectId, entryId) {
    setProspects(ps => ps.map(x => x.id === prospectId
      ? { ...x, log: (x.log || []).filter(e => e.id !== entryId) }
      : x
    ));
  }

  function startEdit() {
    setEditDraft({
      type: selectedProspect.type,
      name: selectedProspect.name,
      notes: selectedProspect.notes || "",
      details: selectedProspect.details || "",
      phone: selectedProspect.phone || "",
      clientName: selectedProspect.clientName || "",
      clientEmail: selectedProspect.clientEmail || "",
    });
    setEditing(true);
  }

  function saveEdit() {
    if (!editDraft.name.trim()) return;
    const updated = { ...selectedProspect, ...editDraft };
    setProspects(p => p.map(x => x.id === selectedProspect.id ? updated : x));
    setSelectedProspect(updated);
    setEditing(false);
  }

  function deleteProspect(id) {
    setProspects(p => p.filter(x => x.id !== id));
    closeDetail();
  }

  function convertToLead(p) {
    const maxId = (leads || []).reduce((mx, x) => Math.max(mx, Number(x.id) || 0), 0);
    const newLead = {
      id: maxId + 1,
      client: p.type === "Client" ? p.name : (p.clientName || ""),
      event: "",
      ref: "",
      date: "",
      venue: p.type === "Venue" ? p.name : "",
      assignee: p.assignee,
      stage: "Proposal",
      name: p.clientName || "",
      company: p.type === "Client" ? p.name : "",
      email: p.clientEmail || "",
      value: "",
      notes: p.notes || "",
      files: [],
      classCode: "",
    };
    setLeads(l => [...(l || []), newLead]);
    setConvertSuccess(true);
  }

  // Keep selectedProspect in sync if prospects array changes
  const liveSelected = selectedProspect ? (prospects || []).find(p => p.id === selectedProspect.id) || null : null;

  return (
    <div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 18 }}>
        Track potential clients and venues each team member is in conversation with. Click any entry to view details.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
        {individualOwners.map(owner => {
          const pc = PERSON_COLORS[owner] || { bg: "#f9fafb", border: "#e5e7eb", text: "#374151", dot: "#6b7280" };
          const ownerProspects = (prospects || []).filter(p => p.assignee === owner);
          const clientCount = ownerProspects.filter(p => p.type === "Client").length;
          const venueCount = ownerProspects.filter(p => p.type === "Venue").length;

          return (
            <div key={owner} style={{ background: pc.bg, border: `1.5px solid ${pc.border}`, borderRadius: 12, padding: "16px 18px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: pc.dot, flexShrink: 0 }} />
                <div style={{ fontWeight: 700, fontSize: 15, color: pc.text }}>{owner}</div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
                  {clientCount > 0 && <span style={{ fontSize: 10, background: `${pc.dot}25`, color: pc.text, borderRadius: 999, padding: "2px 7px", fontWeight: 700 }}>👤 {clientCount}</span>}
                  {venueCount > 0 && <span style={{ fontSize: 10, background: `${pc.dot}25`, color: pc.text, borderRadius: 999, padding: "2px 7px", fontWeight: 700 }}>📍 {venueCount}</span>}
                  {ownerProspects.length === 0 && <span style={{ fontSize: 11, color: pc.text, opacity: .4, fontWeight: 600 }}>0 prospects</span>}
                </div>
              </div>

              {/* Prospect list — each row is clickable */}
              {ownerProspects.map((p, i) => (
                <div key={p.id} onClick={() => openDetail(p)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginLeft: -10, marginRight: -10, borderRadius: 8, cursor: "pointer", transition: "background .12s", borderTop: i > 0 ? `1px solid rgba(0,0,0,.05)` : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.7)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{p.type === "Venue" ? "📍" : "👤"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: pc.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: pc.text, opacity: .5, marginTop: 1 }}>
                      {p.clientName ? p.clientName + (p.phone ? " · " + p.phone : "") : (p.notes ? p.notes.substring(0, 40) + (p.notes.length > 40 ? "…" : "") : p.type + " · " + p.createdAt)}
                    </div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={pc.dot} strokeWidth="2.5" style={{ flexShrink: 0, opacity: .4 }}><path d="m9 18 6-6-6-6"/></svg>
                </div>
              ))}

              {/* Inline add form */}
              {addingFor === owner ? (
                <div style={{ marginTop: ownerProspects.length > 0 ? 10 : 0, padding: "10px 12px", background: "rgba(255,255,255,.75)", borderRadius: 8, border: `1.5px solid ${pc.border}` }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    {["Client", "Venue"].map(t => (
                      <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                        style={{ flex: 1, padding: "5px", border: `1.5px solid ${form.type === t ? pc.dot : pc.border}`, borderRadius: 6, background: form.type === t ? `${pc.dot}20` : "transparent", color: form.type === t ? pc.text : `${pc.text}80`, fontWeight: form.type === t ? 700 : 500, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                        {t === "Client" ? "👤 Client" : "📍 Venue"}
                      </button>
                    ))}
                  </div>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={form.type === "Venue" ? "Venue name…" : "Company / client name…"} style={{ marginBottom: 6, fontSize: 13 }} autoFocus />
                  <input className="form-input" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                    placeholder="Contact name…" style={{ marginBottom: 6, fontSize: 13 }} />
                  <input className="form-input" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                    placeholder="Contact email…" style={{ marginBottom: 6, fontSize: 13 }} type="email" />
                  <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Phone number…" style={{ marginBottom: 6, fontSize: 13 }} />
                  <input className="form-input" value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
                    placeholder="Website / details link…" style={{ marginBottom: 6, fontSize: 13 }} />
                  <textarea className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Notes (optional)…" rows={2} style={{ marginBottom: 8, fontSize: 12, resize: "vertical" }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={saveProspect}
                      style={{ flex: 1, background: pc.dot, color: "#fff", border: "none", borderRadius: 6, padding: "7px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      Add
                    </button>
                    <button onClick={() => setAddingFor(null)}
                      style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => startAdd(owner)}
                  style={{ marginTop: ownerProspects.length > 0 ? 10 : 0, width: "100%", background: "rgba(255,255,255,.5)", border: `1.5px dashed ${pc.border}`, borderRadius: 8, padding: "8px", fontSize: 12, color: pc.text, opacity: .65, cursor: "pointer", fontWeight: 600, fontFamily: "inherit", transition: "opacity .15s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.65}>
                  + Add Prospect
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      {liveSelected && (() => {
        const p = liveSelected;
        const pc = PERSON_COLORS[p.assignee] || { bg: "#f9fafb", border: "#e5e7eb", text: "#374151", dot: "#6b7280" };
        return (
          <div className="overlay" onClick={e => e.target === e.currentTarget && closeDetail()}>
            <div className="modal" style={{ width: 520 }}>
              {/* Modal header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${pc.dot}20`, border: `1.5px solid ${pc.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    {p.type === "Venue" ? "📍" : "👤"}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: pc.dot, textTransform: "uppercase", letterSpacing: ".07em" }}>{p.type}</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginTop: 1 }}>{p.name}</div>
                  </div>
                </div>
                <button onClick={closeDetail} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>×</button>
              </div>

              {/* Owner + date */}
              <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${pc.dot}15`, borderRadius: 7, padding: "5px 10px" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: pc.dot }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: pc.text }}>{p.assignee}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#f3f4f6", borderRadius: 7, padding: "5px 10px" }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>Added {p.createdAt}</span>
                </div>
              </div>

              {/* Pipeline conversion success banner */}
              {convertSuccess && (
                <div style={{ background: "#dcfce7", border: "1.5px solid #86efac", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>✅</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>Added to Pipeline as Proposal</div>
                    <button onClick={() => { closeDetail(); setActiveTab("events"); }}
                      style={{ background: "none", border: "none", color: "#15803d", fontWeight: 700, fontSize: 12, cursor: "pointer", padding: 0, textDecoration: "underline", fontFamily: "inherit", marginTop: 2 }}>
                      Go to Events & Pipeline →
                    </button>
                  </div>
                </div>
              )}

              {/* Edit / View fields */}
              {editing ? (
                <div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {["Client", "Venue"].map(t => (
                      <button key={t} onClick={() => setEditDraft(d => ({ ...d, type: t }))}
                        style={{ flex: 1, padding: "6px", border: `1.5px solid ${editDraft.type === t ? pc.dot : "#e5e7eb"}`, borderRadius: 7, background: editDraft.type === t ? `${pc.dot}20` : "#f9fafb", color: editDraft.type === t ? pc.text : "#6b7280", fontWeight: editDraft.type === t ? 700 : 500, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                        {t === "Client" ? "👤 Client" : "📍 Venue"}
                      </button>
                    ))}
                  </div>
                  <label className="form-label">Name</label>
                  <input className="form-input" value={editDraft.name} onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                    style={{ marginBottom: 10 }} autoFocus />
                  <label className="form-label">Contact Name</label>
                  <input className="form-input" value={editDraft.clientName} onChange={e => setEditDraft(d => ({ ...d, clientName: e.target.value }))}
                    style={{ marginBottom: 10 }} placeholder="Contact person name…" />
                  <label className="form-label">Contact Email</label>
                  <input className="form-input" value={editDraft.clientEmail} onChange={e => setEditDraft(d => ({ ...d, clientEmail: e.target.value }))}
                    style={{ marginBottom: 10 }} placeholder="Email address…" type="email" />
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" value={editDraft.phone} onChange={e => setEditDraft(d => ({ ...d, phone: e.target.value }))}
                    style={{ marginBottom: 10 }} placeholder="Phone number…" />
                  <label className="form-label">Website / Details Link</label>
                  <input className="form-input" value={editDraft.details} onChange={e => setEditDraft(d => ({ ...d, details: e.target.value }))}
                    style={{ marginBottom: 10 }} placeholder="https://…" />
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" value={editDraft.notes} onChange={e => setEditDraft(d => ({ ...d, notes: e.target.value }))}
                    rows={3} style={{ resize: "vertical" }} placeholder="Add notes…" />
                </div>
              ) : (
                <div>
                  {/* Contact details grid */}
                  {(p.clientName || p.clientEmail || p.phone || p.details) && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                      {p.clientName && (
                        <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px", border: "1px solid #f3f4f6" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Contact</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{p.clientName}</div>
                        </div>
                      )}
                      {p.clientEmail && (
                        <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px", border: "1px solid #f3f4f6" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Email</div>
                          <a href={`mailto:${p.clientEmail}`} style={{ fontSize: 13, fontWeight: 600, color: "#3b82f6", textDecoration: "none" }}>{p.clientEmail}</a>
                        </div>
                      )}
                      {p.phone && (
                        <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px", border: "1px solid #f3f4f6" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Phone</div>
                          <a href={`tel:${p.phone}`} style={{ fontSize: 13, fontWeight: 600, color: "#374151", textDecoration: "none" }}>{p.phone}</a>
                        </div>
                      )}
                      {p.details && (
                        <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px", border: "1px solid #f3f4f6", overflow: "hidden" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Website / Link</div>
                          <a href={p.details.startsWith("http") ? p.details : "https://" + p.details} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 13, fontWeight: 600, color: "#3b82f6", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                            {p.details.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>Notes</div>
                  {p.notes ? (
                    <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, background: "#f9fafb", borderRadius: 8, padding: "12px 14px", border: "1px solid #f3f4f6", whiteSpace: "pre-wrap" }}>{p.notes}</div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#d1d5db", fontStyle: "italic", padding: "12px 0" }}>No notes added yet.</div>
                  )}

                  {/* Contact Log */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em" }}>Contact Log</div>
                    {!addingLog && (
                      <button onClick={() => setAddingLog(true)}
                        style={{ background: `${pc.dot}15`, border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: pc.text, cursor: "pointer", fontFamily: "inherit" }}>
                        + Log Interaction
                      </button>
                    )}
                  </div>

                  {/* Add log entry form */}
                  {addingLog && (
                    <div style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <div style={{ flex: "0 0 auto" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Date</div>
                          <input type="date" className="form-input" value={logForm.date}
                            onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))}
                            style={{ fontSize: 13, width: 150 }} />
                        </div>
                      </div>
                      <textarea className="form-input" value={logForm.note}
                        onChange={e => setLogForm(f => ({ ...f, note: e.target.value }))}
                        placeholder="What was discussed…" rows={2}
                        style={{ fontSize: 13, resize: "vertical", marginBottom: 8 }} autoFocus />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => addLogEntry(p.id)}
                          style={{ background: pc.dot, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                          Save
                        </button>
                        <button onClick={() => setAddingLog(false)}
                          style={{ background: "transparent", border: "none", color: "#6b7280", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Log timeline */}
                  {(p.log || []).length === 0 && !addingLog ? (
                    <div style={{ fontSize: 13, color: "#d1d5db", fontStyle: "italic", paddingBottom: 4 }}>No interactions logged yet.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {[...(p.log || [])].sort((a, b) => b.date.localeCompare(a.date)).map((entry, i, arr) => {
                        const d = new Date(entry.date + "T00:00:00");
                        const dayName = d.toLocaleDateString("en-GB", { weekday: "short" });
                        const dayNum = d.getDate();
                        const month = d.toLocaleDateString("en-GB", { month: "short" });
                        const year = d.getFullYear();
                        const isLast = i === arr.length - 1;
                        return (
                          <div key={entry.id} style={{ display: "flex", gap: 12, position: "relative" }}>
                            {/* Timeline spine */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 32 }}>
                              <div style={{ width: 10, height: 10, borderRadius: "50%", background: pc.dot, flexShrink: 0, marginTop: 14, zIndex: 1 }} />
                              {!isLast && <div style={{ width: 2, flex: 1, background: `${pc.dot}30`, minHeight: 12 }} />}
                            </div>
                            {/* Entry content */}
                            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 12 }}>
                              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: pc.text }}>{dayName} {dayNum} {month} {year}</span>
                                <button onClick={() => deleteLogEntry(p.id, entry.id)}
                                  style={{ background: "none", border: "none", color: "#d1d5db", fontSize: 11, cursor: "pointer", padding: "0 2px", fontFamily: "inherit", lineHeight: 1 }}
                                  title="Delete entry">×</button>
                              </div>
                              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.55, marginTop: 3, background: "#f9fafb", borderRadius: 6, padding: "8px 10px", border: "1px solid #f3f4f6", whiteSpace: "pre-wrap" }}>
                                {entry.note}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginTop: 22, alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={() => deleteProspect(p.id)}
                  style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 4px", fontFamily: "inherit" }}>
                  Delete
                </button>
                {!editing && !convertSuccess && (
                  <button onClick={() => convertToLead(p)}
                    style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 7, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    Send to Pipeline
                  </button>
                )}
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  {editing ? (
                    <>
                      <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                      <button className="btn-primary" onClick={saveEdit}>Save Changes</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-ghost" onClick={closeDetail}>Close</button>
                      <button className="btn-primary" onClick={startEdit}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Password Screen ───────────────────────────────────────
function PasswordScreen({ onUnlock }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  function attempt() {
    if (pw === PASSWORD) { onUnlock(); }
    else {
      setError(true); setShake(true); setPw("");
      setTimeout(()=>setShake(false), 500);
    }
  }
  return (
    <div style={{minHeight:"100vh",background:"#0a0a0a",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans','Segoe UI',sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        @keyframes fadein{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.7;transform:scale(1.05)}}
        .pw-card{animation:fadein .5s ease}
        .pw-shake{animation:shake .4s ease}
        .pw-btn:hover{background:#a8e840!important;transform:translateY(-1px)}
        .pw-input:focus{border-color:#c6f135!important;box-shadow:0 0 0 3px rgba(198,241,53,.15)!important}
      `}</style>
      {/* Background glow blobs */}
      <div style={{position:"absolute",top:"15%",left:"10%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(198,241,53,.08) 0%,transparent 70%)",animation:"pulse 4s ease-in-out infinite",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"10%",right:"5%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(198,241,53,.05) 0%,transparent 70%)",animation:"pulse 5s ease-in-out infinite .5s",pointerEvents:"none"}}/>

      <div className={`pw-card${shake?" pw-shake":""}`} style={{position:"relative",zIndex:1,width:440,maxWidth:"92vw",textAlign:"center",padding:"0 20px"}}>

        {/* Logo */}
        <div style={{marginBottom:32}}>
          <img
            src="https://connectinevents.co.uk/wp-content/uploads/2025/04/connectin-logo-green-white.png"
            alt="ConnectIn Events"
            style={{height:52,objectFit:"contain"}}
            onError={e=>{e.target.style.display="none";}}
          />
        </div>

        {/* Headline */}
        <div style={{fontSize:11,fontWeight:700,color:"#c6f135",letterSpacing:".18em",textTransform:"uppercase",marginBottom:10}}>Team Portal</div>
        <h1 style={{fontSize:32,fontWeight:900,color:"#fff",margin:"0 0 6px",lineHeight:1.1,letterSpacing:"-.03em"}}>Event & Lead<br/>Tracker</h1>
        <div style={{fontSize:14,color:"rgba(255,255,255,.4)",marginBottom:36,fontWeight:400}}>Enter your password to access the dashboard</div>

        {/* Input */}
        <input
          className="pw-input"
          type="password" value={pw}
          onChange={e=>{setPw(e.target.value);setError(false);}}
          onKeyDown={e=>e.key==="Enter"&&attempt()}
          placeholder="Password"
          style={{width:"100%",padding:"15px 20px",borderRadius:10,border:`1.5px solid ${error?"#f87171":"rgba(255,255,255,.12)"}`,background:"rgba(255,255,255,.05)",color:"#fff",fontSize:15,outline:"none",marginBottom:error?8:18,fontFamily:"inherit",textAlign:"center",letterSpacing:".12em",transition:"all .2s",backdropFilter:"blur(8px)"}}
        />
        {error&&<div style={{fontSize:13,color:"#f87171",marginBottom:14,fontWeight:500}}>Incorrect password — please try again</div>}

        {/* Button */}
        <button
          className="pw-btn"
          onClick={attempt}
          style={{width:"100%",padding:"15px",background:"#c6f135",color:"#0a0a0a",border:"none",borderRadius:10,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",letterSpacing:".02em",transition:"all .2s",textTransform:"uppercase"}}>
          Access Dashboard →
        </button>

        <div style={{marginTop:24,fontSize:11,color:"rgba(255,255,255,.2)",letterSpacing:".05em"}}>CONNECTIN EVENTS · INTERNAL USE ONLY</div>
      </div>
    </div>
  );
}

// ── HubSpot Integration ───────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  function splitLine(line) {
    const res = []; let cur = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (inQ && line[i+1]==='"') { cur+='"'; i++; } else inQ=!inQ; }
      else if (c === ',' && !inQ) { res.push(cur.trim()); cur=""; }
      else cur += c;
    }
    res.push(cur.trim()); return res;
  }
  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).filter(l=>l.trim()).map(l=>{ const vals=splitLine(l); const obj={}; headers.forEach((h,i)=>{ obj[h]=vals[i]||""; }); return obj; });
  return { headers, rows };
}

function autoDetectFields(headers) {
  const map = {};
  const h = headers.map(x=>x.toLowerCase());
  const find = (...terms) => headers[h.findIndex(x=>terms.some(t=>x.includes(t)))] || "";
  map.client   = find("company","account","organisation","organization");
  map.event    = find("deal name","dealname","name","title");
  map.value    = find("amount","value","revenue","deal value");
  map.date     = find("close date","closedate","event date","date");
  map.stage    = find("deal stage","stage","status");
  map.assignee = find("owner","assigned","rep","account manager");
  map.ref      = find("deal id","id","hs_object","reference","ref");
  map.notes    = find("description","notes","note");
  return map;
}

const DEFAULT_STAGE_MAP = {
  "closedwon":  "Closed Won",
  "closed won": "Closed Won",
  "won":        "Closed Won",
  "proposal":   "Proposal",
  "proposaldelivered": "Proposal",
  "proposal delivered": "Proposal",
  "presentation": "Proposal",
  "qualified":  "New",
  "new":        "New",
  "appointmentscheduled": "New",
  "appointment scheduled": "New",
  "contacted":  "New",
  "decisionmakerboughtin": "Proposal",
  "contractsent": "Proposal",
  "contract sent": "Proposal",
};

function mapStage(rawStage, customMap) {
  const key = (rawStage||"").toLowerCase().replace(/\s+/g,"");
  if (customMap[rawStage]) return customMap[rawStage];
  const keyFull = (rawStage||"").toLowerCase();
  for (const [k,v] of Object.entries(DEFAULT_STAGE_MAP)) {
    if (keyFull.includes(k) || key.includes(k.replace(/\s/g,""))) return v;
  }
  return "New";
}

function fmtVal(v) { return v>0?`£${v.toLocaleString()}`:"—"; }

function HubSpotTab({ leads, setLeads, owners }) {
  const [section, setSection] = useState("import");
  const [token, setToken] = useState(() => localStorage.getItem("hs_token")||"");
  const [tokenSaved, setTokenSaved] = useState(!!localStorage.getItem("hs_token"));
  const [csvData, setCsvData] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [fieldMap, setFieldMap] = useState({});
  const [customStageMap, setCustomStageMap] = useState(() => { try { return JSON.parse(localStorage.getItem("hs_stagemap")||"{}"); } catch { return {}; } });
  const [ownerMap, setOwnerMap] = useState(() => { try { return JSON.parse(localStorage.getItem("hs_ownermap")||"{}"); } catch { return {}; } });
  const [preview, setPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [stageFilter, setStageFilter] = useState("All");
  const fileRef = useRef(null);

  const existingRefs = useMemo(() => new Set((leads||[]).map(l=>String(l.ref||"")).filter(Boolean)), [leads]);

  function saveToken() { localStorage.setItem("hs_token", token); setTokenSaved(true); }
  function saveOwnerMap() { localStorage.setItem("hs_ownermap", JSON.stringify(ownerMap)); }
  function saveStageMap() { localStorage.setItem("hs_stagemap", JSON.stringify(customStageMap)); }

  function handleCSVFile(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const { headers, rows } = parseCSV(ev.target.result);
      setCsvHeaders(headers);
      setCsvData(rows);
      setFieldMap(autoDetectFields(headers));
      setPreview(null); setImportResult(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const mappedPreview = useMemo(() => {
    if (!csvData || !fieldMap.event) return null;
    return csvData.map((row, i) => {
      const rawStage = row[fieldMap.stage]||"";
      const stage    = mapStage(rawStage, customStageMap);
      const rawOwner = row[fieldMap.assignee]||"";
      const assignee = ownerMap[rawOwner] || rawOwner;
      const ref      = row[fieldMap.ref]||"";
      const duplicate = ref && existingRefs.has(String(ref));
      return {
        _idx: i, _raw: row, _duplicate: duplicate,
        ref, client: row[fieldMap.client]||"", event: row[fieldMap.event]||"",
        value: parseFloat((row[fieldMap.value]||"").replace(/[£,$, ,]/g,""))||0,
        date: (() => { const d=row[fieldMap.date]||""; if(!d) return ""; const p=new Date(d); return isNaN(p)?"":p.toISOString().split("T")[0]; })(),
        stage, assignee, notes: row[fieldMap.notes]||"",
        _rawStage: rawStage, _rawOwner: rawOwner,
      };
    });
  }, [csvData, fieldMap, customStageMap, ownerMap, existingRefs]);

  const filtered = useMemo(() => {
    if (!mappedPreview) return null;
    return stageFilter==="All" ? mappedPreview : mappedPreview.filter(r=>r.stage===stageFilter);
  }, [mappedPreview, stageFilter]);

  const [selected, setSelected] = useState(new Set());
  useEffect(() => { if (mappedPreview) setSelected(new Set(mappedPreview.filter(r=>!r._duplicate).map(r=>r._idx))); }, [mappedPreview]);

  function toggleAll(rows) {
    if (rows.every(r=>selected.has(r._idx))) { const s=new Set(selected); rows.forEach(r=>s.delete(r._idx)); setSelected(s); }
    else { const s=new Set(selected); rows.forEach(r=>s.add(r._idx)); setSelected(s); }
  }
  function toggleRow(idx) { const s=new Set(selected); s.has(idx)?s.delete(idx):s.add(idx); setSelected(s); }

  function doImport() {
    if (!mappedPreview) return;
    const toImport = mappedPreview.filter(r=>selected.has(r._idx));
    const maxId = (leads||[]).reduce((mx,x)=>Math.max(mx,Number(x.id)||0),0);
    const newLeads = toImport.map((r,i) => ({
      id: maxId+i+1, client: r.client, event: r.event, ref: r.ref,
      date: r.date, venue: "", assignee: r.assignee, stage: r.stage,
      name: "", company: r.client, email: "", value: r.value||"", notes: r.notes,
      files: [], classCode: "",
    }));
    setLeads(l=>[...(l||[]), ...newLeads]);
    setImportResult({ count: newLeads.length, byStage: {
      "Closed Won": newLeads.filter(x=>x.stage==="Closed Won").length,
      "Proposal":   newLeads.filter(x=>x.stage==="Proposal").length,
      "New":        newLeads.filter(x=>x.stage==="New").length,
    }});
    setCsvData(null); setCsvHeaders([]); setPreview(null); setSelected(new Set());
  }

  const sections = [
    { id:"import",  label:"📥 Import CSV" },
    { id:"mapping", label:"🔀 Stage & Owner Mapping" },
    { id:"connect", label:"🔗 API Connection" },
  ];

  const uniqueHSStages = useMemo(() => {
    if (!csvData || !fieldMap.stage) return [];
    return [...new Set(csvData.map(r=>r[fieldMap.stage]||"").filter(Boolean))];
  }, [csvData, fieldMap.stage]);

  const uniqueHSOwners = useMemo(() => {
    if (!csvData || !fieldMap.assignee) return [];
    return [...new Set(csvData.map(r=>r[fieldMap.assignee]||"").filter(Boolean))];
  }, [csvData, fieldMap.assignee]);

  return (
    <div>
      {/* Sub-nav */}
      <div style={{display:"flex",gap:4,marginBottom:20}}>
        {sections.map(s=>(
          <button key={s.id} onClick={()=>setSection(s.id)} style={{padding:"8px 16px",borderRadius:8,border:`1.5px solid ${section===s.id?"#111827":"#e5e7eb"}`,background:section===s.id?"#111827":"#fff",color:section===s.id?"#fff":"#6b7280",fontWeight:section===s.id?700:500,fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Import CSV ── */}
      {section==="import"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {importResult&&(
            <div style={{background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
              <span style={{fontSize:15,fontWeight:700,color:"#15803d"}}>✓ {importResult.count} deal{importResult.count!==1?"s":""} imported</span>
              <span style={{fontSize:12,color:"#16a34a"}}>Confirmed: {importResult.byStage["Closed Won"]} · Warm: {importResult.byStage["Proposal"]} · Cold: {importResult.byStage["New"]}</span>
              <button onClick={()=>setImportResult(null)} style={{marginLeft:"auto",background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
            </div>
          )}

          {/* How to export */}
          <div style={{background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:12,padding:"14px 18px"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#92400e",marginBottom:8}}>How to export deals from HubSpot</div>
            <ol style={{margin:0,paddingLeft:18,fontSize:12,color:"#78350f",lineHeight:1.8}}>
              <li>In HubSpot, go to <strong>CRM → Deals</strong></li>
              <li>Apply any filters (date range, pipeline, owner)</li>
              <li>Click <strong>Actions → Export</strong> at the top right</li>
              <li>Choose <strong>CSV</strong> format and download</li>
              <li>Upload the file below</li>
            </ol>
          </div>

          {!csvData&&(
            <div className="file-drop" onClick={()=>fileRef.current?.click()} style={{padding:40}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" style={{margin:"0 auto 10px",display:"block"}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div style={{fontSize:14,fontWeight:600,color:"#374151",marginBottom:4}}>Upload HubSpot CSV export</div>
              <div style={{fontSize:12,color:"#9ca3af"}}>Click to browse or drag and drop</div>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVFile} style={{display:"none"}}/>
            </div>
          )}

          {csvData&&!mappedPreview&&(
            <div style={{background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:12,padding:20}}>
              <div style={{fontWeight:700,fontSize:14,color:"#111827",marginBottom:14}}>Map columns to fields</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[
                  {field:"client", label:"Client / Company"},
                  {field:"event",  label:"Deal / Event Name"},
                  {field:"value",  label:"Value / Amount"},
                  {field:"date",   label:"Close / Event Date"},
                  {field:"stage",  label:"Deal Stage"},
                  {field:"assignee",label:"Owner / Assignee"},
                  {field:"ref",    label:"Deal ID / Reference"},
                  {field:"notes",  label:"Notes"},
                ].map(({field,label})=>(
                  <div key={field}>
                    <label className="form-label">{label}</label>
                    <select className="form-input" value={fieldMap[field]||""} onChange={e=>setFieldMap(m=>({...m,[field]:e.target.value}))}>
                      <option value="">— skip —</option>
                      {csvHeaders.map(h=><option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button className="btn-primary" style={{marginTop:16}} onClick={()=>setPreview(true)}>Preview Import →</button>
            </div>
          )}

          {mappedPreview&&(
            <div style={{background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:12,overflow:"hidden"}}>
              {/* Stats bar */}
              <div style={{padding:"12px 20px",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:13,fontWeight:700,color:"#111827"}}>{mappedPreview.length} deals found</span>
                <span style={{fontSize:12,color:"#16a34a",fontWeight:600}}>✓ {mappedPreview.filter(r=>r.stage==="Closed Won").length} confirmed</span>
                <span style={{fontSize:12,color:"#a855f7",fontWeight:600}}>~ {mappedPreview.filter(r=>r.stage==="Proposal").length} warm</span>
                <span style={{fontSize:12,color:"#06b6d4",fontWeight:600}}>· {mappedPreview.filter(r=>r.stage==="New").length} cold</span>
                <span style={{fontSize:12,color:"#ef4444",fontWeight:600}}>⚠ {mappedPreview.filter(r=>r._duplicate).length} duplicates (will skip)</span>
                <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
                  <select className="form-input" style={{width:"auto",fontSize:12,padding:"5px 10px"}} value={stageFilter} onChange={e=>setStageFilter(e.target.value)}>
                    <option value="All">All stages</option>
                    <option value="Closed Won">Confirmed</option>
                    <option value="Proposal">Warm</option>
                    <option value="New">Cold</option>
                  </select>
                  <button className="btn-ghost" style={{fontSize:12,padding:"5px 10px"}} onClick={()=>{ setCsvData(null); setCsvHeaders([]); setPreview(null); }}>← Re-upload</button>
                </div>
              </div>
              {/* Table */}
              <div style={{overflowX:"auto",maxHeight:400,overflowY:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
                  <thead style={{position:"sticky",top:0,zIndex:1}}>
                    <tr style={{background:"#f9fafb",borderBottom:"1.5px solid #e5e7eb"}}>
                      <th className="th" style={{width:36}}>
                        <input type="checkbox" checked={filtered&&filtered.length>0&&filtered.every(r=>selected.has(r._idx))} onChange={()=>filtered&&toggleAll(filtered)}/>
                      </th>
                      {["Client","Deal / Event","Date","Value","Stage","Owner","Dup"].map(h=><th key={h} className="th">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(filtered||[]).length===0&&<tr><td colSpan={8} style={{padding:30,textAlign:"center",color:"#9ca3af",fontSize:13}}>No deals to show</td></tr>}
                    {(filtered||[]).map(row=>(
                      <tr key={row._idx} className="row-hover" style={{borderBottom:"1px solid #f3f4f6",opacity:row._duplicate?.9:1}}>
                        <td style={{padding:"8px 12px"}}>
                          <input type="checkbox" checked={selected.has(row._idx)} onChange={()=>toggleRow(row._idx)} disabled={row._duplicate}/>
                        </td>
                        <td style={{padding:"8px 12px",fontSize:13,fontWeight:600,color:"#111827"}}>{row.client||"—"}</td>
                        <td style={{padding:"8px 12px",fontSize:13,color:"#374151"}}>{row.event||"—"}</td>
                        <td style={{padding:"8px 12px",fontSize:12,color:"#6b7280",whiteSpace:"nowrap"}}>{row.date||"—"}</td>
                        <td style={{padding:"8px 12px",fontSize:12,fontFamily:"'DM Mono',monospace",color:"#111827"}}>{row.value>0?`£${row.value.toLocaleString()}`:"—"}</td>
                        <td style={{padding:"8px 12px"}}>
                          <span style={{fontSize:11,fontWeight:700,borderRadius:999,padding:"2px 8px",background:row.stage==="Closed Won"?"#dcfce7":row.stage==="Proposal"?"#faf5ff":"#e8f4fd",color:row.stage==="Closed Won"?"#15803d":row.stage==="Proposal"?"#7c3aed":"#1a6fa8"}}>{row.stage}</span>
                        </td>
                        <td style={{padding:"8px 12px",fontSize:12,color:"#6b7280"}}>{row.assignee||"—"}</td>
                        <td style={{padding:"8px 12px",fontSize:11,color:row._duplicate?"#ef4444":"#d1fae5",fontWeight:700}}>{row._duplicate?"DUP":"✓"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Import bar */}
              <div style={{padding:"12px 20px",background:"#f9fafb",borderTop:"1px solid #e5e7eb",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:13,color:"#6b7280"}}>{selected.size} deal{selected.size!==1?"s":""} selected</span>
                <span style={{fontSize:13,color:"#111827",fontWeight:700}}>Total value: {fmtVal(mappedPreview.filter(r=>selected.has(r._idx)).reduce((s,r)=>s+r.value,0))}</span>
                <button className="btn-primary" style={{marginLeft:"auto"}} onClick={doImport} disabled={selected.size===0}>
                  Import {selected.size} deal{selected.size!==1?"s":""} →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Stage & Owner Mapping ── */}
      {section==="mapping"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          {/* Stage mapping */}
          <div style={{background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:12,padding:20}}>
            <div style={{fontWeight:700,fontSize:14,color:"#111827",marginBottom:4}}>Stage Mapping</div>
            <div style={{fontSize:12,color:"#9ca3af",marginBottom:14}}>Map HubSpot deal stage names to your tracker categories. Unrecognised stages default to Cold.</div>
            {uniqueHSStages.length===0&&(
              <div style={{fontSize:12,color:"#9ca3af",fontStyle:"italic",marginBottom:12}}>Upload a CSV first to see HubSpot stages</div>
            )}
            {(uniqueHSStages.length>0?uniqueHSStages:["Closed Won","Proposal Delivered","Contract Sent","Appointment Scheduled","Qualified To Buy"]).map(stage=>(
              <div key={stage} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <span style={{fontSize:12,color:"#374151",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={stage}>{stage}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                <select value={customStageMap[stage]||""} onChange={e=>setCustomStageMap(m=>({...m,[stage]:e.target.value}))}
                  style={{fontSize:12,padding:"4px 8px",border:"1.5px solid #e5e7eb",borderRadius:6,color:"#111827",fontFamily:"inherit",minWidth:130}}>
                  <option value="">Auto-detect</option>
                  <option value="Closed Won">✓ Confirmed</option>
                  <option value="Proposal">~ Warm</option>
                  <option value="New">· Cold</option>
                  <option value="Closed Lost">✗ Closed Lost</option>
                </select>
              </div>
            ))}
            <button className="btn-ghost" style={{marginTop:12,fontSize:12}} onClick={saveStageMap}>Save stage map</button>
          </div>

          {/* Owner mapping */}
          <div style={{background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:12,padding:20}}>
            <div style={{fontWeight:700,fontSize:14,color:"#111827",marginBottom:4}}>Owner Mapping</div>
            <div style={{fontSize:12,color:"#9ca3af",marginBottom:14}}>Map HubSpot owner names to your team members.</div>
            {uniqueHSOwners.length===0&&(
              <div style={{fontSize:12,color:"#9ca3af",fontStyle:"italic",marginBottom:12}}>Upload a CSV first to see HubSpot owners</div>
            )}
            {(uniqueHSOwners.length>0?uniqueHSOwners:["Example Owner"]).map(owner=>(
              <div key={owner} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <span style={{fontSize:12,color:"#374151",flex:1}}>{owner}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                <select value={ownerMap[owner]||""} onChange={e=>setOwnerMap(m=>({...m,[owner]:e.target.value}))}
                  style={{fontSize:12,padding:"4px 8px",border:"1.5px solid #e5e7eb",borderRadius:6,color:"#111827",fontFamily:"inherit",minWidth:130}}>
                  <option value="">Keep as-is</option>
                  {(owners||[]).map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <button className="btn-ghost" style={{marginTop:12,fontSize:12}} onClick={saveOwnerMap}>Save owner map</button>
          </div>
        </div>
      )}

      {/* ── API Connection ── */}
      {section==="connect"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:600}}>
          <div style={{background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:12,padding:20}}>
            <div style={{fontWeight:700,fontSize:14,color:"#111827",marginBottom:4}}>HubSpot Private App Token</div>
            <div style={{fontSize:12,color:"#9ca3af",marginBottom:14}}>Your token is stored locally in your browser only — never sent anywhere except HubSpot.</div>
            <div style={{display:"flex",gap:8}}>
              <input className="form-input" type="password" value={token} onChange={e=>{setToken(e.target.value);setTokenSaved(false);}} placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" style={{flex:1,fontFamily:"'DM Mono',monospace",fontSize:12}}/>
              <button className="btn-primary" onClick={saveToken}>Save</button>
            </div>
            {tokenSaved&&<div style={{fontSize:12,color:"#16a34a",marginTop:8,fontWeight:600}}>✓ Token saved</div>}
          </div>

          <div style={{background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:12,padding:"14px 18px"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#92400e",marginBottom:8}}>⚠ Direct API calls from browser</div>
            <div style={{fontSize:12,color:"#78350f",lineHeight:1.7}}>
              HubSpot's API does not support direct browser requests (CORS restriction). To enable live API sync, a small server-side proxy is needed — for example a Vercel API route or Google Apps Script endpoint. For now, use the <strong>CSV export/import</strong> above which works without any setup.
            </div>
          </div>

          <div style={{background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:12,padding:20}}>
            <div style={{fontWeight:700,fontSize:14,color:"#111827",marginBottom:10}}>How to create a Private App token</div>
            <ol style={{margin:0,paddingLeft:18,fontSize:12,color:"#374151",lineHeight:1.8}}>
              <li>In HubSpot, click your account name → <strong>Account Settings</strong></li>
              <li>Go to <strong>Integrations → Private Apps</strong></li>
              <li>Click <strong>Create a private app</strong></li>
              <li>Give it a name (e.g. "ConnectIn Tracker")</li>
              <li>Under <strong>Scopes</strong>, add: <code style={{background:"#f3f4f6",padding:"1px 5px",borderRadius:4}}>crm.objects.deals.read</code></li>
              <li>Click <strong>Create app</strong> and copy the token</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) return <PasswordScreen onUnlock={()=>setUnlocked(true)} />;
  return <EventTracker />;
}

function EventTracker() {
  const [leads, setLeads]                   = useState(null);
  const [owners, setOwners]                 = useState(null);
  const [activeFY, setActiveFY]             = useState("fy2627");
  const [showForm, setShowForm]             = useState(false);
  const [showOwners, setShowOwners]         = useState(false);
  const [showFiles, setShowFiles]           = useState(null); // lead id
  const [newOwner, setNewOwner]             = useState("");
  const [editId, setEditId]                 = useState(null);
  const [form, setForm]                     = useState(emptyForm);
  const [search, setSearch]                 = useState("");
  const [filterStage, setFilterStage]       = useState("All");
  const [filterAssignee, setFilterAssignee] = useState("All");
  const [sortBy, setSortBy]                 = useState("date");
  const [view, setView]                     = useState("table");
  const [activeTab, setActiveTab]           = useState("events"); // events | lost | holidays
  const [prospects, setProspects]           = useState(null);
  const [saving, setSaving]                 = useState(false);
  const [lastSaved, setLastSaved]           = useState(null);
  const [saveError, setSaveError]           = useState(false);
  const saveTimer = useRef(null);
  const fileInputRef = useRef(null);

  const currentFY = FINANCIAL_YEARS.find(f=>f.id===activeFY);
  const holidaysList = useMemo(()=>(activeFY==="fy2627"?HOLIDAYS_2627:HOLIDAYS_2728).filter(h=>h.dates),[activeFY]);

  // Track whether initial load is complete — prevents save firing before load finishes
  const loadedRef = useRef(false);

  // Load from Google Sheets — Sheet is ALWAYS the source of truth
  useEffect(()=>{
    async function load() {
      try {
        const res = await fetch(SHEET_URL);
        const data = await res.json();
        // Only use Sheet data if it has actual rows — never merge with REAL_DATA
        if (Array.isArray(data.leads) && data.leads.length > 0) {
          // Deduplicate by id just in case Sheet ever got duplicates
          const seen = new Set();
          const deduped = data.leads
            .map(l=>({...l, files:l.files||[], classCode:l.classCode||""}))
            .filter(l=>{ if(seen.has(String(l.id))) return false; seen.add(String(l.id)); return true; });
          // Merge in any new events from REAL_DATA that aren't in the Sheet yet (by id)
          const sheetIds = new Set(deduped.map(l=>String(l.id)));
          const newEntries = REAL_DATA.filter(l=>!sheetIds.has(String(l.id)));
          // Also preserve any localStorage entries not yet saved to Sheets (e.g. from failed saves)
          const cached = localStorage.getItem("connectin_leads");
          const localLeads = cached ? JSON.parse(cached) : [];
          const localOnly = localLeads.filter(l=>!sheetIds.has(String(l.id)));
          const merged = [...deduped, ...newEntries, ...localOnly];
          setLeads(merged);
          // Keep localStorage in sync with the authoritative Sheet data
          localStorage.setItem("connectin_leads", JSON.stringify(merged));
        } else {
          // Sheet is empty — try localStorage first, then fall back to REAL_DATA
          const cached = localStorage.getItem("connectin_leads");
          const fallback = cached ? JSON.parse(cached) : REAL_DATA;
          setLeads(fallback);
        }
        setOwners(Array.isArray(data.owners)&&data.owners.length>0 ? data.owners : DEFAULT_OWNERS);
        // Use Sheet prospects if present, merging any localStorage-only entries not yet saved
        const cachedProspects = JSON.parse(localStorage.getItem("connectin_prospects") || "[]");
        if (Array.isArray(data.prospects) && data.prospects.length > 0) {
          const sheetPIds = new Set(data.prospects.map(p=>String(p.id)));
          const localOnlyProspects = cachedProspects.filter(p=>!sheetPIds.has(String(p.id)));
          setProspects([...data.prospects, ...localOnlyProspects]);
        } else {
          setProspects(cachedProspects);
        }
      } catch {
        // Sheet unreachable — restore from localStorage so user data isn't lost
        const cachedLeads = localStorage.getItem("connectin_leads");
        setLeads(cachedLeads ? JSON.parse(cachedLeads) : REAL_DATA);
        setOwners(JSON.parse(localStorage.getItem("connectin_owners") || "null") || DEFAULT_OWNERS);
        setProspects(JSON.parse(localStorage.getItem("connectin_prospects") || "[]"));
      } finally {
        // Mark load as complete — now saves are allowed
        loadedRef.current = true;
      }
    }
    load();
  },[]);

  // Mirror leads, owners & prospects to localStorage on every change
  useEffect(()=>{
    if(leads!==null) localStorage.setItem("connectin_leads", JSON.stringify(leads));
  },[leads]);
  useEffect(()=>{
    if(owners!==null) localStorage.setItem("connectin_owners", JSON.stringify(owners));
  },[owners]);
  useEffect(()=>{
    if(prospects!==null) localStorage.setItem("connectin_prospects", JSON.stringify(prospects));
  },[prospects]);

  // Save to Google Sheets (debounced) — only fires AFTER initial load is done
  useEffect(()=>{
    if(leads===null||owners===null||prospects===null) return;
    if(!loadedRef.current) return; // Don't save during initial load
    if(saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(async()=>{
      setSaving(true); setSaveError(false);
      try {
        // Strip base64 data from files before saving — only keep Drive URLs (base64 is too large for Sheets cells)
        const leadsToSave = leads.map(l => ({
          ...l,
          files: (l.files||[])
            .filter(f => !f.uploading)
            .map(f => ({ id: f.id, name: f.name, size: f.size, type: f.type || "", driveUrl: f.driveUrl || null })),
        }));
        const saveRes = await fetch(SHEET_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({leads:leadsToSave,owners,prospects})});
        const saveText = await saveRes.text();
        if (saveText.trimStart().startsWith("<")) { setSaveError(true); } // GAS returned an HTML error page
        else { setLastSaved(new Date()); }
      } catch { setSaveError(true); }
      finally { setSaving(false); }
    },1500);
  },[leads,owners,prospects]);

  // Filter leads to current FY
  const fyLeads = useMemo(()=>{
    if(!leads) return [];
    const keys = new Set(currentFY.months);
    return leads.filter(l=>keys.has(monthKey(l.date)||""));
  },[leads,currentFY]);

  const lostLeads = useMemo(()=> fyLeads.filter(l=>l.stage==="Closed Lost"),[fyLeads]);

  const filtered = useMemo(()=>{
    let l = fyLeads.filter(lead=>{
      const q=search.toLowerCase();
      return(
        lead.stage!=="Closed Lost" &&
        (!q||["client","event","venue","ref","name","company","email","classCode"].some(k=>String(lead[k]||"").toLowerCase().includes(q)))&&
        (filterStage==="All"||lead.stage===filterStage)&&
        (filterAssignee==="All"||lead.assignee===filterAssignee)
      );
    });
    if(sortBy==="date")   l=[...l].sort((a,b)=>(a.date||"").localeCompare(b.date||""));
    if(sortBy==="client") l=[...l].sort((a,b)=>(a.client||"").localeCompare(b.client||""));
    if(sortBy==="value")  l=[...l].sort((a,b)=>Number(b.value||0)-Number(a.value||0));
    if(sortBy==="ref")    l=[...l].sort((a,b)=>{ const an=Number(a.ref),bn=Number(b.ref); if(isNaN(an)&&isNaN(bn)) return String(a.ref||"").localeCompare(String(b.ref||"")); if(isNaN(an)) return 1; if(isNaN(bn)) return -1; return an-bn; });
    return l;
  },[fyLeads,search,filterStage,filterAssignee,sortBy]);

  const confirmedVal = fyLeads.filter(l=>l.stage==="Closed Won").reduce((s,l)=>s+Number(l.value||0),0);
  const warmVal      = fyLeads.filter(l=>l.stage==="Proposal").reduce((s,l)=>s+Number(l.value||0),0);
  const coldVal      = fyLeads.filter(l=>l.stage==="New").reduce((s,l)=>s+Number(l.value||0),0);
  const tbcCount     = fyLeads.filter(l=>l.venue?.trim().toUpperCase()==="TBC").length;

  function updateField(id,field,val) { setLeads(l=>l.map(x=>x.id===id?{...x,[field]:val}:x)); }
  function updateStage(id,stage)     { setLeads(l=>l.map(x=>x.id===id?{...x,stage}:x)); }
  function deleteLead(id)            { setLeads(l=>l.filter(x=>x.id!==id)); }
  function openAdd()   { setForm({...emptyForm,date:new Date().toISOString().split("T")[0]}); setEditId(null); setShowForm(true); }
  function openEdit(l) { setForm({...l,files:l.files||[]}); setEditId(l.id); setShowForm(true); }
  function saveForm() {
    if(!form.client?.trim()) return;
    if(editId) { setLeads(l=>l.map(x=>x.id===editId?{...form,id:editId}:x)); }
    else       { setLeads(l=>{ const maxId=l.reduce((mx,x)=>Math.max(mx,Number(x.id)||0),0); return [...l,{...form,id:maxId+1}]; }); }
    setShowForm(false);
  }
  function addOwner() {
    const n=newOwner.trim();
    if(n&&!(owners||[]).includes(n)) setOwners(o=>[...o,n]);
    setNewOwner("");
  }
  function removeOwner(name) { setOwners(o=>o.filter(x=>x!==name)); }
  
  

  // File handling — upload to Google Drive via Apps Script, store URL
  const [fileUploadError, setFileUploadError] = useState(null);
  const [fileUploadDebug, setFileUploadDebug] = useState(null);

  function extractGASError(html) {
    const exc = html.match(/Exception:\s*([^<\n]+)/);
    if (exc) return "Exception: " + exc[1].trim();
    const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (body) return body[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 400);
    return html.substring(0, 400);
  }

  async function handleFileUpload(leadId, e) {
    const files = Array.from(e.target.files);
    e.target.value = "";
    setFileUploadError(null);
    setFileUploadDebug(null);
    for (const file of files) {
      const tempId = Date.now() + Math.random();
      setLeads(l => l.map(x => x.id === leadId
        ? { ...x, files: [...(x.files||[]), { id: tempId, name: file.name, size: file.size, uploading: true }] }
        : x
      ));
      const debug = { file: file.name, sizekb: (file.size/1024).toFixed(1), mimeType: file.type };
      try {
        const base64 = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = ev => res(ev.target.result);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        const bodyStr = JSON.stringify({ action: "uploadFile", fileName: file.name, mimeType: file.type || "application/octet-stream", fileData: base64 });
        debug.payloadKB = (bodyStr.length / 1024).toFixed(1);
        debug.base64Prefix = base64.substring(0, 60);

        console.group(`[ConnectIn] File upload: ${file.name}`);
        console.log("URL:", SHEET_URL);
        console.log("Payload size:", debug.payloadKB, "KB");
        console.log("File type:", file.type, "| File size:", debug.sizekb, "KB");

        const resp = await fetch(SHEET_URL, { method: "POST", body: bodyStr });

        debug.httpStatus = resp.status;
        debug.httpStatusText = resp.statusText;
        debug.finalUrl = resp.url;
        debug.redirected = resp.redirected;
        console.log("HTTP status:", resp.status, resp.statusText);
        console.log("Final URL (after redirects):", resp.url);
        console.log("Was redirected:", resp.redirected);

        const text = await resp.text();
        debug.rawResponse = text.substring(0, 600);
        console.log("Raw response (first 600 chars):", text.substring(0, 600));
        console.groupEnd();

        if (text.trim() === "ok") {
          debug.diagnosis = "Script not updated — returned plain 'ok'";
          throw new Error("Apps Script returned 'ok' — the doPost uploadFile handler is not in the deployed script yet. Re-deploy after adding the handler.");
        }
        if (text.trim().startsWith("<")) {
          const gasMsg = extractGASError(text);
          debug.diagnosis = "HTML error page from GAS: " + gasMsg;
          throw new Error(`Apps Script error page received. Extracted message: ${gasMsg}`);
        }
        let result;
        try { result = JSON.parse(text); }
        catch { throw new Error(`Response is not JSON: ${text.substring(0, 150)}`); }
        debug.parsedResponse = result;
        if (result.error) throw new Error(`Drive error from script: ${result.error}`);
        if (!result.driveUrl) throw new Error(`Script returned JSON but no driveUrl field: ${JSON.stringify(result)}`);

        setLeads(l => l.map(x => x.id === leadId
          ? { ...x, files: (x.files||[]).map(f => f.id === tempId ? { id: tempId, name: file.name, size: file.size, type: file.type, driveUrl: result.driveUrl } : f) }
          : x
        ));
      } catch (err) {
        debug.error = err.message;
        console.error("[ConnectIn] Upload failed:", err.message, "\nDebug info:", debug);
        setLeads(l => l.map(x => x.id === leadId
          ? { ...x, files: (x.files||[]).filter(f => f.id !== tempId) }
          : x
        ));
        setFileUploadError(err.message);
        setFileUploadDebug(debug);
      }
    }
  }
  function removeFile(leadId, fileId) { setLeads(l=>l.map(x=>x.id===leadId?{...x,files:(x.files||[]).filter(f=>f.id!==fileId)}:x)); }
  function openFile(file) {
    if (file.driveUrl) { window.open(file.driveUrl, "_blank"); }
    else if (file.data) { const a=document.createElement("a"); a.href=file.data; a.download=file.name; a.click(); }
  }

  const activeLead = showFiles ? (leads||[]).find(l=>l.id===showFiles) : null;

  return (
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:"#f7f8fa",minHeight:"100vh"}}>
      {leads===null&&(
        <div style={{position:"fixed",inset:0,background:"#f7f8fa",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
          <div style={{textAlign:"center"}}>
            <div style={{width:36,height:36,border:"3px solid #e5e7eb",borderTopColor:"#111827",borderRadius:"50%",animation:"spin .7s linear infinite",margin:"0 auto 12px"}}/>
            <div style={{fontSize:14,color:"#9ca3af"}}>Loading…</div>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box}
        .btn-primary{background:#111827;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-weight:600;font-size:13px;cursor:pointer;transition:background .15s;font-family:inherit;display:flex;align-items:center;gap:6px}
        .btn-primary:hover{background:#374151}
        .btn-ghost{background:transparent;border:1.5px solid #e5e7eb;border-radius:8px;padding:7px 13px;font-size:13px;font-weight:500;cursor:pointer;color:#374151;transition:all .15s;font-family:inherit;display:flex;align-items:center;gap:5px}
        .btn-ghost:hover{background:#f3f4f6;border-color:#d1d5db}
        .btn-danger{background:transparent;border:none;color:#ef4444;cursor:pointer;font-size:12px;padding:4px 7px;border-radius:6px;transition:background .15s;font-family:inherit}
        .btn-danger:hover{background:#fef2f2}
        input,select,textarea{font-family:inherit}
        .row-hover:hover{background:#fafbff}
        .edit-cell:hover{background:#f5f5ff}
        .kanban-card{background:#fff;border-radius:10px;border:1.5px solid #e5e7eb;padding:12px 14px;margin-bottom:8px;cursor:pointer;transition:box-shadow .15s,border-color .15s}
        .kanban-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.07);border-color:#c7d2da}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px}
        .modal{background:#fff;border-radius:16px;padding:28px;width:560px;max-width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2)}
        .form-label{font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;display:block}
        .form-input{width:100%;padding:9px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;color:#111827;outline:none;transition:border-color .15s;background:#fff}
        .form-input:focus{border-color:#6366f1}
        select.form-input{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px}
        .stat-card{background:#fff;border-radius:12px;border:1.5px solid #e5e7eb;padding:18px 22px}
        .section-divider{font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;padding:14px 0 8px;border-bottom:1px solid #f3f4f6;margin-bottom:14px}
        .th{padding:11px 12px;text-align:left;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}
        .th-lead{color:#a78bfa}
        .fy-tab{padding:7px 16px;border-radius:8px;border:1.5px solid #e5e7eb;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit;background:#fff;color:#6b7280}
        .fy-tab-active{background:#111827;color:#fff;border-color:#111827}
        .file-drop{border:2px dashed #e5e7eb;border-radius:10px;padding:20px;text-align:center;cursor:pointer;transition:all .15s}
        .file-drop:hover{border-color:#6366f1;background:#fafafe}

        /* ── Layout ─────────────────────────────────────── */
        .app-header-inner{max-width:1500px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:58px;gap:12px}
        .app-header-right{display:flex;gap:8px;align-items:center;flex-shrink:0}
        .app-main{max-width:1500px;margin:0 auto;padding:22px 24px}
        .app-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:nowrap;scrollbar-width:none}
        .app-tabs::-webkit-scrollbar{display:none}
        .kanban-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}

        /* ── Mobile ─────────────────────────────────────── */
        @media(max-width:768px){
          .app-header-inner{height:auto;padding:10px 14px;flex-wrap:wrap;gap:8px}
          .app-header-right{gap:6px}
          .app-main{padding:14px 12px}
          .save-badge{display:none}
          .btn-label{display:none}
          .fy-tab{padding:6px 10px;font-size:12px}
          .btn-ghost,.btn-primary{padding:8px 10px}
          .kanban-grid{grid-template-columns:repeat(3,minmax(220px,1fr));overflow-x:auto;-webkit-overflow-scrolling:touch}
          .modal{padding:20px 16px !important}
          .stat-card{padding:14px 16px}
        }
        @media(max-width:480px){
          .app-header-inner{padding:10px 12px}
          .app-main{padding:12px 10px}
          .kanban-grid{grid-template-columns:repeat(6,minmax(200px,1fr));overflow-x:auto}
          .app-tabs button{font-size:12px;padding:8px 10px}
        }
      `}</style>

      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1.5px solid #e5e7eb",position:"sticky",top:0,zIndex:50}}>
        <div className="app-header-inner">
          <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
            <div style={{width:30,height:30,background:"#111827",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </div>
            <span style={{fontWeight:700,fontSize:16,color:"#111827",letterSpacing:"-.02em",whiteSpace:"nowrap"}}>Event & Lead Tracker</span>
            {saving&&<span style={{fontSize:11,color:"#f59e0b",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:999,padding:"2px 8px",fontWeight:600,whiteSpace:"nowrap"}}>⏳ Saving…</span>}
            {!saving&&saveError&&<span style={{fontSize:11,color:"#ef4444",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:999,padding:"2px 8px",fontWeight:600,whiteSpace:"nowrap"}}>⚠️ Save failed</span>}
            {!saving&&!saveError&&lastSaved&&<span className="save-badge" style={{fontSize:11,color:"#22c55e",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:999,padding:"2px 8px",fontWeight:600,whiteSpace:"nowrap"}}>✓ Saved</span>}
          </div>
          <div className="app-header-right">
            <div style={{display:"flex",gap:6}}>
              {FINANCIAL_YEARS.map(fy=>(
                <button key={fy.id} className={`fy-tab${activeFY===fy.id?" fy-tab-active":""}`} onClick={()=>setActiveFY(fy.id)}>{fy.label}</button>
              ))}
            </div>
            <button className="btn-ghost" onClick={()=>setShowOwners(true)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span className="btn-label">Owners</span>
            </button>
            <button className="btn-primary" onClick={openAdd}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              <span className="btn-label">Add Entry</span>
            </button>
          </div>
        </div>
      </div>

      <div className="app-main">
        {/* Main tab navigation */}
        <div className="app-tabs" style={{display:"flex",gap:6,marginBottom:20,borderBottom:"2px solid #e5e7eb",paddingBottom:0}}>
          {[
            {id:"events",    label:"📅 Events & Pipeline", count:fyLeads.filter(l=>l.stage!=="Closed Lost").length},
            {id:"lost",      label:"❌ Closed Lost",        count:lostLeads.length},
            {id:"holidays",  label:"🏖️ Holidays",          count:null},
            {id:"prospects", label:"🔭 Prospects",          count:(prospects||[]).length||null},
            {id:"hubspot",   label:"🟠 HubSpot",             count:null},
          ].map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              style={{padding:"10px 18px",background:"none",border:"none",borderBottom:`3px solid ${activeTab===tab.id?"#111827":"transparent"}`,fontWeight:activeTab===tab.id?700:500,fontSize:14,color:activeTab===tab.id?"#111827":"#6b7280",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,marginBottom:-2,transition:"all .15s"}}>
              {tab.label}
              {tab.count!==null&&<span style={{background:activeTab===tab.id?"#111827":"#f3f4f6",color:activeTab===tab.id?"#fff":"#6b7280",borderRadius:999,fontSize:11,fontWeight:700,padding:"1px 7px"}}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {activeTab==="holidays"&&<HolidaysTab fy={activeFY}/>}
        {activeTab==="prospects"&&<ProspectsTab prospects={prospects} setProspects={setProspects} owners={owners} leads={leads} setLeads={setLeads} setActiveTab={setActiveTab}/>}
        {activeTab==="hubspot"&&<HubSpotTab leads={leads} setLeads={setLeads} owners={owners}/>}

        {activeTab==="lost"&&(
          <div style={{background:"#fff",borderRadius:12,border:"1.5px solid #fecaca",overflow:"hidden"}}>
            <div style={{padding:"14px 20px",background:"#fef2f2",borderBottom:"1px solid #fecaca",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:14,fontWeight:700,color:"#dc2626"}}>❌ Closed Lost Events</span>
              <span style={{fontSize:12,color:"#9ca3af"}}>{lostLeads.length} event{lostLeads.length!==1?"s":""}</span>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}>
                <thead>
                  <tr style={{borderBottom:"1.5px solid #fee2e2",background:"#fff5f5"}}>
                    {["Ref","Class","Client","Event","Date","Venue","Owner","Value","Notes","Recontact Date"].map(h=>(
                      <th key={h} className="th" style={{color: h==="Recontact Date"?"#b45309":"#ef4444"}}>{h}</th>
                    ))}
                    <th className="th"></th>
                  </tr>
                </thead>
                <tbody>
                  {lostLeads.length===0&&<tr><td colSpan={10} style={{padding:40,textAlign:"center",color:"#9ca3af",fontSize:14}}>No lost events yet.</td></tr>}
                  {lostLeads.map(lead=>(
                    <tr key={lead.id} className="row-hover" style={{borderBottom:"1px solid #fee2e2",opacity:.8}}>
                      <EditCell value={lead.ref} onSave={v=>updateField(lead.id,"ref",v)} placeholder="ref"/>
                      <td style={{padding:"10px 12px",fontSize:12,color:"#9ca3af",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.classCode||autoClass(lead)}</td>
                      <td style={{padding:"10px 12px",fontWeight:600,fontSize:13,color:"#6b7280"}}>{lead.client}</td>
                      <td style={{padding:"10px 12px",fontSize:13,color:"#6b7280"}}>{lead.event}</td>
                      <td style={{padding:"10px 12px",fontSize:13,color:"#6b7280"}}>{fmt(lead.date)}</td>
                      <td style={{padding:"10px 12px",fontSize:13,color:"#6b7280"}}>{lead.venue}</td>
                      <td style={{padding:"10px 12px",fontSize:13,color:"#6b7280"}}>{lead.assignee}</td>
                      <td style={{padding:"10px 12px",fontSize:13,color:"#6b7280",fontFamily:"'DM Mono',monospace"}}>{lead.value?`£${Number(lead.value).toLocaleString()}`:"—"}</td>
                      <td style={{padding:"10px 12px",fontSize:12,color:"#9ca3af",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.notes||"—"}</td>
                      <td style={{padding:"8px 10px",minWidth:148}}>
                        <input type="date" value={lead.recontactDate||""} onChange={e=>updateField(lead.id,"recontactDate",e.target.value)}
                          style={{fontSize:12,padding:"4px 8px",border:`1.5px solid ${lead.recontactDate?"#fbbf24":"#e5e7eb"}`,borderRadius:6,color:lead.recontactDate?"#92400e":"#9ca3af",fontFamily:"inherit",background:lead.recontactDate?"#fffbeb":"#fff",cursor:"pointer",width:"100%"}}
                          title="Set a date to be reminded to recontact this client"/>
                        {lead.recontactDate&&<div style={{fontSize:9,color:"#b45309",marginTop:2,fontWeight:600}}>📞 On calendar</div>}
                      </td>
                      <td style={{padding:"10px 12px"}}>
                        <button onClick={()=>updateStage(lead.id,"Qualified")} style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:6,padding:"3px 8px",fontSize:11,color:"#15803d",cursor:"pointer",fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap"}}>↩ Restore</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab==="events"&&<MonthlyTracker leads={fyLeads.filter(l=>l.stage!=="Closed Lost")} fyMonths={currentFY.months} />}

        {activeTab==="events"&&<>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:14,marginBottom:22}}>
          {[
            {label:"Total Events",  value:fyLeads.length,                                                icon:"🗓️",color:"#111827",bg:"#fff"},
            {label:"Confirmed",     value:confirmedVal?`£${confirmedVal.toLocaleString()}`:"—",          icon:"✅",color:"#15803d",bg:"#f0fdf4"},
            {label:"Warm Pipeline", value:warmVal?`£${warmVal.toLocaleString()}`:"—",                    icon:"🔥",color:"#7c3aed",bg:"#faf5ff"},
            {label:"Cold Pipeline", value:coldVal?`£${coldVal.toLocaleString()}`:"—",                    icon:"❄️",color:"#0e7490",bg:"#ecfeff"},
            {label:"In Progress",   value:fyLeads.filter(l=>!["Closed Won","Closed Lost"].includes(l.stage)).length,icon:"🔄",color:"#111827",bg:"#fff"},
            {label:"Venue TBC",     value:tbcCount,                                                      icon:"📍",color:"#b45309",bg:"#fff3e0"},
          ].map(s=>(
            <div key={s.label} className="stat-card" style={{background:s.bg}}>
              <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:20,fontWeight:700,color:s.color,letterSpacing:"-.02em",fontFamily:s.value?.toString().startsWith("£")?"'DM Mono',monospace":"inherit"}}>{s.value}</div>
              <div style={{fontSize:11,color:s.color,fontWeight:500,marginTop:1,opacity:.7}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{flex:1,minWidth:180,position:"relative"}}>
            <svg style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="form-input" style={{paddingLeft:30,fontSize:13}} placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="form-input" style={{width:"auto",fontSize:13}} value={filterStage} onChange={e=>setFilterStage(e.target.value)}>
            <option value="All">All Stages</option>
            {STAGES.map(s=><option key={s}>{s}</option>)}
          </select>
          <select className="form-input" style={{width:"auto",fontSize:13}} value={filterAssignee} onChange={e=>setFilterAssignee(e.target.value)}>
            <option value="All">All Owners</option>
            {(owners||[]).map(a=><option key={a}>{a}</option>)}
          </select>
          <select className="form-input" style={{width:"auto",fontSize:13}} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="date">Sort: Date</option>
            <option value="client">Sort: Client</option>
            <option value="value">Sort: Value</option>
            <option value="ref">Sort: Ref</option>
          </select>
          <div style={{display:"flex",gap:3,background:"#f3f4f6",borderRadius:8,padding:3}}>
            {[{id:"table",label:"Table"},{id:"kanban",label:"Kanban"},{id:"calendar",label:"📅 Cal"}].map(v=>(
              <button key={v.id} onClick={()=>setView(v.id)} style={{padding:"5px 12px",borderRadius:6,border:"none",background:view===v.id?"#fff":"transparent",fontWeight:600,fontSize:12,color:view===v.id?"#111827":"#9ca3af",cursor:"pointer",boxShadow:view===v.id?"0 1px 4px rgba(0,0,0,.08)":"none",fontFamily:"inherit",transition:"all .15s"}}>{v.label}</button>
            ))}
          </div>
          <span style={{fontSize:12,color:"#9ca3af",whiteSpace:"nowrap"}}>{filtered.length} result{filtered.length!==1?"s":""}</span>
        </div>

        {/* Holiday clash summary */}
        {(()=>{
          const allClashes=fyLeads.filter(l=>l.stage!=="Closed Lost").flatMap(l=>{
            const c=getHolidayClashes(l,holidaysList);
            return c.map(clash=>({lead:l,clash}));
          });
          if(allClashes.length===0) return null;
          return (
            <div style={{background:"#fff7ed",border:"1.5px solid #fed7aa",borderRadius:10,padding:"14px 18px",marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:13,color:"#c2410c",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                ⚠️ Holiday Conflicts ({allClashes.length})
                <span style={{fontSize:11,fontWeight:400,color:"#92400e"}}>— team member on holiday on event date</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {allClashes.map((item,i)=>{
                  const mc=item.lead.date?getMonthColor(monthKey(item.lead.date)):null;
                  return (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:"#fff",borderRadius:7,padding:"8px 12px",border:"1px solid #fed7aa"}}>
                      {mc&&<span style={{width:8,height:8,borderRadius:"50%",background:mc.bar,display:"inline-block",flexShrink:0}}/>}
                      <span style={{fontSize:12,fontWeight:700,color:"#111827"}}>{item.lead.client}</span>
                      <span style={{fontSize:12,color:"#6b7280"}}>{item.lead.event}</span>
                      <span style={{fontSize:11,color:"#9ca3af"}}>{fmt(item.lead.date)}</span>
                      <span style={{marginLeft:"auto",fontSize:11,background:"#fed7aa",color:"#92400e",borderRadius:999,padding:"2px 8px",fontWeight:600}}>
                        {item.clash.person} · {item.clash.dates}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
        <div style={{fontSize:12,color:"#9ca3af",marginBottom:10,display:"flex",alignItems:"center",gap:5}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Click any cell to edit inline · 📎 to manage files for each entry
        </div>

        {/* Table */}
        {view==="table"&&(
          <div style={{background:"#fff",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:1200}}>
                <thead>
                  <tr style={{borderBottom:"1.5px solid #f3f4f6",background:"#fafafa"}}>
                    <th className="th">Ref</th>
                    <th className="th" style={{background:"#fefce8",color:"#a16207"}}>Class</th>
                    <th className="th">Client</th>
                    <th className="th">Event</th>
                    <th className="th">Date</th>
                    <th className="th">Venue</th>
                    <th className="th">Owner</th>
                    <th className="th th-lead" style={{borderLeft:"2px solid #ede9fe"}}>Contact</th>
                    <th className="th th-lead">Company</th>
                    <th className="th th-lead">Email</th>
                    <th className="th th-lead">Value (£)</th>
                    <th className="th" style={{borderLeft:"2px solid #f3f4f6"}}>Stage</th>
                    <th className="th" style={{color:"#f59e0b"}}>⚠️ Clashes</th>
                    <th className="th">Files</th>
                    <th className="th"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length===0&&<tr><td colSpan={13} style={{padding:40,textAlign:"center",color:"#9ca3af",fontSize:14}}>No results found.</td></tr>}
                  {filtered.map(lead=>{
                    const sc=STAGE_COLORS[lead.stage]||STAGE_COLORS["New"];
                    const isTBC=lead.venue?.trim().toUpperCase()==="TBC";
                    const mc=lead.date?getMonthColor(monthKey(lead.date)):null;
                    const fileCount=(lead.files||[]).length;
                    return (
                      <tr key={lead.id} className="row-hover" style={{borderBottom:"1px solid #f3f4f6"}}>
                        <EditCell value={lead.ref}    onSave={v=>updateField(lead.id,"ref",v)}    placeholder="ref"/>
                        <EditCell value={lead.classCode||autoClass(lead)} onSave={v=>updateField(lead.id,"classCode",v)} placeholder="auto"/>
                        <td style={{padding:"10px 12px",fontWeight:600,fontSize:13,color:"#111827"}}>
                          {/* Colour dot for month */}
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            {mc&&<span style={{width:8,height:8,borderRadius:"50%",background:mc.bar,display:"inline-block",flexShrink:0}}/>}
                            <EditCell value={lead.client} onSave={v=>updateField(lead.id,"client",v)} placeholder="client"/>
                          </div>
                        </td>
                        <EditCell value={lead.event}  onSave={v=>updateField(lead.id,"event",v)}  placeholder="event"/>
                        <EditCell value={lead.date}   onSave={v=>updateField(lead.id,"date",v)}   type="date" placeholder="date"/>
                        <td style={{padding:"10px 12px",fontSize:13}}>
                          <span style={{color:isTBC?"#f59e0b":"#374151",fontWeight:isTBC?700:400}}>
                            <EditCell value={lead.venue} onSave={v=>updateField(lead.id,"venue",v)} placeholder="venue"/>
                          </span>
                        </td>
                        <td style={{padding:"10px 12px"}}>
                          <select value={lead.assignee||""} onChange={e=>updateField(lead.id,"assignee",e.target.value)}
                            style={{appearance:"none",background:"#f3f4f6",color:"#374151",border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",outline:"none"}}>
                            <option value="">—</option>
                            {(owners||[]).map(o=><option key={o}>{o}</option>)}
                          </select>
                        </td>
                        <td style={{borderLeft:"2px solid #f5f3ff",padding:0}}>
                          <EditCell value={lead.name}    onSave={v=>updateField(lead.id,"name",v)}    placeholder="add contact"/>
                        </td>
                        <EditCell value={lead.company}   onSave={v=>updateField(lead.id,"company",v)} placeholder="add company"/>
                        <EditCell value={lead.email}     onSave={v=>updateField(lead.id,"email",v)}   type="email" placeholder="add email"/>
                        <EditCell value={lead.value}     onSave={v=>updateField(lead.id,"value",v)}   type="number" placeholder="add value" mono={true}/>
                        <td style={{padding:"10px 12px",borderLeft:"2px solid #f9fafb"}}>
                          <select value={lead.stage} onChange={e=>updateStage(lead.id,e.target.value)}
                            style={{background:sc.bg,color:sc.text,border:"none",borderRadius:999,padding:"3px 10px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",outline:"none"}}>
                            {STAGES.map(s=><option key={s}>{s}</option>)}
                          </select>
                        </td>
                        {/* Holiday clashes */}
                        {(()=>{
                          const clashes=getHolidayClashes(lead,holidaysList);
                          return (
                            <td style={{padding:"10px 12px"}}>
                              {clashes.length>0&&(
                                <div title={clashes.map(c=>`${c.person}: ${c.dates}`).join("\n")}
                                  style={{display:"inline-flex",alignItems:"center",gap:4,background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:6,padding:"3px 8px",cursor:"default"}}>
                                  <span style={{fontSize:13}}>⚠️</span>
                                  <span style={{fontSize:11,fontWeight:700,color:"#c2410c"}}>{clashes.map(c=>c.person).join(", ")} on hols</span>
                                </div>
                              )}
                            </td>
                          );
                        })()}
                        {/* Files */}
                        <td style={{padding:"10px 12px"}}>
                          <button onClick={()=>setShowFiles(lead.id)}
                            style={{background:fileCount>0?"#eff6ff":"#f9fafb",border:`1px solid ${fileCount>0?"#93c5fd":"#e5e7eb"}`,borderRadius:7,padding:"4px 10px",fontSize:12,cursor:"pointer",color:fileCount>0?"#1d4ed8":"#9ca3af",fontWeight:600,fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
                            📎 {fileCount>0?fileCount:""}
                          </button>
                        </td>
                        <td style={{padding:"10px 12px"}}>
                          <button className="btn-danger" onClick={()=>deleteLead(lead.id)}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Kanban */}
        {view==="kanban"&&(
          <div className="kanban-grid">
            {STAGES.map(stage=>{
              const sc=STAGE_COLORS[stage];
              const stageLeads=filtered.filter(l=>l.stage===stage);
              return (
                <div key={stage}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:sc.dot}}/>
                    <span style={{fontSize:11,fontWeight:700,color:"#374151"}}>{stage}</span>
                    <span style={{marginLeft:"auto",fontSize:11,fontWeight:600,color:"#9ca3af",background:"#f3f4f6",borderRadius:999,padding:"1px 6px"}}>{stageLeads.length}</span>
                  </div>
                  {stageLeads.map(lead=>{
                    const mc=lead.date?getMonthColor(monthKey(lead.date)):null;
                    const fileCount=(lead.files||[]).length;
                    return (
                      <div key={lead.id} className="kanban-card" onClick={()=>openEdit(lead)}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                          <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:"#9ca3af"}}>#{lead.ref}</div>
                          {mc&&<span style={{width:8,height:8,borderRadius:"50%",background:mc.bar,display:"inline-block"}}/>}
                        </div>
                        <div style={{fontWeight:600,fontSize:12,color:"#111827",marginBottom:1}}>{lead.client}</div>
                        <div style={{fontSize:11,color:"#6b7280",marginBottom:6}}>{lead.event}</div>
                        {lead.name&&<div style={{fontSize:11,color:"#374151",marginBottom:2}}>👤 {lead.name}</div>}
                        {lead.value&&<div style={{fontSize:12,fontWeight:700,color:STAGE_COLORS[lead.stage]?.text||"#111827",fontFamily:"'DM Mono',monospace",marginBottom:4}}>£{Number(lead.value).toLocaleString()}</div>}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span style={{fontSize:11,color:"#9ca3af"}}>{fmt(lead.date)}</span>
                          <div style={{display:"flex",alignItems:"center",gap:4}}>
                            {fileCount>0&&<span style={{fontSize:10,color:"#1d4ed8"}}>📎{fileCount}</span>}
                            <span style={{fontSize:10,background:"#f3f4f6",color:"#6b7280",borderRadius:999,padding:"1px 6px"}}>{lead.assignee}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {stageLeads.length===0&&<div style={{fontSize:12,color:"#e5e7eb",textAlign:"center",padding:"12px 0"}}>—</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* Calendar */}
        {view==="calendar"&&<CalendarView leads={filtered} onEventClick={openEdit} holidays={holidaysList} recontacts={(leads||[]).filter(l=>l.recontactDate)} />}

      </>
      }
      </div>
      {/* Files Modal */}
      {showFiles&&activeLead&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget){setShowFiles(null);setFileUploadError(null);setFileUploadDebug(null);}}}>
          <div className="modal" style={{width:500}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <h2 style={{margin:0,fontSize:17,fontWeight:700,color:"#111827"}}>📎 Files</h2>
                <div style={{fontSize:13,color:"#6b7280",marginTop:2}}>{activeLead.client} — {activeLead.event}</div>
              </div>
              <button onClick={()=>{ setShowFiles(null); setFileUploadError(null); setFileUploadDebug(null); }} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#9ca3af",lineHeight:1}}>×</button>
            </div>

            {/* Upload error banner */}
            {fileUploadError && (
              <div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"12px 14px",marginBottom:14}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
                  <span style={{fontSize:16,flexShrink:0}}>⚠️</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#b91c1c",marginBottom:3}}>Upload failed</div>
                    <div style={{fontSize:12,color:"#991b1b",lineHeight:1.6}}>{fileUploadError}</div>
                  </div>
                  <button onClick={()=>{setFileUploadError(null);setFileUploadDebug(null);}} style={{background:"none",border:"none",color:"#fca5a5",fontSize:18,cursor:"pointer",lineHeight:1,flexShrink:0}}>×</button>
                </div>
                {fileUploadDebug && (
                  <details style={{marginTop:4}}>
                    <summary style={{fontSize:11,color:"#b91c1c",cursor:"pointer",fontWeight:700}}>Debug info (open &amp; share with developer)</summary>
                    <pre style={{fontSize:10,background:"#111827",color:"#fca5a5",borderRadius:6,padding:"8px 10px",overflowX:"auto",marginTop:6,whiteSpace:"pre-wrap",wordBreak:"break-all"}}>
                      {JSON.stringify(fileUploadDebug, null, 2)}
                    </pre>
                    <button onClick={()=>navigator.clipboard?.writeText(JSON.stringify(fileUploadDebug,null,2))}
                      style={{fontSize:11,background:"#fecaca",border:"none",borderRadius:5,padding:"4px 10px",color:"#7f1d1d",cursor:"pointer",fontWeight:600,fontFamily:"inherit",marginTop:4}}>
                      Copy debug info
                    </button>
                  </details>
                )}
              </div>
            )}

            {/* Upload area */}
            <input ref={fileInputRef} type="file" multiple style={{display:"none"}} onChange={e=>handleFileUpload(activeLead.id,e)}/>
            <div className="file-drop" onClick={()=>fileInputRef.current?.click()} style={{marginBottom:16}}>
              <div style={{fontSize:28,marginBottom:8}}>☁️</div>
              <div style={{fontSize:14,fontWeight:600,color:"#374151"}}>Click to upload to Google Drive</div>
              <div style={{fontSize:12,color:"#9ca3af",marginTop:4}}>Files are stored in Drive and accessible to the whole team on any device</div>
            </div>

            {/* File list */}
            {(activeLead.files||[]).length===0?(
              <div style={{textAlign:"center",color:"#9ca3af",fontSize:13,padding:"20px 0"}}>No files attached yet</div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {(activeLead.files||[]).map(file=>(
                  <div key={file.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:file.uploading?"#fefce8":"#f9fafb",borderRadius:8,border:`1px solid ${file.uploading?"#fde68a":"#e5e7eb"}`}}>
                    <span style={{fontSize:20}}>{file.uploading ? "⏳" : fileIcon(file.name)}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{file.name}</div>
                      <div style={{fontSize:11,color:file.uploading?"#b45309":"#9ca3af"}}>{file.uploading ? "Uploading to Drive…" : `${(file.size/1024).toFixed(1)} KB · Saved in Google Drive`}</div>
                    </div>
                    {!file.uploading && file.driveUrl && (
                      <button onClick={()=>openFile(file)} style={{background:"#eff6ff",border:"none",borderRadius:6,padding:"5px 10px",fontSize:12,color:"#1d4ed8",cursor:"pointer",fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap"}}>Open in Drive</button>
                    )}
                    {!file.uploading && !file.driveUrl && file.data && (
                      <button onClick={()=>openFile(file)} style={{background:"#f3f4f6",border:"none",borderRadius:6,padding:"5px 10px",fontSize:12,color:"#374151",cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>Download</button>
                    )}
                    {!file.uploading && (
                      <button className="btn-danger" onClick={()=>removeFile(activeLead.id,file.id)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Apps Script setup notice */}
            <details style={{marginTop:16,borderTop:"1px solid #f3f4f6",paddingTop:14}}>
              <summary style={{fontSize:12,color:"#9ca3af",cursor:"pointer",fontWeight:600,userSelect:"none"}}>⚙️ Setup required — click to see Apps Script instructions</summary>
              <div style={{marginTop:10,background:"#f9fafb",borderRadius:8,padding:"12px 14px",fontSize:12,color:"#374151",lineHeight:1.7}}>
                <div style={{fontWeight:700,marginBottom:6,color:"#111827"}}>Add this to your Google Apps Script to enable Drive uploads:</div>
                <div style={{marginBottom:8,color:"#6b7280"}}>Go to <strong>script.google.com</strong> → open your Apps Script → paste the following functions, then re-deploy as a web app.</div>
                <pre style={{background:"#111827",color:"#e5e7eb",borderRadius:6,padding:"10px 12px",fontSize:11,overflow:"auto",whiteSpace:"pre",margin:0}}>{`function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  if (data.action === 'uploadFile') {
    var folderName = 'ConnectIn Tracker Files';
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext()
      ? folders.next()
      : DriveApp.createFolder(folderName);
    var base64 = data.fileData.replace(/^data:[^;]+;base64,/, '');
    var bytes = Utilities.base64Decode(base64);
    var blob = Utilities.newBlob(
      bytes, data.mimeType || 'application/octet-stream', data.fileName);
    var file = folder.createFile(blob);
    file.setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.VIEW);
    var url = 'https://drive.google.com/file/d/'
      + file.getId() + '/view?usp=sharing';
    return ContentService
      .createTextOutput(JSON.stringify({ driveUrl: url }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  // existing save logic below...
  var sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Data')
    || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.getRange('A1').setValue(e.postData.contents);
  return ContentService.createTextOutput('ok');
}`}</pre>
              </div>
            </details>

            <div style={{marginTop:20,textAlign:"right"}}>
              <button className="btn-ghost" onClick={()=>{ setShowFiles(null); setFileUploadError(null); setFileUploadDebug(null); }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <h2 style={{margin:0,fontSize:17,fontWeight:700,color:"#111827"}}>{editId?"Edit Entry":"New Entry"}</h2>
              <button onClick={()=>setShowForm(false)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#9ca3af",lineHeight:1}}>×</button>
            </div>
            <div className="section-divider">📅 Event Details</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:6}}>
              {[["client","Client","text","e.g. ANS"],["ref","Ref #","text","e.g. 124"]].map(([f,l,t,p])=>(
                <div key={f}><label className="form-label">{l}</label>
                  <input className="form-input" type={t} value={form[f]||""} onChange={e=>setForm(f2=>({...f2,[f]:e.target.value}))} placeholder={p}/></div>
              ))}
              <div style={{gridColumn:"1/-1"}}><label className="form-label">Event Name</label>
                <input className="form-input" value={form.event||""} onChange={e=>setForm(f=>({...f,event:e.target.value}))} placeholder="e.g. Summer Party 26"/></div>
              <div><label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date||""} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
              <div><label className="form-label">Venue</label>
                <input className="form-input" value={form.venue||""} onChange={e=>setForm(f=>({...f,venue:e.target.value}))} placeholder="e.g. Lowry Hotel"/></div>
              <div><label className="form-label">Owner</label>
                <select className="form-input" value={form.assignee||""} onChange={e=>setForm(f=>({...f,assignee:e.target.value}))}>
                  <option value="">— Select —</option>
                  {(owners||[]).map(o=><option key={o}>{o}</option>)}
                </select></div>
              <div><label className="form-label">Stage</label>
                <select className="form-input" value={form.stage} onChange={e=>setForm(f=>({...f,stage:e.target.value}))}>
                  {STAGES.map(s=><option key={s}>{s}</option>)}
                </select></div>
            </div>
            <div className="section-divider">🎯 Lead Gen Details</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:6}}>
              <div><label className="form-label">Contact Name</label>
                <input className="form-input" value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Sarah Chen"/></div>
              <div><label className="form-label">Company</label>
                <input className="form-input" value={form.company||""} onChange={e=>setForm(f=>({...f,company:e.target.value}))} placeholder="e.g. TechNova"/></div>
              <div style={{gridColumn:"1/-1"}}><label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="e.g. sarah@technova.com"/></div>
              <div>
                <label className="form-label">Deal Value (£)</label>
                <input className="form-input" type="number" value={form.value||""} onChange={e=>setForm(f=>({...f,value:e.target.value}))} placeholder="e.g. 5000"/>
                <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>
                  {form.stage==="Closed Won"?"✅ Confirmed":form.stage==="Proposal"?"🔥 Warm Pipeline":form.stage==="New"?"❄️ Cold Pipeline":"ℹ️ Not tracked (use New, Proposal or Closed Won)"}
                </div>
              </div>
              <div><label className="form-label">Notes</label>
                <input className="form-input" value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. Follow up next week"/></div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:18,justifyContent:"flex-end"}}>
              {editId&&<button className="btn-danger" onClick={()=>{deleteLead(editId);setShowForm(false);}} style={{marginRight:"auto"}}>Delete</button>}
              <button className="btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveForm}>{editId?"Save Changes":"Add Entry"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Owners Modal */}
      {showOwners&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowOwners(false)}>
          <div className="modal" style={{width:420}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <h2 style={{margin:0,fontSize:17,fontWeight:700,color:"#111827"}}>Manage Owners</h2>
              <button onClick={()=>setShowOwners(false)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#9ca3af",lineHeight:1}}>×</button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              <input className="form-input" value={newOwner} onChange={e=>setNewOwner(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addOwner()} placeholder="New owner name…" style={{flex:1}}/>
              <button className="btn-primary" onClick={addOwner}>Add</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {(owners||[]).map(name=>(
                <div key={name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"#f9fafb",borderRadius:8,border:"1px solid #e5e7eb"}}>
                  <span style={{fontSize:14,fontWeight:500,color:"#111827"}}>{name}</span>
                  <button className="btn-danger" onClick={()=>removeOwner(name)}>Remove</button>
                </div>
              ))}
            </div>
            <div style={{marginTop:20,textAlign:"right"}}>
              <button className="btn-ghost" onClick={()=>setShowOwners(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

