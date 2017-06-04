(function() {
  function _openLogin() { return [
    uR.test.watchFor("auth-dropdown a"),
    uR.test.click("auth-dropdown a")
  ] };
  function _useLogin() { return [
    uR.test.changeValue("#id_username","monkey"),
    uR.test.changeValue("#id_password","butler"),
    uR.test.click("#submit_button")
  ] };
  function login() {
    uR.test.Test("/",[_openLogin,_useLogin]);
  };
  uR.config.commands = [login];
})();
