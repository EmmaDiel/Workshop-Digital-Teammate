// === Main app — state, routing, persistence ===
const { useState, useEffect, useMemo } = React;

// Internal step order (the visible stepper groups some of these).
const STEP_ORDER = ['landing', 'setup', 'mb', 'profile', 'design', 'evaluate', 'revise', 'export', 'done'];

// Map an internal step to the stepper/menu indicator id.
function stepIndicatorId(step) {
  switch (step) {
    case 'landing':
    case 'setup':    return 'setup';
    case 'mb':       return 'mb';
    case 'profile':  return 'profile';
    case 'design':   return 'design';
    case 'evaluate':
    case 'revise':   return 'evaluate';
    case 'export':
    case 'done':     return 'finish';
    default:         return 'setup';
  }
}

// Design-data keys that make up the prompt (B1–B5; B6 is a reflection
// instrument). Used for the v1/v2 revision diff.
const PROMPT_FIELD_KEYS = () => DESIGN_SECTIONS
  .filter(s => s.id !== 'B6')
  .flatMap(s => s.questions.map(q => `${s.id}.${q.id}`));

// Where the menu lands when jumping to an indicator id.
const JUMP_TARGET = { setup: 'setup', mb: 'mb', profile: 'profile', design: 'design', evaluate: 'evaluate', finish: 'export' };

function generateCode() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const n = '23456789';
  const ch = (s) => s[Math.floor(Math.random() * s.length)];
  return ch(a) + ch(a) + ch(n) + '-' + ch(n) + ch(a) + ch(a);
}

function makeMembers(size) {
  return Array.from({ length: size }, (_, i) => ({
    id: 'm' + (i + 1), num: i + 1, name: 'Member ' + (i + 1), type: null, dims: null,
  }));
}

function freshTeam() {
  return { code: '', size: 0, members: [], demo: false };
}

// Sample team for ?demo=1 — lets a facilitator walk the whole flow without
// entering data. Exports produced from it are stamped demo:true.
function demoState() {
  const team = {
    code: 'DEMO' + '-' + generateCode().slice(0, 2),
    size: DEMO_MEMBERS.length,
    demo: true,
    members: DEMO_MEMBERS.map((d, i) => ({
      id: 'm' + (i + 1), num: i + 1, name: 'Member ' + (i + 1), type: d.type, dims: { ...d.dims },
    })),
  };
  const designData = {
    'B1.name': 'The Devil\'s Advocate',
    'B1.role': 'A rigorous critic for our team. Pushes back on every assumption in our 100-day plan with the strongest counter-argument available, names the weakest evidence, and refuses to write the plan for us.',
    'B1.humanRole': 'Final decisions on scope, sequencing and team direction. Synthesis of debate into a recommendation. All client-facing language.',
    'B2.groundRules': 'When the team is wrong, say so directly and cite where in our reasoning the gap appears. When uncertain, say so explicitly rather than hedging. Never agree just to keep the conversation pleasant. Never produce a final deliverable. Always ask one clarifying question before answering vague briefs.',
    'B6.primaryRoles': ['debate'],
  };
  const part1Data = {
    surprise: 'M2 expected a different result for M4; the rest matched expectations.',
    spread: 'Most spread on Energy, clustered on Mind.',
    strengths: 'Strong on ideas and planning; follow-through is thinner.',
  };
  return {
    step: 'profile', mbView: 'input', activeMemberId: null, editReturn: null,
    team, designData, part1Data, evalData: { selected: ['A'] }, exported: false,
    designV1: null, promptV1: null, designV2: null, promptV2: null,
    changedFields: [], noChangeRationale: '',
    furthestIdx: STEP_ORDER.indexOf('export'),
  };
}

function initialState() {
  return {
    step: 'landing', mbView: 'input', activeMemberId: null, editReturn: null,
    team: freshTeam(), designData: {}, part1Data: { surprise: '', spread: '', strengths: '' },
    evalData: { selected: ['A'] }, exported: false,
    designV1: null, promptV1: null, designV2: null, promptV2: null,
    changedFields: [], noChangeRationale: '',
    furthestIdx: 0,
  };
}

