"""Geometry for the Domo sigil chrome sculpture (Blender 5.2: numpy + mathutils).

All distances are SVG units (viewBox 0 0 2508 2508, y flipped up) until `to_blender`.

  1. The three closed cubic-Bezier contours of domo-sigil.svg are flattened to a fine CCW
     polyline. Tracer notches (convex/concave pairs) are relaxed and a sigma-2.5 low-pass
     removes 1-3 unit tracer steps (the source drawing is smooth there); real corners
     (needle tips r=0.6, the Z's angles, armpits r=3) are filleted and protected.
  2. Shrinking-ball medial radius R and contact partner for every outline point.
  3. Cross-section everywhere: z = H * g(min(D / RB, 1)), g(x) = (1 - (1-x)^P)^(1/Q)
     D  = distance to the outline (exact near it, blending into a blurred copy deeper in,
          which rounds the spine ridge where the two sides of a stroke meet),
     RB = bevel radius field (eroded, blurred R): rounded bevel, then a flat crest strip,
     H  = half thickness (HMAX on the body, easing down along needles as they narrow).
     g has a vertical tangent at the outline, so front and back meet with no seam.
  4. Front = constrained Delaunay triangulation of outline samples (paired across each
     stroke through the medial partner so cross-sections line up), 'spoke' points at
     equal arc-length steps of the profile, concave-fan and fill points; lifted to z;
     sub-quantization edges/slivers collapsed; back = mirror sharing the outline loop,
     so each piece is a closed 2-manifold. Normals are analytic (profile slope x grad D
     + grad H + grad RB), eased toward the facets only at a handful of needle points.
"""
import math
import re

import numpy as np

# ---------------------------------------------------------------------------
# parameters (SVG units; the sigil is 2405 units tall)
# ---------------------------------------------------------------------------
PARAMS = dict(
    HMAX=75.0,        # half thickness of the body (total 150 = 6.2% of the height)
    R_FULL=16.0,      # strokes at least this half-wide get the full thickness
    K_TIP=1.4,        # depth/width ratio a needle eases to at its point
    P=2.0,            # face doming exponent (2 = elliptic shoulder into the flat crest)
    Q=3.0,            # side squareness exponent (higher = straighter cast walls)
    R_TIP=0.6,        # convex corner fillet (needle points)
    R_CONCAVE=3.0,    # concave corner fillet (armpits)
    KINK_L=2.0,       # half length relaxed around a tracer jog
    FINE=0.1,         # flattening step
    DENSE=0.3,        # outline sampling for distance / medial queries
    GRID=1.5,         # raster step for the thickness field
    DILATE=5,         # raster px of masked dilation of R (7.5 units)
    BLUR=6,           # box radius (px) x 3 passes of the thickness field
    SMOOTH=2.5,       # outline low-pass sigma (tracer steps), faded out at corners
    ARC_IGNORE=4.0,   # medial radius ignores contacts nearer than this along the outline
    RSMOOTH=4.0,      # sigma (outline units) of the R copy used for the section coordinate
    BEVEL_K=0.85,     # bevel radius = BEVEL_K * local stroke half-width (rest = flat crest)
    BEVEL_MAX=0.0,    # optional cap on the bevel radius (0 = none)
    ERODE=3,          # raster px of masked erosion of R for the bevel field
    RBBLUR=3,         # box radius (px, x3 passes) smoothing the bevel field
    DBLUR=2,          # box radius (px, x3 passes) of the blurred distance used off the outline
    DB_START=6.0,     # blurred distance blends in from this depth ...
    DB_RAMP=3.0,      # ... over this many units
    SIZE_K=2.0,       # outline spacing <= SIZE_K * R (anisotropic: sections stay dense) ...
    SIZE_MIN=0.4,
    SIZE_MAX=15.0,
    CURV_K=0.35,      # ... and <= CURV_K * radius of curvature
    LEVELS=5,         # spoke points per outline point (profile arc-length steps)
    LEVEL_LEN=1.0,    # ~one spoke level per this much profile length (capped at LEVELS)
    CURV_W=0.6,       # extra spoke density on the profile's shoulder
    FILL=0.75,        # fill point spacing factor
    SPOKE_MIN=0.04,   # plan-view floor of the sample rejection radius
    MIN3D=0.45,       # edges shorter than this in 3D are collapsed (3 quanta of the 14-bit GLB)
)


def unit(v, axis=-1):
    n = np.linalg.norm(v, axis=axis, keepdims=True)
    return v / np.maximum(n, 1e-12)


# ---------------------------------------------------------------------------
# SVG
# ---------------------------------------------------------------------------

def load_svg(path):
    """-> list of (n,4,2) cubic control points per <path> (absolute M/C/L/Z only)."""
    s = open(path, encoding="utf-8").read()
    out = []
    for m in re.finditer(r"<path\b[^>]*>", s):
        tag = m.group(0)
        d = re.search(r'\sd="([^"]*)"', tag).group(1)
        tr = re.search(r"translate\(\s*([-\d.eE]+)[\s,]+([-\d.eE]+)\s*\)", tag)
        off = np.array([float(tr.group(1)), float(tr.group(2))]) if tr else np.zeros(2)
        toks = re.findall(r"[A-Za-z]|-?\d*\.?\d+(?:[eE][-+]?\d+)?", d)
        i, cur, start, segs = 0, None, None, []
        while i < len(toks):
            t = toks[i]
            if t == "M":
                cur = np.array([float(toks[i + 1]), float(toks[i + 2])])
                start = cur
                i += 3
            elif t == "C":
                p = np.array([float(x) for x in toks[i + 1:i + 7]]).reshape(3, 2)
                segs.append(np.vstack([cur, p]))
                cur = p[2]
                i += 7
            elif t == "L":
                p = np.array([float(toks[i + 1]), float(toks[i + 2])])
                segs.append(np.vstack([cur, cur + (p - cur) / 3, cur + 2 * (p - cur) / 3, p]))
                cur = p
                i += 3
            elif t in "Zz":
                if np.linalg.norm(cur - start) > 1e-9:
                    segs.append(np.vstack([cur, cur + (start - cur) / 3, cur + 2 * (start - cur) / 3, start]))
                cur = start
                i += 1
            else:
                raise ValueError(f"unsupported path command {t!r}")
        out.append(np.array(segs) + off)
    return out


