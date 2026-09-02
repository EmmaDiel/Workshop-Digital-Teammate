// === Evaluate screen (Part 3) — test, evaluate, refine ===

const EVAL_TOPICS = [
  {
    id: 'A',
    code: 'A',
    title: 'Role Fit',
    mandatory: true,
    headline: 'Does your AI teammate actually behave like the role you designed it for?',
    lens: 'Team composition lens',
    bullets: [
      'Think back to the role you designed your CustomGPT to fill for this team. Give it a task that calls on that role — does it actually behave that way?',
    ],
    promptHint: 'Write a test prompt that calls specifically on the role you designed for.',
  },
  {
    id: 'B',
    code: 'B',
    title: 'Overreliance & Work Alienation',
    headline: 'Did your team engage critically — or did the AI end up doing the thinking for you?',
    lens: 'Try planting a subtle error',
    bullets: [
      'Give the AI a task that contains a subtly wrong or incomplete premise, and watch what your team does with the answer.',
    ],
    promptHint: 'Write a test prompt designed to reveal whether your team accepts AI output uncritically.',
  },
  {
    id: 'C',
    code: 'C',
    title: 'Sycophancy',
    headline: 'Does your AI agree too easily — validating ideas rather than challenging them?',
    lens: 'Push back and watch what it does',
    bullets: [
      'Push back on one of the AI\'s answers, or give it an idea your team doubts, and watch whether it challenges you or validates you.',
      'Should it ever disagree with the team — and does your prompt say so?',
    ],
    promptHint: 'Write a test prompt — push back on the AI or give it a clearly flawed idea to react to.',
  },
  {
    id: 'D',
    code: 'D',
    title: 'Reduced Diversity',
    headline: 'Are genuinely diverse perspectives in your team being suppressed by the AI?',
    lens: 'Ask for three different approaches',
    bullets: [
      'Ask your AI for three genuinely different approaches to your project — are they actually distinct?',
      'Are some voices in your team less reflected in its output?',
    ],
    promptHint: 'Write a test prompt asking the AI for diverse or contrarian perspectives on your project.',
  },
];

