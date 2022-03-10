import Tween from './tools/tween.js'
import drawFrame from './tools/drawFrame'
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
  ColorDef,
  FrameDesign,
  ForegroundType
} from './tools/definitions'

export const Horizon = function (canvas, parameters) {
  // Get the canvas context
  const mainCtx = getCanvasContext(canvas)

  // Parameters
  parameters = parameters || {}
  const size = undefined === parameters.size
    ? Math.min(mainCtx.canvas.width, mainCtx.canvas.height)
    : parameters.size
  let frameDesign = undefined === parameters.frameDesign
    ? FrameDesign.METAL
    : parameters.frameDesign
  const frameVisible =
    undefined === parameters.frameVisible ? true : parameters.frameVisible
  let foregroundType = undefined === parameters.foregroundType
    ? ForegroundType.TYPE1
    : parameters.foregroundType
  const foregroundVisible = undefined === parameters.foregroundVisible
    ? true
    : parameters.foregroundVisible
  let pointerColor = undefined === parameters.pointerColor
    ? ColorDef.WHITE
    : parameters.pointerColor

  // Set the size - also clears the canvas
  mainCtx.canvas.width = size
  mainCtx.canvas.height = size

  // Constants
  const center = size / 2

  const pitchPixel = (PI * size) / 360

  const self = this

  // Internal variables
  let roll = 0
  let pitch = 0
  let tweenRoll
  let tweenPitch
  let repainting = false
  let pitchOffset = 0
  let upsidedown = false
  // const center = height / 2

  let initialized = false

  // **************   Buffer creation  ********************
  // Buffer for all static background painting code
  const frameBuffer = createBuffer(size, size)
  let frameCtx = frameBuffer.getContext('2d')

  // Buffer for pointer image painting code
  const backgroundBuffer = createBuffer(size, size * PI)
  let backgroundCtx = backgroundBuffer.getContext('2d')

  // Buffer for indicator painting code
  const indicatorBuffer = createBuffer(size * 0.037383, size * 0.056074)
  let indicatorCtx = indicatorBuffer.getContext('2d')

  // Buffer for static foreground painting code
  const foregroundBuffer = createBuffer(size, size)
  let foregroundCtx = foregroundBuffer.getContext('2d')

  // **************   Image creation  ********************
  const drawHorizonBackgroundImage = function (ctx) {
    ctx.save()

    const w = size
    const h = size * PI

    const fontSize = w * 0.04
    const stepSizeY = (h / 360) * 5

    const HORIZON_GRADIENT = ctx.createLinearGradient(0, 0, 0, h)
    HORIZON_GRADIENT.addColorStop(0, '#7fd5f0')
    HORIZON_GRADIENT.addColorStop(0.5, '#7fd5f0')
    HORIZON_GRADIENT.addColorStop(0.5, '#3c4439')
    HORIZON_GRADIENT.addColorStop(1, '#3c4439')

    // HORIZON
    ctx.beginPath()
    ctx.rect(0, 0, w, h)
    ctx.closePath()
    ctx.fillStyle = HORIZON_GRADIENT
    ctx.fill()

    ctx.lineWidth = 1
    ctx.fillStyle = '#37596e'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = fontSize + 'px ' + stdFontName

    // Positive ticks
    let stepTen = false
    let step = 10
    let y
    for (y = h / 2 - stepSizeY; y > 0; y -= stepSizeY) {
      if (step <= 90) {
        if (stepTen) {
          ctx.fillText(step, (w - w * 0.2) / 2 - 15, y, w * 0.375) // EDIT: 8 -> 15
          ctx.fillText(step, w - (w - w * 0.2) / 2 + 15, y, w * 0.375) // EDIT: 8 -> 15

          ctx.beginPath()
          ctx.moveTo((w - w * 0.18) / 2, y) // EDIT: 0.2 -> 0.18
          ctx.lineTo(w - (w - w * 0.18) / 2, y) // EDIT: 0.2 -> 0.18
          ctx.closePath()

          step += 10
        } else {
          ctx.beginPath()
          ctx.moveTo((w - w * 0.1) / 2, y)
          ctx.lineTo(w - (w - w * 0.1) / 2, y)
          ctx.closePath()
        }
        ctx.stroke()
      }
      stepTen ^= true
    }

    // Central line
    ctx.lineWidth = 1.5
    ctx.strokeStyle = '#FFFFFF'

    ctx.beginPath()
    ctx.moveTo(0, h / 2)
    ctx.lineTo(w, h / 2)
    ctx.closePath()
    ctx.stroke()

    // Negative ticks
    ctx.lineWidth = 1
    ctx.fillStyle = '#FFFFFF'

    stepTen = false
    step = 10
    for (y = h / 2 + stepSizeY; y <= h; y += stepSizeY) {
      if (step <= 90) {
        if (stepTen) {
          ctx.fillText(-step, (w - w * 0.2) / 2 - 18, y, w * 0.375) // EDIT: 8 -> 18
          ctx.fillText(-step, w - (w - w * 0.2) / 2 + 18, y, w * 0.375) // EDIT: 8 -> 18

          ctx.beginPath()
          ctx.moveTo((w - w * 0.18) / 2, y) // EDIT: 0.2 -> 0.18
          ctx.lineTo(w - (w - w * 0.18) / 2, y) // EDIT: 0.2 -> 0.18
          ctx.closePath()

          step += 10
        } else {
          ctx.beginPath()
          ctx.moveTo((w - w * 0.1) / 2, y)
          ctx.lineTo(w - (w - w * 0.1) / 2, y)
          ctx.closePath()
        }
        ctx.stroke()
      }
      stepTen ^= true
    }

    ctx.restore()
  }

  const drawHorizonForegroundImage = function (ctx) {
    const w = size
    const h = size

    ctx.save()

    ctx.fillStyle = pointerColor.light.getRgbaColor()

    // CENTERINDICATOR
    ctx.beginPath()
    ctx.moveTo(w * 0.476635, h * 0.5)
    ctx.bezierCurveTo(w * 0.476635, h * 0.514018, w * 0.485981, h * 0.523364, w * 0.5, h * 0.523364)
    ctx.bezierCurveTo(w * 0.514018, h * 0.523364, w * 0.523364, h * 0.514018, w * 0.523364, h * 0.5)
    ctx.bezierCurveTo(w * 0.523364, h * 0.485981, w * 0.514018, h * 0.476635, w * 0.5, h * 0.476635)
    ctx.bezierCurveTo(w * 0.485981, h * 0.476635, w * 0.476635, h * 0.485981, w * 0.476635, h * 0.5)
    ctx.closePath()

    ctx.moveTo(w * 0.415887, h * 0.504672)
    ctx.lineTo(w * 0.415887, h * 0.495327)
    ctx.bezierCurveTo(w * 0.415887, h * 0.495327, w * 0.467289, h * 0.495327, w * 0.467289, h * 0.495327)
    ctx.bezierCurveTo(w * 0.471962, h * 0.481308, w * 0.481308, h * 0.471962, w * 0.495327, h * 0.467289)
    ctx.bezierCurveTo(w * 0.495327, h * 0.467289, w * 0.495327, h * 0.415887, w * 0.495327, h * 0.415887)
    ctx.lineTo(w * 0.504672, h * 0.415887)
    ctx.bezierCurveTo(w * 0.504672, h * 0.415887, w * 0.504672, h * 0.467289, w * 0.504672, h * 0.467289)
    ctx.bezierCurveTo(w * 0.518691, h * 0.471962, w * 0.528037, h * 0.481308, w * 0.53271, h * 0.495327)
    ctx.bezierCurveTo(w * 0.53271, h * 0.495327, w * 0.584112, h * 0.495327, w * 0.584112, h * 0.495327)
    ctx.lineTo(w * 0.584112, h * 0.504672)
    ctx.bezierCurveTo(w * 0.584112, h * 0.504672, w * 0.53271, h * 0.504672, w * 0.53271, h * 0.504672)
    ctx.bezierCurveTo(w * 0.528037, h * 0.518691, w * 0.518691, h * 0.53271, w * 0.5, h * 0.53271)
    ctx.bezierCurveTo(w * 0.481308, h * 0.53271, w * 0.471962, h * 0.518691, w * 0.467289, h * 0.504672)
    ctx.bezierCurveTo(w * 0.467289, h * 0.504672, w * 0.415887, h * 0.504672, w * 0.415887, h * 0.504672)
    ctx.closePath()
    ctx.fill()

    // Tickmarks
    ctx.translate(center, center)
    ctx.rotate(-HALF_PI)
    ctx.translate(-center, -center)

    const step = 5
    const stepRad = 5 * RAD_FACTOR
    let angle
    for (angle = -90; angle <= 90; angle += step) {
      const heightFactor = (angle % 45 === 0 || angle === 0) ? 0.113 : ((angle % 15 === 0) ? 0.103785 : 0.093785)
      ctx.strokeStyle = (angle % 45 === 0 || angle === 0) ? pointerColor.medium.getRgbaColor() : '#FFFFFF'
      ctx.lineWidth = (angle % 45 === 0 || angle === 0) ? 2 : ((angle % 15 === 0) ? 1 : 0.5)

      ctx.beginPath()
      ctx.moveTo(w * 0.5, h * 0.088785)
      ctx.lineTo(w * 0.5, h * heightFactor)
      ctx.closePath()
      ctx.stroke()

      ctx.translate(center, center)
      ctx.rotate(stepRad, center, center)
      ctx.translate(-center, -center)
    }

    ctx.restore()
  }

  const drawIndicatorImage = function (ctx) {
    ctx.save()

    const w = size * 0.037383
    const h = size * 0.056074

    ctx.fillStyle = pointerColor.light.getRgbaColor()
    ctx.strokeStyle = pointerColor.medium.getRgbaColor()

    ctx.beginPath()
    ctx.moveTo(w * 0.5, 0)
    ctx.lineTo(0, h)
    ctx.lineTo(w, h)
    ctx.closePath()

    ctx.fill()
    ctx.stroke()

    ctx.restore()
  }

  // **************   Initialization  ********************
  // Draw all static painting code to background
  const init = function (buffers) {
    buffers = buffers || {}
    const initFrame = undefined === buffers.frame ? false : buffers.frame
    const initBackground = undefined === buffers.background ? false : buffers.background
    const initIndicator = undefined === buffers.indicator ? false : buffers.indicator
    const initForeground = undefined === buffers.foreground ? false : buffers.foreground

    initialized = true

    if (initFrame && frameVisible) {
      drawFrame(frameCtx, frameDesign, center, center, size, size)
    }

    if (initBackground) {
      drawHorizonBackgroundImage(backgroundCtx)
    }

    if (initIndicator) {
      drawIndicatorImage(indicatorCtx)
    }

    if (initForeground) {
      drawHorizonForegroundImage(foregroundCtx)

      if (foregroundVisible) {
        drawForeground(foregroundCtx, foregroundType, size, size)
      }
    }
  }

  const resetBuffers = function (buffers) {
    buffers = buffers || {}
    const resetFrame = undefined === buffers.frame ? false : buffers.frame
    const resetBackground = undefined === buffers.background ? false : buffers.background
    const resetIndicator = undefined === buffers.indicator ? false : buffers.indicator
    const resetForeground = undefined === buffers.foreground ? false : buffers.foreground

    if (resetFrame) {
      // Buffer for all static background painting code
      frameBuffer.width = size
      frameBuffer.height = size
      frameCtx = frameBuffer.getContext('2d')
    }

    if (resetBackground) {
      // Buffer for pointer image painting code
      backgroundBuffer.width = size
      backgroundBuffer.height = size * PI
      backgroundCtx = backgroundBuffer.getContext('2d')
    }

    if (resetIndicator) {
      // Buffer for the indicator
      indicatorBuffer.width = size * 0.037383
      indicatorBuffer.height = size * 0.056074
      indicatorCtx = indicatorBuffer.getContext('2d')
    }

    if (resetForeground) {
      // Buffer for static foreground painting code
      foregroundBuffer.width = size
      foregroundBuffer.height = size
      foregroundCtx = foregroundBuffer.getContext('2d')
    }
  }

  //* *********************************** Public methods **************************************
  this.getRoll = function () {
    return roll
  }

  this.setRoll = function (newRoll) {
    newRoll = parseFloat(newRoll) % 360
    if (!isNaN(newRoll) && roll !== newRoll) {
      roll = newRoll
      this.repaint()
    }

    return this
  }

  this.setRollAnimated = function (newRoll, callback) {
    newRoll = parseFloat(newRoll) % 360
    if (!isNaN(newRoll) && roll !== newRoll) {
      if (undefined !== tweenRoll && tweenRoll.isPlaying) {
        tweenRoll.stop()
      }

      tweenRoll = new Tween({}, '', Tween.regularEaseInOut, roll, newRoll, 1)

      tweenRoll.onMotionChanged = function (event) {
        roll = event.target._pos

        if (!repainting) {
          repainting = true
          requestAnimFrame(self.repaint)
        }
      }

      // do we have a callback function to process?
      if (callback && typeof callback === 'function') {
        tweenRoll.onMotionFinished = callback
      }

      tweenRoll.start()
    }
    return this
  }

  this.getPitch = function () {
    return pitch
  }

  this.setPitch = function (newPitch) {
    // constrain to range -180..180
    // normal range -90..90 and -180..-90/90..180 indicate inverted
    newPitch = ((parseFloat(newPitch) + 180 - pitchOffset) % 360) - 180
    // pitch = -(newPitch + pitchOffset) % 180;
    if (!isNaN(newPitch) && pitch !== newPitch) {
      pitch = newPitch
      if (pitch > 90) {
        pitch = 90 - (pitch - 90)
        if (!upsidedown) {
          this.setRoll(roll - 180)
        }
        upsidedown = true
      } else if (pitch < -90) {
        pitch = -90 + (-90 - pitch)
        if (!upsidedown) {
          this.setRoll(roll + 180)
        }
        upsidedown = true
      } else {
        upsidedown = false
      }
      this.repaint()
    }
    return this
  }

  this.setPitchAnimated = function (newPitch, callback) {
    // const gauge = this
    newPitch = parseFloat(newPitch)
    // perform all range checking in setPitch()
    if (!isNaN(newPitch) && pitch !== newPitch) {
      if (undefined !== tweenPitch && tweenPitch.isPlaying) {
        tweenPitch.stop()
      }

      tweenPitch = new Tween({}, '', Tween.regularEaseInOut, pitch, newPitch, 1)
      tweenPitch.onMotionChanged = function (event) {
        pitch = event.target._pos
        if (pitch > 90) {
          pitch = 90 - (pitch - 90)
          if (!upsidedown) {
            this.setRoll(roll - 180)
          }
          upsidedown = true
        } else if (pitch < -90) {
          pitch = -90 + (-90 - pitch)
          if (!upsidedown) {
            this.setRoll(roll + 180)
          }
          upsidedown = true
        } else {
          upsidedown = false
        }

        if (!repainting) {
          repainting = true
          requestAnimFrame(this.repaint)
        }
      }

      // do we have a callback function to process?
      if (callback && typeof callback === 'function') {
        tweenPitch.onMotionFinished = callback
      }

      tweenPitch.start()
    }
    return this
  }

  this.getPitchOffset = function () {
    return pitchOffset
  }

  this.setPitchOffset = function (newPitchOffset) {
    newPitchOffset = parseFloat(newPitchOffset)
    if (!isNaN(newPitchOffset)) {
      pitchOffset = newPitchOffset
      this.repaint()
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

  this.setPointerColor = function (newColor) {
    if (undefined !== newColor.dark) {
      pointerColor = newColor
      resetBuffers({ indicator: true, foreground: true })
      init({ indicator: true, foreground: true })
      this.repaint()
    }

    return this
  }

  this.repaint = function () {
    if (!initialized) {
      init({
        frame: true,
        background: true,
        indicator: true,
        foreground: true
      })
    }

    // Clear the canvas
    mainCtx.clearRect(0, 0, mainCtx.canvas.width, mainCtx.canvas.height)

    // Draw Background
    mainCtx.drawImage(frameBuffer, 0, 0)

    mainCtx.save()

    // Set the clipping area
    mainCtx.beginPath()
    mainCtx.arc(center, center, (size * 0.831775) / 2, 0, TWO_PI, true)
    mainCtx.closePath()
    mainCtx.clip()

    // Rotate around roll
    mainCtx.translate(center, center)
    mainCtx.rotate(-(roll * RAD_FACTOR))
    mainCtx.translate(-center, 0)

    // Translate about dive
    mainCtx.translate(0, pitch * pitchPixel)

    // Draw horizon
    mainCtx.drawImage(backgroundBuffer, 0, -backgroundBuffer.height / 2)

    // Draw the scale and angle indicator
    mainCtx.translate(0, -(pitch * pitchPixel) - center)
    mainCtx.drawImage(
      indicatorBuffer,
      size * 0.5 - indicatorBuffer.width / 2,
      size * 0.107476
    )
    mainCtx.restore()

    // Draw foreground
    mainCtx.drawImage(foregroundBuffer, 0, 0)

    repainting = false
  }

  // Visualize the component
  this.repaint()

  return this
}
