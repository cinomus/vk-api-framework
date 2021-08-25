function session(options) {
  const getSessionKey = options?.getSessionKey ?? defaultGetSessionKey;
  const store = options?.store ?? new MemorySessionStore();
  return async (ctx, next) => {
    const key = await getSessionKey(ctx);
    if (key == null) {
      return await next();
    }
    ctx.session = await store.get(key);
    await next();
    if (ctx.session == null) {
      await store.delete(key);
    } else {
      await store.set(key, ctx.session);
    }
  };
}
async function defaultGetSessionKey(ctx) {
  const fromId = ctx.update?.object.user_id;
  const chatId = ctx.update?.group_id;
  if (fromId == null || chatId == null) {
    return undefined;
  }
  return `${fromId}:${chatId}`;
}
class MemorySessionStore {
  store = new Map();

  constructor(ttl = Infinity) {}

  get(name) {
    const entry = this.store.get(name);
    if (entry == null) {
      return undefined;
    } else if (entry.expires < Date.now()) {
      this.delete(name);
      return undefined;
    }
    return entry.session;
  }

  set(name, value) {
    const now = Date.now();
    this.store.set(name, { session: value, expires: now + this.ttl });
  }

  delete(name) {
    this.store.delete(name);
  }
}
function isSessionContext(ctx) {
  return "session" in ctx;
}
module.exports = { session, MemorySessionStore, isSessionContext };
