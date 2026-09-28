"""Geometry for the Tracking hero chrome forms (Blender 5.2, numpy + openvdb).

Everything here is pure numpy until `build_object`, so shapes are exact:
  * organic forms are signed-distance fields (exponential smooth-union, C-inf),
    meshed with OpenVDB, quad-remeshed (QuadriFlow), subdivided once, then every
    vertex is projected back onto the exact SDF surface and gets the exact SDF
    gradient as its normal;
  * the lens is a lathe of a cubic-B-spline-subdivided profile (G2 fillets);
  * the film strip is built analytically as a flat perforated plate with full-round
    edges, then mapped onto a twisted (Mobius) centreline with Jacobian-correct normals.
"""
import math

import numpy as np

# ---------------------------------------------------------------------------
# linear algebra
# ---------------------------------------------------------------------------

def unit(v, axis=-1):
    n = np.linalg.norm(v, axis=axis, keepdims=True)
    return v / np.maximum(n, 1e-12)


def rot(axis, deg):
    a = np.asarray(axis, float)
    a = a / np.linalg.norm(a)
    t = math.radians(deg)
    K = np.array([[0, -a[2], a[1]], [a[2], 0, -a[0]], [-a[1], a[0], 0]])
    return np.eye(3) + math.sin(t) * K + (1 - math.cos(t)) * (K @ K)


def euler(rx=0.0, ry=0.0, rz=0.0):
    """Blender XYZ euler (degrees) -> matrix (applied as R @ v)."""
    return rot((0, 0, 1), rz) @ rot((0, 1, 0), ry) @ rot((1, 0, 0), rx)


def bounding_sphere(P, iters=4000):
    """Badoiu-Clarkson minimum enclosing sphere (on hull-ish candidates)."""
    c = P.mean(0)
    d = np.linalg.norm(P - c, axis=1)
    cand = P[d > np.percentile(d, 60)] if len(P) > 5000 else P
    for i in range(1, iters + 1):
        j = np.argmax(np.einsum("ij,ij->i", cand - c, cand - c))
        c = c + (cand[j] - c) / (i + 1)
    r = np.linalg.norm(P - c, axis=1).max()
    return c, r


def normalize_pose(P, N, R=None, radius=1.0):
    """Rotate (R), put the origin at the geometric (bounding-box) centre and scale
    so the farthest vertex sits exactly on a sphere of `radius` around it.
    (Bounding-box centre, so meshopt/KHR_mesh_quantization's dequantize offset is
    ~0 and rotating the glTF node pivots on the form's centre.)"""
    if R is not None:
        P = P @ R.T
        N = N @ R.T
    c = (P.min(0) + P.max(0)) / 2
    r = np.linalg.norm(P - c, axis=1).max()
    P = (P - c) * (radius / r)
    return P, unit(N), c, r


# ---------------------------------------------------------------------------
# SDF primitives (P: (n,3) float64 -> (n,))
# ---------------------------------------------------------------------------

def sd_sphere(P, c, r):
    return np.linalg.norm(P - np.asarray(c, float), axis=1) - r


def sd_ellipsoid(P, c, radii, R=None):
    """iq's ellipsoid bound. R: 3x3 whose columns are the ellipsoid's local axes."""
    q = P - np.asarray(c, float)
    if R is not None:
        q = q @ R
    rad = np.asarray(radii, float)
    k0 = np.linalg.norm(q / rad, axis=1)
    k1 = np.linalg.norm(q / (rad * rad), axis=1)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)


def sd_round_cone(P, a, b, r1, r2):
    """iq's round cone: sphere r1 at a, sphere r2 at b, tangent cone between."""
    a = np.asarray(a, float)
    b = np.asarray(b, float)
    ba = b - a
    l2 = ba @ ba
    rr = r1 - r2
    a2 = l2 - rr * rr
    il2 = 1.0 / l2
    pa = P - a
    y = pa @ ba
    z = y - l2
    xv = pa * l2 - y[:, None] * ba
    x2 = np.einsum("ij,ij->i", xv, xv)
    y2 = y * y * l2
    z2 = z * z * l2
    k = np.sign(rr) * rr * rr * x2
    d_tip = np.sqrt(x2 + z2) * il2 - r2
    d_base = np.sqrt(x2 + y2) * il2 - r1
    d_side = (np.sqrt(np.maximum(x2 * a2 * il2, 0)) + y * rr) * il2 - r1
    return np.where(np.sign(z) * a2 * z2 > k, d_tip,
                    np.where(np.sign(y) * a2 * y2 < k, d_base, d_side))


def smin(ds, k):
    """Exponential smooth minimum of a list of distance arrays (C-infinity)."""
    D = np.stack(ds, 0)
    m = D.min(0)
    return m - k * np.log(np.exp(-(D - m) / k).sum(0))


def smin2(a, b, k):
    return smin([a, b], k)


