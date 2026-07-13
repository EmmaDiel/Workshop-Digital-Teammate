// === Design canvas (Part 2) — guided multi-section form with live prompt preview ===

const DESIGN_SECTIONS = [
  {
    id: 'B1',
    title: 'Purpose & Role',
    kicker: 'Section B1',
    intro: 'Given your role group mix, what is the single most useful thing an AI teammate could do for your team specifically?',
    questions: [
      {
        id: 'name',
        label: 'Name your CustomGPT',
        placeholder: 'e.g. The Devil\'s Advocate',
        kind: 'short',
        hint: 'A short, memorable name. You can change this later.'
      },
      {
        id: 'role',
        label: 'What role should it play for your team?',
        placeholder: 'e.g. A rigorous critic that pushes back on every proposal with the strongest counter-argument...',
        kind: 'long',
        hint: 'Be specific. "Helpful assistant" is too generic — name the function.'
      },
      {
        id: 'humanRole',
        label: 'What must remain a human job, regardless?',
        placeholder: 'e.g. Final decisions on team direction. Synthesis of debate into a recommendation...',
        kind: 'long',
        hint: 'Naming this explicitly protects against overreliance.'
      },
    ],
  },
  {
    id: 'B2',
    title: 'Ground Rules',
    kicker: 'Section B2',
    intro: 'A ground rule shapes how your CustomGPT behaves in general. How should it handle mistakes — blunt correction, gentle guidance, leading questions?',
    questions: [
      {
        id: 'mistakes',
        label: 'How should it handle mistakes — yours or its own?',
        placeholder: 'e.g. When the team is wrong, say so directly and explain the gap. When uncertain, say so...',
        kind: 'long',
      },
      {
        id: 'limits',
        label: 'What should it refuse to do?',
        placeholder: 'e.g. Never write final deliverables for us. Never agree just to keep the conversation pleasant...',
        kind: 'long',
      },
    ],
  },
  {
    id: 'B3',
    title: 'Initial Response',
    kicker: 'Section B3',
    intro: 'What should your teammate say in its opening message to set expectations and guidelines?',
    questions: [
      {
        id: 'opener',
        label: 'Write or sketch its opening response',
        placeholder: 'e.g. Hi team. Before we start — tell me what stage of the project you\'re in and what you want me to push hardest on today...',
        kind: 'long',
      },
    ],
  },
  {
    id: 'B4',
    title: 'Output Specification',
    kicker: 'Section B4',
    intro: 'Analysts may want detailed reasoning; Diplomats may prefer narrative; Sentinels want checklists. What format serves most of your team?',
    questions: [
      {
        id: 'format',
        label: 'What format should responses take?',
        placeholder: 'e.g. Bullets for decisions, prose for reasoning, max 200 words unless asked otherwise...',
        kind: 'long',
      },
      {
        id: 'mustInclude',
        label: 'What must every response include?',
        placeholder: 'e.g. At least one reflection question. One critical pushback. A source suggestion when claims are made...',
        kind: 'long',
      },
    ],
  },
  {
    id: 'B5',
    title: 'Language & Tone',
    kicker: 'Section B5',
    intro: 'Strict supervisor, friendly tutor, peer reviewer, or coach? Pick a register and a level of formality.',
    questions: [
      {
        id: 'tone',
        label: 'Describe the tone',
        placeholder: 'e.g. Peer-level, direct, occasionally dry. No emoji. No "great question!" openers...',
        kind: 'long',
      },
      {
        id: 'jargon',
        label: 'How much jargon is OK?',
        placeholder: 'e.g. Use business-school vocabulary freely. Define academic terms the first time...',
        kind: 'short',
      },
    ],
  },
  {
    id: 'B6',
    title: 'Reflection',
    kicker: 'Section B6',
    intro: 'Considering your prompts so far, what role should the AI teammate primarily play? Tick the most relevant — pick one or two.',
    questions: [
      {
        id: 'primaryRoles',
        label: 'What role(s) should the AI primarily play?',
        kind: 'checks',
        options: [
          { id: 'gaps',     title: 'Compensate for absent role groups',           sub: 'Fill in for missing Analysts / Diplomats / etc.' },
          { id: 'amplify',  title: 'Amplify existing team strengths',              sub: 'Lean into what you\'re already good at.' },
          { id: 'struct',   title: 'Provide structure',                            sub: 'Process, plans, ordered output.' },
          { id: 'debate',   title: 'Encourage critical debate',                    sub: 'Push back, surface assumptions.' },
          { id: 'empathy',  title: 'Facilitate empathy and communication',         sub: 'Translate between team members.' },
          { id: 'diverge',  title: 'Generate divergent ideas and alternatives',    sub: 'Force you out of the obvious path.' },
        ],
      },
      {
        id: 'otherRole',
        label: 'Something else — describe it',
        placeholder: 'Optional — what role does this team actually need?',
        kind: 'short',
      },
    ],
  },
];

