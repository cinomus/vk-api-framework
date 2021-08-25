function text(label, payload = {}, color = "secondary") {
  const type = "text";
  return {
    action: {
      label,
      type,
      payload: JSON.stringify(payload),
    },
    color: color,
  };
}

function locationRequest(payload = {}) {
  const type = "location";
  return { action: { payload: JSON.stringify(payload), type } };
}

function url(label, link, payload = {}) {
  const type = "open_link";
  return { action: { label, link, type, payload: JSON.stringify(payload) } };
}

function callback(label, data, color = "secondary") {
  const type = "callback";
  const payload = {
    data: data,
  };
  return {
    action: { label, payload: JSON.stringify(payload), type },
    color: color,
  };
}
function pay(payload = {}, hash) {
  const type = "vkpay";
  return { action: { payload: JSON.stringify(payload), hash, type } };
}
function apps(app_id, owner_id, payload = {}, label, hash) {
  const type = "open_app";
  return {
    action: {
      app_id,
      owner_id,
      payload: JSON.stringify(payload),
      label,
      hash,
      type,
    },
  };
}
module.exports = { callback, pay, text, apps, url, locationRequest };
