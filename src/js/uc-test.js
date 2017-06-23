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

  function urlToCanvas(url,callback) { // maybe I should use a promise?
    var img = new Image();
    var canvas = document.createElement("canvas");
    img.onload = function() {
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img,0,0);
      callback(canvas);
    }
    img.src = url;
  }

  /* end utils.js */

  uC.Test = class Test {
    constructor(f,config) {
      this.config = config || { wait_ms: 100 };
      this.name = f._name || f.name;
      this._main = f;
      this.run = this.run.bind(this); // got to proxy it so riot doesn't steal it

      var fnames = [
        'click', 'changeValue', 'wait', 'mouseClick', 'assert', 'assertEqual', 'setPath', 'checkResults',
        'debugger', 'ajax'
      ];
      uR.forEach(fnames,function(fname) {
        this[fname] = function() {
          var f = this["_"+fname];
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
      this.promise = Promise.resolve(true);
      this.contexts = [];
      uC.storage.set("__main__",this._main.name);
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

    getLocal(key) {
      return this.contexts[this.contexts.length-1][key];
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

    done(message) {
      this.then(function done() {
        konsole.log("DONE", message)
        this.contexts.pop(); // maybe store this somewhere to display in konsole?
      });
      return this;
    }

    /* after this are private methods, eg Test().action(args) is a wrapper around Test().then(_action(args)) */

    _setPath(pathname,hash) {
      return function () {
        hash = hash || "#";
        if (pathname != window.location.pathname || hash != window.location.has) {
          window.location = pathname + (hash || "#");
        }
        return true;
      };
    }

    _ajax(ajax_options,callback) {
      return function _ajax() {
        return new Promise(function(resolve,reject) {
          if (typeof ajax_options == "string") { ajax_options = { url: ajax_options } }
          var success = ajax_options.success || function() {};
          ajax_options.success = function(data,request) {
            success(data,request);
            (callback(data,request)?resolve:reject)();
          }
          uR.ajax(ajax_options);
        });
      }
    }

    _waitForTime(ms,s) {
      return function waitForTime() {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            if (s !== null) { konsole.log('waited',ms,s); }
            resolve();
          }, ms);
        });
      }
    }

    _waitForFunction(func,_c) {
      // #! TODO: these next lines should be generalized
      var max_ms = (_c||{}).max_ms /* || this.get("max_ms") */ || uC.config.max_ms;
      var interval_ms = (_c||{}).interval_ms /* || this.get("interval_ms") */ || uC.config.interval_ms;
      return function waitForFunction() {
        var name = func._name || func.name;
        return new Promise(function (resolve, reject) {
          var start = new Date();
          var interval = setInterval(function () {
            var out = func();
            if (out) {
              konsole.log('waitForFunction',name);
              resolve(out);
              clearInterval(interval)
              return out
            }
            if (new Date() - start > max_ms) {
              konsole.error(name,new Date() - start);
              reject()
              clearInterval(interval);
            }
          }, interval_ms);
        });
      }
    }

    _wait() {
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
        args[0]._name = "waitForElement "+arg0;
        return this._waitForFunction.apply(this,args);
      }
    }

    _assert(f,name) {
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
    }

    _assertEqual(f,value) {
      return this._assert(function assertEqual() { return f() == value } );
    }

    _debugger() {
      return function() {
        debugger;
        return true;
      };
    }

    _click(element) {
      return function click(resolve,reject) {
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

        triggerMouseEvent(element,'mousedown',positions[0]);
        for (var i=1;i<positions.length;i++) {
          triggerMouseEvent(element,'mousemove',positions[i]);
        }
        triggerMouseEvent(element,'mouseup',positions[positions.length-1]);
        triggerMouseEvent(element,'click',positions[positions.length-1]);

        // in total this is down (1) + move (length) + up (1) + click (1) moves, or length+2
        konsole.log("triggered "+positions.length+2+" mouse moves",element)
      }
    }

    _changeValue(element,value) {
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
          konsole.error("Cannot change value on",element)
          throw e;
        }
        konsole.log("changed",element._query_selector);
      }.bind(this);
    }

    _checkResults(key,value_func) {
      return function(resolve,reject) {
        var value = value_func();
        var old = uC.results.get(key);
        if (old.dataURL) { old.click = function() { window.open(old.dataURL) } }
        var match = old != value;
        if (value instanceof HTMLElement || value instanceof SVGElement) {
          var element = value;
          match = element.outerHTML == old.outerHTML;
          var value = {
            outerHTML: element.outerHTML,
            className: "HTMLElement",
            _name: "<"+element.tagName+">",
          }
          if (["img","canvas"].indexOf(element.tagName.toLowerCase()) != -1) {
            var canvas = document.createElement("canvas");
            canvas.width = element.width;
            canvas.height = element.height;
            canvas.getContext("2d").drawImage(element,0,0);
            value.dataURL = canvas.toDatURL();
            match = value.dataURL = old.dataURL; // outerHTML does nothing for canvas/img
            value.click = function() { window.open(value.dataURL) }
            value.title = "View result in new window"
          } else if (element.tagName.toLowerCase() == "svg") {
            value.outerHTML = value.outerHTML.replace(/id="[^"]"/g,""); // svgs have random ids throughout
            var svg = new Blob([value.outerHTML],{type: 'image/svg+xml'});
            urlToCanvas(URL.createObjectURL(svg),function(canvas) {
              value.dataURL = canvas.toDataURL();
            });
            value.click = function() { window.open(value.dataURL) }
            value.title = "View result in new window"
            match = element.outerHTML == old.outerHTML;
          }
        }
        if (match) {
          konsole.log("Result: "+key,value);
        } else {
          var diff = {
            className: "diff",
            _name: "diff",
            title: "View diff in new window",
            click: function() {
              if (!old.dataURL || !value.dataURL) {
                alert("Currently can only diff two images, sorry");
                throw "Not Implemented";
              }
              if (!window.pixelmatch) {
                throw "Attempted to diff images w/o pixelmatch";
              }
              var old_canvas,new_canvas;
              function next() {
                if (!old_canvas || !new_canvas) { return }
                var width = Math.max(new_canvas.width,old_canvas.width);
                var height = Math.max(new_canvas.height,old_canvas.height);
                var diff_canvas = document.createElement("canvas");
                diff_canvas.width = width;
                diff_canvas.height = height;
                var diff_ctx = diff_canvas.getContext("2d");
                var diff = diff_ctx.createImageData(width,height);
                pixelmatch(
                  old_canvas.getContext("2d").getImageData(0,0,width,height).data,
                  new_canvas.getContext("2d").getImageData(0,0,width,height).data,
                  diff.data,
                  width,
                  height,
                  {threshold:0}
                )
                diff_ctx.putImageData(diff,0,0);
                window.open(diff_canvas.toDataURL());
              }
              urlToCanvas(old.dataURL,function(canvas) { old_canvas = canvas; next(); });
              urlToCanvas(value.dataURL,function(canvas) { new_canvas = canvas; next(); });
            }
          }
          function replace(){
            uC.results.set(key,value);
            return "updated!"
          }
          konsole.warn("Result changed",key,old,value,diff,replace);
        }
      }
    }
  }
})();
