// === Closing screen (Part 4, step 2) — hand off to the Qualtrics survey ===
//
// The individual reflection survey lives in Qualtrics (set the link in
// js/config.js). This screen shows the team code, each member's participant
// code, and a QR code generated locally by js/vendor/qrcode.js — the page
// makes no network requests.

function surveyUrl(team) {
  const base = CONFIG.QUALTRICS_URL;
  if (!base || base.includes('REPLACE-ME')) return base;
  return base + (base.includes('?') ? '&' : '?') + 'team_code=' + encodeURIComponent(team.code);
}

function QrCode({ text, size = 180 }) {
  const svg = React.useMemo(() => {
    try {
      const qr = window.qrcode(0, 'M');  // type 0 = auto-size, medium error correction
      qr.addData(text);
      qr.make();
      return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    } catch (err) {
      console.warn('QR generation failed:', err);
      return null;
    }
  }, [text]);

  if (!svg) return null;
  return (
    <div className="qr-box" style={{width: size, height: size}} role="img"
      aria-label="QR code linking to the reflection survey"
      dangerouslySetInnerHTML={{__html: svg}} />
  );
}

function HandoffScreen({ team, designData, evalData, onRestart }) {
  const url = surveyUrl(team);
  const placeholder = !url || url.includes('REPLACE-ME');
  const [copiedLink, setCopiedLink] = React.useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1600);
    } catch (err) {
      console.warn('Clipboard unavailable:', err);
    }
  };

  return (
    <div className="container fade-in" data-screen-label="handoff">
      <div style={{textAlign: 'center', paddingTop: 24}}>
        <Eyebrow>Workshop complete</Eyebrow>
        <h1 className="h-display mt-4">One last thing — <em>your</em> reflection.</h1>
        <p className="lede mt-4" style={{marginLeft: 'auto', marginRight: 'auto', maxWidth: 640}}>
          The workshop ends with a short individual survey (~10 minutes).
          It's personal, not team work: <b>each member opens it on their own device</b> and answers alone.
        </p>
      </div>

      <div className="grid-2 mt-8" style={{gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'stretch'}}>
        <div className="card" style={{textAlign: 'center'}}>
          <div className="section-num">Step 1 · Open the survey</div>
          <h2 className="h2 mt-2">Scan with your phone</h2>
          {placeholder ? (
            <div className="tip-callout mt-6" style={{textAlign: 'left'}}>
              <span className="tip-mark" style={{color: 'var(--accent)'}}>Facilitator</span>
              <div>The survey link hasn't been configured yet. Open <b className="mono">js/config.js</b> and replace the placeholder <b className="mono">QUALTRICS_URL</b> with your real Qualtrics link.</div>
            </div>
          ) : (
            <>
              <div style={{display: 'flex', justifyContent: 'center', marginTop: 20}}>
                <QrCode text={url} />
              </div>
              <div className="helper mt-4" style={{fontSize: 12}}>or type the link:</div>
              <div className="mt-2" style={{display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap'}}>
                <a className="mono" style={{fontSize: 13, wordBreak: 'break-all'}} href={url} target="_blank" rel="noreferrer">{url}</a>
                <button className="btn btn-ghost btn-sm" onClick={copyLink}>{copiedLink ? 'Copied ✓' : 'Copy link'}</button>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="section-num">Step 2 · Identify yourself by code</div>
          <h2 className="h2 mt-2">Your codes — no names</h2>
          <p className="helper mt-3" style={{fontSize: 13}}>
            The survey asks for two codes so your answers can be linked to your team's design — never to you personally.
          </p>
          <div className="mt-4" style={{display: 'flex', gap: 12, alignItems: 'center'}}>
            <span className="helper" style={{width: 110, flexShrink: 0}}>Team code</span>
            <span className="code-chip" style={{fontSize: 16}}>{team.code}</span>
          </div>
          <div className="mt-3" style={{display: 'flex', gap: 12, alignItems: 'flex-start'}}>
            <span className="helper" style={{width: 110, flexShrink: 0, marginTop: 6}}>Member code</span>
            <div className="member-chip-row">
              {team.members.map(m => (
                <span key={m.id} className="code-chip" title={m.name}>{memberShort(m)}</span>
              ))}
            </div>
          </div>
          <div className="tip-callout mt-6">
            <span className="tip-mark">Which is mine?</span>
            <div>Your member code is the number you entered your results under — Member 3 is <b className="mono">M3</b>. Enter your <b>team code and member code</b> at the start of the survey.</div>
          </div>
        </div>
      </div>

      <div className="card mt-6" style={{textAlign: 'left'}}>
        <div className="section-num">Keep building</div>
        <h2 className="h2 mt-2 mb-4">Your final prompt — live in your EduGenAI CustomGPT</h2>
        <PromptPreview team={team} designData={designData} big />
        <p className="helper mt-4" style={{fontSize: 13}}>
          This is the version you deployed to <a href="https://edugenai.npuls.nl/" target="_blank" rel="noreferrer">EduGenAI</a> in
          Part 3 — shown here for reference. Keep using your CustomGPT on the action plan in your next tutorials.
        </p>
      </div>

      <div className="mt-8" style={{display: 'flex', gap: 12, justifyContent: 'center'}}>
        <button className="btn btn-ghost btn-lg" onClick={onRestart}>Start a new team</button>
      </div>
      <p className="helper mt-4" style={{textAlign: 'center', fontSize: 12}}>
        "Start a new team" erases this team's data from the browser — make sure the team file is downloaded first.
      </p>
    </div>
  );
}

Object.assign(window, { HandoffScreen, surveyUrl });
