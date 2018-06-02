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
    },
    commands: [],
    changeElement(selector,value) {
      if (typeof value == "function") { value = value() }
      if (Array.isArray(value)) { // checkbox or radio
        document.querySelectorAll(selector).forEach((e) => e.checked = false);
        return value.forEach((v) => uC.changeElement(selector+"[value="+v+"]",v))
      }
      var element = document.querySelector(selector);
      if (!element) { throw "NotImplemented! Cannot find element" }
      if (element.type == "checkbox" || element.type == "radio") {
        if (element.value != value) { throw "NotImplemented! Value mismatch." }
        element.checked = "checked"
      } else {
        element.value = value;
      }
      element.dispatchEvent(new Event("change"));
      element.dispatchEvent(new Event("blur"));
      return element;
    }
  };
  window.u$ = {};
})();
