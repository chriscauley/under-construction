(function() {
  function login(t) {
    t.do('Fail at login')
      .wait("auth-dropdown a")
      .click("auth-dropdown a")
      .wait("#id_username")
      .changeValue("#id_username","monkey")
      .changeValue("#id_password","butler")
      .click("#submit_button")
    t.done("bad username/password");
  };

  function waitThenClick(t) {
    function countTo(number) {
      return function countTo() { return !number--; }
    }
    t.do('Wait Then click')
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


  function formIsValid() {
    return !uC.find("#submit_button",'valid').classList.contains("disabled");
  }

  function formIsInvalid() {
    return uC.find("#submit_button",'invalid').classList.contains("disabled");
  }

  function testURForm(t) {
    var schema = ['first-name','last-name',{ name: 'email', type:'email'} ];
    t.do('Making and testing ur-form element')
      .then(function() { uR.mountElement('ur-form',{schema: schema}) })
      .wait("#submit_button.disabled")
      .changeValue("#id_first-name","monkey")
      .changeValue("#id_last-name","butler")
      .changeValue("#id_email","arst@neio.com")
      .assert(formIsValid)
      .changeValue("#id_email","not an email")
      .assert(formIsInvalid)
      .done()
  }

  function testAjax(t) {
    // Make an ajax request and change a state variable along the way
    // make sure that state changes and ajax are in the right order.
    var state = 0;
    t.do("Testing ajax calls")
      .assert(function() { return state == 0 })
      .ajax('user.json',function(data,request) { state=1;return data.user.username == "chriscauley" })
      .assert(function() { return state == 1 })
      .then(function() { state=2 })
      .assert(function() { return state == 2 })
      .done("Ajax tested")
  }
  konsole.addCommands(login, waitThenClick, testURForm, testAjax);
})();
