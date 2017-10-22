(function() {
  function log(e) {
    if (false) { return; }
    var matches = [];
    for (var key in uC.__selectors) {
      if (e.target.matches(key)) { matches.push(key) }
    }
    console.log(e.type,e.layerX,e.layerY,matches.join(", "));
  }
  document.addEventListener("mousedown",log);
  document.addEventListener("mouseup",log)
})();
