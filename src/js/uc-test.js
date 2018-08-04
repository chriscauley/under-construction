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

      this.log = new uR.Log({name: this.name, mount_to: "#command_log_"+this.id});
      this.parent = options.parent;
      this.depth = this.parent?(this.parent.depth+1):0;
      this.step = 0;
      this.delay = 250;
      this.run = this.run.bind(this);
      uC.__selectors = uC.__selectors || {};

      var fnames = [
        'click', 'changeValue', 'changeForm', 'wait','mouseClick', 'assert', 'assertNot', 'assertEqual',
        'route', 'setPathname','setHash','reloadWindow','checkResults', 'debugger', 'ajax', 'shiftTime',
        'comment',
      ];
      uR.forEach(fnames,function(fname) {
        this[fname] = function() {
          let args = arguments;
          let f = this["_"+fname].bind(this);
          if (typeof arguments[0] == "string") { uC.__selectors[arguments[0]] = 1; }
          let f2 = function() {
            return f.apply(this,[].slice.apply(args));
          }.bind(this)
          f2._name = name;
          this.then(f2());
          return this;
        }
        // Because `function.name = fname` does nothing, we need:
        Object.defineProperty(this[fname],'name',{value:fname});
      }.bind(this))

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
      uR.forEach(arguments || [],function(f) {
        var func = (typeof f == 'function')?f:function func() { this.log(f); };
        this.queue.push(func);
        const name = f.description || f._name || f.name;
        this.log(name);
      }.bind(this));
      return this;
    }
    run() {
      uC._current_test = uC._current_test || this;
      var self = this;
      if (this.step == this.queue.length) { clearTimeout(this.fail_timeout); }
      if (this.is_ready && this.step < this.queue.length) {
        if (this.next_move && new uR.TrueDate().valueOf() < this.next_move) {
          setTimeout(this.run, this.next_move - new uR.TrueDate().valueOf())
          return;
        }
        clearTimeout(this.fail_timeout);
        var next = this.queue[this.step]; // this is either a test or a function passed in via then
        function pass(...args) {
          while (args[0] === true) { args.shift() }

          // use current log if no arguments applied
          if (args.length == 0) { args = self.log._logs[self.step]; }

          // if not a warning, mark it a success
          if (args[0] != "WARN") {
            args.unshift("SUCCESS");
            next.status = "success";
          } else {
            next.status = "warning";
          }

          args.unshift(self.step);
          self.log.apply(self,args);
          self.completed.push(next._name || next.name);
          uC.tests.set(self.getStateHash(),next.status);
          self.step++;
          self.next_move = self.delay && (new uR.TrueDate().valueOf() + self.delay);
          self.run();
        }
        if (this.__completed && this.__completed.length) {
          return pass(this.__completed.shift()+" (skipped after reload)")
        }
        function fail(e) {
          var args = [].slice.call(arguments);
          if (args.length == 0) { args = self.log._logs[self.step]; }
          args.unshift("ERROR")
          args.unshift(self.step);
          self.log.apply(self,args);
          self.stop();
          self.mark("error");
          throw e;
        }
        this.fail_timeout = setTimeout(() => fail("Test took longer than "+uC.MAX_PASS_MS+" ms"),uC.MAX_PASS_MS)
        this.status = next.status = 'running';

        var result;
        try { result = (next.start || next.bind(this))(pass,fail); }
        catch (e) { fail(e) }
        result && pass(result); // test functions that return truthy objects move to next test
        konsole.update();
      }
      var counts = {};
      uR.forEach(this.queue,function(q) {
        counts[q.status] = (counts[q.status] || 0) +1;
      });
      if (this.step == this.queue.length) {
        if (counts.success == this.queue.length) {
          this.mark("passed");
          this.parent_pass && this.parent_pass();
          (uC.storage.get("__main__") == this.name) && uC.storage.remove("__main__");
        }
        else if (counts.error) { this.mark("error"); }
        else if (counts.warning) { this.mark("warning"); }
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
      for (var i=0;i<arguments.length;i++) {
        this.queue.push(new this.constructor(arguments[i],{parent: this}));
      }
      return this
    }
    start(pass,fail) {
      window.Date = TimeShift.Date; // might need to be someplace else
      document.body.classList.add(uC.TEST_CLASS)
      uC.__running__ = this;

      // restore halfway results for path changing tests
      this.__completed = uC.storage.get("__completed");
      uC.storage.remove("__completed");

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

    do(message,context={}) { // could this be made int _do and remove wrapper?
      message = message || this.name;
      this.name = this.name || message;
      function f(pass,fail) {
        this.context = context;
        pass("DO",message);
      };
      f._name = "DO "+message;
      this.then(f)
      return this;
    }

    done(message) { //#! TODO is this necessary?
      message = message || this.name;
      function done(pass,fail) {
        pass("DONE", message);
      };
      done._description = "DONE: " + message;
      this.then(done);
      return this;
    }

    /* after this are private methods, eg Test().action(args) is a wrapper around Test().then(_action(args)) */

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
        uR.route(url, {one: { route: pass } });
      }
      route._name = `route to ${url}`;
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
      return function checkResults(pass,fail) {
        key = key || uC._last_query_selector;
        var value = value_func();
        // #! TODO: this next line is meant to allow data-target_time to load the textContent by triggering reflow
        // value && value.offsetHeight; // force a reflow to make sure css/text content has been updated
        this._compareResults(key,value,pass,fail);
      }
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
          title: this.last_comment,
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
        if (unit)  { // eg `this.shiftTime(1,'days') applies time delta
          TimeShift.setTime(moment().add(amount,unit).valueOf())
          return pass(`Time moved ${amount} ${unit}`);
        }
        // eg `this.shiftTime("2018-01-01")` would change the date
        TimeShift.setTime(moment(amount).valueOf())
        return pass(`Time set to ${moment().format("YYYY-MM-DD HH:mm")}`);
      }
    }
    _comment(message) {
      // current sets a line for the sake of setting a line. Maybe merge with Test.test to make for grouping
      function func(pass,fail) {
        this.last_comment = message;
        pass();
      }
      func._name = message
      return func
    }
  }
})();
