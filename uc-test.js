(function() {

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

  uC.test = {
    setPath: function setPath(pathname,hash) { // broke
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
              console.error("["+func_names+"] failed at "+max_ms);
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
      console.log(qS);
      return uC.test.when(function waitFor(){ return document.querySelector(qS) },ms,max_ms);
    },

    is: function exists(f) { // broken
      return uC.test.watch(f).then(
        function() { konsole.log("test pass: "+f.name) },
        function() { konsole.log("test fail: "+f.name) }
      )
    },
    watchFor: function watchFor(querySelector) { // broken
      var f = function() { return document.querySelector(querySelector) }
      return function() { return uC.test.watch(f,{name: "watchFor "+querySelector}); }
    },
    click: function click(element) {
      return function(resolve,reject) {
        element = (element instanceof HTMLElement)?element:document.querySelector(element);
        try {
          element.click();
        } catch(e) {
          (typeof reject === "function") && reject(e);
          throw e;
        }
        konsole.log("clicked",getSmallXPath(element));
      }
    },
    changeValue: function changeValue(element,value) {
      return function(resolve,reject) {
        element = (element instanceof HTMLElement)?element:document.querySelector(element);
        try {
          element.value = value;
          element.dispatchEvent(new Event("change"));
        } catch(e) {
          (typeof reject === "function") && reject(e);
          throw e;
        }
        konsole.log("changed",getSmallXPath(element));
      };
    },
    Test: class Test {
      constructor(name) {
        konsole.clear();
        konsole.log(name);
        this.promise = Promise.resolve(function() { return true });
        document.querySelector("konsole [title=Logs]").click();
        
        //uR.forEach(fnames,function(fname) {
          //this[fname] = function
        //})
      }
      click(qS) {
        this.promise = this.promise.then(uC.test.click(qS));
        return this;
      }
      changeValue(qS,value) {
        this.promise = this.promise.then(uC.test.changeValue(qS,value));
        return this;
      }
      when(f) {
        this.promise = this.promise.then(uC.test.when(f));
        return this;
      }
      wait() {
        this.promise = this.promise.then(uC.test.wait.apply(this,[].slice.apply(arguments)));
        return this;
      }
      waitFor() {
        this.promise = this.promise.then(uC.test.waitFor.apply(this,[].slice.apply(arguments)));
        return this
      }
    }
  }
})();
