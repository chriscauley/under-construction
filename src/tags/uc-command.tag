<uc-command>
  <div class="ur-accord" each={ command in uC.commands } id={ command.uid }>
    <div class="ur-accord-header { command.status }">
      <i class="fa fa-plus-circle ur-accord-open" onclick={ accord(command.uid) }></i>
      <i class="fa fa-minus-circle ur-accord-close" onclick={ accord(command.uid) }></i>
      { command.name }
      <div class="icons right">
        <i class="fa fa-play-circle" onclick={ parent.parent.parent.run }></i>
        <i class="fa fa-trash" onclick={ parent.parent.parent.clear }></i>
        <i class="fa fa-edit" if={ command.edit } onclick={ command.edit }></i>
      </div>
      <a class="pointer" onclick={ parent.parent.parent.replaceAll } if={ command.replace_links.length }>
        <b>Replace All ({ command.replace_links.length })</b>
      </a>
    </div>
    <div class="ur-accord-content">
      <div each={ block,ib in command.blocks } key={ block.hash } class="block ur-accord" id={ block.uid }>
        <div class="ur-accord-header">
          <i class="fa fa-plus-circle ur-accord-open" onclick={ accord(block.uid) }></i>
          <i class="fa fa-minus-circle ur-accord-close" onclick={ accord(block.uid) }></i>
          <b>{ block.message }</b>
        </div>
        <ul class="ur-accord-content">
          <li each={ task, it in block.tasks } class="k{ task.status }">
            <span each={ d in task.details } onclick={ d.click } title={ d.title }
                  class={ d.className }>{ d && d._name }</span>
          </li>
        </ul>
      </div>
    </div>
  </div>

accord(key) {
  return () => document.getElementById(key).classList.toggle("closed")
}
this.on("before-mount",function() { this.command = opts.command })
this.on("mount",() => { this.update() })
this.on("update",() => {
  this.command.blocks.forEach(block => {
    block.tasks.forEach(task => {
      task.details = uC.prepDetails(task.details,this) // nb: prepDetails is idempotent
    })
  })
})

</uc-command>
