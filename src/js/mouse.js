(function() {
  uC.mouse = {
    full: function full(node,eventType,xy) {
      // #! TODO: this should use new MouseEvent(eventType) instead
      // right now only does offet, which is all I need. Maybe add more later?
      var rect = node.getBoundingClientRect();
      var event = document.createEvent("MouseEvents");
      event.initMouseEvent(
        eventType,
        true,true,window,null, // canBubble, cancelable, view, detail
        0,0, // screenX, screenY
        Math.ceil(xy[0]+rect.left),Math.ceil(xy[1]+rect.top) // clientX, clientY
      );
      node.dispatchEvent(event);
    },
  }
})();
