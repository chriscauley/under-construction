(function () {
  uC.BaseTest = class BaseTest {
    constructor() {
      /* arguments can be functions or an options object
         if functions, they are bound and exectuted at the end of this constructor
         if it's a string, the test will take that as the name
      */
      var self = this;
      var options = {};
      var functions = [];
      this.data = {};
      this.context = {};
      uR.forEach(arguments,function(arg) {
        if (typeof arg == "object") { options = arg }
        if (typeof arg == 'function') { functions.push(arg) }
        if (typeof arg == 'string') { self.name = arg };
      });
      this.queue = [];  // functions/test to execute
      this.completed = []; // strings of completed queue objects
      this.name = this.name || (functions.length?functions[0].name:(options.name || "UNNAMED"));
      this.parent = options.parent;
      this.depth = this.parent?(this.parent.depth+1):0;
      this.step = 0;
      this.delay = 250;
      this.run = this.run.bind(this);
      uC.__selectors = uC.__selectors || {};

      var fnames = [
        'click', 'changeValue', 'changeForm', 'wait','mouseClick', 'assert', 'assertNot', 'assertEqual', 'setPath',
        'checkResults', 'debugger', 'ajax'
      ];
      uR.forEach(fnames,function(fname) {
        this[fname] = function() {
          var args = arguments;
          var f = this["_"+fname].bind(this);
          if (typeof arguments[0] == "string") { uC.__selectors[arguments[0]] = 1; }
          var f2 = function() {
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
      this.getStateHash()
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

    log() {
      console.log.apply(this,[this.indent()].concat(Array.prototype.slice.call(arguments)));
    }
    error() {
      //console.error.apply(this,arguments);
    }
    indent() { return Array(this.depth+1).join("|"); }
    then() {
      uR.forEach(arguments || [],function(f) {
        var func = (typeof f == 'function')?f:function func() { this.log(f); };
        this.queue.push(func);
      }.bind(this));
      return this;
    }
    run() {
      uC._current_test = uC._current_test || this;
      var self = this;
      if (this.is_ready && this.step < this.queue.length) {
        if (this.next_move && new Date().valueOf() < this.next_move) {
          setTimeout(this.run, this.next_move - new Date().valueOf())
          return;
        }
        var next = this.queue[this.step]; // this is either a test or a function passed in via then
        function resolve(options) {
          options = options || {};
          next.status = options.status || "complete";
          self.completed.push(next._name || next.name);
          uC.tests.set(self.getStateHash(),next.status);
          self.step++;
          self.next_move = self.delay && new Date().valueOf() + self.delay;
          self.run();
        }
        function reject(e) {
          console.error(e);
        }
        var next = this.queue[this.step];
        this.status = next.status = 'running';

        var result;
        try {
          result = (next.start || next.bind(this))(resolve,reject);
        } catch(e) {
          reject(e);
        }
        result && resolve(result); // test functions that return truthy objects move to next test
        konsole.update();
      }
      if (this.step == this.queue.length && this.queue.length) {
        this.queue[this.queue.length-1].status = "passed";
        this.mark('passed');
        this.parent_resolve && parent_resolve;
      }
    }
    mark(status) {
      this.status = status;
      uC.tests.set(this.name,status);
      (uC.storage.get("__main__") == this.name) && uC.storage.set("__main__",null)
      this.is_ready = false;
      konsole.update();
    }
    test() {
      for (var i=0;i<arguments.length;i++) {
        this.queue.push(new this.constructor(arguments[i],{parent: this}));
      }
      return this
    }
    start(resolve,reject) {
      this.resolve = resolve || this.resolve;
      this.reject = reject || this.reject;
      this.is_ready = true;
      this.run.bind(this)()
    }
    stop() { this.is_ready = false; }
  }

  uC.Test = class Test extends uC.BaseTest {
    waitForThenClick() {
      var args = [].slice.apply(arguments);
      return this.wait.apply(this,args).click.apply(this,args);
    }

    do(message,context) {
      message = message || this.name;
      function f(resolve,reject) {
        this.context = context || {};
        konsole.clear();
        konsole.log("DO",message);
        resolve();
      };
      f._name = "DO "+message;
      this.then(f)
      return this;
    }

    done(message) {
      message = message || this.name;
      function done(resolve,reject) {
        konsole.log("DONE", message);
        resolve();
      };
      done._description = "DONE: " + message;
      this.then(done);
      return this;
    }

    /* after this are private methods, eg Test().action(args) is a wrapper around Test().then(_action(args)) */

    _setPath(pathname,hash) {
      if (!hash && ~pathname.indexOf("#")) {
        [pathname,hash] = pathname.split("#");
      }
      return function (resolve, reject) {
        hash = hash || "#";
        if (!hash.indexOf("#") == 0) { hash = "#" + hash }
        if (pathname != window.location.pathname || hash != window.location.hash) {
          // this needs to set some kind of "resume" mark first
          window.location = pathname + hash;
        } else {
          return true;
        }
      };
    }

    _ajax(ajax_options,callback) {
      return function _ajax(resolve, reject) {
        if (typeof ajax_options == "string") { ajax_options = { url: ajax_options } }
        var success = ajax_options.success || function() {};
        ajax_options.success = function(data,request) {
          success(data,request);
          (callback(data,request)?resolve:reject)();
        }
        uR.ajax(ajax_options);
      }
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
        args[0] = function waitForElement(resolve,reject) { return uC.find(arg0,'waiting') }
        args[0]._name = args[0]._description = "waitForElement: "+arg0;
        return this._waitForFunction.apply(this,args);
      }
    }

    _waitForTime(ms,s) {
      return function waitForTime(resolve,reject) {
        setTimeout(function () {
          if (s !== null) { konsole.log('waited',ms,s); }
          resolve();
        }, ms);
      }
    }

    _waitForFunction(func,_c) {
      // #! TODO: these next lines should be generalized
      var max_ms = (_c||{}).max_ms /* || this.get("max_ms") */ || uC.config.max_ms;
      var interval_ms = (_c||{}).interval_ms /* || this.get("interval_ms") */ || uC.config.interval_ms;
      var self = this;
      function waitForFunction(resolve,reject) {
        var name = func._name || func.name;
        var start = new Date();
        var interval = setInterval(function () {
          var out = func();
          if (out) {
            konsole.log('waitForFunction',name);
            clearInterval(interval);
            resolve(out);
          }
          if (new Date() - start > max_ms) {
            self.mark('failed');
            konsole.error(name,new Date() - start);
            reject();
            clearInterval(interval);
          }
        }, interval_ms);
      }
      waitForFunction._description = func._description || ("Wait: "+(func._name || func.name)+"()");
      return waitForFunction;
    }

    _assert(f,name) {
      return function(resolve,reject) {
        if (typeof f  == "string") { var qs=f; f = function assertExists() { return uC.find(qs) } }
        var out = f();
        name = name || f.name;
        if (out) {
          konsole.log("ASSERT",name,out);
          resolve(out);
        } else {
          konsole.error("ASSERT",name,out);
          console.error("Assertion failed at "+name);
          reject();
        }
      }
    }

    _assertNot(f,name) {
      // this may seem silly, but it's really useful because it's often times hard to flip the sign of the assertion function
      return function(resolve,reject) {
        if (typeof f  == "string") { var qs=f; f = function assertExists() { return uC.find(qs) } }
        var out = f();
        name = name || f.name;
        if (!out) {
          konsole.log("!ASSERTNOT",name,out);
          resolve()
        } else {
          konsole.error("ASSERTNOT",name,out);
          console.error("Assert not failed at "+name);
          reject();
        }
      }
    }

    _assertEqual(f,value) {
      function assertEqual(resolve, reject) {
        var out = f();
        var name = f.name || f._name;
        if (out == value) {
          konsole.log("EQUALS",name,out);
          resolve();
        } else {
          konsole.error("EQUALS",name,value+" != "+out);
          console.error("Equals failed at "+name);
          reject();
        }
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
      function click(resolve,reject) {
        element = uC.find(element,'clicked');
        try {
          element.click();
          resolve();
        } catch(e) {
          (typeof reject === "function") && reject(e);
          konsole.error(uC._last_query_selector,"element not found");
          reject(e);
        }
        konsole.log("clicked",element._query_selector);
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
      function mouseClick(resolve,reject) {
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
        konsole.log("triggered "+(xys.length+2)+" mouse moves",element)
        return true;
      }
      mouseClick._name = "mouseClick "+ s;
      return mouseClick;
    }

    _changeValue(element,value) {
      var changeValue = function changeValue(resolve,reject) {
        element = uC.find(element,'changed')
        if (element._query_selector) {
          value = value || this.get(element._query_selector);
        }
        try {
          element.value = value;
          element.dispatchEvent(new Event("change"));
          element.dispatchEvent(new Event("blur"));
          konsole.log("changed",element._query_selector);
          resolve(element);
        } catch(e) {
          (typeof reject === "function") && reject(e);
          konsole.error("Cannot change value on",element)
          reject(e);
        }
      }.bind(this);
      changeValue._description = "Change: " + element || "LAST";
      changeValue._name = "change";
      return changeValue;
    }
    _changeForm(values) {
      var changeForm = function changeForm(resolve,reject) {
        values = values || this.context.form || this.context;
        var changed = [];
        for (var key in values) {
          try {
            var element = document.querySelector(key);
            element.value = values[key];
            element.dispatchEvent(new Event("change"));
            element.dispatchEvent(new Event("blur"));
            changed.push(element);
          } catch (e) {
            console.error("failed updating for "+key);
            reject(e);
            return;
          }
        }
        return changed.length && changed;
      }
      changeForm._description = "Change Form";
      return changeForm;
    }
    _checkResults(key,value_func) {
      value_func = value_func || function() {
        var out = uC.find(key,"result");
        return out;
      }
      return function checkResults(resolve,reject) {
        key = key || uC._last_query_selector;
        var value = value_func();
        var composit_key = this.getStateHash(key);
        var old = uC.results.get(composit_key);
        if (old && old.dataURL) { old.click = function() { window.open(old.dataURL) } }
        var serialized, match;
        serialized = uC.lib.serialize(value); // convert it to a serialized object
        match = old && (old.hash == serialized.hash);
        if (match) {
          konsole.log("Result: ",composit_key," is unchanged");
        } else {
          var diff = {
            className: "diff",
            _name: "diff",
            title: "View diff",
            click: function() { uC.lib.showDiff(old,serialized); },
          }
          function replace(){
            uC.results.set(composit_key,serialized);
            return "updated!"
          }
          konsole.warn("Result changed",key,diff,replace);
        }
        resolve();
      }
    }
  }
})();