def bezier(P, t):
    t = t[:, None]
    mt = 1 - t
    return mt ** 3 * P[0] + 3 * mt * mt * t * P[1] + 3 * mt * t * t * P[2] + t ** 3 * P[3]


def flatten(segs, step):
    pts = []
    for P in segs:
        L = np.linalg.norm(np.diff(P, axis=0), axis=1).sum()
        n = max(2, int(math.ceil(L / step)))
        pts.append(bezier(P, np.arange(n) / n))
    P = np.vstack(pts)
    keep = np.linalg.norm(P - np.roll(P, 1, 0), axis=1) > 1e-7
    return P[keep]


# ---------------------------------------------------------------------------
# closed polyline helpers
# ---------------------------------------------------------------------------

def arc(P):
    seg = np.linalg.norm(np.roll(P, -1, 0) - P, axis=1)
    s = np.concatenate([[0.0], np.cumsum(seg)[:-1]])
    return s, seg.sum()


def at(P, s, L, x):
    return np.column_stack([np.interp(x, s, P[:, 0], period=L), np.interp(x, s, P[:, 1], period=L)])


def signed_area(P):
    return 0.5 * np.sum(P[:, 0] * np.roll(P[:, 1], -1) - np.roll(P[:, 0], -1) * P[:, 1])


def turn(P, s, L, win):
    a = at(P, s, L, s - win)
    b = at(P, s, L, s + win)
    di = unit(P - a)
    do = unit(b - P)
    return np.arctan2(di[:, 0] * do[:, 1] - di[:, 1] * do[:, 0], (di * do).sum(1))


def resample(P, step):
    s, L = arc(P)
    n = max(16, int(round(L / step)))
    return at(P, s, L, np.arange(n) * (L / n))


def tangents(P):
    return unit(np.roll(P, -1, 0) - np.roll(P, 1, 0))


def inward(P):
    """Inward normals of a CCW polyline (left of the direction of travel)."""
    T = tangents(P)
    return np.column_stack([-T[:, 1], T[:, 0]])


# ---------------------------------------------------------------------------
# corners: fillet real corners, relax tracer jogs
# ---------------------------------------------------------------------------

def _bez_join(P1, d1, P2, d2, step):
    th = math.acos(max(-1.0, min(1.0, float(d1 @ d2))))
    c = float(np.linalg.norm(P2 - P1))
    if th < 1e-3:
        lam = c / 3
    else:
        r = c / (2 * math.sin(th / 2))
        lam = (4.0 / 3.0) * math.tan(th / 4) * r
    B = np.array([P1, P1 + d1 * lam, P2 - d2 * lam, P2])
    L = np.linalg.norm(np.diff(B, axis=0), axis=1).sum()
    n = max(4, int(math.ceil(L / step)))
    return bezier(B, np.arange(n + 1) / n)


def clean_corners(P, prm, log=print, name=""):
    """P: fine CCW polyline. Returns the polyline with corners filleted / jogs relaxed."""
    step = prm["FINE"]
    s, L = arc(P)
    t1 = np.degrees(turn(P, s, L, 1.0))
    t4 = np.degrees(turn(P, s, L, 4.0))
    idx = np.nonzero(np.abs(t1) > 20)[0]
    if not len(idx):
        return smooth_outline(P, prm)
    groups = np.split(idx, np.nonzero(np.diff(idx) > int(3 / step))[0] + 1)
    # wrap-around group merge
    if len(groups) > 1 and groups[0][0] == 0 and groups[-1][-1] == len(P) - 1:
        groups[0] = np.concatenate([groups[-1], groups[0]])
        groups.pop()
    apex = [int(g[np.argmax(np.abs(t1[g]))]) for g in groups]
    # a real corner is a big turn with no opposite-sign turn nearby; a convex/concave
    # pair within 10 units is a tracer notch (the source drawing is smooth there)
    jog = [abs(t4[k]) < 50 for k in apex]
    for i, ki in enumerate(apex):
        for j, kj in enumerate(apex):
            if i != j and np.sign(t1[ki]) != np.sign(t1[kj]):
                ds = abs(s[ki] - s[kj])
                if min(ds, L - ds) < 10.0:
                    jog[i] = jog[j] = True
    jobs = []
    for k, is_jog in zip(apex, jog):
        th4 = t4[k]
        if not is_jog:              # a real corner
            r = prm["R_TIP"] if th4 > 0 else prm["R_CONCAVE"]
            need = 2 * r * math.sin(math.radians(min(abs(th4), 179.0)) / 2)
            Ls = np.arange(0.2, 40.0, step)
            chord = np.linalg.norm(at(P, s, L, s[k] - Ls) - at(P, s, L, s[k] + Ls), axis=1)
            j = int(np.argmax(chord >= need)) if (chord >= need).any() else len(Ls) - 1
            Lc = max(Ls[j], 0.3)
            jobs.append([s[k] - Lc, s[k] + Lc, "tip" if th4 > 0 else "armpit"])
        else:                        # tracer jog / notch
            jobs.append([s[k] - prm["KINK_L"], s[k] + prm["KINK_L"], "jog"])
    jobs.sort()
    # merge overlapping jog spans (a notch pair becomes one relaxed span)
    merged = []
    for a, b, kind in jobs:
        if merged and kind == "jog" and merged[-1][2] == "jog" and a <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b, kind])
    # replace [a, b] ranges (skip overlaps)
    keep = np.ones(len(P), bool)
    inserts = []
    taken = []
    counts = {"tip": 0, "armpit": 0, "jog": 0}
    for a, b, kind in merged:
        if any(not (b < ta or a > tb) for ta, tb in taken):
            continue
        taken.append((a, b))
        counts[kind] += 1
        P1 = at(P, s, L, np.array([a]))[0]
        P2 = at(P, s, L, np.array([b]))[0]
        d1 = unit(at(P, s, L, np.array([a + 0.4]))[0] - at(P, s, L, np.array([a - 0.4]))[0])
        d2 = unit(at(P, s, L, np.array([b + 0.4]))[0] - at(P, s, L, np.array([b - 0.4]))[0])
        seg = _bez_join(P1, d1, P2, d2, step)
        ss = np.mod(s - a, L)
        keep &= ~(ss <= (b - a))
        inserts.append((np.mod(a, L), seg))
    # rebuild in arc order
    pieces = [(s[i], P[i:i + 1]) for i in np.nonzero(keep)[0]]
    pieces += inserts
    pieces.sort(key=lambda x: x[0])
    Q = np.vstack([p for _, p in pieces])
    Qk = np.linalg.norm(Q - np.roll(Q, 1, 0), axis=1) > 1e-7
    Q = Q[Qk]
    log(f"[{name}] corners: {counts}")
    # corner centres in the new polyline's arc coordinates (for smoothing protection)
    sq, Lq = arc(Q)
    tq = np.degrees(turn(Q, sq, Lq, 1.0))
    real = [((a + b) / 2, (b - a) / 2) for a, b, kind in merged if kind != "jog"]
    centres = []
    for mid, half in real:
        p = at(P, s, L, np.array([mid]))[0]
        j = int(np.argmin(np.linalg.norm(Q - p, axis=1)))
        centres.append((sq[j], half))
    return smooth_outline(Q, prm, centres)


