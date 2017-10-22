(function() {

  var PREFIX = "__under-construciton/";

  window.uC = {
    storage: new uR.Storage(PREFIX),
    results: new uR.Storage("__uc-results/"),
    tests: new uR.Storage("__uc-tests/"),
    proxy: {
      send: window.XMLHttpRequest.prototype.send,
      open: window.XMLHttpRequest.prototype.open,
    },
    intercept_ajax: false,
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
  window.u$ = {};

})();
