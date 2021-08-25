const { isSessionContext } = require("../session");
// const SceneContextScene = require("./context");
const SceneContextScene = require("./context");
const BaseScene = require("./base");
const Composer = require("../composer");
const Context = require("../context");
module.exports = class Stage extends Composer {
  options;
  scenes;

  constructor(scenes, options) {
    super();
    this.options = { ...options };
    this.scenes = new Map();
    scenes.forEach((scene) => this.register(scene));
  }

  register(...scenes) {
    scenes.forEach((scene) => {
      if (scene?.id == null || typeof scene.middleware !== "function") {
        throw new Error("telegraf: Unsupported scene");
      }
      this.scenes.set(scene.id, scene);
    });
    return this;
  }

  middleware() {
    const handler = Composer.compose([
      (ctx, next) => {
        const scenes = this.scenes;
        ctx.scene = new SceneContextScene(ctx, scenes, this.options);
        return next();
      },
      super.middleware(),
      Composer.lazy((ctx) => ctx.scene.current ?? Composer.passThru()),
    ]);
    return Composer.optional(isSessionContext, handler);
  }

  static enter(...args) {
    return (ctx) => ctx.scene.enter(...args);
  }

  static reenter(...args) {
    return (ctx) => ctx.scene.reenter(...args);
  }

  static leave(...args) {
    return (ctx) => ctx.scene.leave(...args);
  }
};
