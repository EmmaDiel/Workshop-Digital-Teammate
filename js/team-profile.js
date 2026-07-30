// === Team profile screen (Part 1) ===

function TeamProfileScreen({ team, part1Data, onPart1Change, onContinue, onEditMember }) {
  const members = team.members.filter(m => m.type);

  // Count by role group
  const counts = {};
  ROLE_GROUPS.forEach(g => counts[g.name] = 0);
  members.forEach(m => { const g = getGroup(m.type); counts[g] = (counts[g] || 0) + 1; });

  // Identify over/under-represented groups
  const max = Math.max(...Object.values(counts));
  const over = Object.keys(counts).filter(g => counts[g] === max && counts[g] > 0);
  const absent = Object.keys(counts).filter(g => counts[g] === 0);

  return (
    <div className="container-wide fade-in" data-screen-label="team-profile">
      <div className="between mb-6">
        <div>
          <Eyebrow>Part 1 · Get to know your team roles</Eyebrow>
          <h1 className="h-display mt-4">Your team's <em>composition</em>.</h1>
          <p className="lede mt-4">
            {members.length} members across {ROLE_GROUPS.filter(g => counts[g.name] > 0).length} role groups. Take it in together — then talk through what you see and record your team's reading below.
          </p>
        </div>
        <div style={{textAlign: 'right'}}>
          <button className="btn btn-primary btn-lg" onClick={onContinue}>
            Design your teammate <span className="arrow">→</span>
          </button>
          <div className="helper mt-2">Part 2 starts when everyone is here</div>
        </div>
      </div>

      {/* === Row 1: roster + diamond === */}
      <div className="grid-2" style={{gridTemplateColumns: '1fr 1.1fr', gap: 24}}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="section-num">Roster</div>
              <h2 className="h2 mt-2">Who's on the team</h2>
            </div>
            <span className="tag-mute">{members.length} of {team.members.length} in</span>
          </div>
          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            {team.members.map(m => <MemberChip key={m.id} member={m} />)}
          </div>

          <div className="divider" />

          <div className="section-num">By type</div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12}}>
            {members.map(m => {
              const type = TYPE_BY_CODE[m.type];
              return (
                <div key={m.id} className={`${classFor(type.group)}`} style={{
                  display:'flex', alignItems:'center', gap: 12,
                  padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'var(--rg)', color: '#fff',
                    display: 'grid', placeItems: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600
                  }}>{m.type}</div>
                  <div style={{minWidth: 0, flex: 1}}>
                    <div style={{fontSize: 13, fontWeight: 500}}>{m.name}</div>
                    <div style={{fontSize: 12, color: 'var(--ink-soft)', fontFamily:'var(--font-serif)', fontStyle:'italic'}}>{type.name}</div>
                  </div>
                  {onEditMember && (
                    <button className="edit-member" title={`Correct ${m.name}'s entry`}
                      onClick={() => onEditMember(m.id)}>edit</button>
                  )}
                </div>
              );
            })}
          </div>
          {onEditMember && (
            <div className="helper mt-3" style={{fontSize: 12}}>Typo in someone's results? Use <b>edit</b> to correct their entry.</div>
          )}
        </div>

        <div className="card" style={{padding: 0}}>
          <div className="card-head" style={{padding: '28px 28px 0', borderBottom: 0, marginBottom: 0}}>
            <div>
              <div className="section-num">Role group diamond</div>
              <h2 className="h2 mt-2">Coverage & gaps at a glance</h2>
            </div>
          </div>
          <div style={{padding: '8px 28px 28px'}}>
            <DiamondPlot counts={counts} total={Math.max(3, members.length)} />
          </div>
        </div>
      </div>

      {/* === Row 2: role group cards === */}
      <div className="mt-8">
        <div className="between mb-4">
          <div>
            <div className="section-num">Step A · Role group composition</div>
            <h2 className="h2 mt-2">Every corner of the diamond</h2>
          </div>
          <div style={{display: 'flex', gap: 8}}>
            {over.map(g => (
              <span key={g} className={`tag-role role-${g}`} style={{background: 'var(--rg)', color: '#fff'}}>
                <span className="swatch" style={{background:'#fff'}} />
                Over-represented · {g}
              </span>
            ))}
            {absent.map(g => (
              <span key={g} className={`tag-mute`} style={{textTransform:'uppercase'}}>
                Absent · {g}
              </span>
            ))}
          </div>
        </div>
        <div className="grid-4">
          {ROLE_GROUPS.map(g => {
            const groupMembers = members.filter(m => getGroup(m.type) === g.name);
            const count = groupMembers.length;
            return (
              <div key={g.name} className={`rg-card ${classFor(g.name)}`}>
                <div className="rg-bar" />
                <div className="rg-types">{g.types.join(' · ')}</div>
                <div className="rg-name">{g.name}</div>
                <div className="rg-blurb">{g.blurb}</div>
                <div className="rg-count">
                  <div className={`rg-num ${count === 0 ? 'zero' : ''}`}>{count}</div>
                  <div className="rg-members">
                    {count === 0 ? 'No members' :
                      groupMembers.map(m => memberShort(m)).join(', ')
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* === Row 3: dimension map === */}
      <div className="card mt-8">
        <div className="card-head">
          <div>
            <div className="section-num">Step B · Five dimension map</div>
            <h2 className="h2 mt-2">Where your team sits on each continuum</h2>
            <div className="helper mt-2">Each grey dot is one member (M1, M2, …). The red marker is your team average.</div>
          </div>
          <div style={{display:'flex', gap:10, alignItems:'center'}}>
            <span className="marker-inline" style={{
              width:10,height:10,borderRadius:'50%',background:'var(--ink-soft)',display:'inline-block'
            }} /><span className="helper">individual</span>
            <span className="marker-inline" style={{
              width:14,height:14,borderRadius:'50%',background:'var(--accent)',display:'inline-block', boxShadow:'0 0 0 3px var(--accent-soft)'
            }} /><span className="helper">team</span>
          </div>
        </div>

        {DIMENSIONS.map(dim => (
          <DimensionBar key={dim.key} dim={dim} members={members} />
        ))}
      </div>

      {/* === Row 4: guided interpretation (2.1) — the team reads its own
           profile; the site no longer interprets it for them. === */}
      <div className="card mt-8">
        <div className="card-head">
          <div>
            <div className="section-num">Step C · Interpret it together</div>
            <h2 className="h2 mt-2">What do you see?</h2>
            <p className="lede mt-2" style={{fontSize: 15}}>
              Discuss each question as a team, then have one person record your shared answer. A few sentences each is plenty.
            </p>
          </div>
        </div>
        <PrivacyNote />
        <div className="stack-lg mt-2">
          {PART1_QUESTIONS.map(q => (
            <div className="field" key={q.id}>
              <label>{q.label}</label>
              <textarea
                className="textarea" rows={3}
                value={(part1Data && part1Data[q.id]) || ''}
                onChange={e => onPart1Change({ ...(part1Data || {}), [q.id]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* === Row 5: next === */}
      <div className="card-bare mt-8">
        <div className="between">
          <div>
            <div className="section-num">Ready when you are</div>
            <h2 className="h2 mt-2">Move to Part 2 together</h2>
            <p className="helper mt-4" style={{fontSize: 14}}>From here, everything is collaborative — one shared canvas for the whole team. Confirm with your teammates that everyone is in the same view before you proceed.</p>
          </div>
          <button className="btn btn-dark btn-lg" style={{flexShrink: 0, marginLeft: 32}} onClick={onContinue}>
            Continue to Part 2 — Design the teammate
          </button>
        </div>
      </div>
    </div>
  );
}

// The three Part 1 interpretation questions (2.1). Ids double as export
// keys inside part1_interpretation — change them only with a schema bump.
const PART1_QUESTIONS = [
  { id: 'surprise',  label: 'Which result surprised you — your own, or a teammate\'s? And which was exactly what you expected?' },
  { id: 'spread',    label: 'Where is your team most spread out, and where do you cluster together? What might that mean for how you work?' },
  { id: 'strengths', label: 'Looking at your team\'s profile — what do you see as your strengths, and where do you think the gaps are?' },
];

Object.assign(window, { TeamProfileScreen, PART1_QUESTIONS });
