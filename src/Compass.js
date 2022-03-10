import Tween from './tools/tween.js'
import drawFrame from './tools/drawFrame'
import drawBackground from './tools/drawBackground'
import drawRadialCustomImage from './tools/drawRadialCustomImage'
import drawForeground from './tools/drawForeground'
import drawRoseImage from './tools/drawRoseImage'
import {
  createBuffer,
  getShortestAngle,
  requestAnimFrame,
  getCanvasContext,
  HALF_PI,
  RAD_FACTOR
} from './tools/tools'

import {
  BackgroundColor,
  ColorDef,
  KnobType,
  KnobStyle,
  FrameDesign,
  PointerType,
  ForegroundType
} from './tools/definitions'

export const Compass = function (canvas, parameters) {
  // Get the canvas context and clear it
  const mainCtx = getCanvasContext(canvas)

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
  let pointerType =
    undefined === parameters.pointerType
      ? PointerType.TYPE2
      : parameters.pointerType
  let pointerColor =
    undefined === parameters.pointerColor
      ? ColorDef.RED
      : parameters.pointerColor
  const knobType =
    undefined === parameters.knobType
      ? KnobType.STANDARD_KNOB
      : parameters.knobType
  const knobStyle =
    undefined === parameters.knobStyle
      ? KnobStyle.SILVER
      : parameters.knobStyle
  let foregroundType =
    undefined === parameters.foregroundType
      ? ForegroundType.TYPE1
      : parameters.foregroundType
  const foregroundVisible =
    undefined === parameters.foregroundVisible
      ? true
      : parameters.foregroundVisible
  let pointSymbols =
    undefined === parameters.pointSymbols
      ? ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
      : parameters.pointSymbols
  const pointSymbolsVisible =
    undefined === parameters.pointSymbolsVisible
      ? true
      : parameters.pointSymbolsVisible
  const customLayer =
    undefined === parameters.customLayer ? null : parameters.customLayer
  const degreeScale =
    undefined === parameters.degreeScale ? false : parameters.degreeScale
  const roseVisible =
    undefined === parameters.roseVisible ? true : parameters.roseVisible
  const rotateFace =
    undefined === parameters.rotateFace ? false : parameters.rotateFace

  // Costants
  const center = size / 2
  const shadowOffset = size * 0.006
  const angleStep = RAD_FACTOR
  const LABEL_IDX = {
    0: 2, // E
    45: 3, // SE
    90: 4, // S
    135: 5, // SW
    180: 6, // W
    225: 7, // NW
    270: 0, // N
    315: 1 // NE
  }

  // Internal variables
  let tween
  let repainting = false
  let value = 0
  let initialized = false

  // Set the size
  mainCtx.canvas.width = size
  mainCtx.canvas.height = size

  // **************   Buffer creation  ********************
  // Buffer for frame
  const frameBuffer = createBuffer(size, size)
  let frameCtx = frameBuffer.getContext('2d')

  // Buffer for all static background painting code
  const backgroundBuffer = createBuffer(size, size)
  let backgroundCtx = backgroundBuffer.getContext('2d')

  // Buffer for symbol/rose painting code
  const roseBuffer = createBuffer(size, size)
  let roseCtx = roseBuffer.getContext('2d')

  // Buffer for pointer image painting code
  const pointerBuffer = createBuffer(size, size)
  let pointerCtx = pointerBuffer.getContext('2d')

  // Buffer for static foreground painting code
  const foregroundBuffer = createBuffer(size, size)
  let foregroundCtx = foregroundBuffer.getContext('2d')

  // **************   Image creation  ********************
  const drawTickmarksImage = function (ctx) {
    let val

    let translateFactor
    let stdFont
    let smlFont
    let i

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeStyle = backgroundColor.labelColor.getRgbaColor()
    ctx.fillStyle = backgroundColor.labelColor.getRgbaColor()
    ctx.translate(center, center)

    if (!degreeScale) {
      stdFont = size * 0.12 + 'px serif'
      smlFont = size * 0.06 + 'px serif'

      for (i = 0; i < 360; i += 2.5) {
        if (i % 5 === 0) {
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(size * 0.38, 0)
          ctx.lineTo(size * 0.36, 0)
          ctx.closePath()
          ctx.stroke()
        }

        // Draw the labels
        ctx.save()
        if (i % 45 === 0) {
          translateFactor = (i % 90 === 0)
            ? 0.35 // Main Labels (N, E, S, W)
            : 0.29 // Secondary Labels (NE, SE, SW, NW)

          ctx.translate(size * translateFactor, 0)
          ctx.rotate(HALF_PI)
          ctx.font = (i % 90 === 0) ? stdFont : smlFont
          ctx.fillText(pointSymbols[LABEL_IDX[i]], 0, 0, size)
          ctx.translate(-size * translateFactor, 0)
        }
        ctx.restore()

        if (roseVisible && (i % 22.5 === 0)) {
          // ROSE_LINE
          ctx.save()
          ctx.beginPath()
          // indent the 16 half quadrant lines a bit for visual effect
          if (i % 45) {
            ctx.moveTo(size * 0.29, 0)
          } else {
            ctx.moveTo(size * 0.38, 0)
          }
          ctx.lineTo(size * 0.1, 0)
          ctx.closePath()
          ctx.restore()
          ctx.lineWidth = 1
          ctx.strokeStyle = backgroundColor.symbolColor.getRgbaColor()
          ctx.stroke()
        }
        ctx.rotate(angleStep * 2.5)
      }
    } else {
      stdFont = size * 0.08 + 'px serif'
      smlFont = size * 0.033 + 'px serif'

      for (i = 0; i < 360; i += 10) {
        // Draw the labels
        ctx.save()
        if (pointSymbolsVisible && (i % 90 === 0)) {
          ctx.translate(size * 0.35, 0)
          ctx.rotate(HALF_PI)
          ctx.font = stdFont
          ctx.fillText(pointSymbols[LABEL_IDX[i]], 0, 0, size)
          ctx.translate(-size * 0.35, 0)
        } else {
          val = (i + 90) % 360
          ctx.translate(size * 0.37, 0)
          ctx.rotate(HALF_PI)
          ctx.font = smlFont
          ctx.fillText('0'.substring(val >= 100) + val, 0, 0, size)
          ctx.translate(-size * 0.37, 0)
        }
        ctx.restore()
        ctx.rotate(angleStep * 10)
      }
    }
    // ctx.translate(-center, -center)
    ctx.restore()
  }

  const drawPointerImage = function (ctx) {
    ctx.save()

    let northPath
    let southPath

    const NORTHPOINTER_GRADIENT = ctx.createLinearGradient(0.471962 * size, 0, 0.528036 * size, 0)
    NORTHPOINTER_GRADIENT.addColorStop(0, pointerColor.light.getRgbaColor())
    NORTHPOINTER_GRADIENT.addColorStop(0.46, pointerColor.light.getRgbaColor())
    NORTHPOINTER_GRADIENT.addColorStop(0.47, pointerColor.medium.getRgbaColor())
    NORTHPOINTER_GRADIENT.addColorStop(1, pointerColor.medium.getRgbaColor())

    const SOUTHPOINTER_GRADIENT = ctx.createLinearGradient(0.471962 * size, 0, 0.528036 * size, 0)
    SOUTHPOINTER_GRADIENT.addColorStop(0, '#e3e5e8')
    SOUTHPOINTER_GRADIENT.addColorStop(0.48, '#e3e5e8')
    SOUTHPOINTER_GRADIENT.addColorStop(0.48, '#abb1b8')
    SOUTHPOINTER_GRADIENT.addColorStop(1, '#abb1b8')
    const SOUTHPOINTER_STROKE = '#abb1b8'

    switch (pointerType.type) {
      case 'type2':
        // Nort Pointer Path
        northPath = new Path2D()
        northPath.moveTo(size * 0.53271, size * 0.453271)
        northPath.bezierCurveTo(size * 0.53271, size * 0.453271, size * 0.5, size * 0.149532, size * 0.5, size * 0.149532)
        northPath.bezierCurveTo(size * 0.5, size * 0.149532, size * 0.467289, size * 0.453271, size * 0.467289, size * 0.453271)
        northPath.bezierCurveTo(size * 0.453271, size * 0.462616, size * 0.443925, size * 0.481308, size * 0.443925, size * 0.5)
        northPath.bezierCurveTo(size * 0.443925, size * 0.5, size * 0.556074, size * 0.5, size * 0.556074, size * 0.5)
        northPath.bezierCurveTo(size * 0.556074, size * 0.481308, size * 0.546728, size * 0.462616, size * 0.53271, size * 0.453271)
        northPath.closePath()

        // South Pointer Path
        southPath = new Path2D()
        southPath.moveTo(size * 0.467289, size * 0.546728)
        southPath.bezierCurveTo(size * 0.467289, size * 0.546728, size * 0.5, size * 0.850467, size * 0.5, size * 0.850467)
        southPath.bezierCurveTo(size * 0.5, size * 0.850467, size * 0.53271, size * 0.546728, size * 0.53271, size * 0.546728)
        southPath.bezierCurveTo(size * 0.546728, size * 0.537383, size * 0.556074, size * 0.518691, size * 0.556074, size * 0.5)
        southPath.bezierCurveTo(size * 0.556074, size * 0.5, size * 0.443925, size * 0.5, size * 0.443925, size * 0.5)
        southPath.bezierCurveTo(size * 0.443925, size * 0.518691, size * 0.453271, size * 0.537383, size * 0.467289, size * 0.546728)
        southPath.closePath()
        break

      case 'type3':
        // North Pointer Path
        northPath = new Path2D()
        northPath.moveTo(size * 0.5, size * 0.149532)
        northPath.bezierCurveTo(size * 0.5, size * 0.149532, size * 0.443925, size * 0.490654, size * 0.443925, size * 0.5)
        northPath.bezierCurveTo(size * 0.443925, size * 0.53271, size * 0.467289, size * 0.556074, size * 0.5, size * 0.556074)
        northPath.bezierCurveTo(size * 0.53271, size * 0.556074, size * 0.556074, size * 0.53271, size * 0.556074, size * 0.5)
        northPath.bezierCurveTo(size * 0.556074, size * 0.490654, size * 0.5, size * 0.149532, size * 0.5, size * 0.149532)
        northPath.closePath()
        break

      case 'type1:':
      default:
        // North Pointer Path
        northPath = new Path2D()
        northPath.moveTo(size * 0.5, size * 0.495327)
        northPath.lineTo(size * 0.528037, size * 0.495327)
        northPath.lineTo(size * 0.5, size * 0.149532)
        northPath.lineTo(size * 0.471962, size * 0.495327)
        northPath.lineTo(size * 0.5, size * 0.495327)
        northPath.closePath()

        // South Pointer Path
        southPath = new Path2D()
        southPath.moveTo(size * 0.5, size * 0.504672)
        southPath.lineTo(size * 0.471962, size * 0.504672)
        southPath.lineTo(size * 0.5, size * 0.850467)
        southPath.lineTo(size * 0.528037, size * 0.504672)
        southPath.lineTo(size * 0.5, size * 0.504672)
        southPath.closePath()
        break
    }

    ctx.lineWidth = 1
    ctx.lineCap = 'square'
    ctx.lineJoin = 'miter'

    ctx.fillStyle = NORTHPOINTER_GRADIENT
    ctx.strokeStyle = pointerColor.dark.getRgbaColor()
    ctx.fill(northPath)
    ctx.stroke(northPath)

    if (southPath !== undefined) {
      ctx.fillStyle = SOUTHPOINTER_GRADIENT
      ctx.strokeStyle = SOUTHPOINTER_STROKE
      ctx.fill(southPath)
      ctx.stroke(southPath)
    }

    ctx.restore()
  }

  // **************   Initialization  ********************
  // Draw all static painting code to background
  const init = function (buffers) {
    buffers = buffers || {}
    const initFrame = undefined === buffers.frame ? false : buffers.frame
    const initBackground = undefined === buffers.background ? false : buffers.background
    const initPointer = undefined === buffers.pointer ? false : buffers.pointer
    const initForeground = undefined === buffers.foreground ? false : buffers.foreground

    initialized = true

    if (initFrame && frameVisible) {
      drawFrame(frameCtx, frameDesign, center, center, size, size)
    }

    if (initBackground && backgroundVisible) {
      drawBackground(backgroundCtx, backgroundColor, center, center, size, size)
      drawRadialCustomImage(backgroundCtx, customLayer, center, center, size, size)

      if (roseVisible) {
        drawRoseImage(roseCtx, center, center, size, size, backgroundColor)
      }

      drawTickmarksImage(roseCtx)
    }

    if (initPointer) {
      drawPointerImage(pointerCtx)
    }

    if (initForeground && foregroundVisible) {
      drawForeground(foregroundCtx, foregroundType, size, size, true, knobType, knobStyle)
    }
  }

  const resetBuffers = function (buffers) {
    buffers = buffers || {}
    const resetFrame = undefined === buffers.frame ? false : buffers.frame
    const resetBackground = undefined === buffers.background ? false : buffers.background
    const resetPointer = undefined === buffers.pointer ? false : buffers.pointers
    const resetForeground = undefined === buffers.foreground ? false : buffers.foreground

    if (resetFrame) {
      // Buffer for frame
      frameBuffer.width = size
      frameBuffer.height = size
      frameCtx = frameBuffer.getContext('2d')
    }

    if (resetBackground) {
      // Buffer for all static background painting code
      backgroundBuffer.width = size
      backgroundBuffer.height = size
      backgroundCtx = backgroundBuffer.getContext('2d')

      // Buffer for symbols/rose painting code
      roseBuffer.width = size
      roseBuffer.height = size
      roseCtx = roseBuffer.getContext('2d')
    }

    if (resetPointer) {
      // Buffer for pointer image painting code
      pointerBuffer.width = size
      pointerBuffer.height = size
      pointerCtx = pointerBuffer.getContext('2d')
    }

    if (resetForeground) {
      // Buffer for static foreground painting code
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
    newValue = parseFloat(newValue) % 360
    if (!isNaN(newValue)) {
      if (value !== newValue) {
        // Stop possible running animation
        if (undefined !== tween && tween.isPlaying) {
          tween.stop()
        }

        value = newValue
        this.repaint()
      }
    }

    return this
  }

  this.setValueAnimated = function (newValue, callback) {
    const targetValue = newValue % 360
    const gauge = this
    let diff
    if (value !== targetValue) {
      if (undefined !== tween && tween.isPlaying) {
        tween.stop()
      }

      diff = getShortestAngle(value, targetValue)
      if (rotateFace) {
        tween = new Tween({}, '', Tween.regularEaseInOut, value, value + diff, 2)
      } else {
        tween = new Tween({}, '', Tween.elasticEaseOut, value, value + diff, 2)
      }
      tween.onMotionChanged = function (event) {
        value = event.target._pos % 360
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
      resetBuffers({ background: true })
      init({ background: true })
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

  this.getPointerColor = function () {
    return pointerColor
  }

  this.setPointerColor = function (newPointerColor) {
    if (undefined !== newPointerColor.dark) {
      pointerColor = newPointerColor
      resetBuffers({ pointer: true })
      init({ pointer: true })
      this.repaint()
    }

    return this
  }

  this.getPointerType = function () {
    return pointerType
  }

  this.setPointerType = function (newPointerType) {
    if (undefined !== newPointerType.type) {
      pointerType = newPointerType
      resetBuffers({ pointer: true })
      init({ pointer: true })
      this.repaint()
    }

    return this
  }

  this.getPointSymbols = function () {
    return pointSymbols
  }

  this.setPointSymbols = function (newPointSymbols) {
    if (Object.prototype.toString.call(newPointSymbols) === '[object Array]' && newPointSymbols.length() === 8) {
      pointSymbols = newPointSymbols
      resetBuffers({ background: true })
      init({ background: true })
      this.repaint()
    }

    return this
  }

  this.repaint = function () {
    if (!initialized) {
      init({
        frame: true,
        background: true,
        pointer: true,
        foreground: true
      })
    }

    mainCtx.save()
    mainCtx.clearRect(0, 0, mainCtx.canvas.width, mainCtx.canvas.height)

    if (frameVisible) {
      mainCtx.drawImage(frameBuffer, 0, 0)
    }

    if (backgroundVisible) {
      mainCtx.drawImage(backgroundBuffer, 0, 0)
    }

    // Define rotation center
    const angle = HALF_PI + value * angleStep - HALF_PI
    if (rotateFace) {
      mainCtx.save()
      mainCtx.translate(center, center)
      mainCtx.rotate(-angle)
      mainCtx.translate(-center, -center)

      if (backgroundVisible) {
        mainCtx.drawImage(roseBuffer, 0, 0)
      }

      mainCtx.restore()
    } else {
      if (backgroundVisible) {
        mainCtx.drawImage(roseBuffer, 0, 0)
      }

      mainCtx.translate(center, center)
      mainCtx.rotate(angle)
      mainCtx.translate(-center, -center)
    }
    // Set the pointer shadow params
    mainCtx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    mainCtx.shadowOffsetX = mainCtx.shadowOffsetY = shadowOffset
    mainCtx.shadowBlur = shadowOffset * 2

    // Draw the pointer
    mainCtx.drawImage(pointerBuffer, 0, 0)

    // Undo the translations & shadow settings
    mainCtx.restore()

    if (foregroundVisible) {
      mainCtx.drawImage(foregroundBuffer, 0, 0)
    }

    repainting = false
  }

  // Visualize the component
  this.repaint()

  return this
}
