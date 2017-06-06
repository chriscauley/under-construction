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
      .then(uR.test.wait(100))
      .then(uR.test.when(countTo(20),10,1000))
      .then(uR.test.click("[ur-mask]"))
      .then(uR.test.wait(300))
      .then(uR.test.wait(400))
      .then(uR.test.click("[title=Logs]"))
      .then(uR.test.when(countTo(4000),10,1000))
      .then(uR.test.wait(500))
  }

  function countTo(number) {
    return function countTo() { return !number--; }
  }
  uR.config.commands = [login,waitThenClick];
})();
