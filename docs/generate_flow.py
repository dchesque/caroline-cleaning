#!/usr/bin/env python
"""
Lead Chat System - Circuit Cartography flowchart  (refined pass)
"""
import os, sys
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import numpy as np

os.makedirs('D:/Workspace/caroline-cleaning/docs', exist_ok=True)

# ── Canvas ─────────────────────────────────────────────────────────────────────
W, H = 22, 58
fig = plt.figure(figsize=(W, H), dpi=120)
fig.patch.set_facecolor('#0D1117')
ax = fig.add_axes([0, 0, 1, 1], facecolor='#0D1117')
ax.set_xlim(0, W)
ax.set_ylim(0, H)
ax.axis('off')

# ── Palette ────────────────────────────────────────────────────────────────────
BG   = '#0D1117'
NODE = '#161B22'
C = {
    'client': '#58A6FF',
    'api':    '#BC8CFF',
    'ai':     '#FFA657',
    'db':     '#3FB950',
    'notif':  '#F778BA',
    'error':  '#FF7B72',
    'text':   '#E6EDF3',
    'dim':    '#6E7681',
    'line':   '#21262D',
    'grid':   '#161B22',
}
MONO = 'monospace'

# ── Layout ─────────────────────────────────────────────────────────────────────
MX  = 11.0   # main column
RX  = 18.0   # right branches
LX  = 3.8    # left branches
NW  = 6.0    # process width
NH  = 1.05   # process height
DW  = 4.2    # diamond width
DH  = 1.6    # diamond height
BW  = 4.4    # branch node width
BH  = 1.15   # branch node height

# ── Helpers ────────────────────────────────────────────────────────────────────
def process(cx, cy, color, lines, small=False):
    fs = 8.4 if not small else 7.6
    x, y = cx - NW/2, cy - NH/2
    bg = FancyBboxPatch((x, y), NW, NH,
                        boxstyle='round,pad=0.07',
                        fc=NODE, ec=color, lw=1.8, zorder=3)
    ax.add_patch(bg)
    # Left accent bar
    bar = mpatches.Rectangle((x, y+0.04), 0.10, NH-0.08,
                              fc=color, alpha=0.9, zorder=4)
    ax.add_patch(bar)
    if isinstance(lines, str):
        lines = [lines]
    ax.text(cx + 0.14, cy, '\n'.join(lines),
            ha='center', va='center', color=C['text'],
            fontsize=fs, fontfamily=MONO, fontweight='semibold',
            zorder=5, linespacing=1.45)

def branch_node(cx, cy, color, lines):
    x, y = cx - BW/2, cy - BH/2
    bg = FancyBboxPatch((x, y), BW, BH,
                        boxstyle='round,pad=0.07',
                        fc=NODE, ec=color, lw=1.3, zorder=3)
    ax.add_patch(bg)
    if isinstance(lines, str):
        lines = [lines]
    ax.text(cx, cy, '\n'.join(lines),
            ha='center', va='center', color=color,
            fontsize=7.2, fontfamily=MONO, fontweight='bold',
            zorder=5, linespacing=1.35)

def diamond(cx, cy, color, lines):
    if isinstance(lines, str):
        lines = [lines]
    pts = np.array([
        [cx,      cy+DH/2],
        [cx+DW/2, cy],
        [cx,      cy-DH/2],
        [cx-DW/2, cy],
    ])
    d = plt.Polygon(pts, fc=NODE, ec=color, lw=1.8, zorder=3)
    ax.add_patch(d)
    ax.text(cx, cy, '\n'.join(lines),
            ha='center', va='center', color=color,
            fontsize=7.8, fontfamily=MONO, fontweight='bold',
            zorder=5, linespacing=1.35)

def terminal(cx, cy, color, text, is_end=False):
    fc_alpha = 0.22 if not is_end else 0.3
    r = FancyBboxPatch((cx-NW/2, cy-0.62), NW, 1.24,
                       boxstyle='round,pad=0.28',
                       fc=color, ec=color, lw=0, alpha=fc_alpha, zorder=3)
    ax.add_patch(r)
    r2 = FancyBboxPatch((cx-NW/2, cy-0.62), NW, 1.24,
                        boxstyle='round,pad=0.28',
                        fc='none', ec=color, lw=2.0, zorder=4)
    ax.add_patch(r2)
    ax.text(cx, cy, text, ha='center', va='center',
            color=color, fontsize=9.0, fontfamily=MONO,
            fontweight='bold', zorder=5)

