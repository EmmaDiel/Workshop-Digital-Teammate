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
      'In Part 1 you identified which role groups are absent or under-represented. Does your AI actually compensate for that gap?',
      'Give it a task that specifically calls on the strengths of the missing role group. Does it respond accordingly — or does it drift into generic assistance?',
      'Example: if you designed it to compensate for a lack of Analysts, does it push back logically and challenge your reasoning, or does it just agree and elaborate?',
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
      'Try giving the AI a task with a subtly wrong or incomplete answer embedded in it. What happens?',
      'What design features in your prompt could actively encourage critical engagement rather than passive acceptance?',
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
      'An AI that mirrors warmth and avoids disagreement can feel supportive while quietly suppressing critical debate.',
      'Try pushing back on the AI\'s answer, or deliberately give it a flawed idea and observe whether it challenges you or validates you.',
      'Should your AI ever disagree with the team? Under what circumstances — and is that written clearly into your prompt?',
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
      'Ask your AI to generate three genuinely different approaches to your project. Are the outputs actually distinct, or variations on the same theme?',
      'Consider the role group mix in your team — are some voices less reflected in the AI\'s output?',
      'Does your prompt encourage unexpected, contrarian, or minority perspectives — or does it default to the most likely answer?',
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

  return (
    <div className="container-wide fade-in" data-screen-label="evaluate">
      <div className="between mb-6">
        <div>
          <Eyebrow>Part 3 · Test, evaluate & refine</Eyebrow>
          <h1 className="h-display mt-4">Stress-test your <em>teammate</em>.</h1>
          <p className="lede mt-4">
            Research on human–AI collaboration identifies recurring risks regardless of how carefully you designed your tool. Topic A is mandatory; pick two of the remaining three.
          </p>
        </div>
        <div style={{textAlign: 'right'}}>
          <button className="btn btn-primary btn-lg" onClick={onContinue}>
            See refined prompt <span className="arrow">→</span>
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
                ? 'See refined prompt'
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

// === Refined prompt screen (between evaluate & export) ===
function PromptOutputScreen({ team, designData, evalData, onContinue }) {
  const refines = EVAL_TOPICS
    .filter(t => (evalData.selected || ['A']).includes(t.id))
    .map(t => ({ topic: t, text: evalData[`${t.id}.refine`] || '' }))
    .filter(r => r.text.trim().length > 0);

  return (
    <div className="container fade-in" data-screen-label="prompt-output">
      <div className="between mb-6">
        <div>
          <Eyebrow>Part 3 · Refined prompt</Eyebrow>
          <h1 className="h-display mt-4">Your <em>final</em> CustomGPT brief.</h1>
          <p className="lede mt-4">Copy this prompt into ChatGPT (Custom GPT or Project Instructions), Claude Projects, or any system-prompt field. You can iterate further with your team.</p>
        </div>
        <div style={{textAlign:'right'}}>
          <button className="btn btn-primary btn-lg" onClick={onContinue}>
            Save your team's work <span className="arrow">→</span>
          </button>
        </div>
      </div>

      <div className="grid-2" style={{gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'flex-start'}}>
        <div>
          <PromptPreview team={team} designData={designData} big />
          {refines.length > 0 && (
            <div className="card mt-6">
              <div className="section-num">Refinements logged in testing</div>
              <h3 className="h2 mt-2" style={{fontSize: 18}}>Add these to your prompt before deploying</h3>
              <div className="stack-md mt-6">
                {refines.map(r => (
                  <div key={r.topic.id} style={{borderLeft: '2px solid var(--accent)', paddingLeft: 16}}>
                    <div className="section-num">Topic {r.topic.code} · {r.topic.title}</div>
                    <div style={{fontSize: 14, color: 'var(--ink)', marginTop: 6, fontFamily:'var(--font-serif)', fontStyle: 'italic', lineHeight: 1.5}}>
                      "{r.text}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside style={{position:'sticky', top: 160}} className="stack-md">
          <div className="card">
            <div className="section-num">Drop into</div>
            <h3 className="h2 mt-2" style={{fontSize: 18}}>Where to deploy this prompt</h3>
            <div className="stack-sm mt-4">
              {['Custom GPT — System instructions', 'Claude Project — Custom instructions', 'Gemini Gem — Behaviour', 'Any system prompt field'].map(p => (
                <div key={p} className="between" style={{padding: '10px 0', borderTop: '1px solid var(--line)'}}>
                  <span style={{fontSize: 13}}>{p}</span>
                  <span className="kbd">paste</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-bare">
            <div className="section-num">After deployment</div>
            <h3 className="h2 mt-2" style={{fontSize: 18}}>Keep iterating</h3>
            <p className="helper mt-3" style={{fontSize: 13}}>Run the same four testing topics every 2–3 weeks. Your prompt should evolve as your project evolves and as you learn how the AI behaves in real work.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, { EvaluateScreen, PromptOutputScreen, EVAL_TOPICS });