def sdf_grad(f, P, eps=1e-4):
    g = np.empty_like(P)
    for i in range(3):
        e = np.zeros(3)
        e[i] = eps
        g[:, i] = (f(P + e) - f(P - e)) / (2 * eps)
    return g


def project_to_sdf(f, P, iters=8):
    P = P.copy()
    for _ in range(iters):
        d = f(P)
        g = sdf_grad(f, P)
        P -= (d / np.maximum(np.einsum("ij,ij->i", g, g), 1e-9))[:, None] * g
    return P, np.abs(f(P)).max()


def relax_on_sdf(f, V, F, iters=6, lam=0.5, mask=None):
    """Tangential Laplacian smoothing + re-projection: evens out the quads and
    untangles any folds (e.g. at thin tips) while staying exactly on the SDF.
    mask: optional bool array, only those vertices move."""
    E = set()
    for face in F:
        n = len(face)
        for i in range(n):
            a, b = face[i], face[(i + 1) % n]
            E.add((min(a, b), max(a, b)))
    E = np.array(sorted(E))
    deg = np.bincount(E.ravel(), minlength=len(V)).astype(float)
    for _ in range(iters):
        acc = np.zeros_like(V)
        np.add.at(acc, E[:, 0], V[E[:, 1]])
        np.add.at(acc, E[:, 1], V[E[:, 0]])
        d = acc / deg[:, None] - V
        n = unit(sdf_grad(f, V))
        d -= np.einsum("ij,ij->i", d, n)[:, None] * n
        if mask is not None:
            d[~mask] = 0.0
        V, _ = project_to_sdf(f, V + lam * d, iters=4)
    return V


def folded_mask(V, F, N, rings=2):
    bad = set()
    for face in F:
        P = V[list(face)]
        fn = np.cross(P[1] - P[0], P[2] - P[0])
        if len(face) == 4:
            fn = fn + np.cross(P[2] - P[0], P[3] - P[0])
        fn = fn / max(np.linalg.norm(fn), 1e-12)
        if (N[list(face)] @ fn).min() < 0.5:
            bad.update(face)
    mask = np.zeros(len(V), bool)
    if not bad:
        return mask, 0
    mask[list(bad)] = True
    for _ in range(rings):
        grow = mask.copy()
        for face in F:
            if mask[list(face)].any():
                grow[list(face)] = True
        mask = grow
    return mask, len(bad)


def repair_folds(f, V, F, rounds=6, log=print, name=""):
    for r in range(rounds):
        N = unit(sdf_grad(f, V))
        mask, nbad = folded_mask(V, F, N)
        if nbad == 0:
            return V
        log(f"[{name}] fold repair round {r}: {nbad} verts on folded faces, relaxing {mask.sum()}")
        V = relax_on_sdf(f, V, F, iters=12, lam=0.6, mask=mask)
    return V


def flipped_faces(V, F, N):
    bad = 0
    for face in F:
        P = V[list(face)]
        fn = np.cross(P[1] - P[0], P[2] - P[0])
        if len(face) == 4:
            fn = fn + np.cross(P[2] - P[0], P[3] - P[0])
        fn = fn / max(np.linalg.norm(fn), 1e-12)
        if (N[list(face)] @ fn).min() < 0.5:
            bad += 1
    return bad