def arr(x1, y1, x2, y2, color, label='', lside='right', rad=0.0, ls='-'):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(
                    arrowstyle='->', color=color, lw=1.5,
                    connectionstyle=f'arc3,rad={rad}',
                    linestyle=ls,
                ), zorder=2)
    if label:
        mx = (x1+x2)/2 + (0.22 if lside == 'right' else -0.22)
        my = (y1+y2)/2
        ax.text(mx, my, label,
                ha='left' if lside == 'right' else 'right',
                va='center', color=C['dim'],
                fontsize=7.0, fontfamily=MONO, zorder=6)

def horiz_arr(x1, y, x2, color, label='', lside='right'):
    ax.annotate('', xy=(x2, y), xytext=(x1, y),
                arrowprops=dict(
                    arrowstyle='->', color=color, lw=1.5,
                    connectionstyle='arc3,rad=0',
                ), zorder=2)
    if label:
        mx = (x1+x2)/2
        ax.text(mx, y+0.18, label,
                ha='center', va='bottom', color=C['dim'],
                fontsize=7.0, fontfamily=MONO, zorder=6)

def layer_band(y_top, y_bot, color, label):
    band = mpatches.Rectangle((0.25, y_bot), 0.24, y_top-y_bot,
                               fc=color, alpha=0.13, zorder=1)
    ax.add_patch(band)
    ax.text(0.37, (y_top+y_bot)/2, label,
            ha='center', va='center', rotation=90,
            color=color, fontsize=6.2, fontfamily=MONO,
            fontweight='bold', alpha=0.55, zorder=2)

def section_rule(y, color, label=''):
    ax.axhline(y, xmin=0.03, xmax=0.97, color=color,
               lw=0.5, alpha=0.15, zorder=1)

# ── NODE Y positions ───────────────────────────────────────────────────────────
TOP = H - 2.8
y = {}
cursor = TOP

def place(key, gap=2.0):
    global cursor
    y[key] = cursor
    cursor -= gap

place('start',    2.2)
place('mode',     2.6)   # diamond
place('greeting', 2.2)
place('send',     2.2)
place('post',     2.4)
place('rate',     2.8)   # diamond
place('zod',      2.8)   # diamond
place('process',  2.2)
place('saved_q',  2.8)   # diamond
place('llm',      2.4)
place('reason',   2.8)   # diamond
place('savelead', 2.4)
place('valid_q',  2.8)   # diamond
place('dup_q',    2.8)   # diamond
place('insert',   2.2)
place('ins_ok',   2.8)   # diamond
place('notify',   2.4)
place('state',    2.2)
place('confirm',  2.2)

# ── LAYER BANDS ───────────────────────────────────────────────────────────────
layer_band(y['start']+0.7,    y['send']-0.6,      C['client'], 'CLIENT')
layer_band(y['post']+0.7,     y['saved_q']-0.8,   C['api'],    'API')
layer_band(y['llm']+0.7,      y['reason']-0.8,    C['ai'],     'AI')
layer_band(y['savelead']+0.7, y['ins_ok']-0.8,    C['db'],     'DB')
layer_band(y['notify']+0.7,   y['notify']-0.7,    C['notif'],  'NOTIF')
layer_band(y['state']+0.7,    y['confirm']-0.7,   C['client'], 'CLIENT')

# ── TITLE ──────────────────────────────────────────────────────────────────────
ax.text(MX, H-0.9, 'LEAD CHAT  -  SYSTEM FLOW',
        ha='center', va='center', color=C['text'],
        fontsize=15, fontfamily=MONO, fontweight='bold', zorder=10)
ax.text(MX, H-1.65, 'NEXT_PUBLIC_CHAT_MODE = "lead"',
        ha='center', va='center', color=C['dim'],
        fontsize=9.0, fontfamily=MONO, zorder=10)
ax.axhline(H-2.1, xmin=0.03, xmax=0.97, color=C['line'], lw=1.0, alpha=0.8)

# ── FLOW ───────────────────────────────────────────────────────────────────────

# START
terminal(MX, y['start'], C['client'], 'Visitor opens chat')

