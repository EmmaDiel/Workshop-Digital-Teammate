// === Workshop configuration ===
// This is the only file you should need to edit between workshop rounds.

const CONFIG = {
  // ─────────────────────────────────────────────────────────────────────
  // ▶▶ PASTE YOUR REAL QUALTRICS LINK HERE ◀◀
  // (Qualtrics → Distributions → Anonymous link.)
  // While the value still contains "REPLACE-ME", the closing screen shows
  // a visible warning so a placeholder can never slip into a live session.
  // ─────────────────────────────────────────────────────────────────────
  QUALTRICS_URL: 'https://REPLACE-ME.qualtrics.com/jfe/form/SV_XXXXXXXXXXX',

  // The team code is appended to the survey link as ?team_code=XK4-92F.
  // If you add an Embedded Data field called "team_code" to your Qualtrics
  // survey flow, it is captured automatically; members are still asked to
  // type their team code and member code by hand as a fallback.

  // What teams should do with the downloaded export file. Shown on the
  // "Save your work" screen — edit to match how you collect the files.
  EXPORT_INSTRUCTIONS: 'Send the downloaded file to your workshop facilitator before you leave.',

  // Stamped into every export file, so you can trace which version of the
  // platform produced which data.
  WORKSHOP_VERSION: '1.0.0',
  EXPORT_SCHEMA_VERSION: '1.0',
};

Object.assign(window, { CONFIG });
