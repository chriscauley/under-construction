(function() {
  function login() {
    this.do('Fail at login')
      //.wait(100)
      .wait("auth-dropdown a")
      .click("auth-dropdown a")
      .wait("#id_username")
      .changeValue("#id_username","monkey")
      .changeValue("#id_password","butler")
      .click("#submit_button")
    this.done("bad username/password");
  };
  function waitThenClick() {
    this.do('Wait Then click')
      .click("auth-dropdown a")
      .wait(100)
      .wait(countTo(20),10,1000)
      .click("[ur-mask]")
      .wait(300)
      .wait(400)
      .click("[title=Logs]")
      .wait(countTo(4000),10,1000)
      .wait(500)
      .done(arstarst)
  }

  function testURForm() {
    var schema = ['first-name','last-name',{ name: 'email', type:'email'} ];
    this.do('Making and testing ur-form element')
      .then(function() { uR.mountElement('ur-form',{schema: schema}) })
      .done()
  }

  function countTo(number) {
    return function countTo() { return !number--; }
  }
  konsole.addCommands(login, waitThenClick, testURForm);
})();
