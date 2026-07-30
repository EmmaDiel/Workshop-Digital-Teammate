// === Team export (Part 4, step 1) ===
//
// Produces one downloadable ZIP per team, stamped with the team code:
//   · team_<code>.json    — canonical, analysis-ready record (schema below)
//   · members_<code>.csv  — one row per member (personality data)
//   · team_<code>.csv     — one row per team (design + evaluation)
//   · summary_<code>.md   — human-readable summary
//   · system_prompt_<code>.txt — the assembled prompt, ready to paste
//   · data_dictionary.txt — column-by-column explanation
//
// Everything is generated in the browser; nothing is uploaded anywhere.
// The two CSVs are shaped so that many team files can be stacked with e.g.
// R:  purrr::map_dfr(list.files(pattern="members_.*csv"), readr::read_csv)

// ── Export data assembly ────────────────────────────────────────────────

// Dimension key → export column stem, named after the RIGHT pole so each
// value reads as "% toward that pole" (complement = the left pole).
const DIM_EXPORT_COLUMNS = {
  EI: 'energy_extraverted_pct',
  SN: 'mind_intuitive_pct',
  TF: 'nature_feeling_pct',
  JP: 'tactics_prospecting_pct',
  AT: 'identity_turbulent_pct',
};

function memberExportRow(team, m) {
  const row = {
    team_code: team.code,
    member_id: memberShort(m),
    member_number: m.num,
    type: m.type || '',
    type_variant: typeVariant(m) || '',
    role_group: m.type ? getGroup(m.type) : '',
  };
  DIMENSIONS.forEach(dim => {
    row[DIM_EXPORT_COLUMNS[dim.key]] = m.dims ? m.dims[dim.key] : null;
  });
  return row;
}

function buildExportData(team, designData, evalData) {
  const members = team.members.filter(m => m.type);
  const counts = {};
  ROLE_GROUPS.forEach(g => counts[g.name] = 0);
  members.forEach(m => { counts[getGroup(m.type)]++; });

  const d = (k) => (designData[k] || '').trim();
  const roles = designData['B6.primaryRoles'] || [];
  const selected = evalData.selected || ['A'];

  return {
    schema_version: CONFIG.EXPORT_SCHEMA_VERSION,
    workshop_version: CONFIG.WORKSHOP_VERSION,
    team_code: team.code,
    exported_at: new Date().toISOString(),
    demo: !!team.demo,
    team_size: team.members.length,
    n_members: members.length,
    role_group_counts: {
      analysts: counts.Analysts,
      diplomats: counts.Diplomats,
      sentinels: counts.Sentinels,
      explorers: counts.Explorers,
    },
    absent_role_groups: ROLE_GROUPS.filter(g => counts[g.name] === 0).map(g => g.name),
    members: team.members.map(m => memberExportRow(team, m)),
    design: {
      gpt_name: d('B1.name'),
      b1_role: d('B1.role'),
      b1_human_role: d('B1.humanRole'),
      b2_mistakes: d('B2.mistakes'),
      b2_limits: d('B2.limits'),
      b3_opener: d('B3.opener'),
      b4_format: d('B4.format'),
      b4_must_include: d('B4.mustInclude'),
      b5_tone: d('B5.tone'),
      b5_jargon: d('B5.jargon'),
      b6_primary_roles: roles,
      b6_primary_roles_labels: roles.map(id => B6_OPTIONS.find(o => o.id === id)?.title).filter(Boolean),
      b6_other_role: d('B6.otherRole'),
    },
    system_prompt: buildPromptText(team, designData),
    evaluation: {
      selected_topics: selected,
      topics: EVAL_TOPICS.map(t => ({
        topic_id: t.id,
        topic_title: t.title,
        selected: selected.includes(t.id),
        test_prompt: (evalData[`${t.id}.prompt`] || '').trim(),
        observation: (evalData[`${t.id}.happened`] || '').trim(),
        interpretation: (evalData[`${t.id}.why`] || '').trim(),
        refinement: (evalData[`${t.id}.refine`] || '').trim(),
      })),
    },
  };
}

// ── File renderers ──────────────────────────────────────────────────────

function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function toCsv(rows) {
  const cols = Object.keys(rows[0]);
  return [cols.join(','), ...rows.map(r => cols.map(c => csvCell(r[c])).join(','))].join('\n') + '\n';
}