const B6_OPTIONS = DESIGN_SECTIONS.find(s => s.id === 'B6').questions[0].options;

// === Shared prompt builder ===
// Single source of truth for the assembled system prompt: the live preview,
// the copy button, and the export files all use these.
// Lines use two rendering directives: __h4__ (section heading) and __meta__.

function buildPromptLines(team, designData) {
  const g = (k) => designData[k] || '';
  const checks = designData['B6.primaryRoles'] || [];

  const lines = [];
  const name = g('B1.name') || 'Our Digital Teammate';
  lines.push(`# ${name}`);
  lines.push(`__meta__Designed by Team ${team.code || '—'} · ${team.members.filter(m=>m.type).length} members · ${new Date().toLocaleDateString('en-GB',{month:'short',day:'numeric',year:'numeric'})}`);

  if (g('B1.role'))      lines.push(`__h4__Role`, g('B1.role'));
  if (g('B1.humanRole')) lines.push(`__h4__What stays with humans`, g('B1.humanRole'));
  if (g('B2.mistakes'))  lines.push(`__h4__Ground rules`, '• ' + g('B2.mistakes'));
  if (g('B2.limits'))    lines.push('• ' + g('B2.limits'));
  if (g('B3.opener'))    lines.push(`__h4__Opening message`, g('B3.opener'));
  if (g('B4.format'))    lines.push(`__h4__Output format`, g('B4.format'));
  if (g('B4.mustInclude')) lines.push('Every reply must include: ' + g('B4.mustInclude'));
  if (g('B5.tone'))      lines.push(`__h4__Tone & language`, g('B5.tone'));
  if (g('B5.jargon'))    lines.push('Jargon: ' + g('B5.jargon'));
  if (checks.length || g('B6.otherRole')) {
    const labels = checks.map(c => B6_OPTIONS.find(o => o.id === c)?.title);
    if (g('B6.otherRole')) labels.push(g('B6.otherRole'));
    lines.push(`__h4__Primary function`, labels.filter(Boolean).map(l => '• ' + l).join('\n'));
  }
  return lines;
}

// Plain-text version (for the clipboard and for exports).
function buildPromptText(team, designData) {
  return buildPromptLines(team, designData)
    .map(l => l.startsWith('__h4__') ? '\n' + l.replace('__h4__','') + ':' : l.replace(/^__meta__/, ''))
    .join('\n');
}

