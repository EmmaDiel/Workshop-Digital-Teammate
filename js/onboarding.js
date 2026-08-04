// === Onboarding screens: Landing -> Team setup -> per-member MB input ===
//
// The workshop runs on one shared screen: the team picks its size, gets a
// generated team code, and members take turns entering their results as
// Member 1…N. No names are collected anywhere.

function LandingScreen({ savedSession, onStart, onResume, onDiscardSaved }) {
  const saved = savedSession;
  const savedStep = saved ? (STEPS.find(s => s.id === stepIndicatorId(saved.step)) || STEPS[0]) : null;

  return (
    <div className="container fade-in" data-screen-label="onboarding-landing">
      <div className="grid-2" style={{gridTemplateColumns: '1.1fr 1fr', gap: 64, alignItems: 'center'}}>
        <div>
          <Eyebrow>A self-guided workshop</Eyebrow>
          <h1 className="h-display mt-4">Designing Your<br/><em>Digital Teammate</em>.</h1>
          {/* Creative-project frame, touchpoint 1 of 3. States the setting only:
              never how to design for it — see the firewall note in design-canvas.js. */}
          <p className="lede mt-6">
            You have a creative group project ahead of you — something new that your team will make together.
            Map your team's personality composition, then design a CustomGPT to work alongside you on it: a
            teammate shaped by how your team actually works, not a generic chatbot.
          </p>
          <div className="stat-row mt-8">
            <div className="stat">
              <div className="stat-num">~90<span style={{fontSize: 18, color: 'var(--ink-mute)', marginLeft: 4}}>min</span></div>
              <div className="stat-label">Workshop length</div>
            </div>
            <div className="stat">
              <div className="stat-num">4</div>
              <div className="stat-label">Linear parts</div>
            </div>
            <div className="stat">
              <div className="stat-num">3–6</div>
              <div className="stat-label">Members per team</div>
            </div>
          </div>

          <div className="mt-8" style={{display:'flex', gap: 12}}>
            <button className="btn btn-primary btn-lg" onClick={onStart}>
              Start the workshop <span className="arrow">→</span>
            </button>
          </div>

          {saved && (
            <div className="resume-card mt-6">
              <div>
                <div className="section-num">Unfinished session on this device</div>
                <div style={{fontSize: 14, marginTop: 6}}>
                  Team <b className="mono">{saved.team.code}</b>
                  <span style={{color: 'var(--ink-mute)'}}> · {savedStep ? `${savedStep.kicker} — ${savedStep.name}` : ''}
                  {saved.savedAt ? ` · saved ${new Date(saved.savedAt).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}` : ''}</span>
                </div>
              </div>
              <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
                <button className="btn btn-dark" onClick={onResume}>Resume</button>
                <button className="btn-link" onClick={onDiscardSaved}>Discard</button>
              </div>
            </div>
          )}

          <p className="helper mt-6" style={{fontSize: 12}}>
            No account, no names: your team gets a code, members are numbered, and everything
            stays on this device until your team downloads its results.
          </p>
        </div>

        <div className="card" style={{padding: 32}}>
          <div className="section-num">Before you begin</div>
          <h2 className="h2 mt-2">Take the free <span style={{fontFamily: 'var(--font-serif)', fontStyle:'italic', fontSize: 28, fontWeight: 400}}>16 Personalities</span> test.</h2>
          <p className="helper mt-4" style={{fontSize: 14, color: 'var(--ink-soft)'}}>
            Each team member completes it individually before joining the workshop. You'll need the five dimension percentages from the results email.
          </p>

          <div className="mt-6" style={{borderTop: '1px solid var(--line)', paddingTop: 20}}>
            <div className="stack-sm">
              <NumberedStep n="1" title="Open the test">
                <a href="https://www.16personalities.com" target="_blank" rel="noreferrer">16personalities.com</a> · ~12 minutes · no signup needed
              </NumberedStep>
              <NumberedStep n="2" title="Note your scores">
                You'll get a 4-letter type (e.g. <span className="mono" style={{fontWeight:500}}>INTJ-A</span>) plus 5 percentages — Energy, Mind, Nature, Tactics, Identity.
              </NumberedStep>
              <NumberedStep n="3" title="Return here">
                Start the workshop together, take turns entering your scores, and you're set.
              </NumberedStep>
            </div>
          </div>

          <div className="tip-callout mt-6">
            <span className="tip-mark">Note</span>
            {/* 1.1 — wording pending researcher sign-off */}
            <div>You take the test on 16personalities.com; this platform is where you enter your results.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberedStep({ n, title, children }) {
  return (
    <div style={{display: 'flex', gap: 14, alignItems:'flex-start'}}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: 'var(--bg-tint)', border: '1px solid var(--line-strong)',
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)',
        flexShrink: 0
      }}>{n}</div>
      <div style={{paddingTop: 2}}>
        <div style={{fontWeight: 500, fontSize: 14}}>{title}</div>
        <div style={{color: 'var(--ink-soft)', fontSize: 13, marginTop: 2}}>{children}</div>
      </div>
    </div>
  );
}

