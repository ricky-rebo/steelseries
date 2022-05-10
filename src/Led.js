import createLedImage from './tools/create/createLedImage'
import { getCanvasContext, createBuffer } from './utils/tools'

import { LedColor } from './tools/customization/colors'

export const Led = function (canvas, parameters) {
  parameters = parameters || {}

  // Get the canvas context
  const mainCtx = undefined === parameters._context
    ? getCanvasContext(canvas)
    : parameters._context

  // Parameters
  const size = undefined === parameters.size ? Math.min(mainCtx.canvas.width, mainCtx.canvas.height) : parameters.size
  let ledColor = undefined === parameters.ledColor ? LedColor.RED_LED : parameters.ledColor

  // Set the size - also clears the canvas
  mainCtx.canvas.width = size
  mainCtx.canvas.height = size

  // Internal variables
  let ledOn = false
  let ledBlinking = false
  let ledTimerId = 0

  let initialized = false

  // **************   Buffer creation  ********************
  // Buffer for led on painting code
  const ledOnBuffer = createBuffer(size, size)
  const ledOnCtx = ledOnBuffer.getContext('2d')

  // Buffer for led off painting code
  const ledOffBuffer = createBuffer(size, size)
  const ledOffCtx = ledOffBuffer.getContext('2d')

  const init = function () {
    initialized = true

    // Draw LED ON in ledBuffer_ON
    ledOnCtx.clearRect(0, 0, size, size)
    ledOnCtx.drawImage(createLedImage(size, 1, ledColor), 0, 0)

    // Draw LED ON in ledBuffer_OFF
    ledOffCtx.clearRect(0, 0, size, size)
    ledOffCtx.drawImage(createLedImage(size, 0, ledColor), 0, 0)
  }

  this.getLedColor = function () {
    return ledColor
  }

  this.setLedColor = function (newColor) {
    if (undefined !== newColor.coronaColor) {
      ledColor = newColor
      init()
      repaint()
    }

    return this
  }

  this.isLedOn = function () {
    return ledOn
  }

  this.setLedOnOff = function (on) {
    ledOn = !!on
    repaint()
    return this
  }

  this.toggleLed = function () {
    ledOn = !ledOn
    repaint()
    return this
  }

  this.blink = function (blink) {
    if (blink && !ledBlinking) {
      ledTimerId = setInterval(this.toggleLed, 1000)
      ledBlinking = true
    } else if (!blink && ledBlinking) {
      clearInterval(ledTimerId)
      ledOn = false
      ledBlinking = false
    }

    return this
  }

  const repaint = function () {
    if (!initialized) {
      init()
    }

    mainCtx.save()
    mainCtx.clearRect(0, 0, mainCtx.canvas.width, mainCtx.canvas.height)

    if (ledOn) {
      mainCtx.drawImage(ledOnBuffer, 0, 0)
    } else {
      mainCtx.drawImage(ledOffBuffer, 0, 0)
    }

    mainCtx.restore()
  }

  // Visualize the component
  repaint()

  return this
}