function App() {
  const [state, setState] = useState(() =>
    new URLSearchParams(window.location.search).has('demo') ? demoState() : initialState());
  const [savedSession, setSavedSession] = useState(() => loadSession());

  const { step, mbView, activeMemberId, editReturn, team, designData, part1Data, evalData, exported,
    designV1, promptV1, designV2, promptV2, changedFields, noChangeRationale, furthestIdx } = state;

  const patch = (p) => setState(s => {
    const next = { ...s, ...p };
    next.furthestIdx = Math.max(next.furthestIdx, STEP_ORDER.indexOf(next.step));
    // 5.2 — snapshot v1 the moment the team first enters Part 3: this is
    // by definition the prompt they deployed and tested against. Never
    // overwritten, whatever navigation happens afterwards.
    if (next.step === 'evaluate' && next.designV1 == null) {
      next.designV1 = { ...next.designData };
      next.promptV1 = buildPromptText(next.team, next.designData);
    }
    return next;
  });

  // Autosave everything after every change (skip demo runs and the
  // pre-team landing state so a stale resume card never appears).
  useEffect(() => {
    if (team.demo || !team.code) return;
    saveSession(state);
  }, [state]);

  // === Actions ===
  const handleCreate = ({ size }) => {
    patch({ team: { code: generateCode(), size, members: makeMembers(size), demo: false } });
  };

  const handleBeginMembers = () => {
    patch({ step: 'mb', mbView: 'input', activeMemberId: team.members[0].id });
  };

  const handleSaveMB = ({ type, dims }) => {
    const members = team.members.map(m => m.id === activeMemberId ? { ...m, type, dims } : m);
    const nextTeam = { ...team, members };
    if (editReturn === 'mb-back') {
      // Came here via "← Previous member": resume the sequence at the
      // first member still missing results (input view, no interstitial).
      const pending = members.find(m => !m.type);
      if (pending) patch({ team: nextTeam, activeMemberId: pending.id, mbView: 'input', editReturn: null });
      else patch({ team: nextTeam, step: 'profile', activeMemberId: null, editReturn: null });
      return;
    }
    if (editReturn) {
      patch({ team: nextTeam, step: editReturn, editReturn: null, activeMemberId: null });
      return;
    }
    const next = members.find(m => !m.type);
    if (next) {
      patch({ team: nextTeam, mbView: 'handoff', activeMemberId: next.id });
    } else {
      patch({ team: nextTeam, step: 'profile', activeMemberId: null });
    }
  };

  const handleEditMember = (memberId) => {
    patch({ step: 'mb', mbView: 'input', activeMemberId: memberId, editReturn: 'profile' });
  };

  // "← Previous member" during the entry sequence (1.2) — reopens the
  // previous member's saved entry via the same editReturn mechanism the
  // Team Profile edit buttons use.
  const handlePrevMember = () => {
    const idx = team.members.findIndex(m => m.id === activeMemberId);
    if (idx <= 0) return;
    patch({ activeMemberId: team.members[idx - 1].id, mbView: 'input', editReturn: 'mb-back' });
    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => {
    if (editReturn === 'mb-back') {
      const pending = team.members.find(m => !m.type);
      if (pending) patch({ activeMemberId: pending.id, mbView: 'input', editReturn: null });
      else patch({ step: 'profile', activeMemberId: null, editReturn: null });
    } else {
      patch({ step: editReturn, editReturn: null, activeMemberId: null });
    }
  };

  const handleResume = () => {
    if (!savedSession) return;
    const s = { ...initialState(), ...savedSession };
    if (s.step === 'output') s.step = 'revise';  // pre-2.0 sessions
    setState(s);
  };

  const handleDiscardSaved = () => {
    clearSession();
    setSavedSession(null);
  };

  const handleReset = () => {
    const ok = window.confirm(
      'Start over? This erases this team\'s answers from the browser. ' +
      'Make sure the team file has been downloaded first.');
    if (!ok) return;
    clearSession();
    setSavedSession(null);
    setState(initialState());
    window.scrollTo(0, 0);
  };

  const handleJump = (indicatorId) => {
    let target = JUMP_TARGET[indicatorId] || 'setup';
    if (target === 'mb') {
      const pending = team.members.find(m => !m.type);
      if (!pending) target = 'profile';
      else patch({ activeMemberId: pending.id, mbView: 'handoff' });
    }
    patch({ step: target });
    window.scrollTo(0, 0);
  };

  const goTo = (s) => { patch({ step: s }); window.scrollTo(0, 0); };

  // 5.5 — leaving the revision screen: store v2 and compute the diff
  // against v1 here, in one place, so no navigation path can corrupt it.
  const handleReviseContinue = ({ rationale }) => {
    const v1 = designV1 || {};
    const changed = PROMPT_FIELD_KEYS().filter(k => ((designData[k] ?? '') + '') !== ((v1[k] ?? '') + ''));
    patch({
      designV2: { ...designData },
      promptV2: buildPromptText(team, designData),
      changedFields: changed,
      noChangeRationale: (rationale || '').trim(),
      step: 'export',
    });
    window.scrollTo(0, 0);
  };

  // Menu entries the team has already reached (by furthest internal step).
  const reachedIds = useMemo(() => {
    const ids = [];
    for (let i = 0; i <= furthestIdx && i < STEP_ORDER.length; i++) {
      const id = stepIndicatorId(STEP_ORDER[i]);
      if (!ids.includes(id)) ids.push(id);
    }
    return ids;
  }, [furthestIdx]);

  const indicatorId = stepIndicatorId(step);
  const showStepper = step !== 'landing';
  const activeMember = team.members.find(m => m.id === activeMemberId) || team.members[0];

  return (
    <div className="app">
      <AppBar
        team={team.code ? team : null}
        currentStepId={indicatorId}
        reachedIds={reachedIds}
        onJump={team.code ? handleJump : null}
        onReset={team.code ? handleReset : null}
      />
      {showStepper && <Stepper steps={STEPS} currentId={indicatorId} />}

      <main className="main">
        {step === 'landing' && (
          <LandingScreen
            savedSession={savedSession}
            onStart={() => goTo('setup')}
            onResume={handleResume}
            onDiscardSaved={handleDiscardSaved}
          />
        )}
        {step === 'setup' && (
          <TeamSetupScreen
            team={team.code ? team : null}
            onCreate={handleCreate}
            onBegin={handleBeginMembers}
            onBack={() => goTo('landing')}
          />
        )}
        {step === 'mb' && activeMember && (mbView === 'handoff' && !editReturn ? (
          <MemberHandoffScreen
            team={team}
            nextMember={activeMember}
            onBegin={() => patch({ mbView: 'input' })}
          />
        ) : (
          <MBInputScreen
            key={activeMember.id}
            team={team}
            member={activeMember}
            onSave={handleSaveMB}
            onPrev={(!editReturn || editReturn === 'mb-back') && team.members.findIndex(m => m.id === activeMember.id) > 0
              ? handlePrevMember : null}
            onCancel={editReturn ? handleCancelEdit : null}
          />
        ))}
        {step === 'profile' && (
          <TeamProfileScreen
            team={team}
            part1Data={part1Data}
            onPart1Change={(d) => patch({ part1Data: d })}
            onContinue={() => goTo('design')}
            onEditMember={handleEditMember}
          />
        )}
        {step === 'design' && (
          <DesignScreen
            team={team}
            designData={designData}
            onChange={(d) => patch({ designData: d })}
            onContinue={() => goTo('evaluate')}
          />
        )}
        {step === 'evaluate' && (
          <EvaluateScreen
            team={team}
            designData={designData}
            evalData={evalData}
            onChange={(d) => patch({ evalData: d })}
            onContinue={() => goTo('revise')}
          />
        )}
        {step === 'revise' && (
          <RevisionScreen
            team={team}
            designData={designData}
            onChange={(d) => patch({ designData: d })}
            evalData={evalData}
            designV1={designV1}
            savedRationale={noChangeRationale}
            onContinue={handleReviseContinue}
          />
        )}
        {step === 'export' && (
          <ExportScreen
            team={team}
            designData={designData}
            evalData={evalData}
            extras={{ part1Data, designV1, promptV1, designV2, promptV2, changedFields, noChangeRationale }}
            exported={exported}
            onExported={() => patch({ exported: true })}
            onContinue={() => goTo('done')}
          />
        )}
        {step === 'done' && (
          <HandoffScreen
            team={team}
            designData={designData}
            evalData={evalData}
            onRestart={handleReset}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

Object.assign(window, { stepIndicatorId });

// Mount
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
