window.uC.lib = window.uC.lib || {};

(function() {
//old serializer function using canvas/img ... will be used again someday
/*window.uC.lib.serialize = function serialize(element,old) {
  var value = element;
  var match = old == value;
  if (value instanceof HTMLElement || value instanceof SVGElement) {
    match = element.outerHTML == (old && old.outerHTML);
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
      match = value.dataURL == old.dataURL; // outerHTML does nothing for canvas/img
      value.click = function() { window.open(value.dataURL) }
      value.title = "View result in new window"
    } else if (element.tagName.toLowerCase() == "svg") {
      value.outerHTML = value.outerHTML.replace(/id="[^"]"/g,""); // svgs have random ids throughout
      var svg = new Blob([value.outerHTML],{type: 'image/svg+xml'});
      uC.utils.urlToCanvas(URL.createObjectURL(svg),function(canvas) {
        value.dataURL = canvas.toDataURL();
      });
      value.click = function() { window.open(value.dataURL) }
      value.title = "View result in new window"
      match = element.outerHTML == (old && old.outerHTML);
    }
  } else if (typeof value == "string" && value.startsWith("data")) {
    console.error("move dataURL functionality from konsole into here");
  }
  return [value,match]
}*/

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
    return {
      type: "HTMLElement",
      outerHTML: obj.outerHTML,
      display: uR.escapeHTML(obj.innerText),
      hash: objectHash(obj.outerHTML),
      __str__: "<"+obj.tagName+">",
    }
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
  func = func || function(s) { return s.display || s; }
  var comparison = "";
  var diff = JsDiff.diffLines(func(a) || "<i>[EMPTY STRING]</i>",func(b) || "<i>[EMPTY STRING]</i>");
  uR.forEach(diff, function(d) {
    comparison += "<div class='"+(d.added && "added" || d.removed && "removed")+"'>"+d.value+"</div>";
  });
  return "<div class='flexy'><pre>"+comparison+"</pre></div>";
}

uC.lib.alertObject = function alertObject(obj) {
  if (obj.type == "json") {
    var tabs = [{ title: "json", innerHTML: "<pre>" + obj.display + "</pre>" }]
  }
  if (obj.type == "string") { throw("Not Implemented #! TODO"); }
  if (obj.type == "HTMLElement") { throw("Not Implemented #! TODO"); }
  if (obj.type == "image") { throw("Not Implemented #! TODO"); }
  uR.alertElement("ur-tabs", { className: "uc default", tabs: tabs });
}


uC.lib.alertDiff = function(old,serialized) {
  old = old || "";
  if (serilized.type == 'string' || serialized.type == 'json') {
    var tabs = [ { title: "diff", innerHTML: _compareString(old,serialized.display) } ];
  } else if (serialized.type == "HTMLElement") {
    // #! TODO: column/row classes should be configurable... maybe?
    var tabs = [
      { title: "html", innerHTML: _compareString(old,serialized,function(s) {
        return uR.escapeHTML(html_beautify(s.outerHTML,{indent_size: 2}))
      }) },
      { title: "text", innerHTML: _compareString(old,serialized) },
    ]
  } else if (serialized.type == 'image') {
    if (!old || !old.dataURL) { // empty image
      old = { dataURL: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" };
    }
    if (!window.pixelmatch) {
      uR.alert("Unable to diff because pixelmatch is not installed");
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
      function img(url) { return '<img src="'+url+'"/>' }
      uR.alertElement("ur-tabs", {
        className: 'uc default',
        tabs: [
          { title: "difference", innerHTML: img(diff_canvas.toDataURL()) },
          { title: "old", innerHTML: img(old.dataURL) },
          { title: "new", innerHTML: img(serialized.dataURL) },
        ]
      });
    }
    uC.utils.urlToCanvas(old.dataURL,function(canvas) { old_canvas = canvas; next(); });
    uC.utils.urlToCanvas(serialized.dataURL,function(canvas) { new_canvas = canvas; next(); });
    return; // alert tabs happens after both images load, so exit
  }
  uR.alertElement("ur-tabs",{ className: "uc default", tabs: tabs });
};

window.uC.lib.diff = (function() {
  class Diff {
    constructor(a,b) {
      this.a = a;
      this.b = b;
    }
    compare() {
      return a == b;
    }
  }
  class DataURL extends Diff {
    prepareDiff(callback) {
      var a_canvas,b_canvas;
      function next() {
        if (!this.a_canvas || !this.b_canvas) { return }
        var width = Math.max(this.b_canvas.width,this.a_canvas.width);
        var height = Math.max(this.b_canvas.height,this.a_canvas.height);
        this.diff_canvas = document.createElement("canvas");
        diff_canvas.width = width;
        diff_canvas.height = height;
        var diff_ctx = diff_canvas.getContext("2d");
        var diff = diff_ctx.createImageData(width,height);
        pixelmatch(
          this.a_canvas.getContext("2d").getImageData(0,0,width,height).data,
          this.b_canvas.getContext("2d").getImageData(0,0,width,height).data,
          diff.data,
          width,
          height,
          {thresha:0}
        )
        diff_ctx.putImageData(diff,0,0);
        callback()
      }
      uC.utils.urlToCanvas(a.dataURL,function(canvas) { this.a_canvas = canvas; next(); });
      uC.uitls.urlToCanvas(b.dataURL,function(canvas) { this.b_canvas = canvas; next(); });
    }
    alertDiff() {
      if (!this.a_canvas && ! this.b_canvas) { return this.prepareDiff(this.alertDiff); }
      uR.alertElement("ur-tabs",{
        tabs: [
          { title: "Old", innerHTML: `<img src="${this.a_canvas.toDataURL()}" />` },
          { title: "New", innerHTML: `<img src="${this.b_canvas.toDataURL()}" />` },
          { title: "Diff", innerHTML: `<img src="${this.diff_canvas.toDataURL()}" />` },
        ]
      })
    }
  }
  return {
    DataURL: DataURL,
    HTMLElement: HTMLElement,
  }
})()

})()
