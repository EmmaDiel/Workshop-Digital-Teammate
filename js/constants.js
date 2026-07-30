// === Shared constants ===
//
// Data conventions used throughout the app and in exports:
//  · Each member has an id ('m1'…), a number (1…n) and a display label
//    ("Member 1") — no names are collected anywhere.
//  · Each dimension value in member.dims is a 0–100 position on the
//    continuum from the LEFT pole (0) to the RIGHT pole (100); 50 is
//    neutral. 16Personalities percentages are complementary, so a result
//    of "72% Introverted" is position 28 on the I(0)→E(100) axis, i.e.
//    the position equals the right-pole percentage.

const TYPES = [
  // Analysts
  { code: 'INTJ', name: 'Architect',     group: 'Analysts' },
  { code: 'INTP', name: 'Logician',      group: 'Analysts' },
  { code: 'ENTJ', name: 'Commander',     group: 'Analysts' },
  { code: 'ENTP', name: 'Debater',       group: 'Analysts' },
  // Diplomats
  { code: 'INFJ', name: 'Advocate',      group: 'Diplomats' },
  { code: 'INFP', name: 'Mediator',      group: 'Diplomats' },
  { code: 'ENFJ', name: 'Protagonist',   group: 'Diplomats' },
  { code: 'ENFP', name: 'Campaigner',    group: 'Diplomats' },
  // Sentinels
  { code: 'ISTJ', name: 'Logistician',   group: 'Sentinels' },
  { code: 'ISFJ', name: 'Defender',      group: 'Sentinels' },
  { code: 'ESTJ', name: 'Executive',     group: 'Sentinels' },
  { code: 'ESFJ', name: 'Consul',        group: 'Sentinels' },
  // Explorers
  { code: 'ISTP', name: 'Virtuoso',      group: 'Explorers' },
  { code: 'ISFP', name: 'Adventurer',    group: 'Explorers' },
  { code: 'ESTP', name: 'Entrepreneur',  group: 'Explorers' },
  { code: 'ESFP', name: 'Entertainer',   group: 'Explorers' },
];

const TYPE_BY_CODE = Object.fromEntries(TYPES.map(t => [t.code, t]));

const ROLE_GROUPS = [
  {
    name: 'Analysts',
    letters: ['N', 'T'],
    types: ['INTJ','INTP','ENTJ','ENTP'],
    blurb: 'Intuitive (N) and Thinking (T) types. Rational, impartial, and intellectually rigorous.',
  },
  {
    name: 'Diplomats',
    letters: ['N', 'F'],
    types: ['INFJ','INFP','ENFJ','ENFP'],
    blurb: 'Intuitive (N) and Feeling (F) types. Empathetic, diplomatic, and idealistic.',
  },
  {
    name: 'Sentinels',
    letters: ['S', 'J'],
    types: ['ISTJ','ISFJ','ESTJ','ESFJ'],
    blurb: 'Observant (S) and Judging (J) types. Practical, structured, and focused on stability.',
  },
  {
    name: 'Explorers',
    letters: ['S', 'P'],
    types: ['ISTP','ISFP','ESTP','ESFP'],
    blurb: 'Observant (S) and Prospecting (P) types. Spontaneous, inventive, and flexible.',
  },
];

const DIMENSIONS = [
  { key: 'EI', name: 'Energy',   leftLetter: 'I', rightLetter: 'E', left: 'Introverted', right: 'Extraverted',
    blurb: 'Introverts recharge through solitude and are sensitive to external stimulation. Extraverts gain energy from social interaction.' },
  { key: 'SN', name: 'Mind',     leftLetter: 'S', rightLetter: 'N', left: 'Observant',   right: 'Intuitive',
    blurb: 'Observant types are practical and grounded in present realities. Intuitive types are imaginative and drawn to hidden meanings.' },
  { key: 'TF', name: 'Nature',   leftLetter: 'T', rightLetter: 'F', left: 'Thinking',    right: 'Feeling',
    blurb: 'Thinking types prioritise logic and efficiency. Feeling types lead with empathy and value social harmony.' },
  { key: 'JP', name: 'Tactics',  leftLetter: 'J', rightLetter: 'P', left: 'Judging',     right: 'Prospecting',
    blurb: 'Judging types prefer clear plans and predictability. Prospecting types thrive on flexibility and opportunity.' },
  { key: 'AT', name: 'Identity', leftLetter: 'A', rightLetter: 'T', left: 'Assertive',   right: 'Turbulent',
    blurb: 'Assertive types are calm under pressure. Turbulent types are stress-sensitive and driven by self-improvement.' },
];

const DIM_BY_KEY = Object.fromEntries(DIMENSIONS.map(d => [d.key, d]));

