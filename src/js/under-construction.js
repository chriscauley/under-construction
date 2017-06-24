(function() {

  var PREFIX = "__under-construciton/";

  window.uC = {
    storage: new uR.Storage(PREFIX),
    results: new uR.Storage("__uc-results/"),
    proxy: {
      send: window.XMLHttpRequest.prototype.send,
      open: window.XMLHttpRequest.prototype.open,
    },
    intercept_ajax: false,
    tests: "tests.js",
    config: {
      max_ms: 5000,
      interval_ms: 20,
    },
    getContext: function() {
      return {
        user_id: uR.auth && uR.auth.user && uR.auth.user.id
      }
    }
  };

  uR.config.default_tabs = true;

})();
