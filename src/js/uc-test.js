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
      this.queue = [];
      this.name = this.name || (functions.length?functions[0].name:(options.name || "UNNAMED"));
      this.parent = options.parent;
      this.depth = this.parent?(this.parent.depth+1):0;
      this.step = 0;
      this.run = this.run.bind(this);

      var fnames = [
        'click', 'changeValue', 'wait','mouseClick', 'assert', 'assertNot', 'assertEqual', 'setPath', 'checkResults',
        'debugger', 'ajax'
      ];
      uR.forEach(fnames,function(fname) {
        this[fname] = function() {
          var args = arguments;
          var f = this["_"+fname].bind(this);
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
      this.is_ready = true;
      //this.depth && console.log("");
      while (this.is_ready && this.step < this.queue.length) {
        var next = this.queue[this.step];
        (next.run || next.bind(this))(this); // this is either a test or a function passed in via then
        ++this.step;
      }
    }
    test() {
      for (var i=0;i<arguments.length;i++) {
        this.queue.push(new this.constructor(arguments[i],{parent: this}));
      }
      return this
    }
    start() { this.run.bind(this)() }
    stop() { this.is_ready = false; }
  }

  uC.Test = class Test extends uC.BaseTest {
    waitForThenClick() {
      var args = [].slice.apply(arguments);
      return this.wait.apply(this,args).click.apply(this,args);
    }

    do(message,context) {
      function f() {
        this.context = context || {};
        konsole.clear();
        konsole.log("DO",message);
      };
      f._name = "DO "+message;
      this.then(f)
      return this;
    }

    done(message) {
      function done() {
        konsole.log("DONE", message)
      };
      done._description = "DONE: " + message;
      this.then(done);
      return this;
    }

    /* after this are private methods, eg Test().action(args) is a wrapper around Test().then(_action(args)) */

    _setPath(pathname,hash) {
      return function () {
        hash = hash || "#";
        if (pathname != window.location.pathname || hash != window.location.has) {
          //window.location = pathname + (hash || "#");
        }
        return true;
      };
    }

    _ajax(ajax_options,callback) {
      return function _ajax() {
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
        args[0] = function waitForElement() { return uC.find(arg0,'waiting') }
        args[0]._name = args[0]._description = "waitForElement: "+arg0;
        return this._waitForFunction.apply(this,args);
      }
    }

    _waitForTime(ms,s) {
      var self = this;
      return function waitForTime() {
        self.stop();
        setTimeout(function () {
          if (s !== null) { konsole.log('waited',ms,s); }
          self.start();
        }, ms);
      }
    }

    _waitForFunction(func,_c) {
      // #! TODO: these next lines should be generalized
      var max_ms = (_c||{}).max_ms /* || this.get("max_ms") */ || uC.config.max_ms;
      var interval_ms = (_c||{}).interval_ms /* || this.get("interval_ms") */ || uC.config.interval_ms;
      var self = this;
      function waitForFunction() {
        self.stop();
        var name = func._name || func.name;
        var start = new Date();
        var interval = setInterval(function () {
          var out = func();
          if (out) {
            konsole.log('waitForFunction',name);
            self.start();
            clearInterval(interval)
            return out
          }
          if (new Date() - start > max_ms) {
            konsole.error(name,new Date() - start);
            clearInterval(interval);
          }
        }, interval_ms);
      }
      waitForFunction._description = func._description || ("Wait: "+(func._name || func.name)+"()");
      return waitForFunction;
    }

    _assert(f,name) {
      return function() { //#! TODO How do I resolve/reject?
        if (typeof f  == "string") { var qs=f; f = function assertExists() { return uC.find(qs) } }
        var out = f();
        name = name || f.name;
        if (out) {
          konsole.log("ASSERT",name,out);
        } else {
          konsole.error("ASSERT",name,out);
          console.error("Assertion failed at "+name);
          this.stop();
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
        } else {
          konsole.error("ASSERTNOT",name,out);
          console.error("Assert not failed at "+name);
          this.stop();
        }
      }
    }

    _assertEqual(f,value) {
      function assertEqual() {
        var out = f();
        var name = f.name || f._name;
        if (out == value) {
          konsole.log("EQUALS",name,out);
        } else {
          konsole.error("EQUALS",name,value+" != "+out);
          console.error("Equals failed at "+name);
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
      function click() {
        element = uC.find(element,'clicked');
        try {
          element.click();
        } catch(e) {
          (typeof reject === "function") && reject(e);
          konsole.error(uC._last_query_selector,"element not found");
          throw e;
        }
        konsole.log("clicked",element._query_selector);
      }
      click._description = "Click: " + (element || "LAST");
      return click
    }

    _mouseClick(element,positions) {
      /* Like uR.test.click, but can specify xy with at various positions
         Positions are [[x0,y0],[x1,y1]...] corresponding to:
         [mousedown,mousemove1,mousemove2...mouseup/click]
         mousedown: always the first value
         mousemove(s): everything except the mousedown, possibly []
         mouseup/click: Both events fire in same place, always last value (even positions.length==1)
      */
      return function(resolve,reject) {
        element = uC.find(element,'mouseClicked');

        // if they only want one position, why not let position = [x,y]
        if (positions.length == 2 && typeof positions[0] == "number") { positions = [positions] }
        uC.mouse.full(element,'mousedown',positions[0]);
        for (var i=1;i<positions.length-1;i++) {
          uC.mouse.full(element,'mousemove',positions[i]);
        }
        uC.mouse.full(element,'mousemove',positions[positions.length-1]);
        uC.mouse.full(element,'mouseup',positions[positions.length-1]);
        uC.mouse.full(element,'click',positions[positions.length-1]);

        // in total this is down (1) + move (length) + up (1) + click (1) moves, or length+2
        konsole.log("triggered "+positions.length+2+" mouse moves",element)
      }
    }

    _changeValue(element,value) {
      var changeValue = function changeValue() {
        element = uC.find(element,'changed')
        if (element._query_selector) {
          value = value || this.get(element._query_selector);
        }
        try {
          element.value = value;
          element.dispatchEvent(new Event("change"));
          element.dispatchEvent(new Event("blur"));
        } catch(e) {
          (typeof reject === "function") && reject(e);
          konsole.error("Cannot change value on",element)
          throw e;
        }
        konsole.log("changed",element._query_selector);
      }.bind(this);
      changeValue._description = "Change: " + element || "LAST";
      changeValue._name = "change";
      return changeValue;
    }

    _checkResults(key,value_func) {
      value_func = value_func || function() {
        var out = uC.find(key,"result");
        key = key || uC._last_query_selector;
        return out;
      }
      return function(resolve,reject) {
        var value = value_func();
        var old = uC.results.get(key);
        if (old && old.dataURL) { old.click = function() { window.open(old.dataURL) } }
        var serialized, match;
        serialized = uC.lib.serialize(value); // convert it to a serialized object
        match = old && (old.hash == serialized.hash);
        if (match) {
          konsole.log(`Result: ${key} is unchanged`);
        } else {
          var diff = {
            className: "diff",
            _name: "diff",
            title: "View diff in new window",
            click: function() { uC.lib.showDiff(old,serialized); },
          }
          function replace(){
            uC.results.set(key,serialized);
            return "updated!"
          }
          konsole.warn("Result changed",key,old,serialized,diff,replace);
        }
      }
    }
  }
})();

/*(function() {
  uC.Test = class Test {
    constructor(f,config) {
      this.config = config || { wait_ms: 100 };
      this.name = f._name || f.name;
      this._main = f;
      this.run = this.run.bind(this); // got to proxy it so riot doesn't steal it
      this.data = {};

    }

    run() {
      this.promise = Promise.resolve(true);
      this.contexts = [];
      this._main(this);
      this.ur_status = uR.config.btn_warning; // eventually we'll use something like uC.css, which can be imported dynamically
      this.then(this.stop);
      konsole.update()
    }

    stop() {
      return function stop() {
        this.ur_status = uR.config.btn_success;
        konsole.update();
      }
    }


    then(f,context_override) {
      // pass through to Promise.then
      // #! TOOD: needs a method to override default context of function
      var name = f._name || f.name;
      if (this.config.wait_ms && name && !name.match(/^(wait|done$|stop$)/)) { this.wait(this.config.wait_ms); }
      this.promise = this.promise.then(f.bind(this));
      return this;
    }

    test(f,context_override) {
      // execute a sub test
      this.promise.then(function() {
        f(this);
      }.bind(this),context_override);
      return this;
    }

  }
});
*/
