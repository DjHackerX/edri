// Google Apps Script: lists image files in ONE folder (id hard-coded so the URL can't be used to browse other folders).
var FOLDER_ID = '1Vo4W6SR7s6rVEy_Q7BZW6GlSDWh6iZk9';
function doGet() {
  var out = [], it = DriveApp.getFolderById(FOLDER_ID).getFiles();
  while (it.hasNext()) {
    var f = it.next(), m = f.getMimeType();
    if (/^image\/(jpeg|png|webp)$/.test(m)) out.push({ id: f.getId(), name: f.getName(), mimeType: m, createdTime: f.getDateCreated().toISOString() });
  }
  return ContentService.createTextOutput(JSON.stringify({ files: out })).setMimeType(ContentService.MimeType.JSON);
}
