// === Team export (Part 4, step 1) ===
//
// Produces one downloadable file per team: team_<code>.json — the
// canonical, complete record. A human-readable summary_<code>.md is
// offered as an optional secondary download for facilitators.
// Stacked CSVs for analysis are generated in bulk from the JSON files by
// tools/collate.py; the column reference lives in docs/data-dictionary.md.
// Everything is generated in the browser; nothing is uploaded anywhere.

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

// The one file each team ships (6.1); the summary is an optional extra
// a facilitator might want to read on the spot.
function exportFiles(data) {
  const code = data.team_code;
  return {
    json: { name: `team_${code}.json`, text: JSON.stringify(data, null, 2) + '\n', mime: 'application/json' },
    summary: { name: `summary_${code}.md`, text: summaryMd(data), mime: 'text/markdown' },
  };
}

// ── Export screen ───────────────────────────────────────────────────────

function ExportScreen({ team, designData, evalData, extras, exported, onExported, onContinue }) {
  const [confirmSkip, setConfirmSkip] = React.useState(false);
  const data = React.useMemo(() => buildExportData(team, designData, evalData, extras), [team, designData, evalData, extras]);
  const files = React.useMemo(() => exportFiles(data), [data]);

  const downloadJson = () => {
    downloadBlob(files.json.name, new Blob([files.json.text], { type: files.json.mime }));
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
              <h2 className="h2 mt-2">One file — your team's complete record</h2>
            </div>
            <span className="tag-mute mono">{data.team_code}</span>
          </div>

          <p className="helper" style={{fontSize: 13}}>
            Your team profile, Part 1 discussion, design answers, testing notes and both prompt
            versions, in a single structured file.
          </p>

          <div className="mt-6" style={{textAlign: 'center'}}>
            <button className="btn btn-primary btn-lg" onClick={downloadJson}>
              {exported ? `Download again (${files.json.name})` : `Download team file (${files.json.name})`}
            </button>
            {exported && <div className="helper mt-3" style={{color: 'var(--diplomats)'}}>Downloaded ✓ — check your Downloads folder for {files.json.name}</div>}
          </div>

          <div className="mt-4" style={{textAlign: 'center'}}>
            <button className="btn-link mono" style={{fontSize: 12}}
              onClick={() => downloadBlob(files.summary.name, new Blob([files.summary.text], { type: files.summary.mime }))}>
              Optional: readable summary ({files.summary.name})
            </button>
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
  buildExportData, exportFiles, downloadBlob, summaryMd, ExportScreen,
});
