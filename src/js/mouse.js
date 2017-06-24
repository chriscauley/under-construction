(function() {
  uC.mouse = {
    full: function full(node,eventType,xy) {
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
    },
  }
})();
