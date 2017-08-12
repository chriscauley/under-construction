(function() {
  function login() {
    this.do('Fail at login')
      .wait("auth-dropdown a")
      .click("auth-dropdown a")
      .wait("#id_username")
      .changeValue("#id_username","monkey")
      .changeValue("#id_password","butler")
      .click("#submit_button")
    this.done("bad username/password");
  };

  function waitThenClick() {
    function countTo(number) {
      return function countTo() { return !number--; }
    }
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
  }

  function formIsValid() {
    return !uC.find("#submit_button",'valid').classList.contains("disabled");
  }

  function formIsInvalid() {
    return uC.find("#submit_button",'invalid').classList.contains("disabled");
  }

  function testURForm() {
    var schema = ['first-name','last-name',{ name: 'email', type:'email'} ];
    this.do('Making and testing ur-form element')
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

  function testAjax() {
    // Make an ajax request and change a state variable along the way
    // make sure that state changes and ajax are in the right order.
    var state = 0;
    this.do("Testing ajax calls")
      .assert(function() { return state == 0 })
      .ajax('user.json',function(data,request) { state=1;return data.user.username == "chriscauley" })
      .assert(function() { return state == 1 })
      .then(function() { state=2 })
      .assert(function() { return state == 2 })
      .done("Ajax tested")
  }

  function testCanvas() {
    var canvas = document.createElement("canvas");
    document.getElementById("content").appendChild(canvas);
    canvas.width = 1;
    canvas.height = 1;
    var context = canvas.getContext("2d");
    var onexone = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=";
    function drawCircle() {
      context.beginPath();
      canvas.width = 100;
      canvas.height=100;
      var centerX = canvas.width/2,
      centerY = canvas.height/2,
      radius = canvas.height/2-5;
      context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
      context.fillStyle = 'blue';
      context.fill();
      context.lineWidth = 5;
      context.strokeStyle = '#003300';
      context.stroke();
    }
    this.do("Fun with canvas")
      .assertEqual(function() { return canvas.toDataURL() },onexone)
      .checkResults("onexone canvas always accept",function() { return canvas.toDataURL() })
      .then(drawCircle)
      .checkResults("blue circle",function() { return canvas.toDataURL() })
      .checkResults("blue circle",function() { return "monkey" })
      .done("yay")
  }

  konsole.addCommands(login) //, waitThenClick, testURForm, testAjax, testCanvas);
})();