def smooth_outline(P, prm, centres=()):
    """Gaussian low-pass along the outline (sigma SMOOTH units): removes the tracer's
    1-3 unit steps and ripple (the source drawing is smooth there). Faded out around
    real corners (+-(half span + 3 sigma)) so needle points and armpits stay crisp and
    the kernel never averages the two sides of a needle."""
    step = prm["FINE"]
    s0, L0 = arc(P)
    P = resample(P, step)
    s, L = arc(P)
    n = len(P)
    sig = prm["SMOOTH"] / step
    r = int(3 * sig)
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sig) ** 2)
    k /= k.sum()
    Pp = np.vstack([P[-r:], P, P[:r]])
    Sm = np.column_stack([np.convolve(Pp[:, 0], k, "valid"), np.convolve(Pp[:, 1], k, "valid")])
    w = np.ones(n)
    ramp = 2.0 * prm["SMOOTH"]
    for c, half in centres:
        c = c * L / L0
        d = np.abs(s - c)
        d = np.minimum(d, L - d)
        prot = half + 3.0 * prm["SMOOTH"] + 0.5
        w = np.minimum(w, np.clip((d - prot) / ramp, 0, 1))
    w = w[:, None]
    return P * (1 - w) + Sm * w


# ---------------------------------------------------------------------------
# Outline: dense samples + KD tree + medial radius + foot queries
# ---------------------------------------------------------------------------

class Outline:
    def __init__(self, P, prm):
        from mathutils.kdtree import KDTree
        self.prm = prm
        self.P = resample(P, prm["DENSE"])
        self.n = len(self.P)
        self.N = inward(self.P)
        self.s, self.L = arc(self.P)
        kd = KDTree(self.n)
        for i, (x, y) in enumerate(self.P):
            kd.insert((x, y, 0.0), i)
        kd.balance()
        self.kd = kd
        self.R = self._medial_radius()
        # R jumps around concave corners (the inscribed disc's far contact switches from
        # one stroke to the other); the section coordinate u uses a smoothed copy
        sig = prm["RSMOOTH"] / prm["DENSE"]
        r = int(3 * sig)
        k = np.exp(-0.5 * (np.arange(-r, r + 1) / sig) ** 2)
        k /= k.sum()
        self.Ru = np.convolve(np.concatenate([self.R[-r:], self.R, self.R[:r]]), k, "valid")
        th = turn(self.P, self.s, self.L, 1.0)
        self.curv_r = 2.0 / np.maximum(np.abs(th), 1e-6)   # radius of curvature (chord win 1)

    def _medial_radius(self, R0=150.0):
        """Shrinking-ball medial radius. Contacts closer than ARC_IGNORE along the outline
        are ignored, so the radius measures the stroke (opposite side), not sub-unit
        ripple; this only ever makes R larger, so u = t/R stays <= 1."""
        P, N, kd = self.P, self.N, self.kd
        n_all = self.n
        m = max(1, int(round(self.prm["ARC_IGNORE"] / self.prm["DENSE"])))
        R = np.empty(self.n)
        partner = np.full(self.n, -1, int)
        for i in range(self.n):
            q = P[i]
            n = N[i]
            r = R0

            def far(j, i=i):
                d = abs(j - i)
                return min(d, n_all - d) >= m

            for _ in range(60):
                c = q + n * r
                co, j, d = kd.find((c[0], c[1], 0.0), filter=far)
                if j is None or d >= r * (1 - 1e-7):
                    break
                v = P[j] - q
                den = 2.0 * (n @ v)
                if den <= 1e-12:
                    break
                rn = (v @ v) / den
                if rn >= r:
                    break
                r = rn
                partner[i] = j
            R[i] = r
        self.partner = partner      # contact point of the maximal disc (the far side)
        return R

    def foot(self, X, raw=False):
        """X (m,2) -> signed distance t (>0 inside), foot q, interpolated R (smoothed copy,
        or the raw shrinking-ball radius with raw=True), inward normal n, arc position s."""
        P, kd = self.P, self.kd
        m = len(X)
        idx = np.empty(m, int)
        for k in range(m):
            idx[k] = kd.find((X[k, 0], X[k, 1], 0.0))[1]
        best_d = np.full(m, np.inf)
        best_q = np.zeros((m, 2))
        best_a = np.zeros(m, int)
        best_l = np.zeros(m)
        for off in (-1, 0):
            a = (idx + off) % self.n
            b = (a + 1) % self.n
            A, B = P[a], P[b]
            AB = B - A
            l = np.clip(((X - A) * AB).sum(1) / np.maximum((AB * AB).sum(1), 1e-12), 0, 1)
            q = A + AB * l[:, None]
            d = np.linalg.norm(X - q, axis=1)
            better = d < best_d
            best_d[better] = d[better]
            best_q[better] = q[better]
            best_a[better] = a[better]
            best_l[better] = l[better]
        a = best_a
        b = (a + 1) % self.n
        l = best_l
        RR = self.R if raw else self.Ru
        R = RR[a] * (1 - l) + RR[b] * l
        n = unit(self.N[a] * (1 - l)[:, None] + self.N[b] * l[:, None])
        sgn = np.sign(((X - best_q) * n).sum(1))
        sgn[sgn == 0] = 1
        s = self.s[a] + l * np.linalg.norm(P[b] - P[a], axis=1)
        return best_d * sgn, best_q, R, n, s

    def u(self, X):
        t, q, R, n, s = self.foot(X)
        return t / np.maximum(R, 1e-6)

    def at_s(self, x):
        """Interpolated position / normal / R at arc positions x."""
        P = at(self.P, self.s, self.L, x)
        N = unit(np.column_stack([np.interp(x, self.s, self.N[:, 0], period=self.L),
                                  np.interp(x, self.s, self.N[:, 1], period=self.L)]))
        R = np.interp(x, self.s, self.R, period=self.L)
        cr = np.interp(x, self.s, self.curv_r, period=self.L)
        return P, N, R, cr


