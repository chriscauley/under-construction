(function()  {
  window.konsole = {
    _ready: [],
    _start: function() {
      var k = document.body.appendChild(document.createElement("konsole"));
      riot.mount("konsole");
      document.body.classList.add("konsole-open");
    },
    schema:[],
  };
  uR.forEach(['log','warn','error','watch','addCommands'],function(key) {
    konsole[key] = function() {
      konsole._ready.push([key,arguments]);
      konsole._start();
      konsole._start = function(){}
    }
  });
  uR._mount_tabs = false;
})();

<konsole>
  <button class="toggle" onclick={ toggle }></button>
  <ur-tabs>
    <ur-tab title="Logs">
      <div each={ line,lineno in parent.parent.log } data-lineno={ lineno } data-ms="{ line.ts }" class={ line.className }>
        <span each={ line }>
          <span onclick={ click } class="{ className } { pointer: click }">{ _name }</span>
        </span>
      </div>
    </ur-tab>
    <ur-tab title="Watches">
      <div each={ parent.parent.watch }>
        <b>{ key }:</b> { value }
      </div>
    </ur-tab>
    <ur-tab title="Settings">
      <ur-form schema={ konsole.schema }></ur-form>
    </ur-tab>
  </ur-tabs>
  <div class="commands">
    <div each={ command in konsole.commands }>
      <button class="btn { command.ur_status }" onclick={ command.run }>{ command.name }</button>
    </div>
  </div>

  var watch_keys = [];
  var watch_ings = {};
  this.log = [];
  var that = this;

  this.on('update',function() {
    this.watch = [];
    for (var i=0;i<watch_keys.length;i++) {
      var k = watch_keys[i];
      this.watch.push({key: k, value: watch_ings[k]});
    }
  });

  toggle(e) {
    var c = "konsole-open";
    var cL = document.body.classList;
    cL[cL.contains(c)?"remove":"add"](c);
    uR.storage.set("konsole_open",cL.contains(c) || "");
  }
  this.on("mount",function() {
    window.konsole = {
      schema: [ 'wait_ms' ],
      log: function() {
        // arguments can be strings or functions
        var a = [].slice.call(arguments);
        var ts = (new Date() - konsole.log._last);
        if (!ts && ts !== 0) { ts = 'START' }
        else if (ts > 1000) { ts = "+"+(ts/1000).toFixed(1)+"s" }
        else { ts = "+"+ts+"ms" }
        var out = a.map(function(word) {
          if (typeof word == "function") {
            return {
              className: "function",
              func: word,
              _name: word._name || word.name,
              click: function (e) {
                e.item.click = undefined;
                e.item._name = e.item.func() || e.item._name;
                konsole.update();
              },
            }
          } else if (typeof word == "string") {
            var new_word = {
              content: word,
              _name: (word.length < 30)?word:word.slice(0,15)+"...",
            }
            if (word.startsWith("data:image")) {
              new_word.className = "dataURL";
              new_word._name = "dataURL";
              new_word.click = function() { window.open(word); }
            }
            return new_word;
          } else if (word === undefined) {
            return { className: "undefined", _name: "undefined" }
          }
          return word; // it was something else, hopefully pre-formatted
        });
        if (a[0] == "WARN") { out.className = "kwarning" }
        out.ts = ts;
        that.log.push(out);
        that.update();
        konsole.log._last = new Date();
        var container = that.root.querySelector("ur-tab[title='Logs']");
        container.scrollTop = container.scrollHeight;
      },
      error: function() {
        var args = [].slice.call(arguments);
        args.unshift("ERROR");
        konsole.log.apply(konsole,args);
        console.error.apply(window,args); // to get chrome's interactive stack trace
      },
      warn: function() {
        var args = [].slice.call(arguments);
        args.unshift("WARN");
        konsole.log.apply(konsole,args);
      },
      clear: function() { konsole.log._last = undefined },
      update: that.update,
      watch: function(k,v) {
        if (watch_keys.indexOf(k) == -1) { watch_keys.push(k); }
        watch_ings[k] = v;
        that.update();
      },
      commands: [],
      _ready: konsole._ready,
      addCommands: function() {
        uR.forEach(arguments,function(command) {
          var test = new uC.Test(command)
          konsole.commands.push(test);
          if (uC.storage.get("__main__") == command.name) { test.run() }
        });
      },
    };
    document.addEventListener("keydown",function(event) {
      if (event.keyCode == 75 && event.ctrlKey) {
        event.preventDefault();
        event.stopPropagation();
        this.toggle();
        return false;
      }
    }.bind(this));
    uR.forEach(konsole._ready,function(tup) {
      var key = tup[0], args = tup[1];
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
