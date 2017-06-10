(function()  {
  window.konsole = {
    _ready: [],
    _start: function() {
      var k = document.body.appendChild(document.createElement("konsole"));
      riot.mount("konsole");
      document.body.classList.add("konsole-open");
    }
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
      <div each={ line,lineno in parent.parent.log } data-lineno={ lineno } data-ms="{ line.ts }">
        <span each={ word in line }>
          <a href="javascript:void()" if={ typeof(word) === 'function' } onclick={ word }></a>
          <u if={ typeof(word) !== 'function' }>{ word }</u>
        </span>
      </div>
    </ur-tab>
    <ur-tab title="Watches">
      <div each={ parent.parent.watch }>
        <b>{ key }:</b> { value }
      </div>
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
    uR.storage.set("konsole_open",cL.classList.contains(c) || "");
  }
  this.on("mount",function() {
    window.konsole = {
      log: function() {
        // arguments can be strings or functions
        var a = [].slice.call(arguments);
        var ts = (new Date() - konsole.log._last);
        if (!ts && ts !== 0) { ts = 'START' }
        else if (ts > 1000) { ts = "+"+ts.toFixed(1)+"s" }
        else { ts = "+"+ts+"ms" }
        a.ts = ts;
        that.log.push(a);
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
          konsole.commands.push(new uC.test.Test(command))
        });
      },
    };
    uR.forEach(konsole._ready,function(tup) {
      var key = tup[0], args = tup[1];
      konsole[key].apply(this,[].slice.apply(args));
    });
    setTimeout(konsole.update,500);
  });
</konsole>