# ---------------------------------------------------------------------------
# thickness field (raster)
# ---------------------------------------------------------------------------

def taper(R, prm):
    x = np.clip(R / prm["R_FULL"], 0.0, 1.0)
    a = min(prm["K_TIP"] * prm["R_FULL"] / prm["HMAX"], 1.45)
    phi = a * x + (3 - 2 * a) * x * x + (a - 2) * x ** 3
    return prm["HMAX"] * phi


def scanline_mask(P, x0, y0, g, nx, ny):
    """Even-odd fill of polygon P on pixel centres (x0 + i g, y0 + j g)."""
    M = np.zeros((ny, nx), bool)
    A = P
    B = np.roll(P, -1, 0)
    ylo = np.minimum(A[:, 1], B[:, 1])
    yhi = np.maximum(A[:, 1], B[:, 1])
    order = np.argsort(ylo)
    ylo_s = ylo[order]
    for j in range(ny):
        y = y0 + j * g
        k = np.searchsorted(ylo_s, y, side="right")
        cand = order[:k]
        cand = cand[yhi[cand] > y]
        if not len(cand):
            continue
        a, b = A[cand], B[cand]
        x = a[:, 0] + (y - a[:, 1]) * (b[:, 0] - a[:, 0]) / (b[:, 1] - a[:, 1])
        x.sort()
        for xa, xb in zip(x[0::2], x[1::2]):
            i0 = max(0, int(math.ceil((xa - x0) / g)))
            i1 = min(nx - 1, int(math.floor((xb - x0) / g)))
            if i1 >= i0:
                M[j, i0:i1 + 1] = True
    return M


def _shift(A, dy, dx, fill):
    out = np.full_like(A, fill)
    H, W = A.shape
    ys = slice(max(dy, 0), H + min(dy, 0))
    yd = slice(max(-dy, 0), H + min(-dy, 0))
    xs = slice(max(dx, 0), W + min(dx, 0))
    xd = slice(max(-dx, 0), W + min(-dx, 0))
    out[ys, xs] = A[yd, xd]
    return out


class Field:
    """Smoothed per-piece half-thickness H on a raster, bilinear sampled."""

    def __init__(self, outlines, prm, log=print):
        g = prm["GRID"]
        allP = np.vstack([o.P for o in outlines])
        lo = allP.min(0) - 12 * g
        hi = allP.max(0) + 12 * g
        nx = int(math.ceil((hi[0] - lo[0]) / g)) + 1
        ny = int(math.ceil((hi[1] - lo[1]) / g)) + 1
        self.x0, self.y0, self.g, self.nx, self.ny = lo[0], lo[1], g, nx, ny
        Rr = np.zeros((ny, nx))
        Rraw = np.zeros((ny, nx))
        M = np.zeros((ny, nx), bool)
        owner = np.full((ny, nx), -1, int)
        for k, o in enumerate(outlines):
            Mk = scanline_mask(o.P, lo[0], lo[1], g, nx, ny)
            jj, ii = np.nonzero(Mk)
            X = np.column_stack([lo[0] + ii * g, lo[1] + jj * g])
            t, q, R, n, s = o.foot(X)
            Rr[jj, ii] = R
            Rraw[jj, ii] = o.foot(X, raw=True)[2]
            M |= Mk
            owner[Mk] = k
        self.M = M
        self.owner = owner
        # masked dilation (inside only, per piece), then masked blur
        D = np.where(M, Rr, -1.0)
        for _ in range(prm["DILATE"]):
            best = D.copy()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dy == 0 and dx == 0:
                        continue
                    S = _shift(D, dy, dx, -1.0)
                    So = _shift(owner, dy, dx, -1)
                    ok = M & (So == owner)
                    best = np.where(ok & (S > best), S, best)
            D = best
        # thickness: per piece (no bleeding across the gaps between pieces), blurred wide so
        # a thin thorn eases down from the body's depth instead of stepping off a shelf
        self.Hk, self.RBk = [], []
        for k in range(len(outlines)):
            Mk = owner == k
            Rs = self._masked_blur_extend(np.where(Mk, D, 0.0), Mk, prm["BLUR"])
            self.Hk.append(taper(Rs, prm))
        self.H = self.Hk[0]
        # bevel radius: how far in from the outline the rounded profile reaches the flat
        # crest. Eroded (min-filtered) raw disc radius, so the bevel never reaches past a
        # stroke's spine (the spine kink of the distance field must stay in the flat strip)
        E = np.where(M, Rraw, np.inf)
        for _ in range(prm["ERODE"]):
            best = E.copy()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dy == 0 and dx == 0:
                        continue
                    S = _shift(E, dy, dx, np.inf)
                    So = _shift(owner, dy, dx, -1)
                    ok = M & (So == owner)
                    best = np.where(ok & (S < best), S, best)
            E = best
        E = np.where(M, E, 0.0)
        for k in range(len(outlines)):
            Mk = owner == k
            RB = prm["BEVEL_K"] * self._masked_blur_extend(np.where(Mk, E, 0.0), Mk, prm["RBBLUR"])
            if prm["BEVEL_MAX"] > 0:
                RB = np.minimum(RB, prm["BEVEL_MAX"])
            self.RBk.append(np.maximum(RB, 0.3))
        self.RB = self.RBk[0]
        log(f"[field] raster {nx}x{ny} inside={M.sum()} R range {Rr[M].min():.2f}..{Rr[M].max():.2f}")
        # per piece: blurred signed distance (rounds the spine ridge of the distance field)
        self.DB = []
        clampv = -12.0
        for k, o in enumerate(outlines):
            Mk = owner == k
            band = Mk.copy()
            for _ in range(8):
                grow = band.copy()
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    grow |= _shift(band, dy, dx, False)
                band = grow
            Dk = np.full((ny, nx), clampv)
            jj, ii = np.nonzero(band)
            X = np.column_stack([lo[0] + ii * g, lo[1] + jj * g])
            Dk[jj, ii] = np.maximum(o.foot(X)[0], clampv)
            r = prm["DBLUR"]
            for _ in range(3):
                Dk = self._box(Dk, r) / (2 * r + 1) ** 2
            self.DB.append(Dk)

    def _masked_blur_extend(self, A, M, rad):
        V = np.where(M, A, 0.0)
        W = M.astype(float)
        for _ in range(3):
            V = self._box(V, rad)
            W = self._box(W, rad)
        out = np.where(W > 1e-6, V / np.maximum(W, 1e-6), 0.0)
        # extend beyond the mask so bilinear samples at the outline are valid
        known = M.copy()
        for _ in range(8):
            acc = np.zeros_like(out)
            cnt = np.zeros_like(out)
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    acc += _shift(np.where(known, out, 0.0), dy, dx, 0.0)
                    cnt += _shift(known.astype(float), dy, dx, 0.0)
            new = (~known) & (cnt > 0)
            out = np.where(new, acc / np.maximum(cnt, 1), out)
            known |= new
        return out

    @staticmethod
    def _box(A, r):
        c = np.cumsum(np.pad(A, ((r + 1, r), (0, 0))), 0)
        A = c[2 * r + 1:] - c[:-2 * r - 1]
        c = np.cumsum(np.pad(A, ((0, 0), (r + 1, r))), 1)
        return c[:, 2 * r + 1:] - c[:, :-2 * r - 1]

    def sample(self, X, F=None):
        F = self.H if F is None else F
        fx = (X[:, 0] - self.x0) / self.g
        fy = (X[:, 1] - self.y0) / self.g
        i = np.clip(np.floor(fx).astype(int), 0, self.nx - 2)
        j = np.clip(np.floor(fy).astype(int), 0, self.ny - 2)
        ax = np.clip(fx - i, 0, 1)
        ay = np.clip(fy - j, 0, 1)
        return ((F[j, i] * (1 - ax) + F[j, i + 1] * ax) * (1 - ay)
                + (F[j + 1, i] * (1 - ax) + F[j + 1, i + 1] * ax) * ay)

    def grad(self, X, F=None):
        h = self.g
        ex = np.array([h, 0.0])
        ey = np.array([0.0, h])
        return np.column_stack([(self.sample(X + ex, F) - self.sample(X - ex, F)) / (2 * h),
                                (self.sample(X + ey, F) - self.sample(X - ey, F)) / (2 * h)])


