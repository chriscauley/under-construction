<uc-command class="ur-accord" id={ command.uid }>
  <div class="ur-accord-toggle" onclick={ accord(command.uid) }></div>
  <div class="ur-accord-header ur-line { command.status }">
    <i class={ getIcon(command) }></i>
    { command.name }
    <div class="icons right">
      <i class="fa fa-play-circle" onclick={ start }></i>
      <i class="fa fa-trash" onclick={ clear }></i>
      <i class="fa fa-edit" if={ command.edit } onclick={ command.edit }></i>
    </div>
    <a class="pointer" onclick={ replaceAll } if={ command.replace_links.length }>
      <b>Replace All ({ command.replace_links.length })</b>
    </a>
  </div>
  <div class="ur-accord-content">
    <div each={ block,ib in command.blocks } key={ block.hash } class="block ur-accord"
         id={ block.uid }>
      <div class="ur-accord-toggle" onclick={ accord(block.uid) }></div>
      <div class="ur-accord-header ur-line { block.status }">
        <i class={ getIcon(block) }></i>
        <b>{ block.message }</b>
      </div>
      <ul class="ur-accord-content">
        <li each={ task, it in block.tasks } class="{ task.status } ur-line">
          <span each={ word in task.details } if={ word } onclick={ word.click } title={ word.title }
                class={ word.className }>{ word._name }</span>
        </li>
      </ul>
    </div>
  </div>

accord(key) {
  return () => document.getElementById(key).classList.toggle("open")
}
const _icons = {
  passed: "check",
  success: "check",
  warn: "warning",
  running: "spinner",
}
getIcon(item) {
  return "fa fa-"+(_icons[item.status] || item.status || "question-circle-o")
}

this.on("before-mount",function() { this.command = opts.command; })
this.on("mount",() => { this.update() })
this.on("update",() => {
  this.command.blocks.forEach(block => {
    block.tasks.forEach(task => {
      task.details = uC.prepDetails(task.details,this) // nb: prepDetails is idempotent
    })
  })
})

start(e) { this.command.start() }
clear(e) {
  this.command.mark("");
  this.command.reset();
  (uC.storage.get("__name__") == this.command.name) && uC.storage.remove("__main__");
}

replaceAll(e) {
  Array.from(this.root.querySelectorAll(".warning .function")).map(e => {
    e.click();
    this.command.replace_links.shift();
  });
}
</uc-command>