function membersCsv(data) {
  return toCsv(data.members);
}

function teamCsv(data) {
  const row = {
    team_code: data.team_code,
    exported_at: data.exported_at,
    schema_version: data.schema_version,
    workshop_version: data.workshop_version,
    demo: data.demo,
    team_size: data.team_size,
    n_members: data.n_members,
    count_analysts: data.role_group_counts.analysts,
    count_diplomats: data.role_group_counts.diplomats,
    count_sentinels: data.role_group_counts.sentinels,
    count_explorers: data.role_group_counts.explorers,
    absent_role_groups: data.absent_role_groups.join(';'),
    gpt_name: data.design.gpt_name,
    b1_role: data.design.b1_role,
    b1_human_role: data.design.b1_human_role,
    b2_mistakes: data.design.b2_mistakes,
    b2_limits: data.design.b2_limits,
    b3_opener: data.design.b3_opener,
    b4_format: data.design.b4_format,
    b4_must_include: data.design.b4_must_include,
    b5_tone: data.design.b5_tone,
    b5_jargon: data.design.b5_jargon,
    b6_primary_roles: data.design.b6_primary_roles.join(';'),
    b6_other_role: data.design.b6_other_role,
    eval_selected_topics: data.evaluation.selected_topics.join(';'),
  };
  data.evaluation.topics.forEach(t => {
    const p = 'eval_' + t.topic_id.toLowerCase();
    row[p + '_selected'] = t.selected;
    row[p + '_test_prompt'] = t.test_prompt;
    row[p + '_observation'] = t.observation;
    row[p + '_interpretation'] = t.interpretation;
    row[p + '_refinement'] = t.refinement;
  });
  row.system_prompt = data.system_prompt;
  return toCsv([row]);
}

function summaryMd(data) {
  const L = [];
  L.push(`# Digital Teammate — Team ${data.team_code}`);
  L.push('');
  L.push(`Exported ${new Date(data.exported_at).toLocaleString('en-GB')} · workshop v${data.workshop_version}${data.demo ? ' · **DEMO DATA**' : ''}`);
  L.push('');
  L.push('## Team profile');
  L.push('');
  L.push('| Member | Type | Role group | ' + DIMENSIONS.map(d => d.name).join(' | ') + ' |');
  L.push('|---|---|---|' + DIMENSIONS.map(() => '---').join('|') + '|');
  data.members.forEach(m => {
    const dims = DIMENSIONS.map(dim => {
      const v = m[DIM_EXPORT_COLUMNS[dim.key]];
      if (v === null || v === undefined) return '—';
      const r = poleReading(dim, v);
      return r.side ? `${r.pct}% ${r.letter}` : '50/50';
    });
    L.push(`| ${m.member_id} | ${m.type_variant || '—'} | ${m.role_group || '—'} | ${dims.join(' | ')} |`);
  });
  L.push('');
  L.push('Role groups: ' + ROLE_GROUPS.map(g => `${g.name} ${data.role_group_counts[g.name.toLowerCase()]}`).join(' · '));
  if (data.absent_role_groups.length) L.push(`Absent: ${data.absent_role_groups.join(', ')}`);
  L.push('');
  L.push('## Design canvas (Part 2)');
  L.push('');
  const q = (label, v) => { L.push(`**${label}**`); L.push(''); L.push(v ? v : '_(not answered)_'); L.push(''); };
  q('B1 · Name', data.design.gpt_name);
  q('B1 · Role for the team', data.design.b1_role);
  q('B1 · What stays a human job', data.design.b1_human_role);
  q('B2 · Handling mistakes', data.design.b2_mistakes);
  q('B2 · What it should refuse', data.design.b2_limits);
  q('B3 · Opening message', data.design.b3_opener);
  q('B4 · Response format', data.design.b4_format);
  q('B4 · Every response must include', data.design.b4_must_include);
  q('B5 · Tone', data.design.b5_tone);
  q('B5 · Jargon', data.design.b5_jargon);
  q('B6 · Primary role(s)', data.design.b6_primary_roles_labels.join('; ') + (data.design.b6_other_role ? `; ${data.design.b6_other_role}` : ''));
  L.push('## Evaluation (Part 3)');
  L.push('');
  data.evaluation.topics.forEach(t => {
    L.push(`### Topic ${t.topic_id} — ${t.topic_title} ${t.selected ? '' : '(not selected)'}`);
    L.push('');
    if (t.test_prompt || t.observation || t.interpretation || t.refinement) {
      q('Test prompt', t.test_prompt);
      q('What happened', t.observation);
      q('Why', t.interpretation);
      q('Refinement', t.refinement);
    } else {
      L.push('_(no notes)_');
      L.push('');
    }
  });
  L.push('## Final system prompt');
  L.push('');
  L.push('```');
  L.push(data.system_prompt);
  L.push('```');
  L.push('');
  return L.join('\n');
}

