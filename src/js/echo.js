// Takes over XMLHttpRequest to record test data and reply without using the live server.

(function() {
  window.XMLHttpRequest.prototype.send = function() {
    // proxy around xhrReq.open(*arguments);
    var key = this._uc_key;

    if (!uC.intercept_ajax) { return uC.proxy.send.apply(this, [].slice.call(arguments)); }
    if (uC.storage.has(key)) {
      var cached_response = uC.storage.get(key);
      konsole.log(
        ["HIT",cached_response.status,key.slice(0,8)+"...",this._uc_url].join(" "),
        function reset(e) { uC.storage.remove(key); e.target.innerText = "done!"; }
      )
      this.onload.apply(cached_response);
      return;
    }

    konsole.log("MISS "+this._uc_key);
    return uC.proxy.send.apply(this, [].slice.call(arguments));
  };

  window.XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    // proxy around xhrReq.open(method, url, async, user, password);
    var args = [].slice.call(arguments);

    if (!uC.intercept_ajax) {
      return uC.proxy.open.apply(this, args);
    }

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
    if (!uC.intercept_ajax) { return }
    if (!request.status) { return }

    uC.storage.set(request._uc_key, {
      response: request.response,
      status: request.status,
    });
  }
})();
