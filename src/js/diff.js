window.uC.lib = window.uC.lib || {};

(function() {

uC.lib.truncate = function truncate(string,number) {
  number = number || 16;
  return (string.length > number)?(string.slice(0,number-3)+"..."):string;
}

window.uC.lib.serialize = function serialize(obj) {
  const resolve = function(obj) {
    return Promise.resolve(obj)
  }
  if (obj instanceof HTMLElement && obj.tagName == "CANVAS") {
    var src = obj.toDataURL();
     return resolve({
      type: "image",
      dataURL: src,
      hash: objectHash(src),
      __str__: "<canvas>",
    })
  }
  else if (obj instanceof HTMLElement) {
    var out = {
      type: "HTMLElement",
      outerHTML: obj.outerHTML,
      display: uR.escapeHTML(obj.innerText),
      __str__: "<"+obj.tagName+">",
    }
    return new Promise((resolve,reject) => {
      html2canvas && html2canvas(obj,uC.html2canvas_opts).then(function(canvas) {
        out.dataURL = canvas.toDataURL()
        out.hash = objectHash(out.dataURL)
        resolve(out)
      });
    })
  }
  else if (typeof obj == "string") {
    return resolve({
      type: 'string',
      display: obj,
      hash: objectHash(obj),
      __str__: uC.lib.truncate(obj),
    })
  }
  else try {
    return resolve({
      type: "json",
      display: JSON.stringify(obj,null,2),
      hash: objectHash(obj),
      __str__: "JSON",
    })
  } catch (e) { }
  return resolve({
    type: "unknown",
    hash: objectHash((obj === undefined)?"undefined":obj),
  })
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

uC.lib.alertObject = function alertObject(obj,opts={}) {
  uC.lib.alertDiff(obj,uC.NO_DIFF,opts);
}


uC.lib.alertDiff = function(old,serialized,opts={}) {
  const NO_DIFF = serialized === uC.NO_DIFF; // used to unchanged object
  if (NO_DIFF) {
    serialized = old;
    old = undefined;
  }
  old = old || "";
  var tabs = [];
  const images = []
  const image_names = []
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
    images.push(serialized.dataURL)
    image_names.push("New Image")
    if (old && old.dataURL) {
      images.push(old.dataURL)
      image_names.push("Old Image")
      function loadDiffContent(callback) {
        if (!window.pixelmatch) {
          console.error("Pixel match not loaded")
          return
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
            // #! TODO in an ideal world, we wouldn't use a threshold of 0
            // but since the comparative hash is based off the dataURL,
            // a single pixel difference of #000001 will trigger the test to fail
            // pixelmatch needs to reflect that
          )
          diff_ctx.putImageData(diff,0,0);
          callback(diff_canvas)
        }
        uC.utils.urlToCanvas(old.dataURL,function(canvas) { old_canvas = canvas; next(); });
        uC.utils.urlToCanvas(serialized.dataURL,function(canvas) { new_canvas = canvas; next(); });
      }
      images.push(loadDiffContent)
      image_names.push("Difference")
    }
  }
  images.length && tabs.unshift({
    title: "images",
    loadContent: (tag) => uR.newElement(
      "compare-images",
      { parent: tag.root, innerHTML: 'monkey' },
      { images: images, image_names: image_names }
    ),
  })
  uR.alertElement("ur-tabs",{
    className: "uc default",
    tabs: tabs,
    one: {
      mount: function() {
        const parent = this.root.querySelector(".tab-wrapper")
        if (opts.series) {
          const links = opts.series;
          const index = opts.series_index;
          if (index) {
            uR.newElement("div",{
              parent: parent,
              onclick: links[index-1],
              className: "link link-prev fa fa-chevron-left",
            })
          }
          if (links[index+1]) {
            uR.newElement("div",{
              parent: parent,
              onclick: links[index+1],
              className: "link link-next fa fa-chevron-right",
            })
          }
        }
        if (opts.title) {
          uR.newElement("div",{
            parent: parent,
            className: "diff-title",
            innerText: opts.title,
          })
        }
      }
    }
  });
};
})()
