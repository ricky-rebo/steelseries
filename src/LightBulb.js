import {
  rgbToHsl,
  createBuffer,
  getCanvasContext,
  isHexColor,
  getColorValues
} from './utils/tools'

// TODO fix screw image (and extracxt SVG paths from code ?)

export const Lightbulb = function (canvas, parameters) {
  // Get the canvas context
  const mainCtx = getCanvasContext(canvas)

  // Parameters
  parameters = parameters || {}
  const width = undefined === parameters.width
    ? mainCtx.canvas.width
    : parameters.width
  const height = undefined === parameters.height
    ? mainCtx.canvas.height
    : parameters.height
  let glowColor = undefined === parameters.glowColor
    ? '#ffff00'
    : parameters.glowColor

  // Get the size
  mainCtx.canvas.width = width
  mainCtx.canvas.height = height

  // Constants
  const size = Math.min(width, height)

  // Internal variables
  let initialized = false
  let lightOn = false
  let alpha = 1

  // **************   Buffer creation  ********************
  // Off bulb buffer
  const offBuffer = createBuffer(size, size)
  const offCtx = offBuffer.getContext('2d')

  // On bulb buffer
  const onBuffer = createBuffer(size, size)
  const onCtx = onBuffer.getContext('2d')

  // Lightbulb screw buffer
  const screwBuffer = createBuffer(size, size)
  const screwCtx = screwBuffer.getContext('2d')

  // **************   Image creation  ********************
  const drawBulbOn = function (ctx) {
    const data = getColorValues(glowColor)
    const red = data[0]
    const green = data[1]
    const blue = data[2]
    const hsl = rgbToHsl(red, green, blue)

    ctx.save()

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    ctx.beginPath()
    ctx.moveTo(0.289473 * size, 0.438596 * size)
    ctx.bezierCurveTo(0.289473 * size, 0.561403 * size, 0.385964 * size, 0.605263 * size, 0.385964 * size, 0.745614 * size)
    ctx.bezierCurveTo(0.385964 * size, 0.745614 * size, 0.587719 * size, 0.745614 * size, 0.587719 * size, 0.745614 * size)
    ctx.bezierCurveTo(0.587719 * size, 0.605263 * size, 0.692982 * size, 0.561403 * size, 0.692982 * size, 0.438596 * size)
    ctx.bezierCurveTo(0.692982 * size, 0.324561 * size, 0.605263 * size, 0.22807 * size, 0.5 * size, 0.22807 * size)
    ctx.bezierCurveTo(0.385964 * size, 0.22807 * size, 0.289473 * size, 0.324561 * size, 0.289473 * size, 0.438596 * size)
    ctx.closePath()

    const glassOnFill = ctx.createLinearGradient(0, 0.289473 * size, 0, 0.701754 * size)
    if (red === green && green === blue) {
      glassOnFill.addColorStop(0, 'hsl(0, 60%, 0%)')
      glassOnFill.addColorStop(1, 'hsl(0, 40%, 0%)')
    } else {
      glassOnFill.addColorStop(0, `hsl(${hsl[0] * 255}, ${hsl[1] * 100}%, 70%)`)
      glassOnFill.addColorStop(1, `hsl(${hsl[0] * 255}, ${hsl[1] * 100}%, 80%)`)
    }

    ctx.fillStyle = glassOnFill

    // sets shadow properties
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 30
    ctx.shadowColor = glowColor

    ctx.fill()

    ctx.lineCap = 'butt'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 0.008771 * size
    ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.4)`
    ctx.stroke()

    ctx.restore()
  }

  const drawBulbOff = function (ctx) {
    ctx.save()

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0.289473 * size, 0.438596 * size)
    ctx.bezierCurveTo(0.289473 * size, 0.561403 * size, 0.385964 * size, 0.605263 * size, 0.385964 * size, 0.745614 * size)
    ctx.bezierCurveTo(0.385964 * size, 0.745614 * size, 0.587719 * size, 0.745614 * size, 0.587719 * size, 0.745614 * size)
    ctx.bezierCurveTo(0.587719 * size, 0.605263 * size, 0.692982 * size, 0.561403 * size, 0.692982 * size, 0.438596 * size)
    ctx.bezierCurveTo(0.692982 * size, 0.324561 * size, 0.605263 * size, 0.22807 * size, 0.5 * size, 0.22807 * size)
    ctx.bezierCurveTo(0.385964 * size, 0.22807 * size, 0.289473 * size, 0.324561 * size, 0.289473 * size, 0.438596 * size)
    ctx.closePath()

    const glassOffFill = ctx.createLinearGradient(0, 0.289473 * size, 0, 0.701754 * size)
    glassOffFill.addColorStop(0, '#eeeeee')
    glassOffFill.addColorStop(0.99, '#999999')
    glassOffFill.addColorStop(1, '#999999')

    ctx.fillStyle = glassOffFill
    ctx.fill()
    ctx.lineCap = 'butt'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 0.008771 * size
    ctx.strokeStyle = '#cccccc'
    ctx.stroke()
    ctx.restore()
    ctx.restore()
  }

  const drawScrew = function (ctx) {
    ctx.save()

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    ctx.beginPath()
    ctx.moveTo(0.350877 * size, 0.333333 * size)
    ctx.bezierCurveTo(0.350877 * size, 0.280701 * size, 0.41228 * size, 0.236842 * size, 0.5 * size, 0.236842 * size)
    ctx.bezierCurveTo(0.578947 * size, 0.236842 * size, 0.64035 * size, 0.280701 * size, 0.64035 * size, 0.333333 * size)
    ctx.bezierCurveTo(0.64035 * size, 0.385964 * size, 0.578947 * size, 0.429824 * size, 0.5 * size, 0.429824 * size)
    ctx.bezierCurveTo(0.41228 * size, 0.429824 * size, 0.350877 * size, 0.385964 * size, 0.350877 * size, 0.333333 * size)
    ctx.closePath()

    const highlight = ctx.createLinearGradient(0, 0.245614 * size, 0, 0.429824 * size)
    highlight.addColorStop(0, '#ffffff')
    highlight.addColorStop(0.99, 'rgba(255, 255, 255, 0)')
    highlight.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = highlight
    ctx.fill()
    ctx.restore()

    // winding
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0.377192 * size, 0.745614 * size)
    ctx.bezierCurveTo(0.377192 * size, 0.745614 * size, 0.429824 * size, 0.72807 * size, 0.491228 * size, 0.72807 * size)
    ctx.bezierCurveTo(0.561403 * size, 0.72807 * size, 0.605263 * size, 0.736842 * size, 0.605263 * size, 0.736842 * size)
    ctx.lineTo(0.605263 * size, 0.763157 * size)
    ctx.lineTo(0.596491 * size, 0.780701 * size)
    ctx.lineTo(0.605263 * size, 0.798245 * size)
    ctx.lineTo(0.596491 * size, 0.815789 * size)
    ctx.lineTo(0.605263 * size, 0.833333 * size)
    ctx.lineTo(0.596491 * size, 0.850877 * size)
    ctx.lineTo(0.605263 * size, 0.868421 * size)
    ctx.lineTo(0.596491 * size, 0.885964 * size)
    ctx.lineTo(0.605263 * size, 0.894736 * size)
    ctx.bezierCurveTo(0.605263 * size, 0.894736 * size, 0.570175 * size, 0.95614 * size, 0.535087 * size, 0.991228 * size)
    ctx.bezierCurveTo(0.526315 * size, 0.991228 * size, 0.517543 * size, size, 0.5 * size, size)
    ctx.bezierCurveTo(0.482456 * size, size, 0.473684 * size, size, 0.464912 * size, 0.991228 * size)
    ctx.bezierCurveTo(0.421052 * size, 0.947368 * size, 0.394736 * size, 0.903508 * size, 0.394736 * size, 0.903508 * size)
    ctx.lineTo(0.394736 * size, 0.894736 * size)
    ctx.lineTo(0.385964 * size, 0.885964 * size)
    ctx.lineTo(0.394736 * size, 0.868421 * size)
    ctx.lineTo(0.385964 * size, 0.850877 * size)
    ctx.lineTo(0.394736 * size, 0.833333 * size)
    ctx.lineTo(0.385964 * size, 0.815789 * size)
    ctx.lineTo(0.394736 * size, 0.798245 * size)
    ctx.lineTo(0.377192 * size, 0.789473 * size)
    ctx.lineTo(0.394736 * size, 0.771929 * size)
    ctx.lineTo(0.377192 * size, 0.763157 * size)
    ctx.lineTo(0.377192 * size, 0.745614 * size)
    ctx.closePath()

    const winding = ctx.createLinearGradient(0.473684 * size, 0.72807 * size, 0.484702 * size, 0.938307 * size)
    winding.addColorStop(0, '#333333')
    winding.addColorStop(0.04, '#d9dad6')
    winding.addColorStop(0.19, '#e4e5e0')
    winding.addColorStop(0.24, '#979996')
    winding.addColorStop(0.31, '#fbffff')
    winding.addColorStop(0.4, '#818584')
    winding.addColorStop(0.48, '#f5f7f4')
    winding.addColorStop(0.56, '#959794')
    winding.addColorStop(0.64, '#f2f2f0')
    winding.addColorStop(0.7, '#828783')
    winding.addColorStop(0.78, '#fcfcfc')
    winding.addColorStop(1, '#666666')
    ctx.fillStyle = winding
    ctx.fill()
    ctx.restore()

    // winding
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0.377192 * size, 0.745614 * size)
    ctx.bezierCurveTo(0.377192 * size, 0.745614 * size, 0.429824 * size, 0.72807 * size, 0.491228 * size, 0.72807 * size)
    ctx.bezierCurveTo(0.561403 * size, 0.72807 * size, 0.605263 * size, 0.736842 * size, 0.605263 * size, 0.736842 * size)
    ctx.lineTo(0.605263 * size, 0.763157 * size)
    ctx.lineTo(0.596491 * size, 0.780701 * size)
    ctx.lineTo(0.605263 * size, 0.798245 * size)
    ctx.lineTo(0.596491 * size, 0.815789 * size)
    ctx.lineTo(0.605263 * size, 0.833333 * size)
    ctx.lineTo(0.596491 * size, 0.850877 * size)
    ctx.lineTo(0.605263 * size, 0.868421 * size)
    ctx.lineTo(0.596491 * size, 0.885964 * size)
    ctx.lineTo(0.605263 * size, 0.894736 * size)
    ctx.bezierCurveTo(0.605263 * size, 0.894736 * size, 0.570175 * size, 0.95614 * size, 0.535087 * size, 0.991228 * size)
    ctx.bezierCurveTo(0.526315 * size, 0.991228 * size, 0.517543 * size, size, 0.5 * size, size)
    ctx.bezierCurveTo(0.482456 * size, size, 0.473684 * size, size, 0.464912 * size, 0.991228 * size)
    ctx.bezierCurveTo(0.421052 * size, 0.947368 * size, 0.394736 * size, 0.903508 * size, 0.394736 * size, 0.903508 * size)
    ctx.lineTo(0.394736 * size, 0.894736 * size)
    ctx.lineTo(0.385964 * size, 0.885964 * size)
    ctx.lineTo(0.394736 * size, 0.868421 * size)
    ctx.lineTo(0.385964 * size, 0.850877 * size)
    ctx.lineTo(0.394736 * size, 0.833333 * size)
    ctx.lineTo(0.385964 * size, 0.815789 * size)
    ctx.lineTo(0.394736 * size, 0.798245 * size)
    ctx.lineTo(0.377192 * size, 0.789473 * size)
    ctx.lineTo(0.394736 * size, 0.771929 * size)
    ctx.lineTo(0.377192 * size, 0.763157 * size)
    ctx.lineTo(0.377192 * size, 0.745614 * size)
    ctx.closePath()

    const winding1 = ctx.createLinearGradient(0.377192 * size, 0.789473 * size, 0.605263 * size, 0.789473 * size)
    winding1.addColorStop(0, 'rgba(0, 0, 0, 0.4)')
    winding1.addColorStop(0.15, 'rgba(0, 0, 0, 0.32)')
    winding1.addColorStop(0.85, 'rgba(0, 0, 0, 0.33)')
    winding1.addColorStop(1, 'rgba(0, 0, 0, 0.4)')
    ctx.fillStyle = winding1
    ctx.fill()
    ctx.restore()

    // contact plate
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0.429052 * size, 0.947368 * size)
    ctx.bezierCurveTo(0.438596 * size, 0.95614 * size, 0.447368 * size, 0.973684 * size, 0.464912 * size, 0.991228 * size)
    ctx.bezierCurveTo(0.473684 * size, size, 0.482456 * size, size, 0.5 * size, size)
    ctx.bezierCurveTo(0.517543 * size, size, 0.526315 * size, 0.991228 * size, 0.535087 * size, 0.991228 * size)
    ctx.bezierCurveTo(0.543859 * size, 0.982456 * size, 0.561403 * size, 0.95614 * size, 0.572147 * size, 0.947368 * size)
    ctx.bezierCurveTo(0.552631 * size, 0.938596 * size, 0.526315 * size, 0.938596 * size, 0.5 * size, 0.938596 * size)
    ctx.bezierCurveTo(0.473684 * size, 0.938596 * size, 0.447368 * size, 0.938596 * size, 0.421052 * size, 0.947368 * size)
    ctx.closePath()

    const contactPlate = ctx.createLinearGradient(0, 0.938596 * size, 0, size)
    contactPlate.addColorStop(0, '#050a06')
    contactPlate.addColorStop(0.61, '#070602')
    contactPlate.addColorStop(0.71, '#999288')
    contactPlate.addColorStop(0.83, '#010101')
    contactPlate.addColorStop(1, '#000000')
    ctx.fillStyle = contactPlate
    ctx.fill()

    ctx.restore()
  }

  // *****************************  Initialization  ****************************
  const clearCanvas = function (ctx) {
    // Store the current transformation matrix
    ctx.save()

    // Use the identity matrix while clearing the canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Restore the transform
    ctx.restore()
  }

  const init = function () {
    if (!initialized) {
      drawBulbOff(offCtx)
      drawScrew(screwCtx)
    }

    drawBulbOn(onCtx)

    initialized = true
  }

  // ***************************   Public Methods   ****************************
  this.isOn = function () {
    return lightOn
  }

  this.setOn = function (on) {
    lightOn = !!on
    this.repaint()
    return this
  }

  this.getAlpha = function () {
    return alpha
  }

  this.setAlpha = function (newAlpha) {
    if (!isNaN(newAlpha)) {
      alpha = newAlpha
      this.repaint()
    }

    return this
  }

  this.getGlowColor = function () {
    return glowColor
  }

  this.setGlowColor = function (color) {
    if (isHexColor(color)) {
      glowColor = color
      init()
      this.repaint()
    } else {
      console.log('[Lightbulb] Err: Invalid color!')
    }

    return this
  }

  // Component visualization
  this.repaint = function () {
    if (!initialized) {
      init()
    }

    mainCtx.save()

    // Clear the canvas
    clearCanvas(mainCtx)

    // Draw base bulb image
    mainCtx.drawImage(offBuffer, 0, 0)

    // Draw on bulb image
    if (lightOn) {
      mainCtx.globalAlpha = alpha
      mainCtx.drawImage(onBuffer, 0, 0)
      mainCtx.globalAlpha = 1
    }

    // Draw bulb screw image
    mainCtx.drawImage(screwBuffer, 0, 0)

    mainCtx.restore()
  }

  this.repaint()

  return this
}