# CHAT_MODE
arr(MX, y['start']-0.62, MX, y['mode']+DH/2, C['client'])
diamond(MX, y['mode'], C['client'], ['CHAT_MODE?'])
horiz_arr(MX+DW/2, y['mode'], RX-BW/2, C['dim'], '"full"')
branch_node(RX, y['mode'], C['dim'],
            ['useCarolChat  (full agent)', '-- out of scope --'])
arr(MX, y['mode']-DH/2, MX, y['greeting']+NH/2, C['client'], '"lead"', 'right')

# GREETING
process(MX, y['greeting'], C['client'],
        ['Greeting shown instantly  (no LLM call)'])

# SEND
arr(MX, y['greeting']-NH/2, MX, y['send']+NH/2, C['client'])
process(MX, y['send'], C['client'],
        'User types  ->  sendMessage(content)')

# POST
arr(MX, y['send']-NH/2, MX, y['post']+NH/2, C['api'])
process(MX, y['post'], C['api'],
        ['POST /api/lead-chat',
         '{ message, sessionId, history*, context }'], small=True)
ax.text(MX + NW/2 + 0.15, y['post'] - 0.30,
        '* synthetic greeting excluded',
        color=C['dim'], fontsize=6.5, fontfamily=MONO,
        ha='left', va='center')

# RATE LIMIT
arr(MX, y['post']-NH/2, MX, y['rate']+DH/2, C['api'])
diamond(MX, y['rate'], C['api'], ['Rate limit', 'OK?  20/min'])
horiz_arr(MX+DW/2, y['rate'], RX-BW/2, C['error'], 'BLOCKED')
branch_node(RX, y['rate'], C['error'], ['429  Too Many Requests'])
arr(MX, y['rate']-DH/2, MX, y['zod']+DH/2, C['api'], 'PASS', 'right')

# ZOD
diamond(MX, y['zod'], C['api'], ['Zod schema', 'valid?'])
horiz_arr(MX+DW/2, y['zod'], RX-BW/2, C['error'], 'INVALID')
branch_node(RX, y['zod'], C['error'], ['400  Bad Request'])
arr(MX, y['zod']-DH/2, MX, y['process']+NH/2, C['api'], 'VALID', 'right')

# processLeadMessage
process(MX, y['process'], C['api'], 'processLeadMessage(req)')

# leadSaved?
arr(MX, y['process']-NH/2, MX, y['saved_q']+DH/2, C['api'])
diamond(MX, y['saved_q'], C['api'], ['context', '.leadSaved?'])
horiz_arr(MX+DW/2, y['saved_q'], RX-BW/2, C['client'], 'true')
branch_node(RX, y['saved_q'], C['client'],
            ['"Your info is already saved!"', '(idempotency guard)'])
arr(MX, y['saved_q']-DH/2, MX, y['llm']+NH/2, C['ai'], 'false', 'right')

# LLM
process(MX, y['llm'], C['ai'],
        ['buildSystemPrompt(context)',
         'OpenRouter LLM call   tool_choice: auto'])

# finish_reason
arr(MX, y['llm']-NH/2, MX, y['reason']+DH/2, C['ai'])
diamond(MX, y['reason'], C['ai'], ['finish', '_reason?'])
horiz_arr(MX+DW/2, y['reason'], RX-BW/2, C['ai'], '"stop"')
branch_node(RX, y['reason'], C['ai'],
            ['Carol responds naturally',
             'collects data conversationally',
             '-> { message, context } -> user'])
arr(MX, y['reason']-DH/2, MX, y['savelead']+NH/2, C['db'],
    '"tool_calls"', 'right')

# saveLead
process(MX, y['savelead'], C['db'], 'saveLead(context, sessionId)')

# Validation
arr(MX, y['savelead']-NH/2, MX, y['valid_q']+DH/2, C['db'])
diamond(MX, y['valid_q'], C['db'], ['Format', 'valid?'])
horiz_arr(MX-DW/2, y['valid_q'], LX+BW/2, C['error'], 'FAIL', 'left')
branch_node(LX, y['valid_q'], C['error'],
            ['phone != 10-11 digits',
             'zip != 5 digits  /  name < 2',
             '"Could you share again?"',
             'leadSaved stays false'])
arr(MX, y['valid_q']-DH/2, MX, y['dup_q']+DH/2, C['db'], 'PASS', 'right')

