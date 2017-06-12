(function() {

  /* this may be better in a utils file */
  /* begin utils.js */
  function getXPathTo(element) { // https://stackoverflow.com/a/2631931
    if (element.id) { return "id("+element.id+")"; }
    if (element === document.body) { return element.tagName }

    var ix = 0;
    if (!element.parentNode) {
      return element.tagName;
    }
    var siblings = element.parentNode.childNodes;
    for (var i=0; i<siblings.length; i++) {
      var s = siblings[i];
      if (s === element) { return getXPathTo(element.parentNode)+"/"+element.tagName+'['+(ix+1)+']'; }
      if (s.nodeType===1 && s.tagName===element.tagName) { ix++ }
    }
  }

  function getSmallXPath(element) {
    return getXPathTo(element).replace(/\/.+\//,'/.../')
  }

  function triggerMouseEvent(node,eventType,xy) {
    // right now only does offet, which is all I need. Maybe add more later?
    var rect = node.getBoundingClientRect();
    var event = document.createEvent("MouseEvents");
    event.initMouseEvent(
      eventType,
      true,true,window,null, // canBubble, cancelable, view, detail
      0,0, // screenX, screenY
      xy[0]+rect.left,xy[1]+rect.top // clientX, clientY
    );
    node.dispatchEvent(event);
    konsole.log("triggerMouseEvent",eventType,xy)
  }

  uC.find = function find(element,attr) {
    // #! TODO I'd prefer this to be on uC.test.Test, but uC.test.FUNCTION uses it heavily it has to be here for now
    /* A wrapper around document.querySelector that takes a wide variety of arguments
       element === undefined: Use last known active element
       typeof element == "string": Run document.querySelector (maybe someday uC.test.root.querySelector)
       else: element should be an HTMLElement
    */
    element = element || uC._last_active_element;
    if (typeof element == "string") {
      uC._last_query_selector  = element;
      element = document.querySelector(element);
      if (element) { element._query_selector = uC._last_query_selector; }
    }
    element && element.setAttribute("uc-state",attr);
    uC._last_active_element = element;
    return element
  }

  /* end utils.js */

  uC.test = {

    setPath: function setPath(pathname,hash) {
      return uC.test.watch(function () {
        hash = hash || "#";
        if (pathname != window.location.pathname ||
            hash != window.location.has) {
          window.location = pathname + (hash || "#");
        }
        return true;
      });
    },

    waitForTime: function waitForTime(ms,s) {
      return function waitForTime() {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            if (s !== null) { konsole.log('waited',ms,s); }
            resolve();
          }, ms);
        });
      }
    },

    waitForFunction: function waitForFunction(func,_c) {
      // #! TODO: these next lines should be generalized
      var max_ms = (_c||{}).max_ms /* || this.get("max_ms") */ || uC.config.max_ms;
      var interval_ms = (_c||{}).interval_ms /* || this.get("interval_ms") */ || uC.config.interval_ms;
      return function waitForFunction() {
        return new Promise(function (resolve, reject) {
          var start = new Date();
          var interval = setInterval(function () {
            var out = func();
            if (out) {
              konsole.log('waitForFunction',func.name);
              resolve(out);
              clearInterval(interval)
              return out
            }
            if (new Date() - start > max_ms) {
              konsole.error(func.name,new Date() - start);
              reject()
              clearInterval(interval);
            }
          }, interval_ms);
        });
      }
    },

    wait: function wait() {
      var args = [].slice.apply(arguments);
      var arg0 = args[0];
      if (typeof arg0 == "number") {
        // they are just calling t.wait(ms)
        return uC.test.waitForTime.apply(this,args);
      }
      if (typeof arg0 == "function") {
        return uC.test.waitForFunction.apply(this,args);
      }
      if (typeof arg0 == "string") {
        args[0] = function waitForElement() { return uC.find(arg0,'waiting') }
        return uC.test.waitForFunction.apply(this,args);
      }
    },

    assert: function(f,name) {
      return function(resolve,reject) { //#! TODO How do I resolve/reject?
        var out = f();
        name = name || f.name;
        if (out) {
          konsole.log("ASSERT",name,out);
        } else {
          konsole.error("ASSERT",name,out);
          console.error("Assertion failed at "+name);
        }
      }
    },

    assertEqual: function(f,value) {
      return uC.test.assert(function assertEqual() { return f() == value } );
    },

    click: function click(element) {
      return function(resolve,reject) {
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
    },

    mouseClick: function(element,positions) {
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

        triggerMouseEvent(element,'mousedown',positions[0]);
        for (var i=1;i<positions.length;i++) {
          triggerMouseEvent(element,'mousemove',positions[i]);
        }
        triggerMouseEvent(element,'mouseup',positions[positions.length-1]);
        triggerMouseEvent(element,'click',positions[positions.length-1]);
      }
    },

    changeValue: function changeValue(element,value) {
      if (!value) { // one argument means set last element value to first argument
        value = element;
        element = undefined;
      }
      return function(resolve,reject) {
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
          konosle.error("Cannot change value on",element)
          throw e;
        }
        konsole.log("changed",element._query_selector);
      }.bind(this);
    },
    Test: class Test {
      constructor(f,config) {
        this.config = config || { wait_ms: 1000 };
        this.name = f._name || f.name;
        this._main = f;
        this.run = this.run.bind(this); // got to proxy it so riot doesn't steal it

        var fnames = [
          'click','changeValue','wait','waitForTime','waitForFunction','mouseClick','assert', 'assertEqual','setPath'
        ];
        uR.forEach(fnames,function(fname) {
          this[fname] = function() {
            var f = uC.test[fname];
            var f2 = f.apply(this,[].slice.apply(arguments));
            f2._name = name;
            this.then(f2);
            return this;
          }
          // Because `function.name = fname` does nothing, we need:
          Object.defineProperty(this[fname],'name',{value:fname});
        }.bind(this))
      }

      run() {
        this.promise = Promise.resolve(function() { return true });
        this.contexts = [];
        this._main(this);
      }

      waitForThenClick() {
        var args = [].slice.apply(arguments);
        return this.wait.apply(this,args).click.apply(this,args);
      }

      get(key) {
        var i = this.contexts.length;
        while (i--) {
          if (this.contexts[i][key]) { return this.contexts[i][key] }
        }
      }

      do(message,context) {
        this.then(function() {
          this.contexts.push(context || {});
          konsole.clear();
          konsole.log("DO",message);
        });
        return this;
      }

      then(f,context_override) {
        // pass through to Promise.then
        // #! TOOD: needs a method to override default context of function
        var name = f._name || f.name;
        if (this.config.wait_ms && name && !name.match(/^(wait|done$)/)) { this.wait(this.config.wait_ms); }
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

      done(message) {
        this.then(function done() {
          konsole.log("DONE", message)
          this.contexts.pop(); // maybe store this somewhere to display in konsole?
        });
        return this;
      }
    }
  }
})();
