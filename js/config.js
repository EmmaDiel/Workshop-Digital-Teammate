// === Workshop configuration ===
// This is the only file you should need to edit between workshop rounds.

const CONFIG = {
  // ─────────────────────────────────────────────────────────────────────
  // The Qualtrics survey link participants use — this must be the
  // ANONYMOUS link (Qualtrics → Distributions → Anonymous link), never a
  // /jfe/preview/ link: preview responses are flagged by Qualtrics and
  // excluded from the real dataset. The survey must be Published/Active.
  // If this ever contains "REPLACE-ME", the closing screen shows a
  // facilitator warning instead of the QR code.
  // ─────────────────────────────────────────────────────────────────────
  QUALTRICS_URL: 'https://survey.uu.nl/jfe/form/SV_8B6Voi3xTAFtOqG',

  // The team code is appended to the survey link as ?team_code=XK4-92F.
  // If you add an Embedded Data field called "team_code" to your Qualtrics
  // survey flow, it is captured automatically; members are still asked to
  // type their team code and member code by hand as a fallback.

  // What teams should do with the downloaded export file. Shown on the
  // "Save your work" screen — edit to match how you collect the files.
  EXPORT_INSTRUCTIONS: 'Send the downloaded file to your workshop facilitator before you leave.',

  // Stamped into every export file, so you can trace which version of the
  // platform produced which data.
  WORKSHOP_VERSION: '2.0.0',
  EXPORT_SCHEMA_VERSION: '1.1',
};

Object.assign(window, { CONFIG });
