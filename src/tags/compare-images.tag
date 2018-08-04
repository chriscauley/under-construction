<compare-images>
  <div class="controls" if={ images.length != 1 }>
    <button each={ image in images } onclick={ selectImage } class={ image.btnClass }>
      { image.name }
    </button>
  </div>
  <div class="image-wrapper">
    <div class="images" style="height: {height}px;width: {width}px;">
      <img onload={ ()=> update() } each={ image in images } src={ image.src } class={ image.imgClass } />
    </div>
  </div>
  <script>
this.on("before-mount", () => {
  const names = opts.image_names || []
  this.selected = 0
  this.images = this.opts.images.map((image,index) => {
    if (typeof image == "string") { image = { src: image } }
    if (typeof image == "function") {
      const f = image
      image = { }
      f(element => {
        // element can be <canvas> or <img>
        image.src = element.toDataURL?element.toDataURL():element.src
        this.update()
      })
    }
    image.name = image.name || names[index] || `Image: #${index}`
    image.index = index
    return image
  })
})

this.on("mount",function() { this.update() })

this.on("update", function() {
  this.width = this.height = 0 // because images can be added dynamically, recheck size every time
  const imgs = this.root.querySelectorAll(".images img")
  this.images.forEach((image,index) => {
    if (image.index == this.selected) {
      image.imgClass = "selected"
      image.btnClass = "btn btn-primary selected"
    } else {
      image.imgClass = ""
      image.btnClass = "btn btn-default"
    }
    let img = imgs[index]
    if (img) {
      this.height = Math.max(this.height,img.height)
      this.width = Math.max(this.width,img.width)
    }
  })
})

selectImage(e) {
  this.selected = e.item.image.index
}
  </script>

<style>
  :scope {
    display: block;
    height: 100%;
    overflow: hidden;
  }
  :scope .image-wrapper {
    padding-bottom: 40px; /* so that the controls don't make the bottom of the image cut off*/
    height: 100%;
    overflow: auto;
    width: 100%;
  }
  :scope .images { position: relative; }
  :scope .images img {
    left: 0;
    position: absolute;
    top: 0;
    z-index: 0;
  }
  :scope .images img.selected {
    z-index: 1;
  }
</style>
</compare-images>