function DesignScreen({ team, designData, onChange, onContinue }) {
  const [active, setActive] = React.useState('B1');

  const updateAnswer = (sectionId, qId, value) => {
    onChange({ ...designData, [`${sectionId}.${qId}`]: value });
  };
  const getAnswer = (sectionId, qId) => designData[`${sectionId}.${qId}`] ?? '';

  const activeSection = DESIGN_SECTIONS.find(s => s.id === active);

  // Completion progress
  const totalQs = DESIGN_SECTIONS.reduce((a, s) => a + s.questions.filter(q => q.kind !== 'checks').length, 0);
  const filledQs = DESIGN_SECTIONS.reduce((a, s) =>
    a + s.questions.filter(q => q.kind !== 'checks' && getAnswer(s.id, q.id).trim().length > 4).length, 0);

  // Members composition snapshot for the side rail
  const members = team.members.filter(m => m.type);
  const counts = {};
  ROLE_GROUPS.forEach(g => counts[g.name] = 0);
  members.forEach(m => { counts[getGroup(m.type)]++; });
  const absent = Object.keys(counts).filter(g => counts[g] === 0);

  return (
    <div className="container-wide fade-in" data-screen-label="design">
      <div className="between mb-6">
        <div>
          <Eyebrow>Part 2 · Designing the Digital Teammate</Eyebrow>
          <h1 className="h-display mt-4">Build the <em>brief</em>.</h1>
          <p className="lede mt-4">Work through six sections together. Each maps your team's composition to a concrete design choice. Your draft system prompt updates live on the right.</p>
        </div>
        <div style={{textAlign: 'right'}}>
          <div className="stat" style={{textAlign:'right'}}>
            <div className="stat-num" style={{fontSize: 28}}>{filledQs}<span style={{color: 'var(--ink-mute)', fontSize: 18}}> / {totalQs}</span></div>
            <div className="stat-label">prompts filled</div>
          </div>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '220px 1fr 380px', gap: 24, alignItems: 'flex-start'}}>
        {/* === Section nav === */}
        <aside className="stack-xs" style={{position: 'sticky', top: 160}}>
          <div className="section-num" style={{marginBottom: 12}}>Sections</div>
          {DESIGN_SECTIONS.map(s => {
            const isActive = active === s.id;
            const filled = s.questions.filter(q => {
              if (q.kind === 'checks') return (designData[`${s.id}.${q.id}`] || []).length > 0;
              return getAnswer(s.id, q.id).trim().length > 4;
            }).length;
            const total = s.questions.length;
            return (
              <button key={s.id} onClick={() => setActive(s.id)} style={{
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid ' + (isActive ? 'var(--ink)' : 'transparent'),
                background: isActive ? 'var(--bg-card)' : 'transparent',
                display: 'flex', flexDirection:'column', gap: 4,
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase',
                  color: isActive ? 'var(--accent)' : 'var(--ink-mute)'
                }}>{s.kicker}</span>
                <span style={{fontSize: 14, color: isActive ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: isActive ? 500 : 400}}>{s.title}</span>
                <span style={{fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)'}}>{filled}/{total}</span>
              </button>
            );
          })}
          <div className="divider" />
          <div className="section-num" style={{marginBottom: 8}}>Team rail</div>
          <div className="helper" style={{fontSize: 12}}>
            {members.length} members across {ROLE_GROUPS.filter(g => counts[g.name] > 0).length} role groups.
          </div>
          <div style={{display:'flex', flexDirection:'column', gap: 6, marginTop: 8}}>
            {ROLE_GROUPS.map(g => (
              <div key={g.name} className={classFor(g.name)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 12, padding: '4px 0',
                opacity: counts[g.name] === 0 ? .4 : 1
              }}>
                <span style={{display:'flex', alignItems:'center', gap: 8}}>
                  <span style={{width: 8, height: 8, borderRadius: '50%', background: 'var(--rg)'}} />
                  {g.name}
                </span>
                <span className="mono" style={{color: 'var(--ink-soft)'}}>{counts[g.name]}</span>
              </div>
            ))}
          </div>
          {absent.length > 0 && (
            <div className="tip-callout" style={{marginTop: 12, fontSize: 12, padding: '10px 12px'}}>
              <span className="tip-mark" style={{fontSize: 9}}>Gap</span>
              <div>Compensating for {absent.join(' & ')} is a strong design direction for this team.</div>
            </div>
          )}
        </aside>

        {/* === Active section form === */}
        <main className="card" style={{minHeight: 600}}>
          <div className="card-head">
            <div>
              <div className="section-num">{activeSection.kicker} · {DESIGN_SECTIONS.findIndex(s => s.id === active) + 1} of {DESIGN_SECTIONS.length}</div>
              <h2 className="h1 mt-2" style={{fontSize: 34}}>{activeSection.title}</h2>
              <p className="lede mt-4" style={{fontSize: 15}}>{activeSection.intro}</p>
            </div>
          </div>

          {active === 'B1' && <PrivacyNote />}

          <div className="stack-lg">
            {activeSection.questions.map(q => (
              <DesignQuestion
                key={q.id}
                q={q}
                value={getAnswer(activeSection.id, q.id)}
                onChange={(v) => updateAnswer(activeSection.id, q.id, v)}
              />
            ))}
          </div>

          <div className="between mt-8" style={{paddingTop: 24, borderTop: '1px solid var(--line)'}}>
            <button
              className="btn btn-ghost"
              disabled={DESIGN_SECTIONS.findIndex(s => s.id === active) === 0}
              onClick={() => {
                const i = DESIGN_SECTIONS.findIndex(s => s.id === active);
                if (i > 0) setActive(DESIGN_SECTIONS[i - 1].id);
              }}
            >← Previous</button>
            {DESIGN_SECTIONS.findIndex(s => s.id === active) < DESIGN_SECTIONS.length - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => {
                  const i = DESIGN_SECTIONS.findIndex(s => s.id === active);
                  setActive(DESIGN_SECTIONS[i + 1].id);
                }}
              >Next section <span className="arrow">→</span></button>
            ) : (
              <button className="btn btn-primary" onClick={onContinue}>
                Finish & test the prompt <span className="arrow">→</span>
              </button>
            )}
          </div>
        </main>

        {/* === Live prompt preview === */}
        <aside style={{position: 'sticky', top: 160}}>
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            marginBottom: 10
          }}>
            <span className="section-num" style={{marginBottom: 0}}>Live system prompt</span>
            <span className="tag-mute">auto-generated</span>
          </div>
          <PromptPreview team={team} designData={designData} />
        </aside>
      </div>
    </div>
  );
}

