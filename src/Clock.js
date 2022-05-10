import drawFrame from './tools/draw/drawFrame'
import drawBackground from './tools/draw/drawBackground'
import drawRadialCustomImage from './tools/draw/drawRadialCustomImage'
import drawForeground from './tools/draw/drawForeground'
import { createBuffer, getCanvasContext, TWO_PI, RAD_FACTOR } from './tools/tools'

import {
  BackgroundColor,
  ColorDef,
  FrameDesign,
  PointerType,
  ForegroundType
} from './tools/definitions'

export const Clock = function (canvas, parameters) {
  // Get the canvas context and clear it
  const mainCtx = getCanvasContext(canvas)

  // Parameters
  parameters = parameters || {}
  const size =
    undefined === parameters.size
      ? Math.min(mainCtx.canvas.width, mainCtx.canvas.height)
      : parameters.size
  let frameDesign =
    undefined === parameters.frameDesign
      ? FrameDesign.METAL
      : parameters.frameDesign
  const frameVisible =
    undefined === parameters.frameVisible ? true : parameters.frameVisible
  let pointerType =
    undefined === parameters.pointerType
      ? PointerType.TYPE1
      : parameters.pointerType
  let pointerColor =
    undefined === parameters.pointerColor
      ? pointerType === PointerType.TYPE1
        ? ColorDef.GRAY
        : ColorDef.BLACK
      : parameters.pointerColor
  let backgroundColor =
    undefined === parameters.backgroundColor
      ? pointerType === PointerType.TYPE1
        ? BackgroundColor.ANTHRACITE
        : BackgroundColor.LIGHT_GRAY
      : parameters.backgroundColor
  const backgroundVisible =
    undefined === parameters.backgroundVisible
      ? true
      : parameters.backgroundVisible
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
  let isAutomatic =
    undefined === parameters.isAutomatic ? true : parameters.isAutomatic
  let hour = undefined === parameters.hour ? 11 : parameters.hour
  let minute = undefined === parameters.minute ? 5 : parameters.minute
  let second = undefined === parameters.second ? 0 : parameters.second
  let secondMovesContinuous =
    undefined === parameters.secondMovesContinuous
      ? false
      : parameters.secondMovesContinuous
  let timeZoneOffsetHour =
    undefined === parameters.timeZoneOffsetHour
      ? 0
      : parameters.timeZoneOffsetHour
  let timeZoneOffsetMinute =
    undefined === parameters.timeZoneOffsetMinute
      ? 0
      : parameters.timeZoneOffsetMinute
  let secondPointerVisible =
    undefined === parameters.secondPointerVisible
      ? true
      : parameters.secondPointerVisible

  // Set the size
  mainCtx.canvas.width = size
  mainCtx.canvas.height = size

  // Constants
  const center = size / 2

  const ANGLE_STEP = 6
  const FLUID_INTERVAL = 100
  const TICK_INTERVAL = 1000

  const self = this

  // Internal variables
  let objDate = new Date()
  let tickTimer

  let initialized = false

  // **************   Buffer creation  ********************
  // Buffer for the frame
  const frameBuffer = createBuffer(size, size)
  let frameCtx = frameBuffer.getContext('2d')

  // Buffer for static background painting code
  const backgroundBuffer = createBuffer(size, size)
  let backgroundCtx = backgroundBuffer.getContext('2d')

  // Buffer for hour pointer image painting code
  const hourBuffer = createBuffer(size, size)
  let hourPtrCtx = hourBuffer.getContext('2d')

  // Buffer for minute pointer image painting code
  const minuteBuffer = createBuffer(size, size)
  let minutePtrCtx = minuteBuffer.getContext('2d')

  // Buffer for second pointer image painting code
  const secondBuffer = createBuffer(size, size)
  let secondPtrCtx = secondBuffer.getContext('2d')

  // Buffer for static foreground painting code
  const foregroundBuffer = createBuffer(size, size)
  let foregroundCtx = foregroundBuffer.getContext('2d')

  // **************   Image creation  ********************
  const drawTickmarksImage = function (ctx) {
    const OUTER_POINT = size * 0.405
    let SMALL_TICK_HEIGHT
    let BIG_TICK_HEIGHT
    let SMALL_TICK_WIDTH
    let BIG_TICK_WIDTH
    let SMALL_TICK_STEP
    let BIG_TICK_STEP
    let tickAngle
    ctx.save()
    ctx.translate(center, center)

    switch (pointerType.type) {
      case 'type1':
        SMALL_TICK_HEIGHT = size * 0.074766
        SMALL_TICK_WIDTH = size * 0.014018
        SMALL_TICK_STEP = 30

        BIG_TICK_HEIGHT = size * 0.126168
        BIG_TICK_WIDTH = size * 0.03271
        BIG_TICK_STEP = 90
        break

      case 'type2':
      default:
        // Minutes
        SMALL_TICK_HEIGHT = size * 0.037383
        BIG_TICK_WIDTH = size * 0.009345
        SMALL_TICK_STEP = 6

        // Hours
        BIG_TICK_HEIGHT = size * 0.084112
        BIG_TICK_WIDTH = size * 0.028037
        BIG_TICK_STEP = 30
        break
    }

    // Draw minutes tickmarks
    ctx.strokeStyle = backgroundColor.labelColor.getRgbaColor()
    ctx.lineWidth = SMALL_TICK_WIDTH
    for (tickAngle = 0; tickAngle < 360; tickAngle += SMALL_TICK_STEP) {
      ctx.beginPath()
      ctx.moveTo(OUTER_POINT, 0)
      ctx.lineTo(OUTER_POINT - SMALL_TICK_HEIGHT, 0)
      ctx.closePath()
      ctx.stroke()
      ctx.rotate(SMALL_TICK_STEP * RAD_FACTOR)
    }

    // Draw hours tickmarks
    ctx.lineWidth = BIG_TICK_WIDTH
    for (tickAngle = 0; tickAngle < 360; tickAngle += BIG_TICK_STEP) {
      ctx.beginPath()
      ctx.moveTo(OUTER_POINT, 0)
      ctx.lineTo(OUTER_POINT - BIG_TICK_HEIGHT, 0)
      ctx.closePath()
      ctx.stroke()
      ctx.rotate(BIG_TICK_STEP * RAD_FACTOR)
    }

    // ctx.translate(-centerX, -centerY)
    ctx.restore()
  }

  const drawHourPointer = function (ctx) {
    ctx.save()
    let grad

    switch (pointerType.type) {
      case 'type2':
        ctx.beginPath()
        ctx.lineWidth = size * 0.046728
        ctx.moveTo(center, size * 0.289719)
        ctx.lineTo(center, size * 0.289719 + size * 0.224299)
        ctx.strokeStyle = pointerColor.medium.getRgbaColor()
        ctx.closePath()
        ctx.stroke()
        break

      case 'type1':
      /* falls through */
      default:
        ctx.beginPath()
        ctx.moveTo(size * 0.471962, size * 0.560747)
        ctx.lineTo(size * 0.471962, size * 0.214953)
        ctx.lineTo(size * 0.5, size * 0.182242)
        ctx.lineTo(size * 0.528037, size * 0.214953)
        ctx.lineTo(size * 0.528037, size * 0.560747)
        ctx.lineTo(size * 0.471962, size * 0.560747)
        ctx.closePath()
        grad = ctx.createLinearGradient(
          size * 0.471962,
          size * 0.560747,
          size * 0.528037,
          size * 0.214953
        )
        grad.addColorStop(1, pointerColor.veryLight.getRgbaColor())
        grad.addColorStop(0, pointerColor.light.getRgbaColor())
        ctx.fillStyle = grad
        ctx.strokeStyle = pointerColor.light.getRgbaColor()
        ctx.fill()
        ctx.stroke()
        break
    }
    ctx.restore()
  }

  const drawMinutePointer = function (ctx) {
    ctx.save()
    let grad

    switch (pointerType.type) {
      case 'type2':
        ctx.beginPath()
        ctx.lineWidth = size * 0.03271
        ctx.moveTo(center, size * 0.116822)
        ctx.lineTo(center, size * 0.116822 + size * 0.38785)
        ctx.strokeStyle = pointerColor.medium.getRgbaColor()
        ctx.closePath()
        ctx.stroke()
        break

      case 'type1':
      /* falls through */
      default:
        ctx.beginPath()
        ctx.moveTo(size * 0.518691, size * 0.574766)
        ctx.lineTo(size * 0.523364, size * 0.135514)
        ctx.lineTo(size * 0.5, size * 0.107476)
        ctx.lineTo(size * 0.476635, size * 0.140186)
        ctx.lineTo(size * 0.476635, size * 0.574766)
        ctx.lineTo(size * 0.518691, size * 0.574766)
        ctx.closePath()
        grad = ctx.createLinearGradient(
          size * 0.518691,
          size * 0.574766,
          size * 0.476635,
          size * 0.140186
        )
        grad.addColorStop(1, pointerColor.veryLight.getRgbaColor())
        grad.addColorStop(0, pointerColor.light.getRgbaColor())
        ctx.fillStyle = grad
        ctx.strokeStyle = pointerColor.light.getRgbaColor()
        ctx.fill()
        ctx.stroke()
        break
    }
    ctx.restore()
  }

  const drawSecondPointer = function (ctx) {
    ctx.save()
    let grad

    switch (pointerType.type) {
      case 'type2':
        // top rectangle
        ctx.lineWidth = size * 0.009345
        ctx.beginPath()
        ctx.moveTo(center, size * 0.09813)
        ctx.lineTo(center, size * 0.09813 + size * 0.126168)
        ctx.closePath()
        ctx.stroke()
        // bottom rectangle
        ctx.lineWidth = size * 0.018691
        ctx.beginPath()
        ctx.moveTo(center, size * 0.308411)
        ctx.lineTo(center, size * 0.308411 + size * 0.191588)
        ctx.closePath()
        ctx.stroke()
        // circle
        ctx.lineWidth = size * 0.016
        ctx.beginPath()
        ctx.arc(
          center,
          size * 0.26,
          (size * 0.085) / 2,
          0,
          TWO_PI
        )
        ctx.closePath()
        ctx.stroke()
        break

      case 'type1':
      /* falls through */
      default:
        ctx.beginPath()
        ctx.moveTo(size * 0.509345, size * 0.116822)
        ctx.lineTo(size * 0.509345, size * 0.574766)
        ctx.lineTo(size * 0.490654, size * 0.574766)
        ctx.lineTo(size * 0.490654, size * 0.116822)
        ctx.lineTo(size * 0.509345, size * 0.116822)
        ctx.closePath()
        grad = ctx.createLinearGradient(
          size * 0.509345,
          size * 0.116822,
          size * 0.490654,
          size * 0.574766
        )
        grad.addColorStop(0, ColorDef.RED.light.getRgbaColor())
        grad.addColorStop(0.47, ColorDef.RED.medium.getRgbaColor())
        grad.addColorStop(1, ColorDef.RED.dark.getRgbaColor())
        ctx.fillStyle = grad
        ctx.strokeStyle = ColorDef.RED.dark.getRgbaColor()
        ctx.fill()
        ctx.stroke()
        break
    }
    ctx.restore()
  }

  const drawKnob = function (ctx) {
    // draw the knob
    ctx.save()
    ctx.beginPath()
    ctx.arc(center, center, size * 0.045, 0, TWO_PI)
    ctx.closePath()
    const grad = ctx.createLinearGradient(
      center - (size * 0.045) / 2,
      center - (size * 0.045) / 2,
      center + (size * 0.045) / 2,
      center + (size * 0.045) / 2
    )
    grad.addColorStop(0, '#eef0f2')
    grad.addColorStop(1, '#65696d')
    ctx.fillStyle = grad
    ctx.fill()
    ctx.restore()
  }

  const drawTopKnob = function (ctx) {
    let grad

    ctx.save()

    switch (pointerType.type) {
      case 'type2':
        // draw knob
        ctx.fillStyle = '#000000'
        ctx.beginPath()
        ctx.arc(center, center, (size * 0.088785) / 2, 0, TWO_PI)
        ctx.closePath()
        ctx.fill()
        break

      case 'type1':
      /* falls through */
      default:
        // draw knob
        grad = ctx.createLinearGradient(
          center - (size * 0.027) / 2,
          center - (size * 0.027) / 2,
          center + (size * 0.027) / 2,
          center + (size * 0.027) / 2
        )
        grad.addColorStop(0, '#f3f4f7')
        grad.addColorStop(0.11, '#f3f5f7')
        grad.addColorStop(0.12, '#f1f3f5')
        grad.addColorStop(0.2, '#c0c5cb')
        grad.addColorStop(0.2, '#bec3c9')
        grad.addColorStop(1, '#bec3c9')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(center, center, size * 0.027, 0, TWO_PI)
        ctx.closePath()
        ctx.fill()
        break
    }

    ctx.restore()
  }

  const tickTock = function () {
    if (isAutomatic) {
      objDate = new Date()
    } else {
      objDate.setHours(hour)
      objDate.setMinutes(minute)
      objDate.setSeconds(second)
    }
    // Seconds
    second =
      objDate.getSeconds() +
      (secondMovesContinuous ? objDate.getMilliseconds() / 1000 : 0)

    // Hours
    if (timeZoneOffsetHour !== 0) {
      hour = objDate.getUTCHours() + timeZoneOffsetHour
    } else {
      hour = objDate.getHours()
    }
    hour = hour % 12

    // Minutes
    if (timeZoneOffsetMinute !== 0) {
      minute = objDate.getUTCMinutes() + timeZoneOffsetMinute
    } else {
      minute = objDate.getMinutes()
    }
    if (minute > 60) {
      minute -= 60
      hour++
    }
    if (minute < 0) {
      minute += 60
      hour--
    }
    hour = hour % 12

    if (isAutomatic) {
      const tickInterval = secondMovesContinuous ? FLUID_INTERVAL : TICK_INTERVAL
      tickTimer = setTimeout(tickTock, secondPointerVisible ? tickInterval : FLUID_INTERVAL)
    }

    self.repaint()
  }

  // **************   Initialization  ********************
  // Draw all static painting code to background
  const init = function (parameters) {
    parameters = parameters || {}
    const initFrame =
      undefined === parameters.frame ? false : parameters.frame
    const initBackground =
      undefined === parameters.background ? false : parameters.background
    const initPointers =
      undefined === parameters.pointers ? false : parameters.pointers
    const initForeground =
      undefined === parameters.foreground ? false : parameters.foreground

    initialized = true

    if (initFrame && frameVisible) {
      drawFrame(frameCtx, frameDesign, center, center, size, size)
    }

    if (initBackground && backgroundVisible) {
      // Create background in backgroundBuffer
      drawBackground(backgroundCtx, backgroundColor, center, center, size, size)

      // Create custom layer in backgroundBuffer
      drawRadialCustomImage(backgroundCtx, customLayer, center, center, size, size)

      drawTickmarksImage(backgroundCtx)
    }

    if (initPointers) {
      drawHourPointer(hourPtrCtx)
      drawMinutePointer(minutePtrCtx)
      drawSecondPointer(secondPtrCtx)
    }

    if (initForeground && foregroundVisible) {
      drawTopKnob(foregroundCtx, pointerType)
      drawForeground(foregroundCtx, foregroundType, size, size, false)
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
      hourBuffer.width = size
      hourBuffer.height = size
      hourPtrCtx = hourBuffer.getContext('2d')

      minuteBuffer.width = size
      minuteBuffer.height = size
      minutePtrCtx = minuteBuffer.getContext('2d')

      secondBuffer.width = size
      secondBuffer.height = size
      secondPtrCtx = secondBuffer.getContext('2d')
    }

    if (resetForeground) {
      foregroundBuffer.width = size
      foregroundBuffer.height = size
      foregroundCtx = foregroundBuffer.getContext('2d')
    }
  }

  //* *********************************** Public methods **************************************
  this.getAutomatic = function () {
    return isAutomatic
  }

  this.setAutomatic = function (newValue) {
    newValue = !!newValue
    if (isAutomatic && !newValue) {
      // stop the clock!
      clearTimeout(tickTimer)
      isAutomatic = newValue
    } else if (!isAutomatic && newValue) {
      // start the clock
      isAutomatic = newValue
      tickTock()
    }
    return this
  }

  this.getHour = function () {
    return hour
  }

  this.setHour = function (newValue) {
    newValue = parseInt(newValue, 10) % 12

    if (!isNaN(newValue)) {
      if (hour !== newValue) {
        hour = newValue
        this.repaint()
      }
    }

    return this
  }

  this.getMinute = function () {
    return minute
  }

  this.setMinute = function (newValue) {
    newValue = parseInt(newValue, 10) % 60

    if (!isNaN(newValue)) {
      if (minute !== newValue) {
        minute = newValue
        this.repaint()
      }
    }

    return this
  }

  this.getSecond = function () {
    return second
  }

  this.setSecond = function (newValue) {
    newValue = parseInt(newValue, 10) % 60

    if (!isNaN(newValue)) {
      if (second !== newValue) {
        second = newValue
        this.repaint()
      }
    }

    return this
  }

  this.getTimeZoneOffsetHour = function () {
    return timeZoneOffsetHour
  }

  this.setTimeZoneOffsetHour = function (newValue) {
    newValue = parseInt(newValue, 10)
    if (!isNaN(newValue)) {
      timeZoneOffsetHour = newValue
      this.repaint()
    }

    return this
  }

  this.getTimeZoneOffsetMinute = function () {
    return timeZoneOffsetMinute
  }

  this.setTimeZoneOffsetMinute = function (newValue) {
    newValue = parseInt(newValue, 10)
    if (!isNaN(newValue)) {
      timeZoneOffsetMinute = newValue
      this.repaint()
    }

    return this
  }

  this.getSecondPointerVisible = function () {
    return secondPointerVisible
  }

  this.setSecondPointerVisible = function (newValue) {
    secondPointerVisible = !!newValue
    this.repaint()
    return this
  }

  this.getSecondMovesContinuous = function () {
    return secondMovesContinuous
  }

  this.setSecondMovesContinuous = function (newValue) {
    secondMovesContinuous = !!newValue
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
      resetBuffers({ /* frame: true, */ background: true })
      init({ /* frame: true, */ background: true })
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

  this.getPointerType = function () {
    return pointerType
  }

  this.setPointerType = function (newPointerType) {
    if (undefined !== newPointerType.type) {
      resetBuffers({ background: true, foreground: true, pointers: true })
      pointerType = newPointerType
      if (pointerType.type === 'type1') {
        pointerColor = ColorDef.GRAY
        backgroundColor = BackgroundColor.ANTHRACITE
      } else {
        pointerColor = ColorDef.BLACK
        backgroundColor = BackgroundColor.LIGHT_GRAY
      }
      init({ background: true, foreground: true, pointers: true })
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
    }

    // mainCtx.save();
    mainCtx.clearRect(0, 0, mainCtx.canvas.width, mainCtx.canvas.height)

    // Draw frame
    if (frameVisible) {
      mainCtx.drawImage(frameBuffer, 0, 0)
    }

    // Draw buffered image to visible canvas
    if (backgroundVisible) {
      mainCtx.drawImage(backgroundBuffer, 0, 0)
    }

    // have to draw to a rotated temporary image area so we can translate in
    // absolute x, y values when drawing to main context
    const shadowOffset = size * 0.006

    const secondPointerAngle = second * ANGLE_STEP * RAD_FACTOR
    const minutePointerAngle = minute * ANGLE_STEP * RAD_FACTOR
    const hourPointerAngle = (hour + minute / 60) * ANGLE_STEP * 5 * RAD_FACTOR

    // draw hour pointer
    // Define rotation center
    mainCtx.save()
    mainCtx.translate(center, center)
    mainCtx.rotate(hourPointerAngle)
    mainCtx.translate(-center, -center)
    // Set the pointer shadow params
    mainCtx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    mainCtx.shadowOffsetX = mainCtx.shadowOffsetY = shadowOffset
    mainCtx.shadowBlur = shadowOffset * 2
    // Draw the pointer
    mainCtx.drawImage(hourBuffer, 0, 0)

    // draw minute pointer
    // Define rotation center
    mainCtx.translate(center, center)
    mainCtx.rotate(minutePointerAngle - hourPointerAngle)
    mainCtx.translate(-center, -center)
    mainCtx.drawImage(minuteBuffer, 0, 0)
    mainCtx.restore()

    if (pointerType.type === 'type1') {
      drawKnob(mainCtx)
    }

    if (secondPointerVisible) {
      // draw second pointer
      // Define rotation center
      mainCtx.save()
      mainCtx.translate(center, center)
      mainCtx.rotate(secondPointerAngle)
      mainCtx.translate(-center, -center)
      // Set the pointer shadow params
      mainCtx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      mainCtx.shadowOffsetX = mainCtx.shadowOffsetY = shadowOffset
      mainCtx.shadowBlur = shadowOffset * 2
      // Draw the pointer
      mainCtx.drawImage(secondBuffer, 0, 0)
      mainCtx.restore()
    }

    // Draw foreground
    if (foregroundVisible) {
      mainCtx.drawImage(foregroundBuffer, 0, 0)
    }
  }

  // Visualize the component
  tickTock()

  return this
}