def sdf_to_polys(f, lo, hi, voxel):
    """Sample f on a dense grid and extract the zero level set with OpenVDB."""
    import openvdb
    lo = np.asarray(lo, float)
    hi = np.asarray(hi, float)
    n = np.ceil((hi - lo) / voxel).astype(int) + 1
    xs = lo[0] + np.arange(n[0]) * voxel
    ys = lo[1] + np.arange(n[1]) * voxel
    zs = lo[2] + np.arange(n[2]) * voxel
    YZ = np.stack(np.meshgrid(ys, zs, indexing="ij"), -1).reshape(-1, 2)
    arr = np.empty(tuple(n), np.float32)
    step = max(1, 400000 // len(YZ))
    for i0 in range(0, n[0], step):
        sl = xs[i0:i0 + step]
        P = np.column_stack([np.repeat(sl, len(YZ)), np.tile(YZ, (len(sl), 1))])
        arr[i0:i0 + len(sl)] = f(P).reshape(len(sl), n[1], n[2])
    g = openvdb.FloatGrid(1.0e6)
    g.copyFromArray(arr)
    pts, quads = g.convertToQuads(0.0)
    return lo + np.asarray(pts, float) * voxel, np.asarray(quads, int)


# ---------------------------------------------------------------------------
# 2D curve helpers (profiles)
# ---------------------------------------------------------------------------

def bspline_closed(P, levels):
    """Cubic B-spline (Lane-Riesenfeld) subdivision of a closed 2D polygon."""
    P = np.asarray(P, float)
    for _ in range(levels):
        prv = np.roll(P, 1, 0)
        nxt = np.roll(P, -1, 0)
        vpt = (prv + 6 * P + nxt) / 8.0
        ept = (P + nxt) / 2.0
        Q = np.empty((2 * len(P), P.shape[1]))
        Q[0::2] = vpt
        Q[1::2] = ept
        P = Q
    return P


def douglas_peucker(P, tol, keep=()):
    keep = set(keep)
    n = len(P)
    mask = np.zeros(n, bool)
    mask[0] = mask[-1] = True
    for k in keep:
        mask[k] = True
    stack = [(0, n - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        a, b = P[i], P[j]
        ab = b - a
        L = np.linalg.norm(ab)
        seg = P[i + 1:j] - a
        if L < 1e-12:
            d = np.linalg.norm(seg, axis=1)
        else:
            d = np.abs(seg[:, 0] * ab[1] - seg[:, 1] * ab[0]) / L
        k = int(np.argmax(d))
        inner = [m for m in range(i + 1, j) if m in keep]
        if d[k] > tol or inner:
            m = i + 1 + k if d[k] > tol or not inner else inner[0]
            mask[m] = True
            stack.append((i, m))
            stack.append((m, j))
    return np.nonzero(mask)[0]


def cage_from_keys(keys):
    """keys: list of ((r,z), e). e>0 -> sharp-ish corner rendered as a tight G2
    fillet of size ~e (support points at distance e on both edges)."""
    pts = []
    n = len(keys)
    for i, (q, e) in enumerate(keys):
        q = np.asarray(q, float)
        if e > 0 and 0 < i < n - 1:
            pp = np.asarray(keys[i - 1][0], float)
            pn = np.asarray(keys[i + 1][0], float)
            dp = unit(pp - q)
            dn = unit(pn - q)
            ep = min(e, 0.45 * np.linalg.norm(pp - q))
            en = min(e, 0.45 * np.linalg.norm(pn - q))
            pts += [q + dp * ep, q, q + dn * en]
        else:
            pts.append(q)
    return np.array(pts)


def arc_pts(center, radius, a0, a1, n):
    t = np.linspace(math.radians(a0), math.radians(a1), n)
    return [(center[0] + radius * math.cos(x), center[1] + radius * math.sin(x)) for x in t]


# ---------------------------------------------------------------------------
# Lathe
# ---------------------------------------------------------------------------

def lathe(profile, normals, segments):
    """profile: (m,2) (r,z) from one pole to the other (r[0]=r[-1]=0).
    Returns verts, normals, faces (quads + pole triangle fans), axis = Z."""
    V, N, F = [], [], []
    th = np.linspace(0, 2 * math.pi, segments, endpoint=False)
    ct, st = np.cos(th), np.sin(th)
    ring_idx = []
    for (r, z), (nr, nz) in zip(profile, normals):
        if r < 1e-9:
            ring_idx.append([len(V)])
            V.append((0.0, 0.0, z))
            N.append((0.0, 0.0, 1.0 if nz > 0 else -1.0))
        else:
            base = len(V)
            ring_idx.append(list(range(base, base + segments)))
            for c, s in zip(ct, st):
                V.append((r * c, r * s, z))
                N.append((nr * c, nr * s, nz))
    for a, b in zip(ring_idx[:-1], ring_idx[1:]):
        if len(a) == 1 and len(b) == 1:
            continue
        for k in range(segments):
            k1 = (k + 1) % segments
            if len(a) == 1:
                F.append((a[0], b[k], b[k1]))
            elif len(b) == 1:
                F.append((a[k], b[0], a[k1]))
            else:
                F.append((a[k], b[k], b[k1], a[k1]))
    return np.array(V), unit(np.array(N)), F


# ---------------------------------------------------------------------------
# Form 2: lens_element
# ---------------------------------------------------------------------------

def lens_element(segments=128, tol=0.00035):
    fz, fr, fe = 0.135, 0.50, 0.245           # concave front face: centre z, rim r, rim z
    kz = -0.405                                 # convex back apex
    br, bz = 0.80, -0.165                       # convex back rim
    keys = []
    # concave front face (spherical dish), axis -> rim
    sag = fe - fz
    Rc = (fr * fr + sag * sag) / (2 * sag)
    cz = fz + Rc
    for x in np.linspace(0, fr, 9):
        keys.append(((x, cz - math.sqrt(Rc * Rc - x * x)), 0.0))
    keys[-1] = ((fr, fe), 0.010)
    # stepped bezel: seat lip, two terraces, crowned top ring, outer chamfer
    keys += [((fr, 0.300), 0.010), ((0.605, 0.300), 0.010), ((0.605, 0.352), 0.010),
             ((0.725, 0.365), 0.012), ((0.725, 0.415), 0.010),
             ((0.835, 0.428), 0.0), ((0.925, 0.418), 0.014),
             ((1.000, 0.350), 0.014)]
    # side wall with a machined groove
    keys += [((1.000, 0.175), 0.006), ((0.972, 0.160), 0.006), ((0.972, 0.110), 0.006),
             ((1.000, 0.095), 0.006), ((1.000, -0.085), 0.014), ((0.955, -0.130), 0.012)]
    # back land, then a small seat step into the convex dome
    keys += [((br, -0.130), 0.008)]
    sagb = bz - kz
    Rb = (br * br + sagb * sagb) / (2 * sagb)
    czb = kz + Rb
    for x in np.linspace(br, 0, 12):
        keys.append(((x, czb - math.sqrt(max(Rb * Rb - x * x, 0.0))), 0.0))
    keys[-12] = ((br, bz), 0.010)
    half = cage_from_keys(keys)
    # mirror across the axis so the subdivided curve meets the axis at 90 deg
    full = np.vstack([half, (half[-2:0:-1] * np.array([-1, 1]))])
    dense = bspline_closed(full, 4)
    m = len(half)
    # vertex points of the original axis samples sit at index 0 and (m-1)*16
    i1 = (m - 1) * 16
    prof = dense[:i1 + 1].copy()
    prof[0, 0] = 0.0
    prof[-1, 0] = 0.0
    tang = np.gradient(prof, axis=0)
    nrm = unit(np.column_stack([-tang[:, 1], tang[:, 0]]))
    keep = douglas_peucker(prof, tol)
    prof_k, nrm_k = prof[keep], nrm[keep]
    nrm_k[0] = (0, 1)
    nrm_k[-1] = (0, -1)
    V, N, F = lathe(prof_k, nrm_k, segments)
    return V, N, F, len(prof_k)


# ---------------------------------------------------------------------------
# Form 1: film_twist (Mobius film strip)
# ---------------------------------------------------------------------------

def _rrect(a, b, c, n_c):
    """Rounded rectangle, half sizes a (x) b (y), corner radius c; CCW from the
    top-right corner. Returns points (4*(n_c+1),2) and per-point outward normals."""
    P, Nn = [], []
    for cx, cy, a0 in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        for j in range(n_c + 1):
            t = math.radians(a0 + 90.0 * j / n_c)
            P.append((cx * (a - c) + c * math.cos(t), cy * (b - c) + c * math.sin(t)))
            Nn.append((math.cos(t), math.sin(t)))
    return np.array(P), np.array(Nn)


def _rect_partner(ring, a, b, Hx, Hy, n_c):
    """Map inset-ring points onto the cell rectangle (corners hit exactly)."""
    out = []
    half = n_c // 2
    for idx, (x, y) in enumerate(ring):
        corner = idx // (n_c + 1)
        j = idx % (n_c + 1)
        sx = 1 if corner in (0, 3) else -1
        sy = 1 if corner in (0, 1) else -1
        if j == half:
            out.append((sx * Hx, sy * Hy))
            continue
        # which side does this point belong to? (CCW order within the corner arc)
        first_half = j < half
        on_vertical = first_half if corner in (0, 2) else not first_half
        if on_vertical:
            out.append((sx * Hx, y * Hy / b))
        else:
            out.append((x * Hx / a, sy * Hy))
    return np.array(out)


class _MeshAcc:
    def __init__(self, L):
        self.L = L
        self.keys = {}
        self.V = []     # (s,t,z)
        self.N = []     # local normal (ns,nt,nz)
        self.F = []

    def v(self, s, t, z, n):
        if s > self.L - 1e-9:          # Mobius identification: (L,t,z) == (0,-t,-z)
            s, t, z = s - self.L, -t, -z
            n = (n[0], -n[1], -n[2])
        k = (round(s, 7), round(t, 7), round(z, 7))
        i = self.keys.get(k)
        if i is None:
            i = len(self.V)
            self.keys[k] = i
            self.V.append((s, t, z))
            self.N.append(n)
        return i

    def quad(self, a, b, c, d):
        if len({a, b, c, d}) == 4:
            self.F.append((a, b, c, d))


def film_flat(n_cells=54, p=0.085, w=0.44, T=0.032, hA=0.056, hL=0.042, rc=0.012,
              em=0.05, n_c=2, n_phi=6, m_c=4):
    r = T / 2
    L = n_cells * p
    th = w / 2 - em - hA / 2
    a0, b0, c0 = hL / 2 + r, hA / 2 + r, rc + r
    Hx = p / 2
    flat_margin = (w / 2 - r) - (th + b0)
    assert flat_margin > 0.004, flat_margin
    Hy = b0 + 0.5 * flat_margin
    assert Hx > a0 + 0.003, (Hx, a0)
    acc = _MeshAcc(L)
    phis = np.linspace(0, math.pi, n_phi + 1)
    ring0, _ = _rrect(a0, b0, c0, n_c)
    rect = _rect_partner(ring0, a0, b0, Hx, Hy, n_c)
    nr = len(ring0)
    # s samples of a cell (relative) along its top side
    top = sorted({round(x, 9) for x, y in rect if abs(y - Hy) < 1e-12})
    s_rel = np.array(top)
    for k in range(n_cells):
        sc = (k + 0.5) * p
        ss = sc + s_rel
        for side in (1, -1):
            tc = side * th
            # hole walls
            rings = []
            for ph in phis:
                d = r - r * math.sin(ph)
                P, Nn = _rrect(hL / 2 + d, hA / 2 + d, rc + d, n_c)
                z = r * math.cos(ph)
                ids = []
                for (x, y), (nx, ny) in zip(P, Nn):
                    n = (-math.sin(ph) * nx, -math.sin(ph) * ny * side, math.cos(ph))
                    ids.append(acc.v(sc + x, tc + side * y, z, n))
                rings.append(ids)
            for a_, b_ in zip(rings[:-1], rings[1:]):
                for i in range(nr):
                    i1 = (i + 1) % nr
                    acc.quad(a_[i], a_[i1], b_[i1], b_[i])
            # flat faces between inset rings and the cell rectangle
            for zsgn, ring in ((1, rings[0]), (-1, rings[-1])):
                rid = [acc.v(sc + x, tc + side * y, zsgn * r, (0, 0, zsgn)) for x, y in rect]
                for i in range(nr):
                    i1 = (i + 1) % nr
                    acc.quad(ring[i], ring[i1], rid[i1], rid[i])
            # margin band (between hole cell and outer edge inset)
            t_in, t_out = tc + side * Hy, side * (w / 2 - r)
            for zsgn in (1, -1):
                for j in range(len(ss) - 1):
                    acc.quad(acc.v(ss[j], t_in, zsgn * r, (0, 0, zsgn)),
                             acc.v(ss[j + 1], t_in, zsgn * r, (0, 0, zsgn)),
                             acc.v(ss[j + 1], t_out, zsgn * r, (0, 0, zsgn)),
                             acc.v(ss[j], t_out, zsgn * r, (0, 0, zsgn)))
            # outer full-round edge
            rows = []
            for ph in phis:
                t = side * (w / 2 - r + r * math.sin(ph))
                z = r * math.cos(ph)
                n = (0, side * math.sin(ph), math.cos(ph))
                rows.append([acc.v(s, t, z, n) for s in ss])
            for ra, rb in zip(rows[:-1], rows[1:]):
                for j in range(len(ss) - 1):
                    acc.quad(ra[j], ra[j + 1], rb[j + 1], rb[j])
        # centre band
        tb = th - Hy
        ts = np.linspace(-tb, tb, m_c + 1)
        for zsgn in (1, -1):
            for i in range(m_c):
                for j in range(len(ss) - 1):
                    acc.quad(acc.v(ss[j], ts[i], zsgn * r, (0, 0, zsgn)),
                             acc.v(ss[j + 1], ts[i], zsgn * r, (0, 0, zsgn)),
                             acc.v(ss[j + 1], ts[i + 1], zsgn * r, (0, 0, zsgn)),
                             acc.v(ss[j], ts[i + 1], zsgn * r, (0, 0, zsgn)))
    return np.array(acc.V), np.array(acc.N, float), acc.F, L


def _closed_curve(fn, n=4096):
    u = np.linspace(0, 2 * math.pi, n + 1)
    C = fn(u)
    seg = np.linalg.norm(np.diff(C, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    return u, C, s


def mobius_map(Vp, Np, L, R=0.72, wob=0.0, half_twists=1, twist0=0.0):
    """Map flat strip params (s,t,z) onto a closed centreline with a twist."""
    fn = lambda u: np.column_stack([R * np.cos(u), R * np.sin(u), wob * np.sin(2 * u)])
    u_tab, C_tab, s_tab = _closed_curve(fn)
    Ltot = s_tab[-1]

    def frame(s):
        # position/tangent are periodic; the twist angle is NOT wrapped so finite
        # differences at s=0 stay continuous (the Mobius flip lives in _MeshAcc)
        uu = np.interp(np.mod(s, L) * (Ltot / L), s_tab, u_tab)
        C = fn(uu)
        du = 1e-4
        Tg = unit(fn(uu + du) - fn(uu - du))
        Nr = unit(np.column_stack([np.cos(uu), np.sin(uu), np.zeros_like(uu)]))
        Nr = unit(Nr - (np.einsum("ij,ij->i", Nr, Tg))[:, None] * Tg)
        Bn = np.cross(Tg, Nr)
        th = twist0 + half_twists * math.pi * s / L
        W = np.cos(th)[:, None] * Nr + np.sin(th)[:, None] * Bn
        Z = -np.sin(th)[:, None] * Nr + np.cos(th)[:, None] * Bn
        return C, W, Z

    def F(S, T, Zc):
        C, W, Z = frame(S)
        return C + T[:, None] * W + Zc[:, None] * Z

    s, t, z = Vp[:, 0], Vp[:, 1], Vp[:, 2]
    X = F(s, t, z)
    e = 1e-5
    J = np.stack([(F(s + e, t, z) - F(s - e, t, z)) / (2 * e),
                  (F(s, t + e, z) - F(s, t - e, z)) / (2 * e),
                  (F(s, t, z + e) - F(s, t, z - e)) / (2 * e)], axis=2)  # (n,3,3) columns
    Jinv_T = np.transpose(np.linalg.inv(J), (0, 2, 1))
    N3 = unit(np.einsum("nij,nj->ni", Jinv_T, Np))
    return X, N3


def film_twist(**kw):
    Vp, Np, F, L = film_flat(**{k: v for k, v in kw.items() if k in (
        "n_cells", "p", "w", "T", "hA", "hL", "rc", "em", "n_c", "n_phi", "m_c")})
    R = L / (2 * math.pi)
    X, N3 = mobius_map(Vp, Np, L, R=R, wob=kw.get("wob", 0.0),
                       half_twists=kw.get("half_twists", 1), twist0=kw.get("twist0", 0.0))
    return X, N3, F, L


# ---------------------------------------------------------------------------
# Forms 3-5: SDF definitions
# ---------------------------------------------------------------------------

def fibonacci_dirs(n, seed=0, jitter=0.0):
    i = np.arange(n) + 0.5
    phi = np.arccos(1 - 2 * i / n)
    th = math.pi * (1 + 5 ** 0.5) * i
    D = np.column_stack([np.cos(th) * np.sin(phi), np.sin(th) * np.sin(phi), np.cos(phi)])
    if jitter:
        rng = np.random.default_rng(seed)
        D = unit(D + rng.normal(0, jitter, D.shape))
    return D


def spike_star_sdf(n=14, core=0.26, seed=7, k=0.06):
    rng = np.random.default_rng(seed)
    D = fibonacci_dirs(n, seed=seed, jitter=0.12)
    # relax directions a little so spacing is even but not crystalline
    for _ in range(60):
        F = np.zeros_like(D)
        for i in range(n):
            d = D[i] - D
            dist = np.linalg.norm(d, axis=1)
            dist[i] = 1e9
            F[i] = (d / dist[:, None] ** 3).sum(0)
        D = unit(D + 0.01 * F)
    lengths = 0.80 + 0.20 * rng.random(n)            # tip centre distance
    lengths[np.argsort(lengths)[:3]] *= 0.9          # a few noticeably shorter
    base_r = 0.090 + 0.015 * rng.random(n)
    tip_r = 0.026 + 0.004 * rng.random(n)
    spikes = [(D[i] * core * 0.35, D[i] * lengths[i], base_r[i], tip_r[i]) for i in range(n)]
    cosm = D @ D.T - 2 * np.eye(n)
    print(f"[spike_star] min angle between spikes {math.degrees(math.acos(cosm.max())):.1f} deg, "
          f"lengths {lengths.min():.2f}-{lengths.max():.2f}")

    def f(P):
        ds = [sd_sphere(P, (0, 0, 0), core)]
        for a, b, r1, r2 in spikes:
            ds.append(sd_round_cone(P, a, b, r1, r2))
        return smin(ds, k)

    ext = float(lengths.max() + 0.06)
    return f, (-ext, -ext, -ext), (ext, ext, ext)


def soft_form_sdf():
    """Liquid mercury caught mid-split (Rayleigh-Plateau pinch-off): a big lobe and
    a clearly smaller teardrop lobe pulling apart on a thinning thread that
    carries a satellite bead. The axis kinks so it never reads as a dumbbell."""
    A = np.array((-0.56, 0.00, -0.08))
    S = np.array((0.08, 0.05, 0.08))
    B = np.array((0.62, 0.14, 0.30))

    def f(P):
        a = sd_ellipsoid(P, A, (0.46, 0.41, 0.36), rot((1, 0, 0), 10) @ rot((0, 1, 0), -8))
        a_pull = sd_round_cone(P, A + (0.12, 0.0, 0.01), S - (0.12, 0.01, 0.02), 0.31, 0.055)
        b = sd_ellipsoid(P, B, (0.31, 0.24, 0.23), rot((0, 0, 1), 8) @ rot((0, 1, 0), -21))
        b_pull = sd_round_cone(P, B - (0.10, 0.02, 0.04), S + (0.11, 0.01, 0.03), 0.20, 0.05)
        lobe_a = smin([a, a_pull], 0.08)
        lobe_b = smin([b, b_pull], 0.06)
        sat = sd_ellipsoid(P, S, (0.105, 0.095, 0.095), rot((0, 1, 0), -15))
        return smin([lobe_a, lobe_b, sat], 0.04)

    return f, (-1.1, -0.5, -0.55), (1.0, 0.5, 0.62)


def smax(ds, k):
    return -smin([-d for d in ds], k)


def molten_glove_sdf():
    """A boxing glove softened into one blob, built on the glove's side profile:
    the top line ramps continuously from the cuff up to a bulbous knuckle roll that
    curls under into the palm; a fused thumb pillow runs along the -Y side; the cuff
    is a blunt tube with a flat soft-rimmed opening that slumps a little, like
    softened wax. No laces, no seams, no logo."""

    def body(P):
        ramp = sd_round_cone(P, (-0.26, 0.0, 0.00), (0.18, 0.0, 0.08), 0.245, 0.36)
        fist = sd_ellipsoid(P, (0.26, 0.0, 0.07), (0.48, 0.37, 0.37), rot((0, 1, 0), -8))
        curl = sd_ellipsoid(P, (0.52, 0.0, -0.06), (0.25, 0.35, 0.33), rot((0, 1, 0), 20))
        grip = sd_ellipsoid(P, (0.30, 0.0, -0.22), (0.26, 0.31, 0.16))
        mass = smin([ramp, fist, curl, grip], 0.10)
        cuff = sd_round_cone(P, (-0.20, 0.0, -0.01), (-0.78, 0.0, -0.02), 0.245, 0.27)
        cuff = smax([cuff, -0.88 - P[:, 0]], 0.05)          # flat soft-rimmed opening
        thumb = smin([sd_round_cone(P, (-0.16, -0.24, -0.14), (0.14, -0.38, -0.08), 0.13, 0.145),
                      sd_round_cone(P, (0.14, -0.38, -0.08), (0.40, -0.36, 0.02), 0.145, 0.13),
                      sd_round_cone(P, (0.40, -0.36, 0.02), (0.56, -0.21, 0.06), 0.13, 0.11)],
                     0.05)
        d = smin2(mass, cuff, 0.12)
        return smin2(d, thumb, 0.035)

    def f(P):
        # slump: the cuff end sinks and spreads slightly, like softened wax
        x = P[:, 0]
        g = np.clip((-x - 0.25) / 0.55, 0.0, 1.0) ** 2
        Q = P.copy()
        Q[:, 2] = P[:, 2] + 0.07 * g
        Q[:, 1] = P[:, 1] / (1.0 + 0.08 * g)
        return body(Q) * 0.92

    return f, (-1.1, -0.72, -0.75), (0.95, 0.55, 0.65)


# ---------------------------------------------------------------------------
# Blender side
# ---------------------------------------------------------------------------

def build_object(name, V, N, F, col, uv=True):
    """Create a smooth-shaded mesh object with exact custom normals."""
    import bmesh
    import bpy
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in V], [], [tuple(f) for f in F])
    me.validate(clean_customdata=False)
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    col.objects.link(ob)
    if uv:
        smart_uv(ob)
    me.shade_smooth()
    me.normals_split_custom_set_from_vertices([tuple(n) for n in N])
    return ob


UV_ANGLE = 80.0   # smart-UV angle limit; higher = fewer islands = fewer split verts


def smart_uv(ob):
    import bpy
    vl = bpy.context.view_layer
    vl.update()
    for o in vl.objects:
        if o is not None:
            o.select_set(False)
    vl.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(UV_ANGLE), island_margin=0.01)
    bpy.ops.object.mode_set(mode="OBJECT")
    ob.select_set(False)


def _replace_mesh_with_eval(ob):
    import bpy
    dg = bpy.context.evaluated_depsgraph_get()
    new = bpy.data.meshes.new_from_object(ob.evaluated_get(dg), depsgraph=dg)
    old = ob.data
    ob.modifiers.clear()
    ob.data = new
    bpy.data.meshes.remove(old)


def check_bounds(f, lo, hi, n=48):
    """Min SDF over the sampling box's faces; must be > 0 (nothing clipped)."""
    lo = np.asarray(lo, float)
    hi = np.asarray(hi, float)
    g = np.linspace(0, 1, n)
    U, V = np.meshgrid(g, g, indexing="ij")
    worst = 1e9
    for ax in range(3):
        o = [a for a in range(3) if a != ax]
        for side in (lo[ax], hi[ax]):
            P = np.zeros((n * n, 3))
            P[:, ax] = side
            P[:, o[0]] = lo[o[0]] + U.ravel() * (hi[o[0]] - lo[o[0]])
            P[:, o[1]] = lo[o[1]] + V.ravel() * (hi[o[1]] - lo[o[1]])
            worst = min(worst, f(P).min())
    return worst


def _activate(ob):
    import bpy
    vl = bpy.context.view_layer
    vl.update()
    for o in vl.objects:
        if o is not None:
            o.select_set(False)
    vl.objects.active = ob
    ob.select_set(True)


def _mesh_diag(me):
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(me)
    nm = sum(1 for e in bm.edges if not e.is_manifold)
    nv = sum(1 for v in bm.verts if not v.is_manifold)
    seen, islands = set(), 0
    for v in bm.verts:
        if v.index in seen:
            continue
        islands += 1
        stack = [v]
        seen.add(v.index)
        while stack:
            x = stack.pop()
            for e in x.link_edges:
                o = e.other_vert(x)
                if o.index not in seen:
                    seen.add(o.index)
                    stack.append(o)
    bm.free()
    return f"non-manifold edges={nm} verts={nv} islands={islands}"


def sdf_form(name, f, lo, hi, voxel, target_faces, col, R=None, log=print, fast=False,
             inflate=0.0, subdiv=True, remesher="quadriflow"):
    """SDF -> OpenVDB mesh -> voxel remesh (manifold) -> QuadriFlow -> Catmull-Clark x1
    -> every vertex projected onto the exact SDF; normals = exact SDF gradient."""
    import bpy
    margin = check_bounds(f, lo, hi)
    assert margin > 0.02, f"{name}: sampling box clips the surface (min sdf {margin:.3f})"
    if fast:
        voxel = max(voxel, 0.02)
    fc = (lambda P: f(P) - inflate) if inflate else f   # cage surface (thin tips thickened)
    pts, quads = sdf_to_polys(fc, lo, hi, voxel)
    log(f"[{name}] vdb verts={len(pts)} quads={len(quads)} box margin={margin:.3f}")
    me = bpy.data.meshes.new(name + "_tmp")
    me.from_pydata([tuple(p) for p in pts], [], [tuple(q) for q in quads])
    me.validate()
    tmp = bpy.data.objects.new(name + "_tmp", me)
    col.objects.link(tmp)
    if not fast:
        rm = tmp.modifiers.new("Remesh", "REMESH")
        rm.mode = "VOXEL"
        rm.voxel_size = voxel
        rm.adaptivity = 0.0
        _replace_mesh_with_eval(tmp)
        log(f"[{name}] remeshed faces={len(tmp.data.polygons)} {_mesh_diag(tmp.data)}")
        # QuadriFlow rejects edges shorter than 1e-4; it is scale-invariant, so
        # remesh a x10 copy and scale back
        from mathutils import Matrix
        tmp.data.transform(Matrix.Scale(10.0, 4))
        _activate(tmp)
        res = None
        seeds = (3, 11, 29) if remesher == "quadriflow" else ()
        if remesher == "decimate":
            dm = tmp.modifiers.new("Decimate", "DECIMATE")
            dm.decimate_type = "COLLAPSE"
            dm.ratio = target_faces / len(tmp.data.polygons)
            dm.use_collapse_triangulate = True
            _replace_mesh_with_eval(tmp)
            res = {"FINISHED"}
            log(f"[{name}] decimated to {len(tmp.data.polygons)} faces "
                f"{_mesh_diag(tmp.data)}")
        for seed in seeds:
            res = bpy.ops.object.quadriflow_remesh(
                target_faces=target_faces, mode="FACES", use_preserve_sharp=False,
                use_preserve_boundary=False, use_mesh_symmetry=False, smooth_normals=False,
                seed=seed)
            if "FINISHED" in res:
                break
        log(f"[{name}] {remesher} {res} faces={len(tmp.data.polygons)}")
        assert "FINISHED" in res, "remesh failed"
        tmp.data.transform(Matrix.Scale(0.1, 4))
        if subdiv:
            m = tmp.modifiers.new("Subdiv", "SUBSURF")
            m.levels = m.render_levels = 1
            _replace_mesh_with_eval(tmp)
    V = np.array([v.co[:] for v in tmp.data.vertices])
    F = [tuple(p.vertices) for p in tmp.data.polygons]
    old = tmp.data
    bpy.data.objects.remove(tmp)
    bpy.data.meshes.remove(old)
    if not fast:
        N0 = unit(sdf_grad(f, V))
        m0, nb0 = folded_mask(V, F, N0, rings=0)
        log(f"[{name}] folded verts before projection={nb0}")
        if nb0:
            idx = np.nonzero(m0)[0]
            rr = np.linalg.norm(V[idx], axis=1)
            log(f"[{name}]   radii of folded verts: {np.round(np.sort(rr), 3)[:40]}")
    V, err = project_to_sdf(f, V)
    if not fast:
        log(f"[{name}] folded verts after projection={folded_mask(V, F, unit(sdf_grad(f, V)), rings=0)[1]}")
        if remesher == "quadriflow":
            V = relax_on_sdf(f, V, F)
        V = repair_folds(f, V, F, log=log, name=name)
        V, err = project_to_sdf(f, V)
    Nn = unit(sdf_grad(f, V))
    log(f"[{name}] projected max|sdf|={err:.2e} folded faces={flipped_faces(V, F, Nn)}")
    V, Nn, c, r = normalize_pose(V, Nn, R)
    return build_object(name, V, Nn, F, col, uv=not fast)
