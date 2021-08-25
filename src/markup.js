const button = require("./Button");
class Markup {
  constructor(keyboard) {
    this.keyboard = keyboard;
  }
  oneTime(value = true) {
    return new Markup(
      JSON.stringify({
        ...JSON.parse(this.keyboard),
        one_time: value,
      })
    );
  }
}
function keyboard(buttons, options) {
  const keyboard = buildKeyboard(buttons, {
    columns: 1,
    ...options,
  });
  return new Markup(JSON.stringify({ buttons: keyboard }));
}
function inlineKeyboard(buttons, options) {
  const inlineKeyboard = buildKeyboard(buttons, {
    columns: buttons.length,
    ...options,
  });
  return new Markup(JSON.stringify({ buttons: inlineKeyboard, inline: true }));
}
function buildKeyboard(buttons, options) {
  const result = [];
  if (!Array.isArray(buttons)) {
    return result;
  }
  if (is2D(buttons)) {
    return buttons.map((row) => row.filter((button) => !button.hide));
  }
  const wrapFn =
    options.wrap !== undefined
      ? options.wrap
      : (_btn, _index, currentRow) => currentRow.length >= options.columns;
  let currentRow = [];
  let index = 0;
  for (const btn of buttons.filter((button) => !button.hide)) {
    if (wrapFn(btn, index, currentRow) && currentRow.length > 0) {
      result.push(currentRow);
      currentRow = [];
    }
    currentRow.push(btn);
    index++;
  }
  if (currentRow.length > 0) {
    result.push(currentRow);
  }
  return result;
}
function is2D(arr) {
  return Array.isArray(arr[0]);
}
module.exports = { keyboard, button, inlineKeyboard };
