const fetch = require("node-fetch");
const axios = require("axios");
const { stringify } = require("querystring");

const DEFAULT_OPTIONS = {
  apiRoot: "https://api.vk.com/method",
  apiMode: "bot",
  webhookReply: false,
};

function replacer(value) {
  if (value == null) return undefined;
  return value;
}

async function fetchReq() {
  return await fetch(apiUrl, {
    method: "post",
    body: stringify({
      v: 5.103,
      access_token: this.token,
    }),
    headers: {
      // Accept: "application/json, text/plain, */*",
      "Content-Type": "application/x-www-form-urlencoded",
      // "Content-Length": 106,
    },
  }).catch((err) => console.log(err));
}

module.exports = class ApiClient {
  constructor(token, options) {
    this.token = token;
    this.options = {
      ...DEFAULT_OPTIONS,
    };
  }

  async callApi(method, payload, { signal } = {}) {
    const { token, options, response } = this;
    // if (options.webhookReply && response?.writableEnded === false) {
    //   // answer to webhook
    // }
    if (!token) {
      throw new Error("Bot Token is required");
    }
    const apiUrl = `${options.apiRoot}/${method}`;
    const { data, statusText } = await axios
      .post(
        apiUrl,
        stringify({
          v: 5.103,
          access_token: this.token,
          signal: signal,
          ...payload,
        })
      )
      .catch((err) => console.log(err));
    if (statusText !== "OK") {
      console.log(data, { method, payload });
      // throw new Error(data, { method, payload });
    }
    return data;
  }
};
