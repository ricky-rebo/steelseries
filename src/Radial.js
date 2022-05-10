import Tween from './tools/tween.js'
import drawPointerImage from './tools/drawPointerImage'
import drawFrame from './tools/drawFrame'
import drawBackground from './tools/drawBackground'
import drawRadialCustomImage from './tools/drawRadialCustomImage'
import drawForeground from './tools/drawForeground'
import createKnobImage from './tools/createKnobImage'
import createMeasuredValueImage from './tools/createMeasuredValueImage'
import createTrendIndicator from './tools/createTrendIndicator'
import createThresholdImage from './tools/createThresholdImage'
import drawTitleImage from './tools/drawTitleImage'
import {
  calcNiceNumber,
  createBuffer,
  requestAnimFrame,
  getCanvasContext,
  HALF_PI,
  setInRange,
  coalesce,
  createAudioElement
} from './tools/tools'

import {
  BackgroundColor,
  LcdColor,
  ColorDef,
  LedColor,
  GaugeType,
  KnobType,
  KnobStyle,
  FrameDesign,
  PointerType,
  ForegroundType,
  LabelNumberFormat,
  TickLabelOrientation,
  TrendState
} from './tools/definitions'

import { Odometer } from './Odometer'
import { Led } from './Led.js'
import { DisplaySingle } from './DisplaySingle.js'
import { validBackgroundColor, validColor, validForegroundType, validFrameDesign, validLabelNumberFormat, validLcdColor, validPointerType, validTrendState } from './tools/validation.js'
import { drawRadialTickmarksImage, MAX_MAJOR_TICKS_COUNT } from './tools/draw/drawRadialTickmarksImage.js'
import { getRadialRotationParams } from './tools/radial.js'