function EvaluateScreen({ team, designData, evalData, onChange, onContinue }) {
  const [activeId, setActiveId] = React.useState('A');
  const update = (k, v) => onChange({ ...evalData, [k]: v });

  const selected = evalData.selected || ['A'];
  const optionalSelected = selected.filter(s => s !== 'A');

  // Viewing a topic and including it in your evaluation are separate:
  // click a card to read it, use its circle to include it (A is fixed).
  const toggleOptional = (id) => {
    if (id === 'A') return;
    if (optionalSelected.includes(id)) {
      update('selected', selected.filter(s => s !== id));
    } else {
      if (optionalSelected.length >= 2) {
        // replace the first non-A
        update('selected', ['A', ...optionalSelected.slice(1), id]);
      } else {
        update('selected', [...selected, id]);
      }
    }
  };

  const activeTopic = EVAL_TOPICS.find(t => t.id === activeId);
  const isActiveSelected = selected.includes(activeId);

  // A team has "worked on" a topic once any of its four worksheet fields has
  // content. Used only to surface a reminder when they've done the work but
  // not ticked the topic — it never selects anything on their behalf, and it
  // never blocks navigation.
  const WORKSHEET_KEYS = ['prompt', 'happened', 'why', 'refine'];
  const hasNotes = (id) => WORKSHEET_KEYS.some(k => (evalData[`${id}.${k}`] || '').trim().length > 0);

  return (
    <div className="container-wide fade-in" data-screen-label="evaluate">
      <div className="between mb-6">
        <div>
          <Eyebrow>Part 3 · Test, evaluate & refine</Eyebrow>
          <h1 className="h-display mt-4">Stress-test your <em>teammate</em>.</h1>
          {/* Creative-project frame, touchpoint 3 of 3. Sets the scenario teams test
              within. The four worksheet fields below stay neutral — no creative language. */}
          <p className="lede mt-4">
            Test your teammate on the real work of making your creative group project, not on invented examples.
            Research on human–AI collaboration identifies recurring risks regardless of how carefully you designed your tool. Topic A is mandatory; pick two of the remaining three.
          </p>
        </div>
        <div style={{textAlign: 'right'}}>
          <button className="btn btn-primary btn-lg" onClick={onContinue}>
            Revise your prompt <span className="arrow">→</span>
          </button>
        </div>
      </div>

      {/* Topic selection band */}
      <div className="grid-4 mb-6">
        {EVAL_TOPICS.map(t => {
          const isSelected = selected.includes(t.id);
          const isActive = activeId === t.id;
          return (
            <div
              key={t.id}
              role="button" tabIndex={0}
              onClick={() => setActiveId(t.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveId(t.id); } }}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                background: isActive ? 'var(--bg-card)' : (isSelected ? 'var(--bg-card)' : 'var(--bg)'),
                border: '1px solid ' + (isActive ? 'var(--ink)' : (isSelected ? 'var(--line-strong)' : 'var(--line)')),
                borderRadius: 'var(--radius-lg)',
                padding: 20,
                position: 'relative',
                opacity: 1,
              }}
            >
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                marginBottom: 10
              }}>
                <span style={{
                  fontFamily:'var(--font-mono)', fontSize: 11, letterSpacing: '.14em',
                  color: t.mandatory ? 'var(--accent)' : 'var(--ink-mute)', textTransform: 'uppercase'
                }}>{t.mandatory ? 'Mandatory · A' : `Optional · ${t.code}`}</span>
                {t.mandatory ? (
                  <span className="topic-include selected mandatory" aria-hidden="true">✓</span>
                ) : (
                  <button
                    type="button"
                    className={`topic-include ${isSelected ? 'selected' : ''}`}
                    role="checkbox" aria-checked={isSelected}
                    aria-label={`Include topic ${t.code} — ${t.title}`}
                    title={isSelected ? 'Click to drop this topic' : 'Click to include this topic'}
                    onClick={(e) => { e.stopPropagation(); toggleOptional(t.id); }}
                  >{isSelected ? '✓' : ''}</button>
                )}
              </div>
              <div style={{fontFamily:'var(--font-serif)', fontSize: 22, color:'var(--ink)', lineHeight: 1.15}}>{t.title}</div>
              <div className="helper mt-2" style={{fontSize: 13}}>{t.headline}</div>
              {!t.mandatory && !isSelected && optionalSelected.length >= 2 && (
                <div style={{
                  fontSize: 11, color: 'var(--ink-mute)', fontStyle: 'italic',
                  marginTop: 10
                }}>Including this will replace one above.</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'flex-start'
      }}>
        {/* === Active topic detail === */}
        <main className="card" key={activeId}>
          <div className="card-head">
            <div>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize: 11, letterSpacing: '.14em',
                color: activeTopic.mandatory ? 'var(--accent)' : 'var(--ink-mute)', textTransform: 'uppercase'
              }}>Topic {activeTopic.code} · {activeTopic.mandatory ? 'Mandatory' : (isActiveSelected ? 'Included' : 'Not included')}</div>
              <h2 className="h1 mt-2" style={{fontSize: 30}}>{activeTopic.title}</h2>
              <p className="lede mt-4" style={{fontSize: 15}}>{activeTopic.headline}</p>
            </div>
            {!activeTopic.mandatory && (
              <button className={`btn btn-sm ${isActiveSelected ? 'btn-dark' : 'btn-ghost'}`}
                onClick={() => toggleOptional(activeId)}>
                {isActiveSelected ? 'Included ✓' : 'Include this topic'}
              </button>
            )}
          </div>

          {/* Team composition lens */}
          <div className="tip-callout" style={{flexDirection:'column', alignItems:'flex-start', gap: 14}}>
            <div className="tip-mark">{activeTopic.lens}</div>
            <ul style={{margin: 0, paddingLeft: 18, fontSize: 14, color: 'var(--ink-soft)', display:'grid', gap: 10}}>
              {activeTopic.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>

          {/* The 4-step worksheet */}
          <div className="stack-lg mt-8">
            <div className="field">
              <label>① Test prompt</label>
              <div className="sub">{activeTopic.promptHint}</div>
              <textarea
                className="textarea mono" rows={3}
                value={evalData[`${activeId}.prompt`] || ''}
                onChange={e => update(`${activeId}.prompt`, e.target.value)}
                placeholder="Paste or write the prompt you'll send to your CustomGPT…"
                style={{fontSize: 13}}
              />
            </div>

            <div className="field">
              <label>② What happened?</label>
              <div className="sub">Paste the AI's response, or paraphrase what you observed.</div>
              <textarea
                className="textarea" rows={4}
                value={evalData[`${activeId}.happened`] || ''}
                onChange={e => update(`${activeId}.happened`, e.target.value)}
                placeholder="It responded by..."
              />
            </div>

            <div className="field">
              <label>③ Why do you think it responded this way?</label>
              <textarea
                className="textarea" rows={3}
                value={evalData[`${activeId}.why`] || ''}
                onChange={e => update(`${activeId}.why`, e.target.value)}
                placeholder="Likely because our prompt..."
              />
            </div>

            <div className="field">
              <label>④ How will you refine your system prompt?</label>
              <div className="sub">Be concrete. What sentence are you adding, removing, or rewording?</div>
              <textarea
                className="textarea" rows={3}
                value={evalData[`${activeId}.refine`] || ''}
                onChange={e => update(`${activeId}.refine`, e.target.value)}
                placeholder="Add to ground rules: 'When given a task that calls for analytical critique…' "
              />
            </div>
          </div>

          {/* Reminder, not a gate: the team has written notes here but hasn't
              ticked this topic. Offers the tick inline; navigation is unaffected. */}
          {!activeTopic.mandatory && !isActiveSelected && hasNotes(activeId) && (
            <div className="tip-callout mt-6" style={{borderColor: 'var(--accent)'}}>
              <span className="tip-mark" style={{color: 'var(--accent)'}}>Not yet included</span>
              <div>
                You've written notes for Topic {activeTopic.code}, but it isn't ticked as one of your
                two optional topics. Your notes are saved either way — ticking it just brings them
                into the next step.
                <div className="mt-3">
                  <button className="btn btn-dark btn-sm" onClick={() => toggleOptional(activeId)}>
                    Include Topic {activeTopic.code}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="between mt-8" style={{paddingTop: 24, borderTop: '1px solid var(--line)'}}>
            <button
              className="btn btn-ghost"
              onClick={() => {
                const i = EVAL_TOPICS.findIndex(t => t.id === activeId);
                if (i > 0) setActiveId(EVAL_TOPICS[i - 1].id);
              }}
              disabled={EVAL_TOPICS.findIndex(t => t.id === activeId) === 0}
            >← Previous topic</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                const i = EVAL_TOPICS.findIndex(t => t.id === activeId);
                if (i < EVAL_TOPICS.length - 1) setActiveId(EVAL_TOPICS[i + 1].id);
                else onContinue();
              }}
            >
              {EVAL_TOPICS.findIndex(t => t.id === activeId) === EVAL_TOPICS.length - 1
                ? 'Revise your prompt'
                : 'Next topic'} <span className="arrow">→</span>
            </button>
          </div>
        </main>

        {/* === Sidebar: progress + current prompt === */}
        <aside style={{position: 'sticky', top: 160, display:'flex', flexDirection:'column', gap: 20}}>
          <div className="card">
            <div className="section-num">Your selection</div>
            <div className="stack-sm mt-4">
              {EVAL_TOPICS.map(t => (
                <div key={t.id} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding: '8px 0', borderTop: '1px solid var(--line)',
                  ...(t.id === EVAL_TOPICS[0].id ? {borderTop: 0, paddingTop: 0} : {})
                }}>
                  <div>
                    <div style={{
                      fontFamily:'var(--font-mono)', fontSize: 10, letterSpacing: '.14em',
                      color: t.mandatory ? 'var(--accent)' : 'var(--ink-mute)', textTransform: 'uppercase'
                    }}>{t.code}{t.mandatory && ' · req.'}</div>
                    <div style={{fontSize: 13, color:'var(--ink)'}}>{t.title}</div>
                  </div>
                  {selected.includes(t.id) ? (
                    <span style={{
                      fontSize: 11, fontFamily:'var(--font-mono)', letterSpacing:'.12em', textTransform:'uppercase',
                      color: t.mandatory ? 'var(--accent)' : 'var(--ink)'
                    }}>Included</span>
                  ) : hasNotes(t.id) ? (
                    /* Notes written but never ticked — always visible in the
                       sticky rail, and clicking it includes the topic. */
                    <button type="button" onClick={() => toggleOptional(t.id)}
                      title={`You've written notes for Topic ${t.code} — click to include it`}
                      style={{
                        fontSize: 11, fontFamily:'var(--font-mono)', letterSpacing:'.12em', textTransform:'uppercase',
                        color: 'var(--accent)', textAlign: 'right', lineHeight: 1.3
                      }}>Notes ·<br/>not included</button>
                  ) : (
                    <span style={{
                      fontSize: 11, fontFamily:'var(--font-mono)', letterSpacing:'.12em', textTransform:'uppercase',
                      color: 'var(--ink-mute)'
                    }}>Skipped</span>
                  )}
                </div>
              ))}
            </div>
            <div className="helper mt-4" style={{fontSize: 12}}>
              {optionalSelected.length === 0 && 'Pick 2 optional topics.'}
              {optionalSelected.length === 1 && 'Pick 1 more.'}
              {optionalSelected.length === 2 && 'You\'re set. Including a third will replace one.'}
            </div>
          </div>

          <div>
            <div className="section-num mb-2">Current system prompt</div>
            <PromptPreview team={team} designData={designData} />
          </div>
        </aside>
      </div>
    </div>
  );
}

