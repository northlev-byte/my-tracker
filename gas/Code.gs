// ─── Helpers ────────────────────────────────────────────────────────────────

function readLeads_(ss) {
  var leadsSheet = ss.getSheetByName("Events") || ss.insertSheet("Events");
  var leadsData = leadsSheet.getDataRange().getValues();
  var leads = [];
  if (leadsData.length > 1) {
    var headers = leadsData[0];
    leads = leadsData.slice(1).map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) {
        var val = row[i];
        if (val instanceof Date) {
          var y = val.getFullYear();
          var m = String(val.getMonth() + 1).padStart(2, '0');
          var d = String(val.getDate()).padStart(2, '0');
          obj[h] = y + '-' + m + '-' + d;
        } else if (h === 'files' && typeof val === 'string' && val !== '') {
          try { obj[h] = JSON.parse(val); } catch(_) { obj[h] = []; }
        } else {
          obj[h] = val;
        }
      });
      return obj;
    });
  }
  return leads;
}

function getVersion_(ss) {
  var metaSheet = ss.getSheetByName("Meta");
  if (!metaSheet) return "";
  return String(metaSheet.getRange("A1").getValue() || "");
}

function setVersion_(ss, version) {
  var metaSheet = ss.getSheetByName("Meta") || ss.insertSheet("Meta");
  metaSheet.getRange("A1").setValue(version);
}

// ─── doGet ──────────────────────────────────────────────────────────────────

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var leads = readLeads_(ss);

  var ownersSheet = ss.getSheetByName("Owners") || ss.insertSheet("Owners");
  var ownersData = ownersSheet.getDataRange().getValues();
  var owners = ownersData.flat().filter(function(o) { return o !== ""; });

  var prospectsSheet = ss.getSheetByName("Prospects") || ss.insertSheet("Prospects");
  var prospects = [];
  var pCell = prospectsSheet.getRange("A1").getValue();
  if (pCell && typeof pCell === 'string' && pCell !== '') {
    try { prospects = JSON.parse(pCell); } catch(_) { prospects = []; }
  }

  var holidaysSheet = ss.getSheetByName("Holidays") || ss.insertSheet("Holidays");
  var holidays = [];
  var hCell = holidaysSheet.getRange("A1").getValue();
  if (hCell && typeof hCell === 'string' && hCell !== '') {
    try { holidays = JSON.parse(hCell); } catch(_) { holidays = []; }
  }

  var version = getVersion_(ss);

  var callback = e.parameter.callback;
  var output = JSON.stringify({ leads: leads, owners: owners, prospects: prospects, holidays: holidays, version: version });
  return ContentService
    .createTextOutput(callback ? callback + '(' + output + ')' : output)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

