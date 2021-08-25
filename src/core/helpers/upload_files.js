const mime = require("mime-types");
const fetch = require("node-fetch");
const FormData = require("form-data");

function createAttachment(arrayOfSavedFiles, type) {
  let attachmentArray = arrayOfSavedFiles.map((photo) => {
    return `${type}${photo.owner_id}_${photo.id}_${photo.access_key}`;
  });
  return `${attachmentArray}`;
}

function uploadFile(
  uploadUrl,
  { url: fileUrl, filename },
  fieldName = "file",
  paramsUpload = {}
) {
  return new Promise((resolve, reject) => {
    // if (!url || !staticMethods.isString(url)) {
    //     return reject(this._vk._error('is_not_string', {
    //         parameter: 'url',
    //         method: 'uploadFetchedFile',
    //         format: 'http(s)://www.domain.example.com/path?request=get'
    //     }))
    // }

    // if (!fileUrl || (!staticMethods.isString(fileUrl) && !staticMethods.isObject(fileUrl))) {
    //     return reject(this._vk._error('is_not_string', {
    //         parameter: 'fileUrl',
    //         method: 'uploadFetchedFile',
    //         format: 'https://vk.com/images/community_100.png'
    //     }))
    // }

    // if (fieldName) {
    //     if (!staticMethods.isString(fieldName)) {
    //         return reject(this._vk._error('is_not_string', {
    //             parameter: 'fieldName',
    //             method: 'uploadFetchedFile',
    //             required: false
    //         }))
    //     }
    // }

    if (typeof paramsUpload !== "object") {
      paramsUpload = {};
    }

    if (typeof fileUrl === "string") {
      fileUrl = {
        url: fileUrl,
      };
    }

    let fetchingFileUrl = fileUrl.url;
    // let filename =
    //   fileUrl.name ||
    //   fetchingFileUrl.split("/").pop().split("#")[0].split("?")[0];
    if (!filename) {
      return reject();
      // this._vk._error("is_not_string", {
      //   parameter: "fileUrl.name",
      //   method: "uploadFile",
      //   format: "example.jpeg or example.rar",
      // })
    }

    return fetch(fetchingFileUrl, {
      agent: this._agent,
    }).then(async (res) => {
      let buff = await res.buffer();

      let form = new FormData();

      filename =
        filename ||
        fieldName +
          "." +
          mime.extension(res.headers.get("content-type") || "text/plain");

      form.append(fieldName, buff, {
        filename,
      });

      return fetch(uploadUrl, {
        method: "POST",
        body: form,
        agent: this._agent,
      }).then(async (response) => {
        let vkr = await response.json();
        if (vkr) {
          if (paramsUpload.custom) {
            return resolve(vkr);
          } else {
            let json = true;

            if (json) {
              return resolve(vkr);
            } else {
              return reject();
              // this._vk._error("invalid_response", {
              //   response: response,
              // })
            }
          }
        } else {
          return reject();
          // this._vk._error("empty_response", {
          //   response: response,
          // })
        }
      });
    });
  });
}
module.exports = { uploadFile, createAttachment };
