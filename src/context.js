const { uploadFile, createAttachment } = require("./core/helpers/upload_files");
module.exports = class Context {
  state = {};
  constructor(update, VkApi, ServerToUpload) {
    this.update = update;
    this.VkApi = VkApi;
    this.ServerToUpload = ServerToUpload;
  }
  get VkA() {
    return this.VkApi;
  }
  answerCallbackQuery(arg) {
    if (typeof arg === "string") {
      {
        arg = {
          type: "show_snackbar",
          text: arg,
        };
      }
    }
    return this.VkApi.messages_sendMessageEventAnswer(
      this.update.object.event_id,
      this.update.object.user_id,
      this.update.object.peer_id,
      arg
    );
  }
  reply(...args) {
    return this.VkApi.messages_send(this.update.object.user_id, ...args);
  }

  replyWithPhoto(text, photos, extra) {
    return new Promise((resolve, reject) => {
      let type = "photo";
      this.VkApi.photos_getMessagesUploadServer().then((response) => {
        if (Array.isArray(photos)) {
          Promise.all(
            photos.map((photo) => {
              return uploadFile(response.upload_url, photo, type);
            })
          ).then((arrayOfUploadedFiles) => {
            Promise.all(
              arrayOfUploadedFiles.map((UploadedFile) => {
                return Promise.resolve(
                  this.VkApi.photos_saveMessagesPhoto(UploadedFile)
                ).then((res) => {
                  return res.response[0];
                });
              })
            ).then((savedFiles) => {
              resolve(
                this.VkApi.messages_sendPhoto(
                  this.update.object.user_id,
                  text,
                  createAttachment(savedFiles, type),
                  extra
                )
              );
            });
          });
        }
      });
    });
  }
};
