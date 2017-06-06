(function() {
  function _closeModal() { return uR.test.click("[ur-mask]") }
  function _useLogin() { return [
    uR.test.changeValue("#id_username","monkey"),
    uR.test.changeValue("#id_password","butler"),
    uR.test.click("#submit_button")
  ] };
  function login() {
    uR.test.setPath("/")
      .then(uR.test.watchFor("auth-dropdown a"))
      .then(uR.test.click("auth-dropdown a"))
      .then(uR.test.watchFor("#id_username"));
  };
  function waitThenClick() {
    /*function wait(ms) {
      var time;
      return uR.test.watch(
        function() { time = time || new Date(); return new Date()-time > ms },
        { name: "waitOG "+ms+"ms" }
      )
    }*/
    return Promise.resolve(function() { return true})//wait(1500,'start'))
      .then(uR.test.click("auth-dropdown a"))
      .then(wait(100))
      .then(when(countTo(20),10,1000))
      .then(uR.test.click("[ur-mask]"))
      .then(wait(300))
      .then(wait(400))
      .then(uR.test.click("[title=Logs]"))
      .then(when(countTo(4000),10,1000))
      .then(wait(500))
      //.until(uR.test.watchFor("auth-dropdown a"))
      /*.then(wait.before(1500))
      .then(uR.test.click("auth-dropdown a"))
      .then(uR.test.wait(1500))
      .then(_closeModal())
      .then(function() { return uR.test.click("konsole [title=Logs]") });*/
  }

  var start = new Date().valueOf();
  function wait(ms,s) {
    return function() {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          konsole.log('waited '+ms+s);
          resolve(new Date() - start);
        }, ms);
      });
    }
  }
  function countTo(number) {
    return function countTo() { return !number--; }
  }
  function when(f,ms,max_ms) {
    return function() {
      return new Promise(function (resolve, reject) {
        var start = new Date();
        var interval = setInterval(function () {
          var out = f();
          if (out) {
            konsole.log('when '+f.name);
            resolve(out);
            clearInterval(interval)
          } else if (new Date() - start > max_ms) {
            konsole.log("rejected ",new Date() - start)
            //reject(new Date() - start)
            clearInterval(interval)
          }
        }, ms);
      });
    }
  }
  function rejectLater(resolve, reject) {
    setTimeout(function () {
      reject(new Date() - start);
    }, 2000);
  }
  uR.config.commands = [login,waitThenClick];
})();
