uR.ready(function() {
  if (!window.USE_KEY_LOGGER) { return; }
  if (!uR.storage.get("ACTIVE_KONSOLE")) { return; } // eventually needs to be a separate setting
  uR.recorder = new uR.Log({name: "Mouse",update: function() { window.konsole.update() }});
  var l = uR.recorder.log;
  var moves = [];
  var last_target = undefined;
  var last_qs;
  function getMatchingElements(e) {
    if (last_target == e.target) { return last_qs };
    var matches = [];
    for (var key in uC.__selectors) {
      try { e.target.matches(key) &&  matches.push(key) }
      catch(error) { }
    }
    last_target = e.target;
    last_qs = matches.join(", ");
    return last_qs;
  }
  function makeCopy() {
    var _moves = JSON.stringify(moves);
    moves = [];
    return function copy() { uR.alert(_moves) }
  }
  function log(e) {
    moves.length && l(moves.length + " moves",makeCopy());
    l(e.type,[e.layerX,e.layerY],getMatchingElements(e));
  }
  function log_moves(e) {
    if (e.target != last_target) { moves.push(getMatchingElements(e)) }
    moves.push([e.layerX,e.layerY]);
  }
  document.addEventListener("mousedown",log);
  document.addEventListener("mouseup",log)
  document.addEventListener("mousemove",log_moves)
});