const STEPS = [
  { id: 'setup',    name: 'Team setup',           kicker: 'Step 0' },
  { id: 'mb',       name: 'Personality input',    kicker: 'Individual' },
  { id: 'profile',  name: 'Team profile',         kicker: 'Part 1' },
  { id: 'design',   name: 'Design teammate',      kicker: 'Part 2' },
  { id: 'evaluate', name: 'Test & refine',        kicker: 'Part 3' },
  { id: 'finish',   name: 'Save & reflect',       kicker: 'Part 4' },
];

// Sample members for demo mode (?demo=1) — pseudonymous, like real data.
const DEMO_MEMBERS = [
  { type: 'INFJ', dims: { EI: 32, SN: 78, TF: 71, JP: 28, AT: 64 } },
  { type: 'ENTJ', dims: { EI: 72, SN: 64, TF: 22, JP: 18, AT: 35 } },
  { type: 'ENFP', dims: { EI: 81, SN: 70, TF: 64, JP: 75, AT: 72 } },
  { type: 'INTP', dims: { EI: 38, SN: 82, TF: 28, JP: 66, AT: 48 } },
  { type: 'ISFJ', dims: { EI: 25, SN: 30, TF: 68, JP: 22, AT: 55 } },
];

function getGroup(typeCode) {
  return TYPE_BY_CODE[typeCode]?.group || 'Analysts';
}

function classFor(typeCodeOrGroup) {
  const g = TYPE_BY_CODE[typeCodeOrGroup]?.group || typeCodeOrGroup;
  return `role-${g}`;
}

function memberShort(member) {
  return 'M' + member.num;
}

// The dominant-pole reading of a 0–100 position, e.g. { pct: 72,
// name: 'Introverted', letter: 'I' }; neutral at exactly 50.
function poleReading(dim, position) {
  if (position === 50) return { pct: 50, name: 'Neutral', letter: '—', side: null };
  const rightward = position > 50;
  return {
    pct: Math.round(rightward ? position : 100 - position),
    name: rightward ? dim.right : dim.left,
    letter: rightward ? dim.rightLetter : dim.leftLetter,
    side: rightward ? 'right' : 'left',
  };
}

// Four-letter type implied by the entered dimensions (AT is the -A/-T
// suffix, not part of the four letters). Neutral (50) gives no letter.
function typeFromDims(dims) {
  const letter = (key) => {
    if (dims[key] === 50) return null;
    const dim = DIM_BY_KEY[key];
    return dims[key] > 50 ? dim.rightLetter : dim.leftLetter;
  };
  return [letter('EI'), letter('SN'), letter('TF'), letter('JP')];
}

// Full 16Personalities code incl. identity suffix, e.g. "INTJ-A".
function typeVariant(member) {
  if (!member.type) return null;
  const at = member.dims ? member.dims.AT : 50;
  return member.type + (at > 50 ? '-T' : '-A');
}

// === Shared components ===

