uR.ready(function() {
  if (!uR.storage.get("ACTIVE_KONSOLE")) { return; } // eventually needs to be a separate setting
  if (!window.KLOGGER_SELECTOR) { return; }
  var klogger_target = document.querySelector(window.KLOGGER_SELECTOR);
  if (!klogger_target) { return console.warn("konsole logger cannot find target"); }
  uR.recorder = new uR.Log({name: "Mouse",update: function() { window.konsole.update() }});
  var l = uR.recorder;
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
    if (matches.length) {
      last_target = e.target;
      last_qs = matches.join(", ");
      return last_qs;
    }
  }
  function makeCopy() {
    var _moves = JSON.stringify(moves);
    moves = [];
    return function copy() { uR.alert(_moves) }
  }
  function log(e) {
    if (!config.get(e.type)) { return }
    config.get("mousemove") && moves.length && l(moves.length + " moves",makeCopy());
    l(e.type,[e.layerX,e.layerY],getMatchingElements(e));
  }
  function log_moves(e) {
    if (!config.get("mousemove")) { return }
    if (e.target != last_target) { moves.push(getMatchingElements(e)) }
    moves.push([e.layerX,e.layerY]);
  }
  var schema = [];
  for (var type of ["mousedown","mouseup","click","change"]) {
    document.addEventListener(type,log);
    schema.push({ type: 'boolean', value: true, name: type, required: false })
  }
  var config = uR.recorder.config = new uR.Config("ur-recorder",schema);
  document.addEventListener("mousemove",log_moves)
});