# ---------------------------------------------------------------------------
# profile
# ---------------------------------------------------------------------------

def prof(u, prm):
    w = 1.0 - np.clip(u, 0.0, 1.0)
    return (1.0 - w ** prm["P"]) ** (1.0 / prm["Q"])


def dprof(u, prm):
    w = 1.0 - np.clip(u, 0.0, 1.0)
    p, q = prm["P"], prm["Q"]
    base = np.maximum(1.0 - w ** p, 1e-12)
    return (1.0 / q) * base ** (1.0 / q - 1.0) * p * w ** (p - 1.0)


def spoke_levels(R, H, prm, n_s=240, RB=None):
    """Per outline point: fractions u of the spoke length R (outline -> disc centre on the
    spine) for up to LEVELS points at equal (arc + shoulder-weighted turning) steps of the
    section profile  X = uR, Z = H g(min(uR / RB, 1)); last one at u = 1. NaN = unused."""
    M = prm["LEVELS"]
    v = np.linspace(0, 1, n_s)
    uu = v ** 3                                   # dense near the outline
    RB = R if RB is None else RB
    X = uu[None, :] * R[:, None]
    f = prof(X / np.maximum(RB[:, None], 1e-6), prm)
    Z = f * H[:, None]
    dX = np.diff(X, axis=1)
    dZ = np.diff(Z, axis=1)
    ds = np.hypot(dX, dZ)
    ang = np.arctan2(dZ, dX)
    dth = np.abs(np.diff(ang, axis=1, prepend=ang[:, :1]))
    meas = ds + prm["CURV_W"] * dth * (0.5 * (R + H))[:, None] / math.pi
    c = np.concatenate([np.zeros((len(R), 1)), np.cumsum(meas, 1)], 1)
    length = np.hypot(dX, dZ).sum(1)
    ms = np.clip(np.round(length / prm["LEVEL_LEN"]), 2, M).astype(int)
    c /= c[:, -1:]
    out = np.full((len(R), M), np.nan)
    for i in range(len(R)):
        m = ms[i]
        out[i, :m] = np.interp(np.arange(1, m + 1) / m, c[i], uu)
        out[i, m - 1] = 1.0
    return out


# ---------------------------------------------------------------------------
# sampling + triangulation of one piece
# ---------------------------------------------------------------------------

