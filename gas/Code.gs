function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const leadsSheet = ss.getSheetByName("Events") || ss.insertSheet("Events");
  const leadsData = leadsSheet.getDataRange().getValues();
  let leads = [];
  if (leadsData.length > 1) {
    const headers = leadsData[0];
    leads = leadsData.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
  }

  const ownersSheet = ss.getSheetByName("Owners") || ss.insertSheet("Owners");
  const ownersData = ownersSheet.getDataRange().getValues();
  let owners = [];
  if (ownersData.length > 0) {
    owners = ownersData.flat().filter(o => o !== "");
  }

  const callback = e.parameter.callback;
  const output = JSON.stringify({ leads, owners });
  return ContentService
    .createTextOutput(callback ? callback + '(' + output + ')' : output)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const payload = JSON.parse(e.postData.contents);

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

  if (payload.action === 'backup') {
    let backupSheet = ss.getSheetByName("Backups");
    if (!backupSheet) {
      backupSheet = ss.insertSheet("Backups");
      backupSheet.getRange("A1:D1").setValues([["Timestamp", "Date", "Lead Count", "Data JSON"]]);
      backupSheet.setFrozenRows(1);
    }
    const now = new Date();
    const timestamp = now.toISOString();
    const dateStr = timestamp.slice(0, 10);
    const leadCount = (payload.leads || []).length;
    const json = JSON.stringify({
      leads: payload.leads || [],
      owners: payload.owners || [],
      prospects: payload.prospects || []
    });
    backupSheet.appendRow([timestamp, dateStr, leadCount, json]);
    // Keep last 60 backups (header row + 60 data rows = 61 rows max)
    const totalRows = backupSheet.getLastRow();
    if (totalRows > 61) {
      backupSheet.deleteRows(2, totalRows - 61);
    }
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, backed_up: leadCount }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const leadsSheet = ss.getSheetByName("Events") || ss.insertSheet("Events");
  leadsSheet.clearContents();
  const headers = ["id","client","event","ref","date","venue","assignee","stage","name","company","email","value","notes","classCode","files"];
  leadsSheet.appendRow(headers);
  (payload.leads || []).forEach(row => leadsSheet.appendRow(headers.map(h => {
    if (h === "files") return JSON.stringify(row[h] || []);
    return row[h] ?? "";
  })));

  const ownersSheet = ss.getSheetByName("Owners") || ss.insertSheet("Owners");
  ownersSheet.clearContents();
  (payload.owners || []).forEach(o => ownersSheet.appendRow([o]));

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
