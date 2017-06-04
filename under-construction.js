(function() {
  var PREFIX = "__under-construciton/";
  window.uC = {
    storage: {
      get: function(key) { return uR.storage.get(PREFIX+key); },
      has: function(key) { return uR.storage.has(PREFIX+key); },
      remove: function(key) { return uR.storage.remove(PREFIX+key); },
      set: function(key,value) { return uR.storage.set(PREFIX+key,value); },
    },
    hit: function() { konsole.log.apply(this,["HIT"].concat([].slice.apply(arguments))) },
    miss: function() { konsole.log.apply(this,["MISS"].concat([].slice.apply(arguments))) },
    proxy: {
      send: window.XMLHttpRequest.prototype.send,
      open: window.XMLHttpRequest.prototype.open,
    },
    config: {
      read: true,
      write: true,
    },
    active: true,
    tests: "tests.js",
    max_ms: 2000,
    interval_ms: 20,
    getContext: function() { return { user_id: uR.auth.user && uR.auth.user.id } },
  };
  window.XMLHttpRequest.prototype.send = function() {
    // proxy around xhrReq.open(*arguments);
    if (!uC.active) { return uC.proxy.send.apply(this, [].slice.call(arguments)); }
    if (uC.storage.has(this._uc_key)) {
      uC.hit(this._uc_key,this._uc_url);
      var cached_response = uC.storage.get(this._uc_key);
      for (key in cached_response) {
        this[key] = cached_response[key];
      };
      this.onload.apply(cached_response);
      return;
    }
    uC.miss(this._uc_key);
    return uC.proxy.send.apply(this, [].slice.call(arguments));
  };
  window.XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    // proxy around xhrReq.open(method, url, async, user, password);
    var args = [].slice.call(arguments);
    if (!uC.active) { return uC.proxy.open.apply(this, args); }
    this._uc_key = objectHash({
      method: method,
      url: url,
      context: uC.getContext(),
    });
    this._uc_url = url;
    //uC.storage.remove(this._uc_key);
    return uC.proxy.open.apply(this, args);
  };
  uR.postAjax = function postAjax(request) {
    if (!uC.active) { return }
    if (!request.status) { return }
    uC.storage.set(request._uc_key,{
      response: request.response,
      status: request.status,
    });
  }
  uR.config.default_tabs = true;
})();
