const Vk = require("./vk");
const Polling = require("./core/network/polling");
const Context = require("./Context");
const pTimeout = require("p-timeout");
const Composer = require("./Composer");

function always(x) {
  return () => x;
}
const anoop = always(Promise.resolve());

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
const DEFAULT_OPTIONS = {
  VkApi: {},
  handlerTimeout: 90_000,
  contextType: Context,
};
module.exports = class NodeVkApi extends Composer {
  context = {};
  constructor(token) {
    super();
    this.options = {
      ...DEFAULT_OPTIONS,
    };

    this.VkApi = new Vk(token, this.options.VkApi);
  }
  handleError = (err, ctx) => {
    // set exit code to emulate `warn-with-error-code` behavior of
    // https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode
    // to prevent a clean exit despite an error being thrown
    process.exitCode = 1;
    console.error("Unhandled error while processing", ctx.update);
    throw err;
  };

  startPolling(allowedUpdates = []) {
    this.polling = new Polling(this.VkApi, allowedUpdates);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.polling.loop(async (updates) => {
      await this.handleUpdates(updates);
    });
  }
  async handleUpdates(updates, webhookResponse) {
    return Promise.all(
      updates.map((update) => {
        this.handleUpdate(update);
      })
    );
  }
  async handleUpdate(update, webhookResponse) {
    // const tg = new Vk(this.token, this.VkApi.options, webhookResponse);
    const VkContext = this.options.contextType;
    const ctx = new VkContext(update, this.VkApi, this.ServerToUpload);
    Object.assign(ctx, this.context);
    // console.log("context", ctx);
    try {
      await pTimeout(
        Promise.resolve(this.middleware()(ctx, anoop)), // (ctx, next)
        this.options.handlerTimeout
      );
    } catch (err) {
      return this.handleError(err, ctx);
    } finally {
      if (webhookResponse?.writableEnded === false) {
        webhookResponse.end();
      }
    }
  }
};
