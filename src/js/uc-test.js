(function () {
  uC.BaseTest = class BaseTest {
    constructor() {
      /* arguments can be functions or an options object
         if functions, they are bound and exectuted at the end of this constructor
         if it's a string, the test will take that as the name
      */
      var self = this;
      var options = {};
      uC.commands.push(this);
      this.id = uC.commands.length;
      this.uid = "command-"+this.id;
      var functions = [];
      this.data = {};
      this.context = {};
      uR.forEach(arguments,(arg) => {
        if (typeof arg == "object") { options = arg }
        if (typeof arg == 'function') { functions.push(arg) }
        if (typeof arg == 'string') { this.name = arg };
        if (arg && arg.edit) { this.edit = () => arg.edit() }
      });
      this.queue = [];  // functions/test to execute
      this.completed = []; // strings of completed queue objects
      this.diff_links = []; // functions to open the diff popups
      this.replace_links = []; // functions to accept changes
      var f0 = functions[0];
      this.name = this._name || this.name || (f0 && (f0._name || f0.name)) || options.name;
      if (!this.name) { console.warn("Test does not have name. Not sure what this will do") }
      this.results = new uR.Storage("__uc-results/"+this.name);

      this.parent = options.parent;
      this.depth = this.parent?(this.parent.depth+1):0;
      this.step = 0;
      this.delay = 250;
      this.run = this.run.bind(this);
      uC.__selectors = uC.__selectors || {};
      this.blocks = []

      var fnames = [
        'click', 'changeValue', 'changeForm', 'wait','mouseClick', 'assert', 'assertNot', 'assertEqual',
        'route', 'setPathname','setHash','reloadWindow','checkResults', 'debugger', 'ajax', 'shiftTime',
        'comment',
      ];
      fnames.forEach(fname => {
        this[fname] = function() {
          let args = [...arguments];
          let f = this["_"+fname];
          if (typeof args[0] == "string") { uC.__selectors[args[0]] = 1; }
          let f2 = () => f.apply(this,args)
          f2._name = name;
          this.then(f2());
          return this;
        }
        // Because `function.name = fname` does nothing, we need:
        Object.defineProperty(this[fname],'name',{value:fname});
      })

      functions.forEach(function (f) {
        f.bind(self)()
      });
      this.mark(uC.tests.get(this.name));
      this.getStateHash();
    }

    reset() {
      this.results.clear();
    }

    getStateHash(name) {
      name = name || this.name;
      return name+"@"+objectHash(this.completed)
    }

    get(key) {
      var self = this;
      while (self) {
        if (self.context[key]) { return self.context[key] }
        self = self.parent;
      }
    }

    getLocal(key) {
      return this.context[key];
    }
    indent() { return Array(this.depth+1).join("|"); }
    then() {
      uR.forEach([...arguments],(f) =>{
        const name = f._description || f._name || f.name;
        this.last_block.tasks.push({
          action: f,
          name: name,
          details: f.details || [(f.name+"()")],
        })
      });
      return this;
    }
    run() {
      uC._current_test = uC._current_test || this;
      var self = this;
      const block = this.current_block = this.blocks[this.block_no];
      if (!block) { // All done! this should be in a separate "finish" method or something
        clearTimeout(this.fail_timeout);
        const counts = {}
        this.blocks.forEach(block => {
          block.tasks.forEach(task => counts[task.status] = (counts[task.status] || 0) + 1)
        })
        if (counts.error) { this.mark("error") }
        else if (counts.warning) { this.mark("warning") }
        else {
          this.mark("passed");
          this.parent_pass && this.parent_pass();
          (uC.storage.get("__main__") == this.name) && uC.storage.remove("__main__");
        }
        konsole.update()
        return this.stop()
      }

      if (block.step >= block.tasks.length) { // onto the next block
        this.block_no++;
        return this.run();
      }
      if (this.is_ready && block) {
        if (this._delay_until && new uR.TrueDate().valueOf() < this._delay_until) {
          setTimeout(this.run, this._delay_until - new uR.TrueDate().valueOf())
          return;
        }
        clearTimeout(this.fail_timeout);
        const active_task = block.tasks[block.step]; // this is either a test or a function passed in via then
        function pass(...args) {
          while (args[0] === true) { args.shift() }

          // if not a warning, mark it a success
          if (args[0] != "WARN") {
            args.unshift("SUCCESS");
            active_task.status = "success";
          } else {
            active_task.status = "warning";
          }

          active_task.details = args;
          args.unshift(self.step);
          self.completed.push(active_task._name || active_task.name);
          uC.tests.set(self.getStateHash(),active_task.status);
          self.step++;
          self._delay_until = self.delay && (new uR.TrueDate().valueOf() + self.delay);
          block.step++
          self.run();
        }
        if (this.__completed && this.__completed.length) {
          return pass(this.__completed.shift()+" (skipped after reload)")
        }
        function fail(e) {
          var args = [].slice.call(arguments);
          args.unshift("ERROR")
          args.unshift(self.step);
          active_Test.details = args;
          self.stop();
          self.mark("error");
          throw e;
        }
        this.fail_timeout = setTimeout(() => fail("Test took longer than "+uC.MAX_PASS_MS+" ms"),uC.MAX_PASS_MS)
        this.status = active_task.status = 'running';

        var result;
        try { result = active_task.action.bind(this)(pass,fail); }
        catch (e) { fail(e) }
        result && pass(result); // test functions that return truthy objects move to next task
        konsole.update();
      }
    }
    mark(status) {
      this.status = status;
      uC.tests.set(this.name,status);
      if (this.status == "passed" && this.pass) {
        this.stop();
        this.pass();
      }
      konsole.update();
    }
    test() {
      [...arguments].forEach(f=> f.call(this))
      return this
    }
    start(pass,fail) {
      window.Date = TimeShift.Date; // might need to be somewhen else
      document.body.classList.add(uC.TEST_CLASS)
      window.riot && window.riot.compile()
      uC.__running__ = this;

      // restore halfway results for path changing tests
      this.__completed = uC.storage.get("__completed");
      uC.storage.remove("__completed");
      this.block_no = 0 // should be loaded from completed

      var toggler = document.querySelector("[for=command_toggle_"+this.id+"]");
      toggler && toggler.click();
      this.pass = pass || this.pass;
      this.fail = fail || this.fail;
      this.is_ready = true;
      this.run.bind(this)()
    }
    stop() {
      clearInterval(this.active_interval);
      clearTimeout(this.fail_timeout);
      this.is_ready = false;
      uC.__running__ = undefined;
    }
  }

  uC.Test = class Test extends uC.BaseTest {
    waitForThenClick() {
      var args = [].slice.apply(arguments);
      return this.wait.apply(this,args).click.apply(this,args);
    }

    do(message,context={}) {
      message = message || this.name;
      this.name = this.name || message;
      this.blocks.push(this.last_block = {
        message: message,
        tasks: [],
        hash: objectHash(message),
        uid: "block-" + this.id + "-" + objectHash(message).slice(0,8),
        step: 0,
      })
      return this;
    }

    done(message) { //#! TODO depracate this
      message = message || this.name;
      function done(pass,fail) {
        pass("DONE", message);
      };
      done._description = "DONE: " + message;
      this.then(done);
      return this;
    }

    /* after this are private methods, eg Test().f(args) is a wrapper around Test().then(_f(args)) */

    _setPathname(pathname) {
      console.warn("uC.Test.setPathname is deprecated. Use uC.Test.route instead.")
      return function setPath(pass, fail) {
        if (pathname != window.location.pathname) {
          // #! TODO: this needs to set some kind of "resume" mark first
          return uR.route(pathname,{one: { route: pass } })
        }
        pass();
      };
    }

    _setHash(hash) {
      console.warn("uC.Test.setHash is deprecated. Use uC.Test.route instead.")
      return function setHash(pass,fail) {
        if (!hash.indexOf("#") == 0) { hash = "#" + hash }
        if (hash != window.location.hash) {
          return uR.route(hash,{one: { route: pass } });
        }
        pass();
      }
    }
    _route(url) {
      function route(pass,fail) {
        var _l = window.location;
        uR.route(url);
        pass("routed to ",url)
      }
      route._name = `route to ${url}`;
      route.details = ["route",url];
      return route;
    }
    _reloadWindow() {
      return function reloadWindow(pass,fail) {
        this.completed.push("window reloaded");
        this._progress = uC.storage.set("__completed",this.completed);
        window.location.reload();
      }
    }

    _ajax(ajax_options,callback) {
      var self = this;
      var name = ajax_options.url;
      var full_url = ajax_options.url;
      function lastSplitPart(string,splitter) {
        var parts = string.split(splitter);
        return parts.pop() || parts.pop() || "";
      }
      if (name.length > 20) {
        var [url,query_string] = full_url.split("?");
        name = ".../" + lastSplitPart(url,"/");
        if (query_string) {
          if (~query_string.indexOf("&")) { name += "?...&" + lastSplitPart(query_string,"&"); }
          else { name += "?" + query_string }
        }
      }
      function ajax(pass, fail) {
        if (typeof ajax_options == "string") { ajax_options = { url: ajax_options } }
        var success = ajax_options.success || function() {};
        ajax_options.success = function(data,request) {
          success(data,request);
          callback && callback(data,request);
          self._compareResults(full_url,data,pass,fail);
        }
        ajax_options.error = function(data,request) {
          var result = {
            _name: request.status+"'d! "+ name,
            title: ajax.description.title,
          };
          if (ajax_options.allow && ~ajax_options.allow.indexOf(request.status)) {
            self._compareResults(full_url,data,pass,fail);
          } else {
            fail(result);
          }
        }
        uR.ajax(ajax_options);
      }
      ajax.description = {
        _name: "Ajax " + name,
        title: (full_url != name && full_url),
      }
      return ajax
    }

    _wait() {
      // calls the appropriate wait funciton based on context
      var args = [].slice.apply(arguments);
      var arg0 = args[0];
      if (typeof arg0 == "number") {
        // they are just calling t.wait(ms)
        return this._waitForTime.apply(this,args);
      }
      if (typeof arg0 == "function") {
        return this._waitForFunction.apply(this,args);
      }
      if (typeof arg0 == "string") {
        args[0] = function waitForElement(pass,fail) { return uC.find(arg0,'waiting') }
        args[0]._name = args[0]._description = "waitForElement: "+arg0;
        args[0].details = ["waitForElement",arg0]
        return this._waitForFunction.apply(this,args);
      }
    }

    _waitForTime(ms,s) {
      return function waitForTime(pass,fail) {
        setTimeout(function () {
          pass('waited',ms,s);
        }, ms);
      }
    }

    _waitForFunction(func,_c) {
      // #! TODO: these next lines should be generalized
      var max_ms = (_c||{}).max_ms /* || this.get("max_ms") */ || uC.config.max_ms;
      var interval_ms = (_c||{}).interval_ms /* || this.get("interval_ms") */ || uC.config.interval_ms;
      var self = this;
      function waitForFunction(pass,fail) {
        var name = func._name || func.name;
        var start = new uR.TrueDate();
        self.active_interval = setInterval(function () {
          var out = func();
          if (out) {
            name.startsWith("wait")?pass(name):pass('waitedForFunction',name);
            clearInterval(self.active_interval);
          }
          if (new uR.TrueDate() - start > max_ms) {
            clearInterval(self.active_interval);
            fail(name,new uR.TrueDate() - start);
          }
        }, interval_ms);
      }
      waitForFunction._description = func._description || ("Wait: "+(func._name || func.name)+"()");
      waitForFunction.details = ['waitForFunction',(func._name || func.name)+"()"];
      return waitForFunction;
    }

    _assert(f,name) {
      return function(pass,fail) {
        if (typeof f  == "string") { var qs=f; f = function assertExists() { return uC.find(qs) } }
        var out = f();
        name = name || f.name;
        ((out)?pass:fail)("Asserted",name,out);
      }
    }

    _assertNot(f,name) {
      var self = this;
      return function(pass,fail) {
        if (typeof f  == "string") { var qs=f; f = function assertExists() { return uC.find(qs) } }
        var out = f();
        name = name || f.name;
        ((!out)?pass:fail)("!Asserted",name,out);
      }
    }

    _assertEqual(f,value) {
      function assertEqual(pass, fail) {
        var out = f();
        var name = f.name || f._name;
        ((out == value)?pass:fail)("Equaled",name,out);
      }
      assertEqual._description = "assert: "+f.name+"() == "+value;
      return assertEqual
    }

    _debugger() {
      return function() {
        debugger;
        return true;
      };
    }

    _click(element) {
      function click(pass,fail) {
        element = uC.find(element,'clicked');
        element.click();
        pass("clicked",element._query_selector);
      }
      click._description = "Click: " + (element || "LAST");
      click.details = ["Click",element||LAST]
      return click
    }

    _mouseClick(element,xys,opts) {
      /* Like uR.test.click, but can specify xy with at various positions
         Positions are [[x0,y0],[x1,y1]...] corresponding to:
         [mousedown,mousemove1,mousemove2...mouseup/click]
         mousedown: always the first value
         mousemove(s): everything except the mousedown, possibly []
         mouseup/click: Both events fire in same place, always last value (even xys.length==1)
      */
      opts = opts || {};
      if (xys.length == 2 && typeof xys[0] == "number") {
        xys = [xys];
        var s = `(${xys[0]})`;
      } else {
        // #! TODO if xys.length == 10 show something like `(xy0) 8>> (xy-1)`
        var a = xys[0], b = xys[xys.length-1];
        var s = `(${a[0].toFixed(0)},${a[1].toFixed(0)}) > (${b[0].toFixed(0)},${b[1].toFixed(0)})`;
      }
      function mouseClick(pass,fail) {
        element = uC.find(element,'mouseClicked');

        // if they only want one position, why not let position = [x,y]
        uC.mouse.full(element,'mousedown',xys[0],opts);
        for (var i=1;i<xys.length-1;i++) {
          uC.mouse.full(element,'mousemove',xys[i],opts);
        }
        uC.mouse.full(element,'mousemove',xys[xys.length-1],opts);
        uC.mouse.full(element,'mouseup',xys[xys.length-1],opts);
        uC.mouse.full(element,'click',xys[xys.length-1],opts);

        // in total this is down (1) + move (length) + up (1) + click (1) moves, or length+2
        pass("triggered "+(xys.length+2)+" mouse moves",element)
      }
      mouseClick._name = "mouseClick "+ s;
      return mouseClick;
    }

    _changeValue(element,value) {
      var changeValue = function changeValue(pass,fail) {
        element = uC.find(element,'changed')
        if (value === undefined && element._query_selector) {
          value = this.get(element._query_selector) || "";
        }
        try {
          uC.changeElement(element._query_selector,value);
          pass("changed",element._query_selector);
        } catch(e) {
          fail("Cannot change value on",element,e)
        }
      }.bind(this);
      changeValue._description = "Change: " + element || "LAST";
      changeValue._name = "change";
      changeValue.details = ['uC.changeValue',element]
      return changeValue;
    }
    _changeForm(form_selector,values) {
      var changeForm = function changeForm(pass,fail) {
        if (values) {
          var form = document.querySelector(form_selector);
        } else {
          values = form_selector;
          form = document;
        }
        values = values || this.context.form || this.context;
        if (typeof values == "function") { values = values() }
        var changed = [];
        for (var key in values) {
          var element = uC.changeElement(`${form_selector} [name="${key}"]`,values[key]);
          changed.push(element);
        }
        pass("Changed form",key,changed.length+" elements")
      }
      changeForm._description = "Change Form";
      return changeForm;
    }
    _checkResults(key,value_func) {
      if (typeof key == "function") {
        value_func = key;
        key = value_func._name || value_func.name;
      }
      value_func = value_func || function() {
        var out = uC.find(key,"result");
        return out;
      }
      function checkResults(pass,fail) {
        key = key || uC._last_query_selector;
        var value = value_func();
        // #! TODO: this next line is meant to allow data-target_time to load the textContent by triggering reflow
        // value && value.offsetHeight; // force a reflow to make sure css/text content has been updated
        this._compareResults(key,value,pass,fail);
      }
      checkResults.details = ['checkResults',key||"LAST"]
      return checkResults
    }
    _compareResults(key,value,pass,fail,name) {
      name = name || key
      var composit_key = this.getStateHash(key);
      var old = this.results.get(composit_key);
      if (old && old.dataURL) { old.click = function() { window.open(old.dataURL) } }
      var serialized, match;
      uC.lib.serialize(value).then( serialized => {
        match = old && (old.hash == serialized.hash);
        const diff_links = this.diff_links;
        const alert_opts = {
          series: diff_links,
          series_index: diff_links.length,
          title: this.current_block.message,
        }
        if (match) {
          function f() {
            uC.lib.alertObject(serialized,alert_opts);
          }
          diff_links.push(f);
          var view = {
            click: f,
            className: 'fa fa-search-plus',
            title: "View Details",
          };
          pass("Result: ",name,"is unchanged", view);
        } else {
          function f() {
            uC.lib.alertDiff(old,serialized,alert_opts)
          }
          diff_links.push(f);
          var diff = {
            className: "diff",
            _name: "diff",
            title: "View diff",
            click: f,
          }
          const self = this;
          function replace(){
            self.results.set(composit_key,serialized);
            return "updated!"
          }
          if (uC.CANNONICAL) {
            pass("Result set",name,diff,replace());
          } else {
            pass("WARN","Result changed",name,diff,replace);
            this.replace_links.push(replace);
          }
        }
      })
    }
    _shiftTime(amount,unit) {
      return function shiftTime(pass,fail) {
        // #! TODO the watcheTimers funciton checks all lunch time timers. Should be a generic timeout maybe?
        if (unit)  { // eg `this.shiftTime(1,'days') applies time delta
          TimeShift.setTime(moment().add(amount,unit).valueOf())
          String.lunch.watchTimers() // updates lunchtime display boxes.
          return pass(`Time moved ${amount} ${unit}`);
        }
        // eg `this.shiftTime("2018-01-01")` would change the date
        TimeShift.setTime(moment(amount).valueOf())
        String.lunch.watchTimers()
        return pass(`Time set to ${moment().format("YYYY-MM-DD HH:mm")}`);
      }
    }
    _comment(message) {
      console.warn("uC.Test.comment is depracated in favor of uC.do")
      return this.do(message)
    }
  }
})();
