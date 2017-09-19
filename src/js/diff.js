window.uC.lib = window.uC.lib || {};

window.uC.lib.serialize = function serialize(element,old) {
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
}

window.uC.lib.showDiff = function(old,serialized) {
  if (!old.dataURL || !serialized.dataURL) {
    alert("Currently can only diff two images, sorry");
    throw "Not Implemented";
  }
  if (!window.pixelmatch) {
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
    window.open(diff_canvas.toDataURL());
  }
  uC.utils.urlToCanvas(old.dataURL,function(canvas) { old_canvas = canvas; next(); });
  uC.utils.urlToCanvas(serialized.dataURL,function(canvas) { new_canvas = canvas; next(); });
}

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
  function dataURL(a,b) {
  }
  return {
    dataURL: dataURL,
    HTMLElement: HTMLElement,
  }
})();