function AppBar({ team, currentStepId, reachedIds, onJump, onReset }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);
  React.useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="appbar" data-screen-label="appbar">
      <img className="logo" src="assets/uu-logo.png" alt="Utrecht University" />
      <div className="title">Designing Your <em>Digital Teammate</em></div>
      <div className="spacer" />
      {team && team.demo && <span className="demo-pill">Demo data</span>}
      {team && team.code && (
        <div className="team-pill">
          <span>Team</span>
          <b style={{letterSpacing: '.14em'}}>{team.code}</b>
        </div>
      )}
      {onJump && (
        <div style={{position: 'relative'}} ref={menuRef}>
          <button className="quick-jump" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
            Menu <span style={{fontSize: '10px'}}>▾</span>
          </button>
          {menuOpen && (
            <div className="dropdown-menu" style={{color: 'var(--ink)'}}>
              <div className="menu-label">Go to step</div>
              {STEPS.map(s => {
                const reachable = reachedIds && reachedIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    className={currentStepId === s.id ? 'current' : ''}
                    disabled={!reachable}
                    style={reachable ? {} : {opacity: .4, cursor: 'default'}}
                    onClick={() => { if (reachable) { onJump(s.id); setMenuOpen(false); } }}
                  >
                    <span style={{fontFamily: 'var(--font-mono)', fontSize: '10px', opacity: .6, marginRight: 8}}>{s.kicker}</span>
                    {s.name}
                  </button>
                );
              })}
              {onReset && (
                <>
                  <div className="menu-label" style={{borderTop: '1px solid var(--line)', marginTop: 4, paddingTop: 10}}>Session</div>
                  <button style={{color: 'var(--accent)'}} onClick={() => { setMenuOpen(false); onReset(); }}>
                    Start over (erase this team's data)
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function Stepper({ steps, currentId }) {
  const currentIdx = steps.findIndex(s => s.id === currentId);
  return (
    <nav className="stepper" aria-label="Workshop progress">
      {steps.map((s, i) => {
        let state = '';
        if (i < currentIdx) state = 'done';
        else if (i === currentIdx) state = 'current';
        return (
          <div key={s.id} className={`step ${state}`}>
            <div className="dot">
              {state === 'done' ? '✓' : i + 1}
            </div>
            <div className="step-label">
              <span className="kicker">{s.kicker}</span>
              <span className="name">{s.name}</span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function Eyebrow({ children, muted }) {
  return <div className={`eyebrow ${muted ? 'muted' : ''}`}>{children}</div>;
}

function TagRole({ group, children }) {
  return (
    <span className={`tag-role role-${group}`}>
      <span className="swatch" />
      {children || group}
    </span>
  );
}

function MemberChip({ member, you }) {
  const group = member.type ? getGroup(member.type) : null;
  return (
    <span className={`member-chip ${member.type ? '' : 'pending'} ${you ? 'you' : ''} ${group ? classFor(group) : ''}`}>
      <span className="avatar">{memberShort(member)}</span>
      <span className="name">{member.name}{you && <span style={{color: 'var(--ink-mute)', marginLeft: 4}}>(you)</span>}</span>
      {member.type ? <span className="type">{member.type}</span> : <span className="type" style={{color: 'var(--ink-mute)'}}>waiting…</span>}
    </span>
  );
}

function TipCallout({ label = 'Tip', children }) {
  return (
    <div className="tip-callout">
      <span className="tip-mark">{label}</span>
      <div>{children}</div>
    </div>
  );
}

// Short reminder shown above free-text sections.
function PrivacyNote() {
  return (
    <div className="privacy-note" role="note">
      Please keep names and other identifying details out of your answers —
      here your team is simply <b>Team</b> and members are numbered.
    </div>
  );
}

// Footer
function Footer() {
  return (
    <footer className="footer">
      <span>Utrecht University, School of Economics · Workshop platform</span>
      <span className="powered">Everything you type stays on this device until your team downloads it.</span>
    </footer>
  );
}

// === Dimension bar (team aggregate) ===
function DimensionBar({ dim, members }) {
  // Each marker sits at the member's 0–100 position between the two poles
  // (see the convention note at the top of this file); the red marker is
  // the team average of those positions. The average is printed inline in
  // the row header (not as a hover tooltip — the workshop may run on touch
  // screens), and every member marker carries its visible M-code label.
  const withDims = members.filter(m => m.dims && m.dims[dim.key] != null);
  const positions = withDims.map(m => m.dims[dim.key]);
  const avg = positions.length ? positions.reduce((a,b) => a+b, 0) / positions.length : null;
  const avgReading = avg != null ? poleReading(dim, Math.round(avg)) : null;

  // Stagger labels of close-together markers between a lower and an upper
  // row inside the track so every label stays readable without hovering.
  const LABEL_GAP = 4; // min distance (in track %) between labels in a row
  const labelRow = {};
  const lastInRow = { 0: -Infinity, 1: -Infinity };
  [...withDims].sort((a, b) => a.dims[dim.key] - b.dims[dim.key]).forEach(m => {
    const p = m.dims[dim.key];
    const row = (p - lastInRow[0] >= LABEL_GAP) ? 0 : (p - lastInRow[1] >= LABEL_GAP) ? 1
      : (lastInRow[0] <= lastInRow[1] ? 0 : 1); // both crowded: least-recent row
    labelRow[m.id] = row;
    lastInRow[row] = p;
  });

  return (
    <div className="dim">
      <div className="dim-poles">
        <div className="dim-pole">
          {dim.left}
          <span className="pct">({dim.leftLetter})</span>
        </div>
        <span className="dim-name">
          {dim.name}
          {avgReading && (
            <span className="dim-avg">
              {' · team average '}
              {avgReading.side ? `${avgReading.pct}% ${avgReading.name}` : '50 / 50'}
            </span>
          )}
        </span>
        <div className="dim-pole">
          {dim.right}
          <span className="pct">({dim.rightLetter})</span>
        </div>
      </div>
      <div className="dim-track" style={{marginTop: 14}}>
        <span className="midline" />
        {withDims.map(m => {
          const r = poleReading(dim, m.dims[dim.key]);
          const pos = m.dims[dim.key];
          return (
            <React.Fragment key={m.id}>
              <span
                className="marker"
                style={{
                  left: `${pos}%`,
                  opacity: .65,
                  background: 'var(--ink-soft)',
                  width: 8, height: 8
                }}
                title={`${memberShort(m)}: ${r.side ? `${r.pct}% ${r.name}` : '50 / 50'}`}
              />
              <span
                className={`marker-label ${labelRow[m.id] === 1 ? 'row-upper' : 'row-lower'}`}
                style={{left: `${Math.max(2.5, Math.min(97.5, pos))}%`}}
              >{memberShort(m)}</span>
            </React.Fragment>
          );
        })}
        {avg != null && (
          <span className="marker team" style={{left: `${avg}%`}}
            title={avgReading.side ? `Team average: ${avgReading.pct}% ${avgReading.name}` : 'Team average: 50 / 50'} />
        )}
      </div>
    </div>
  );
}

// === Diamond plot (role group composition) ===
function DiamondPlot({ counts, total }) {
  // counts: { Analysts: n, Diplomats: n, Sentinels: n, Explorers: n }
  // total = max ring (e.g. total members)
  const size = 360;
  const cx = size / 2, cy = size / 2;
  const maxR = size / 2 - 36;

  // corner angles: Analysts=top, Diplomats=right, Sentinels=bottom, Explorers=left
  const angles = {
    Analysts:  -Math.PI / 2,
    Diplomats:  0,
    Sentinels:  Math.PI / 2,
    Explorers:  Math.PI,
  };
  const colors = {
    Analysts: 'var(--analysts)',
    Diplomats: 'var(--diplomats)',
    Sentinels: 'var(--sentinels)',
    Explorers: 'var(--explorers)',
  };

  // rings: 1 / 2 / 3 (or scale to total)
  const rings = Math.max(3, total || 3);

  const pointFor = (groupName, value) => {
    const a = angles[groupName];
    const r = (Math.min(value, rings) / rings) * maxR;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const polyPoints = ROLE_GROUPS.map(g => pointFor(g.name, counts[g.name] || 0)).map(p => p.join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" style={{display:'block'}} role="img"
      aria-label={'Role group diamond: ' + ROLE_GROUPS.map(g => `${g.name} ${counts[g.name] || 0}`).join(', ')}>
      {/* concentric guide rings */}
      {Array.from({length: rings}, (_, i) => {
        const r = ((i + 1) / rings) * maxR;
        return (
          <polygon
            key={i}
            points={Object.keys(angles).map(g => {
              const a = angles[g];
              return [cx + r * Math.cos(a), cy + r * Math.sin(a)].join(',');
            }).join(' ')}
            fill="none"
            stroke={i === rings - 1 ? 'var(--line-strong)' : 'var(--line)'}
            strokeDasharray={i === rings - 1 ? '0' : '3,3'}
          />
        );
      })}
      {/* axes */}
      {Object.keys(angles).map(g => {
        const a = angles[g];
        return (
          <line
            key={g}
            x1={cx} y1={cy}
            x2={cx + maxR * Math.cos(a)}
            y2={cy + maxR * Math.sin(a)}
            stroke="var(--line)"
          />
        );
      })}
      {/* filled diamond */}
      <polygon
        points={polyPoints}
        fill="rgba(192,10,53,0.08)"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* corner labels & values */}
      {ROLE_GROUPS.map(g => {
        const a = angles[g.name];
        const labelR = maxR + 24;
        const lx = cx + labelR * Math.cos(a);
        const ly = cy + labelR * Math.sin(a);
        const count = counts[g.name] || 0;
        const [px, py] = pointFor(g.name, count);
        return (
          <g key={g.name}>
            {count > 0 && (
              <circle cx={px} cy={py} r="6" fill={colors[g.name]} stroke="#fff" strokeWidth="2" />
            )}
            <text
              x={lx} y={ly}
              textAnchor={a === 0 ? 'start' : a === Math.PI ? 'end' : 'middle'}
              dominantBaseline={a === -Math.PI/2 ? 'baseline' : a === Math.PI/2 ? 'hanging' : 'middle'}
              fontFamily="Instrument Serif, serif"
              fontSize="18"
              fill="var(--ink)"
            >{g.name}</text>
            <text
              x={lx} y={ly + (a === -Math.PI/2 ? -22 : a === Math.PI/2 ? 22 : 18)}
              textAnchor={a === 0 ? 'start' : a === Math.PI ? 'end' : 'middle'}
              fontFamily="JetBrains Mono, monospace"
              fontSize="11"
              letterSpacing="2"
              fill={count > 0 ? colors[g.name] : 'var(--ink-mute)'}
            >{count} {count === 1 ? 'MEMBER' : 'MEMBERS'}</text>
          </g>
        );
      })}
    </svg>
  );
}

Object.assign(window, {
  TYPES, TYPE_BY_CODE, ROLE_GROUPS, DIMENSIONS, DIM_BY_KEY, STEPS, DEMO_MEMBERS,
  getGroup, classFor, memberShort, poleReading, typeFromDims, typeVariant,
  AppBar, Stepper, Eyebrow, TagRole, MemberChip, TipCallout, PrivacyNote, Footer,
  DimensionBar, DiamondPlot,
});
