(function() {
  uC.mouse = {
    full: function full(node,eventType,xy,opts) {
      // #! TODO: this should use new MouseEvent(eventType) instead
      // right now only does offet, which is all I need. Maybe add more later?
      opts = opts || {};
      var rect = node.getBoundingClientRect();
      var event = document.createEvent("MouseEvents");
      event.initMouseEvent(
        eventType,
        true,true,window,null, // canBubble, cancelable, view, detail
        0,0, // screenX, screenY
        Math.ceil(xy[0]+rect.left),Math.ceil(xy[1]+rect.top), // clientX, clientY
        false,false,false,false, // ctrlKey, altKey, shiftKey, metaKey
        opts.button || 0, null // button, relatedTarget
      );
      node.dispatchEvent(event);
    },
  }
})();
