const BaseScene = require("../base");
const WizardContextWizard = require("./context");
const Composer = require("../../composer");
module.exports = class WizardScene extends BaseScene {
  constructor(id, options, ...steps) {
    let opts;
    let s;
    if (typeof options === "function" || "middleware" in options) {
      opts = undefined;
      s = [options, ...steps];
    } else {
      opts = options;
      s = steps;
    }
    super(id, opts);
    this.steps = s;
  }
  middleware() {
    return Composer.compose([
      (ctx, next) => {
        ctx.wizard = new WizardContextWizard(ctx, this.steps);
        return next();
      },
      super.middleware(),
      (ctx, next) => {
        if (ctx.wizard.step === undefined) {
          ctx.wizard.selectStep(0);
          return ctx.scene.leave();
        }
        return Composer.unwrap(ctx.wizard.step)(ctx, next);
      },
    ]);
  }
  enterMiddleware() {
    return Composer.compose([this.enterHandler, this.middleware()]);
  }
};
