"""Rebuild the On The Radar mark as a clean pixel grid for the voxel transition.

One flat colour per cell: black letter faces with a one-cell brand-green rim,
counters (O, R, A, D) kept open, letters kept apart. The glow and the white
ring are dropped; the ring is drawn as its own set-back layer in 3D.
Source: asset-studio/sources/brands/mafiathon3/on-the-radar/on-the-radar-radio-logo-v2.png
"""
import sys, json
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

SRC = r'C:/Users/zaydo/OneDrive/Documents/Zay Domo Artist Webpage/asset-studio/sources/brands/mafiathon3/on-the-radar/on-the-radar-radio-logo-v2.png'
OUT = r'C:/Users/zaydo/OneDrive/Documents/Zay Domo Artist Webpage/site/public/tracking/chapters/radar/radar-mark.png'
PREV = sys.argv[1] if len(sys.argv) > 1 else None  # optional preview PNG
# Usage: python build-mark.py [preview.png] [cell_px=6.5]
# Writes site/public/tracking/chapters/radar/radar-mark.png and prints the
# ring geometry that GRID in Scene.jsx mirrors.
S = float(sys.argv[2]) if len(sys.argv) > 2 else 6.5   # source px per grid cell
X0, Y0, X1, Y1 = 12, 134, 790, 500                     # letters bbox + margin
COLS, ROWS = round((X1 - X0) / S), round((Y1 - Y0) / S)
CELL = 6
GREEN = (75, 188, 76)   # the logo's own glow green
BLACK = (6, 7, 6)

im = np.array(Image.open(SRC).convert('RGBA')).astype(np.float32)
H, W = im.shape[:2]
r, g, b, a = im[..., 0], im[..., 1], im[..., 2], im[..., 3]
lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
neutral = (np.abs(r - g) < 14) & (np.abs(g - b) < 14) & (r > 90)
dark = (a >= 250) & (lum < 150) & ~neutral & (r < 40)
near = np.array(Image.fromarray((dark * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(17))) > 0
neon = (a >= 200) & (g > 200) & (r > 95) & ~neutral & near
body = dark | neon

def label(mask):
    """4-connected components → (labels, sizes)."""
    lab = np.full(mask.shape, -1, np.int32); sizes = []
    h, w = mask.shape
    for y0 in range(h):
        row = mask[y0]
        for x0 in np.nonzero(row & (lab[y0] < 0))[0]:
            if lab[y0, x0] >= 0:
                continue
            n = len(sizes); lab[y0, x0] = n; q = deque([(y0, x0)]); c = 0
            while q:
                y, x = q.popleft(); c += 1
                for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and lab[yy, xx] < 0:
                        lab[yy, xx] = n; q.append((yy, xx))
            sizes.append(c)
    return lab, sizes

# Outside = everything not body that connects to the image border.
bl, _ = label(~body)
border = set(np.unique(np.concatenate([bl[0], bl[-1], bl[:, 0], bl[:, -1]]))) - {-1}
outside = np.isin(bl, list(border))
near_out = np.array(Image.fromarray((outside * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
# Neon strokes inside a letter are counter outlines: open them, and any
# black island they enclose (the O's centre is filled in the source).
counter = neon & ~near_out
letters = body & ~counter
ll, sizes = label(letters)
small = [i for i, s in enumerate(sizes) if s < 5000]
letters &= ~np.isin(ll, small)
# Identify letters by their black cores (their neon rims can touch), then
# hand each rim pixel to the nearest core.
dl, dsizes = label(dark & letters)
big = {i: n + 1 for n, i in enumerate(i for i, s in enumerate(dsizes) if s >= 3000)}
print('letters found', len(big))
own_px = np.zeros(dl.shape, np.int32)
for i, n in big.items():
    own_px[dl == i] = n
for _ in range(14):
    grow = own_px.copy()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        sh = np.roll(own_px, (dy, dx), (0, 1))
        grow = np.where((grow == 0) & (sh > 0), sh, grow)
    own_px = grow
ll = np.where(letters, own_px - 1, -1)

# Grid: each cell takes the letter with most coverage (≥ 50%).
own = -np.ones((ROWS, COLS), np.int32)
for j in range(ROWS):
    for i in range(COLS):
        ys = slice(int(round(Y0 + j * S)), int(round(Y0 + (j + 1) * S)))
        xs = slice(int(round(X0 + i * S)), int(round(X0 + (i + 1) * S)))
        patch = ll[ys, xs]
        vals, counts = np.unique(patch[patch >= 0], return_counts=True)
        if len(vals) and counts.sum() >= 0.5 * patch.size:
            own[j, i] = vals[np.argmax(counts)]
# Keep neighbouring letters a cell apart: drop cells that touch another letter.
cut = np.zeros_like(own, bool)
for j in range(ROWS):
    for i in range(COLS):
        if own[j, i] < 0:
            continue
        for jj, ii in ((j + 1, i), (j, i + 1), (j + 1, i + 1), (j + 1, i - 1)):
            if 0 <= jj < ROWS and 0 <= ii < COLS and own[jj, ii] >= 0 and own[jj, ii] != own[j, i]:
                cut[jj, ii] = True
on = (own >= 0) & ~cut

# Tidy: drop one-cell spurs, fill pinholes (enclosed gaps of one or two cells).
for _ in range(3):
    p4 = np.pad(on, 1, constant_values=False)
    nb = p4[:-2, 1:-1].astype(int) + p4[2:, 1:-1] + p4[1:-1, :-2] + p4[1:-1, 2:]
    on &= nb >= 2
empty = ~on
gl, gsizes = label(empty)
edge = set(np.unique(np.concatenate([gl[0], gl[-1], gl[:, 0], gl[:, -1]]))) - {-1}
for i, sz in enumerate(gsizes):
    if i not in edge and sz <= 2:
        on[gl == i] = True

pad = np.pad(on, 1, constant_values=False)
n4 = pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:]
rim = on & ~n4

out = np.zeros((ROWS * CELL, COLS * CELL, 4), np.uint8)
for j in range(ROWS):
    for i in range(COLS):
        if on[j, i]:
            out[j * CELL:(j + 1) * CELL, i * CELL:(i + 1) * CELL] = (*(GREEN if rim[j, i] else BLACK), 255)
Image.fromarray(out, 'RGBA').save(OUT, optimize=True)
print('grid', COLS, ROWS, 'filled', int(on.sum()), 'rim', int(rim.sum()))

# Ring geometry in grid units, relative to the grid centre (y up).
cx, cy = X0 + COLS * S / 2, Y0 + ROWS * S / 2
print(json.dumps({'cols': COLS, 'rows': ROWS, 'cx': round((400 - cx) / S, 3), 'cy': round((cy - 313) / S, 3),
                  'inner': round(226 / S, 3), 'outer': round(290 / S, 3), 'screws': round(259 / S, 3)}))
if PREV:
    bg = Image.new('RGBA', (out.shape[1], out.shape[0]), (14, 15, 14, 255))
    bg.alpha_composite(Image.fromarray(out, 'RGBA'))
    bg.resize((bg.width * 2, bg.height * 2), Image.NEAREST).save(PREV)
