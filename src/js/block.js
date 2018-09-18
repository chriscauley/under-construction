uC.Block = class Block {
  constructor({ message = uR.REQUIRED, parent = uR.REQUIRED }) {
    uR.defaults(this, {
      message,
      parent,
      tasks: [],
      hash: objectHash(message),
      uid: "block-" + parent.id + "-" + objectHash(message).slice(0,8),
      step: 0,
    })
  }
  addTask(f) {
    const name = f._description || f._name || f.name || undefined;
    this.tasks.push({
      action: f,
      name: name,
      details: f.details || [name],
    })
  }
  start() {
    let e = document.getElementById(this.uid);
    e && e.classList.add("open")
    this.status = "running"
  }
  finish() {
    let statuses = this.tasks.map(t => t.status).filter(s => s != "success")
    if (!statuses.length) {
      this.status = "success"
      let e = document.getElementById(this.uid);
      e && e.classList.remove("open")
    } else if (statuses.indexOf('error') != -1) { this.status = 'error' }
    else { this.status = statuses[0] }
  }
}
