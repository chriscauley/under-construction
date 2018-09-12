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
        <button class={ uR.config.btn_success } onclick={ konsole.stop } if={ _running }>
          Running: { _running } <i class="fa fa-close"></i></button>
        <button class={ uR.config.btn_success } onclick={ konsole.autorun } if={ !_running }>
          <!-- #! TODO -->
          Auto-Run</button>
        <button class={uR.config.btn_error } onclick={ uC.tests.clear }
                style="float: right">Clear Tests</button>
      </div>
      <div class="collection">
        <input class="collection-toggle" type="radio" name="command_toggle" id="command_toggle_null" />
        <li class="collection-item" each={ command in uC.commands } id="command_log_{ command.id }">
          <input class="collection-toggle" type="radio" name="command_toggle" id="command_toggle_{ command.id }" />
          <div class="collection-header { command.status }">
            <i class="fa fa-play-circle" onclick={ parent.parent.parent.run }></i>
            { command.name }
            <div class="icons right">
              <label class="fa fa-plus-circle command-toggle" for="command_toggle_{ command.id }"></label>
              <label class="fa fa-minus-circle" for="command_toggle_null"></label>
              <i class="fa fa-trash" onclick={ parent.parent.parent.clear }></i>
              <i class="fa fa-edit" if={ command.edit } onclick={ command.edit }></i>
            </div>
            <a class="pointer" onclick={ parent.parent.parent.replaceAll } if={ command.replace_links.length }>
              <b>Replace All ({ command.replace_links.length })</b>
            </a>
          </div>
          <ur-command command={ command }></ur-command>
       </li>
      </div>
    </ur-tab>
    <ur-tab title="Settings">
      <button onclick={ () => uR.recorder.config.openEditor() }>Recorder Settings</button>
    </ur-tab>
  </ur-tabs>

  var watch_keys = [];
  var watch_ings = {};
  var self = this;

  this.on('update',function() {
    this.className = uR.storage.get("KONSOLE_UP")?"open":"closed";
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
    e.item.command.reset();
    (uC.storage.get("__name__") == e.item.name) && uC.storage.remove("__main__");
  }

  toggle(e) {
    uR.storage.set("KONSOLE_UP",!uR.storage.get("KONSOLE_UP"))
    this.update()
  }
  close(e) {
    uR.storage.set("KONSOLE_ACTIVE",null);
    this.stop();
    this.unmount();
  }
  replaceAll(e) {
    const command = e.item.command;
    const replaces = Array.from(document.querySelectorAll("#command_log_"+command.id+" .kwarn .function"));
    replaces.map(e => {
      e.click();
      command.replace_links.shift();
    });
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
    this.stop = function() {
      uC.storage.set("__main__",null);
      uC.__running__ && uC.__running__.stop();
    };
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

<ur-command>
  <!--<div>{ opts.command.name }</div>-->
  <div each={ block,ib in opts.command.blocks } key={ block.hash } class="task accord"
       id="accord-{ block.hash }">
    <div class="accord-header">
      <i class="fa fa-plus-circle accord-open" onclick={ accord(block.hash) }></i>
      <i class="fa fa-minus-circle accord-close" onclick={ accord(block.hash) }></i>
      <b>{ block.message }</b>
    </div>
    <ul class="accord-content">
      <li each={ task, it in block.tasks } class="k{ task.status }">
        <span each={ d in task.details } onclick={ d.click } title={ d.title }
              class={ d.className }>{ d && d._name }</span>
      </li>
    </ul>
  </div>

accord(key) {
  return () => document.getElementById("accord-"+key).classList.toggle("closed")
}
this.on("mount",() => this.update())
this.on("update",() => {
  opts.command.blocks.forEach(block => {
    block.tasks.forEach(task => {
      task.details = uC.prepDetails(task.details,this) // nb: prepDetails is idempotent
    })
  })
})
</ur-command>
