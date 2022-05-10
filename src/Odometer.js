import Tween from './libs/tween.js'
import { createBuffer, requestAnimFrame, getCanvasContext } from './utils/common'

export const Odometer = function (canvas, parameters) {
  parameters = parameters || {}

  // Get the canvas context
  const mainCtx = undefined === parameters._context ? getCanvasContext(canvas) : parameters._context

  // Parameters
  const height = undefined === parameters.height ? mainCtx.canvas.height : parameters.height
  const digits = undefined === parameters.digits ? 6 : parameters.digits
  const decimals = undefined === parameters.decimals ? 1 : parameters.decimals
  const font = undefined === parameters.font ? 'sans-serif' : parameters.font
  const decimalBackColor = undefined === parameters.decimalBackColor ? '#F0F0F0' : parameters.decimalBackColor
  const decimalForeColor = undefined === parameters.decimalForeColor ? '#F01010' : parameters.decimalForeColor
  const valueBackColor = undefined === parameters.valueBackColor ? '#050505' : parameters.valueBackColor
  const valueForeColor = undefined === parameters.valueForeColor ? '#F8F8F8' : parameters.valueForeColor
  const wobbleFactor = undefined === parameters.wobbleFactor ? 0.07 : parameters.wobbleFactor
  let value = undefined === parameters.value ? 0 : parameters.value

  // Internal variables
  let initialized = false
  let tween
  let repainting = false
  const wobble = []

  // Cannot display negative values yet
  if (value < 0) { value = 0 }

  // Constants
  const digitHeight = Math.floor(height * 0.85)
  const stdFont = '600 ' + digitHeight + 'px ' + font

  const digitWidth = Math.floor(height * 0.68)
  const width = digitWidth * (digits + decimals)
  const columnHeight = digitHeight * 11
  const verticalSpace = columnHeight / 12
  const zeroOffset = verticalSpace * 0.81

  // Resize the canvas
  mainCtx.canvas.width = width
  mainCtx.canvas.height = height

  // Create buffers
  const backgroundBuffer = createBuffer(width, height)
  const backgroundContext = backgroundBuffer.getContext('2d')

  const foregroundBuffer = createBuffer(width, height)
  const foregroundContext = foregroundBuffer.getContext('2d')

  const digitBuffer = createBuffer(digitWidth, columnHeight * 1.1)
  const digitContext = digitBuffer.getContext('2d')

  const decimalBuffer = createBuffer(digitWidth, columnHeight * 1.1)
  const decimalContext = decimalBuffer.getContext('2d')

  // **************   Image creation  ********************
  function drawNumbersColumn (ctx, backColor, foreColor) {
    ctx.save()

    // background
    ctx.rect(0, 0, digitWidth, columnHeight * 1.1)
    ctx.fillStyle = backColor
    ctx.fill()

    // edges
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = '1px' // height * 0.1 + 'px';
    ctx.moveTo(0, 0)
    ctx.lineTo(0, columnHeight * 1.1)
    ctx.stroke()
    ctx.strokeStyle = '#202020'
    ctx.moveTo(digitWidth, 0)
    ctx.lineTo(digitWidth, columnHeight * 1.1)
    ctx.stroke()

    // numerals
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = stdFont
    ctx.fillStyle = foreColor

    // put the digits 901234567890 vertically into the buffer
    for (let i = 9; i < 21; i++) {
      ctx.fillText(
        i % 10,
        digitWidth * 0.5,
        verticalSpace * (i - 9) + verticalSpace / 2
      )
    }

    ctx.restore()
  }

  function drawForeground (ctx) {
    ctx.rect(0, 0, width, height)

    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, 'rgba(0, 0, 0, 1)')
    grad.addColorStop(0.1, 'rgba(0, 0, 0, 0.4)')
    grad.addColorStop(0.33, 'rgba(255, 255, 255, 0.45)')
    grad.addColorStop(0.46, 'rgba(255, 255, 255, 0)')
    grad.addColorStop(0.9, 'rgba(0, 0, 0, 0.4)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 1)')

    ctx.fillStyle = grad
    ctx.fill()
  }

  // **************   Initialization  ********************
  function init () {
    // Create a digit column
    drawNumbersColumn(digitContext, valueBackColor, valueForeColor)

    // Create a decimal column
    if (decimals > 0) {
      drawNumbersColumn(decimalContext, decimalBackColor, decimalForeColor)
    }

    // wobble factors
    for (let i = 0; i < digits + decimals; i++) {
      wobble[i] =
        Math.random() * wobbleFactor * height - (wobbleFactor * height) / 2
    }

    // Create the foreground
    drawForeground(foregroundContext)

    initialized = true
  }

  function drawDigits (ctx) {
    let pos = 1
    let val = value
    let num
    let numb
    let fraction
    let prevNum
    let posX, posY

    // do not use Math.pow() - rounding errors!
    for (let i = 0; i < decimals; i++) {
      val *= 10
    }

    numb = Math.floor(val)
    fraction = val - numb
    numb = String(numb)
    prevNum = 9

    for (let i = 0; i < decimals + digits; i++) {
      num = +numb.substring(numb.length - i - 1, numb.length - i) || 0
      if (prevNum !== 9) {
        fraction = 0
      }

      posX = width - digitWidth * pos
      posY = -(verticalSpace * (num + fraction) + zeroOffset + wobble[i])

      if (i < decimals) {
        ctx.drawImage(decimalBuffer, posX, posY)
      } else {
        ctx.drawImage(digitBuffer, posX, posY)
      }

      pos++
      prevNum = num
    }
  }

  //* *********************************** Public methods **************************************
  this.getValue = function () {
    return value
  }

  this.setValue = function (newVal) {
    newVal = parseFloat(newVal)
    if (!isNaN(newVal)) {
      const target = newVal < 0 ? 0 : newVal
      if (target !== value) {
        if (undefined !== tween && tween.isPlaying) {
          tween.stop()
        }

        value = target
        this.repaint()
      }
    }

    return this
  }

  this.setValueAnimated = function (newVal, callback) {
    const gauge = this
    newVal = parseFloat(newVal)
    if (!isNaN(newVal)) {
      newVal = newVal < 0 ? 0 : newVal

      if (value !== newVal) {
        if (undefined !== tween && tween.isPlaying) {
          tween.stop()
        }

        tween = new Tween({}, '', Tween.strongEaseOut, value, newVal, 2)
        tween.onMotionChanged = function (event) {
          value = event.target._pos

          if (!repainting) {
            repainting = true
            requestAnimFrame(gauge.repaint)
          }
        }

        // do we have a callback function to process?
        if (callback && typeof callback === 'function') {
          tween.onMotionFinished = callback
        }

        tween.start()
      }
      this.repaint()
    }

    return this
  }

  this.repaint = function () {
    if (!initialized) {
      init()
    }

    // draw digits
    drawDigits(backgroundContext)

    // paint back to the main context
    mainCtx.drawImage(backgroundBuffer, 0, 0)

    // draw foreground
    mainCtx.drawImage(foregroundBuffer, 0, 0)

    repainting = false
  }

  this.repaint()
}
