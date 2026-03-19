// ─────────────────────────────────────────────────────────────────────────────
// ConnectIn Apps Script Template
// ─────────────────────────────────────────────────────────────────────────────
// Copy this file into a new Google Apps Script project as a starting point.
//
// Key patterns included:
//   1. doGet  — batch read with Date → YYYY-MM-DD conversion
//   2. doPost — batch setValues() write (avoids per-row appendRow timeouts)
//   3. doPost — backup action (snapshot to a Backups sheet)
//   4. doPost — file upload to Google Drive
//
// Deployment:
//   Deploy > New deployment > Web app
//   Execute as: Me | Who has access: Anyone
//   After any code change: Deploy > Manage deployments > Edit > New version
// ─────────────────────────────────────────────────────────────────────────────

// ── CONFIGURATION ────────────────────────────────────────────────────────────

// The ordered list of columns written to and read from the main sheet.
// Add or remove fields here — order determines column order in the sheet.
const HEADERS = [
  "id", "client", "event", "ref", "date", "endDate",
  "venue", "assignee", "stage", "name", "company",
  "email", "value", "notes", "classCode", "files"
];

const SHEET_NAME   = "Events";   // Main data sheet
const OWNERS_SHEET = "Owners";   // Single-column list of owner names
const BACKUP_SHEET = "Backups";  // Timestamped JSON snapshots
const DRIVE_FOLDER = "ConnectIn Tracker Files"; // Google Drive folder for uploads
const MAX_BACKUPS  = 60;         // How many backup rows to keep


// ── doGet — Read all data ─────────────────────────────────────────────────────
// Returns: { leads: [...], owners: [...] }
//
// IMPORTANT: Google Sheets silently converts date-like strings (e.g. "2026-09-17")
// into Date serial numbers on write. getValues() returns them as JavaScript Date
// objects. Without the conversion below they JSON-stringify to UTC ISO timestamps
// ("2026-09-16T23:00:00.000Z") which breaks date inputs and shows the wrong day
// for users in BST (UTC+1) or any non-UTC timezone. Always convert back to
// YYYY-MM-DD using the script's local timezone (getFullYear/getMonth/getDate).

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Read leads
  const leadsSheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  const leadsData  = leadsSheet.getDataRange().getValues();
  let leads = [];
  if (leadsData.length > 1) {
    const headers = leadsData[0];
    leads = leadsData.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        const val = row[i];
        // Convert Sheets Date objects → YYYY-MM-DD string (local timezone)
        if (val instanceof Date) {
          const y = val.getFullYear();
          const m = String(val.getMonth() + 1).padStart(2, '0');
          const d = String(val.getDate()).padStart(2, '0');
          obj[h] = `${y}-${m}-${d}`;
        } else {
          obj[h] = val;
        }
      });
      return obj;
    });
  }

  // Read owners
  const ownersSheet = ss.getSheetByName(OWNERS_SHEET) || ss.insertSheet(OWNERS_SHEET);
  const ownersData  = ownersSheet.getDataRange().getValues();
  const owners = ownersData.flat().filter(o => o !== "");

  const output = JSON.stringify({ leads, owners });
  const callback = e.parameter.callback;
  return ContentService
    .createTextOutput(callback ? `${callback}(${output})` : output)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


// ── doPost — Write data, handle backups and file uploads ──────────────────────
// Dispatches on payload.action:
//   (none)       → save leads + owners to sheet
//   "backup"     → append a JSON snapshot to the Backups sheet
//   "uploadFile" → upload a base64 file to Google Drive, return its URL

function doPost(e) {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const payload = JSON.parse(e.postData.contents);


  // ── Action: uploadFile ──────────────────────────────────────────────────────
  // Expects: { action, fileName, mimeType, fileData (base64 data URL) }
  // Returns: { driveUrl }

  if (payload.action === 'uploadFile') {
    const folders = DriveApp.getFoldersByName(DRIVE_FOLDER);
    const folder  = folders.hasNext() ? folders.next() : DriveApp.createFolder(DRIVE_FOLDER);
    const base64  = payload.fileData.replace(/^data:[^;]+;base64,/, '');
    const bytes   = Utilities.base64Decode(base64);
    const blob    = Utilities.newBlob(bytes, payload.mimeType || 'application/octet-stream', payload.fileName);
    const file    = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const driveUrl = `https://drive.google.com/file/d/${file.getId()}/view?usp=sharing`;
    return ContentService
      .createTextOutput(JSON.stringify({ driveUrl }))
      .setMimeType(ContentService.MimeType.JSON);
  }


  // ── Action: backup ──────────────────────────────────────────────────────────
  // Expects: { action, leads, owners, prospects }
  // Appends one row to the Backups sheet; trims to MAX_BACKUPS rows.
  // Returns: { ok, backed_up }

  if (payload.action === 'backup') {
    let backupSheet = ss.getSheetByName(BACKUP_SHEET);
    if (!backupSheet) {
      backupSheet = ss.insertSheet(BACKUP_SHEET);
      backupSheet.getRange("A1:D1").setValues([["Timestamp", "Date", "Lead Count", "Data JSON"]]);
      backupSheet.setFrozenRows(1);
    }
    const now       = new Date();
    const timestamp = now.toISOString();
    const leadCount = (payload.leads || []).length;
    const json      = JSON.stringify({
      leads:     payload.leads     || [],
      owners:    payload.owners    || [],
      prospects: payload.prospects || [],
    });
    backupSheet.appendRow([timestamp, timestamp.slice(0, 10), leadCount, json]);
    // Trim old backups (keep header + MAX_BACKUPS data rows)
    const totalRows = backupSheet.getLastRow();
    if (totalRows > MAX_BACKUPS + 1) {
      backupSheet.deleteRows(2, totalRows - MAX_BACKUPS - 1);
    }
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, backed_up: leadCount }))
      .setMimeType(ContentService.MimeType.JSON);
  }


  // ── Default action: save leads + owners ────────────────────────────────────
  // Expects: { leads: [...], owners: [...] }
  // Returns: { success: true }
  //
  // IMPORTANT: Use a single setValues() call on a pre-built 2D array rather than
  // looping appendRow(). Each appendRow() is a separate Sheets API round-trip;
  // with 70+ rows this easily exceeds Vercel's (or any proxy's) timeout limit.
  // setValues() writes the entire dataset in one API call regardless of row count.

  const leadsSheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  leadsSheet.clearContents();

  const rows = [HEADERS];
  (payload.leads || []).forEach(lead => rows.push(HEADERS.map(h => {
    if (h === "files") return JSON.stringify(lead[h] || []);
    return lead[h] ?? "";
  })));
  // Single batch write — fast and timeout-safe
  leadsSheet.getRange(1, 1, rows.length, HEADERS.length).setValues(rows);

  const ownersSheet = ss.getSheetByName(OWNERS_SHEET) || ss.insertSheet(OWNERS_SHEET);
  ownersSheet.clearContents();
  if ((payload.owners || []).length > 0) {
    ownersSheet.getRange(1, 1, payload.owners.length, 1)
      .setValues(payload.owners.map(o => [o]));
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
