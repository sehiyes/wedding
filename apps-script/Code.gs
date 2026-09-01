/**
 * Wedding guest snapshot uploader - Google Apps Script Web App
 *
 * This version receives ONE image per simple POST as base64.
 * It intentionally avoids multipart XMLHttpRequest so GitHub Pages
 * does not trigger a CORS preflight against Apps Script.
 */
const FOLDER_ID = "1kWbEp5VY3Oopixv94N6-bLGg5yda7Uy_";
const UPLOAD_TOKEN = "wedding0418";
const MAX_FILE_SIZE_MB = 15;

function doPost(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};

    if (p.token !== UPLOAD_TOKEN) {
      return jsonResponse({ success: false, error: "invalid_token" });
    }

    if (!p.fileData) {
      return jsonResponse({ success: false, error: "no_file" });
    }

    const bytes = Utilities.base64Decode(p.fileData);
    const sizeMB = bytes.length / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      return jsonResponse({ success: false, error: "file_too_large" });
    }

    const mimeType = p.mimeType || "application/octet-stream";
    const originalName = String(p.fileName || "guest-photo");
    const guestName = String(p.guestName || "guest").replace(/[^a-zA-Z0-9가-힣_-]/g, "_").slice(0, 30);
    const extensionMatch = originalName.match(/(\.[a-zA-Z0-9]{1,8})$/);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : "";

    const timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyyMMdd_HHmmss_SSS");
    const unique = Utilities.getUuid().slice(0, 8);
    const safeName = timestamp + "_" + guestName + "_" + unique + extension;

    const blob = Utilities.newBlob(bytes, mimeType, safeName);
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const file = folder.createFile(blob);

    return jsonResponse({
      success: true,
      uploaded: file.getName(),
      id: file.getId()
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ success: false, error: String(err) });
  }
}

function doGet() {
  return jsonResponse({ status: "ok", message: "wedding photo upload endpoint" });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
