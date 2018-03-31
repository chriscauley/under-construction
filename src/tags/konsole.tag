(function()  {
  window.konsole = {
    _ready: [],
    _start: function() {
      var k = document.body.appendChild(document.createElement("konsole"));
      riot.mount("konsole");
      uR.storage.get("KONSOLE_UP") && document.body.classList.add("konsole-open");
      konsole._start = function() {};
      setTimeout(function() { document.querySelector("konsole ur-tabs").classList.add("default"); },500)
    },
    schema:[],
  };
  uR.forEach(['log','warn','error','watch','addCommands','toggle'],function(key) {
    konsole[key] = function() {
      konsole._ready.push([key,arguments]);
    }
  });
  uR._mount_tabs = false;
  document.addEventListener("keydown",function(event) {
    if (event.keyCode == 75 && event.ctrlKey && event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      konsole.toggle();
      uR.storage.set("ACTIVE_KONSOLE",!document.body.classList.contains("konsole-open"));
      return false;
    }
  }.bind(this));
  uR.ready(function() {
    if (uR.storage.get("ACTIVE_KONSOLE")) { konsole._start(); };
  });
})();

<konsole>
  <button class="toggle" onclick={ toggle }></button>
  <ur-tabs>
    <ur-tab class="commands" title="Commands">
      <div>
        <button class={ uR.config.btn_success } onclick={ konsole.stop } if={ _running }>
          Running: { _running } <i class="fa fa-close"></i></button>
        <button class={ uR.config.btn_success } onclick={ konsole.autorun } if={ !_running }>
          <!-- #! TODO -->
          Auto-Run</button>
        <button class={uR.config.btn_error } onclick={ uC.tests.clear() }
                style="float: right">Clear Tests</button>
      </div>
      <div class="collection">
        <input class="collection-toggle" type="radio" name="command_toggle" id="command_toggle_null" />
        <li class="collection-item" each={ command in uC.commands } id="command_log_{ command.id }">
          <input class="collection-toggle" type="radio" name="command_toggle" id="command_toggle_{ command.id }" />
          <div class="collection-header { command.status }">
            <i class="fa fa-play-circle" onclick={ parent.parent.parent.run }></i>
            { command.name }
            <label class="fa fa-plus-circle right command-toggle" for="command_toggle_{ command.id }"></label>
            <label class="fa fa-minus-circle right" for="command_toggle_null"></label>
            <i class="fa fa-trash right" onclick={ parent.parent.parent.clear }></i>
          </div>
          <ur-logger command={ command }></ur-logger>
       </li>
      </div>
    </ur-tab>
    <ur-tab title="Settings">
      <!--<ur-form schema={ konsole.schema }></ur-form>-->
    </ur-tab>
  </ur-tabs>

  var watch_keys = [];
  var watch_ings = {};
  var self = this;

  this.on('update',function() {
    this.watch = [];
    for (var i=0; i < watch_keys.length; i++) {
      var k = watch_keys[i];
      this.watch.push({key: k, value: watch_ings[k]});
    }
  });

  run(e) {
    uC.storage.set("__main__",e.item.command.name);
    e.item.command.start();
  }

  clear(e) {
    e.item.command.mark("");
    (uC.storage.get("__name__") == e.item.name) && uC.storage.remove("__main__");
  }

  toggle(e) {
    var c = "konsole-open";
    var cL = document.body.classList;
    cL[cL.contains(c)?"remove":"add"](c);
    uR.storage.set("KONSOLE_UP",cL.contains(c) || "");
  }
  autorun(e) {
    uC.commands.forEach(function(command) {
      if (uC.__running__) { return }
      if (command.status =="passed") { return }
      command.start(function() { self.autorun() });
    });
    if (e && !uC.__running__) { //human click and all tests are passed... reset them!
      uC.commands.forEach(function(command) { command.status = ""; });
      self.autorun()
    }
  }
  this.on("update",function() {
    this._running = uC.storage.get("__main__");
    uR.forEach(uR.__logs,function(l) { l.update_tag() })
  });
  this.on("mount",function() {
    this.stop = function() { uC.storage.set("__main__",null); },
    this._ready = window.konsole._ready;
    new uR.Log({ parent: this, name: "Konsole" });
    window.konsole = this;
    this.addCommands = function() {
      uR.forEach(arguments,function(command) {
        var test = new uC.Test(command);
        if (uC.storage.get("__main__") == test.name) {
          uR.ready(function() { test.start() });
        }
      });
    };
    uR.forEach(window.konsole._ready,function(tup) {
      var key = tup[0], args = tup[1];
      konsole[key].apply(self,[].slice.apply(args));
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
