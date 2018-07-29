window.uC.lib = window.uC.lib || {};

(function() {

uC.lib.truncate = function truncate(string,number) {
  number = number || 16;
  return (string.length > number)?(string.slice(0,number-3)+"..."):string;
}

window.uC.lib.serialize = function serialize(obj) {
  if (obj instanceof HTMLElement && obj.tagName == "CANVAS") {
    var src = obj.toDataURL();
    return {
      type: "image",
      dataURL: src,
      hash: objectHash(src),
      __str__: "<canvas>",
    }
  }
  if (obj instanceof HTMLElement) {
    var out = {
      type: "HTMLElement",
      outerHTML: obj.outerHTML,
      display: uR.escapeHTML(obj.innerText),
      hash: objectHash(obj.outerHTML),
      __str__: "<"+obj.tagName+">",
    }
    html2canvas && html2canvas(obj).then(function(canvas) { out.dataURL = canvas.toDataURL(); });
    return out;
  }
  if (typeof obj == "string") {
    return {
      type: 'string',
      display: obj,
      hash: objectHash(obj),
      __str__: uC.lib.truncate(obj),
    }
  }
  try {
    return {
      type: "json",
      display: JSON.stringify(obj,null,2),
      hash: objectHash(obj),
      __str__: "JSON",
    }
  } catch (e) { }
  return {
    type: "unknown",
    hash: objectHash((obj === undefined)?"undefined":obj),
  }
}

function _compareString(a,b,func) {
  func = func || function(s) { return (s.display === undefined)?s:s.display }
  var comparison = "";
  var diff = JsDiff.diffLines(func(a) || "<i>[EMPTY STRING]</i>",func(b) || "<i>[EMPTY STRING]</i>");
  uR.forEach(diff, function(d) {
    comparison += "<div class='"+(d.added && "added" || d.removed && "removed")+"'>"+d.value+"</div>";
  });
  return "<div class='flexy'><pre>"+comparison+"</pre></div>";
}

uC.lib.alertObject = function alertObject(obj) {
  uC.lib.alertDiff(obj,uC.NO_DIFF);
}


uC.lib.alertDiff = function(old,serialized) {
  const NO_DIFF = serialized === uC.NO_DIFF; // used to unchanged object
  if (NO_DIFF) {
    serialized = old;
    old = undefined;
  }
  old = old || "";
  var tabs = [];
  if (serialized.type == 'string' || serialized.type == 'json') {
    var tabs = [ { title: "diff", innerHTML: _compareString(old,serialized.display) } ];
  } else if (serialized.type == "HTMLElement") {
    var html_beautify = window.html_beautify || function(string) {
      var url = 'https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.7.5/beautify-html.min.js';
      return "No beautifier present, we recommend using "+url;
    }
    // #! TODO: column/row classes should be configurable... maybe?
    var tabs = [
      { title: "html", innerHTML: _compareString(old,serialized,function(s) {
        return uR.escapeHTML(html_beautify(s.outerHTML,{indent_size: 2}))
      }) },
      { title: "text", innerHTML: _compareString(old,serialized) },
    ]
  }
  if (serialized.type == 'image' || serialized.dataURL) {
    var old_canvas,new_canvas;
    function img(url) { return '<img src="'+url+'"/>' }
    const title = NO_DIFF?"datURL":"new dataURL";
    tabs = [{ title: title, innerHTML: img(serialized.dataURL) }].concat(tabs);
    if (old && old.dataURL) {
      tabs.push({ title: "old dataURL", innerHTML: img(old.dataURL) });
      function loadDiffContent(riot_tag) {
        if (!window.pixelmatch) {
          return riot_tag.root.appendChild(uR.newElement("div",{innerHTML: "pixelmatch.js needed for image diff."}))
        }
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
          riot_tag.root.appendChild(diff_canvas);
        }
        uC.utils.urlToCanvas(old.dataURL,function(canvas) { old_canvas = canvas; next(); });
        uC.utils.urlToCanvas(serialized.dataURL,function(canvas) { new_canvas = canvas; next(); });
      }
      tabs.push({ title: "diff dataURL", loadContent: loadDiffContent })
    }
  }
  uR.alertElement("ur-tabs",{ className: "uc default", tabs: tabs });
};
})()
