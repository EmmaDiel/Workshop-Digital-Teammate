#!/usr/bin/env python3
"""Collate per-team workshop exports into stacked analysis files.

Reads every team_*.json in a folder (the single file each team downloads
in Part 4) and writes:

  members.csv    one row per member across all teams
  teams.csv      one row per team: design answers (incl. v1/v2 prompt
                 versions and the revision diff), Part 1 interpretation,
                 evaluation notes
  summaries/     one human-readable summary_<code>.md per team

Usage:
  python3 tools/collate.py data/                 # writes into data/collated/
  python3 tools/collate.py data/ -o out/         # custom output folder
  python3 tools/collate.py data/ --exclude-demo  # drop ?demo=1 exports

Column reference: docs/data-dictionary.md. Handles both schema 1.0
(pilot) and 1.1 files; fields a file doesn't have are left empty.
No dependencies beyond the Python 3 standard library.
"""
import argparse
import csv
import json
import sys
from pathlib import Path

DIMENSIONS = [
    ('energy_extraverted_pct',  'Energy',   'Introverted',  'Extraverted'),
    ('mind_intuitive_pct',      'Mind',     'Observant',    'Intuitive'),
    ('nature_feeling_pct',      'Nature',   'Thinking',     'Feeling'),
    ('tactics_prospecting_pct', 'Tactics',  'Judging',      'Prospecting'),
    ('identity_turbulent_pct',  'Identity', 'Assertive',    'Turbulent'),
]

# Design fields as exported (schema 1.1 names; 1.0 lacks b2_ground_rules)
DESIGN_FIELDS = [
    'gpt_name', 'b1_role', 'b1_human_role',
    'b2_ground_rules', 'b2_mistakes', 'b2_limits',
    'b3_opener', 'b4_format', 'b4_must_include', 'b5_tone', 'b5_jargon',
]
PART1_KEYS = ['surprise', 'spread', 'strengths']
ROLE_GROUPS = ['analysts', 'diplomats', 'sentinels', 'explorers']


def team_row(data):
    design = data.get('design', {})
    counts = data.get('role_group_counts', {})
    part1 = data.get('part1_interpretation') or {}
    ev = data.get('evaluation', {})

    row = {
        'team_code': data.get('team_code', ''),
        'exported_at': data.get('exported_at', ''),
        'schema_version': data.get('schema_version', ''),
        'workshop_version': data.get('workshop_version', ''),
        'demo': data.get('demo', ''),
        'team_size': data.get('team_size', ''),
        'n_members': data.get('n_members', ''),
    }
    for g in ROLE_GROUPS:
        row[f'count_{g}'] = counts.get(g, '')
    row['absent_role_groups'] = ';'.join(data.get('absent_role_groups', []))

    for k in PART1_KEYS:
        row[f'part1_{k}'] = part1.get(k, '')

    for f in DESIGN_FIELDS:
        row[f] = design.get(f, '')
    row['b6_primary_roles'] = ';'.join(design.get('b6_primary_roles', []))
    row['b6_primary_roles_labels'] = ';'.join(design.get('b6_primary_roles_labels', []))
    row['b6_other_role'] = design.get('b6_other_role', '')

    row['eval_selected_topics'] = ';'.join(ev.get('selected_topics', []))
    for t in ev.get('topics', []):
        p = 'eval_' + str(t.get('topic_id', '')).lower()
        row[p + '_selected'] = t.get('selected', '')
        row[p + '_test_prompt'] = t.get('test_prompt', '')
        row[p + '_observation'] = t.get('observation', '')
        row[p + '_interpretation'] = t.get('interpretation', '')
        row[p + '_refinement'] = t.get('refinement', '')

    row['system_prompt'] = data.get('system_prompt', '')
    row['prompt_v1'] = data.get('prompt_v1') or ''
    row['prompt_v2'] = data.get('prompt_v2') or ''
    row['changed_fields'] = ';'.join(data.get('changed_fields', []))
    row['n_changed_fields'] = len(data.get('changed_fields', []))
    row['no_change_rationale'] = data.get('no_change_rationale', '')
    for f in DESIGN_FIELDS:
        row[f'v1_{f}'] = (data.get('design_v1') or {}).get(f, '')
        row[f'v2_{f}'] = (data.get('design_v2') or {}).get(f, '')
    return row


def pole_reading(col, value):
    """'72% Introverted' style reading of a 0-100 right-pole position."""
    if value is None or value == '':
        return '—'
    v = int(value)
    _, _, left, right = next(d for d in DIMENSIONS if d[0] == col)
    if v == 50:
        return '50/50'
    return f'{v}% {right}' if v > 50 else f'{100 - v}% {left}'