class Hash:
    """2D-bucketed points with an estimated height: rejection tests use 3D distance, so
    the steep side (points close in plan but far apart in z) keeps its samples."""

    def __init__(self, cell):
        self.c = cell
        self.d = {}
        self.pts = []

    def add(self, p, z=0.0):
        k = (int(math.floor(p[0] / self.c)), int(math.floor(p[1] / self.c)))
        self.d.setdefault(k, []).append(len(self.pts))
        self.pts.append((p[0], p[1], z))

    def near(self, p, r, z=0.0):
        c = self.c
        kx, ky = int(math.floor(p[0] / c)), int(math.floor(p[1] / c))
        n = int(math.ceil(r / c))
        r2 = r * r
        for ix in range(kx - n, kx + n + 1):
            for iy in range(ky - n, ky + n + 1):
                for j in self.d.get((ix, iy), ()):
                    q = self.pts[j]
                    if (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 + (q[2] - z) ** 2 < r2:
                        return True
        return False


def outline_samples(o, prm):
    """Mesh outline points: spacing ~ SIZE_K * R, <= CURV_K * curvature radius, graded."""
    x = o.s
    size = np.clip(prm["SIZE_K"] * o.R, prm["SIZE_MIN"], prm["SIZE_MAX"])
    size = np.minimum(size, np.maximum(prm["CURV_K"] * o.curv_r, prm["SIZE_MIN"]))
    # grading: spacing may grow by at most 0.3 units per unit of outline (both ways, wrapped)
    lim = 0.3 * prm["DENSE"]
    sz = size.tolist()
    n = len(sz)
    for _ in range(2):
        for i in range(1, 2 * n):
            a, b = i % n, (i - 1) % n
            if sz[a] > sz[b] + lim:
                sz[a] = sz[b] + lim
        for i in range(2 * n - 2, -1, -1):
            a, b = i % n, (i + 1) % n
            if sz[a] > sz[b] + lim:
                sz[a] = sz[b] + lim
    size = np.array(sz)
    xs = paired_walk(o, size)
    return xs, np.interp(xs, x, size, period=o.L)


def paired_walk(o, size):
    """Greedy walk along the outline placing samples ~size apart. Every new sample also
    drops a sample at its medial partner (the far side of the stroke, same inscribed
    disc), so both sides of a stroke get matching spokes that meet at one crest point:
    cross-sections line up instead of zig-zagging across the spine."""
    import bisect
    L, dn = o.L, o.prm["DENSE"]
    n = o.n

    def sz(p):
        return size[int(round(p / dn)) % n]

    def partner_pos(p):
        j = o.partner[int(round(p / dn)) % n]
        return None if j < 0 else o.s[j]

    S = []

    def try_add(p, strict):
        p = p % L
        k = bisect.bisect_left(S, p)
        h = sz(p)
        for q in (S[k - 1] if k > 0 else S[-1] if S else None, S[k % len(S)] if S else None):
            if q is not None:
                d = abs(q - p)
                if min(d, L - d) < (0.45 if strict else 0.3) * h:
                    return False
        S.insert(k, p)
        return True

    try_add(0.0, False)
    pp = partner_pos(0.0)
    if pp is not None:
        try_add(pp, True)
    pos = 0.0
    guard = 0
    while guard < 200000:
        guard += 1
        h = sz(pos)
        k = bisect.bisect_right(S, pos + 1e-9)
        nxt = S[k] if k < len(S) else None
        if nxt is not None and nxt <= pos + 1.35 * h:
            pos = nxt
            continue
        new = pos + h
        if new > L - 0.5 * h:
            break
        try_add(new, False)
        pp = partner_pos(new)
        if pp is not None:
            try_add(pp, True)
        pos = new
    return np.array(S)


def piece_mesh(o, field, prm, log=print, name="", k=0):
    """-> V2 (n,2), is_boundary (n,), tris (k,3) CCW, boundary loop order."""
    from mathutils import Vector
    from mathutils.geometry import delaunay_2d_cdt
    xs, sz = outline_samples(o, prm)
    Bp, Bn, BR, _ = o.at_s(xs)
    BH = field.sample(Bp, field.Hk[k])
    BRB = field.sample(Bp, field.RBk[k])
    nb = len(Bp)
    U = spoke_levels(BR, BH, prm, RB=BRB)
    hsh = Hash(2.0)
    for p in Bp:
        hsh.add(p, 0.0)
    fl = prm["SPOKE_MIN"]
    use_z = False           # plan-view rejection (3D spacing is enforced later by collapse)
    inner = []
    m = prm["LEVELS"]
    prevU = np.zeros(nb)
    prevZ = np.zeros(nb)
    for lev in range(m):
        uk = U[:, lev]
        ukz = np.nan_to_num(uk)
        pts = Bp + Bn * (ukz * BR)[:, None]
        zk = BH * prof(ukz * BR / np.maximum(BRB, 1e-6), prm)
        gap = np.hypot((ukz - prevU) * BR, zk - prevZ) if use_z else (ukz - prevU) * BR
        rej = np.maximum(0.5 * np.minimum(sz, gap), fl)
        for i in range(nb):
            if not np.isfinite(uk[i]):
                continue
            p = pts[i]
            zz = zk[i] if use_z else 0.0
            if hsh.near(p, rej[i], zz):
                continue
            hsh.add(p, zz)
            inner.append(p)
        ok = np.isfinite(uk)
        prevU = np.where(ok, ukz, prevU)
        prevZ = np.where(ok, zk, prevZ)
    n_spoke = len(inner)
    # concave fans (armpits, inner sides of hooks): spokes diverge there, so add points
    # along the dense outline normals, spaced finer the closer they are to the outline
    th = turn(o.P, o.s, o.L, 1.5)
    conc = np.nonzero(th < -math.radians(4.0))[0][::2]
    offs = np.array([0.4, 1.0, 1.8, 3.0, 4.5, 6.5, 9.0, 12.0, 16.0])
    cp, cd = [], []
    for i in conc:
        for dd in offs:
            if dd >= 0.95 * o.R[i]:
                break
            cp.append(o.P[i] + o.N[i] * dd)
            cd.append((dd, i))
    if cp:
        cp = np.array(cp)
        cz = field.sample(cp, field.Hk[k]) * prof(np.array([a for a, _ in cd]) /
                                                  np.maximum(field.sample(cp, field.RBk[k]), 1e-6), prm)
        for p, z, (dd, i) in zip(cp, cz, cd):
            r = 0.45 * min(0.35 * dd + 0.5, prm["SIZE_K"] * o.R[i])
            z = z if use_z else 0.0
            if not hsh.near(p, r, z):
                hsh.add(p, z)
                inner.append(p)
    n_conc = len(inner) - n_spoke
    # fill any other gaps with a hex lattice, spacing from the local R
    lo = o.P.min(0)
    hi = o.P.max(0)
    step = 2.0
    ys = np.arange(lo[1], hi[1], step * 0.866)
    cand = []
    for j, y in enumerate(ys):
        xx = np.arange(lo[0] + (step / 2 if j % 2 else 0), hi[0], step)
        cand.append(np.column_stack([xx, np.full(len(xx), y)]))
    cand = np.vstack(cand)
    t, q, R, n, s = o.foot(cand)
    ok = t > 0.5
    cand, t, R = cand[ok], t[ok], R[ok]
    cz = field.sample(cand, field.Hk[k]) * prof(t / np.maximum(field.sample(cand, field.RBk[k]), 1e-6), prm)
    loc = np.clip(prm["SIZE_K"] * R, 1.0, prm["SIZE_MAX"]) * prm["FILL"]
    for i in np.argsort(-loc):
        p = cand[i]
        zz = cz[i] if use_z else 0.0
        if hsh.near(p, loc[i], zz):
            continue
        hsh.add(p, zz)
        inner.append(p)
    inner = np.array(inner)
    log(f"[{name}] outline pts={nb} spoke pts={n_spoke} concave pts={n_conc} "
        f"fill pts={len(inner) - n_spoke - n_conc}")
    edges = [(i, (i + 1) % nb) for i in range(nb)]
    face = [list(range(nb))]
    extra = 0
    for rnd in range(6):
        allp = np.vstack([Bp, inner])
        verts = [Vector((float(x), float(y))) for x, y in allp]
        vo, eo, fo, ov, oe, of = delaunay_2d_cdt(verts, edges, face, 1, 1e-5, True)
        V2 = np.array([[v.x, v.y] for v in vo])
        orig = np.full(len(vo), -1, int)
        for i, lst in enumerate(ov):
            if lst:
                orig[i] = min(lst)
        tris = np.array([f for f in fo if len(f) == 3])
        isb = (orig >= 0) & (orig < nb)
        # a triangle with all corners on the outline would glue front to back (zero
        # thickness): give it an interior vertex and triangulate again
        allb = isb[tris].all(1)
        if not allb.any():
            break
        cen = V2[tris[allb]].mean(1)
        inner = np.vstack([inner, cen])
        extra += len(cen)
    n_new = int((orig < 0).sum())
    merged = sum(1 for lst in ov if len(lst) > 1)
    nonTri = sum(1 for f in fo if len(f) != 3)
    # drop points the inside-only triangulation left unused (spokes that overshot a tip)
    used = np.zeros(len(V2), bool)
    used[tris.ravel()] = True
    remap = np.cumsum(used) - 1
    n_unused = int((~used).sum())
    V2, orig, isb, tris = V2[used], orig[used], isb[used], remap[tris]
    # orientation -> CCW
    a = V2[tris[:, 0]]
    b = V2[tris[:, 1]]
    c = V2[tris[:, 2]]
    ar = 0.5 * ((b[:, 0] - a[:, 0]) * (c[:, 1] - a[:, 1]) - (b[:, 1] - a[:, 1]) * (c[:, 0] - a[:, 0]))
    flip = ar < 0
    tris[flip] = tris[flip][:, ::-1]
    loop = np.full(nb, -1, int)
    loop[orig[isb]] = np.nonzero(isb)[0]
    log(f"[{name}] cdt verts={len(vo)} tris={len(tris)} new_verts={n_new} merged={merged} "
        f"non_tri={nonTri} min_area={np.abs(ar).min():.2e} boundary_ok={(loop >= 0).all()} "
        f"outline-only tris fixed with {extra} pts, left={int(isb[tris].all(1).sum())} "
        f"unused dropped={n_unused}")
    return V2, isb, tris, loop, Bn


# ---------------------------------------------------------------------------
# lift to 3D
# ---------------------------------------------------------------------------

def mesh_edges(tris):
    E = np.vstack([tris[:, [0, 1]], tris[:, [1, 2]], tris[:, [2, 0]]])
    return np.unique(np.sort(E, 1), axis=0)


def lift(o, field, V2, isb, prm, k=0):
    """z and front normals for the 2D vertices of piece k.

    D = distance to the outline: exact within DB_START of it (the steep cast side needs
    it), blending into a blurred copy deeper in, which rounds the spine ridge where the
    two sides of a stroke meet. x = D / RB (smooth bevel-radius field), z = H g(min(x,1)).
    Nothing that jumps (like the per-foot disc radius at armpits) reaches the surface."""
    t, q, R, n, s = o.foot(V2)
    H = field.sample(V2, field.Hk[k])
    RB = field.sample(V2, field.RBk[k])
    DBk = field.DB[k]
    Db = field.sample(V2, DBk)
    gDb = field.grad(V2, DBk)
    eps = 0.05
    ex = np.array([eps, 0.0])
    ey = np.array([0.0, eps])
    gt = np.column_stack([(o.foot(V2 + ex)[0] - o.foot(V2 - ex)[0]) / (2 * eps),
                          (o.foot(V2 + ey)[0] - o.foot(V2 - ey)[0]) / (2 * eps)])
    y = np.clip((Db - prm["DB_START"]) / prm["DB_RAMP"], 0, 1)
    w = y * y * (3 - 2 * y)
    dw = np.where((y > 0) & (y < 1), 6 * y * (1 - y) / prm["DB_RAMP"], 0.0)
    D = (1 - w) * t + w * Db
    gD = (1 - w)[:, None] * gt + w[:, None] * gDb + ((Db - t) * dw)[:, None] * gDb
    x = np.clip(D / RB, 0.0, 1.0)
    x[isb] = 0.0
    gH = field.grad(V2, field.Hk[k])
    gRB = field.grad(V2, field.RBk[k])
    gx = gD / RB[:, None] - (D / RB ** 2)[:, None] * gRB
    gx[x >= 1.0] = 0.0
    f = prof(x, prm)
    fp = dprof(x, prm)
    Z = H * f
    Z[isb] = 0.0
    G = gH * f[:, None] + (H * fp)[:, None] * gx
    N = unit(np.column_stack([-G[:, 0], -G[:, 1], np.ones(len(V2))]))
    # on the outline the section is vertical: normal = outward horizontal
    nout = -n[isb]
    N[isb] = np.column_stack([nout, np.zeros(len(nout))])
    return Z, N, x, H


def collapse_short(V2, Z, N, tris, isb, min3d, extra=()):
    """Collapse front-surface edges shorter than min3d (3D) by merging an interior vertex
    into its neighbour: removes the sub-quantization slivers that crowd needle points.
    Each collapse keeps every surviving triangle CCW in plan and honours the link
    condition, so the surface stays a valid disc triangulation. Outline vertices are
    never removed. extra: per-vertex arrays to carry along."""
    from collections import defaultdict
    total = 0
    for _ in range(8):
        P3 = np.column_stack([V2, Z])
        E = mesh_edges(tris)
        L = np.linalg.norm(P3[E[:, 0]] - P3[E[:, 1]], axis=1)
        cand = L < min3d
        # slivers (near-collinear in 3D; they quantize to zero area): their shortest edge
        tri_e = np.stack([tris[:, [0, 1]], tris[:, [1, 2]], tris[:, [2, 0]]], 1)
        el = np.linalg.norm(P3[tri_e[:, :, 0]] - P3[tri_e[:, :, 1]], axis=2)
        area2 = np.linalg.norm(np.cross(P3[tris[:, 1]] - P3[tris[:, 0]], P3[tris[:, 2]] - P3[tris[:, 0]]), axis=1)
        height = area2 / np.maximum(el.max(1), 1e-9)
        sl = np.nonzero(height < min3d / 3)[0]
        if len(sl):
            se = np.sort(tri_e[sl, np.argmin(el[sl], 1)], 1)
            key = {(int(x), int(y)): i for i, (x, y) in enumerate(E)}
            for x, y in se:
                i = key.get((int(x), int(y)))
                if i is not None and L[i] < 4 * min3d:
                    cand[i] = True
        order = np.argsort(L)
        short = order[cand[order]]
        if not len(short):
            break
        vt = defaultdict(list)
        for ti, t in enumerate(tris):
            for v in t:
                vt[int(v)].append(ti)
        nbr = defaultdict(set)
        for a, b in E:
            nbr[int(a)].add(int(b))
            nbr[int(b)].add(int(a))
        alive = np.ones(len(tris), bool)
        tris = tris.copy()
        locked = np.zeros(len(V2), bool)
        removed = np.zeros(len(V2), bool)
        done = 0
        for ei in short:
            a, b = int(E[ei, 0]), int(E[ei, 1])
            if locked[a] or locked[b]:
                continue
            for rm, keep in ((a, b), (b, a)):
                if isb[rm]:
                    continue
                shared = [t for t in vt[rm] if alive[t] and keep in tris[t]]
                common = (nbr[rm] & nbr[keep]) - {rm, keep}
                if len(common) != len(shared):
                    continue
                ok = True
                for t in vt[rm]:
                    if not alive[t] or keep in tris[t]:
                        continue
                    q = [keep if v == rm else v for v in tris[t]]
                    A, B, C = V2[q[0]], V2[q[1]], V2[q[2]]
                    if (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]) <= 1e-7:
                        ok = False
                        break
                if not ok:
                    continue
                for t in vt[rm]:
                    if not alive[t]:
                        continue
                    if keep in tris[t]:
                        alive[t] = False
                    else:
                        tris[t] = [keep if v == rm else v for v in tris[t]]
                removed[rm] = True
                for v in nbr[rm] | nbr[keep] | {rm, keep}:
                    locked[v] = True
                done += 1
                break
        tris = tris[alive]
        total += done
        if not done:
            break
        used = np.zeros(len(V2), bool)
        used[tris.ravel()] = True
        remap = np.cumsum(used) - 1
        V2, Z, N, isb = V2[used], Z[used], N[used], isb[used]
        extra = tuple(x[used] for x in extra)
        tris = remap[tris]
    return V2, Z, N, tris, isb, extra, total