// === Team setup — pick a size, receive a team code ===
function TeamSetupScreen({ team, onCreate, onBegin, onBack }) {
  const created = !!(team && team.code);
  const [size, setSize] = React.useState(team && team.size ? team.size : 4);

  if (created) {
    return (
      <div className="container-narrow fade-in" data-screen-label="onboarding-code">
        <Eyebrow>Step 0 · Team setup</Eyebrow>
        <h1 className="h-display mt-4">Your team <em>code</em>.</h1>
        <p className="lede mt-4">This code identifies your team — on this screen, in your team's results file, and in the individual survey at the end. <b>Write it down now.</b></p>
        <div className="card mt-8" style={{textAlign: 'center'}}>
          <div className="team-code-display" aria-label={`Team code ${team.code}`}>{team.code}</div>
          <div className="helper mt-4">Your {team.size} members are numbered Member 1 to Member {team.size} — remember who is which number; it's the only way you're identified.</div>
          <div className="member-chip-row mt-6">
            {team.members.map(m => <MemberChip key={m.id} member={m} />)}
          </div>
        </div>
        <div className="between mt-8">
          <span className="helper">Everyone ready with their 16Personalities results?</span>
          <button className="btn btn-primary btn-lg" onClick={onBegin}>
            Start with Member 1 <span className="arrow">→</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-narrow fade-in" data-screen-label="onboarding-setup">
      <Eyebrow>Step 0 · Team setup</Eyebrow>
      <h1 className="h-display mt-4">Set up your <em>team</em>.</h1>
      <p className="lede mt-4">One shared screen for the whole team. You'll get a team code, and each member enters their personality results in turn — no names needed.</p>
      <div className="card mt-8">
        <div className="stack-md">
          <div className="field">
            <label id="team-size-label">How many people are in your team today?</label>
            <div className="size-grid mt-2" role="radiogroup" aria-labelledby="team-size-label">
              {[2,3,4,5,6,7,8].map(n => (
                <button key={n}
                  role="radio" aria-checked={size === n}
                  className={`size-btn ${size === n ? 'selected' : ''}`}
                  onClick={() => setSize(n)}>
                  {n}
                </button>
              ))}
            </div>
            <div className="sub mt-2">The workshop is designed for teams of 3–6.</div>
          </div>
          <div className="row" style={{justifyContent: 'space-between', alignItems: 'center'}}>
            <button className="btn-link" onClick={onBack}>← Back</button>
            <button className="btn btn-primary btn-lg" onClick={() => onCreate({ size })}>
              Create team code <span className="arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// === Between-member interstitial — pass the keyboard ===
function MemberHandoffScreen({ team, nextMember, onBegin }) {
  const done = team.members.filter(m => m.type).length;
  return (
    <div className="container-narrow fade-in" data-screen-label="member-handoff" style={{textAlign: 'center', paddingTop: 40}}>
      <Eyebrow>Individual input · {done} of {team.members.length} done</Eyebrow>
      <h1 className="h-display mt-4">Pass the keyboard to <em>{nextMember.name}</em>.</h1>
      <p className="lede mt-4" style={{marginLeft: 'auto', marginRight: 'auto'}}>
        Have your 16Personalities results ready — the four-letter type and the five percentages.
      </p>
      <div className="member-chip-row mt-8" style={{justifyContent: 'center'}}>
        {team.members.map(m => <MemberChip key={m.id} member={m} you={m.id === nextMember.id} />)}
      </div>
      <div className="mt-8">
        <button className="btn btn-primary btn-lg" onClick={onBegin}>
          I'm {nextMember.name} — enter my results <span className="arrow">→</span>
        </button>
      </div>
    </div>
  );
}

// === MB Input screen — individual ===
function MBInputScreen({ team, member, onSave, onPrev, onCancel }) {
  const me = member;
  const [typeCode, setTypeCode] = React.useState(me.type || '');
  const [dims, setDims] = React.useState(me.dims || { EI: 50, SN: 50, TF: 50, JP: 50, AT: 50 });
  const [confirmNeutral, setConfirmNeutral] = React.useState(false);

  const group = typeCode ? getGroup(typeCode) : null;

  const setDim = (key, val) => { setConfirmNeutral(false); setDims(d => ({ ...d, [key]: val })); };

  const canContinue = !!typeCode;
  const allNeutral = DIMENSIONS.every(d => dims[d.key] === 50);

  // Letters implied by the entered percentages, vs the selected type card.
  const impliedLetters = typeFromDims(dims);
  const mismatch = typeCode && !allNeutral &&
    impliedLetters.some((letter, i) => letter && letter !== typeCode[i]);
  const impliedCode = impliedLetters.every(Boolean) ? impliedLetters.join('') : null;

  const handleSubmit = () => {
    if (allNeutral && !confirmNeutral) { setConfirmNeutral(true); return; }
    onSave({ type: typeCode, dims });
  };

  return (
    <div className="container fade-in" data-screen-label="mb-input">
      <div className="grid-2" style={{gridTemplateColumns: '1fr 1.1fr', gap: 48}}>
        <div>
          <Eyebrow>Individual input · {me.name} of {team.members.length}</Eyebrow>
          <h1 className="h1 mt-4">Enter your <span className="serif" style={{fontStyle:'italic'}}>16 Personalities</span> results.</h1>
          <p className="lede mt-4">Pick your four-letter type, then copy the five dimension percentages from your results email. You'll be recorded as {me.name} — never by name.</p>

          <div className="tip-callout mt-6">
            <span className="tip-mark">How to read</span>
            <div>Enter each dimension exactly as your results state it. <b>"72% Introverted"</b> → choose <b>Introverted (I)</b> and type <b>72</b>.</div>
          </div>

          {typeCode && (
            <div className="card mt-6" style={{borderColor: 'var(--rg)', padding: 20}} >
              <div className={`${classFor(typeCode)}`} style={{display:'flex', alignItems:'center', gap: 16}}>
                <div style={{
                  width: 56, height: 56, borderRadius: 12,
                  background: 'var(--rg)', color: '#fff',
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, letterSpacing: '.06em'
                }}>{typeCode}</div>
                <div>
                  <div className="serif" style={{fontSize: 24, lineHeight: 1.1}}>{TYPE_BY_CODE[typeCode].name}</div>
                  <div className="mt-2"><TagRole group={group} /></div>
                </div>
              </div>
            </div>
          )}

          {mismatch && (
            <div className="tip-callout mt-6" style={{borderColor: 'var(--accent)'}}>
              <span className="tip-mark" style={{color: 'var(--accent)'}}>Check</span>
              <div>Your percentages point to <b className="mono">{impliedCode || 'a different type'}</b>, but you selected <b className="mono">{typeCode}</b>. Double-check your results email — borderline scores can flip a letter.</div>
            </div>
          )}
        </div>

        <div className="stack-lg">
          <div className="card">
            <div className="card-head no-border">
              <div>
                <div className="section-num">Section 1</div>
                <h2 className="h2 mt-2">Your role type</h2>
              </div>
              <span className="tag-mute">16 types</span>
            </div>
            <div className="type-grid">
              {TYPES.map(t => (
                <button
                  key={t.code}
                  className={`type-card ${classFor(t.group)} ${typeCode === t.code ? 'selected' : ''}`}
                  aria-pressed={typeCode === t.code}
                  onClick={() => setTypeCode(t.code)}
                >
                  <div className="code">{t.code}</div>
                  <div className="nickname">{t.name}</div>
                  <div className="group">{t.group}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head no-border">
              <div>
                <div className="section-num">Section 2</div>
                <h2 className="h2 mt-2">Your five dimensions</h2>
                <div className="helper mt-2">For each dimension: pick the side your results name, and enter the percentage.</div>
              </div>
            </div>
            {DIMENSIONS.map(dim => (
              <DimensionInput key={dim.key} dim={dim} value={dims[dim.key]} onChange={(v) => setDim(dim.key, v)} />
            ))}
          </div>

          <div className="between">
            <span style={{display: 'flex', gap: 16}}>
              {onCancel && <button className="btn-link" onClick={onCancel}>← Back without saving</button>}
              {onPrev && (
                <button className="btn-link" onClick={onPrev}
                  title="Reopen the previous member's entry to correct it — their saved values stay filled in">
                  ← Previous member
                </button>
              )}
            </span>
            <div style={{textAlign: 'right'}}>
              {confirmNeutral && (
                <div className="helper mb-2" style={{color: 'var(--accent)'}}>
                  All five dimensions are still at neutral — enter your percentages, or press again to submit anyway.
                </div>
              )}
              <button
                className="btn btn-primary btn-lg"
                disabled={!canContinue}
                onClick={handleSubmit}
              >
                Submit my results <span className="arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// One dimension: pole choice + percentage, with a synced slider under it.
// `value` is the canonical 0–100 position (left pole = 0, right = 100).
function DimensionInput({ dim, value, onChange }) {
  const reading = poleReading(dim, value);
  const pole = reading.side;                 // 'left' | 'right' | null
  const pct = reading.pct;                   // dominant-pole percentage

  const commit = (side, p) => {
    const clamped = Math.max(50, Math.min(100, p));
    onChange(side === 'left' ? 100 - clamped : clamped);
  };

  const handlePole = (side) => {
    if (side === pole) return;
    commit(side, pct === 50 ? 51 : pct);     // keep the % when switching sides
  };

  const handlePct = (raw) => {
    if (raw === '') return;
    const p = parseInt(raw, 10);
    if (Number.isNaN(p)) return;
    commit(pole || 'left', p);
  };

  return (
    <div className="slider-wrap">
      <div className="slider-head">
        <span className="slider-name">{dim.name}</span>
        <span className="slider-val">
          {pole
            ? <><b style={{fontWeight: 500, color: 'var(--accent)'}}>{pct}%</b> {reading.name} <span style={{color:'var(--ink-mute)'}}>({reading.letter})</span></>
            : <span style={{color:'var(--ink-mute)'}}>50 / 50 — not set</span>}
        </span>
      </div>
      <div className="dim-entry">
        <div className="pole-toggle" role="radiogroup" aria-label={`${dim.name}: dominant side`}>
          <button
            role="radio" aria-checked={pole === 'left'}
            className={pole === 'left' ? 'selected' : ''}
            onClick={() => handlePole('left')}
          >{dim.left} <span className="mono">({dim.leftLetter})</span></button>
          <button
            role="radio" aria-checked={pole === 'right'}
            className={pole === 'right' ? 'selected' : ''}
            onClick={() => handlePole('right')}
          >{dim.right} <span className="mono">({dim.rightLetter})</span></button>
        </div>
        <div className="pct-entry">
          <input
            className="input pct-input" type="number" inputMode="numeric"
            min="50" max="100" step="1"
            value={pole ? pct : ''}
            placeholder="—"
            disabled={!pole}
            aria-label={`${dim.name} percentage`}
            onChange={e => handlePct(e.target.value)}
          />
          <span className="pct-sign">%</span>
        </div>
      </div>
      <div className="slider-rail">
        <div className="rail-bg" />
        <div className="rail-mid" />
        <input
          type="range" min="0" max="100" step="1"
          value={value} onChange={e => onChange(parseInt(e.target.value, 10))}
          aria-label={`${dim.name} position between ${dim.left} and ${dim.right}`}
        />
      </div>
      <div className="helper" style={{marginTop: 8}}>{dim.blurb}</div>
    </div>
  );
}

Object.assign(window, { LandingScreen, TeamSetupScreen, MemberHandoffScreen, MBInputScreen });
