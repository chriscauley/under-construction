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
}