def fix_normals(V2, Z, tris, N, isb, thresh=0.2, rounds=30):
    """Where the mesh is too coarse for the analytic normal (a few tiny faces near needle
    points, where the thickness taper is steep), pull that vertex's normal toward the
    area-weighted geometric normal until every adjacent face agrees with it. Outline
    normals (horizontal, shared with the back) are never touched."""
    P = np.column_stack([V2, Z])
    fn = np.cross(P[tris[:, 1]] - P[tris[:, 0]], P[tris[:, 2]] - P[tris[:, 0]])
    fu = unit(fn)
    G = np.zeros_like(P)
    for c in range(3):
        np.add.at(G, tris[:, c], fu)          # bisector of the adjacent facets
    G = unit(G)
    N = N.copy()
    fixed = np.zeros(len(N), bool)
    for _ in range(rounds):
        d = np.einsum("ijk,ik->ij", N[tris], fu)
        bad = np.unique(tris[d < thresh])
        bad = bad[~isb[bad]]
        if not len(bad):
            break
        N[bad] = unit(N[bad] + 1.5 * G[bad])
        fixed[bad] = True
    # needle points: facets fold sharply, so the average can still miss one; walk the
    # normal toward its worst facet (min-dot ascent) until all of them agree
    d = np.einsum("ijk,ik->ij", N[tris], fu)
    left = np.unique(tris[d < thresh])
    left = left[~isb[left]]
    if len(left):
        vf = {int(v): [] for v in left}
        for fi, t in enumerate(tris):
            for v in t:
                if int(v) in vf:
                    vf[int(v)].append(fi)
        for v, fl in vf.items():
            F = fu[fl]
            nv = N[v].copy()
            for _ in range(200):
                dd = F @ nv
                j = int(np.argmin(dd))
                if dd[j] >= thresh:
                    break
                nv = nv + 0.15 * F[j]
                nv /= np.linalg.norm(nv)
            N[v] = nv
            fixed[v] = True
    d = np.einsum("ijk,ik->ij", N[tris], fu).min(1)
    return N, int(fixed.sum()), float(d.min())


def solid(V2, isb, tris, Z, N):
    """Front + mirrored back sharing the outline -> closed mesh (verts, normals, tris)."""
    n = len(V2)
    inner = np.nonzero(~isb)[0]
    back_id = np.arange(n)
    back_id[inner] = n + np.arange(len(inner))
    Vf = np.column_stack([V2, Z])
    Vb = np.column_stack([V2[inner], -Z[inner]])
    Nb = N[inner] * np.array([1, 1, -1])
    V = np.vstack([Vf, Vb])
    NN = np.vstack([N, Nb])
    Tb = back_id[tris][:, ::-1]
    return V, NN, np.vstack([tris, Tb])


def to_blender(V, N):
    """(x, y_up, z_depth) -> Blender (x, -z, y): upright in XZ, front faces -Y."""
    M = np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]], float)
    return V @ M.T, N @ M.T
