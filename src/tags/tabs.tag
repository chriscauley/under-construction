uR.mount_tabs = true;
uR.ready(function() {
  if (uR._mount_tabs) { riot.mount("ur-tabs"); }
});
<ur-tabs>
  <div class="tab-wrapper">
    <div class="tab-anchors">
      <a onclick={ showTab } each={ tab,i in tabs } title={ tab.title } class={ active: i == this.active }> { tab.title }</a>
    </div>
    <yield />
  </div>

  showTab(e) {
    this.active = e.item.i;
  }

  this.on("mount",function() {
    // this['ur-tabs'].tab will be a single riot tag or an array. we want an array
    this.tabs = this.tags['ur-tab'] || [];
    if (!Array.isArray(this.tabs)) { this.tabs = [this.tabs] }
    uR.forEach(this.opts.tabs || [], function(tab) {
      var e = document.createElement('ur-tab');
      this.root.querySelector(".tab-wrapper").appendChild(e);
      tab.parent = this;
      this.tabs.push(riot.mount(e,tab)[0]);
    }.bind(this))
    uR.forEach(this.tabs,function(tab,i) { tab.index = i; });
    this.active = 0;
    if (uR.config.default_tabs) { this.root.classList.add("default");}
    this.update();
  });
</ur-tabs>

<ur-tab>
  <yield/>

  this.title = this.opts.title || this.title;

  show() {
    this.root.classList.remove("hidden");
    if (this.opts.href && !this.loaded) {
      return this.ajax({
        url: this.opts.href,
        success: function(data,response) { this.root.innerHTML = data.content || response.response; this.loaded = true; }
      });
    }
    this.opts.click && this.opts.click();
  }

  hide() {
    this.root.classList.add("hidden");
  }

  this.on("mount",function() {
    this._parent = this.parent || this.opts.parent;
    if (this.opts.innerHTML) { this.root.innerHTML = this.opts.innerHTML; }
  });

  this.on("update",function() {
    if (!this.parent || this._parent.active == undefined) { return }
    (this._parent.active == this.index?this.show:this.hide)();
  });
</ur-tab>
