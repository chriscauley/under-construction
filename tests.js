(function() {
  function login() {
    uR.test.setPath("/")
      .then(uR.test.watchFor("auth-dropdown a"))
      .then(uR.test.click("auth-dropdown a"))
      .then(uR.test.watchFor("#id_username"))
      .then(function() {
        document.querySelector("#id_username").value = "monkey";
        document.querySelector("#id_password").value = "butler";
        document.querySelector("#id_username").dispatchEvent(new Event("change"));
        document.querySelector("#id_password").dispatchEvent(new Event("change"));
        document.querySelector("#submit_button").click();
      });
  }
  uR.config.commands = [login];
})();
