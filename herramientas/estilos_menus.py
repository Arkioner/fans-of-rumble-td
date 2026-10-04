"""Saca de css/estilos.css del original las reglas de los menús (cartera, colección, inventario, gashapón, tienda, horas extra, novedades)."""
import re, sys
SRC = '../fans-of-rumble/css/estilos.css'   # el juego original, clonado al lado de este
OUT = 'css/menus.css'
css = open(SRC, encoding='utf-8').read()

TOKENS = ['.wallet', '.wal', '.home-feature', '.feat', '.home-grid', '.home-tile', '.dotbadge', '.idle', '#idle', '.ib-', '.rw-chip', '.idlebox', '.scr-head', '.h2', '.fac-tab', '.passive-box', '.scroll-list',
          '.coll-', '.deck-desc', '.deck-stats', '.deck-sub', '.xpbar', '.boost', '.slots', '.slot', '.sl-', '.btn-eqall', '.pick-', '.inv-', '.chip-btn', '.qbadge', '.qstat', '.qbar', '.item-', '.modal-card',
          '.gacha', '#gacha', '.gr-', '.gt', '.btn-pull', '.pull-row', '.small-print', '.shop-note', '.gift-row', '.pack', '.pk-', '.btn-price', '.joke-flag', '.countdown', '.cf-body', '.news-', '.btn-link',
          '.tabs', '.tab', '#toast', '.btn-up', '.btn-ghost', '.btn-ok', '.screen.top', '.screen.modal', '.icon-btn.back', '.ad-row', '.btn-vip', '.pw',
          # portada, campaña, pantalla previa, cómo se juega, pausa, final y opciones
          '.screen', '.logo', '.tagline', '#title-art', '#scr-title', '.camp-row', '.camp-head', '.btn-mode', '.links', '.fac-grid', '.fac-opt', '.diff', '.diff-label', '.prep-info', '.world', '.nodes', '.node',
          '.end-', '#scr-end', '.rewards', '.rw-', '.stats', '.stat', '.quote', '.steps', '#scr-howto', '#scr-prep', '#scr-camp', '.btn-big', '.opt-', '#scr-options', '.row']
BLOCK = ['.pass-', '.login', '.deck-bar', '.deck-slot', '.deck-pool', '.spell', '#tut', '.tut', '.prof', '.ach', '.arena', '.share', '.sala', '.mission', '.m-row', '.camp-tabs', '.btn-ad', '.ad-', '.side-mode', '.bdiff', '.prep-deck', '.gear-', '.mod-', '.cd-', '.boss-pick', '#btn-camp', '.end-extra', '.end-pass', '.rl-', '.roulette']

def split_rules(text):
    """Trocea en reglas de primer nivel (cada @media o @keyframes entero cuenta como una)."""
    out, depth, start, i = [], 0, 0, 0
    while i < len(text):
        ch = text[i]
        if ch == '/' and text[i:i + 2] == '/*':
            j = text.find('*/', i + 2); i = len(text) if j < 0 else j + 2; continue
        if ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0: out.append(text[start:i + 1]); start = i + 1
        i += 1
    return out

def sel_of(rule): return re.sub(r'/\*.*?\*/', '', rule[:rule.index('{')], flags=re.S).strip()
def wanted(sel):
    parts = [s.strip() for s in sel.split(',')]
    keep = [s for s in parts if any(t in s for t in TOKENS) and not any(b in s for b in BLOCK)]
    return keep

kept, names = [], set()
for rule in split_rules(css):
    sel = sel_of(rule)
    if sel.startswith('@keyframes'):
        kept.append(('kf', sel.split()[1], rule.strip())); continue
    if sel.startswith('@media') or sel.startswith('@supports'):
        inner = rule[rule.index('{') + 1: rule.rindex('}')]
        sub = []
        for r in split_rules(inner):
            k = wanted(sel_of(r))
            if k: sub.append('  ' + ', '.join(k) + ' ' + r[r.index('{'):].strip())
        if sub: kept.append(('rule', None, sel + ' {\n' + '\n'.join(sub) + '\n}'))
        continue
    if sel.startswith('@'): continue
    k = wanted(sel)
    if k: kept.append(('rule', None, ', '.join(k) + ' ' + rule[rule.index('{'):].strip()))

body = '\n'.join(r for t, n, r in kept if t == 'rule')
used = set(re.findall(r'animation(?:-name)?:\s*([\w-]+)', body))
kfs = [r for t, n, r in kept if t == 'kf' and n in used]
head = ("/* Fans of Rumble TD · Estilos de los menús: reglas sacadas de css/estilos.css del juego original (sin cambiar)\n"
        "   para que la colección, el inventario, el gashapón, la tienda, las horas extra y las novedades se vean igual.\n"
        "   Se genera con una herramienta; los ajustes propios de la defensa de torres van en td.css. */\n")
open(OUT, 'w', encoding='utf-8', newline='\n').write(head + body + '\n' + '\n'.join(kfs) + '\n')
print('reglas', sum(1 for t, n, r in kept if t == 'rule'), 'keyframes', len(kfs), 'bytes', len(body))
print('animaciones usadas', sorted(used))
