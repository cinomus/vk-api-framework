const axios = require("axios");
const { stringify } = require("querystring");

const ApiClient = require("./core/network/client");
const { uploadFile } = require("./core/helpers/upload_files");

module.exports = class Vk extends ApiClient {
  async account_ban(id) {
    return await this.callApi("account.ban", { owner_id: id });
  }
  async photos_getMessagesUploadServer(group_id) {
    const res = await this.callApi("photos.getMessagesUploadServer", {
      group_id: group_id,
    });
    return res.response;
  }
  async photos_saveMessagesPhoto(params) {
    return await this.callApi("photos.saveMessagesPhoto", params);
  }

  async messages_send(peer_ids, message, extra) {
    const random_id = Date.now();
    return await this.callApi("messages.send", {
      peer_ids: peer_ids,
      random_id: random_id,
      message: message,
      ...extra,
    });
  }
  async messages_sendMessageEventAnswer(
    event_id,
    user_id,
    peer_id,
    event_data = {}
  ) {
    return await this.callApi("messages.sendMessageEventAnswer", {
      event_id,
      user_id,
      peer_id,
      event_data: JSON.stringify(event_data),
    });
  }
  async messages_sendPhoto(peer_ids, message, attachment, extra) {
    const random_id = Date.now();
    return await this.callApi("messages.send", {
      peer_ids: peer_ids,
      random_id: random_id,
      message: message,
      attachment: attachment,
      ...extra,
    });
  }
  async groups_getById() {
    return await this.callApi("groups.getById");
  }
  async groups_getLongPollServer() {
    let result = await this.groups_getById();
    const group_id = result.response[0].id;
    const { response } = await this.callApi("groups.getLongPollServer", {
      group_id: group_id,
    });
    return response;
  }
  async getUpdates(server, ts, key, signal) {
    const { data } = await axios.get(server, {
      params: {
        key,
        ts,
        act: "a_check",
        wait: 25,
        signal: signal,
      },
    });
    return data;
  }
  async getUpdates2(server, ts, key, signal) {
    let res = await fetch(server, {
      method: "get",
      signal: signal,
      body: stringify({
        ts,
        key,
      }),
      headers: {
        // Accept: "application/json, text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        // "Content-Length": 106,
      },
    }).catch((err) => console.log(err));
  }
};
