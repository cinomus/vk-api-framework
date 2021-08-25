const { promisify } = require("util");
const Vk = require("../../vk");
const wait = promisify(setTimeout);

function always(x) {
  return () => x;
}
const noop = always(Promise.resolve());

module.exports = class Polling {
  skipOffsetSync = false;
  constructor(VkApi, allowedUpdates) {
    this.VkApi = VkApi;
    this.allowedUpdates = allowedUpdates;
  }
  async *[Symbol.asyncIterator]() {
    do {
      try {
        if (!this.ts && !this.server && !this.secretKey) {
          const { key, server, ts } =
            await this.VkApi.groups_getLongPollServer();
          this.ts = ts;
          this.key = key;
          this.server = server;
        }

        const response = await this.VkApi.getUpdates(
          this.server,
          this.ts,
          this.key
        );
        console.log("response", response);
        const { ts, updates, failed } = response;
        this.ts = ts;
        if (!failed) {
          yield updates;
        } else throw new Error("LongPollError");
      } catch (err) {
        if (err.message === "LongPollError") {
          const { key, server, ts } =
            await this.VkApi.groups_getLongPollServer();
          this.ts = ts;
          this.key = key;
          this.server = server;
        }
      }
    } while (true);
  }

  async syncUpdateOffset() {
    if (this.skipOffsetSync) return;
    const { ts, updates } = await this.VkApi.getUpdates(
      this.server,
      this.ts,
      this.key
    );
    this.ts = ts;
  }

  async loop(handleUpdates) {
    try {
      for await (const updates of this) {
        await handleUpdates(updates);
      }
    } finally {
      // prevent instance reuse
      this.stop();
      await this.syncUpdateOffset().catch(noop);
    }
  }
  stop() {
    console.log("stop");
  }
};
