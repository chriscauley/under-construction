(function() {
  function login(t) {
    t.do('Fail at login')
      .waitFor("auth-dropdown a")
      .click("auth-dropdown a")
      .waitFor("#id_username")
      .changeValue("#id_username","monkey")
      .changeValue("#id_password","butler")
      .click("#submit_button")
    t.done("bad username/password");
  };
  function waitThenClick(t) { // broken
    t.do('Wait Then click')
      .click("auth-dropdown a")
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
    
  function countTo(number) {
    return function countTo() { return !number--; }
  }
  konsole.addCommands(login,waitThenClick);
})();