function dataDictionary() {
  return `DATA DICTIONARY — Designing Your Digital Teammate exports
Schema version ${CONFIG.EXPORT_SCHEMA_VERSION} · workshop version ${CONFIG.WORKSHOP_VERSION}

FILES
  team_<code>.json     Canonical record. Everything below in one nested JSON.
  members_<code>.csv   One row per team member.
  team_<code>.csv      One row per team (design answers + evaluation).
  summary_<code>.md    Human-readable version of the same data.
  system_prompt_<code>.txt  The assembled CustomGPT system prompt.

IDENTIFIERS
  team_code            Generated code identifying the team (only linkage key).
  member_id            M1..Mn — the member's number within the team. Members
                       use "<team_code> + M<n>" in the follow-up survey.
  No names or other personal identifiers are collected anywhere.

MEMBERS (members_<code>.csv)
  type                 Four-letter 16Personalities type, e.g. INTJ.
  type_variant         Type incl. identity suffix, e.g. INTJ-A / INTJ-T,
                       derived from identity_turbulent_pct (>50 → -T).
  role_group           Analysts / Diplomats / Sentinels / Explorers.
  *_pct columns        Position 0-100 on each dimension, named after the
                       RIGHT pole; the left-pole share is the complement.
                       Example: energy_extraverted_pct = 28 means the member
                       reported "72% Introverted". 50 = not set / neutral.
    energy_extraverted_pct    Energy:   Introverted (I=0) … Extraverted (E=100)
    mind_intuitive_pct        Mind:     Observant  (S=0) … Intuitive  (N=100)
    nature_feeling_pct        Nature:   Thinking   (T=0) … Feeling    (F=100)
    tactics_prospecting_pct   Tactics:  Judging    (J=0) … Prospecting(P=100)
    identity_turbulent_pct    Identity: Assertive  (A=0) … Turbulent  (T=100)

TEAM (team_<code>.csv)
  count_*              Members per role group.
  absent_role_groups   Role groups with zero members ("," → ";"-separated).
  gpt_name, b1_*..b6_* Design-canvas answers (B1 Purpose & Role … B6
                       Reflection), free text as typed by the team.
  b6_primary_roles     Ticked options in B6, ";"-separated ids:
                       gaps | amplify | struct | debate | empathy | diverge.
  eval_selected_topics Topics the team chose in Part 3 (A mandatory + 2).
  eval_<a-d>_*         Per topic: selected (true/false), test_prompt,
                       observation, interpretation, refinement. Text fields
                       may be filled even when selected=false (teams can
                       type notes before switching topics).
  system_prompt        Assembled prompt (before Part 3 refinements, which
                       are recorded separately in eval_*_refinement).
  demo                 true when produced from ?demo=1 sample data — exclude
                       from analysis.

R QUICKSTART
  library(tidyverse)
  members <- list.files("data", pattern="^members_.*\\\\.csv$", full.names=TRUE, recursive=TRUE) |>
    map_dfr(read_csv, col_types = cols(team_code = "c", member_id = "c"))
  teams <- list.files("data", pattern="^team_.*\\\\.csv$", full.names=TRUE, recursive=TRUE) |>
    map_dfr(read_csv, col_types = cols(.default = "c"))
`;
}