# Duplicate
diamond(MX, y['dup_q'], C['db'], ['Duplicate', 'phone?'])
horiz_arr(MX-DW/2, y['dup_q'], LX+BW/2, C['db'], 'YES', 'left')
branch_node(LX, y['dup_q'], C['db'],
            ['"Welcome back!"',
             '{ id, isNew: false }',
             'leadSaved = true'])
arr(MX, y['dup_q']-DH/2, MX, y['insert']+NH/2, C['db'], 'NO', 'right')

# INSERT
process(MX, y['insert'], C['db'],
        ["INSERT clientes",
         "status='lead'   origem='lead_chat'"])

# Insert OK?
arr(MX, y['insert']-NH/2, MX, y['ins_ok']+DH/2, C['db'])
diamond(MX, y['ins_ok'], C['db'], ['Insert', 'OK?'])
horiz_arr(MX-DW/2, y['ins_ok'], LX+BW/2, C['error'], 'FAIL', 'left')
branch_node(LX, y['ins_ok'], C['error'],
            ['Supabase error  ->  return null',
             '"Sorry, try again"',
             'leadSaved stays false'])
arr(MX, y['ins_ok']-DH/2, MX, y['notify']+NH/2, C['notif'], 'SUCCESS', 'right')

# notifyAdmins
process(MX, y['notify'], C['notif'],
        ['void notifyAdmins("newLead", { name, phone, source })',
         'Evolution API  ->  WhatsApp all eligible admins'])
ax.text(MX + NW/2 + 0.15, y['notify'] - 0.28,
        'EVOLUTION_ADMIN_PHONE always receives (catch-all)',
        color=C['dim'], fontsize=6.4, fontfamily=MONO,
        ha='left', va='center')

# State update
arr(MX, y['notify']-NH/2, MX, y['state']+NH/2, C['client'])
process(MX, y['state'], C['client'],
        ['leadSaved = true   leadId = uuid',
         'context  ->  sessionStorage'])

# Confirmation
arr(MX, y['state']-NH/2, MX, y['confirm']+0.62, C['client'])
terminal(MX, y['confirm'], C['client'],
         '"Perfect, [Name]! Our team will reach out soon!"',
         is_end=True)

# ── LEGEND ────────────────────────────────────────────────────────────────────
lx_start = 1.2
ly_start = y['confirm'] - 2.2
items = [
    (C['client'], 'Client   (React hook, ChatWidget)'),
    (C['api'],    'API      (route.ts + middleware)'),
    (C['ai'],     'AI       (OpenRouter LLM)'),
    (C['db'],     'Database (Supabase / clientes)'),
    (C['notif'],  'Notification  (Evolution API / WhatsApp)'),
    (C['error'],  'Error / blocked path'),
]
box_h = len(items) * 0.75 + 0.55
lbox = FancyBboxPatch((lx_start - 0.2, ly_start - box_h + 0.3), 7.0, box_h,
                      boxstyle='round,pad=0.1',
                      fc=NODE, ec=C['line'], lw=1.0, zorder=5)
ax.add_patch(lbox)
ax.text(lx_start + 3.1, ly_start + 0.02, 'LEGEND',
        ha='center', va='center', color=C['dim'],
        fontsize=7.5, fontfamily=MONO, fontweight='bold', zorder=7)
for i, (color, label) in enumerate(items):
    yi = ly_start - 0.75*(i+1) + 0.22
    dot = mpatches.Circle((lx_start + 0.22, yi), 0.10,
                           fc=color, ec='none', zorder=8)
    ax.add_patch(dot)
    ax.text(lx_start + 0.55, yi, label,
            ha='left', va='center', color=C['text'],
            fontsize=7.2, fontfamily=MONO, zorder=8)

# ── FOOTER ────────────────────────────────────────────────────────────────────
fy = y['confirm'] - box_h - 2.0
ax.axhline(fy + 0.4, xmin=0.03, xmax=0.97, color=C['line'], lw=0.6, alpha=0.6)
ax.text(MX, fy, 'chesque premium cleaning   lead-chat-agent.ts   Circuit Cartography',
        ha='center', va='center', color=C['dim'],
        fontsize=6.8, fontfamily=MONO, alpha=0.55)

# ── Save ──────────────────────────────────────────────────────────────────────
out = 'D:/Workspace/caroline-cleaning/docs/lead-chat-flow.png'
plt.savefig(out, dpi=120, bbox_inches='tight',
            facecolor=BG, edgecolor='none')
plt.close()
print('Saved -> ' + out)
