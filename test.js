const { Scenes, vkFramework, Composer, Markup, session } = require("./src/");
const bot = new vkFramework(
  "2f8d7bf180e8102b9e2db5b8022462dd0e9a03cf3e1b34354ae7f5d31f50ee6ed41be3d93722502f93677"
);
// bot.hears("Search", (ctx) => ctx.reply("Yay!"));
// bot.hears("Search2", (ctx) => {
//   // console.log(ctx);
//   return ctx.reply("Yay!");
// });
const { enter, leave } = Scenes.Stage;

const stepHandler = new Composer();
stepHandler.action("next", async (ctx) => {
  await ctx.reply("Step 2. Via inline button");
  return ctx.wizard.next();
});
stepHandler.hears("Next", async (ctx) => {
  await ctx.reply("Step 2. Via command");
  return ctx.wizard.next();
});
stepHandler.use((ctx) => ctx.reply("Press `Next` button or type /next"));
const wizard = new Scenes.WizardScene(
  "wizard",
  async (ctx) => {
    await ctx.reply(
      "Step 1",
      Markup.inlineKeyboard([
        Markup.button.url("❤️", "http://telegraf.js.org"),
        Markup.button.callback("➡️ Next", "next"),
      ])
    );
    return ctx.wizard.next();
  },
  stepHandler,
  async (ctx) => {
    await ctx.reply("Step 3");
    return ctx.wizard.next();
  },
  async (ctx) => {
    await ctx.reply("Step 4");
    return ctx.wizard.next();
  },
  async (ctx) => {
    await ctx.reply("Done");
    return await ctx.scene.leave();
  }
);

const echoScene = new Scenes.BaseScene("echo");
echoScene.enter((ctx) => ctx.reply("echo scene"));
echoScene.leave((ctx) => ctx.reply("exiting echo scene"));
echoScene.hears("back", leave());
echoScene.on("message_new", (ctx) => ctx.reply(ctx.update.object.body));
const stage = new Scenes.Stage([wizard, echoScene]);
bot.use(session());
bot.use(stage.middleware());

bot.hears("echo", (ctx) => ctx.scene.enter("echo"));
bot.hears("Test", async (ctx) => {
  console.log(ctx);
  return ctx.reply(
    "random example",
    Markup.inlineKeyboard([Markup.button.callback("rer", "rer")])
  );
});
bot.action("rer", (ctx) => {
  console.log(ctx);
  ctx.reply("echo action");
});
bot.hears("rer", (ctx) => ctx.reply("echo hears"));

bot.hears("wizard", (ctx) => ctx.scene.enter("wizard"));
bot.hears("random", (ctx) => {
  return ctx.reply(
    "random example",
    Markup.inlineKeyboard([
      Markup.button.callback("Coke", "Coke"),
      Markup.button.callback("Dr Pepper", "Dr Pepper"),
      Markup.button.callback("Pepsi", "Pepsi"),
    ])
  );
});
bot.action("Dr Pepper", async (ctx, next) => {
  console.log(await ctx.answerCallbackQuery("kekw"));
  return ctx.reply("👍");
});
bot.action("Coke", async (ctx, next) => {
  console.log(await ctx.answerCallbackQuery("Coke"));
  return ctx.reply("Coke👍");
});

bot.startPolling();
