const Composer = require("../Composer");

const { compose } = Composer;
module.exports = class BaseScene extends Composer {
  id;
  ttl;
  enterHandler;
  leaveHandler;
  constructor(id, options) {
    const opts = {
      handlers: [],
      enterHandlers: [],
      leaveHandlers: [],
      ...options,
    };
    super(...opts.handlers);
    this.id = id;
    this.ttl = opts.ttl;
    this.enterHandler = compose(opts.enterHandlers);
    this.leaveHandler = compose(opts.leaveHandlers);
  }

  enter(...fns) {
    this.enterHandler = compose([this.enterHandler, ...fns]);
    return this;
  }

  leave(...fns) {
    this.leaveHandler = compose([this.leaveHandler, ...fns]);
    return this;
  }

  enterMiddleware() {
    return this.enterHandler;
  }

  leaveMiddleware() {
    return this.leaveHandler;
  }
};