// === Revision screen (Part 3, after testing) — apply what testing taught ===
// Teams edit their B1–B5 answers with their own refinement notes alongside
// and the prompt preview updating live. To continue they either change at
// least one field or explicitly record that no changes were needed (5.4) —
// declining to revise is a finding, not a failure.
function RevisionScreen({ team, designData, onChange, evalData, designV1, savedRationale, onContinue }) {
  const [noChange, setNoChange] = React.useState(false);
  const [rationale, setRationale] = React.useState(savedRationale || '');
  const [needAction, setNeedAction] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Show every refinement note the team wrote — including for topics they
  // never ticked as "included". Filtering by `selected` here used to hide a
  // team's own notes and then tell them they hadn't written any. The tick and
  // the text are exported as separate fields, so no signal is lost by showing
  // both here.
  const refines = EVAL_TOPICS
    .map(t => ({ topic: t, text: evalData[`${t.id}.refine`] || '' }))
    .filter(r => r.text.trim().length > 0);

  const sections = DESIGN_SECTIONS.filter(s => s.id !== 'B6');
  const v1 = designV1 || {};
  const editedKeys = sections.flatMap(s => s.questions.map(q => `${s.id}.${q.id}`))
    .filter(k => ((designData[k] ?? '') + '') !== ((v1[k] ?? '') + ''));
  const edited = editedKeys.length > 0;

  const updateAnswer = (sectionId, qId, value) => {
    onChange({ ...designData, [`${sectionId}.${qId}`]: value });
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildPromptText(team, designData));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.warn('Clipboard unavailable:', err);
    }
  };

  const handleContinue = () => {
    if (!edited && !noChange) { setNeedAction(true); return; }
    onContinue({ rationale: noChange ? rationale : '' });
  };

  return (
    <div className="container-wide fade-in" data-screen-label="revise">
      <div className="between mb-6">
        <div>
          <Eyebrow>Part 3 · Revise</Eyebrow>
          <h1 className="h-display mt-4">Your <em>final</em> CustomGPT prompt.</h1>
          <p className="lede mt-4">Use what testing taught you: edit any field below — the prompt on the right updates as you type. Then update your CustomGPT in EduGenAI so it actually runs the new version.</p>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24, alignItems: 'flex-start'}}>
        {/* === Editable design fields (B1–B5) === */}
        <main className="card">
          <div className="card-head">
            <div>
              <div className="section-num">Revise your design</div>
              <h2 className="h2 mt-2">All your answers, editable</h2>
              <p className="helper mt-2" style={{fontSize: 13}}>B6 (your reflection) is recorded but isn't part of the prompt, so it isn't revised here.</p>
            </div>
            {edited && (
              <span className="tag-mute" style={{color: 'var(--diplomats)'}}>
                {editedKeys.length} field{editedKeys.length === 1 ? '' : 's'} changed
              </span>
            )}
          </div>
          <div className="stack-lg">
            {sections.map(s => (
              <div key={s.id}>
                <div className="section-num" style={{marginBottom: 4}}>{s.kicker} · {s.title}</div>
                <div className="stack-md">
                  {s.questions.map(q => (
                    <DesignQuestion
                      key={q.id}
                      q={q}
                      value={designData[`${s.id}.${q.id}`] ?? ''}
                      onChange={(v) => updateAnswer(s.id, q.id, v)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* === Reference notes, live prompt, deploy & continue === */}
        <aside className="stack-md">
          <div className="card">
            <div className="section-num">Your refinement notes from testing</div>
            {refines.length > 0 ? (
              <div className="stack-md mt-4">
                {refines.map(r => (
                  <div key={r.topic.id} style={{borderLeft: '2px solid var(--accent)', paddingLeft: 16}}>
                    <div className="section-num">Topic {r.topic.code} · {r.topic.title}</div>
                    <div style={{fontSize: 14, color: 'var(--ink)', marginTop: 6, fontFamily:'var(--font-serif)', fontStyle: 'italic', lineHeight: 1.5}}>
                      "{r.text}"
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="helper mt-3" style={{fontSize: 13}}>You didn't note any refinements during testing. If testing changed your mind about anything, edit the fields directly.</p>
            )}
          </div>

          <div>
            <div className="section-num mb-2">Live prompt — updates as you edit</div>
            <PromptPreview team={team} designData={designData} />
          </div>

          <div className="card">
            <div className="section-num">Before you continue</div>
            <h3 className="h2 mt-2" style={{fontSize: 18}}>Update your CustomGPT in EduGenAI</h3>
            <ol className="helper mt-3" style={{fontSize: 13, paddingLeft: 18, display: 'grid', gap: 6}}>
              <li><b>Copy</b> the final prompt.</li>
              <li>In <a href="https://edugenai.npuls.nl/" target="_blank" rel="noreferrer">EduGenAI</a>, open your CustomGPT and <b>replace its instructions</b> with the new version — otherwise it keeps running the old one.</li>
            </ol>
            <button className="btn btn-dark mt-4" style={{width: '100%'}} onClick={copyPrompt}>
              {copied ? 'Copied ✓' : 'Copy final prompt'}
            </button>

            <div className="divider" />

            {!edited && (
              <button type="button" className={`check ${noChange ? 'checked' : ''}`}
                role="checkbox" aria-checked={noChange}
                onClick={() => { setNoChange(v => !v); setNeedAction(false); }}>
                <div className="box" />
                <div className="check-label">
                  <div className="check-title">We reviewed our prompt and decided no changes were needed.</div>
                  <div className="check-sub">Also a valid outcome — say briefly why below.</div>
                </div>
              </button>
            )}
            {!edited && noChange && (
              <input className="input mt-3" value={rationale} placeholder="One line: why no changes?"
                onChange={e => setRationale(e.target.value)} />
            )}
            {needAction && !edited && !noChange && (
              <div className="helper mt-3" style={{color: 'var(--accent)', fontSize: 12}}>
                Either edit at least one field above, or tick the box to record that your team reviewed the prompt and kept it as is.
              </div>
            )}

            <button className="btn btn-primary btn-lg mt-4" style={{width: '100%'}} onClick={handleContinue}>
              Save your team's work <span className="arrow">→</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, { EvaluateScreen, RevisionScreen, EVAL_TOPICS });
