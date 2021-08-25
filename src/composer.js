function always(x) {
  return () => x;
}
const anoop = always(Promise.resolve());
module.exports = class Composer {
  constructor(...fns) {
    this.handler = Composer.compose(fns);
  }

  action(triggers, ...fns) {
    return this.use(Composer.action(triggers, ...fns));
  }
  on(updateType, ...fns) {
    return this.use(Composer.mount(updateType, ...fns));
  }
  use(...fns) {
    this.handler = Composer.compose([this.handler, ...fns]);
    return this;
  }

  hears(triggers, ...fns) {
    return this.use(Composer.hears(triggers, ...fns));
  }
  middleware() {
    return this.handler;
  }
  static action(triggers, ...fns) {
    // console.log(
    //   `static action ${Composer.match(normalizeTriggers(triggers), ...fns)}`
    // );
    return Composer.mount(
      "message_event",
      Composer.match(normalizeTriggers(triggers), ...fns)
    );
  }
  static reply(...args) {
    return (ctx) => ctx.reply(...args);
  }
  static unwrap(handler) {
    if (!handler) {
      throw new Error("Handler is undefined");
    }
    return "middleware" in handler ? handler.middleware() : handler;
  }
  static hears(triggers, ...fns) {
    // console.log(
    //   `static hears ${Composer.match(normalizeTriggers(triggers), ...fns)}`
    // );
    return Composer.mount(
      "message_new",
      Composer.match(normalizeTriggers(triggers), ...fns)
    );
  }
  static match(triggers, ...fns) {
    //получает в триггерах функцию(value) => regex.exec(value)
    // а в fns функцию, которую я записал в мидлваре
    const handler = Composer.compose(fns);
    // console.log(`handler---------------${triggers}--${handler}`);
    return (ctx, next) => {
      const text = getText(ctx.update);
      // console.log(text);
      if (text === undefined) return next();
      for (const trigger of triggers) {
        // console.log(`handlers---------------${trigger}--${triggers}`);
        // @ts-expect-error
        const match = trigger(text, ctx);
        if (match) {
          // @ts-expect-error define so far unknown property `match`
          return handler(Object.assign(ctx, { match }), next);
        }
      }
      return next();
    };
  }
  static mount(updateType, ...fns) {
    return Composer.on(updateType, ...fns);
  }
  static on(updateType, ...fns) {
    const updateTypes = normalizeTextArguments(updateType);
    console.log(`update types: ${updateTypes}`);
    const predicate = (update) => {
      return updateTypes.some((type) => {
        return update?.type === type;
      });
    };
    return Composer.guard(predicate, ...fns);
  }
  static guard(guardFn, ...fns) {
    return Composer.optional(
      (ctx) => guardFn(ctx.update),
      // @ts-expect-error see explanation above
      ...fns
    );
  }
  static optional(predicate, ...fns) {
    //  (ctx, next) =>
    //       Promise.resolve(factoryFn(ctx)).then((middleware) => {
    //         console.log(`middleware FN${middleware}`);
    //         return Composer.unwrap(middleware)(ctx, next);
    //       });
    return Composer.branch(
      predicate,
      Composer.compose(fns),
      Composer.passThru()
    );
  }
  static branch(predicate, trueMiddleware, falseMiddleware) {
    if (typeof predicate !== "function") {
      return Composer.unwrap(predicate ? trueMiddleware : falseMiddleware);
    }
    return Composer.lazy((ctx) =>
      Promise.resolve(predicate(ctx)).then((value) => {
        return value ? trueMiddleware : falseMiddleware;
      })
    );
  }
  static passThru() {
    return (ctx, next) => next();
  }

  static lazy(factoryFn) {
    if (typeof factoryFn !== "function") {
      throw new Error("Argument must be a function");
    }
    return (ctx, next) =>
      Promise.resolve(factoryFn(ctx)).then((middleware) => {
        return Composer.unwrap(middleware)(ctx, next);
      });
  }
  static compose(middlewares) {
    if (!Array.isArray(middlewares)) {
      throw new Error("Middlewares must be an array");
    }
    if (middlewares.length === 0) {
      return Composer.passThru();
    }
    if (middlewares.length === 1) {
      return Composer.unwrap(middlewares[0]);
    }
    // console.log(`execute---------${middlewares}`);
    return (ctx, next) => {
      let index = -1;

      return execute(0, ctx);
      async function execute(i, context) {
        if (i <= index) {
          throw new Error("next() called multiple times");
        }
        index = i;
        // console.log(`compose ${middlewares[i]} ,${next} `);
        const handler = Composer.unwrap(middlewares[i] ?? next);
        // console.log(`compose handler ${handler}`);
        await handler(context, async (ctx = context) => {
          await execute(i + 1, ctx);
        });
        // console.log(`execute----------------------end`);
      }
    };
  }
};
//  (ctx, next) =>
//       Promise.resolve(factoryFn(ctx)).then((middleware) => {
//         console.log(`middleware FN${middleware}`);
//         return Composer.unwrap(middleware)(ctx, next);
//       });
function escapeRegExp(s) {
  // $& means the whole matched string
  return s.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
}
function normalizeTriggers(triggers) {
  if (!Array.isArray(triggers)) {
    triggers = [triggers];
  }
  return triggers.map((trigger) => {
    if (!trigger) {
      throw new Error("Invalid trigger");
    }
    if (typeof trigger === "function") {
      return trigger;
    }
    if (trigger instanceof RegExp) {
      return (value = "") => {
        trigger.lastIndex = 0;
        return trigger.exec(value);
      };
    }
    const regex = new RegExp(`^${escapeRegExp(trigger)}$`);
    return (value) => regex.exec(value);
  });
}
function normalizeTextArguments(argument, prefix = "") {
  const args = Array.isArray(argument) ? argument : [argument];
  // prettier-ignore
  return args
      .filter(Boolean)
      .map((arg) => prefix && typeof arg === 'string' && !arg.startsWith(prefix) ? `${prefix}${arg}` : arg)
}
function getText(update) {
  if (update == null) return undefined;
  if (update.type === "message_new") return update.object.body;
  if (update.type === "message_event") return update.object.payload.data;
  if ("caption" in update) return update.caption;
  if ("text" in update) return update.text;
  if ("data" in update) return update.data;
  if ("game_short_name" in update) return update.game_short_name;
  return undefined;
}
