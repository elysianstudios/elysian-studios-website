/**
 * ============================================================
 * ELYSIAN STUDIOS — "Team Details" Google Form generator
 * ============================================================
 * This makes the Google Form for collecting your team members' details
 * for the website's Team page. You run it ONCE; it creates the form in
 * your Google Drive and prints the shareable link.
 *
 * HOW TO USE (takes ~1 minute):
 *   1. Go to  https://script.google.com  and sign in with the Google
 *      account that should own the form (e.g. elysianstudios188@gmail.com).
 *   2. Click  "New project".
 *   3. Delete whatever code is shown, then paste THIS ENTIRE FILE in.
 *   4. Click  Run  (▶).  The first time, Google asks you to authorize —
 *      approve it (it only lets the script create a form in your Drive).
 *   5. Open  View → Logs  (or Execution log). It prints two links:
 *        • "Share this link with your team"  → send that one to the team.
 *        • "Edit the form"                   → opens the form to tweak it.
 *   6. Responses collect under the form's "Responses" tab; click the
 *      Sheets icon there to dump them into a spreadsheet.
 *
 * That's it — just the form.
 */
function createTeamForm() {
  var form = FormApp.create('Elysian Studios — Team Member Details')
    .setDescription(
      'Tell us a little about yourself for the Elysian Studios Team page. ' +
      'Keep it warm and editorial — this is public-facing. Thank you! ✦'
    )
    .setCollectEmail(true)
    .setProgressBar(false);

  // 1. Full name
  form.addTextItem()
    .setTitle('Full name')
    .setHelpText('As you want it shown on the website.')
    .setRequired(true);

  // 2. Role / title
  form.addTextItem()
    .setTitle('Role / title')
    .setHelpText('e.g. "Senior Writer & Researcher", "Art Director".')
    .setRequired(true);

  // 3. Short quote
  form.addParagraphTextItem()
    .setTitle('A short quote (one line)')
    .setHelpText('A personal line or philosophy shown on your card. Keep it under ~140 characters.')
    .setRequired(true);

  // 4. Bio
  form.addParagraphTextItem()
    .setTitle('Short bio')
    .setHelpText('2–3 sentences about who you are and what you do at Elysian.')
    .setRequired(true);

  // 5. Photo (file upload)
  form.addFileUploadItem()
    .setTitle('Your photo / headshot')
    .setHelpText('A clear, high-resolution photo (square works best). Note: uploading requires you to be signed into Google.')
    .setRequired(false);

  // 5b. Photo URL fallback (in case upload isn't possible)
  form.addTextItem()
    .setTitle('…or a link to your photo (optional)')
    .setHelpText('If you can\'t upload above, paste a link to your photo instead.')
    .setRequired(false);

  // 6. Social links
  form.addTextItem()
    .setTitle('X / Twitter (optional)')
    .setHelpText('Full URL, e.g. https://x.com/yourhandle');

  form.addTextItem()
    .setTitle('LinkedIn (optional)')
    .setHelpText('Full URL, e.g. https://linkedin.com/in/you');

  form.addTextItem()
    .setTitle('Website / portfolio (optional)')
    .setHelpText('Full URL, e.g. https://yoursite.com');

  form.addTextItem()
    .setTitle('Public email (optional)')
    .setHelpText('Only if you\'re happy to show it on the site.');

  Logger.log('✅ Form created.');
  Logger.log('Share this link with your team: ' + form.getPublishedUrl());
  Logger.log('Edit the form:                  ' + form.getEditUrl());
}