// ── Minimal ZIP writer (STORE, no compression — files are tiny) ─────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// files: [{ name: 'path/in/zip.txt', text: '…' }] → Uint8Array of a valid zip
function makeZip(files) {
  const enc = new TextEncoder();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const f of files) {
    const name = enc.encode(f.name);
    const data = enc.encode(f.text);
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);          // version needed
    local.setUint16(6, 0x0800, true);      // flags: UTF-8 names
    local.setUint16(8, 0, true);           // method: store
    local.setUint16(10, dosTime, true);
    local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);          // extra length
    localParts.push(new Uint8Array(local.buffer), name, data);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);        // version made by
    central.setUint16(6, 20, true);        // version needed
    central.setUint16(8, 0x0800, true);
    central.setUint16(10, 0, true);
    central.setUint16(12, dosTime, true);
    central.setUint16(14, dosDate, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, data.length, true);
    central.setUint32(24, data.length, true);
    central.setUint16(28, name.length, true);
    // comment/disk/attrs all zero (30..41)
    central.setUint32(42, offset, true);   // local header offset
    centralParts.push(new Uint8Array(central.buffer), name);

    offset += 30 + name.length + data.length;
  }

  const centralSize = centralParts.reduce((a, p) => a + p.length, 0);
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(8, files.length, true);
  eocd.setUint16(10, files.length, true);
  eocd.setUint32(12, centralSize, true);
  eocd.setUint32(16, offset, true);
  const all = [...localParts, ...centralParts, new Uint8Array(eocd.buffer)];
  const out = new Uint8Array(all.reduce((a, p) => a + p.length, 0));
  let pos = 0;
  for (const p of all) { out.set(p, pos); pos += p.length; }
  return out;
}

// ── Download helpers ────────────────────────────────────────────────────

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function exportFiles(data) {
  const code = data.team_code;
  return [
    { name: `team_${code}.json`, text: JSON.stringify(data, null, 2) + '\n', mime: 'application/json', label: 'Structured data (JSON)', desc: 'The canonical record — everything in one machine-readable file.' },
    { name: `members_${code}.csv`, text: membersCsv(data), mime: 'text/csv', label: 'Members table (CSV)', desc: 'One row per member: type + five dimension percentages.' },
    { name: `team_${code}.csv`, text: teamCsv(data), mime: 'text/csv', label: 'Team table (CSV)', desc: 'One row per team: design answers + evaluation notes.' },
    { name: `summary_${code}.md`, text: summaryMd(data), mime: 'text/markdown', label: 'Readable summary (Markdown)', desc: 'The same content formatted for humans.' },
    { name: `system_prompt_${code}.txt`, text: data.system_prompt + '\n', mime: 'text/plain', label: 'System prompt (TXT)', desc: 'Ready to paste into a Custom GPT.' },
    { name: 'data_dictionary.txt', text: dataDictionary(), mime: 'text/plain', label: 'Data dictionary', desc: 'What every column means.' },
  ];
}

// ── Export screen ───────────────────────────────────────────────────────

