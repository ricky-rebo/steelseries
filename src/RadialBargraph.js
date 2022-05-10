import Tween from './tools/tween.js'
import drawFrame from './tools/drawFrame'
import drawBackground from './tools/drawBackground'
import drawRadialCustomImage from './tools/drawRadialCustomImage'
import drawForeground from './tools/drawForeground'
import createTrendIndicator from './tools/createTrendIndicator'
import drawTitleImage from './tools/drawTitleImage'
import { drawActiveBargraphLed } from './tools/draw/drawActiveBargraphLed'
import {
  calcNiceNumber,
  createBuffer,
  customColorDef,
  requestAnimFrame,
  getCanvasContext,
  HALF_PI,
  TWO_PI,
  RAD_FACTOR,
  DEG_FACTOR,
  createAudioElement,
  coalesce,
  setInRange
} from './tools/tools'

import {
  BackgroundColor,
  LcdColor,
  ColorDef,
  LedColor,
  GaugeType,
  FrameDesign,
  ForegroundType,
  LabelNumberFormat,
  TickLabelOrientation,
  TrendState
} from './tools/definitions'
import { Led } from './Led.js'
import { DisplaySingle } from './DisplaySingle.js'
import { drawRadialTickmarksImage, MAX_MAJOR_TICKS_COUNT } from './tools/draw/drawRadialTickmarksImage.js'
import { getRadialRotationParams } from './tools/radial'
import { validBackgroundColor, validColor, validForegroundType, validFrameDesign, validLabelNumberFormat, validTrendState } from './tools/validation.js'