// ─── doPost ─────────────────────────────────────────────────────────────────

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var payload = JSON.parse(e.postData.contents);

  // ── File upload ───────────────────────────────────────────────────────────
  if (payload.action === 'uploadFile') {
    var folderName = 'ConnectIn Tracker Files';
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    var base64 = payload.fileData.replace(/^data:[^;]+;base64,/, '');
    var bytes = Utilities.base64Decode(base64);
    var blob = Utilities.newBlob(bytes, payload.mimeType || 'application/octet-stream', payload.fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var url = 'https://drive.google.com/file/d/' + file.getId() + '/view?usp=sharing';
    return ContentService
      .createTextOutput(JSON.stringify({ driveUrl: url }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ── Manual / app-triggered backup ────────────────────────────────────────
  if (payload.action === 'backup') {
    return writeBackup_(ss, payload.leads || [], payload.owners || [], payload.prospects || [], payload.holidays || []);
  }

  // ── Conflict check (optimistic locking) ──────────────────────────────────
  // If the client sends a version, check it matches what Sheets currently has.
  // If not, reject the save — the client must reload and re-apply their change.
  var sentVersion = payload.version;
  var currentVersion = getVersion_(ss);
  if (sentVersion && currentVersion && sentVersion !== currentVersion) {
    Logger.log("CONFLICT: client sent version " + sentVersion + " but Sheets has " + currentVersion);
    return ContentService
      .createTextOutput(JSON.stringify({ conflict: true, currentVersion: currentVersion }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ── Write Events sheet ────────────────────────────────────────────────────
  var leadsSheet = ss.getSheetByName("Events") || ss.insertSheet("Events");
  leadsSheet.clearContents();
  var headers = ["id","client","event","ref","date","endDate","venue","assignee","stage","name","company","email","value","notes","classCode","files","recontactDate"];
  var rows = [headers];
  (payload.leads || []).forEach(function(lead) {
    rows.push(headers.map(function(h) {
      if (h === "files") return JSON.stringify(lead[h] || []);
      return lead[h] != null ? lead[h] : "";
    }));
  });
  leadsSheet.getRange(1, 1, rows.length, headers.length).setValues(rows);

  // ── Write Owners ──────────────────────────────────────────────────────────
  var ownersSheet = ss.getSheetByName("Owners") || ss.insertSheet("Owners");
  ownersSheet.clearContents();
  if ((payload.owners || []).length > 0) {
    ownersSheet.getRange(1, 1, payload.owners.length, 1).setValues(payload.owners.map(function(o) { return [o]; }));
  }

  // ── Write Prospects ───────────────────────────────────────────────────────
  var prospectsSheet = ss.getSheetByName("Prospects") || ss.insertSheet("Prospects");
  prospectsSheet.getRange("A1").setValue(JSON.stringify(payload.prospects || []));

  // ── Write Holidays ────────────────────────────────────────────────────────
  var holidaysSheet = ss.getSheetByName("Holidays") || ss.insertSheet("Holidays");
  holidaysSheet.getRange("A1").setValue(JSON.stringify(payload.holidays || []));

  // ── Bump version ──────────────────────────────────────────────────────────
  var newVersion = String(new Date().getTime());
  setVersion_(ss, newVersion);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, version: newVersion }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Backup helpers ──────────────────────────────────────────────────────────

function writeBackup_(ss, leads, owners, prospects, holidays) {
  var backupSheet = ss.getSheetByName("Backups");
  if (!backupSheet) {
    backupSheet = ss.insertSheet("Backups");
    backupSheet.getRange("A1:D1").setValues([["Timestamp", "Date", "Lead Count", "Data JSON"]]);
    backupSheet.setFrozenRows(1);
  }
  var now = new Date();
  var timestamp = now.toISOString();
  var dateStr = timestamp.slice(0, 10);
  var leadCount = leads.length;
  var json = JSON.stringify({ leads: leads, owners: owners, prospects: prospects, holidays: holidays });
  backupSheet.appendRow([timestamp, dateStr, leadCount, json]);

  // Keep last 168 backups (7 days at hourly cadence — header + 168 rows = 169 rows max)
  var totalRows = backupSheet.getLastRow();
  if (totalRows > 169) {
    backupSheet.deleteRows(2, totalRows - 169);
  }
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, backed_up: leadCount }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Auto-backup (called by time trigger every hour) ───────────────────────────
function autoBackup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var leads = readLeads_(ss);

  var ownersSheet = ss.getSheetByName("Owners") || ss.insertSheet("Owners");
  var owners = ownersSheet.getDataRange().getValues().flat().filter(function(o) { return o !== ""; });

  var prospectsSheet = ss.getSheetByName("Prospects") || ss.insertSheet("Prospects");
  var prospects = [];
  var pCell = prospectsSheet.getRange("A1").getValue();
  if (pCell) { try { prospects = JSON.parse(pCell); } catch(_) {} }

  var holidaysSheet = ss.getSheetByName("Holidays") || ss.insertSheet("Holidays");
  var holidays = [];
  var hCell = holidaysSheet.getRange("A1").getValue();
  if (hCell) { try { holidays = JSON.parse(hCell); } catch(_) {} }

  writeBackup_(ss, leads, owners, prospects, holidays);
  Logger.log("autoBackup complete — " + leads.length + " leads backed up at " + new Date().toISOString());
}

// ── Run this ONCE to set up the hourly trigger ────────────────────────────────
// Go to Apps Script > Run > setupHourlyBackup
function setupHourlyBackup() {
  // Remove any existing autoBackup triggers first
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'autoBackup') {
      ScriptApp.deleteTrigger(t);
    }
  });
  // Create new hourly trigger
  ScriptApp.newTrigger('autoBackup')
    .timeBased()
    .everyHours(1)
    .create();
  Logger.log("Hourly backup trigger created successfully.");
}

// ── Recovery helper — restores from the backup with the most leads ────────────
function restoreFromBackup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var backupSheet = ss.getSheetByName("Backups");
  if (!backupSheet) { Logger.log("No Backups sheet found!"); return; }

  var data = backupSheet.getDataRange().getValues();
  var bestRow = null, maxLeads = 0;
  for (var i = 1; i < data.length; i++) {
    var count = Number(data[i][2]);
    if (count > maxLeads) { maxLeads = count; bestRow = data[i]; }
  }
  if (!bestRow) { Logger.log("No backup rows found!"); return; }
  Logger.log("Restoring from: " + bestRow[0] + " | Leads: " + bestRow[2]);

  var payload = JSON.parse(bestRow[3]);
  var leads = payload.leads || [];
  var headers = ["id","client","event","ref","date","endDate","venue","assignee","stage","name","company","email","value","notes","classCode","files","recontactDate"];

  var leadsSheet = ss.getSheetByName("Events") || ss.insertSheet("Events");
  leadsSheet.clearContents();
  var rows = [headers];
  leads.forEach(function(lead) {
    rows.push(headers.map(function(h) {
      if (h === "files") return JSON.stringify(lead[h] || []);
      return lead[h] != null ? lead[h] : "";
    }));
  });
  leadsSheet.getRange(1, 1, rows.length, headers.length).setValues(rows);

  if (payload.owners && payload.owners.length > 0) {
    var ownersSheet = ss.getSheetByName("Owners") || ss.insertSheet("Owners");
    ownersSheet.clearContents();
    ownersSheet.getRange(1, 1, payload.owners.length, 1).setValues(payload.owners.map(function(o) { return [o]; }));
  }
  if (payload.prospects) {
    var prospectsSheet = ss.getSheetByName("Prospects") || ss.insertSheet("Prospects");
    prospectsSheet.getRange("A1").setValue(JSON.stringify(payload.prospects));
  }
  if (payload.holidays) {
    var holidaysSheet = ss.getSheetByName("Holidays") || ss.insertSheet("Holidays");
    holidaysSheet.getRange("A1").setValue(JSON.stringify(payload.holidays));
  }

  // Reset version so next save doesn't get a false conflict
  setVersion_(ss, "");

  Logger.log("✅ Done! Restored " + leads.length + " leads from backup at " + bestRow[0]);
}
