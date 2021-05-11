var KEY_ESC = 27

function Tooltip ($module) {
  this.$module = $module
}

Tooltip.prototype.init = function () {
  if (!this.$module) {
    return
  }
  this.$module.addEventListener('keyup', this.handleKeyUp.bind(this))
  this.$module.addEventListener('focus', this.handleFocus.bind(this))
  this.$module.addEventListener('blur', this.handleBlur.bind(this))
  this.$module.addEventListener('mouseenter', this.handleMouseEnter.bind(this))
  this.$module.addEventListener('mouseleave', this.handleMouseLeave.bind(this))
}

Tooltip.prototype.makeActive = function () {
  this.$module.setAttribute('tooltip', 'active')
}

Tooltip.prototype.makeInActive = function () {
  this.$module.setAttribute('tooltip', 'inactive')
}

Tooltip.prototype.keyboardEvents = function (event) {
  if (event.keyCode === KEY_ESC) {
    this.makeInActive()
  }
}

Tooltip.prototype.handleKeyUp = function (event) {
  if (event.keyCode === KEY_ESC) {
    this.makeInActive()
  }
}

Tooltip.prototype.handleFocus = function () {
  this.makeActive()
}
Tooltip.prototype.handleBlur = function () {
  this.makeInActive()
}

Tooltip.prototype.handleMouseEnter = function () {
  this.makeActive()
}

Tooltip.prototype.handleMouseLeave = function () {
  this.makeInActive()
}

export default Tooltip
