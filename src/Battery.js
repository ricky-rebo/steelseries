import { legacy } from 'steelseries-tools'

import { getCanvasContext } from './utils/common'

export const Battery = function (canvas, parameters) {
  // Get the canvas context and clear it
  const mainCtx = getCanvasContext(canvas)

  // Parameters
  parameters = parameters || {}
  const size = undefined === parameters.size ? mainCtx.canvas.width : parameters.size
  let value = undefined === parameters.value ? 50 : parameters.value

  const width = size
  const height = Math.ceil(size * 0.45)

  // Set the size - also clears the canvas
  mainCtx.canvas.width = width
  mainCtx.canvas.height = height

  // Constants
  const BORDER_FRACTIONS = [0, 0.4, 1]
  const BORDER_COLORS = [
    new legacy.rgbaColor(177, 25, 2, 1),
    new legacy.rgbaColor(219, 167, 21, 1),
    new legacy.rgbaColor(121, 162, 75, 1)
  ]

  const LIQUID_GRADIENT_FRACTIONS = [0, 0.4, 1]
  const LIQUID_COLORS_DARK = [
    new legacy.rgbaColor(198, 39, 5, 1), // 0xC62705
    new legacy.rgbaColor(228, 189, 32, 1), // 0xE4BD20
    new legacy.rgbaColor(163, 216, 102, 1) // 0xA3D866
  ]
  const LIQUID_COLORS_LIGHT = [
    new legacy.rgbaColor(246, 121, 48, 1), // 0xF67930
    new legacy.rgbaColor(246, 244, 157, 1), // 0xF6F49D
    new legacy.rgbaColor(223, 233, 86, 1) // 0xDFE956
  ]
  const BORDER_GRADIENT = new legacy.gradientWrapper(0, 100, BORDER_FRACTIONS, BORDER_COLORS)
  const LIQUID_GRADIENT_DARK = new legacy.gradientWrapper(0, 100, LIQUID_GRADIENT_FRACTIONS, LIQUID_COLORS_DARK)
  const LIQUID_GRADIENT_LIGHT = new legacy.gradientWrapper(0, 100, LIQUID_GRADIENT_FRACTIONS, LIQUID_COLORS_LIGHT)

  // **************   Image creation  ********************
  const createBatteryImage = function (ctx) {
    const w = width
    const h = height
    let grad

    // Background
    ctx.beginPath()
    ctx.moveTo(w * 0.025, h * 0.055555)
    ctx.lineTo(w * 0.9, h * 0.055555)
    ctx.lineTo(w * 0.9, h * 0.944444)
    ctx.lineTo(w * 0.025, h * 0.944444)
    ctx.lineTo(w * 0.025, h * 0.055555)
    ctx.closePath()
    //
    ctx.beginPath()
    ctx.moveTo(w * 0.925, 0)
    ctx.lineTo(0, 0)
    ctx.lineTo(0, h)
    ctx.lineTo(w * 0.925, h)
    ctx.lineTo(w * 0.925, h * 0.722222)
    ctx.bezierCurveTo(w * 0.925, h * 0.722222, w * 0.975, h * 0.722222, w * 0.975, h * 0.722222)
    ctx.bezierCurveTo(w, h * 0.722222, w, h * 0.666666, w, h * 0.666666)
    ctx.bezierCurveTo(w, h * 0.666666, w, h * 0.333333, w, h * 0.333333)
    ctx.bezierCurveTo(w, h * 0.333333, w, h * 0.277777, w * 0.975, h * 0.277777)
    ctx.bezierCurveTo(w * 0.975, h * 0.277777, w * 0.925, h * 0.277777, w * 0.925, h * 0.277777)
    ctx.lineTo(w * 0.925, 0)
    ctx.closePath()
    //
    grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(1, '#7e7e7e')
    ctx.fillStyle = grad
    ctx.fill()

    // Main
    ctx.beginPath()
    let end = Math.max(w * 0.875 * (value / 100), Math.ceil(w * 0.01))
    ctx.rect(w * 0.025, w * 0.025, end, h * 0.888888)
    ctx.closePath()

    ctx.fillStyle = BORDER_GRADIENT.getColorAt(value / 100).getRgbColor()
    ctx.fill()
    ctx.beginPath()
    end = Math.max(end - w * 0.05, 0)
    ctx.rect(w * 0.05, w * 0.05, end, h * 0.777777)
    ctx.closePath()

    grad = ctx.createLinearGradient(w * 0.05, 0, w * 0.875, 0)
    grad.addColorStop(0, LIQUID_GRADIENT_DARK.getColorAt(value / 100).getRgbColor())
    grad.addColorStop(0.5, LIQUID_GRADIENT_LIGHT.getColorAt(value / 100).getRgbColor())
    grad.addColorStop(1, LIQUID_GRADIENT_DARK.getColorAt(value / 100).getRgbColor())
    ctx.fillStyle = grad
    ctx.fill()

    // Foreground
    ctx.beginPath()
    ctx.rect(w * 0.025, w * 0.025, w * 0.875, h * 0.444444)
    ctx.closePath()
    grad = ctx.createLinearGradient(w * 0.025, w * 0.025, w * 0.875, h * 0.444444)
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)')
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.8)')
    ctx.fillStyle = grad
    ctx.fill()
  }

  // **************   Public methods  ********************
  this.setValue = function (newValue) {
    newValue = parseFloat(newValue)

    if (!isNaN(newValue)) {
      newValue = newValue < 0 ? 0 : newValue > 100 ? 100 : newValue
      if (value !== newValue) {
        value = newValue
        this.repaint()
      }
    }

    return this
  }

  this.getValue = function () {
    return value
  }

  this.repaint = function () {
    mainCtx.clearRect(0, 0, width, height)
    createBatteryImage(mainCtx)
  }

  // Visualize the component
  this.repaint()

  return this
}
