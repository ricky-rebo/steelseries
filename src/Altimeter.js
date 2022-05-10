import Tween from './libs/tween.js'
import drawFrame from './tools/draw/drawFrame'
import drawBackground from './tools/draw/drawBackground'
import drawRadialCustomImage from './tools/draw/drawRadialCustomImage'
import drawForeground from './tools/draw/drawForeground'
import drawTitleImage from './tools/draw/drawTitleImage'

import { DisplaySingle } from './DisplaySingle.js'

import {
  createBuffer,
  requestAnimFrame,
  getCanvasContext,
  TWO_PI,
  PI,
  stdFontName
} from './utils/common'

import { BackgroundColor, LcdColor } from './tools/customization/colors'
import { KnobType, KnobStyle, FrameDesign, ForegroundType } from './tools/customization/types'

export const Altimeter = function (canvas, parameters) {
  // Get the canvas context and clear it
  const mainCtx = getCanvasContext(canvas)
  mainCtx.save()

  // Parameters
  parameters = parameters || {}
  const size = undefined === parameters.size
    ? Math.min(mainCtx.canvas.width, mainCtx.canvas.height)
    : parameters.size
  let frameDesign =
    undefined === parameters.frameDesign
      ? FrameDesign.METAL
      : parameters.frameDesign
  const frameVisible =
    undefined === parameters.frameVisible ? true : parameters.frameVisible
  let backgroundColor =
    undefined === parameters.backgroundColor
      ? BackgroundColor.DARK_GRAY
      : parameters.backgroundColor
  const backgroundVisible =
    undefined === parameters.backgroundVisible
      ? true
      : parameters.backgroundVisible
  let titleString =
    undefined === parameters.titleString ? '' : parameters.titleString
  let unitString =
    undefined === parameters.unitString ? '' : parameters.unitString
  const unitAltPos = undefined !== parameters.unitAltPos
  const knobType =
    undefined === parameters.knobType
      ? KnobType.METAL_KNOB
      : parameters.knobType
  const knobStyle =
    undefined === parameters.knobStyle ? KnobStyle.BLACK : parameters.knobStyle
  const lcdColor =
    undefined === parameters.lcdColor ? LcdColor.BLACK : parameters.lcdColor
  const lcdVisible =
    undefined === parameters.lcdVisible ? true : parameters.lcdVisible
  const digitalFont =
    undefined === parameters.digitalFont ? false : parameters.digitalFont
  let foregroundType =
    undefined === parameters.foregroundType
      ? ForegroundType.TYPE1
      : parameters.foregroundType
  const foregroundVisible =
    undefined === parameters.foregroundVisible
      ? true
      : parameters.foregroundVisible
  const customLayer =
    undefined === parameters.customLayer ? null : parameters.customLayer

  // Set the size
  mainCtx.canvas.width = size
  mainCtx.canvas.height = size

  // Constants
  const center = size / 2

  const minValue = 0
  const maxValue = 10

  const angleStep100ft = TWO_PI / (maxValue - minValue)
  const angleStep1000ft = angleStep100ft / 10
  const angleStep10000ft = angleStep1000ft / 10

  const lcdWidth = size * 0.4
  const lcdHeight = size * 0.09
  const lcdPosX = (size - lcdWidth) / 2
  const lcdPosY = size * 0.56

  const unitStringPosY = unitAltPos ? size * 0.68 : false

  const stdFont = Math.floor(size * 0.09) + 'px ' + stdFontName

  // Internal Variables
  let value = minValue

  let tween
  let repainting = false

  let initialized = false

  // **************   Buffer creation  ********************
  // Buffer for the frame
  const frameBuffer = createBuffer(size, size)
  let frameCtx = frameBuffer.getContext('2d')

  // Buffer for the background
  const backgroundBuffer = createBuffer(size, size)
  let backgroundCtx = backgroundBuffer.getContext('2d')

  let lcdBuffer
  let lcdCtx
  let lcdGauge
  if (lcdVisible) {
    lcdBuffer = createBuffer(10, 10)
    lcdCtx = lcdBuffer.getContext('2d')
  }

  // Buffer for 10000ft pointer image painting code
  const pointer10000Buffer = createBuffer(size, size)
  let pointer10000Ctx = pointer10000Buffer.getContext('2d')

  // Buffer for 1000ft pointer image painting code
  const pointer1000Buffer = createBuffer(size, size)
  let pointer1000Ctx = pointer1000Buffer.getContext('2d')

  // Buffer for 100ft pointer image painting code
  const pointer100Buffer = createBuffer(size, size)
  let pointer100Ctx = pointer100Buffer.getContext('2d')

  // Buffer for static foreground painting code
  const foregroundBuffer = createBuffer(size, size)
  let foregroundCtx = foregroundBuffer.getContext('2d')

  // **************   Image Creation  ********************
  const drawTickmarksImage = function (ctx) {
    const MEDIUM_STROKE = Math.max(size * 0.012, 2)
    const THIN_STROKE = Math.max(size * 0.007, 1.5)
    const TEXT_DISTANCE = size * 0.13
    const MED_LENGTH = size * 0.05
    const MAX_LENGTH = size * 0.07
    const RADIUS = size * 0.4
    const CENTER = size / 2
    const ALPHA_START = -PI

    let counter = 0
    let sinValue = 0
    let cosValue = 0
    let alpha // angle for tickmarks
    let valueCounter // value for tickmarks

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = stdFont
    ctx.strokeStyle = backgroundColor.labelColor.getRgbaColor()
    ctx.fillStyle = backgroundColor.labelColor.getRgbaColor()

    for (
      alpha = ALPHA_START, valueCounter = 0;
      valueCounter <= 10;
      alpha -= angleStep100ft * 0.1, valueCounter += 0.1
    ) {
      sinValue = Math.sin(alpha)
      cosValue = Math.cos(alpha)

      // tickmark every 2 units
      if (counter % 2 === 0) {
        ctx.lineWidth = THIN_STROKE
        // Draw ticks
        ctx.beginPath()
        ctx.moveTo(
          CENTER + (RADIUS - MED_LENGTH) * sinValue,
          CENTER + (RADIUS - MED_LENGTH) * cosValue
        )
        ctx.lineTo(CENTER + RADIUS * sinValue, CENTER + RADIUS * cosValue)
        ctx.closePath()
        ctx.stroke()
      }

      // Different tickmark every 10 units
      if (counter === 10 || counter === 0) {
        ctx.lineWidth = MEDIUM_STROKE

        // avoid painting maxValue over minValue
        if (Math.round(valueCounter) !== maxValue) {
          ctx.fillText(
            Math.round(valueCounter).toString(),
            CENTER + (RADIUS - TEXT_DISTANCE) * sinValue,
            CENTER + (RADIUS - TEXT_DISTANCE) * cosValue
          )
        }
        counter = 0

        // Draw ticks
        ctx.beginPath()
        ctx.moveTo(
          CENTER + (RADIUS - MAX_LENGTH) * sinValue,
          CENTER + (RADIUS - MAX_LENGTH) * cosValue
        )
        ctx.lineTo(CENTER + RADIUS * sinValue, CENTER + RADIUS * cosValue)
        ctx.closePath()
        ctx.stroke()
      }
      counter++
    }
    ctx.restore()
  }

  const draw100ftPointer = function () {
    const w = size
    const h = size
    const grad = pointer100Ctx.createLinearGradient(0, h * 0.168224, 0, h * 0.626168)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(0.31, '#ffffff')
    grad.addColorStop(0.3101, '#ffffff')
    grad.addColorStop(0.32, '#202020')
    grad.addColorStop(1, '#202020')
    pointer100Ctx.fillStyle = grad

    pointer100Ctx.save()
    pointer100Ctx.beginPath()
    pointer100Ctx.moveTo(w * 0.518691, h * 0.471962)
    pointer100Ctx.bezierCurveTo(w * 0.514018, h * 0.471962, w * 0.509345, h * 0.467289, w * 0.509345, h * 0.467289)
    pointer100Ctx.lineTo(w * 0.509345, h * 0.200934)
    pointer100Ctx.lineTo(w * 0.5, h * 0.168224)
    pointer100Ctx.lineTo(w * 0.490654, h * 0.200934)
    pointer100Ctx.lineTo(w * 0.490654, h * 0.467289)
    pointer100Ctx.bezierCurveTo(w * 0.490654, h * 0.467289, w * 0.481308, h * 0.471962, w * 0.481308, h * 0.471962)
    pointer100Ctx.bezierCurveTo(w * 0.471962, h * 0.481308, w * 0.467289, h * 0.490654, w * 0.467289, h * 0.5)
    pointer100Ctx.bezierCurveTo(w * 0.467289, h * 0.514018, w * 0.476635, h * 0.528037, w * 0.490654, h * 0.53271)
    pointer100Ctx.bezierCurveTo(w * 0.490654, h * 0.53271, w * 0.490654, h * 0.579439, w * 0.490654, h * 0.588785)
    pointer100Ctx.bezierCurveTo(w * 0.485981, h * 0.593457, w * 0.481308, h * 0.59813, w * 0.481308, h * 0.607476)
    pointer100Ctx.bezierCurveTo(w * 0.481308, h * 0.616822, w * 0.490654, h * 0.626168, w * 0.5, h * 0.626168)
    pointer100Ctx.bezierCurveTo(w * 0.509345, h * 0.626168, w * 0.518691, h * 0.616822, w * 0.518691, h * 0.607476)
    pointer100Ctx.bezierCurveTo(w * 0.518691, h * 0.59813, w * 0.514018, h * 0.593457, w * 0.504672, h * 0.588785)
    pointer100Ctx.bezierCurveTo(w * 0.504672, h * 0.579439, w * 0.504672, h * 0.53271, w * 0.509345, h * 0.53271)
    pointer100Ctx.bezierCurveTo(w * 0.523364, h * 0.528037, w * 0.53271, h * 0.514018, w * 0.53271, h * 0.5)
    pointer100Ctx.bezierCurveTo(w * 0.53271, h * 0.490654, w * 0.528037, h * 0.481308, w * 0.518691, h * 0.471962)
    pointer100Ctx.closePath()
    pointer100Ctx.fill()
    pointer100Ctx.restore()
  }

  const draw1000ftPointer = function () {
    const w = size
    const h = size
    const grad = pointer1000Ctx.createLinearGradient(0, h * 0.401869, 0, h * 0.616822)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(0.51, '#ffffff')
    grad.addColorStop(0.52, '#ffffff')
    grad.addColorStop(0.5201, '#202020')
    grad.addColorStop(0.53, '#202020')
    grad.addColorStop(1, '#202020')
    pointer1000Ctx.fillStyle = grad
    pointer1000Ctx.beginPath()
    pointer1000Ctx.moveTo(w * 0.518691, h * 0.471962)
    pointer1000Ctx.bezierCurveTo(w * 0.514018, h * 0.462616, w * 0.528037, h * 0.401869, w * 0.528037, h * 0.401869)
    pointer1000Ctx.lineTo(w * 0.5, h * 0.331775)
    pointer1000Ctx.lineTo(w * 0.471962, h * 0.401869)
    pointer1000Ctx.bezierCurveTo(w * 0.471962, h * 0.401869, w * 0.485981, h * 0.462616, w * 0.481308, h * 0.471962)
    pointer1000Ctx.bezierCurveTo(w * 0.471962, h * 0.481308, w * 0.467289, h * 0.490654, w * 0.467289, h * 0.5)
    pointer1000Ctx.bezierCurveTo(w * 0.467289, h * 0.514018, w * 0.476635, h * 0.528037, w * 0.490654, h * 0.53271)
    pointer1000Ctx.bezierCurveTo(w * 0.490654, h * 0.53271, w * 0.462616, h * 0.574766, w * 0.462616, h * 0.593457)
    pointer1000Ctx.bezierCurveTo(w * 0.467289, h * 0.616822, w * 0.5, h * 0.612149, w * 0.5, h * 0.612149)
    pointer1000Ctx.bezierCurveTo(w * 0.5, h * 0.612149, w * 0.53271, h * 0.616822, w * 0.537383, h * 0.593457)
    pointer1000Ctx.bezierCurveTo(w * 0.537383, h * 0.574766, w * 0.509345, h * 0.53271, w * 0.509345, h * 0.53271)
    pointer1000Ctx.bezierCurveTo(w * 0.523364, h * 0.528037, w * 0.53271, h * 0.514018, w * 0.53271, h * 0.5)
    pointer1000Ctx.bezierCurveTo(w * 0.53271, h * 0.490654, w * 0.528037, h * 0.481308, w * 0.518691, h * 0.471962)
    pointer1000Ctx.closePath()
    pointer1000Ctx.fill()
    pointer1000Ctx.restore()
  }

  const draw10000ftPointer = function () {
    const w = size
    const h = size

    pointer10000Ctx.fillStyle = '#ffffff'
    pointer10000Ctx.beginPath()
    pointer10000Ctx.moveTo(w * 0.518691, h * 0.471962)
    pointer10000Ctx.bezierCurveTo(w * 0.514018, h * 0.471962, w * 0.514018, h * 0.467289, w * 0.514018, h * 0.467289)
    pointer10000Ctx.lineTo(w * 0.514018, h * 0.317757)
    pointer10000Ctx.lineTo(w * 0.504672, h * 0.303738)
    pointer10000Ctx.lineTo(w * 0.504672, h * 0.182242)
    pointer10000Ctx.lineTo(w * 0.53271, h * 0.116822)
    pointer10000Ctx.lineTo(w * 0.462616, h * 0.116822)
    pointer10000Ctx.lineTo(w * 0.495327, h * 0.182242)
    pointer10000Ctx.lineTo(w * 0.495327, h * 0.299065)
    pointer10000Ctx.lineTo(w * 0.485981, h * 0.317757)
    pointer10000Ctx.lineTo(w * 0.485981, h * 0.467289)
    pointer10000Ctx.bezierCurveTo(w * 0.485981, h * 0.467289, w * 0.485981, h * 0.471962, w * 0.481308, h * 0.471962)
    pointer10000Ctx.bezierCurveTo(w * 0.471962, h * 0.481308, w * 0.467289, h * 0.490654, w * 0.467289, h * 0.5)
    pointer10000Ctx.bezierCurveTo(w * 0.467289, h * 0.518691, w * 0.481308, h * 0.53271, w * 0.5, h * 0.53271)
    pointer10000Ctx.bezierCurveTo(w * 0.518691, h * 0.53271, w * 0.53271, h * 0.518691, w * 0.53271, h * 0.5)
    pointer10000Ctx.bezierCurveTo(w * 0.53271, h * 0.490654, w * 0.528037, h * 0.481308, w * 0.518691, h * 0.471962)
    pointer10000Ctx.closePath()
    pointer10000Ctx.fill()
  }

  // **************   Initialization  ********************
  // Draw all static painting code to background
  const init = function (parameters) {
    parameters = parameters || {}
    // Parameters
    const initFrame =
      undefined === parameters.frame ? false : parameters.frame
    const initBackground =
      undefined === parameters.background ? false : parameters.background
    const initPointers =
      undefined === parameters.pointers ? false : parameters.pointers
    const initForeground =
      undefined === parameters.foreground ? false : parameters.foreground

    initialized = true

    // Create frame in frame buffer (backgroundBuffer)
    if (initFrame && frameVisible) {
      drawFrame(frameCtx, frameDesign, center, center, size, size)
    }

    if (initBackground && backgroundVisible) {
      // Create background in background buffer (backgroundBuffer)
      drawBackground(backgroundCtx, backgroundColor, center, center, size, size)

      // Create custom layer in background buffer (backgroundBuffer)
      drawRadialCustomImage(backgroundCtx, customLayer, center, center, size, size)

      // Create tickmarks in background buffer (backgroundBuffer)
      drawTickmarksImage(backgroundCtx)

      // Create title in background buffer (backgroundBuffer)
      drawTitleImage(backgroundCtx, size, size, titleString, unitString, backgroundColor, true, true, unitStringPosY)
    }

    // Create lcd background if selected in background buffer (backgroundBuffer)
    if (initBackground && lcdVisible) {
      lcdGauge = new DisplaySingle('', {
        _context: lcdCtx,
        width: lcdWidth,
        height: lcdHeight,
        lcdColor: lcdColor,
        lcdDecimals: 0,
        digitalFont: digitalFont,
        value: value
      })
    }

    // Draw pointers in their buffers
    if (initPointers) {
      draw100ftPointer()
      draw1000ftPointer()
      draw10000ftPointer()
    }

    if (initForeground && foregroundVisible) {
      drawForeground(
        foregroundCtx,
        foregroundType,
        size,
        size,
        true,
        knobType,
        knobStyle
      )
    }
  }

  const resetBuffers = function (buffers) {
    buffers = buffers || {}
    const resetFrame = undefined === buffers.frame ? false : buffers.frame
    const resetBackground =
      undefined === buffers.background ? false : buffers.background
    const resetPointers =
      undefined === buffers.pointers ? false : buffers.pointers
    const resetForeground =
      undefined === buffers.foreground ? false : buffers.foreground

    if (resetFrame) {
      frameBuffer.width = size
      frameBuffer.height = size
      frameCtx = frameBuffer.getContext('2d')
    }

    if (resetBackground) {
      backgroundBuffer.width = size
      backgroundBuffer.height = size
      backgroundCtx = backgroundBuffer.getContext('2d')
    }

    if (resetPointers) {
      pointer100Buffer.width = size
      pointer100Buffer.height = size
      pointer100Ctx = pointer100Buffer.getContext('2d')

      pointer1000Buffer.width = size
      pointer1000Buffer.height = size
      pointer1000Ctx = pointer1000Buffer.getContext('2d')

      pointer10000Buffer.width = size
      pointer10000Buffer.height = size
      pointer10000Ctx = pointer10000Buffer.getContext('2d')
    }

    if (resetForeground) {
      foregroundBuffer.width = size
      foregroundBuffer.height = size
      foregroundCtx = foregroundBuffer.getContext('2d')
    }
  }

  //* *********************************** Public methods **************************************
  this.getValue = function () {
    return value
  }

  this.setValue = function (newValue) {
    newValue = parseFloat(newValue)

    if (!isNaN(newValue)) {
      // Stop eventual previous animations
      if (undefined !== tween && tween.isPlaying) {
        tween.stop()
      }

      value = (newValue < minValue) ? minValue : newValue
      this.repaint()
    }

    return this
  }

  this.setValueAnimated = function (newValue, callback) {
    newValue = parseFloat(newValue)

    if (!isNaN(newValue)) {
      const targetValue = (newValue < minValue) ? minValue : newValue
      const gauge = this
      let time

      if (value !== targetValue) {
        // Stop eventual previous animations
        if (undefined !== tween && tween.isPlaying) {
          tween.stop()
        }
        // Allow 5 secs per 10,000ft
        time = Math.max((Math.abs(value - targetValue) / 10000) * 5, 1)
        tween = new Tween({}, '', Tween.regularEaseInOut, value, targetValue, time)
        // tween = new Tween(new Object(), '', Tween.strongEaseInOut, value, targetValue, 1);
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
    }

    return this
  }

  this.getFrameDesign = function () {
    return frameDesign
  }

  this.setFrameDesign = function (newFrameDesign) {
    if (undefined !== newFrameDesign.design) {
      frameDesign = newFrameDesign
      resetBuffers({ frame: true })
      init({ frame: true })
      this.repaint()
    }

    return this
  }

  this.getBackgroundColor = function () {
    return backgroundColor
  }

  this.setBackgroundColor = function (newBackgroundColor) {
    if (undefined !== newBackgroundColor.name) {
      backgroundColor = newBackgroundColor

      // type2 & type13 pointers depend on background
      resetBuffers({ background: true, pointer: true })
      init({ background: true, pointer: true })
      this.repaint()
    }

    return this
  }

  this.getForegroundType = function () {
    return foregroundType
  }

  this.setForegroundType = function (newForegroundType) {
    if (undefined !== newForegroundType.type) {
      foregroundType = newForegroundType

      resetBuffers({ foreground: true })
      init({ foreground: true })
      this.repaint()
    }

    return this
  }

  this.getLcdColor = function () {
    if (undefined !== lcdGauge) {
      return lcdGauge.getLcdColor()
    } else {
      return lcdColor
    }
  }

  this.setLcdColor = function (newLcdColor) {
    if (undefined !== newLcdColor.textColor && undefined !== lcdGauge) {
      lcdGauge.setLcdColor(newLcdColor)
      this.repaint()
    }

    return this
  }

  this.getTitleString = function () {
    return titleString
  }

  this.setTitleString = function (title) {
    titleString = title
    resetBuffers({ background: true })
    init({ background: true })
    this.repaint()
    return this
  }

  this.getUnitString = function () {
    return unitString
  }

  this.setUnitString = function (unit) {
    unitString = '' + unit
    resetBuffers({ background: true })
    init({ background: true })
    this.repaint()
    return this
  }

  this.repaint = function () {
    if (!initialized) {
      init({
        frame: true,
        background: true,
        led: true,
        pointers: true,
        foreground: true
      })
    }

    // mainCtx.save();
    mainCtx.clearRect(0, 0, mainCtx.canvas.width, mainCtx.canvas.height)

    // Draw frame
    if (frameVisible) {
      mainCtx.drawImage(frameBuffer, 0, 0)
    }

    // Draw buffered image to visible canvas
    mainCtx.drawImage(backgroundBuffer, 0, 0)

    // Draw lcd display
    if (lcdVisible) {
      lcdGauge.setValue(value)
      backgroundCtx.drawImage(lcdBuffer, lcdPosX, lcdPosY)
    }

    // Calculate the spearate pointer values
    const value100 = (value % 1000) / 100
    const value1000 = (value % 10000) / 100
    const value10000 = (value % 100000) / 100

    mainCtx.save()

    // Draw 10000ft pointer
    // Set the pointer shadow params
    let shadowOffset = size * 0.006 * 0.5
    mainCtx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    mainCtx.shadowOffsetX = mainCtx.shadowOffsetY = shadowOffset
    mainCtx.shadowBlur = shadowOffset * 2

    // Define rotation center
    mainCtx.translate(center, center)
    mainCtx.rotate((value10000 - minValue) * angleStep10000ft)
    mainCtx.translate(-center, -center)

    // Draw the pointer
    mainCtx.drawImage(pointer10000Buffer, 0, 0)

    // Draw 1000ft pointer
    shadowOffset = size * 0.006 * 0.75
    mainCtx.shadowOffsetX = mainCtx.shadowOffsetY = shadowOffset

    mainCtx.translate(center, center)
    mainCtx.rotate(
      (value1000 - minValue) * angleStep1000ft -
        (value10000 - minValue) * angleStep10000ft
    )
    mainCtx.translate(-center, -center)
    mainCtx.drawImage(pointer1000Buffer, 0, 0)

    // Draw 100ft pointer
    shadowOffset = size * 0.006
    mainCtx.shadowOffsetX = mainCtx.shadowOffsetY = shadowOffset

    mainCtx.translate(center, center)
    mainCtx.rotate(
      (value100 - minValue) * angleStep100ft -
        (value1000 - minValue) * angleStep1000ft
    )
    mainCtx.translate(-center, -center)
    mainCtx.drawImage(pointer100Buffer, 0, 0)
    mainCtx.restore()

    // Draw the foregound
    if (foregroundVisible) {
      mainCtx.drawImage(foregroundBuffer, 0, 0)
    }

    repainting = false
  }

  // Visualize the component
  this.repaint()

  return this
}
