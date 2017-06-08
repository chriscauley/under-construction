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
  /* end utils.js */

  uC.test = {
    setPath: function setPath(pathname,hash) {
      // #! BROKE
      // this should be moved in as an initialization variable (comment parameter?) on
      return uC.test.watch(function () {
        hash = hash || "#";
        if (pathname != window.location.pathname ||
            hash != window.location.has) {
          window.location = pathname + (hash || "#");
        }
        return true;
      });
    },

    wait: function wait(ms,s) {
      return function() {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            konsole.log('waited',ms,s);
            resolve();
          }, ms);
        });
      }
    },

    when: function when(funcs,ms,max_ms) {
      // we can take an array or a function
      if (typeof funcs == "function") { funcs = [funcs] }
      var func_names = funcs.map((f) => f.name||"(anon)").join("|");
      ms = ms || 20; // how often to check
      max_ms = max_ms || 5000; // how long before fail
      return function() {
        return new Promise(function (resolve, reject) {
          var start = new Date();
          var interval = setInterval(function () {
            if (new Date() - start > max_ms) {
              konsole.log("rejected ",new Date() - start);
              clearInterval(interval);
            }
            uR.forEach(funcs,function(f) {
              var out = f();
              if (out) {
                konsole.log('when '+f.name);
                resolve(out);
                clearInterval(interval)
              }
            });
          }, ms);
        });
      }
    },

    waitFor: function waitFor(qS,ms,max_ms) {
      ms = ms || 100;
      max_ms = max_ms || 1500;
      return uC.test.when(function waitFor(){ return document.querySelector(qS) },ms,max_ms);
    },

    is: function exists(f) { // broken
      return uC.test.watch(f).then(
        function() { konsole.log("test pass: "+f.name) },
        function() { konsole.log("test fail: "+f.name) }
      )
    },
    assert: function(f) {
      return function(resolve,reject) { //#! TODO How do I resolve/reject?
        var out = f();
        if (out) {
          konsole.log("ASSERT",f.name,out);
        } else {
          konsole.error("ASSERT",f.name,out);
          console.error("failed!");
        }
      }
    },
    click: function click(element) {
      return function(resolve,reject) {
        var qs = element;
        element = (element instanceof HTMLElement)?element:document.querySelector(element);
        try {
          element.click();
        } catch(e) {
          (typeof reject === "function") && reject(e);
          konosle.error(qs,"element not found");
          throw e;
        }
        konsole.log("clicked",getSmallXPath(element));
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
        element = (element instanceof HTMLElement)?element:document.querySelector(element);

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
      return function(resolve,reject) {
        if (element instanceof HTMLElement) {
          var qs = getSmallXPath(element);
        } else {
          // not sure if I like this...
          // basically element can be a selector or HTMLElement, might just make it selector from
          // here on out
          var qs = element;
          value = value || this.get(qs);
          element = document.querySelector(qs);
        }
        try {
          element.value = value;
          element.dispatchEvent(new Event("change"));
        } catch(e) {
          (typeof reject === "function") && reject(e);
          throw e;
        }
        konsole.log("changed",getSmallXPath(element));
      }.bind(this);
    },
    Test: class Test {
      constructor(f) {
        this.name = f.name;
        this._main = f;
        this.run = this.run.bind(this); // got to proxy it so riot doesn't steal it

        var fnames = ['click','changeValue','when','wait','waitFor','mouseClick','assert'];
        uR.forEach(fnames,function(fname) {
          this[fname] = function() {
            this.promise = this.promise.then(uC.test[fname].apply(this,[].slice.apply(arguments)));
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
          konsole.log("DO",message);
        }.bind(this));
        return this;
      }

      then(f,context_override) {
        // pass through to Promise.then
        // #! TOOD: needs a method to override default context of function
        this.promise = this.promise.then(f)
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
        this.then(function() {
          konsole.log("DONE", message)
          this.contexts.pop(); // maybe store this somewhere to display in konsole?
        }.bind(this));
        return this;
      }
    }
  }
})();
