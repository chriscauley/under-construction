(function() {

  var PREFIX = "__under-construciton/";

  window.uC = Object.assign(new riot.observable(),{
    NO_DIFF: {}, // enum used to say a test had no prior result
    MAX_PASS_MS: 10000, // how long to wait before failing a test step
    TEST_CLASS: "disable_css_transitions", // test to apply to body when test starts
    storage: new uR.Storage(PREFIX),
    tests: new uR.Storage("__uc-tests/"),
    html2canvas_opts: { logging: false, scale: 1 },
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
    },
  });
  // #! TODO this is not currently in use but needs to be
  //uC.on("test-start",() => { document.body.classList.add(uC.TEST_CLASS) })
  //uC.on("test-end",() => { document.body.classList.remove(uC.TEST_CLASS) })

  const u$ = window.u$ = {

    // u$._reverse finds a name given a selector
    _reverse: value => value && _.invert(u$)[value],

    _verbose_reverse: value => { // like reverse, but slightly more readable
      const selector = u$._reverse(value);
      if (selector) { return `u$[${selector}]` }
      return value || "LAST"
    }

  };
})();
