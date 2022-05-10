import Tween from './libs/tween.js'
import drawFrame from './tools/drawFrame'
import drawBackground from './tools/drawBackground'
import drawForeground from './tools/drawForeground'
import {
  createBuffer,
  requestAnimFrame,
  getCanvasContext,
  HALF_PI,
  TWO_PI,
  PI,
  RAD_FACTOR,
  stdFontName
} from './tools/tools'

import {
  BackgroundColor,
  ColorDef,
  FrameDesign,
  ForegroundType
} from './tools/definitions'

export const Level = function (canvas, parameters) {
  // Get the canvas context
  const mainCtx = getCanvasContext(canvas)

  // Parameters
  parameters = parameters || {}
  const size = undefined === parameters.size
    ? Math.min(mainCtx.canvas.width, mainCtx.canvas.height)
    : parameters.size
  const decimalsVisible =
    undefined === parameters.decimalsVisible
      ? false
      : parameters.decimalsVisible
  const textOrientationFixed =
    undefined === parameters.textOrientationFixed
      ? false
      : parameters.textOrientationFixed
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
  let pointerColor =
    undefined === parameters.pointerColor
      ? ColorDef.RED
      : parameters.pointerColor
  let foregroundType =
    undefined === parameters.foregroundType
      ? ForegroundType.TYPE1
      : parameters.foregroundType
  const foregroundVisible =
    undefined === parameters.foregroundVisible
      ? true
      : parameters.foregroundVisible
  const rotateFace =
    undefined === parameters.rotateFace ? false : parameters.rotateFace

  // Set the size - also clears the canvas
  mainCtx.canvas.width = size
  mainCtx.canvas.height = size

  // Adjust pointer color
  pointerColor.dark.setAlpha(0.70588)
  pointerColor.light.setAlpha(0.70588)

  // Constants
  const center = size / 2

  const angleStep = TWO_PI / 360
  const decimals = decimalsVisible ? 1 : 0

  const self = this

  // Internal variables
  let tween
  let repainting = false

  let value = 0
  let stepValue = 0
  let visibleValue = 0
  // let angle = 0
  // let angle = this.value

  let INDICATOR_ARROWS_PATH
  let INDICATOR_FRAMES_PATH
  let POINTER_PATH
  let STEP_POINTER_L_PATH
  let STEP_POINTER_R_PATH

  let initialized = false

  // **************   Buffer creation  ********************
  // Buffer for frame image
  const frameBuffer = createBuffer(size, size)
  let frameCtx = frameBuffer.getContext('2d')

  // Buffer for all static background painting code
  const backgroundBuffer = createBuffer(size, size)
  let backgroundCtx = backgroundBuffer.getContext('2d')

  // Buffer for pointer image painting code
  const pointerBuffer = createBuffer(size, size)
  let pointerCtx = pointerBuffer.getContext('2d')

  // Buffer for step pointer image painting code
  const stepPointerBuffer = createBuffer(size, size)
  let stepPointerCtx = stepPointerBuffer.getContext('2d')

  // Buffer for static foreground painting code
  const foregroundBuffer = createBuffer(size, size)
  let foregroundCtx = foregroundBuffer.getContext('2d')

  // *************   Internal Utils   *******************
  function calcVisibleValue (value) {
    if (value >= -360 && value < -270) {
      return Math.abs(value) - 270
    } else if (value < -180 /* && value >= -270 */) {
      return 270 - Math.abs(value)
    } else if (value < -90 /* && value >= -180 */) {
      return Math.abs(value) - 90
    } else if (value < 0 /* && value >= -90 */) {
      return 90 - Math.abs(value)
    } else if (value === 0) {
      return 90
    } else if (/* value > 0 && */ value <= 90) {
      return 90 - value
    } else if (/* value > 90 && */ value <= 180) {
      return value - 90
    } else if (/* value > 180 && */ value <= 270) {
      return 270 - value
    } else if (/* value > 270 && */ value <= 360) {
      return value - 270
    }

    return 0
  }

  // **************   Image creation  ********************
  const drawTickmarksImage = function (ctx) {
    let stdFont
    let smlFont

    if (size <= 100) {
      smlFont = '6px ' + stdFontName
      stdFont = '8px ' + stdFontName
    } else if (size <= 200) {
      smlFont = '8px ' + stdFontName
      stdFont = '10px ' + stdFontName
    } else if (size <= 300) {
      smlFont = '10px ' + stdFontName
      stdFont = '12px ' + stdFontName
    } else {
      smlFont = '12px ' + stdFontName
      stdFont = '14px ' + stdFontName
    }

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.save()
    ctx.strokeStyle = backgroundColor.labelColor.getRgbaColor()
    ctx.fillStyle = backgroundColor.labelColor.getRgbaColor()
    ctx.translate(center, center)

    let i
    let heightFactor
    for (i = 0; i < 360; i++) {
      heightFactor = (i % 45 === 0) ? 0.34 : (i % 5 === 0) ? 0.36 : 0.37

      ctx.strokeStyle = backgroundColor.labelColor.getRgbaColor()
      ctx.lineWidth = (i % 5 === 0) ? 1 : 0.5
      ctx.beginPath()
      ctx.moveTo(size * 0.38, 0)
      ctx.lineTo(size * heightFactor, 0)
      ctx.closePath()
      ctx.stroke()

      // Draw the labels
      ctx.save()
      switch (i) {
        case 0:
          ctx.translate(size * 0.31, 0)
          ctx.rotate(i * RAD_FACTOR + HALF_PI)
          ctx.font = stdFont
          ctx.fillText('0\u00B0', 0, 0, size)
          ctx.rotate(-(i * RAD_FACTOR) + HALF_PI)
          ctx.translate(-size * 0.31, 0)

          ctx.translate(size * 0.41, 0)
          ctx.rotate(i * RAD_FACTOR - HALF_PI)
          ctx.font = smlFont
          ctx.fillText('0%', 0, 0, size)
          break
        case 45:
          ctx.translate(size * 0.31, 0)
          ctx.rotate(i * RAD_FACTOR + 0.25 * PI)
          ctx.font = stdFont
          ctx.fillText('45\u00B0', 0, 0, size)
          ctx.rotate(-(i * RAD_FACTOR) + 0.25 * PI)
          ctx.translate(-size * 0.31, 0)

          ctx.translate(size * 0.31, size * 0.085)
          ctx.rotate(i * RAD_FACTOR - 0.25 * PI)
          ctx.font = smlFont
          ctx.fillText('100%', 0, 0, size)
          break
        case 90:
          ctx.translate(size * 0.31, 0)
          ctx.rotate(i * RAD_FACTOR)
          ctx.font = stdFont
          ctx.fillText('90\u00B0', 0, 0, size)
          ctx.rotate(-(i * RAD_FACTOR))
          ctx.translate(-size * 0.31, 0)

          ctx.translate(size * 0.21, 0)
          ctx.rotate(i * RAD_FACTOR)
          ctx.font = smlFont
          ctx.fillText('\u221E', 0, 0, size)
          break
        case 135:
          ctx.translate(size * 0.31, 0)
          ctx.rotate(i * RAD_FACTOR - 0.25 * PI)
          ctx.font = stdFont
          ctx.fillText('45\u00B0', 0, 0, size)
          ctx.rotate(-(i * RAD_FACTOR) - 0.25 * PI)
          ctx.translate(-size * 0.31, 0)

          ctx.translate(size * 0.31, -size * 0.085)
          ctx.rotate(i * RAD_FACTOR + 0.25 * PI)
          ctx.font = smlFont
          ctx.fillText('100%', 0, 0, size)
          break
        case 180:
          ctx.translate(size * 0.31, 0)
          ctx.rotate(i * RAD_FACTOR - HALF_PI)
          ctx.font = stdFont
          ctx.fillText('0\u00B0', 0, 0, size)
          ctx.rotate(-(i * RAD_FACTOR) - HALF_PI)
          ctx.translate(-size * 0.31, 0)

          ctx.translate(size * 0.41, 0)
          ctx.rotate(i * RAD_FACTOR + HALF_PI)
          ctx.font = smlFont
          ctx.fillText('0%', 0, 0, size)
          ctx.translate(-size * 0.41, 0)
          break
        case 225:
          ctx.translate(size * 0.31, 0)
          ctx.rotate(i * RAD_FACTOR - 0.75 * PI)
          ctx.font = stdFont
          ctx.fillText('45\u00B0', 0, 0, size)
          ctx.rotate(-(i * RAD_FACTOR) - 0.75 * PI)
          ctx.translate(-size * 0.31, 0)

          ctx.translate(size * 0.31, size * 0.085)
          ctx.rotate(i * RAD_FACTOR + 0.75 * PI)
          ctx.font = smlFont
          ctx.fillText('100%', 0, 0, size)
          break
        case 270:
          ctx.translate(size * 0.31, 0)
          ctx.rotate(i * RAD_FACTOR - PI)
          ctx.font = stdFont
          ctx.fillText('90\u00B0', 0, 0, size)
          ctx.rotate(-(i * RAD_FACTOR) - PI)
          ctx.translate(-size * 0.31, 0)

          ctx.translate(size * 0.21, 0)
          ctx.rotate(i * RAD_FACTOR - PI)
          ctx.font = smlFont
          ctx.fillText('\u221E', 0, 0, size)
          break
        case 315:
          ctx.translate(size * 0.31, 0)
          ctx.rotate(i * RAD_FACTOR - 1.25 * PI)
          ctx.font = stdFont
          ctx.fillText('45\u00B0', 0, 0, size)
          ctx.rotate(-(i * RAD_FACTOR) - 1.25 * PI)
          ctx.translate(-size * 0.31, 0)

          ctx.translate(size * 0.31, -size * 0.085)
          ctx.rotate(i * RAD_FACTOR + 1.25 * PI)
          ctx.font = smlFont
          ctx.fillText('100%', 0, 0, size)
          break
      }
      ctx.restore()

      ctx.rotate(angleStep)
    }
    ctx.translate(-center, -center)
    ctx.restore()
  }

  const drawMarkerImage = function (ctx) {
    if (!initialized) {
      INDICATOR_FRAMES_PATH = new Path2D()
      INDICATOR_ARROWS_PATH = new Path2D()

      // Left Frame
      INDICATOR_FRAMES_PATH.moveTo(size * 0.200934, size * 0.434579)
      INDICATOR_FRAMES_PATH.lineTo(size * 0.163551, size * 0.434579)
      INDICATOR_FRAMES_PATH.lineTo(size * 0.163551, size * 0.560747)
      INDICATOR_FRAMES_PATH.lineTo(size * 0.200934, size * 0.560747)

      // Right Frame
      INDICATOR_FRAMES_PATH.moveTo(size * 0.799065, size * 0.434579)
      INDICATOR_FRAMES_PATH.lineTo(size * 0.836448, size * 0.434579)
      INDICATOR_FRAMES_PATH.lineTo(size * 0.836448, size * 0.560747)
      INDICATOR_FRAMES_PATH.lineTo(size * 0.799065, size * 0.560747)

      // Left Triangle
      INDICATOR_ARROWS_PATH.moveTo(size * 0.163551, size * 0.471962)
      INDICATOR_ARROWS_PATH.lineTo(size * 0.205607, size * 0.5)
      INDICATOR_ARROWS_PATH.lineTo(size * 0.163551, size * 0.523364)
      INDICATOR_ARROWS_PATH.lineTo(size * 0.163551, size * 0.471962)
      INDICATOR_ARROWS_PATH.closePath()

      // Right Triangle
      INDICATOR_ARROWS_PATH.moveTo(size * 0.836448, size * 0.471962)
      INDICATOR_ARROWS_PATH.lineTo(size * 0.794392, size * 0.5)
      INDICATOR_ARROWS_PATH.lineTo(size * 0.836448, size * 0.523364)
      INDICATOR_ARROWS_PATH.lineTo(size * 0.836448, size * 0.471962)
      INDICATOR_ARROWS_PATH.closePath()
    }

    ctx.save()

    ctx.lineWidth = 1
    ctx.lineCap = 'square'
    ctx.lineJoin = 'miter'
    ctx.strokeStyle = backgroundColor.labelColor.getRgbaColor()
    ctx.fillStyle = backgroundColor.labelColor.getRgbaColor()
    ctx.stroke(INDICATOR_FRAMES_PATH)
    ctx.fill(INDICATOR_ARROWS_PATH)

    ctx.restore()
  }

  const drawPointerImage = function (ctx) {
    if (!initialized) {
      const w = size
      const h = size

      // POINTER_LEVEL
      POINTER_PATH = new Path2D()
      POINTER_PATH.moveTo(w * 0.523364, h * 0.350467)
      POINTER_PATH.lineTo(w * 0.5, h * 0.130841)
      POINTER_PATH.lineTo(w * 0.476635, h * 0.350467)
      POINTER_PATH.bezierCurveTo(w * 0.476635, h * 0.350467, w * 0.490654, h * 0.345794, w * 0.5, h * 0.345794)
      POINTER_PATH.bezierCurveTo(w * 0.509345, h * 0.345794, w * 0.523364, h * 0.350467, w * 0.523364, h * 0.350467)
      POINTER_PATH.closePath()
    }
    ctx.save()

    // ctx.save()
    // ctx.beginPath()
    // ctx.moveTo(width * 0.523364, height * 0.350467)
    // ctx.lineTo(width * 0.5, height * 0.130841)
    // ctx.lineTo(width * 0.476635, height * 0.350467)
    // ctx.bezierCurveTo(width * 0.476635, height * 0.350467, width * 0.490654, height * 0.345794, width * 0.5, height * 0.345794)
    // ctx.bezierCurveTo(width * 0.509345, height * 0.345794, width * 0.523364, height * 0.350467, width * 0.523364, height * 0.350467)
    // ctx.closePath()
    // pointerColor.dark.setAlpha(0.70588)
    // pointerColor.light.setAlpha(0.70588)
    const GRADIENT = ctx.createLinearGradient(0, 0.154205 * size, 0, 0.350466 * size)
    GRADIENT.addColorStop(0, pointerColor.dark.getRgbaColor())
    GRADIENT.addColorStop(0.3, pointerColor.light.getRgbaColor())
    GRADIENT.addColorStop(0.59, pointerColor.light.getRgbaColor())
    GRADIENT.addColorStop(1, pointerColor.dark.getRgbaColor())

    ctx.lineWidth = 1
    ctx.lineCap = 'square'
    ctx.lineJoin = 'miter'
    ctx.fillStyle = GRADIENT
    ctx.strokeStyle = pointerColor.light.getRgbaColor()
    ctx.fill(POINTER_PATH)
    ctx.stroke(POINTER_PATH)

    // pointerColor.dark.setAlpha(1)
    // pointerColor.light.setAlpha(1)

    ctx.restore()
  }

  const drawStepPointerImage = function (ctx) {
    if (!initialized) {
      const w = size
      const h = size

      // POINTER_LEVEL_LEFT
      STEP_POINTER_L_PATH = new Path2D()
      STEP_POINTER_L_PATH.moveTo(w * 0.285046, h * 0.514018)
      STEP_POINTER_L_PATH.lineTo(w * 0.21028, h * 0.5)
      STEP_POINTER_L_PATH.lineTo(w * 0.285046, h * 0.481308)
      STEP_POINTER_L_PATH.bezierCurveTo(w * 0.285046, h * 0.481308, w * 0.280373, h * 0.490654, w * 0.280373, h * 0.495327)
      STEP_POINTER_L_PATH.bezierCurveTo(w * 0.280373, h * 0.504672, w * 0.285046, h * 0.514018, w * 0.285046, h * 0.514018)
      STEP_POINTER_L_PATH.closePath()

      // POINTER_LEVEL_RIGHT
      STEP_POINTER_R_PATH = new Path2D()
      STEP_POINTER_R_PATH.moveTo(w * 0.714953, h * 0.514018)
      STEP_POINTER_R_PATH.lineTo(w * 0.789719, h * 0.5)
      STEP_POINTER_R_PATH.lineTo(w * 0.714953, h * 0.481308)
      STEP_POINTER_R_PATH.bezierCurveTo(w * 0.714953, h * 0.481308, w * 0.719626, h * 0.490654, w * 0.719626, h * 0.495327)
      STEP_POINTER_R_PATH.bezierCurveTo(w * 0.719626, h * 0.504672, w * 0.714953, h * 0.514018, w * 0.714953, h * 0.514018)
      STEP_POINTER_R_PATH.closePath()
    }

    ctx.save()

    const GRADIENT_LEFT = ctx.createLinearGradient(size * 0.224299, 0, size * 0.289719, 0)
    GRADIENT_LEFT.addColorStop(0, pointerColor.dark.getRgbaColor())
    GRADIENT_LEFT.addColorStop(0.3, pointerColor.light.getRgbaColor())
    GRADIENT_LEFT.addColorStop(0.59, pointerColor.light.getRgbaColor())
    GRADIENT_LEFT.addColorStop(1, pointerColor.dark.getRgbaColor())

    const GRADIENT_RIGHT = ctx.createLinearGradient(size * 0.7757, 0, size * 0.71028, 0)
    GRADIENT_RIGHT.addColorStop(0, pointerColor.dark.getRgbaColor())
    GRADIENT_RIGHT.addColorStop(0.3, pointerColor.light.getRgbaColor())
    GRADIENT_RIGHT.addColorStop(0.59, pointerColor.light.getRgbaColor())
    GRADIENT_RIGHT.addColorStop(1, pointerColor.dark.getRgbaColor())

    // const tmpDarkColor = pointerColor.dark
    // const tmpLightColor = pointerColor.light
    // tmpDarkColor.setAlpha(0.70588)
    // tmpLightColor.setAlpha(0.70588)

    // POINTER_LEVEL_LEFT
    // ctx.save()
    // ctx.beginPath()
    // ctx.moveTo(width * 0.285046, height * 0.514018)
    // ctx.lineTo(width * 0.21028, height * 0.5)
    // ctx.lineTo(width * 0.285046, height * 0.481308)
    // ctx.bezierCurveTo(width * 0.285046, height * 0.481308, width * 0.280373, height * 0.490654, width * 0.280373, height * 0.495327)
    // ctx.bezierCurveTo(width * 0.280373, height * 0.504672, width * 0.285046, height * 0.514018, width * 0.285046, height * 0.514018)
    // ctx.closePath()

    ctx.lineWidth = 1
    ctx.lineCap = 'square'
    ctx.lineJoin = 'miter'
    ctx.strokeStyle = pointerColor.light.getRgbaColor()

    ctx.fillStyle = GRADIENT_LEFT
    ctx.fill(STEP_POINTER_L_PATH)
    ctx.stroke(STEP_POINTER_L_PATH)

    // POINTER_LEVEL_RIGHT
    // ctx.save()
    // ctx.beginPath()
    // ctx.moveTo(width * 0.714953, height * 0.514018)
    // ctx.lineTo(width * 0.789719, height * 0.5)
    // ctx.lineTo(width * 0.714953, height * 0.481308)
    // ctx.bezierCurveTo(width * 0.714953, height * 0.481308, width * 0.719626, height * 0.490654, width * 0.719626, height * 0.495327)
    // ctx.bezierCurveTo(width * 0.719626, height * 0.504672, width * 0.714953, height * 0.514018, width * 0.714953, height * 0.514018)
    // ctx.closePath()

    // ctx.lineWidth = 1
    // ctx.lineCap = 'square'
    // ctx.lineJoin = 'miter'
    ctx.fillStyle = GRADIENT_RIGHT
    // ctx.strokeStyle = pointerColor.light.getRgbaColor()
    ctx.fill(STEP_POINTER_R_PATH)
    ctx.stroke(STEP_POINTER_R_PATH)

    // tmpDarkColor.setAlpha(1)
    // tmpLightColor.setAlpha(1)

    ctx.restore()
  }

  // **************   Initialization  ********************
  // Draw all static painting code to background
  const init = function (buffers) {
    buffers = buffers || {}
    const initFrame = undefined === buffers.frame ? false : buffers.frame
    const initBackground = undefined === buffers.background ? false : buffers.background
    const initPointers = undefined === buffers.pointers ? false : buffers.pointers
    const initForeground = undefined === buffers.foreground ? false : buffers.foreground

    if (initFrame && frameVisible) {
      drawFrame(frameCtx, frameDesign, center, center, size, size)
    }

    if (initBackground && backgroundVisible) {
      drawBackground(backgroundCtx, backgroundColor, center, center, size, size)
      drawTickmarksImage(backgroundCtx)
    }

    if (initBackground) {
      drawMarkerImage(pointerCtx)
    }

    if (initPointers) {
      drawPointerImage(pointerCtx)

      drawStepPointerImage(stepPointerCtx)
    }

    if (initForeground && foregroundVisible) {
      drawForeground(foregroundCtx, foregroundType, size, size, false)
    }
  }

  const resetBuffers = function (buffers) {
    buffers = buffers || {}
    const resetFrame = undefined === buffers.frame ? false : buffers.frame
    const resetBackground = undefined === buffers.background ? false : buffers.background
    const resetPointers = undefined === buffers.pointers ? false : buffers.pointers
    const resetForeground = undefined === buffers.foreground ? false : buffers.foreground

    if (resetFrame) {
      // Buffer for frame image painting code
      frameBuffer.width = size
      frameBuffer.height = size
      frameCtx = frameBuffer.getContext('2d')
    }

    if (resetBackground) {
      // Buffer for background image painting code
      backgroundBuffer.width = size
      backgroundBuffer.height = size
      backgroundCtx = backgroundBuffer.getContext('2d')
    }

    if (resetPointers) {
      // Buffer for pointer image painting code
      pointerBuffer.width = size
      pointerBuffer.height = size
      pointerCtx = pointerBuffer.getContext('2d')

      // Buffer for step pointer image painting code
      stepPointerBuffer.width = size
      stepPointerBuffer.height = size
      stepPointerCtx = stepPointerBuffer.getContext('2d')
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
    newValue = parseFloat(newValue)
    if (!isNaN(newValue)) {
      const targetValue = newValue < 0
        ? 360 + newValue
        : newValue > 359.9
          ? newValue - 360
          : newValue

      if (value !== targetValue) {
        if (undefined !== tween && tween.isPlaying) {
          tween.stop()
        }

        value = targetValue
        stepValue = 2 * ((Math.abs(value) * 10) % 10)

        if (stepValue > 10) {
          stepValue -= 20
        }

        visibleValue = calcVisibleValue(value)

        this.repaint()
      }
    }

    return this
  }

  this.setValueAnimated = function (newValue, callback) {
    newValue = parseFloat(newValue)
    if (!isNaN(newValue)) {
      if (360 - newValue + value < newValue - value) {
        newValue = 360 - newValue
      }
      if (value !== newValue) {
        if (undefined !== tween && tween.isPlaying) {
          tween.stop()
        }

        tween = new Tween({}, '', Tween.regularEaseInOut, value, newValue, 1)
        tween.onMotionChanged = function (event) {
          value = event.target._pos
          stepValue = 2 * ((Math.abs(value) * 10) % 10)
          if (stepValue > 10) {
            stepValue -= 20
          }

          visibleValue = calcVisibleValue(value)

          if (!repainting) {
            repainting = true
            requestAnimFrame(self.repaint)
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
      resetBuffers({ pointers: true })
      init({ pointers: true })
      this.repaint()
    }

    return this
  }

  this.repaint = function () {
    if (!initialized) {
      init({
        frame: true,
        background: true,
        pointers: true,
        foreground: true
      })
      initialized = true
    }

    mainCtx.save()

    // Clear the canvas
    mainCtx.clearRect(0, 0, size, size)

    // Draw frame
    if (frameVisible) {
      mainCtx.drawImage(frameBuffer, 0, 0)
    }

    const angle = HALF_PI + value * angleStep - HALF_PI
    if (rotateFace) {
      mainCtx.translate(center, center)
      mainCtx.rotate(-angle)
      mainCtx.translate(-center, -center)
    }

    // Draw background
    if (backgroundVisible) {
      mainCtx.drawImage(backgroundBuffer, 0, 0)
    }

    mainCtx.save()

    // Define rotation center
    mainCtx.translate(center, center)
    mainCtx.rotate(angle)

    // Draw pointer image
    mainCtx.translate(-center, -center)
    mainCtx.drawImage(pointerBuffer, 0, 0)

    // Draw value text
    mainCtx.textAlign = 'center'
    mainCtx.textBaseline = 'middle'
    mainCtx.fillStyle = backgroundColor.labelColor.getRgbaColor()

    let sizeFactor
    if (textOrientationFixed) {
      mainCtx.restore()
      sizeFactor = decimalsVisible ? 0.1 : 0.15
      mainCtx.font = size * sizeFactor + 'px ' + stdFontName
      mainCtx.fillText(visibleValue.toFixed(decimals) + '\u00B0', center, center, size * 0.35)
    } else {
      sizeFactor = decimalsVisible ? 0.5 : 0.2
      mainCtx.font = size * sizeFactor + 'px ' + stdFontName
      mainCtx.fillText(visibleValue.toFixed(decimals) + '\u00B0', center, center, size * 0.35)
      mainCtx.restore()
    }

    // Draw step pointer image
    mainCtx.translate(center, center)
    mainCtx.rotate(angle + stepValue * RAD_FACTOR)
    mainCtx.translate(-center, -center)
    mainCtx.drawImage(stepPointerBuffer, 0, 0)
    mainCtx.restore()

    // Draw foreground
    if (foregroundVisible) {
      mainCtx.drawImage(foregroundBuffer, 0, 0)
    }

    mainCtx.restore()

    repainting = false
  }

  // Visualize the component
  this.repaint()

  return this
}
