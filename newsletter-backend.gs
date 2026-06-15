/**
 * ============================================================
 * ELYSIAN STUDIOS — Newsletter backend (Google Apps Script)
 * ============================================================
 * The website is a static site (GitHub Pages) with no server, so this
 * tiny Google Apps Script acts as the "backend" for the newsletter:
 *
 *   1. It stores every email that signs up in a Google Sheet  ← your database
 *   2. It can send a newsletter to every subscriber           ← sendNewsletter()
 *
 * ------------------------------------------------------------
 * ONE-TIME SETUP (~3 minutes)
 * ------------------------------------------------------------
 *   1. Go to  https://script.google.com  → "New project".
 *   2. Delete the sample code, paste THIS ENTIRE FILE in, and Save.
 *   3. Click  Deploy → New deployment.
 *        • Type:            Web app
 *        • Description:      Elysian newsletter
 *        • Execute as:      Me (elysianstudios188@gmail.com)
 *        • Who has access:  Anyone
 *      Click Deploy, approve the permissions when asked.
 *   4. Copy the "Web app URL" it gives you (ends in /exec).
 *   5. Paste that URL into the website code:
 *        src/components/Footer.jsx  →  const NEWSLETTER_ENDPOINT = '...'
 *      Commit & push. Done — signups now land in the Sheet.
 *
 * Where's the database? The first signup auto-creates a Google Sheet
 * named "Elysian Newsletter Subscribers" in your Drive. Open it any time
 * to see / export the list (columns: Timestamp, Email, Source).
 *
 * ------------------------------------------------------------
 * SENDING A NEWSLETTER
 * ------------------------------------------------------------
 *   • Edit SUBJECT and HTML_BODY at the bottom of this file.
 *   • In the editor, pick the function "sendNewsletter" and click Run.
 *   • It emails every subscriber (Gmail sending limit: ~100/day on a
 *     free account, ~1500/day on Workspace). It skips duplicates.
 * ============================================================
 */

var SHEET_NAME = 'Elysian Newsletter Subscribers';

/** Returns the subscribers sheet, creating the spreadsheet on first use. */
function getSheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  var ss;
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create(SHEET_NAME);
    props.setProperty('SHEET_ID', ss.getId());
    var s = ss.getActiveSheet();
    s.appendRow(['Timestamp', 'Email', 'Source']);
    s.setFrozenRows(1);
  }
  return ss.getActiveSheet();
}

/** Handles the signup POST from the website's footer form. */
function doPost(e) {
  try {
    var email = '';
    var source = 'website';
    if (e && e.parameter && e.parameter.email) {
      email = String(e.parameter.email).trim();
      if (e.parameter.source) source = String(e.parameter.source);
    } else if (e && e.postData && e.postData.contents) {
      var data = JSON.parse(e.postData.contents);
      email = String(data.email || '').trim();
      source = String(data.source || source);
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json_({ ok: false, error: 'Invalid email' });
    }

    var sheet = getSheet_();
    // De-dupe: skip if this email is already subscribed.
    var existing = sheet.getRange(1, 2, Math.max(sheet.getLastRow(), 1), 1)
      .getValues().map(function (r) { return String(r[0]).toLowerCase(); });
    if (existing.indexOf(email.toLowerCase()) === -1) {
      sheet.appendRow([new Date(), email, source]);
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Lets you sanity-check the deployment in a browser (visit the /exec URL). */
function doGet() {
  return json_({ ok: true, message: 'Elysian newsletter endpoint is live.' });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ------------------------------------------------------------
 * Send a newsletter to every subscriber.
 * Edit SUBJECT and HTML_BODY, then Run this function.
 * ------------------------------------------------------------
 */
function sendNewsletter() {
  var SUBJECT = 'A new chronicle from Elysian Studios ✦';
  var HTML_BODY =
    '<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#1c1917">' +
    '<h1 style="font-weight:400">Elysian Studios</h1>' +
    '<p>Dear reader,</p>' +
    '<p>Write your newsletter here. You can use HTML for links and images.</p>' +
    '<p style="color:#c9a84c">— The Elysian Studios team</p>' +
    '<hr><p style="font-size:12px;color:#888">You are receiving this because you subscribed at elysian.studio. ' +
    'Reply with “unsubscribe” to opt out.</p>' +
    '</div>';

  var sheet = getSheet_();
  var last = sheet.getLastRow();
  if (last < 2) { Logger.log('No subscribers yet.'); return; }

  var emails = sheet.getRange(2, 2, last - 1, 1).getValues();
  var sent = 0;
  emails.forEach(function (row) {
    var email = String(row[0]).trim();
    if (!email) return;
    MailApp.sendEmail({
      to: email,
      subject: SUBJECT,
      htmlBody: HTML_BODY,
      name: 'Elysian Studios'
    });
    sent++;
  });
  Logger.log('✅ Newsletter sent to ' + sent + ' subscribers.');
}