function DesignQuestion({ q, value, onChange }) {
  if (q.kind === 'checks') {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (id) => {
      const next = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id];
      onChange(next);
    };
    return (
      <div className="field">
        <label>{q.label}</label>
        <div className="stack-sm mt-2">
          {q.options.map(o => (
            <button key={o.id} type="button" className={`check ${selected.includes(o.id) ? 'checked' : ''}`}
              role="checkbox" aria-checked={selected.includes(o.id)} onClick={() => toggle(o.id)}>
              <div className="box" />
              <div className="check-label">
                <div className="check-title">{o.title}</div>
                <div className="check-sub">{o.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="field">
      <label>{q.label}</label>
      {q.hint && <div className="sub">{q.hint}</div>}
      {q.kind === 'short'
        ? <input className="input" value={value} placeholder={q.placeholder} onChange={e => onChange(e.target.value)} />
        : <textarea className="textarea" value={value} placeholder={q.placeholder} onChange={e => onChange(e.target.value)} rows={4} />}
    </div>
  );
}

function PromptPreview({ team, designData, big }) {
  const [copied, setCopied] = React.useState(false);
  const lines = buildPromptLines(team, designData);
  const empty = lines.length <= 2;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildPromptText(team, designData));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.warn('Clipboard unavailable:', err);
    }
  };

  return (
    <div className="prompt-output" style={big ? {fontSize: 14, padding: 36} : {}}>
      {!empty && (
        <button className="copy" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
      )}
      {empty ? (
        <span style={{color: '#807d77', fontStyle: 'italic'}}>
          Your prompt will appear here as you complete the sections. Start with B1 — Purpose & Role.
        </span>
      ) : lines.map((l, i) => {
        if (l.startsWith('__h4__')) return <h4 key={i}>{l.replace('__h4__','')}</h4>;
        if (l.startsWith('__meta__')) return <div className="meta" key={i}>{l.replace('__meta__','')}</div>;
        if (l.startsWith('# ')) return <div key={i} style={{fontFamily:'var(--font-serif)', fontSize: big ? 26 : 22, color:'#fff', marginBottom: 4}}>{l.slice(2)}</div>;
        return <div key={i}>{l}</div>;
      })}
    </div>
  );
}

Object.assign(window, { DesignScreen, DESIGN_SECTIONS, B6_OPTIONS, PromptPreview, buildPromptLines, buildPromptText });
