(function() {
  function _closeModal() { return uC.test.click("[ur-mask]") }
  function _useLogin() { return [
  ] };
  function login() {
    var t = new uC.test.Test('Fail at login');
    t.waitFor("auth-dropdown a")
      .click("auth-dropdown a")
      .waitFor("#id_username")
      .changeValue("#id_username","monkey")
      .changeValue("#id_password","butler")
      .click("#submit_button")
  };
  function waitThenClick() { // broken
    var t = new uC.test.Test('Wait Then click');

      t.click("auth-dropdown a")
      .wait(100)
      .when(countTo(20),10,1000)
      .click("[ur-mask]")
      .wait(300)
      .wait(400)
      .click("[title=Logs]")
      .when(countTo(4000),10,1000)
      .wait(500)
      .done(arstarst)
  }

  // function doAll() {
  //   t.test(login)
  //     .test(openShoppinCart)
  // }
    
  function countTo(number) {
    return function countTo() { return !number--; }
  }
  uR.config.commands = [login,waitThenClick];
})();
