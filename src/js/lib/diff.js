window.uC.lib = window.uC.lib || {};

window.uC.lib.serialize = function serialize(value) {
  if (value instanceof HTMLElement || value instanceof SVGElement) {
    var element = value;
    match = element.outerHTML == old.outerHTML;
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
      match = value.dataURL = old.dataURL; // outerHTML does nothing for canvas/img
      value.click = function() { window.open(value.dataURL) }
      value.title = "View result in new window"
    } else if (element.tagName.toLowerCase() == "svg") {
      value.outerHTML = value.outerHTML.replace(/id="[^"]"/g,""); // svgs have random ids throughout
      var svg = new Blob([value.outerHTML],{type: 'image/svg+xml'});
      urlToCanvas(URL.createObjectURL(svg),function(canvas) {
        value.dataURL = canvas.toDataURL();
      });
      value.click = function() { window.open(value.dataURL) }
      value.title = "View result in new window"
      match = element.outerHTML == old.outerHTML;
    }
  }
  return value
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
      urlToCanvas(a.dataURL,function(canvas) { this.a_canvas = canvas; next(); });
      urlToCanvas(b.dataURL,function(canvas) { this.b_canvas = canvas; next(); });
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

