uR.mount_tabs = true;
uR.ready(function() {
  if (uR._mount_tabs) { riot.mount("ur-tabs"); }
});
<ur-tabs>
  <div class="tab-anchors">
    <a onclick={ showTab } each={ tab,i in tabs } title={ tab.title } class={ active: i == this.active }> { tab.title }</a>
  </div>
  <yield />

  showTab(e) {
    this.active = e.item.i;
  }

  this.on("mount",function() {
    // this['ur-tabs'].tab will be a single riot tag or an array. we want an array
    this.tabs = this.tags['ur-tab'];
    if (this.tabs && !this.tabs[0]) { this.tabs = [this.tabs] }
    uR.forEach(this.tabs,function(tab,i) { tab.index = i; });
    this.active = 0;
    if (uR.config.default_tabs) { this.root.classList.add("default");}
    this.update();
  });
</ur-tabs>

<ur-tab>
  <yield/>

  this.title = this.opts.title;

  show() {
    this.root.classList.remove("hidden");
    if (this.loaded) { return }
    if (this.opts.href) {
      this.ajax({
        url: this.opts.href,
        success: function(data,response) { this.root.innerHTML = data.content || response.response; this.loaded = true; }
      });
    }
    this.opts.click && this.opts.click();
  }

  hide() {
    this.root.classList.add("hidden");
  }

  this.on("update",function() {
    if (this.parent.active == undefined) { return }
    (this.parent.active == this.index?this.show:this.hide)();
  });
</ur-tab>