export const Radial = function (canvas, parameters) {
  // Get the canvas context
  const mainCtx = getCanvasContext(canvas)

  // Parameters
  parameters = parameters || {}
  const gaugeType = undefined === parameters.gaugeType ? GaugeType.TYPE4 : parameters.gaugeType
  const size = undefined === parameters.size ? Math.min(mainCtx.canvas.width, mainCtx.canvas.height) : parameters.size
  let minValue = undefined === parameters.minValue ? 0 : parameters.minValue
  let maxValue = undefined === parameters.maxValue ? minValue + 100 : parameters.maxValue
  const niceScale = undefined === parameters.niceScale ? true : parameters.niceScale
  let threshold = undefined === parameters.threshold ? (maxValue - minValue) / 2 + minValue : parameters.threshold
  let thresholdRising = undefined === parameters.thresholdRising ? true : parameters.thresholdRising
  let section = undefined === parameters.section ? null : parameters.section
  let area = undefined === parameters.area ? null : parameters.area
  let titleString = undefined === parameters.titleString ? '' : parameters.titleString
  let unitString = undefined === parameters.unitString ? '' : parameters.unitString
  let frameDesign = undefined === parameters.frameDesign ? FrameDesign.METAL : parameters.frameDesign
  const frameVisible = undefined === parameters.frameVisible ? true : parameters.frameVisible
  let backgroundColor = undefined === parameters.backgroundColor ? BackgroundColor.DARK_GRAY : parameters.backgroundColor
  const backgroundVisible = undefined === parameters.backgroundVisible ? true : parameters.backgroundVisible
  let pointerType = undefined === parameters.pointerType ? PointerType.TYPE1 : parameters.pointerType
  let pointerColor = undefined === parameters.pointerColor ? ColorDef.RED : parameters.pointerColor
  const knobType = undefined === parameters.knobType ? KnobType.STANDARD_KNOB : parameters.knobType
  const knobStyle = undefined === parameters.knobStyle ? KnobStyle.SILVER : parameters.knobStyle
  let lcdColor = undefined === parameters.lcdColor ? LcdColor.STANDARD : parameters.lcdColor
  const lcdVisible = undefined === parameters.lcdVisible ? true : parameters.lcdVisible
  const lcdDecimals = undefined === parameters.lcdDecimals ? 2 : parameters.lcdDecimals
  const digitalFont = undefined === parameters.digitalFont ? false : parameters.digitalFont
  let fractionalScaleDecimals = undefined === parameters.fractionalScaleDecimals ? 1 : parameters.fractionalScaleDecimals
  let ledColor = undefined === parameters.ledColor ? LedColor.RED_LED : parameters.ledColor
  let ledVisible = undefined === parameters.ledVisible ? true : parameters.ledVisible
  let userLedColor = undefined === parameters.userLedColor ? LedColor.GREEN_LED : parameters.userLedColor
  let userLedVisible = undefined === parameters.userLedVisible ? false : parameters.userLedVisible
  let thresholdVisible = undefined === parameters.thresholdVisible ? true : parameters.thresholdVisible
  let minMeasuredValueVisible = undefined === parameters.minMeasuredValueVisible ? false : parameters.minMeasuredValueVisible
  let maxMeasuredValueVisible = undefined === parameters.maxMeasuredValueVisible ? false : parameters.maxMeasuredValueVisible
  let foregroundType = undefined === parameters.foregroundType ? ForegroundType.TYPE1 : parameters.foregroundType
  const foregroundVisible = undefined === parameters.foregroundVisible ? true : parameters.foregroundVisible
  let labelNumberFormat = undefined === parameters.labelNumberFormat ? LabelNumberFormat.STANDARD : parameters.labelNumberFormat
  const playAlarm = undefined === parameters.playAlarm ? false : parameters.playAlarm
  const alarmSound = undefined === parameters.alarmSound ? false : parameters.alarmSound
  const customLayer = undefined === parameters.customLayer ? null : parameters.customLayer
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
  const useOdometer = undefined === parameters.useOdometer ? false : parameters.useOdometer
  const odometerParams = undefined === parameters.odometerParams ? {} : parameters.odometerParams
  const odometerUseValue = undefined === parameters.odometerUseValue ? false : parameters.odometerUseValue
  const fullScaleDeflectionTime = undefined === parameters.fullScaleDeflectionTime ? 2.5 : parameters.fullScaleDeflectionTime

  // Set the size
  mainCtx.canvas.width = size
  mainCtx.canvas.height = size

  // Properties
  let value = minValue
  let odoValue = minValue

  let range

  let minMeasuredValue = maxValue
  let maxMeasuredValue = minValue

  let ledBlinking = false
  let userLedBlinking = false

  let ledTimerId = 0
  let userLedTimerId = 0
  let tween
  let repainting = false

  let trendIndicator = TrendState.OFF

  let initialized = false

  // GaugeType specific private variables
  const { rotationOffset, angleRange } = getRadialRotationParams(gaugeType)
  let angleStep
  let angle

  // Constants
  const self = this

  const center = size / 2

  const trendSize = size * 0.06
  const trendPosX = size * 0.29
  const trendPosY = size * 0.36

  const lcdHeight = size * 0.13
  const lcdWidth = size * 0.4
  const lcdPosX = (size - lcdWidth) / 2
  const lcdPosY = size * 0.57

  const ledSize = size * 0.093457
  const ledPosX = 0.6 * size
  const ledPosY = 0.4 * size

  const userLedPosX = gaugeType === GaugeType.TYPE3 ? (0.6 * size) : (center - ledSize / 2)
  const userLedPosY = gaugeType === GaugeType.TYPE3 ? (0.72 * size) : (0.75 * size)

  const odoH = useOdometer ? (size * 0.075) : 0
  let odoPosX // Calculated according to odometer width
  const odoPosY = useOdometer ? (size * 0.61) : 0
  const shadowOffset = useOdometer ? (size * 0.006) : 0

  const thresholdW = size * 0.046728
  const thresholdH = Math.ceil(thresholdW * 0.9)
  const thresholdRefX = size * 0.475
  const thresholdRefY = size * 0.13

  const minMaxSize = Math.ceil(size * 0.028037)
  const minMaxRefX = mainCtx.canvas.width * 0.4865
  const minMaxRefY = mainCtx.canvas.height * 0.105

  // Create audio tag for alarm sound
  const audioElement = (playAlarm && alarmSound !== false) ? createAudioElement(alarmSound) : null

  // **************   Buffer creation  ********************
  // Buffer for the frame
  const frameBuffer = createBuffer(size, size)
  let frameCtx = frameBuffer.getContext('2d')

  // Buffer for the background
  const backgroundBuffer = createBuffer(size, size)
  let backgroundCtx = backgroundBuffer.getContext('2d')

  const lcdBuffer = lcdVisible ? createBuffer(10, 10) : null
  let lcdGauge
  let odoGauge

  // Buffer for current led painting code
  let ledBuffer
  let ledGauge

  // Buffer for current user led painting code
  let userLedBuffer
  let userLedGauge

  // Buffer for the threshold indicator
  let thresholdBuffer

  // Buffer for the minMeasuredValue indicator
  let minMeasuredValueBuffer

  // Buffer for the maxMeasuredValue indicator
  let maxMeasuredValueBuffer

  // Buffer for pointer image painting code
  const pointerBuffer = createBuffer(size, size)
  let pointerCtx = pointerBuffer.getContext('2d')

  // Buffer for static foreground painting code
  const foregroundBuffer = createBuffer(size, size)
  let foregroundCtx = foregroundBuffer.getContext('2d')

  // Buffers for trend indicators
  let trendUpBuffer
  let trendSteadyBuffer
  let trendDownBuffer
  let trendOffBuffer

  // Internal utils
  // Method to calculate nice values for min, max and range for the tickmarks
  const calculate = function calculate () {
    if (niceScale) {
      const niceRange = calcNiceNumber(maxValue - minValue, false)
      const majorTickSpacing = calcNiceNumber(niceRange / (MAX_MAJOR_TICKS_COUNT - 1), true)

      minValue = Math.floor(minValue / majorTickSpacing) * majorTickSpacing
      maxValue = Math.ceil(maxValue / majorTickSpacing) * majorTickSpacing
      range = maxValue - minValue

      // Make sure values are still in range
      value = setInRange(value, minValue, maxValue)
      minMeasuredValue = setInRange(minMeasuredValue, minValue, maxValue)
      maxMeasuredValue = setInRange(maxMeasuredValue, minValue, maxValue)
      threshold = setInRange(threshold, minValue, maxValue)
    } else {
      range = maxValue - minValue
    }

    angleStep = angleRange / range
    angle = rotationOffset + (value - minValue) * angleStep
  }

  const isThresholdExcedeed = function () {
    return (value >= threshold && thresholdRising) || (value <= threshold && !thresholdRising)
  }

  // **************   Image creation  ********************

  const drawPostsImage = function (ctx) {
    ctx.save()

    const POST_KNOB = createKnobImage(Math.ceil(size * 0.037383), KnobType.STANDARD_KNOB, knobStyle)

    let minX, minY, maxX, maxY
    switch (gaugeType.type) {
      case 'type1':
        minX = size * 0.130841
        minY = size * 0.514018
        maxX = size * 0.523364
        maxY = size * 0.130841
        break
      case 'type2':
        minX = size * 0.130841
        minY = size * 0.514018
        maxX = size * 0.831775
        maxY = size * 0.514018
        break
      case 'type3':
        minX = size * 0.523364
        minY = size * 0.831775
        maxX = size * 0.831775
        maxY = size * 0.514018
        break
      case 'type4':
      default:
        minX = size * 0.336448
        minY = size * 0.803738
        maxX = size * 0.626168
        maxY = size * 0.803738
    }

    // Draw max center top post
    // if (gaugeType.type === 'type1') {
    //   // Min post
    //   ctx.drawImage(POST_KNOB, imageWidth * 0.130841, imageHeight * 0.514018)

    //   // Max post
    //   ctx.drawImage(POST_KNOB, imageWidth * 0.523364, imageHeight * 0.130841)
    // }

    // if (gaugeType.type === 'type2') {
    //   // Min post
    //   ctx.drawImage(POST_KNOB, imageWidth * 0.130841, imageHeight * 0.514018)

    //   // Max post
    //   ctx.drawImage(POST_KNOB, imageWidth * 0.831775, imageHeight * 0.514018)
    // }

    // if (gaugeType.type === 'type3') {
    //   // Draw min center bottom post
    //   ctx.drawImage(POST_KNOB, imageWidth * 0.523364, imageHeight * 0.831775)

    //   // Draw max right post
    //   ctx.drawImage(POST_KNOB, imageWidth * 0.831775, imageHeight * 0.514018)
    // }

    // if (gaugeType.type === 'type4') {
    //   // Min post
    //   ctx.drawImage(POST_KNOB, imageWidth * 0.336448, imageHeight * 0.803738)

    //   // Max post
    //   ctx.drawImage(POST_KNOB, imageWidth * 0.626168, imageHeight * 0.803738)
    // }

    // Min post
    ctx.drawImage(POST_KNOB, minX, minY)

    // Max post
    ctx.drawImage(POST_KNOB, maxX, maxY)

    ctx.restore()
  }

  const drawIndicator = function (ctx, indicator, val, refX, refY) {
    ctx.save()

    ctx.translate(center, center)
    ctx.rotate(rotationOffset + HALF_PI + (val - minValue) * angleStep)
    ctx.translate(-center, -center)
    ctx.drawImage(indicator, refX, refY)

    ctx.restore()
  }

  const drawAreaSectionImage = function (ctx, start, stop, color, filled) {
    start = setInRange(start, minValue, maxValue)
    stop = setInRange(stop, minValue, maxValue)

    if (start >= stop) {
      return
    }

    ctx.save()

    const startAngle = (angleRange / range) * start - (angleRange / range) * minValue
    const stopAngle = startAngle + (stop - start) / (range / angleRange)

    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = size * 0.035

    ctx.translate(center, center)
    ctx.rotate(rotationOffset)
    ctx.beginPath()

    if (filled) {
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, size * 0.365 - ctx.lineWidth / 2, startAngle, stopAngle, false)
      ctx.moveTo(0, 0)
      ctx.fill()
    } else {
      ctx.arc(0, 0, size * 0.365, startAngle, stopAngle, false)
      ctx.stroke()
    }

    // ctx.translate(-centerX, -centerY)
    ctx.restore()
  }

  // **************   Initialization  ********************
  // Draw all static painting code to background
  const init = function (buffers) {
    buffers = buffers || {}
    const initFrame = coalesce(buffers.frame, false)
    const initBackground = coalesce(buffers.background, false)
    const initLed = coalesce(buffers.led, false)
    const initThreshold = coalesce(buffers.threshold, false)
    const initUserLed = coalesce(buffers.userLed, false)
    const initMinMeasured = coalesce(buffers.minMeasured, false)
    const initMaxMeasured = coalesce(buffers.maxMeasured, false)
    const initLcd = coalesce(buffers.lcd, false)
    const initPointer = coalesce(buffers.pointer, false)
    const initForeground = coalesce(buffers.foreground, false)
    const initTrend = coalesce(buffers.trend, false)

    initialized = true

    // Calculate the current min and max values and the range
    calculate()

    // Create frame in frame buffer (backgroundBuffer)
    if (initFrame && frameVisible) {
      drawFrame(frameCtx, frameDesign, center, center, size, size)
    }

    if (initLed && ledVisible) {
      ledBuffer = createBuffer(ledSize, ledSize)
      ledGauge = new Led(ledBuffer, {
        ledColor: ledColor
      })
    }

    if (initUserLed && userLedVisible) {
      userLedBuffer = createBuffer(ledSize, ledSize)
      userLedGauge = new Led(userLedBuffer, {
        ledColor: userLedColor
      })
    }

    // Draw threshoild indicator
    if (initThreshold && thresholdVisible) {
      thresholdBuffer = createThresholdImage(thresholdW, thresholdH, true, false)
    }

    // Draw min measured value indicator
    if (initMinMeasured && minMeasuredValueVisible) {
      minMeasuredValueBuffer = createMeasuredValueImage(
        minMaxSize,
        ColorDef.BLUE.dark.getRgbaColor(),
        true,
        true
      )
    }

    // Draw max measured value indicator
    if (initMaxMeasured && maxMeasuredValueVisible) {
      maxMeasuredValueBuffer = createMeasuredValueImage(
        minMaxSize,
        ColorDef.RED.medium.getRgbaColor(),
        true
      )
    }

    // Create background in background buffer (backgroundBuffer)
    if (initBackground && backgroundVisible) {
      drawBackground(backgroundCtx, backgroundColor, center, center, size, size)

      // Create custom layer in background buffer (backgroundBuffer)
      if (customLayer !== undefined) {
        drawRadialCustomImage(backgroundCtx, customLayer, center, center, size, size)
      }
    }

    // Create alignment posts in background buffer (backgroundBuffer)
    if (initBackground && backgroundVisible) {
      drawPostsImage(backgroundCtx)

      // Create section in background buffer (backgroundBuffer)
      if (section !== null && section.length > 0) {
        let sectionIndex = section.length
        do {
          sectionIndex--
          drawAreaSectionImage(
            backgroundCtx,
            section[sectionIndex].start,
            section[sectionIndex].stop,
            section[sectionIndex].color,
            false
          )
        } while (sectionIndex > 0)
      }

      // Create area in background buffer (backgroundBuffer)
      if (area !== null && area.length > 0) {
        let areaIndex = area.length
        do {
          areaIndex--
          drawAreaSectionImage(
            backgroundCtx,
            area[areaIndex].start,
            area[areaIndex].stop,
            area[areaIndex].color,
            true
          )
        } while (areaIndex > 0)
      }

      // Create tickmarks in background buffer (backgroundBuffer)
      // drawTickmarksImage(backgroundCtx, labelNumberFormat)
      drawRadialTickmarksImage(
        backgroundCtx,
        size,
        gaugeType,
        minValue,
        maxValue,
        niceScale,
        backgroundColor,
        tickLabelOrientation,
        labelNumberFormat,
        fractionalScaleDecimals,
        false,
        false
      )

      // Create title in background buffer (backgroundBuffer)
      drawTitleImage(
        backgroundCtx,
        size,
        size,
        titleString,
        unitString,
        backgroundColor,
        true,
        true
      )
    }

    // Draw threshold image to background context
    if (initBackground && thresholdVisible) {
      drawIndicator(backgroundCtx, thresholdBuffer, threshold, thresholdRefX, thresholdRefY)
    }

    // Init LCD or Odometer
    if (initLcd && lcdVisible) {
      if (useOdometer) {
        odoGauge = new Odometer(lcdBuffer, {
          height: odoH,
          decimals: odometerParams.decimals,
          digits: odometerParams.digits === undefined ? 5 : odometerParams.digits,
          valueForeColor: odometerParams.valueForeColor,
          valueBackColor: odometerParams.valueBackColor,
          decimalForeColor: odometerParams.decimalForeColor,
          decimalBackColor: odometerParams.decimalBackColor,
          font: odometerParams.font,
          value: value
        })
        odoPosX = (size - lcdBuffer.width) / 2
      } else {
        lcdGauge = new DisplaySingle(lcdBuffer, {
          width: lcdWidth,
          height: lcdHeight,
          lcdColor: lcdColor,
          lcdDecimals: lcdDecimals,
          digitalFont: digitalFont,
          value: value
        })
      }
    }

    // Create pointer image in pointer buffer (contentBuffer)
    if (initPointer) {
      drawPointerImage(pointerCtx, size, pointerType, pointerColor, backgroundColor.labelColor)
    }

    // Create foreground in foreground buffer (foregroundBuffer)
    if (initForeground && foregroundVisible) {
      const knobVisible = !(pointerType.type === 'type15' || pointerType.type === 'type16')
      drawForeground(
        foregroundCtx,
        foregroundType,
        size,
        size,
        knobVisible,
        knobType,
        knobStyle,
        gaugeType
      )
    }

    // Create the trend indicator buffers
    if (initTrend && trendVisible) {
      trendUpBuffer = createTrendIndicator(trendSize, TrendState.UP, trendColors)
      trendSteadyBuffer = createTrendIndicator(trendSize, TrendState.STEADY, trendColors)
      trendDownBuffer = createTrendIndicator(trendSize, TrendState.DOWN, trendColors)
      trendOffBuffer = createTrendIndicator(trendSize, TrendState.OFF, trendColors)
    }
  }

  const resetBuffers = function (buffers) {
    buffers = buffers || {}
    const resetFrame = undefined === buffers.frame ? false : buffers.frame
    const resetBackground = undefined === buffers.background ? false : buffers.background
    const resetPointer = undefined === buffers.pointer ? false : buffers.pointer
    const resetForeground = undefined === buffers.foreground ? false : buffers.foreground

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

    if (resetPointer) {
      pointerBuffer.width = size
      pointerBuffer.height = size
      pointerCtx = pointerBuffer.getContext('2d')
    }

    if (resetForeground) {
      foregroundBuffer.width = size
      foregroundBuffer.height = size
      foregroundCtx = foregroundBuffer.getContext('2d')
    }
  }

  const toggleAndRepaintLed = function () {
    if (ledVisible && ledGauge !== undefined) {
      ledGauge.toggleLed()

      if (!repainting) {
        repainting = true
        requestAnimFrame(self.repaint)
      }
    }
  }

  const toggleAndRepaintUserLed = function () {
    if (userLedVisible && userLedGauge !== undefined) {
      userLedGauge.tottleLed()

      if (!repainting) {
        repainting = true
        requestAnimFrame(self.repaint)
      }
    }
  }

  const blink = function (blinking) {
    if (blinking) {
      ledTimerId = setInterval(toggleAndRepaintLed, 1000)
    } else {
      clearInterval(ledTimerId)

      if (ledGauge !== undefined) {
        ledGauge.setLedOnOff(false)
      }
    }
  }

  const blinkUser = function (blinking) {
    if (blinking) {
      userLedTimerId = setInterval(toggleAndRepaintUserLed, 1000)
    } else {
      clearInterval(userLedTimerId)

      if (userLedGauge !== undefined) {
        userLedGauge.setLedOnOff(false)
      }
    }
  }

  //* *********************************** Public methods **************************************
  this.getValue = function () {
    return value
  }

  this.setValue = function (newValue) {
    newValue = parseFloat(newValue)
    if (!isNaN(newValue)) {
      const targetValue = setInRange(newValue, minValue, maxValue)
      if (value !== targetValue) {
        value = targetValue

        if (value > maxMeasuredValue) {
          maxMeasuredValue = value
        } else if (value < minMeasuredValue) {
          minMeasuredValue = value
        }

        if (isThresholdExcedeed() && !ledBlinking) {
          ledBlinking = true
          blink(ledBlinking)
          if (playAlarm && audioElement !== null) {
            audioElement.play()
          }
        } else if (!isThresholdExcedeed() && ledBlinking) {
          ledBlinking = false
          blink(ledBlinking)
          if (playAlarm && audioElement !== null) {
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
            ledBlinking = true
            blink(ledBlinking)
            if (playAlarm && audioElement !== null) {
              audioElement.play()
            }
          } else if (!isThresholdExcedeed() && ledBlinking) {
            ledBlinking = false
            blink(ledBlinking)
            if (playAlarm && audioElement !== null) {
              audioElement.pause()
            }
          }

          if (value > maxMeasuredValue) {
            maxMeasuredValue = value
          } else if (value < minMeasuredValue) {
            minMeasuredValue = value
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

  this.getOdoValue = function () {
    return odoValue
  }

  this.setOdoValue = function (newValue) {
    newValue = parseFloat(newValue)
    if (!isNaN(newValue)) {
      const targetValue = newValue < 0 ? 0 : newValue
      if (odoValue !== targetValue) {
        odoValue = targetValue

        // No need to repaint if odometerUseValue = true
        if (!odometerUseValue) {
          this.repaint()
        }
      }
    }

    return this
  }

  this.setMinMeasuredValue = function (newValue) {
    newValue = parseFloat(newValue)
    if (!isNaN(newValue)) {
      const targetValue = setInRange(newValue, minValue, maxValue)
      if (targetValue !== minMeasuredValue) {
        minMeasuredValue = targetValue
        this.repaint()
      }
    }

    return this
  }

  this.setMaxMeasuredValue = function (newValue) {
    newValue = parseFloat(newValue)
    if (!isNaN(newValue)) {
      const targetValue = setInRange(newValue, minValue, maxValue)
      if (targetValue !== maxMeasuredValue) {
        maxMeasuredValue = targetValue
        this.repaint()
      }
    }

    return this
  }

  this.resetMinMeasuredValue = function () {
    minMeasuredValue = value
    this.repaint()
  }

  this.resetMaxMeasuredValue = function () {
    maxMeasuredValue = value
    this.repaint()
    return this
  }

  this.setMinMeasuredValueVisible = function (visible) {
    minMeasuredValueVisible = !!visible
    this.repaint()
    return this
  }

  this.setMaxMeasuredValueVisible = function (visible) {
    maxMeasuredValueVisible = !!visible
    this.repaint()
    return this
  }

  this.setTitleString = function (title) {
    if (title !== titleString) {
      titleString = title
      resetBuffers({ background: true })
      init({ background: true })
      this.repaint()
    }

    return this
  }

  this.setUnitString = function (unit) {
    if (unit !== unitString) {
      unitString = unit
      resetBuffers({ background: true })
      init({ background: true })
      this.repaint()
    }

    return this
  }

  this.getMinValue = function () {
    return minValue
  }

  this.setMinValue = function (newValue) {
    newValue = parseFloat(newValue)
    if (!isNaN(newValue) && newValue !== minValue) {
      minValue = parseFloat(newValue)
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
    if (!isNaN(newValue) && newValue !== maxValue) {
      maxValue = parseFloat(newValue)
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
      const targetValue = setInRange(newValue, minValue, maxValue)
      if (targetValue !== threshold) {
        threshold = targetValue
        resetBuffers({ background: true })
        init({ background: true })
        this.repaint()
      }
    }

    return this
  }

  this.getArea = function () {
    return area
  }

  this.setArea = function (areaVal) {
    if (Array.isArray(areaVal) && areaVal !== area) {
      area = areaVal
      resetBuffers({ background: true })
      init({ background: true })
      this.repaint()
    }

    return this
  }

  this.getSection = function () {
    return section
  }

  this.setSection = function (areaSec) {
    if (Array.isArray(areaSec) && areaSec !== section) {
      section = areaSec
      resetBuffers({ background: true })
      init({ background: true })
      this.repaint()
    }

    return this
  }

  this.isThresholdVisible = function () {
    return thresholdVisible
  }

  this.setThresholdVisible = function (visible) {
    thresholdVisible = !!visible
    this.repaint()
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

  this.getLcdDecimals = function () {
    if (lcdGauge !== undefined) {
      return lcdGauge.getLcdDecimals()
    }

    return lcdDecimals
  }

  this.setLcdDecimals = function (decimals) {
    if (lcdGauge !== undefined) {
      lcdGauge.setLcdDecimals(parseInt(decimals, 10))
    }
    this.repaint()
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
      resetBuffers({
        background: true,
        pointer: !!(pointerType.type === 'type2' || pointerType.type === 'type13') // type2 & 13 depend on background
      })
      init({
        background: true, // type2 & 13 depend on background
        pointer: !!(pointerType.type === 'type2' || pointerType.type === 'type13')
      })
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

  this.getPointerType = function () {
    return pointerType
  }

  this.setPointerType = function (newPointerType) {
    if (validPointerType(newPointerType)) {
      pointerType = newPointerType
      resetBuffers({ pointer: true, foreground: true })
      init({ pointer: true, foreground: true })
      this.repaint()
    }

    return this
  }

  this.getPointerColor = function () {
    return pointerColor
  }

  this.setPointerColor = function (newPointerColor) {
    if (validColor(newPointerColor)) {
      pointerColor = newPointerColor
      resetBuffers({ pointer: true })
      init({ pointer: true })
      this.repaint()
    }

    return this
  }

  this.getLedColor = function () {
    return ledGauge ? ledGauge.getLedColor() : ledColor
  }

  this.setLedColor = function (newLedColor) {
    if (ledGauge) {
      ledColor = newLedColor
      resetBuffers({ led: true })
      init({ led: true })
      this.repaint()
    }

    return this
  }

  this.getUserLedColor = function () {
    return userLedGauge ? userLedGauge.getLedColor() : userLedColor
  }

  this.setUserLedColor = function (newLedColor) {
    if (userLedGauge) {
      userLedColor = newLedColor
      resetBuffers({ userLed: true })
      init({ userLed: true })
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

  this.toggleUserLed = function () {
    if (userLedGauge !== undefined) {
      userLedGauge.toggleLed()
      this.repaint()
    }

    return this
  }

  this.blinkUserLed = function (blink) {
    userLedBlinking = !!blink

    if (userLedBlinking) {
      blinkUser(true)
    } else {
      clearInterval(userLedTimerId)
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
    if (validLcdColor(newLcdColor)) {
      lcdColor = newLcdColor
      resetBuffers({ background: true })
      init({ background: true })
      this.repaint()
    }

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
    if (!isNaN(decimals)) {
      fractionalScaleDecimals = parseInt(decimals, 10)
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
        threshold: true,
        minMeasured: true,
        maxMeasured: true,
        lcd: true,
        pointer: true,
        trend: true,
        foreground: true
      })
    }

    // Clear canvas
    mainCtx.clearRect(0, 0, size, size)

    // Draw frame
    if (frameVisible) {
      mainCtx.drawImage(frameBuffer, 0, 0)
    }

    // Draw buffered image to visible canvas
    mainCtx.drawImage(backgroundBuffer, 0, 0)

    // Draw lcd display
    if (lcdVisible) {
      if (useOdometer) {
        odoGauge.setValue(odometerUseValue ? value : odoValue)
        mainCtx.drawImage(lcdBuffer, odoPosX, odoPosY)
      } else {
        // drawLcdText(mainCtx, value)
        lcdGauge.setValue(value)
        mainCtx.drawImage(lcdBuffer, lcdPosX, lcdPosY)
      }
    }

    // Draw led
    if (ledVisible) {
      mainCtx.drawImage(ledBuffer, ledPosX, ledPosY)
    }

    // Draw user led
    if (userLedVisible) {
      mainCtx.drawImage(userLedBuffer, userLedPosX, userLedPosY)
    }

    // Draw trend indicator
    if (trendVisible) {
      switch (trendIndicator.state) {
        case 'up': mainCtx.drawImage(trendUpBuffer, trendPosX, trendPosY); break
        case 'steady': mainCtx.drawImage(trendSteadyBuffer, trendPosX, trendPosY); break
        case 'down': mainCtx.drawImage(trendDownBuffer, trendPosX, trendPosY); break
        case 'off': mainCtx.drawImage(trendOffBuffer, trendPosX, trendPosY); break
      }
    }

    // Draw min measured value indicator
    if (minMeasuredValueVisible) {
      drawIndicator(mainCtx, minMeasuredValueBuffer, minMeasuredValue, minMaxRefX, minMaxRefY)
    }

    // Draw max measured value indicator
    if (maxMeasuredValueVisible) {
      drawIndicator(mainCtx, maxMeasuredValueBuffer, maxMeasuredValue, minMaxRefX, minMaxRefY)
    }

    // Draw pointer on value
    mainCtx.save()

    angle = rotationOffset + HALF_PI + (value - minValue) * angleStep

    // Define rotation center
    mainCtx.translate(center, center)
    mainCtx.rotate(angle)
    mainCtx.translate(-center, -center)

    // Set the pointer shadow params
    mainCtx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    mainCtx.shadowOffsetX = mainCtx.shadowOffsetY = shadowOffset
    mainCtx.shadowBlur = shadowOffset * 2

    // Draw the pointer
    mainCtx.drawImage(pointerBuffer, 0, 0)

    mainCtx.restore()

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