def summary_md(data):
    design = data.get('design', {})
    part1 = data.get('part1_interpretation') or {}
    L = [f"# Digital Teammate — Team {data.get('team_code', '?')}", '']
    L.append(f"Workshop v{data.get('workshop_version', '?')} · schema {data.get('schema_version', '?')}"
             + (' · **DEMO DATA**' if data.get('demo') else ''))
    L += ['', '## Team profile', '',
          '| Member | Type | Role group | ' + ' | '.join(d[1] for d in DIMENSIONS) + ' |',
          '|---|---|---|' + '|'.join(['---'] * len(DIMENSIONS)) + '|']
    for m in data.get('members', []):
        dims = ' | '.join(pole_reading(d[0], m.get(d[0])) for d in DIMENSIONS)
        L.append(f"| {m.get('member_id', '?')} | {m.get('type_variant') or '—'} | {m.get('role_group') or '—'} | {dims} |")
    L.append('')

    def q(label, v):
        L.extend([f'**{label}**', '', v if v else '_(not answered)_', ''])

    if part1:
        L += ['## Part 1 — team interpretation', '']
        q('Surprising vs expected results', part1.get('surprise', ''))
        q('Spread vs clustering', part1.get('spread', ''))
        q('Strengths and gaps', part1.get('strengths', ''))

    L += ['## Design canvas (Part 2)', '']
    q('B1 · Name', design.get('gpt_name', ''))
    q('B1 · Role for the team', design.get('b1_role', ''))
    q('B1 · What stays a human job', design.get('b1_human_role', ''))
    if design.get('b2_ground_rules') or not (design.get('b2_mistakes') or design.get('b2_limits')):
        q('B2 · Ground rules', design.get('b2_ground_rules', ''))
    else:  # schema 1.0 pilot files
        q('B2 · Handling mistakes', design.get('b2_mistakes', ''))
        q('B2 · What it should refuse', design.get('b2_limits', ''))
    q('B3 · Opening message', design.get('b3_opener', ''))
    q('B4 · Response format', design.get('b4_format', ''))
    q('B4 · Every response must include', design.get('b4_must_include', ''))
    q('B5 · Tone', design.get('b5_tone', ''))
    q('B5 · Jargon', design.get('b5_jargon', ''))
    b6 = '; '.join(design.get('b6_primary_roles_labels', []))
    if design.get('b6_other_role'):
        b6 = (b6 + '; ' if b6 else '') + design['b6_other_role']
    q('B6 · Primary role(s)', b6)

    L += ['## Evaluation (Part 3)', '']
    for t in data.get('evaluation', {}).get('topics', []):
        L.append(f"### Topic {t.get('topic_id')} — {t.get('topic_title')} "
                 + ('' if t.get('selected') else '(not selected)'))
        L.append('')
        if any(t.get(k) for k in ('test_prompt', 'observation', 'interpretation', 'refinement')):
            q('Test prompt', t.get('test_prompt', ''))
            q('What happened', t.get('observation', ''))
            q('Why', t.get('interpretation', ''))
            q('Refinement', t.get('refinement', ''))
        else:
            L += ['_(no notes)_', '']

    L += ['## Revision (Part 3, after testing)', '']
    changed = data.get('changed_fields', [])
    if changed:
        L.append(f"Fields changed after testing: {', '.join(changed)}")
    elif data.get('no_change_rationale'):
        L.append(f"No changes — team's rationale: \"{data['no_change_rationale']}\"")
    else:
        L.append('_(no revision data recorded)_')
    L.append('')
    if data.get('prompt_v1') and data.get('prompt_v1') != data.get('prompt_v2'):
        L += ['### Prompt v1 (as first tested)', '', '```', data['prompt_v1'], '```', '']
    L += ['## Final system prompt' + (' (v2)' if data.get('prompt_v2') else ''), '',
          '```', data.get('prompt_v2') or data.get('system_prompt', ''), '```', '']
    return '\n'.join(L)


def write_csv(path, rows):
    if not rows:
        print(f'  {path.name}: nothing to write')
        return
    # Union of keys across rows, preserving first-seen order, so 1.0 and
    # 1.1 files can be stacked in one run.
    cols = []
    for r in rows:
        for k in r:
            if k not in cols:
                cols.append(k)
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)
    print(f'  {path.name}: {len(rows)} rows, {len(cols)} columns')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('folder', help='folder containing team_*.json exports (searched recursively)')
    ap.add_argument('-o', '--out', help='output folder (default: <folder>/collated)')
    ap.add_argument('--exclude-demo', action='store_true', help='skip exports produced from ?demo=1 sample data')
    args = ap.parse_args()

    src = Path(args.folder)
    if not src.is_dir():
        sys.exit(f'Not a folder: {src}')
    out = Path(args.out) if args.out else src / 'collated'
    (out / 'summaries').mkdir(parents=True, exist_ok=True)

    files = sorted(p for p in src.rglob('team_*.json') if out not in p.parents)
    if not files:
        sys.exit(f'No team_*.json files found under {src}')

    member_rows, team_rows, skipped = [], [], 0
    for path in files:
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            print(f'  ! skipping {path.name}: {e}')
            continue
        if args.exclude_demo and data.get('demo'):
            skipped += 1
            continue
        member_rows.extend(data.get('members', []))
        team_rows.append(team_row(data))
        code = data.get('team_code', path.stem.replace('team_', ''))
        (out / 'summaries' / f'summary_{code}.md').write_text(summary_md(data), encoding='utf-8')

    print(f'Collated {len(team_rows)} team file(s)'
          + (f' ({skipped} demo file(s) excluded)' if skipped else '') + f' → {out}')
    write_csv(out / 'members.csv', member_rows)
    write_csv(out / 'teams.csv', team_rows)
    print(f'  summaries/: {len(team_rows)} file(s)')


if __name__ == '__main__':
    main()