export const RadialBargraph = function (canvas, parameters) {
  // Get the canvas context
  const mainCtx = getCanvasContext(canvas)

  // Parameters
  parameters = parameters || {}
  const gaugeType = undefined === parameters.gaugeType ? GaugeType.TYPE4 : parameters.gaugeType
  const SIZE = undefined === parameters.size ? Math.min(mainCtx.canvas.width, mainCtx.canvas.height) : parameters.size
  let minValue = undefined === parameters.minValue ? 0 : parameters.minValue
  let maxValue = undefined === parameters.maxValue ? minValue + 100 : parameters.maxValue
  const niceScale = undefined === parameters.niceScale ? true : parameters.niceScale
  let threshold = undefined === parameters.threshold ? (maxValue - minValue) / 2 + minValue : parameters.threshold
  let thresholdRising = undefined === parameters.thresholdRising ? true : parameters.thresholdRising
  let section = undefined === parameters.section ? null : parameters.section
  let useSectionColors = undefined === parameters.useSectionColors ? false : parameters.useSectionColors
  let titleString = undefined === parameters.titleString ? '' : parameters.titleString
  let unitString = undefined === parameters.unitString ? '' : parameters.unitString
  let frameDesign = undefined === parameters.frameDesign ? FrameDesign.METAL : parameters.frameDesign
  const frameVisible = undefined === parameters.frameVisible ? true : parameters.frameVisible
  let backgroundColor = undefined === parameters.backgroundColor ? BackgroundColor.DARK_GRAY : parameters.backgroundColor
  const backgroundVisible = undefined === parameters.backgroundVisible ? true : parameters.backgroundVisible
  let valueColor = undefined === parameters.valueColor ? ColorDef.RED : parameters.valueColor
  const lcdColor = undefined === parameters.lcdColor ? LcdColor.STANDARD : parameters.lcdColor
  const lcdVisible = undefined === parameters.lcdVisible ? true : parameters.lcdVisible
  const lcdDecimals = undefined === parameters.lcdDecimals ? 2 : parameters.lcdDecimals
  const digitalFont = undefined === parameters.digitalFont ? false : parameters.digitalFont
  let fractionalScaleDecimals = undefined === parameters.fractionalScaleDecimals ? 1 : parameters.fractionalScaleDecimals
  const customLayer = undefined === parameters.customLayer ? null : parameters.customLayer
  const ledColor = undefined === parameters.ledColor ? LedColor.RED_LED : parameters.ledColor
  let ledVisible = undefined === parameters.ledVisible ? true : parameters.ledVisible
  const userLedColor = undefined === parameters.userLedColor ? LedColor.GREEN_LED : parameters.userLedColor
  let userLedVisible = undefined === parameters.userLedVisible ? false : parameters.userLedVisible
  let labelNumberFormat =
    undefined === parameters.labelNumberFormat
      ? LabelNumberFormat.STANDARD
      : parameters.labelNumberFormat
  let foregroundType =
    undefined === parameters.foregroundType
      ? ForegroundType.TYPE1
      : parameters.foregroundType
  const foregroundVisible =
    undefined === parameters.foregroundVisible
      ? true
      : parameters.foregroundVisible
  const playAlarm =
    undefined === parameters.playAlarm ? false : parameters.playAlarm
  const alarmSound =
    undefined === parameters.alarmSound ? false : parameters.alarmSound
  let valueGradient = undefined === parameters.valueGradient ? null : parameters.valueGradient
  let useValueGradient =
    undefined === parameters.useValueGradient
      ? false
      : parameters.useValueGradient
  const tickLabelOrientation =
    undefined === parameters.tickLabelOrientation
      ? gaugeType === GaugeType.TYPE1
        ? TickLabelOrientation.TANGENT
        : TickLabelOrientation.NORMAL
      : parameters.tickLabelOrientation
  let trendVisible = undefined === parameters.trendVisible ? false : parameters.trendVisible
  const trendColors =
    undefined === parameters.trendColors
      ? [LedColor.RED_LED, LedColor.GREEN_LED, LedColor.CYAN_LED]
      : parameters.trendColors
  const fullScaleDeflectionTime =
    undefined === parameters.fullScaleDeflectionTime
      ? 2.5
      : parameters.fullScaleDeflectionTime

  // Set the size
  mainCtx.canvas.width = SIZE
  mainCtx.canvas.height = SIZE

  // Properties
  let value = minValue
  let minMeasuredValue = minValue
  let maxMeasuredValue = maxValue

  let ledBlinking = false
  let ledTimerId = 0
  let userLedBlinking = false
  let userLedTimerId = 0

  let trendIndicator = TrendState.OFF

  let sectionAngles = []
  let isSectionsVisible = false
  let isGradientVisible = false

  // Tickmark specific private variables
  let majorTickSpacing = 0

  // Animation related
  let tween
  let repainting = false
  const self = this

  let initialized = false

  // Constants
  const CENTER = SIZE / 2

  const LCD_HEIGHT = SIZE * 0.13
  const LCD_WIDTH = SIZE * 0.4
  const LCD_POS_X = (SIZE - LCD_WIDTH) / 2
  const LCD_POS_Y = SIZE / 2 - LCD_HEIGHT / 2

  const ACTIVE_LED_POS_X = SIZE * 0.116822
  const ACTIVE_LED_POS_Y = SIZE * 0.485981

  const LED_SIZE = Math.ceil(SIZE * 0.093457)
  const LED_POS_X = SIZE * 0.53
  const LED_POS_Y = SIZE * 0.61
  const USER_LED_POS_X = gaugeType === GaugeType.TYPE3
    ? 0.7 * SIZE
    : CENTER - LED_SIZE / 2
  const USER_LED_POS_Y = gaugeType === GaugeType.TYPE3
    ? 0.61 * SIZE
    : 0.75 * SIZE

  const TREND_SIZE = SIZE * 0.06
  const TREND_POS_X = SIZE * 0.38
  const TREND_POS_Y = SIZE * 0.57

  const BARGRAPH_LED_WIDTH = Math.ceil(SIZE * 0.060747)
  const BARGRAPH_LED_HEIGHT = Math.ceil(SIZE * 0.023364)

  const { rotationOffset, angleRange: ANGLE_RANGE } = getRadialRotationParams(gaugeType)
  const ANGLE_RANGE_DEGREES = ANGLE_RANGE * DEG_FACTOR
  const BARGRAPH_OFFSET = getBargraphOffset(gaugeType)

  // Create audio tag for alarm sound
  const audioElement = (playAlarm && alarmSound !== false) ? createAudioElement(alarmSound) : null

  // **************   Buffer creation  ********************
  // Buffer for the frame
  const frameBuffer = createBuffer(SIZE, SIZE)
  let frameCtx = frameBuffer.getContext('2d')

  // Buffer for static background painting code
  const backgroundBuffer = createBuffer(SIZE, SIZE)
  let backgroundCtx = backgroundBuffer.getContext('2d')

  const lcdBuffer = lcdVisible ? createBuffer(LCD_WIDTH, LCD_HEIGHT) : null
  let lcdGauge

  // Buffer for active bargraph led
  const activeLedBuffer = createBuffer(BARGRAPH_LED_WIDTH, BARGRAPH_LED_HEIGHT)
  let activeLedCtx = activeLedBuffer.getContext('2d')

  // Buffer for led painting code
  let ledBuffer
  let ledGauge

  // Buffer for current user led painting code
  let userLedBuffer
  let userLedGauge

  // Buffer for static foreground painting code
  const foregroundBuffer = createBuffer(SIZE, SIZE)
  let foregroundCtx = foregroundBuffer.getContext('2d')

  // Buffers for trend indicators
  let trendUpBuffer
  let trendSteadyBuffer
  let trendDownBuffer
  let trendOffBuffer

  // Method to calculate nice values for min, max and range for the tickmarks
  const calculate = function calculate () {
    let range
    if (niceScale) {
      range = calcNiceNumber(maxValue - minValue, false)
      majorTickSpacing = calcNiceNumber(range / (MAX_MAJOR_TICKS_COUNT - 1), true)

      minValue = Math.floor(minValue / majorTickSpacing) * majorTickSpacing
      maxValue = Math.ceil(maxValue / majorTickSpacing) * majorTickSpacing

      // Make sure values are still in range
      value = setInRange(value, minValue, maxValue)
      minMeasuredValue = setInRange(minMeasuredValue, minValue, maxValue)
      maxMeasuredValue = setInRange(maxMeasuredValue, minValue, maxValue)
      threshold = setInRange(threshold, minValue, maxValue)
    } else {
      range = maxValue - minValue
      majorTickSpacing = calcNiceNumber(range / (MAX_MAJOR_TICKS_COUNT - 1), true)
    }
  }

  function isThresholdExcedeed () {
    return (value >= threshold && thresholdRising) || (value <= threshold && !thresholdRising)
  }

  //* ******************************** Private methods *********************************
  // Draw all static painting code to background
  const init = function (buffers) {
    buffers = buffers || {}
    const initFrame = coalesce(buffers.frame, false)
    const initBackground = coalesce(buffers.background, false)
    const initLed = coalesce(buffers.led, false)
    const initUserLed = coalesce(buffers.userLed, false)
    const initLcd = coalesce(buffers.lcd, false)
    const initValue = coalesce(buffers.value, false)
    const initForeground = coalesce(buffers.foreground, false)
    const initTrend = coalesce(buffers.trend, false)

    calculate()

    // Create frame in frame buffer (frameBuffer)
    if (initFrame && frameVisible) {
      drawFrame(frameCtx, frameDesign, CENTER, CENTER, SIZE, SIZE)
    }

    // Create background in background buffer (backgroundBuffer)
    if (initBackground && backgroundVisible) {
      drawBackground(backgroundCtx, backgroundColor, CENTER, CENTER, SIZE, SIZE)

      // Create custom layer in background buffer (backgroundBuffer)
      drawRadialCustomImage(backgroundCtx, customLayer, CENTER, CENTER, SIZE, SIZE)

      // Create tickmarks in background buffer
      drawRadialTickmarksImage(
        backgroundCtx,
        SIZE,
        gaugeType,
        minValue,
        maxValue,
        niceScale,
        backgroundColor,
        tickLabelOrientation,
        labelNumberFormat,
        fractionalScaleDecimals,
        true,
        true
      )

      // Create title in background buffer
      drawTitleImage(backgroundCtx, SIZE, SIZE, titleString, unitString, backgroundColor, true, true)
    }

    if (initLed) {
      if (!ledBuffer) ledBuffer = createBuffer(LED_SIZE, LED_SIZE)
      ledGauge = new Led(ledBuffer, { ledColor: ledColor })
    }

    if (initUserLed) {
      if (!userLedBuffer) userLedBuffer = createBuffer(LED_SIZE, LED_SIZE)
      userLedGauge = new Led(userLedBuffer, { ledColor: userLedColor })
    }

    if (initBackground) {
      // Create bargraphtrack in background buffer (backgroundBuffer)
      drawBargraphTrackImage(backgroundCtx)
    }

    // Create lcd background if selected in background buffer (backgroundBuffer)
    if (initLcd && lcdVisible) {
      lcdGauge = new DisplaySingle(lcdBuffer, {
        lcdColor: lcdColor,
        lcdDecimals: lcdDecimals,
        digitalFont: digitalFont,
        value: value
      })
    }

    // Use a gradient for the valueColor?
    isGradientVisible = (useValueGradient && valueGradient !== null)

    // Use sections for the value color ?
    isSectionsVisible = (!isGradientVisible && useSectionColors && section !== null && section.length > 0)
    if (isSectionsVisible) {
      sectionAngles = section.map(item => ({
        start: ((Math.abs(minValue) + item.start) / (maxValue - minValue)) * ANGLE_RANGE_DEGREES,
        stop: ((Math.abs(minValue) + item.stop) / (maxValue - minValue)) * ANGLE_RANGE_DEGREES,
        color: customColorDef(item.color)
      }))
    }

    // Create an image of an active led in active led buffer (activeLedBuffer)
    if (initValue) {
      drawActiveBargraphLed(activeLedCtx, valueColor, mainCtx, true)
    }

    // Create foreground in foreground buffer (foregroundBuffer)
    if (initForeground && foregroundVisible) {
      drawForeground(foregroundCtx, foregroundType, SIZE, SIZE, false)
    }

    // Create the trend indicator buffers
    if (initTrend && trendVisible) {
      trendUpBuffer = createTrendIndicator(TREND_SIZE, TrendState.UP, trendColors)
      trendSteadyBuffer = createTrendIndicator(TREND_SIZE, TrendState.STEADY, trendColors)
      trendDownBuffer = createTrendIndicator(TREND_SIZE, TrendState.DOWN, trendColors)
      trendOffBuffer = createTrendIndicator(TREND_SIZE, TrendState.OFF, trendColors)
    }

    initialized = true
  }

  const resetBuffers = function (buffers) {
    buffers = buffers || {}
    const resetFrame = undefined === buffers.frame ? false : buffers.frame
    const resetBackground = undefined === buffers.background ? false : buffers.background
    const resetValue = undefined === buffers.value ? false : buffers.value
    const resetForeground = undefined === buffers.foreground ? false : buffers.foreground

    // Buffer for the frame
    if (resetFrame) {
      frameBuffer.width = SIZE
      frameBuffer.height = SIZE
      frameCtx = frameBuffer.getContext('2d')
    }

    // Buffer for static background painting code
    if (resetBackground) {
      backgroundBuffer.width = SIZE
      backgroundBuffer.height = SIZE
      backgroundCtx = backgroundBuffer.getContext('2d')
    }

    // Buffer for active bargraph led
    if (resetValue) {
      activeLedBuffer.width = BARGRAPH_LED_WIDTH
      activeLedBuffer.height = BARGRAPH_LED_HEIGHT
      activeLedCtx = activeLedBuffer.getContext('2d')
    }

    // Buffer for static foreground painting code
    if (resetForeground) {
      foregroundBuffer.width = SIZE
      foregroundBuffer.height = SIZE
      foregroundCtx = foregroundBuffer.getContext('2d')
    }
  }

  const drawBargraphTrackImage = function (ctx) {
    // Frame
    ctx.save()
    ctx.lineWidth = SIZE * 0.085
    ctx.beginPath()
    ctx.translate(CENTER, CENTER)
    ctx.rotate(rotationOffset - 4 * RAD_FACTOR)
    ctx.translate(-CENTER, -CENTER)
    ctx.arc(CENTER, CENTER, SIZE * 0.35514, 0, ANGLE_RANGE + 8 * RAD_FACTOR, false)
    ctx.rotate(-rotationOffset)

    const ledTrackFrameGradient = ctx.createLinearGradient(0, 0.107476 * SIZE, 0, 0.897195 * SIZE)
    ledTrackFrameGradient.addColorStop(0, '#000000')
    ledTrackFrameGradient.addColorStop(0.22, '#333333')
    ledTrackFrameGradient.addColorStop(0.76, '#333333')
    ledTrackFrameGradient.addColorStop(1, '#cccccc')
    ctx.strokeStyle = ledTrackFrameGradient
    ctx.stroke()
    ctx.restore()

    // Main
    ctx.save()
    ctx.lineWidth = SIZE * 0.075
    ctx.beginPath()
    ctx.translate(CENTER, CENTER)
    ctx.rotate(rotationOffset - 4 * RAD_FACTOR)
    ctx.translate(-CENTER, -CENTER)
    ctx.arc(CENTER, CENTER, SIZE * 0.35514, 0, ANGLE_RANGE + 8 * RAD_FACTOR, false)
    ctx.rotate(-rotationOffset)

    const ledTrackMainGradient = ctx.createLinearGradient(0, 0.112149 * SIZE, 0, 0.892523 * SIZE)
    ledTrackMainGradient.addColorStop(0, '#111111')
    ledTrackMainGradient.addColorStop(1, '#333333')
    ctx.strokeStyle = ledTrackMainGradient
    ctx.stroke()
    ctx.restore()

    // Draw inactive leds
    const ledCenterX = (SIZE * 0.116822 + SIZE * 0.060747) / 2
    const ledCenterY = (SIZE * 0.485981 + SIZE * 0.023364) / 2
    const ledOffGradient = ctx.createRadialGradient(
      ledCenterX,
      ledCenterY,
      0,
      ledCenterX,
      ledCenterY,
      0.030373 * SIZE
    )
    ledOffGradient.addColorStop(0, '#3c3c3c')
    ledOffGradient.addColorStop(1, '#323232')

    // let angle = 0
    for (let angle = 0; angle <= ANGLE_RANGE_DEGREES; angle += 5) {
      ctx.save()
      ctx.translate(CENTER, CENTER)
      ctx.rotate(angle * RAD_FACTOR + BARGRAPH_OFFSET)
      ctx.translate(-CENTER, -CENTER)
      ctx.beginPath()
      ctx.rect(SIZE * 0.116822, SIZE * 0.485981, SIZE * 0.060747, SIZE * 0.023364)
      ctx.closePath()
      ctx.fillStyle = ledOffGradient
      ctx.fill()
      ctx.restore()
    }

    ctx.restore()
  }

  const drawValue = function (ctx) {
    const activeLedAngle = ((value - minValue) / (maxValue - minValue)) * ANGLE_RANGE_DEGREES
    let activeLedColor
    let lastActiveLedColor = valueColor
    let currentValue, fraction

    for (let angle = 0; angle <= activeLedAngle; angle += 5) {
      activeLedColor = valueColor

      if (isGradientVisible) {
        // Convert angle back to value
        currentValue = minValue + (angle / ANGLE_RANGE_DEGREES) * (maxValue - minValue)
        fraction = Math.max(
          Math.min((currentValue - minValue) / valueGradient.getRange(), 1),
          0
        )
        activeLedColor = customColorDef(
          valueGradient.getColorAt(fraction).getRgbaColor()
        )
      } else if (isSectionsVisible) {
        const color = sectionAngles.find((entry) => (angle >= entry.start && angle < entry.stop))
        if (color) activeLedColor = color
      }

      if (lastActiveLedColor.medium.getHexColor() !== activeLedColor.medium.getHexColor()) {
        lastActiveLedColor = activeLedColor
        drawActiveBargraphLed(activeLedCtx, activeLedColor, mainCtx, true)
      }

      // Draw Led
      ctx.save()
      ctx.translate(CENTER, CENTER)
      ctx.rotate(angle * RAD_FACTOR + BARGRAPH_OFFSET)
      ctx.translate(-CENTER, -CENTER)
      ctx.drawImage(activeLedBuffer, ACTIVE_LED_POS_X, ACTIVE_LED_POS_Y)
      ctx.restore()
    }
  }

  const blink = function (blinking) {
    ledBlinking = !!blinking
    if (ledBlinking) {
      ledTimerId = setInterval(toggleAndRepaintLed, 1000)
    } else {
      clearInterval(ledTimerId)
      // ledBuffer = ledBufferOff
      if (ledGauge) {
        ledGauge.setLedOnOff(false)
      }
    }
  }

  const blinkUser = function (blinking) {
    if (blinking) {
      userLedTimerId = setInterval(toggleAndRepaintUserLed, 1000)
    } else {
      clearInterval(userLedTimerId)
      // userLedBuffer = userLedBufferOff
      if (userLedGauge) {
        userLedGauge.setLedOnOff(false)
      }
    }
  }

  const toggleAndRepaintLed = function () {
    if (ledVisible && ledGauge) {
      ledGauge.toggleLed()
      if (!repainting) {
        repainting = true
        requestAnimFrame(self.repaint)
      }
    }
  }

  const toggleAndRepaintUserLed = function () {
    if (userLedVisible && userLedGauge) {
      userLedGauge.toggleLed()
      if (!repainting) {
        repainting = true
        requestAnimFrame(self.repaint)
      }
    }
  }

  //* ******************************** Public methods *********************************
  this.getValue = function () {
    return value
  }

  this.setValue = function (newValue) {
    newValue = parseFloat(newValue)
    if (!isNaN(newValue)) {
      const targetValue = setInRange(newValue, minValue, maxValue)
      if (value !== targetValue) {
        if (undefined !== tween && tween.isPlaying) {
          tween.stop()
        }

        value = targetValue

        if (isThresholdExcedeed() && !ledBlinking) {
          blink(true)
          if (playAlarm && audioElement) {
            audioElement.play()
          }
        } else if (!isThresholdExcedeed() && ledBlinking) {
          blink(false)
          if (playAlarm && audioElement) {
            audioElement.pause()
          }
        }

        this.repaint()
      }
    }

    return this
  }

  this.setValueAnimated = function (newValue, callback) {
    newValue = parseFloat(newValue)
    if (!isNaN(newValue)) {
      const targetValue = setInRange(newValue, minValue, maxValue)
      const gauge = this

      if (value !== targetValue) {
        if (undefined !== tween && tween.isPlaying) {
          tween.stop()
        }

        const time = Math.max(
          (fullScaleDeflectionTime * Math.abs(targetValue - value)) / (maxValue - minValue),
          fullScaleDeflectionTime / 5
        )
        tween = new Tween({}, '', Tween.regularEaseInOut, value, targetValue, time)
        tween.onMotionChanged = function (event) {
          value = event.target._pos

          if (isThresholdExcedeed() && !ledBlinking) {
            blink(true)
            if (playAlarm && audioElement) {
              audioElement.play()
            }
          } else if (!isThresholdExcedeed() && ledBlinking) {
            blink(false)
            if (playAlarm && audioElement) {
              audioElement.pause()
            }
          }

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
    if (validFrameDesign(newFrameDesign)) {
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
    if (validBackgroundColor(newBackgroundColor)) {
      backgroundColor = newBackgroundColor
      resetBuffers({ background: true, led: true })
      init({ background: true, led: true })
      this.repaint()
    }

    return this
  }

  this.getForegroundType = function () {
    return foregroundType
  }

  this.setForegroundType = function (newForegroundType) {
    if (validForegroundType(newForegroundType)) {
      foregroundType = newForegroundType
      resetBuffers({ foreground: true })
      init({ foreground: true })
      this.repaint()
    }

    return this
  }

  this.getValueColor = function () {
    return valueColor
  }

  this.setValueColor = function (newValueColor) {
    if (validColor(newValueColor)) {
      valueColor = newValueColor
      resetBuffers({ value: true })
      init({ value: true })
      this.repaint()
    }

    return this
  }

  this.getLedColor = function () {
    return ledGauge ? ledGauge.getLedColor() : ledColor
  }

  this.setLedColor = function (newLedColor) {
    if (ledGauge) {
      ledGauge.setLedColor(newLedColor)
      this.repaint()
    }

    return this
  }

  this.getUserLedColor = function () {
    return userLedGauge ? userLedGauge.getLedColor() : userLedColor
  }

  this.setUserLedColor = function (newLedColor) {
    if (userLedGauge) {
      userLedGauge.setLedColor(newLedColor)
      this.repaint()
    }

    return this
  }

  this.toggleUserLed = function () {
    if (userLedGauge) {
      userLedGauge.toggleLed()
      this.repaint()
    }

    return this
  }

  this.isUserLedOn = function () {
    return userLedGauge ? userLedGauge.isLedOn() : false
  }

  this.setUserLedOnOff = function (on) {
    if (userLedGauge) {
      userLedGauge.setLedOnOff(!!on)
      this.repaint()
    }

    return this
  }

  this.blinkUserLed = function (blink) {
    if (userLedGauge) {
      if (blink && !userLedBlinking) {
        blinkUser(true)
        userLedBlinking = true
      } else if (!blink && userLedBlinking) {
        clearInterval(userLedTimerId)
        userLedBlinking = false
      }
    }

    return this
  }

  this.isLedVisible = function () {
    return ledVisible
  }

  this.setLedVisible = function (visible) {
    ledVisible = !!visible
    this.repaint()
    return this
  }

  this.isUserLedVisible = function () {
    return userLedVisible
  }

  this.setUserLedVisible = function (visible) {
    userLedVisible = !!visible
    this.repaint()
    return this
  }

  this.getLcdColor = function () {
    return lcdGauge ? lcdGauge.getLcdColor() : lcdColor
  }

  this.setLcdColor = function (newLcdColor) {
    if (lcdGauge) {
      lcdGauge.setLcdColor(newLcdColor)
      this.repaint()
    }

    return this
  }

  this.getLcdDecimals = function () {
    return lcdGauge ? lcdGauge.getLcdDecimals() : lcdDecimals
  }

  this.setLcdDecimals = function (decimals) {
    if (lcdGauge) {
      lcdGauge.setLcdDecimals(decimals)
      this.repaint()
    }

    return this
  }

  this.getSection = function () {
    return section
  }

  this.setSection = function (areaSec) {
    if (Object.prototype.toString.call(areaSec) === '[object Array]') {
      section = areaSec
      init()
      this.repaint()
    }

    return this
  }

  this.isSectionActive = function () {
    return useSectionColors
  }

  this.setSectionActive = function (active) {
    useSectionColors = !!active
    init()
    this.repaint()
    return this
  }

  this.getGradient = function () {
    return valueGradient
  }

  this.setGradient = function (grad) {
    valueGradient = grad
    init()
    this.repaint()
    return this
  }

  this.isGradientActive = function () {
    return useValueGradient
  }

  this.setGradientActive = function (active) {
    useValueGradient = !!active
    init()
    this.repaint()
    return this
  }

  this.getMinValue = function () {
    return minValue
  }

  this.setMinValue = function (newValue) {
    newValue = parseFloat(newValue)
    if (!isNaN(newValue)) {
      minValue = newValue
      resetBuffers({ background: true })
      init({ background: true })
      this.repaint()
    }

    return this
  }

  this.getMaxValue = function () {
    return maxValue
  }

  this.setMaxValue = function (newValue) {
    newValue = parseFloat(newValue)
    if (!isNaN(newValue)) {
      maxValue = newValue
      resetBuffers({ background: true })
      init({ background: true })
      this.repaint()
    }

    return this
  }

  this.getThreshold = function () {
    return threshold
  }

  this.setThreshold = function (newValue) {
    newValue = parseFloat(newValue)
    if (!isNaN(newValue)) {
      threshold = setInRange(newValue, minValue, maxValue)
      resetBuffers({ background: true })
      init({ background: true })
      this.repaint()
    }

    return this
  }

  this.isThresholdRising = function () {
    return thresholdRising
  }

  this.setThresholdRising = function (rising) {
    thresholdRising = !!rising
    // reset existing threshold alerts
    ledBlinking = !ledBlinking
    blink(ledBlinking)
    this.repaint()
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
    unitString = unit
    resetBuffers({ background: true })
    init({ background: true })
    this.repaint()
    return this
  }

  this.getTrend = function () {
    return trendIndicator
  }

  this.setTrend = function (newValue) {
    if (validTrendState(newValue)) {
      trendIndicator = newValue
      this.repaint()
    }

    return this
  }

  this.isTrendVisible = function () {
    return trendVisible
  }

  this.setTrendVisible = function (visible) {
    trendVisible = !!visible
    this.repaint()
    return this
  }

  this.getFractionalScaleDecimals = function () {
    return fractionalScaleDecimals
  }

  this.setFractionalScaleDecimals = function (decimals) {
    decimals = parseInt(decimals, 10)
    if (isNaN(decimals)) {
      fractionalScaleDecimals = decimals
      resetBuffers({ background: true })
      init({ background: true })
      this.repaint()
    }

    return this
  }

  this.getLabelNumberFormat = function () {
    return labelNumberFormat
  }

  this.setLabelNumberFormat = function (format) {
    if (validLabelNumberFormat(format)) {
      labelNumberFormat = format
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
        led: true,
        userLed: true,
        lcd: true,
        value: true,
        trend: true,
        foreground: true
      })
    }

    mainCtx.clearRect(0, 0, SIZE, SIZE)

    // Draw frame image
    if (frameVisible) {
      mainCtx.drawImage(frameBuffer, 0, 0)
    }

    // Draw buffered image to visible canvas
    mainCtx.drawImage(backgroundBuffer, 0, 0)

    // Draw active leds
    drawValue(mainCtx)

    // Draw lcd display
    if (lcdVisible && lcdGauge) {
      lcdGauge.setValue(value)
      mainCtx.drawImage(lcdBuffer, LCD_POS_X, LCD_POS_Y)
    }

    // Draw led
    if (ledVisible) {
      mainCtx.drawImage(ledBuffer, LED_POS_X, LED_POS_Y)
    }

    // Draw user led
    if (userLedVisible) {
      mainCtx.drawImage(userLedBuffer, USER_LED_POS_X, USER_LED_POS_Y)
    }

    // Draw the trend indicator
    if (trendVisible) {
      switch (trendIndicator.state) {
        case 'up':
          mainCtx.drawImage(trendUpBuffer, TREND_POS_X, TREND_POS_Y)
          break
        case 'steady':
          mainCtx.drawImage(trendSteadyBuffer, TREND_POS_X, TREND_POS_Y)
          break
        case 'down':
          mainCtx.drawImage(trendDownBuffer, TREND_POS_X, TREND_POS_Y)
          break
        case 'off':
          mainCtx.drawImage(trendOffBuffer, TREND_POS_X, TREND_POS_Y)
          break
      }
    }

    // Draw foreground
    if (foregroundVisible) {
      mainCtx.drawImage(foregroundBuffer, 0, 0)
    }

    repainting = false
  }

  // Visualize the component
  this.repaint()

  return this
}

function getBargraphOffset (gaugeType) {
  switch (gaugeType.type) {
    case 'type1':
    case 'type2': return 0
    case 'type3': return -HALF_PI
    case 'type4':
    default: return -TWO_PI / 6
  }
}
