(function()  {
  window.konsole = {
    _ready: [],
    _start: function() {
      var k = document.body.appendChild(document.createElement("konsole"));
      riot.mount("konsole");
      konsole._start = function() {};
    },
    schema:[],
  };
  uR.forEach(['addCommands','toggle'],function(key) {
    konsole[key] = function() {
      konsole._ready.push([key,arguments]);
    }
  });
  uR._mount_tabs = false;
  document.addEventListener("keydown",function(event) {
    if (event.keyCode == 75 && event.ctrlKey && event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      if (uR.storage.get("KONSOLE_ACTIVE")) {
        konsole.toggle();
      } else {
        konsole._start();
        uR.storage.set("KONSOLE_ACTIVE",1);
      }
      return false;
    }
  });
  uR.ready(function() {
    if (uR.storage.get("KONSOLE_ACTIVE")) { konsole._start(); };
  });
})();

<konsole class={ className }>
  <button class="toggle-konsole" onclick={ toggle }></button>
  <button class="close-konsole" onclick={ close }></button>
  <ur-tabs class="default">
    <ur-tab class="commands" title="Commands">
      <div>
        <button class={ uR.config.btn_success } onclick={ konsole.stop } if={ konsole._running }>
          Running: { konsole._running } <i class="fa fa-close"></i></button>
        <button class={ uR.config.btn_success } onclick={ konsole.autorun } if={ !konsole._running }>
          { konsole.autorun_text }</button>
        <button class={uR.config.btn_error } onclick={ uC.tests.clear }
                style="float: right">Clear Tests</button>
      </div>
      <uc-command each={ command in uC.commands }></uc-command>
    </ur-tab>
    <ur-tab title="Settings">
      <button onclick={ () => uR.recorder.config.openEditor() }>Recorder Settings</button>
    </ur-tab>
  </ur-tabs>

  this.on('update',function() {
    this.className = uR.storage.get("KONSOLE_UP")?"open":"closed";
  });

  toggle(e) {
    uR.storage.set("KONSOLE_UP",!uR.storage.get("KONSOLE_UP"))
    this.update()
  }
  close(e) {
    uR.storage.set("KONSOLE_ACTIVE",null);
    this.stop();
    this.unmount();
  }

  autorun(e) {
    uC.commands.forEach( command => {
      if (uC.__running__) { return }
      if (command.status =="passed") { return }
      command.start(function() { this.autorun() });
    });
    if (e && !uC.__running__) { //human click and all tests are passed... reset them!
      uC.commands.forEach(command => command.mark(undefined))
      self.autorun()
    }
  }
  this.on("update",function() {
    this._running = uC.storage.get("__main__");
    this.autorun_text = uC.commands.filter(c=>c.status !="passed").length?"Run unpassed":"Reset and run"
  });
  this.on("mount",function() {
    this.stop = function() {
      uC.storage.set("__main__",null);
      uC.__running__ && uC.__running__.stop();
    };
    this._ready = window.konsole._ready;
    window.konsole = this;
    this.addCommands = function() {
      uR.forEach(arguments,function(command) {
        var test = new uC.Test(command);
        if (uC.storage.get("__main__") == test.name) {
          uR.ready(function() { test.start() });
        }
      });
    };
    window.konsole._ready.forEach( ([key,args]) => {
      konsole[key].apply(this,[].slice.apply(args));
    });
    setTimeout(konsole.update,500);
    if (!document.querySelector(uR.config.mount_alerts_to)) {
      var e = document.createElement("div");
      e.id = "alert-div";
      this.root.appendChild(e);
      uR.config.mount_alerts_to = "alert-div";
    }
  });
</konsole>
