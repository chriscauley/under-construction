(function() {
  function setPath(pathname,hash) {
    hash = hash || "#";
    if (pathname != window.location.pathname ||
        hash != window.location.has) {
      window.location = pathname + (hash || "#");
    }
    return true;
  }
  function watch(f,max_ms,interval_ms) {
    max_ms = max_ms || uC.config.max_ms;
    interval_ms = interval_ms || uC.config.interval_ms;
    var start = new Date(),
        interval;
    var promise = new Promise(function(resolve,reject) {
      console.log("creating interval");
      interval = setInterval(function() {
        console.log("executing interval");
        var out = f(),
            ms_since = (new Date()-start);
        if (out) {
          clearInterval(interval);
          console.log("resolved at ",ms_since,"with",out);
          resolve(out);
        } else if (ms_since > max_ms) {
          clearInterval(interval);
          console.error("promise not resolved after "+max_ms+" seconds");
          reject(out);
        }
      }, interval_ms);
    });
    return promise
  }
  function watchFor(querySelector) {
    return watch(function() { return document.querySelector(querySelector) });
  }

  function wait_5() {
    var count = 0;
    return watch(function() {
      count += 1;
      if (count == 5) {
        return count;
      }
    });
  }
  function login() {
    watchFor("auth-dropdown a")
      .then(function(result) {
        result.click();
        return watchFor("#id_username");
      })
      .then(function() {
        document.querySelector("#id_username").value = "monkey";
        document.querySelector("#id_password").value = "butler";
        document.querySelector("#id_username").dispatchEvent(new Event("change"));
        document.querySelector("#id_password").dispatchEvent(new Event("change"));
        document.querySelector("#submit_button").click();
      });
  }
  window.login = login;
})();