function ExportScreen({ team, designData, evalData, exported, onExported, onContinue }) {
  const [confirmSkip, setConfirmSkip] = React.useState(false);
  const data = React.useMemo(() => buildExportData(team, designData, evalData), [team, designData, evalData]);
  const files = React.useMemo(() => exportFiles(data), [data]);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const zipName = `digital-teammate_${data.team_code}_${dateStamp}.zip`;

  const downloadZip = () => {
    const folder = `digital-teammate_${data.team_code}/`;
    const zip = makeZip(files.map(f => ({ name: folder + f.name, text: f.text })));
    downloadBlob(zipName, new Blob([zip], { type: 'application/zip' }));
    onExported();
  };

  const handleContinue = () => {
    if (!exported && !confirmSkip) { setConfirmSkip(true); return; }
    onContinue();
  };

  // Readiness checklist (informational — nothing is blocked)
  const membersDone = team.members.filter(m => m.type).length;
  const totalQs = DESIGN_SECTIONS.reduce((a, s) => a + countedQuestions(s).filter(q => q.kind !== 'checks').length, 0);
  const filledQs = DESIGN_SECTIONS.reduce((a, s) =>
    a + countedQuestions(s).filter(q => q.kind !== 'checks' && questionFilled(designData, s.id, q)).length, 0);
  const b6Picked = (designData['B6.primaryRoles'] || []).length > 0;
  const selectedTopics = data.evaluation.selected_topics;
  const topicsWithNotes = data.evaluation.topics.filter(t => t.selected && (t.observation || t.refinement)).length;

  const checks = [
    { ok: membersDone === team.members.length, text: `${membersDone} of ${team.members.length} members entered their personality results` },
    { ok: filledQs === totalQs, text: `${filledQs} of ${totalQs} design prompts filled (B1–B5)` },
    { ok: b6Picked, text: b6Picked ? 'B6 — primary role(s) ticked' : 'B6 — no primary role ticked yet' },
    { ok: selectedTopics.length === 3, text: `${selectedTopics.length} of 3 evaluation topics selected (${selectedTopics.join(', ')})` },
    { ok: topicsWithNotes === selectedTopics.length, text: `${topicsWithNotes} of ${selectedTopics.length} selected topics have notes` },
  ];

  return (
    <div className="container fade-in" data-screen-label="export">
      <div className="between mb-6">
        <div>
          <Eyebrow>Part 4 · Save your work</Eyebrow>
          <h1 className="h-display mt-4">Download your team's <em>results</em>.</h1>
          <p className="lede mt-4">One file, stamped with your team code, holding your team profile, design answers and evaluation. Nothing is stored online — this download is the only copy.</p>
        </div>
        <div style={{textAlign: 'right'}}>
          <button className="btn btn-primary btn-lg" onClick={handleContinue}>
            Continue to reflection <span className="arrow">→</span>
          </button>
          {confirmSkip && !exported && (
            <div className="helper mt-2" style={{color: 'var(--accent)', maxWidth: 260}}>
              Your team's work hasn't been downloaded and can't be recovered later — press again to continue anyway.
            </div>
          )}
        </div>
      </div>

      <div className="grid-2" style={{gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'flex-start'}}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="section-num">Team file</div>
              <h2 className="h2 mt-2">Everything in one download</h2>
            </div>
            <span className="tag-mute mono">{data.team_code}</span>
          </div>

          <div className="stack-sm">
            {files.map(f => (
              <div key={f.name} className="between" style={{padding: '10px 0', borderTop: '1px solid var(--line)'}}>
                <div>
                  <div style={{fontSize: 14, fontWeight: 500}}>{f.label}</div>
                  <div className="helper" style={{fontSize: 12}}>{f.desc}</div>
                </div>
                <button className="btn-link mono" style={{fontSize: 12, flexShrink: 0, marginLeft: 16}}
                  onClick={() => { downloadBlob(f.name, new Blob([f.text], { type: f.mime })); }}>
                  {f.name}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6" style={{textAlign: 'center'}}>
            <button className="btn btn-primary btn-lg" onClick={downloadZip}>
              {exported ? 'Download again (.zip)' : 'Download team file (.zip)'}
            </button>
            {exported && <div className="helper mt-3" style={{color: 'var(--diplomats)'}}>Downloaded ✓ — check your Downloads folder for {zipName}</div>}
          </div>

          <div className="tip-callout mt-6">
            <span className="tip-mark">Then</span>
            <div>{CONFIG.EXPORT_INSTRUCTIONS}</div>
          </div>
        </div>

        <div className="stack-md">
          <div className="card">
            <div className="section-num">Before you download</div>
            <h3 className="h2 mt-2" style={{fontSize: 18}}>Completeness check</h3>
            <div className="stack-sm mt-4">
              {checks.map((c, i) => (
                <div key={i} style={{display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13}}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    display: 'grid', placeItems: 'center', fontSize: 11, color: '#fff',
                    background: c.ok ? 'var(--diplomats)' : 'var(--ink-mute)'
                  }}>{c.ok ? '✓' : '·'}</span>
                  <span style={{color: c.ok ? 'var(--ink)' : 'var(--ink-soft)'}}>{c.text}</span>
                </div>
              ))}
            </div>
            <div className="helper mt-4" style={{fontSize: 12}}>Nothing here is blocking — it's a chance to spot gaps before you save. You can go back with the Menu (top right).</div>
          </div>

          <div className="card-bare">
            <div className="section-num">Privacy</div>
            <p className="helper mt-3" style={{fontSize: 13}}>
              The file contains no names — members appear as M1…M{team.members.length} and your team as {data.team_code}. It is created on this computer and never uploaded by this site.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  buildExportData, exportFiles, makeZip, crc32, downloadBlob,
  membersCsv, teamCsv, summaryMd, dataDictionary, ExportScreen,
});
