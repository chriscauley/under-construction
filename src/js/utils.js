(function() {
  uC.utils = {
    urlToCanvas: function urlToCanvas(url,callback) { // maybe I should use a promise?
      var img = new Image();
      var canvas = document.createElement("canvas");
      img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img,0,0);
        callback(canvas);
      }
      img.src = url;
    },

    // not currently used
    getXPathTo: function getXPathTo(element) { // https://stackoverflow.com/a/2631931
      if (element.id) { return "id("+element.id+")"; }
      if (element === document.body) { return element.tagName }

      var ix = 0;
      if (!element.parentNode) {
        return element.tagName;
      }
      var siblings = element.parentNode.childNodes;
      for (var i=0; i<siblings.length; i++) {
        var s = siblings[i];
        if (s === element) { return uC.utils.getXPathTo(element.parentNode)+"/"+element.tagName+'['+(ix+1)+']'; }
        if (s.nodeType===1 && s.tagName===element.tagName) { ix++ }
      }
    },

    // not currently used
    getSmallXPath: function getSmallXPath(element) {
      return uC.utils.getXPathTo(element).replace(/\/.+\//,'/.../')
    },
  };
  uC.find = function find(element,attr) {
    // #! TODO I'd prefer this to be on uC.Test
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
  }})();
