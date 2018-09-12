(function() {
const _post = o => Object.assign(o,{
  className: `word ${o.className || ""} ${o.click?"pointer":""}`
})
uC._icons = {
  "WARN": {className: "fa fa-warning",title: "WARNING"},
  "ERROR": {className: "fa fa-error",title: "ERROR"},
  "SUCCESS": {className: "fa fa-check",title: "SUCCESS"},
}
uC.prepDetails = function prepDetails(args,tag) {
  if (!args || args._is_prepped) { return args } // idempotent
  var className = "";
  while (typeof args[0] == "number") { args.shift() } // logger is using this to reassign values. Remove this
  if (uC._icons[args[0]]) {
    className = "k"+args[0].toLowerCase();
    args[0] = Object.assign({},uC._icons[args[0]]);
  }
  var out = args.map(function(word) {
    if (typeof word == "function") {
      return _post({
        className: "function",
        func: word,
        _name: word._name || word.name,
        click: function (e) {
          e.item.click = undefined;
          e.item._name = e.item.func() || e.item._name;
          tag && tag.update()
        },
      })
    } else if (typeof word == "string") {
      var new_word = {
        content: word,
        title: word.title,
        _name: word
      }
      //if (args.length > 1) { new_word._name = (word.length < 30)?word:word.slice(0,15)+"..."; }
      if (word.startsWith("data:image")) {
        new_word.className = "dataURL";
        new_word._name = "dataURL";
        new_word.click = function() { window.open(word); }
      } else {
        const match = u$._reverse(word)
        if (match) {
          new_word.className = "element";
          new_word._name = match;
          new_word.title = word;
        }
      }
      return _post(new_word);
    } else if (word === undefined) {
      return _post({ className: "undefined", _name: "undefined" })
    } else if (Array.isArray(word)) {
      return _post({ className: "array", _name: JSON.stringify(word) })
    }
    return _post(word); // it was something else, hopefully pre-formatted
  });
  out.className = className;
  out._is_prepped = true;
  return out;
}
})();
