; // Safe after Hyperfy’s semicolon-free script wrapper.
(() => {
  // <define:BILLARD_SOUNDS>
  var define_BILLARD_SOUNDS_default = { Hit: "asset://caa47932bec1cbb65befa3c1547c331bade7e7fd4992ed7300e0842554b27090.ogg", Collision: "asset://9c25bb4e737fbfe3e84f166621e52b3f6eb0a507a5ddbe29eed5186a27660af2.ogg", Cushion: "asset://5c28fde11e323cbf0dca9181b1e17e318c31e20afb3d53ccf3e97ad083224594.ogg", Pot: "asset://cff7442580bce2f65be7f7968688bd827c7a140ee05578f3e41a0f45eec9b479.ogg" };

  // <define:BILLARD_TEXTURES>
  var define_BILLARD_TEXTURES_default = [null, "asset://57e1dd066ccdbcd57ad5740439d7a57213cea1c70a5607220f76577c16393584.png", "asset://59b6f66e283c9b285c7621345510586aa1c93fd3b304cd693e86263bc43875d3.png", "asset://5ec7943e4a23e95bcaf1412ccbc4e2995ccf8505fb71240180716c3cfde13fc7.png", "asset://12cb63cd1a2235f5b3ac628e101745f41a2f7a698a99aa9b2b78789d5a8cc6b5.png", "asset://3245fc89203de2c0c71441fdbf3b5b1ce0c011c424c4e12ca373687706533079.png", "asset://e42ab0f7ffcc195e0630bcf0bb2a230645dc65896888f056f8304c3b420df3d1.png", "asset://725af0e774306d4dd5198919f2add7298199894b389e77300d2343c8c3e6fd6b.png", "asset://b4c08c6a6739ab486e7ebfc2402e9789e12f75f70196bc6a4418d7cb011bf76d.png", "asset://5a7ba854d9b9e97887480072fb02c8c6c09c4cfa91aefaa972702f4aa6148017.png", "asset://7b3023944d422695a72b4b360092bb6a6172270d69d65fe3d653088b4ad066ed.png", "asset://3e85b49dd7c0ae2cd259b7121de184a2998cc53bc36bae7b4fd9b1baa2ad8f3d.png", "asset://3574fbad38141c5f1416b7db1d5f80697e6f568ba679b375b32983d52bbf2b96.png", "asset://67cb4eb820ace10d66f77d10f3fd998551c32f63f1a5f1a7353da6ad030be95a.png", "asset://27e6fc1a20542f6c6beff0c211a1986b39f5e1adae6b4c90ccbe9fa82e9edae6.png", "asset://9862fbb47d08f5bd2fd1e506e7146e12affe236340f9cdb7c6bfe1aad7bef78b.png"];

  // hyperfy:three
  var V = Vector3;
  var Q = Quaternion;
  var E = Euler;

  // hyperfy-billard/vendor/tailuge/utils/utils.ts
  function atan2(y, x) {
    return Math.fround(Math.atan2(y, x));
  }
  function sin(theta) {
    return Math.fround(Math.sin(theta));
  }
  function cos(theta) {
    return Math.fround(Math.cos(theta));
  }
  function sqrt(theta) {
    return Math.fround(Math.sqrt(theta));
  }
  function exp(theta) {
    return Math.fround(Math.exp(theta));
  }
  function hypot(x, y) {
    return Math.fround(Math.hypot(x, y));
  }

  // hyperfy-billard/vendor/tailuge/utils/three-utils.ts
  var zero = new V(0, 0, 0);
  var up = new V(0, 0, 1);
  function vec(v) {
    return new V(v.x, v.y, v.z);
  }
  var upCrossVec = new V();
  function upCross(v) {
    return upCrossVec.copy(up).cross(v);
  }
  var normVec = new V();
  function norm(v) {
    return normVec.copy(v).normalize();
  }
  var vc = new V();
  function passesThroughZero(v, dv) {
    return vc.copy(v).add(dv).dot(v) <= 0;
  }

  // hyperfy-billard/vendor/tailuge/model/physics/constants.ts
  var mu = 55e-4;
  var muS = 0.126;
  var rho = 0.045;
  var m = 0.23;
  var R = 0.03275;
  var g = 9.8;
  var ee = 0.85;
  var \u03BCs = 0.2;
  var \u03BCw = 0.175;
  var Mz;
  var Mxy;
  var I;
  var e = 0.86;
  var sin\u03B8 = 2 / 5;
  var cos\u03B8 = Math.sqrt(21) / 5;
  var maxPower = 160 * R;
  refresh();
  function refresh() {
    Mz = mu * m * g * 2 / 3 * rho;
    Mxy = 7 / (5 * Math.sqrt(2)) * R * mu * m * g;
    I = 2 / 5 * m * R * R;
  }
  function setR(val) {
    R = val;
    refresh();
  }
  function setm(val) {
    m = val;
    refresh();
  }
  function setmu(val) {
    mu = val;
    refresh();
  }

  // hyperfy-billard/vendor/tailuge/model/physics/mathavan.ts
  var Mathavan = class {
    // work done
    P = 0;
    WzI = 0;
    // centroid velocity
    vx;
    vy;
    // angular velocity
    \u03C9x;
    \u03C9y;
    \u03C9z;
    // slip speed and angles at I and C
    s;
    \u03C6;
    "s\u02B9";
    "\u03C6\u02B9";
    // cached trig values for φ and φʹ (hot path)
    sin\u03C6;
    cos\u03C6;
    "sin\u03C6\u02B9";
    "cos\u03C6\u02B9";
    i = 0;
    N = 100;
    // physical constants
    M;
    R;
    \u03BCs;
    \u03BCw;
    ee;
    constructor(M, R2, ee2, \u03BCs2, \u03BCw2) {
      this.configure(M, R2, ee2, \u03BCs2, \u03BCw2);
    }
    /**
     * Take the physical constants for the next solve.
     *
     * The constants are module bindings (`constants.ts`) that the sliders, the
     * launch parameters and the worker's `configureSimulation` all mutate after
     * this module is loaded, so an instance that caches them has to be handed
     * them again before it solves -- see the hoisted instance in `physics.ts`.
     * The constructor goes through here too, which keeps the parameter list in
     * one place: a new constant is added here and nowhere else.
     */
    configure(M, R2, ee2, \u03BCs2, \u03BCw2) {
      this.M = M;
      this.R = R2;
      this.ee = ee2;
      this.\u03BCs = \u03BCs2;
      this.\u03BCw = \u03BCw2;
    }
    updateSlipSpeedsAndAngles() {
      const R2 = this.R;
      const v_xI = this.vx + this.\u03C9y * R2 * sin\u03B8 - this.\u03C9z * R2 * cos\u03B8;
      const v_yI = -this.vy * sin\u03B8 + this.\u03C9x * R2;
      const v_xC = this.vx - this.\u03C9y * R2;
      const v_yC = this.vy + this.\u03C9x * R2;
      this.s = sqrt(v_xI * v_xI + v_yI * v_yI);
      this.\u03C6 = atan2(v_yI, v_xI);
      if (this.\u03C6 < 0) {
        this.\u03C6 += 2 * Math.PI;
      }
      this["s\u02B9"] = sqrt(v_xC * v_xC + v_yC * v_yC);
      this["\u03C6\u02B9"] = atan2(v_yC, v_xC);
      if (this["\u03C6\u02B9"] < 0) {
        this["\u03C6\u02B9"] += 2 * Math.PI;
      }
      this.sin\u03C6 = sin(this.\u03C6);
      this.cos\u03C6 = cos(this.\u03C6);
      this["sin\u03C6\u02B9"] = sin(this["\u03C6\u02B9"]);
      this["cos\u03C6\u02B9"] = cos(this["\u03C6\u02B9"]);
    }
    compressionPhase() {
      const \u0394P = Math.max(this.M * this.vy / this.N, 1e-3);
      while (this.vy > 0) {
        this.updateSingleStep(\u0394P);
      }
    }
    restitutionPhase(targetWorkRebound) {
      const \u0394P = Math.max(targetWorkRebound / this.N, 1e-3);
      this.WzI = 0;
      while (this.WzI < targetWorkRebound) {
        this.updateSingleStep(\u0394P);
      }
    }
    updateSingleStep(\u0394P) {
      this.updateSlipSpeedsAndAngles();
      const vyPrev = this.vy;
      this.updateVelocity(\u0394P);
      this.updateAngularVelocity(\u0394P);
      this.updateWorkDone(\u0394P, vyPrev);
      if (this.i++ > 10 * this.N) {
        throw new Error("Solution not found");
      }
    }
    updateVelocity(\u0394P) {
      const \u03BCs2 = this.\u03BCs;
      const \u03BCw2 = this.\u03BCw;
      const M = this.M;
      this.vx -= 1 / M * (\u03BCw2 * this.cos\u03C6 + \u03BCs2 * this["cos\u03C6\u02B9"] * (sin\u03B8 + \u03BCw2 * this.sin\u03C6 * cos\u03B8)) * \u0394P;
      this.vy -= 1 / M * (cos\u03B8 - \u03BCw2 * sin\u03B8 * this.sin\u03C6 + \u03BCs2 * this["sin\u03C6\u02B9"] * (sin\u03B8 + \u03BCw2 * this.sin\u03C6 * cos\u03B8)) * \u0394P;
    }
    updateAngularVelocity(\u0394P) {
      const \u03BCs2 = this.\u03BCs;
      const \u03BCw2 = this.\u03BCw;
      const M = this.M;
      const R2 = this.R;
      this.\u03C9x += -(5 / (2 * M * R2)) * (\u03BCw2 * this.sin\u03C6 + \u03BCs2 * this["sin\u03C6\u02B9"] * (sin\u03B8 + \u03BCw2 * this.sin\u03C6 * cos\u03B8)) * \u0394P;
      this.\u03C9y += -(5 / (2 * M * R2)) * (\u03BCw2 * this.cos\u03C6 * sin\u03B8 - \u03BCs2 * this["cos\u03C6\u02B9"] * (sin\u03B8 + \u03BCw2 * this.sin\u03C6 * cos\u03B8)) * \u0394P;
      this.\u03C9z += 5 / (2 * M * R2) * (\u03BCw2 * this.cos\u03C6 * cos\u03B8) * \u0394P;
    }
    updateWorkDone(\u0394P, vyPrev) {
      const \u0394WzI = \u0394P / 2 * (Math.abs(vyPrev) + Math.abs(this.vy)) * cos\u03B8;
      this.WzI += \u0394WzI;
      this.P += \u0394P;
    }
    solvePaper(v0, \u03B1, \u03C90S, \u03C90T) {
      this.solve(v0 * cos(\u03B1), v0 * sin(\u03B1), -\u03C90T * sin(\u03B1), \u03C90T * cos(\u03B1), \u03C90S);
    }
    solve(vx, vy, \u03C9x, \u03C9y, \u03C9z) {
      this.vx = vx;
      this.vy = vy;
      this.\u03C9x = \u03C9x;
      this.\u03C9y = \u03C9y;
      this.\u03C9z = \u03C9z;
      this.WzI = 0;
      this.P = 0;
      this.i = 0;
      this.compressionPhase();
      const targetWorkRebound = this.ee * this.ee * this.WzI;
      this.restitutionPhase(targetWorkRebound);
    }
  };

  // hyperfy-billard/vendor/tailuge/model/physics/physics.ts
  function surfaceVelocity(v, w) {
    return surfaceVelocityFull(v, w).setZ(0);
  }
  var sv = new V();
  function surfaceVelocityFull(v, w) {
    return sv.copy(v).addScaledVector(upCross(w), R);
  }
  var delta = { v: new V(), w: new V() };
  function sliding(v, w) {
    const va = surfaceVelocity(v, w);
    delta.v.copy(norm(va).multiplyScalar(-muS * g));
    delta.w.copy(norm(upCross(va)).multiplyScalar(5 / 2 * muS * g / R));
    delta.w.setZ(-(5 / 2) * (Mz / (m * R * R)) * Math.sign(w.z));
    return delta;
  }
  function rollingFull(w, v, t) {
    const mag = hypot(w.x, w.y);
    const zmag = Math.abs(w.z);
    const zsign = Math.sign(w.z);
    const eps = 0.1;
    if (mag < eps) {
      delta.v.set(-v.x / t, -v.y / t, 0);
      const spindownFactor = zmag > 24 ? 12 : 1;
      delta.w.set(
        -w.x / t,
        -w.y / t,
        -(5 / 2) * (Mz / (m * R * R)) * spindownFactor * zsign
      );
      return delta;
    }
    const kw = 5 / 7 * Mxy / (m * R * R) / mag;
    const dwx = -kw * w.x;
    const dwy = -kw * w.y;
    delta.w.set(dwx, dwy, -(5 / 2) * (Mz / (m * R * R)) * zsign);
    delta.v.set(R * (w.y + dwy) - v.x, -R * (w.x + dwx) - v.y, 0);
    return delta;
  }
  function forceRoll(v, w) {
    const wz = w.z;
    w.copy(upCross(v).multiplyScalar(1 / R));
    w.setZ(wz);
  }
  var vr_v = new V();
  var wr_v = new V();
  function rotateApplyUnrotate(theta, v, w, model) {
    const vr = vr_v.copy(v).applyAxisAngle(up, theta);
    const wr = wr_v.copy(w).applyAxisAngle(up, theta);
    const delta2 = model(vr, wr);
    delta2.v.applyAxisAngle(up, -theta);
    delta2.w.applyAxisAngle(up, -theta);
    return delta2;
  }
  var epsilon = R * 0.1;
  var theta_a = Math.asin(epsilon / R);
  var sin_a = sin(theta_a);
  var cos_a = cos(theta_a);
  function s0(v, w) {
    return new V(
      v.x * sin_a - v.z * cos_a + R * w.y,
      -v.y - R * w.z * cos_a + R * w.x * sin_a
    );
  }
  function c0(v) {
    return v.x * cos_a;
  }
  function basisHan(v, w) {
    return {
      c: c0(v),
      s: s0(v, w),
      A: 7 / 2 / m,
      B: 1 / m
    };
  }
  function gripHan(v, w) {
    const { c, s, A, B } = basisHan(v, w);
    const ecB = (1 + e) * (c / B);
    const PX = -s.x / A * sin_a - ecB * cos_a;
    const PY = s.y / A;
    const PZ = s.x / A * cos_a - ecB * sin_a;
    return impulseToDelta(PX, PY, PZ);
  }
  function slipHan(v, w) {
    const { c, B } = basisHan(v, w);
    const ecB = (1 + e) * (c / B);
    const mu2 = muCushion(v);
    const phi = Math.atan2(v.y, v.x);
    const cos_phi = Math.cos(phi);
    const sin_phi = Math.sin(phi);
    const PX = -mu2 * ecB * cos_phi * cos_a - ecB * cos_a;
    const PY = mu2 * ecB * sin_phi;
    const PZ = mu2 * ecB * cos_phi * cos_a - ecB * sin_a;
    return impulseToDelta(PX, PY, PZ);
  }
  function bounceHanBlend(v, w) {
    const deltaGrip = gripHan(v, w);
    const deltaSlip = slipHan(v, w);
    const isCheckSide = Math.sign(v.y) === Math.sign(w.z);
    const factor = isCheckSide ? Math.cos(Math.atan2(v.y, v.x)) : 1;
    const delta2 = {
      v: deltaSlip.v.lerp(deltaGrip.v, factor),
      w: deltaSlip.w.lerp(deltaGrip.w, factor)
    };
    return delta2;
  }
  function impulseToDelta(PX, PY, PZ) {
    return {
      v: new V(PX / m, PY / m),
      w: new V(
        -R / I * PY * sin_a,
        R / I * (PX * sin_a - PZ * cos_a),
        R / I * PY * cos_a
      )
    };
  }
  function muCushion(v) {
    const theta = Math.atan2(Math.abs(v.y), v.x);
    return 0.471 - theta * 0.241;
  }
  var c2bcMathavan = new Mathavan(m, R, ee, \u03BCs, \u03BCw);
  var c2bcDelta = { v: new V(), w: new V() };
  function cueStrike(angle, power, offset, elevation = 0) {
    const speed = power * (1 - 0.25 * offset.lengthSq());
    const vel = norm(new V(cos(angle), sin(angle), 0)).multiplyScalar(speed);
    const velCos = vel.clone().multiplyScalar(cos(elevation));
    return {
      vel: velCos,
      rvel: cueToSpin(offset, vel, elevation)
    };
  }
  function cueToSpin(offset, v, elevation = 0) {
    const cosAlpha = Math.max(1e-3, Math.cos(elevation));
    const sinAlpha = Math.sin(elevation);
    const projection = Math.max(0.5, cosAlpha);
    const spinRate = 5 / 2 * v.length() * (offset.length() * R) / (R * R * projection);
    const dir = v.clone().normalize();
    const q = dir.clone().multiplyScalar(cosAlpha).addScaledVector(up, -sinAlpha);
    const spinAxis = Math.atan2(-offset.x, offset.y);
    const rvel = upCross(dir).applyAxisAngle(q, spinAxis).multiplyScalar(spinRate);
    return rvel;
  }

  // hyperfy-billard/vendor/tailuge/model/ball.ts
  var Ball = class _Ball {
    pos;
    vel = zero.clone();
    rvel = zero.clone();
    futurePos = zero.clone();
    ballmesh = void 0;
    state = "Stationary" /* Stationary */;
    pocket;
    static id = 0;
    id = _Ball.id++;
    label;
    appearance;
    static transition = 0.05;
    constructor(pos, color, label, appearance) {
      this.pos = pos.clone();
      this.label = label;
      this.appearance = appearance;
    }
    velBefore = new V();
    update(t) {
      if (this.state == "Falling" /* Falling */) {
        this.updatePosition(t);
        this.pocket?.updateFall(this, t);
      } else if (this.state == "Rolling" /* Rolling */) {
        this.velBefore.copy(this.vel);
        this.updateVelocity(t);
        this.pos.addScaledVector(this.velBefore, t / 2);
        this.pos.addScaledVector(this.vel, t / 2);
      } else {
        this.updatePosition(t);
        this.updateVelocity(t);
      }
    }
    updateMesh(t) {
      this.ballmesh?.updateAll(this, t);
    }
    updatePosition(t) {
      this.pos.addScaledVector(this.vel, t);
    }
    updateVelocity(t) {
      if (this.inMotion()) {
        if (this.isRolling()) {
          this.state = "Rolling" /* Rolling */;
          forceRoll(this.vel, this.rvel);
          this.addDelta(t, rollingFull(this.rvel, this.vel, t));
        } else {
          this.state = "Sliding" /* Sliding */;
          this.addDelta(t, sliding(this.vel, this.rvel));
        }
      }
    }
    addDelta(t, delta2) {
      delta2.v.multiplyScalar(t);
      delta2.w.multiplyScalar(t);
      if (this.passesZero(delta2)) {
        this.setStationary();
      } else {
        this.vel.add(delta2.v);
        this.rvel.add(delta2.w);
      }
    }
    passesZero(delta2) {
      const vz = passesThroughZero(this.vel, delta2.v);
      const wz = passesThroughZero(this.rvel, delta2.w);
      const halts = this.state === "Rolling" /* Rolling */ ? vz || wz : vz && wz;
      if (!halts) return false;
      return Math.abs(this.rvel.z) <= Math.abs(delta2.w.z);
    }
    setStationary() {
      this.vel.copy(zero);
      this.rvel.copy(zero);
      this.state = "Stationary" /* Stationary */;
    }
    isRolling() {
      return this.rvel.lengthSq() !== 0 && surfaceVelocityFull(this.vel, this.rvel).length() < _Ball.transition;
    }
    onTable() {
      return this.state !== "Falling" /* Falling */ && this.state !== "InPocket" /* InPocket */;
    }
    inMotion() {
      return this.state === "Rolling" /* Rolling */ || this.state === "Sliding" /* Sliding */ || this.isFalling();
    }
    isFalling() {
      return this.state === "Falling" /* Falling */;
    }
    futurePosition(t) {
      this.futurePos.copy(this.pos).addScaledVector(this.vel, t);
      return this.futurePos;
    }
    fround() {
      this.pos.x = Math.fround(this.pos.x);
      this.pos.y = Math.fround(this.pos.y);
      this.vel.x = Math.fround(this.vel.x);
      this.vel.y = Math.fround(this.vel.y);
      this.rvel.x = Math.fround(this.rvel.x);
      this.rvel.y = Math.fround(this.rvel.y);
      this.rvel.z = Math.fround(this.rvel.z);
    }
    serialise() {
      return {
        pos: this.pos.clone(),
        id: this.id
      };
    }
    static fromSerialised(data) {
      return _Ball.updateFromSerialised(new _Ball(vec(data.pos)), data);
    }
    static updateFromSerialised(b, data) {
      const z = data.pos.z ?? (b.onTable() ? 0 : b.pos.z);
      b.pos.set(data.pos.x, data.pos.y, z);
      b.vel.copy(data?.vel ?? zero);
      b.rvel.copy(data?.rvel ?? zero);
      return b;
    }
  };

  // hyperfy-billard/vendor/tailuge/view/tablegeometry.ts
  var TableGeometry = class _TableGeometry {
    static tableX;
    static tableY;
    static X;
    static Y;
    static hasPockets = true;
    static {
      _TableGeometry.scaleToRadius(R);
    }
    static scaleToRadius(R2) {
      _TableGeometry.tableX = R2 * 43;
      _TableGeometry.tableY = R2 * 21;
      _TableGeometry.X = _TableGeometry.tableX + R2;
      _TableGeometry.Y = _TableGeometry.tableY + R2;
    }
    static configureForRule(ruleType, tableSize = 10) {
      const sizeScale = tableSize / 10;
      if (ruleType === "threecushion" || ruleType === "sagu") {
        const UMB_TABLE_X = 92.36;
        const UMB_TABLE_Y = 46.18;
        _TableGeometry.tableX = R * (UMB_TABLE_X / 2 - 1) * sizeScale;
        _TableGeometry.tableY = R * (UMB_TABLE_Y / 2 - 1) * sizeScale;
        _TableGeometry.hasPockets = false;
      } else {
        _TableGeometry.tableX = R * 43 * sizeScale;
        _TableGeometry.tableY = R * 21 * sizeScale;
        _TableGeometry.hasPockets = true;
        setmu(7e-3);
      }
      _TableGeometry.X = _TableGeometry.tableX + R;
      _TableGeometry.Y = _TableGeometry.tableY + R;
    }
  };

  // hyperfy-billard/vendor/tailuge/model/physics/knuckle.ts
  var Knuckle = class _Knuckle {
    pos;
    radius;
    constructor(pos, radius) {
      this.pos = pos;
      this.radius = radius;
    }
    static willBounce(knuckle, futurePosition) {
      return futurePosition.distanceTo(knuckle.pos) < R + knuckle.radius;
    }
    bounce(ball) {
      const kb = ball.pos.clone().sub(this.pos).normalize();
      const velDotCenters = kb.dot(ball.vel);
      ball.vel.addScaledVector(kb, -2 * e * velDotCenters);
      ball.rvel.multiplyScalar(0.5);
      return Math.abs(velDotCenters);
    }
    static findBouncing(ball, t) {
      const futurePosition = ball.futurePosition(t);
      return PocketGeometry.knuckles.find(
        (k) => _Knuckle.willBounce(k, futurePosition)
      );
    }
  };

  // hyperfy-billard/vendor/tailuge/model/physics/pocket.ts
  var Pocket = class _Pocket {
    pos;
    radius;
    constructor(pos, radius) {
      this.pos = pos;
      this.radius = radius;
    }
    static willFall(pocket, futurePosition) {
      return futurePosition.distanceTo(pocket.pos) < pocket.radius;
    }
    fall(ball, t) {
      ball.vel.z = -g * t;
      ball.state = "Falling" /* Falling */;
      ball.pocket = this;
      return ball.vel.length();
    }
    updateFall(ball, t) {
      ball.vel.addScaledVector(up, -R * 10 * t * g);
      const z = ball.pos.z;
      const xypos = ball.pos.clone().setZ(0);
      const distToCentre = xypos.distanceTo(this.pos);
      if (distToCentre > this.radius - R) {
        const toCentre = this.pos.clone().sub(ball.pos).normalize().setZ(0);
        if (z > -R / 2) {
          ball.vel.addScaledVector(toCentre, R * 7 * t * g);
          ball.rvel.addScaledVector(upCross(toCentre), 7 * t * g);
        }
        if (ball.vel.dot(toCentre) < 0) {
          ball.ballmesh?.trace.forceTrace(ball.pos);
          ball.vel.x = toCentre.x * ball.vel.length() / 2;
          ball.vel.y = toCentre.y * ball.vel.length() / 2;
        }
      }
      const restingDepth = this.restingDepth(ball);
      if (z < restingDepth && ball.rvel.length() !== 0) {
        ball.pos.z = restingDepth;
        ball.vel.z = -R / 10;
        ball.rvel.copy(zero);
      }
      if (z < restingDepth - R) {
        ball.pos.z = restingDepth - R;
        ball.setStationary();
        ball.state = "InPocket" /* InPocket */;
      }
    }
    restingDepth(ball) {
      return -3 * R - R * ball.id / 4;
    }
    static findPocket(pocketCenters, ball, t) {
      const futurePosition = ball.futurePosition(t);
      return pocketCenters.find((p) => _Pocket.willFall(p, futurePosition));
    }
  };

  // hyperfy-billard/vendor/tailuge/view/pocketgeometry.ts
  var PocketGeometry = class _PocketGeometry {
    static PX;
    static PY;
    static knuckleInset;
    static knuckleRadius;
    static middleKnuckleInset;
    static middleKnuckleRadius;
    static cornerRadius;
    static middleRadius;
    static pockets;
    static knuckles;
    static pocketCenters;
    static {
      _PocketGeometry.scaleToRadius(R);
    }
    static scaleToRadius(R2) {
      _PocketGeometry.PX = TableGeometry.tableX + R2 * (0.8 / 0.5);
      _PocketGeometry.PY = TableGeometry.tableY + R2 * (0.8 / 0.5);
      _PocketGeometry.knuckleInset = R2 * 1.6 / 0.5;
      _PocketGeometry.knuckleRadius = R2 * 0.31 / 0.5;
      _PocketGeometry.middleKnuckleInset = R2 * 1.385 / 0.5;
      _PocketGeometry.middleKnuckleRadius = R2 * 0.2 / 0.5;
      _PocketGeometry.cornerRadius = R2 * 1.1 / 0.5;
      _PocketGeometry.middleRadius = R2 * 0.9 / 0.5;
      _PocketGeometry.pocketLayout(R2);
      _PocketGeometry.enumerateCenters();
      _PocketGeometry.enumerateKnuckles();
    }
    static enumerateKnuckles() {
      _PocketGeometry.knuckles = [
        _PocketGeometry.pockets.pocketNW.knuckleNE,
        _PocketGeometry.pockets.pocketNW.knuckleSW,
        _PocketGeometry.pockets.pocketN.knuckleNW,
        _PocketGeometry.pockets.pocketN.knuckleNE,
        _PocketGeometry.pockets.pocketS.knuckleSW,
        _PocketGeometry.pockets.pocketS.knuckleSE,
        _PocketGeometry.pockets.pocketNE.knuckleNW,
        _PocketGeometry.pockets.pocketNE.knuckleSE,
        _PocketGeometry.pockets.pocketSE.knuckleNE,
        _PocketGeometry.pockets.pocketSE.knuckleSW,
        _PocketGeometry.pockets.pocketSW.knuckleSE,
        _PocketGeometry.pockets.pocketSW.knuckleNW
      ];
    }
    static enumerateCenters() {
      _PocketGeometry.pocketCenters = [
        _PocketGeometry.pockets.pocketNW.pocket,
        _PocketGeometry.pockets.pocketSW.pocket,
        _PocketGeometry.pockets.pocketN.pocket,
        _PocketGeometry.pockets.pocketS.pocket,
        _PocketGeometry.pockets.pocketNE.pocket,
        _PocketGeometry.pockets.pocketSE.pocket
      ];
    }
    static pocketLayout(R2) {
      _PocketGeometry.pockets = {
        pocketNW: {
          pocket: new Pocket(
            new V(-_PocketGeometry.PX, _PocketGeometry.PY, 0),
            _PocketGeometry.cornerRadius
          ),
          knuckleNE: new Knuckle(
            new V(
              -TableGeometry.X + _PocketGeometry.knuckleInset,
              TableGeometry.Y + _PocketGeometry.knuckleRadius,
              0
            ),
            _PocketGeometry.knuckleRadius
          ),
          knuckleSW: new Knuckle(
            new V(
              -TableGeometry.X - _PocketGeometry.knuckleRadius,
              TableGeometry.Y - _PocketGeometry.knuckleInset,
              0
            ),
            _PocketGeometry.knuckleRadius
          )
        },
        pocketN: {
          pocket: new Pocket(
            new V(0, _PocketGeometry.PY + R2 * 0.7 / 0.5, 0),
            _PocketGeometry.middleRadius
          ),
          knuckleNE: new Knuckle(
            new V(
              _PocketGeometry.middleKnuckleInset,
              TableGeometry.Y + _PocketGeometry.middleKnuckleRadius,
              0
            ),
            _PocketGeometry.middleKnuckleRadius
          ),
          knuckleNW: new Knuckle(
            new V(
              -_PocketGeometry.middleKnuckleInset,
              TableGeometry.Y + _PocketGeometry.middleKnuckleRadius,
              0
            ),
            _PocketGeometry.middleKnuckleRadius
          )
        },
        pocketS: {
          pocket: new Pocket(
            new V(0, -_PocketGeometry.PY - R2 * 0.7 / 0.5, 0),
            _PocketGeometry.middleRadius
          ),
          knuckleSE: new Knuckle(
            new V(
              _PocketGeometry.middleKnuckleInset,
              -TableGeometry.Y - _PocketGeometry.middleKnuckleRadius,
              0
            ),
            _PocketGeometry.middleKnuckleRadius
          ),
          knuckleSW: new Knuckle(
            new V(
              -_PocketGeometry.middleKnuckleInset,
              -TableGeometry.Y - _PocketGeometry.middleKnuckleRadius,
              0
            ),
            _PocketGeometry.middleKnuckleRadius
          )
        },
        pocketNE: {
          pocket: new Pocket(
            new V(_PocketGeometry.PX, _PocketGeometry.PY, 0),
            _PocketGeometry.cornerRadius
          ),
          knuckleNW: new Knuckle(
            new V(
              TableGeometry.X - _PocketGeometry.knuckleInset,
              TableGeometry.Y + _PocketGeometry.knuckleRadius,
              0
            ),
            _PocketGeometry.knuckleRadius
          ),
          knuckleSE: new Knuckle(
            new V(
              TableGeometry.X + _PocketGeometry.knuckleRadius,
              TableGeometry.Y - _PocketGeometry.knuckleInset,
              0
            ),
            _PocketGeometry.knuckleRadius
          )
        },
        pocketSE: {
          pocket: new Pocket(
            new V(_PocketGeometry.PX, -_PocketGeometry.PY, 0),
            _PocketGeometry.cornerRadius
          ),
          knuckleNE: new Knuckle(
            new V(
              TableGeometry.X + _PocketGeometry.knuckleRadius,
              -TableGeometry.Y + _PocketGeometry.knuckleInset,
              0
            ),
            _PocketGeometry.knuckleRadius
          ),
          knuckleSW: new Knuckle(
            new V(
              TableGeometry.X - _PocketGeometry.knuckleInset,
              -TableGeometry.Y - _PocketGeometry.knuckleRadius,
              0
            ),
            _PocketGeometry.knuckleRadius
          )
        },
        pocketSW: {
          pocket: new Pocket(
            new V(-_PocketGeometry.PX, -_PocketGeometry.PY, 0),
            _PocketGeometry.cornerRadius
          ),
          knuckleSE: new Knuckle(
            new V(
              -TableGeometry.X + _PocketGeometry.knuckleInset,
              -TableGeometry.Y - _PocketGeometry.knuckleRadius,
              0
            ),
            _PocketGeometry.knuckleRadius
          ),
          knuckleNW: new Knuckle(
            new V(
              -TableGeometry.X - _PocketGeometry.knuckleRadius,
              -TableGeometry.Y + _PocketGeometry.knuckleInset,
              0
            ),
            _PocketGeometry.knuckleRadius
          )
        }
      };
    }
  };

  // hyperfy-billard/vendor/tailuge/model/physics/cushion.ts
  var Cushion = class _Cushion {
    /**
     * Modify ball state reflecting in cushion if it impacts in time t.
     * Returns impact speed else undefined.
     *
     * Knuckle impacts are not part of this and handled elsewhere.
     */
    static bounceAny(ball, t, hasPockets = true, cushionModel = bounceHanBlend) {
      const futurePosition = ball.futurePosition(t);
      if (!hasPockets) {
        const result = _Cushion.bounceCornerNoPockets(ball, cushionModel);
        if (result !== void 0) return result;
      }
      if (_Cushion.willBounceLong(futurePosition, hasPockets)) {
        const dir = futurePosition.y > TableGeometry.tableY ? -Math.PI / 2 : Math.PI / 2;
        const cushion = futurePosition.y > TableGeometry.tableY ? "L" : "l";
        return {
          incidentSpeed: _Cushion.bounceIn(dir, ball, cushionModel),
          cushion
        };
      }
      if (_Cushion.willBounceShort(futurePosition, hasPockets)) {
        const dir = futurePosition.x > TableGeometry.tableX ? 0 : Math.PI;
        const cushion = futurePosition.x > TableGeometry.tableX ? "S" : "s";
        return {
          incidentSpeed: _Cushion.bounceIn(dir, ball, cushionModel),
          cushion
        };
      }
      return void 0;
    }
    static bounceCornerNoPockets(ball, cushionModel) {
      const overX = Math.abs(ball.futurePos.x) - TableGeometry.tableX;
      const overY = Math.abs(ball.futurePos.y) - TableGeometry.tableY;
      if (overX <= 0 || overY <= 0) return void 0;
      let dir;
      let cushion;
      if (overX >= overY) {
        dir = ball.futurePos.x > 0 ? 0 : Math.PI;
        cushion = ball.futurePos.x > 0 ? "S" : "s";
      } else {
        dir = ball.futurePos.y > 0 ? -Math.PI / 2 : Math.PI / 2;
        cushion = ball.futurePos.y > 0 ? "L" : "l";
      }
      return {
        incidentSpeed: _Cushion.bounceIn(dir, ball, cushionModel),
        cushion
      };
    }
    static willBounceShort(futurePosition, hasPockets) {
      if (!hasPockets) {
        return _Cushion.willBounceShortSegment(
          TableGeometry.Y,
          -TableGeometry.Y,
          futurePosition
        );
      }
      return _Cushion.willBounceShortSegment(
        PocketGeometry.pockets.pocketNW.knuckleSW.pos.y,
        PocketGeometry.pockets.pocketSW.knuckleNW.pos.y,
        futurePosition
      );
    }
    static willBounceLong(futurePosition, hasPockets) {
      if (!hasPockets) {
        return _Cushion.willBounceLongSegment(
          -TableGeometry.X,
          TableGeometry.X,
          futurePosition
        );
      }
      return _Cushion.willBounceLongSegment(
        PocketGeometry.pockets.pocketNW.knuckleNE.pos.x,
        PocketGeometry.pockets.pocketN.knuckleNW.pos.x,
        futurePosition
      ) || _Cushion.willBounceLongSegment(
        PocketGeometry.pockets.pocketN.knuckleNE.pos.x,
        PocketGeometry.pockets.pocketNE.knuckleNW.pos.x,
        futurePosition
      );
    }
    /**
     * Long Cushion refers to longest dimention of table (skipping middle pocket),
     * in this model that is oriented along the X axis.
     */
    static willBounceLongSegment(left, right, futurePosition) {
      return futurePosition.x > left && futurePosition.x < right && Math.abs(futurePosition.y) > TableGeometry.tableY;
    }
    static willBounceShortSegment(top, bottom, futurePosition) {
      return futurePosition.y > bottom && futurePosition.y < top && Math.abs(futurePosition.x) > TableGeometry.tableX;
    }
    static bounceIn(rotation, ball, cushionModel) {
      ball.ballmesh?.trace.forceTrace(ball.futurePos);
      const delta2 = rotateApplyUnrotate(
        rotation,
        ball.vel,
        ball.rvel,
        cushionModel
      );
      ball.vel.add(delta2.v);
      ball.rvel.add(delta2.w);
      return delta2.v.length();
    }
  };

  // hyperfy-billard/vendor/tailuge/model/physics/collisionthrow.ts
  var ab_v = new V();
  var abTangent_v = new V();
  var vPoint_v = new V();
  var vRelTangentialVec_v = new V();
  var impulseTangential_v = new V();
  var impulseNormal_v = new V();
  var angularImpulse_v = new V();
  var temp_v = new V();
  var CollisionThrow = class {
    normalImpulse;
    tangentialImpulse;
    dynamicFriction(vRel) {
      return 0.01 + 0.108 * exp(-1.088 * vRel);
    }
    updateVelocities(a, b) {
      const contact = Collision.positionsAtContact(a, b);
      a.ballmesh?.trace.forceTrace(contact.a);
      b.ballmesh?.trace.forceTrace(contact.b);
      const ab = ab_v.subVectors(contact.b, contact.a).normalize();
      const abTangent = abTangent_v.set(-ab.y, ab.x, 0);
      const e2 = 0.925;
      const vPoint = vPoint_v.copy(a.vel).sub(b.vel).add(temp_v.copy(ab).multiplyScalar(-R).cross(a.rvel)).sub(temp_v.copy(ab).multiplyScalar(R).cross(b.rvel));
      const vRelNormalMag = ab.dot(vPoint);
      const vRelTangentialVec = vRelTangentialVec_v.copy(vPoint).addScaledVector(ab, -vRelNormalMag);
      const vRelMag = vRelTangentialVec.length();
      const \u03BC = this.dynamicFriction(vRelMag);
      this.normalImpulse = -(1 + e2) * vRelNormalMag / (2 / m);
      const impulseTangential = impulseTangential_v.set(0, 0, 0);
      if (vRelMag > 1e-8) {
        const maxJt_friction = \u03BC * Math.abs(this.normalImpulse);
        const maxJt_stick = m / 7 * vRelMag;
        const jtMag = Math.min(maxJt_friction, maxJt_stick);
        impulseTangential.copy(vRelTangentialVec).multiplyScalar(-jtMag / vRelMag);
        this.tangentialImpulse = impulseTangential.dot(abTangent);
      } else {
        this.tangentialImpulse = 0;
      }
      const impulseNormal = impulseNormal_v.copy(ab).multiplyScalar(this.normalImpulse);
      a.vel.addScaledVector(impulseNormal, 1 / m).addScaledVector(impulseTangential, 1 / m);
      a.vel.z = 0;
      b.vel.addScaledVector(impulseNormal, -1 / m).addScaledVector(impulseTangential, -1 / m);
      b.vel.z = 0;
      const angularImpulse = angularImpulse_v.copy(ab).multiplyScalar(R).cross(impulseTangential);
      a.rvel.addScaledVector(angularImpulse, 1 / I);
      b.rvel.addScaledVector(angularImpulse, 1 / I);
      return vRelNormalMag;
    }
  };

  // hyperfy-billard/vendor/tailuge/model/physics/collision.ts
  var Collision = class _Collision {
    static willCollide(a, b, t) {
      return (a.inMotion() || b.inMotion()) && a.onTable() && b.onTable() && a.futurePosition(t).distanceToSquared(b.futurePosition(t)) < 4 * R * R;
    }
    static collide(a, b) {
      return _Collision.updateVelocities(a, b);
    }
    static p = new V();
    static v = new V();
    static contactA = new V();
    static contactB = new V();
    static positionsAtContact(a, b) {
      this.p.subVectors(a.pos, b.pos);
      this.v.subVectors(a.vel, b.vel);
      const rSum = 2 * R;
      const aCoeff = this.v.lengthSq();
      if (aCoeff === 0) {
        return {
          a: this.contactA.copy(a.pos),
          b: this.contactB.copy(b.pos)
        };
      }
      const bCoeff = 2 * this.p.dot(this.v);
      const cCoeff = this.p.lengthSq() - rSum * rSum;
      const discriminant = bCoeff * bCoeff - 4 * aCoeff * cCoeff;
      const t = discriminant < 0 ? 0 : (-bCoeff - Math.sqrt(discriminant)) / (2 * aCoeff);
      return {
        a: this.contactA.copy(a.pos).addScaledVector(a.vel, t),
        b: this.contactB.copy(b.pos).addScaledVector(b.vel, t)
      };
    }
    static model = new CollisionThrow();
    static updateVelocities(a, b) {
      const impactSpeed = _Collision.model.updateVelocities(a, b);
      a.state = "Sliding" /* Sliding */;
      b.state = "Sliding" /* Sliding */;
      return impactSpeed;
    }
  };

  // hyperfy-billard/vendor/tailuge/model/outcome.ts
  var Outcome = class _Outcome {
    type;
    timestamp;
    ballA = null;
    ballB = null;
    incidentSpeed;
    cushion;
    position;
    constructor(type, ballA, ballB, incidentSpeed, timestamp, cushion) {
      this.position = type === "Collision" /* Collision */ ? ballA.pos.clone().add(ballB.pos).multiplyScalar(0.5).toArray() : ballA.pos.toArray();
      this.type = type;
      this.ballA = ballA;
      this.ballB = ballB;
      this.incidentSpeed = incidentSpeed;
      this.timestamp = timestamp;
      this.cushion = cushion;
    }
    static pot(ballA, incidentSpeed, timestamp) {
      return new _Outcome("Pot" /* Pot */, ballA, ballA, incidentSpeed, timestamp);
    }
    static cushion(ballA, incidentSpeed, timestamp, cushion) {
      return new _Outcome(
        "Cushion" /* Cushion */,
        ballA,
        ballA,
        incidentSpeed,
        timestamp,
        cushion
      );
    }
    static collision(ballA, ballB, incidentSpeed, timestamp) {
      return new _Outcome(
        "Collision" /* Collision */,
        ballA,
        ballB,
        incidentSpeed,
        timestamp
      );
    }
    static hit(ballA, incidentSpeed, timestamp) {
      return new _Outcome("Hit" /* Hit */, ballA, ballA, incidentSpeed, timestamp);
    }
    static proximity(ballA, ballB, distance = 0, timestamp) {
      return new _Outcome("Proximity" /* Proximity */, ballA, ballB, distance, timestamp);
    }
    static isCueBallPotted(cueBall, outcomes) {
      return outcomes.some(
        (o) => o.type == "Pot" /* Pot */ && o.ballA === cueBall
      );
    }
    static isBallPottedNoFoul(cueBall, outcomes) {
      return outcomes.some((o) => o.type == "Pot" /* Pot */ && o.ballA !== null) && !_Outcome.isCueBallPotted(cueBall, outcomes);
    }
    static pots(outcomes) {
      return outcomes.filter((o) => o.type == "Pot" /* Pot */).map((o) => o.ballA);
    }
    static potCount(outcomes) {
      return this.pots(outcomes).length;
    }
    static onlyRedsPotted(outcomes) {
      return this.pots(outcomes).every((b) => b.id > 6);
    }
    static firstCollision(outcome) {
      const collisions = outcome.filter((o) => o.type === "Collision" /* Collision */);
      return collisions.length > 0 ? collisions[0] : void 0;
    }
    static isClearTable(table) {
      const onTable = table.balls.filter((ball) => ball.onTable());
      return onTable.length === 1 && onTable[0] === table.cueball;
    }
    static isThreeCushionPoint(cueBall, outcomes) {
      outcomes = _Outcome.cueBallFirst(cueBall, outcomes).filter(
        (outcome) => outcome.ballA === cueBall
      );
      const cannons = /* @__PURE__ */ new Set();
      let cushions = 0;
      for (const outcome of outcomes) {
        if (outcome.type === "Cushion" /* Cushion */) {
          cushions++;
        }
        if (outcome.type === "Collision" /* Collision */) {
          cannons.add(outcome.ballB);
          if (cannons.size === 2) {
            return cushions >= 3;
          }
        }
      }
      const proximity = outcomes.find(
        (o) => o.type === "Proximity" /* Proximity */ && o.ballA === cueBall
      );
      if (proximity) {
        const collisionCount = new Set(
          outcomes.filter(
            (o) => o.type === "Collision" /* Collision */ && o.ballA === cueBall
          ).map((o) => o.ballB)
        ).size;
        if (collisionCount === 1 && cushions >= 3) {
          return true;
        }
      }
      return false;
    }
    static getProximityScore(cueBall, outcomes) {
      const proximityOutcomes = outcomes.filter(
        (o) => o.type === "Proximity" /* Proximity */ && o.ballA === cueBall
      );
      if (proximityOutcomes.length === 0) return 0;
      const minDistance = Math.min(
        ...proximityOutcomes.map((o) => o.incidentSpeed)
      );
      if (minDistance <= 2 * R) return 3;
      if (minDistance <= 3 * R) return 2;
      if (minDistance <= 4 * R) return 1;
      return 0;
    }
    static cueBallFirst(cueBall, outcomes) {
      outcomes.forEach((o) => {
        if (o.type === "Collision" /* Collision */ && o.ballB === cueBall) {
          o.ballB = o.ballA;
          o.ballA = cueBall;
        }
      });
      return outcomes;
    }
    serialise() {
      const s = {
        type: this.type,
        timestamp: this.timestamp,
        incidentSpeed: this.incidentSpeed,
        ballA: this.ballA ? { id: this.ballA.id } : null,
        ballB: this.ballB ? { id: this.ballB.id } : null
      };
      if (this.cushion) {
        s.cushion = this.cushion;
      }
      return s;
    }
  };

  // hyperfy-billard/vendor/tailuge/model/table.ts
  var Table = class {
    balls;
    cue;
    proximityIndicator;
    proximityEnabled = false;
    pairs;
    outcome = [];
    time = 0;
    cueball;
    cushionModel = bounceHanBlend;
    mesh;
    /** Initial conditions of the current shot, captured in `hit()` so a depth-
     * exceeded exception can print a recreation link. Undefined until a shot
     * starts. Capture/build/report logic lives in `ShotStartUtils`. */
    shotStartConditions;
    constructor(balls) {
      this.cueball = balls[0];
      this.initialiseBalls(balls);
    }
    initialiseBalls(balls) {
      this.balls = balls;
      this.pairs = [];
      for (let a = 0; a < balls.length; a++) {
        for (let b = 0; b < balls.length; b++) {
          if (a < b) {
            this.pairs.push({ a: balls[a], b: balls[b] });
          }
        }
      }
    }
    updateBallMesh(t) {
      this.balls.forEach((a) => {
        a.updateMesh(t);
      });
    }
    advance(t) {
      this.time += t * 1e3;
      let depth = 0;
      while (!this.prepareAdvanceAll(t)) {
        if (depth++ > 100) {
          throw new Error("Depth exceeded resolving collisions");
        }
      }
      this.balls.forEach((a) => {
        a.update(t);
        a.fround();
      });
    }
    /**
     * Returns true if all balls can advance by t without collision
     *
     */
    prepareAdvanceAll(t) {
      return this.pairs.every((pair) => this.prepareAdvancePair(pair.a, pair.b, t)) && this.balls.every((ball) => this.prepareAdvanceToCushions(ball, t));
    }
    /**
     * Returns true if a pair of balls can advance by t without any collision.
     * If there is a collision, adjust velocity appropriately.
     *
     */
    prepareAdvancePair(a, b, t) {
      if (Collision.willCollide(a, b, t)) {
        const incidentSpeed = Collision.collide(a, b);
        this.outcome.push(Outcome.collision(a, b, incidentSpeed, this.time));
        return false;
      }
      return true;
    }
    /**
     * Returns true if ball can advance by t without hitting cushion, knuckle or pocket.
     * If there is a collision, adjust velocity appropriately.
     *
     */
    prepareAdvanceToCushions(a, t) {
      if (!a.onTable()) {
        return true;
      }
      const futurePosition = a.futurePosition(t);
      if (Math.abs(futurePosition.y) < TableGeometry.tableY && Math.abs(futurePosition.x) < TableGeometry.tableX) {
        return true;
      }
      const result = Cushion.bounceAny(
        a,
        t,
        TableGeometry.hasPockets,
        this.cushionModel
      );
      if (result && result.incidentSpeed) {
        this.outcome.push(
          Outcome.cushion(a, result.incidentSpeed, this.time, result.cushion)
        );
        return false;
      }
      if (TableGeometry.hasPockets) {
        const k = Knuckle.findBouncing(a, t);
        if (k) {
          const knuckleIncidentSpeed = k.bounce(a);
          this.outcome.push(Outcome.cushion(a, knuckleIncidentSpeed, this.time));
          return false;
        }
        const p = Pocket.findPocket(PocketGeometry.pocketCenters, a, t);
        if (p) {
          const pocketIncidentSpeed = p.fall(a, t);
          this.outcome.push(Outcome.pot(a, pocketIncidentSpeed, this.time));
          return false;
        }
      }
      return true;
    }
    allStationary() {
      return this.balls.every((b) => !b.inMotion());
    }
    inPockets() {
      return this.balls.reduce((acc, b) => b.onTable() ? acc : acc + 1, 0);
    }
  };

  // hyperfy-billard/src/simulation.js
  var BALL_RADIUS = 0.028575;
  var STEP = 1 / 480;
  var MAX_SPEED = 5;
  function dimensions(preset2 = "9") {
    return preset2 === "8" ? { length: 2.3368, width: 1.1684 } : { length: 2.54, width: 1.27 };
  }
  function rackPositions(preset2) {
    const { length } = dimensions(preset2);
    const positions = [[-length / 4, 0, 0]];
    const order = [1, 9, 2, 3, 8, 10, 11, 4, 12, 5, 6, 13, 7, 14, 15];
    let n = 0;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col <= row; col++) {
        positions[order[n++]] = [
          length / 4 + row * Math.sqrt(3) * (BALL_RADIUS + 5e-5),
          (2 * col - row) * (BALL_RADIUS + 5e-5),
          0
        ];
      }
    }
    return positions;
  }
  var Simulation = class {
    constructor(preset2 = "9") {
      this.preset = preset2;
      this.size = dimensions(preset2);
      setR(BALL_RADIUS);
      setm(0.17);
      setmu(7e-3);
      Object.assign(TableGeometry, {
        X: this.size.length / 2,
        Y: this.size.width / 2,
        tableX: this.size.length / 2 - R,
        tableY: this.size.width / 2 - R,
        hasPockets: true
      });
      PocketGeometry.scaleToRadius(R);
      this.eventId = 0;
      this.reset();
    }
    reset() {
      this.table = new Table(
        rackPositions(this.preset).map((p, id) => {
          const ball = new Ball(new V(...p), void 0, id);
          Object.defineProperty(ball, "id", { value: id });
          return ball;
        })
      );
      this.events = [];
      this.shots = 0;
      this.error = null;
    }
    get moving() {
      return !this.table.allStationary();
    }
    get scratched() {
      return !this.table.cueball.onTable();
    }
    shoot({ angle, speed, side = 0, top = 0 } = {}) {
      if (this.error || this.moving || this.scratched || ![angle, speed, side, top].every(Number.isFinite) || Math.abs(angle) > Math.PI * 2 || speed < 0.1 || speed > MAX_SPEED || Math.hypot(side, top) > 0.45)
        return false;
      const strike = cueStrike(angle, speed, new V(side, top, 0), 0);
      this.table.cueball.vel.copy(strike.vel);
      this.table.cueball.rvel.copy(strike.rvel);
      this.table.cueball.state = "Sliding" /* Sliding */;
      this.table.outcome.length = 0;
      this.events.push({
        id: ++this.eventId,
        type: "Hit",
        time: this.table.time / 1e3,
        position: this.table.cueball.pos.toArray(),
        strength: speed
      });
      this.shots++;
      return true;
    }
    place(x, y) {
      if (this.error || this.moving || !this.scratched || ![x, y].every(Number.isFinite) || Math.abs(x) > this.size.length / 2 - 2 * R || Math.abs(y) > this.size.width / 2 - 2 * R)
        return false;
      const position = new V(x, y, 0);
      if (this.table.balls.slice(1).some((b) => b.onTable() && b.pos.distanceTo(position) < 2 * R + 1e-4)) return false;
      this.table.cueball.pos.copy(position);
      this.table.cueball.setStationary();
      return true;
    }
    step() {
      if (!this.moving || this.error) return;
      try {
        this.table.advance(STEP);
        for (const event of this.table.outcome) {
          if (event.incidentSpeed < 0.03) continue;
          this.events.push({
            id: ++this.eventId,
            type: event.type,
            time: event.timestamp / 1e3,
            position: event.position,
            strength: event.incidentSpeed
          });
        }
        this.table.outcome.length = 0;
        if (this.table.balls.some(
          (b) => ![...b.pos.toArray(), ...b.vel.toArray(), ...b.rvel.toArray()].every(Number.isFinite)
        ))
          throw Error("Non-finite physics state");
      } catch (error) {
        this.error = `Simulation stopped: ${error.message}. Re-rack to recover.`;
        for (const ball of this.table.balls) {
          const state = ball.state;
          ball.setStationary();
          if (state === "InPocket" /* InPocket */ || state === "Falling" /* Falling */) ball.state = "InPocket" /* InPocket */;
        }
      }
    }
    snapshot() {
      return {
        time: this.table.time / 1e3,
        lastEventId: this.eventId,
        shots: this.shots,
        moving: this.moving,
        scratched: this.scratched,
        error: this.error,
        balls: this.table.balls.map((b) => ({ id: b.label, p: b.pos.toArray(), w: b.rvel.toArray(), state: b.state }))
      };
    }
  };

  // hyperfy-billard/src/cues.js
  var CUE_EVENT = "billard:cues";
  var POSE_EVENT = "billard:cue-pose";
  function watchCues(world2, changed) {
    const racks = /* @__PURE__ */ new Map();
    world2.on(CUE_EVENT, (data) => {
      if (!data || typeof data.rackId !== "string" || !Array.isArray(data.holders)) return;
      if (data.holders.length) racks.set(data.rackId, data.holders.filter((id) => typeof id === "string"));
      else racks.delete(data.rackId);
      changed([...new Set([...racks.values()].flat())]);
    });
  }

  // hyperfy-billard/src/server.js
  function startServer(world2, app2, preset2) {
    const sim = new Simulation(preset2);
    let owner = null, lease = 0, seq = 0, rack = 0, elapsed = 0, accumulator = 0, sinceSnapshot = 0, cueHolders = [], aim = null, lastAim = -1;
    const publish = () => {
      app2.state.aim = aim;
      app2.state.pool = { ...sim.snapshot(), owner, aim, cueHolders: cueHolders.slice(), seq: ++seq, rack, events: sim.events.splice(0) };
      app2.send("pool:snapshot", app2.state.pool);
    };
    const playerFor = (sender) => world2.getPlayers().find((p) => p.networkId === sender);
    const nearby = (player) => {
      if (!player) return false;
      const center = app2.position.clone();
      return player.position.distanceTo(center) <= 5 * Math.max(1, app2.scale.x, app2.scale.y, app2.scale.z);
    };
    const authorized = (sender) => {
      const player = playerFor(sender);
      return player && player.id === owner && cueHolders.includes(player.id) && nearby(player);
    };
    const cueEvent = CUE_EVENT;
    watchCues(world2, (next) => {
      if (JSON.stringify(next) === JSON.stringify(cueHolders)) return;
      cueHolders = next;
      if (owner && !cueHolders.includes(owner)) owner = aim = null;
      publish();
    });
    const refreshCues = () => app2.emit(`${cueEvent}:request`);
    const validAim = (data) => data && [data.angle, data.side ?? 0, data.top ?? 0].every(Number.isFinite) && Math.abs(data.angle) <= Math.PI * 2 && Math.hypot(data.side ?? 0, data.top ?? 0) <= 0.450001;
    const expire = () => {
      const player = owner && world2.getPlayer(owner);
      if (owner && (elapsed > lease || !nearby(player) || !cueHolders.includes(owner))) {
        owner = aim = null;
        publish();
      }
    };
    app2.on("pool:claim", (request, sender) => {
      refreshCues();
      expire();
      const player = playerFor(sender);
      if (!sim.moving && nearby(player) && cueHolders.includes(player.id) && (!owner || owner === player.id)) {
        owner = player.id;
        aim = { playerId: owner, angle: validAim(request) ? request.angle : 0, side: 0, top: 0 };
        lease = elapsed + 60;
        publish();
      }
    });
    app2.on("pool:release", (_, sender) => {
      if (authorized(sender)) {
        owner = aim = null;
        publish();
      }
    });
    app2.on("pool:ping", (_, sender) => {
      if (authorized(sender)) lease = elapsed + 60;
    });
    app2.on("pool:aim", (request, sender) => {
      if (!authorized(sender) || sim.moving || !validAim(request) || elapsed - lastAim < 0.05) return;
      lastAim = elapsed;
      aim = { playerId: owner, angle: request.angle, side: request.side ?? 0, top: request.top ?? 0 };
      app2.state.aim = aim;
      app2.send("pool:aim", aim);
    });
    for (const operation of ["shoot", "reset", "place"]) {
      app2.on(`pool:${operation}`, (request, sender) => {
        refreshCues();
        expire();
        if (!authorized(sender) || !request || request.seq !== seq) return;
        lease = elapsed + 60;
        let accepted = false;
        if (operation === "shoot") {
          accepted = sim.shoot(request);
          if (accepted) owner = aim = null;
        }
        if (operation === "place") accepted = sim.place(request.x, request.y);
        if (operation === "reset" && !sim.moving) {
          sim.reset();
          rack++;
          accepted = true;
        }
        if (accepted) publish();
      });
    }
    app2.on("update", (dt) => {
      if (!Number.isFinite(dt) || dt <= 0) return;
      elapsed += dt;
      expire();
      if (!sim.moving) {
        accumulator = 0;
        return;
      }
      accumulator = Math.min(accumulator + dt, 0.25);
      while (accumulator >= STEP && sim.moving) {
        sim.step();
        accumulator -= STEP;
      }
      sinceSnapshot += dt;
      if (sinceSnapshot >= 0.05 || !sim.moving) {
        sinceSnapshot = 0;
        publish();
      }
    });
    refreshCues();
    publish();
    return sim;
  }

  // hyperfy-billard/src/sound.js
  function createSounds(app2, sources) {
    const voices = [];
    let volume = 1;
    const play = (event, clock) => {
      const src = sources[event.type];
      if (!src) return;
      let voice = voices.find((v) => v.until <= clock);
      if (!voice && voices.length < 24) {
        const node = app2.create("audio", { group: "sfx", spatial: true, refDistance: 1, rolloffFactor: 1.5 });
        app2.add(node);
        voice = { node, until: 0 };
        voices.push(voice);
      }
      if (!voice) return;
      voice.node.active = false;
      voice.node.src = src;
      voice.node.position.set(event.position[0], BALL_RADIUS + event.position[2], -event.position[1]);
      const gain = event.type === "Cushion" ? 0.55 : event.type === "Pot" ? 0.7 : 1;
      voice.gain = gain * Math.min(1, Math.sqrt(event.strength / 5));
      voice.node.volume = voice.gain * volume;
      voice.node.active = true;
      voice.node.play();
      voice.until = clock + 0.5;
    };
    return {
      play,
      setVolume(value) {
        volume = Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 1;
        for (const voice of voices) voice.node.volume = voice.gain * volume;
      },
      update(clock) {
        for (const voice of voices) {
          if (voice.until && voice.until <= clock) {
            voice.node.stop();
            voice.until = 0;
          }
        }
      },
      clear() {
        for (const voice of voices) {
          voice.node.stop();
          voice.until = 0;
        }
      }
    };
  }

  // hyperfy-billard/src/aim.js
  var AIM_ELEVATION = Math.atan2(0.14, 0.68);
  function avatarStance(position, angle, size, floorY) {
    const forward = new V(Math.cos(angle), 0, -Math.sin(angle));
    const across = new V(Math.sin(angle), 0, Math.cos(angle));
    const origin = new V(position[0], floorY, -position[1]).addScaledVector(across, -0.32);
    const backward = forward.clone().negate();
    const halfX = size.length / 2 + 0.18 + 0.3;
    const halfZ = size.width / 2 + 0.18 + 0.3;
    const exitX = Math.abs(backward.x) < 1e-9 ? Infinity : (Math.sign(backward.x) * halfX - origin.x) / backward.x;
    const exitZ = Math.abs(backward.z) < 1e-9 ? Infinity : (Math.sign(backward.z) * halfZ - origin.z) / backward.z;
    const distance = Math.max(1.47 + BALL_RADIUS + 0.012 + 0.3, Math.min(exitX, exitZ) + 0.04);
    return {
      position: origin.addScaledVector(backward, distance),
      quaternion: new Q().setFromEuler(new E(0, angle - Math.PI / 2, 0, "YXZ")),
      distance
    };
  }
  function shotPose(position, angle, side = 0, top = 0, elevation = AIM_ELEVATION) {
    const ball = new V(position[0], BALL_RADIUS + position[2], -position[1]);
    const forward = new V(Math.cos(angle), 0, -Math.sin(angle));
    const across = new V(Math.sin(angle), 0, Math.cos(angle));
    const cameraPosition = ball.clone().addScaledVector(forward, -0.68);
    cameraPosition.y += Math.tan(elevation) * 0.68;
    const look = ball.clone().sub(cameraPosition);
    const cameraQuaternion = new Q().setFromEuler(new E(
      Math.atan2(look.y, Math.hypot(look.x, look.z)),
      Math.atan2(-look.x, -look.z),
      0,
      "YXZ"
    ));
    const cueDirection = forward.clone();
    cueDirection.y = -0.045;
    cueDirection.normalize();
    const contact = ball.clone().addScaledVector(across, side * BALL_RADIUS);
    contact.y += top * BALL_RADIUS;
    const gap = BALL_RADIUS * Math.sqrt(Math.max(0, 1 - side * side - top * top)) + 0.012;
    const cuePosition = contact.addScaledVector(cueDirection, -(0.735 + gap));
    const cueQuaternion = new Q().setFromUnitVectors(new V(0, 1, 0), cueDirection);
    return { cameraPosition, cameraQuaternion, cameraTarget: ball, cuePosition, cueQuaternion };
  }

  // hyperfy-billard/src/client.js
  function startClient(world2, app2, { balls, ghost, surfaceTarget, size, playChannel, soundSources }) {
    if (!world2.getPlayer) return;
    const me = world2.getPlayer();
    if (!me) {
      const ready = () => {
        if (!world2.getPlayer()) return;
        app2.off("update", ready);
        startClient(world2, app2, { balls, ghost, surfaceTarget, size, playChannel, soundSources });
      };
      app2.on("update", ready);
      return;
    }
    let latest = app2.state?.pool, frames = [], clock = 0, control = null, idle = null;
    let pending = false, requestedAt = 0, shotPending = false, shotRequestSeq = -1, ping = 0, sinceAim = 0;
    let angle = 0, speed = 2.5, side = 0, top = 0;
    let elevation = AIM_ELEVATION, floorY = 0, lastStanceAt = -1;
    let placeX = -size.length / 4, placeY = 0;
    let cueHolders = latest?.cueHolders || [], aim = app2.state?.aim, posedPlayer = null;
    const sounds = createSounds(app2, soundSources || {});
    const volumeEvent = `billard:volume:${playChannel}`;
    world2.on(volumeEvent, (value) => sounds.setVolume(value));
    app2.emit(`${volumeEvent}:request`);
    let soundEvents = [], lastEventId = latest?.lastEventId || 0;
    const cueEvent = CUE_EVENT;
    const aimingEvent = `billard:aiming:${playChannel}`;
    const poseEvent = POSE_EVENT;
    const hasCue = () => cueHolders.includes(me.id);
    const canPlay = () => hasCue() && !control && !pending && !shotPending && !latest?.moving && !latest?.owner;
    const ui = app2.create("ui", {
      space: "screen",
      width: 620,
      height: 92,
      position: [0.5, 1, 0],
      offset: [0, -24, 0],
      pivot: "bottom-center",
      backgroundColor: "#101b29",
      padding: 14,
      pointerEvents: false
    });
    const text = app2.create("uitext", { fontSize: 16, color: "#ffffff", value: "", textAlign: "center" });
    ui.add(text);
    ui.active = false;
    app2.add(ui);
    let playHintControl = null;
    let hintMode = null;
    let hoverRefreshPending = false;
    const hoveredTargets = /* @__PURE__ */ new Set();
    const clearPlayHint = () => {
      playHintControl?.setActions([]);
      playHintControl?.release();
      playHintControl = null;
      hintMode = null;
    };
    const refresh2 = () => {
      const waiting = hoveredTargets.size > 0 && (shotPending || latest?.moving) && me.position.distanceTo(app2.position) < 15;
      const mode = waiting ? "waiting" : canPlay() && hoveredTargets.size > 0 ? "play" : null;
      if (mode !== hintMode) {
        if (mode) {
          playHintControl ||= app2.control();
          playHintControl.setActions([mode === "waiting" ? { type: "hourglass", position: "pointer", opacity: 0.5 } : { type: "mouseLeft", label: "Play", position: "pointer", opacity: 0.5 }]);
          hintMode = mode;
        } else clearPlayHint();
      }
      app2.emit(aimingEvent, !!control);
    };
    for (const target of [surfaceTarget, ...balls]) {
      target.onPointerEnter = () => {
        hoveredTargets.add(target);
        hoverRefreshPending = false;
        refresh2();
      };
      target.onPointerLeave = () => {
        hoveredTargets.delete(target);
        hoverRefreshPending = true;
      };
    }
    const clearPose = () => {
      if (posedPlayer) app2.emit(poseEvent, { playerId: posedPlayer, tableId: app2.instanceId, clear: true });
      posedPlayer = null;
    };
    const stop = (release = true) => {
      const active = control;
      control = null;
      pending = false;
      clearPose();
      if (active) {
        active.camera.write = false;
        active.release();
      }
      if (release && active) app2.send("pool:release", {});
      idle?.release();
      idle = null;
      ui.active = ghost.active = false;
      refresh2();
    };
    const request = (operation, data = {}) => app2.send(`pool:${operation}`, { ...data, seq: latest?.seq });
    const placeCueBall = () => {
      if (!control || !latest || latest.moving || !latest.scratched || !hasCue()) return false;
      request("place", { x: placeX, y: placeY });
      return true;
    };
    const begin = () => {
      if (control || !pending || !hasCue() || latest?.moving) return;
      pending = false;
      side = top = 0;
      if (latest.scratched) {
        placeX = -size.length / 4;
        placeY = 0;
      }
      control = app2.control();
      idle = null;
      for (const key of ["keyW", "keyA", "keyS", "keyD", "arrowLeft", "arrowRight", "arrowUp", "arrowDown", "space", "keyR", "escape"])
        control[key].capture = true;
      control.camera.write = true;
      control.camera.zoom = 0;
      control.space.onPress = () => {
        if (!latest || latest.moving || !hasCue()) return;
        if (latest.scratched) placeCueBall();
        else {
          const ball = latest.balls[0].p;
          me.setCamera?.({ target: worldPosition(new V(ball[0], BALL_RADIUS + ball[2], -ball[1])), zoom: 0.3, duration: 0.45 });
          shotPending = true;
          shotRequestSeq = latest.seq;
          request("shoot", { angle, speed, side, top });
          stop();
        }
      };
      control.mouseLeft.onPress = placeCueBall;
      control.keyR.onPress = () => {
        if (!latest?.moving) request("reset");
      };
      control.escape.onPress = () => stop();
      ui.active = true;
      sinceAim = 1;
      elevation = AIM_ELEVATION;
      const local = me.position.clone().sub(app2.position).applyQuaternion(app2.quaternion.clone().invert());
      floorY = local.y < -0.35 ? local.y : -0.708;
      lastStanceAt = -1;
    };
    const receive = (snapshot) => {
      if (!snapshot || latest && snapshot.seq <= latest.seq) return;
      if (Object.hasOwn(snapshot, "aim")) aim = snapshot.aim;
      if (shotPending && snapshot.seq > shotRequestSeq) shotPending = false;
      if (latest && snapshot.scratched !== latest.scratched && !snapshot.moving) frames = [];
      if (latest && snapshot.rack !== latest.rack) {
        frames = [];
        soundEvents = [];
        sounds.clear();
      }
      if (!latest) lastEventId = snapshot.lastEventId || 0;
      for (const event of snapshot.events || []) {
        if (event.id > lastEventId) soundEvents.push(event);
      }
      lastEventId = Math.max(lastEventId, snapshot.lastEventId || 0);
      latest = snapshot;
      cueHolders = snapshot.cueHolders || [];
      frames.push({ at: clock, snapshot });
      frames = frames.slice(-8);
      if (latest.owner === me.id && !latest.moving && hasCue()) begin();
      else if (control) stop(false);
      if (!hasCue() || latest.moving || latest.owner && latest.owner !== me.id) pending = false;
      if (!latest.owner || latest.moving) clearPose();
      if (!pending && idle) {
        idle.release();
        idle = null;
      }
      refresh2();
    };
    app2.on("pool:snapshot", receive);
    app2.on("pool:aim", (next) => {
      aim = next;
    });
    watchCues(world2, (holders) => {
      cueHolders = holders;
      if (!hasCue() && control) stop();
      refresh2();
    });
    if (latest) frames = [{ at: clock, snapshot: latest }];
    const play = () => {
      if (!canPlay()) return;
      const local = me.position.clone().sub(app2.position).applyQuaternion(app2.quaternion.clone().invert());
      const ball = latest?.scratched ? [-size.length / 4, 0, 0] : latest?.balls[0]?.p || [-size.length / 4, 0, 0];
      angle = Math.atan2(ball[1] + local.z, ball[0] - local.x);
      pending = true;
      requestedAt = clock;
      idle = app2.control();
      idle.pointer.lock();
      app2.send("pool:claim", { angle });
      refresh2();
    };
    const playOrPlace = (event) => {
      if (event?.button !== "left") return;
      if (!placeCueBall()) play();
    };
    for (const target of [surfaceTarget, ...balls]) target.onPointerDown = playOrPlace;
    world2.on(`${aimingEvent}:request`, refresh2);
    refresh2();
    app2.emit(`${cueEvent}:request`);
    const axis = new V();
    const worldPosition = (local) => local.clone().multiply(app2.scale).applyQuaternion(app2.quaternion).add(app2.position);
    app2.on("update", (dt) => {
      if (!Number.isFinite(dt) || dt <= 0) return;
      clock += dt;
      if (hoverRefreshPending) {
        hoverRefreshPending = false;
        refresh2();
      }
      if (pending && clock - requestedAt > 2) stop(false);
      sounds.update(clock);
      const nearby = me.position.distanceTo(app2.position) < 15;
      for (const ball of balls) ball.active = nearby;
      if (!nearby) {
        if (control) stop();
        clearPose();
        sounds.clear();
        soundEvents = [];
      }
      const renderAt = clock - 0.1;
      while (frames.length > 1 && frames[1].at <= renderAt) frames.shift();
      const a = frames[0], b = frames[1] || a;
      if (a) {
        const alpha = a === b ? 1 : Math.max(0, Math.min(1, (renderAt - a.at) / (b.at - a.at || 1)));
        const displayedTime = a.snapshot.time + (b.snapshot.time - a.snapshot.time) * alpha;
        const futureEvents = [];
        for (const event of soundEvents) {
          if (event.time > displayedTime) futureEvents.push(event);
          else if (nearby && displayedTime - event.time <= 0.12) sounds.play(event, clock);
        }
        soundEvents = futureEvents;
        a.snapshot.balls.forEach((state, i) => {
          const next = b.snapshot.balls[i];
          const p = state.p.map((v, j) => v + (next.p[j] - v) * alpha);
          balls[i].active = nearby && state.state !== "InPocket";
          balls[i].position.set(p[0], BALL_RADIUS + p[2], -p[1]);
          axis.set(state.w[0], state.w[2], -state.w[1]);
          const rotationSpeed = axis.length();
          if (rotationSpeed > 0) balls[i].quaternion.premultiply(
            new Q().setFromAxisAngle(axis.multiplyScalar(1 / rotationSpeed), rotationSpeed * Math.min(dt, 0.1))
          );
        });
      }
      if (!nearby) return;
      if (control && (me.position.distanceTo(app2.position) > 5 || !hasCue())) stop();
      if (control) {
        ping += dt;
        if (ping > 15) {
          ping = 0;
          app2.send("pool:ping", {});
        }
        const horizontal = Number(control.arrowRight.down) - Number(control.arrowLeft.down);
        const vertical = Number(control.arrowUp.down) - Number(control.arrowDown.down);
        const pointer = control.pointer.delta;
        const turn = horizontal * dt + pointer.x * 3e-3;
        angle = Math.atan2(Math.sin(angle - turn), Math.cos(angle - turn));
        elevation = Math.max(0.08, Math.min(0.75, elevation + pointer.y * 3e-3));
        if (latest?.scratched) {
          const forward = Number(control.keyW.down) - Number(control.keyS.down);
          const right = Number(control.keyD.down) - Number(control.keyA.down);
          const distance = dt * 0.5 / Math.max(1, Math.hypot(forward, right));
          placeX = Math.max(-size.length / 2 + 2 * BALL_RADIUS, Math.min(
            size.length / 2 - 2 * BALL_RADIUS,
            placeX + (Math.cos(angle) * forward + Math.sin(angle) * right) * distance
          ));
          placeY = Math.max(-size.width / 2 + 2 * BALL_RADIUS, Math.min(
            size.width / 2 - 2 * BALL_RADIUS,
            placeY + (Math.sin(angle) * forward - Math.cos(angle) * right) * distance
          ));
          balls[0].active = true;
          balls[0].position.set(placeX, BALL_RADIUS, -placeY);
        } else {
          speed = Math.max(0.1, Math.min(5, speed + vertical * dt));
          side += (Number(control.keyD.down) - Number(control.keyA.down)) * dt * 0.3;
          top += (Number(control.keyW.down) - Number(control.keyS.down)) * dt * 0.3;
          const spin = Math.hypot(side, top);
          if (spin > 0.45) {
            side *= 0.45 / spin;
            top *= 0.45 / spin;
          }
        }
        const ball = latest?.scratched ? [placeX, placeY, 0] : latest?.balls[0]?.p;
        if (ball) {
          const pose = shotPose(ball, angle, side, top, elevation);
          control.camera.position.copy(worldPosition(pose.cameraPosition));
          control.camera.quaternion.copy(app2.quaternion).multiply(pose.cameraQuaternion);
          if (clock - lastStanceAt >= 0.05) {
            const stance = avatarStance(ball, angle, size, floorY);
            const position = worldPosition(stance.position);
            const quaternion = app2.quaternion.clone().multiply(stance.quaternion);
            if (me.position.distanceTo(position) > 0.025 || me.quaternion.angleTo(quaternion) > 0.02)
              me.teleport(position, new E().setFromQuaternion(quaternion, "YXZ").y);
            lastStanceAt = clock;
          }
        }
        sinceAim += dt;
        if (sinceAim >= 0.1) {
          sinceAim = 0;
          app2.send("pool:aim", { angle, side, top });
        }
        ghost.active = false;
        text.value = latest?.error || (latest?.scratched ? "Scratch \xB7 Mouse / \u2190 \u2192: orbit \xB7 WASD: move white ball\nClick / Space: confirm \xB7 R: re-rack \xB7 Esc: leave" : `Mouse: orbit / aim \xB7 \u2191 \u2193 Power ${speed.toFixed(1)} m/s \xB7 W/S Top ${top.toFixed(2)} \xB7 A/D Side ${side.toFixed(2)}
Space: shoot \xB7 Esc: leave \xB7 X: return cue`);
      }
      const shooter = latest?.owner;
      const aiming = shooter && !latest.moving && !latest.scratched && (shooter === me.id ? !!control : aim?.playerId === shooter);
      if (aiming && latest.balls[0]) {
        const params = shooter === me.id ? { angle, side, top } : aim;
        const pose = shotPose(latest.balls[0].p, params.angle, params.side, params.top);
        if (posedPlayer && posedPlayer !== shooter) clearPose();
        posedPlayer = shooter;
        app2.emit(poseEvent, {
          playerId: shooter,
          tableId: app2.instanceId,
          position: worldPosition(pose.cuePosition).toArray(),
          quaternion: app2.quaternion.clone().multiply(pose.cueQuaternion).toArray()
        });
      } else clearPose();
    });
    app2.on("destroy", () => {
      stop();
      clearPlayHint();
    });
  }

  // hyperfy-billard/src/app.js
  app.configure?.([
    {
      key: "tableSize",
      type: "switch",
      label: "WPA playing surface",
      options: [
        { label: "9 ft (2.54 \xD7 1.27 m)", value: "9" },
        { label: "8 ft (2.3368 \xD7 1.1684 m)", value: "8" }
      ],
      initial: "9"
    },
    ...[["Hit", "Cue strike"], ["Collision", "Ball collision"], ["Cushion", "Cushion hit"], ["Pot", "Pocket drop"]].map(([type, label]) => ({ key: `sound${type}`, type: "file", kind: "audio", label: `${label} sound` })),
    { key: "showSurface", type: "toggle", label: "Show practice surface", initial: true },
    { key: "playChannel", type: "text", label: "Table and cue rack channel", initial: "classic-8-ft-pool-table" }
  ]);
  var preset = props.tableSize === "8" ? "8" : "9";
  if (world.isServer) {
    startServer(world, app, preset);
  } else {
    const size = dimensions(preset);
    const { length: L, width: W } = size;
    const prim = (type, size2, position, color, extra = {}) => {
      const node = app.create("prim", { type, size: size2, position, color, physics: null, roughness: 0.5, ...extra });
      app.add(node);
      return node;
    };
    if (props.showSurface !== false) {
      prim("box", [L + 0.24, 0.05, W + 0.24], [0, -0.065, 0], "#142730");
      prim("box", [L, 0.015, W], [0, -75e-4, 0], "#16746a");
      const inset = BALL_RADIUS * 3.2, mid = BALL_RADIUS * 2.77;
      const segment = (a, b, z) => prim("box", [b - a, 0.035, 0.05], [(a + b) / 2, 0.0175, z], "#0c4845");
      for (const s of [-1, 1]) {
        segment(-L / 2 + inset, -mid, s * (W / 2 + 0.025));
        segment(mid, L / 2 - inset, s * (W / 2 + 0.025));
        prim("box", [0.05, 0.035, W - 2 * inset], [s * (L / 2 + 0.025), 0.0175, 0], "#0c4845");
        for (const x of [-L / 2, 0, L / 2]) {
          prim(
            "cylinder",
            [x === 0 ? BALL_RADIUS * 1.8 : BALL_RADIUS * 2.2, x === 0 ? BALL_RADIUS * 1.8 : BALL_RADIUS * 2.2, 6e-3],
            [x === 0 ? 0 : x + Math.sign(x) * 0.6 * BALL_RADIUS, 3e-3, s * (W / 2 + (x === 0 ? 2 : 0.6) * BALL_RADIUS)],
            "#070e15"
          );
        }
      }
      for (let i = -3; i <= 3; i++) {
        if (!i) continue;
        for (const s of [-1, 1]) prim("sphere", [4e-3], [i * L / 8, 0.04, s * (W / 2 + 0.03)], "#c5d3c4");
      }
    }
    const positions = rackPositions(preset);
    const balls = positions.map((p, id) => {
      const group = app.create("group", { position: [p[0], BALL_RADIUS + p[2], -p[1]] });
      app.add(group);
      const sphere = app.create("prim", {
        type: "sphere",
        size: [BALL_RADIUS],
        color: "#ffffff",
        texture: props[`ball${id}`]?.url || define_BILLARD_TEXTURES_default[id] || null,
        physics: null,
        roughness: 0.18
      });
      group.add(sphere);
      return group;
    });
    const surfaceTarget = prim("box", [L, 4e-3, W], [0, 0.012, 0], "#000000", {
      opacity: 0,
      castShadow: false,
      receiveShadow: false
    });
    const ghost = prim("sphere", [BALL_RADIUS], [-L / 4, BALL_RADIUS, 0], "#ffffff", { opacity: 0.4 });
    ghost.active = false;
    if (!world.isPreview)
      startClient(world, app, {
        soundSources: Object.fromEntries(["Hit", "Collision", "Cushion", "Pot"].map((type) => [type, props[`sound${type}`]?.url || define_BILLARD_SOUNDS_default[type]])),
        balls,
        ghost,
        surfaceTarget,
        size,
        playChannel: props.playChannel || "classic-8-ft-pool-table"
      });
  }
})();
