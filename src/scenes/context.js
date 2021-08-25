const Composer = require("../composer");

const noop = () => Promise.resolve();
const now = () => Math.floor(Date.now() / 1000);

module.exports = class SceneContextScene {
  constructor(ctx, scenes, options) {
    this.ctx = ctx;
    this.scenes = scenes;
    this.leaving = false;
    // @ts-expect-error {} might not be assignable to D
    const fallbackSessionDefault = {};
    this.options = { defaultSession: fallbackSessionDefault, ...options };
  }
  get session() {
    const defaultSession = this.options.defaultSession;
    let session = this.ctx.session?.__scenes ?? defaultSession;
    if (session.expires !== undefined && session.expires < now()) {
      session = defaultSession;
    }
    if (this.ctx.session === undefined) {
      this.ctx.session = { __scenes: session };
    } else {
      this.ctx.session.__scenes = session;
    }
    return session;
  }
  get state() {
    var _a;
    var _b;
    return (_a = (_b = this.session).state) !== null && _a !== void 0
      ? _a
      : (_b.state = {});
  }
  set state(value) {
    this.session.state = { ...value };
  }
  get current() {
    const sceneId = this.session.current ?? this.options.default;
    return sceneId === undefined || !this.scenes.has(sceneId)
      ? undefined
      : this.scenes.get(sceneId);
  }
  reset() {
    if (this.ctx.session !== undefined)
      this.ctx.session.__scenes = this.options.defaultSession;
  }
  async enter(sceneId, initialState = {}, silent = false) {
    var _a, _b;
    if (!this.scenes.has(sceneId)) {
      throw new Error(`Can't find scene: ${sceneId}`);
    }
    if (!silent) {
      await this.leave();
    }
    this.session.current = sceneId;
    this.state = initialState;
    const ttl = this.current?.ttl ?? this.options.ttl;
    if (ttl !== undefined) {
      this.session.expires = now() + ttl;
    }
    if (this.current === undefined || silent) {
      return;
    }
    const handler =
      "enterMiddleware" in this.current &&
      typeof this.current.enterMiddleware === "function"
        ? this.current.enterMiddleware()
        : this.current.middleware();
    return await handler(this.ctx, noop);
  }
  reenter() {
    return this.session.current === undefined
      ? undefined
      : this.enter(this.session.current, this.state);
  }
  async leave() {
    if (this.leaving) return;
    try {
      this.leaving = true;
      if (this.current === undefined) {
        return;
      }
      const handler =
        "leaveMiddleware" in this.current &&
        typeof this.current.leaveMiddleware === "function"
          ? this.current.leaveMiddleware()
          : Composer.passThru();
      await handler(this.ctx, noop);
      return this.reset();
    } finally {
      this.leaving = false;
    }
  }
};
