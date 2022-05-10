import Tween from './libs/tween.js'
import drawLinearBackgroundImage from './tools/drawLinearBackgroundImage'
import drawLinearIndicator from './tools/drawLinearIndicator.js'
import drawLinearForegroundImage from './tools/drawLinearForegroundImage'
import drawLinearFrameImage from './tools/drawLinearFrameImage'
import drawLinearTickmarksImage from './tools/drawLinearTickmarksImage'
import drawTitleImage from './tools/drawTitleImage'
import createMeasuredValueImage from './tools/create/createMeasuredValueImage'
import createThresholdImage from './tools/create/createThresholdImage'

import { DisplaySingle } from './DisplaySingle'
import { Led } from './Led'

import {
  createBuffer,
  createAudioElement,
  setInRange,
  calcNiceNumber,
  requestAnimFrame,
  getCanvasContext,
  HALF_PI
} from './tools/tools'

import {
  BackgroundColor as BgColor,
  LcdColor,
  ColorDef,
  LedColor,
  GaugeType,
  FrameDesign,
  LabelNumberFormat
} from './tools/definitions'

export const Linear = function (canvas, parameters) {
  // Get the canvas context
  const mainCtx = getCanvasContext(canvas)

  // Parameters
  parameters = parameters || {}
  let gaugeType = undefined === parameters.gaugeType // TODO change logic in order to make this const
    ? GaugeType.TYPE1
    : parameters.gaugeType
  const width = undefined === parameters.width
    ? mainCtx.canvas.width
    : parameters.width
  const height = undefined === parameters.height
    ? mainCtx.canvas.height
    : parameters.height
  let minValue = undefined === parameters.minValue
    ? 0
    : parameters.minValue
  let maxValue = undefined === parameters.maxValue
    ? minValue + 100
    : parameters.maxValue
  const niceScale =
    undefined === parameters.niceScale ? true : parameters.niceScale
  let threshold = undefined === parameters.threshold
    ? (maxValue - minValue) / 2 + minValue
    : parameters.threshold
  let titleString = undefined === parameters.titleString
    ? ''
    : parameters.titleString
  let unitString = undefined === parameters.unitString
    ? ''
    : parameters.unitString
  let frameDesign = undefined === parameters.frameDesign
    ? FrameDesign.METAL
    : parameters.frameDesign
  const frameVisible = undefined === parameters.frameVisible
    ? true
    : parameters.frameVisible
  let backgroundColor = undefined === parameters.backgroundColor
    ? BgColor.DARK_GRAY
    : parameters.backgroundColor
  const backgroundVisible = undefined === parameters.backgroundVisible
    ? true
    : parameters.backgroundVisible
  let valueColor =
    undefined === parameters.valueColor ? ColorDef.RED : parameters.valueColor
  const lcdColor =
    undefined === parameters.lcdColor ? LcdColor.STANDARD : parameters.lcdColor
  const lcdVisible =
    undefined === parameters.lcdVisible ? true : parameters.lcdVisible
  const lcdDecimals =
    undefined === parameters.lcdDecimals ? 2 : parameters.lcdDecimals
  const digitalFont =
    undefined === parameters.digitalFont ? false : parameters.digitalFont
  const ledColor =
    undefined === parameters.ledColor ? LedColor.RED_LED : parameters.ledColor
  let ledVisible =
    undefined === parameters.ledVisible ? true : parameters.ledVisible
  let thresholdVisible =
    undefined === parameters.thresholdVisible
      ? true
      : parameters.thresholdVisible
  let thresholdRising =
    undefined === parameters.thresholdRising
      ? true
      : parameters.thresholdRising
  let minMeasuredValueVisible =
    undefined === parameters.minMeasuredValueVisible
      ? false
      : parameters.minMeasuredValueVisible
  let maxMeasuredValueVisible =
    undefined === parameters.maxMeasuredValueVisible
      ? false
      : parameters.maxMeasuredValueVisible
  const labelNumberFormat =
    undefined === parameters.labelNumberFormat
      ? LabelNumberFormat.STANDARD
      : parameters.labelNumberFormat
  const foregroundVisible =
    undefined === parameters.foregroundVisible
      ? true
      : parameters.foregroundVisible
  const playAlarm =
    undefined === parameters.playAlarm ? false : parameters.playAlarm
  const alarmSound =
    undefined === parameters.alarmSound ? '' : parameters.alarmSound
  const fullScaleDeflectionTime =
    undefined === parameters.fullScaleDeflectionTime
      ? 2.5
      : parameters.fullScaleDeflectionTime

  // Set the size
  mainCtx.canvas.width = width
  mainCtx.canvas.height = height

  // Check gaugeType is 1 or 2
  if (gaugeType.type !== 'type1' && gaugeType.type !== 'type2') {
    gaugeType = GaugeType.TYPE1
  }

  // Constants
  const vertical = (width <= height)
  const indicatorSize = Math.round((vertical ? width : height) * 0.05)

  const ledSize = Math.round((vertical ? height : width) * 0.05)
  const ledPosX = vertical ? width / 2 - ledSize / 2 : width * 0.89
  const ledPosY = vertical
    ? height * (gaugeType.type === 'type2' ? 0.038 : 0.053)
    : height / 2 - ledSize / 2

  const lcdW = vertical ? width * 0.571428 : width * 0.18
  const lcdH = vertical ? height * 0.055 : height * 0.15
  const lcdPosX = vertical ? (width - lcdW) / 2 : width * 0.695
  const lcdPosY = vertical ? height * 0.88 : height * 0.22

  const maxMajorTicksCount = 10

  const self = this

  // Internal variables
  let value = minValue
  let minMeasuredValue = maxValue
  let maxMeasuredValue = minValue

  let ledBlinking = false
  let ledTimer = 0

  let tween
  let repainting = false

  let initialized = false

  // Create audio tag for alarm sound
  const audioElement = playAlarm ? createAudioElement(alarmSound) : null

  // **************   Internal Utils   ********************
  const isThresholdExcedeed = function () {
    return (value >= threshold && thresholdRising) || (value <= threshold && !thresholdRising)
  }

  // **************   Buffer creation  ********************
  // Buffer for the frame
  const frameBuffer = createBuffer(width, height)
  let frameCtx = frameBuffer.getContext('2d')

  // Buffer for the background
  const backgroundBuffer = createBuffer(width, height)
  let backgroundCtx = backgroundBuffer.getContext('2d')

  // Buffer for LCD element
  let lcdBuffer
  let lcdGauge

  // Buffer for current LED element
  let ledBuffer
  let ledGauge

  // Buffer for the minMeasuredValue indicator
  let minMeasuredValueBuffer

  // Buffer for the maxMeasuredValue indicator
  let maxMeasuredValueBuffer

  // Buffer for static foreground painting code
  const foregroundBuffer = createBuffer(width, height)
  let foregroundCtx = foregroundBuffer.getContext('2d')

  // **************   Initialization  ********************
  const init = function (buffers) {
    buffers = buffers || {}
    const initFrame = undefined === buffers.frame ? false : buffers.frame
    const initBackground = undefined === buffers.background ? false : buffers.background
    const initIndicators = undefined === buffers.indicators ? false : buffers.indicators
    const initLcd = undefined === buffers.lcd ? false : buffers.lcd
    const initLed = undefined === buffers.led ? false : buffers.led
    const initForeground = undefined === buffers.foreground ? false : buffers.foreground

    initialized = true

    // Calculate the current min and max values and the range
    if (niceScale) {
      const niceRange = calcNiceNumber(maxValue - minValue, false)
      const majorTickSpacing = calcNiceNumber(niceRange / (maxMajorTicksCount - 1), true)
      minValue = Math.floor(minValue / majorTickSpacing) * majorTickSpacing
      maxValue = Math.ceil(maxValue / majorTickSpacing) * majorTickSpacing

      // Make sure values are still in range
      value = setInRange(value, minValue, maxValue)
      minMeasuredValue = setInRange(minMeasuredValue, minValue, maxValue)
      maxMeasuredValue = setInRange(maxMeasuredValue, minValue, maxValue)
      threshold = setInRange(threshold, minValue, maxValue)
    }

    // Create frame in frame buffer (backgroundBuffer)
    if (initFrame && frameVisible) {
      drawLinearFrameImage(frameCtx, frameDesign, width, height, vertical)
    }

    // Create background in background buffer (backgroundBuffer)
    if (initBackground && backgroundVisible) {
      drawLinearBackgroundImage(backgroundCtx, backgroundColor, width, height, vertical)
    }

    // draw value background
    if (initBackground) {
      if (gaugeType.type === 'type2') {
        drawThermometerBackground(backgroundCtx)
      } else {
        drawValueBackground(backgroundCtx)
      }
    }

    if (initLed) {
      ledBuffer = createBuffer(10, 10)
      ledGauge = new Led(ledBuffer, {
        size: ledSize,
        ledColor: ledColor
      })
    }

    // Draw min measured value indicator in minMeasuredValueBuffer
    if (initIndicators && minMeasuredValueVisible) {
      minMeasuredValueBuffer = createMeasuredValueImage(
        indicatorSize,
        ColorDef.BLUE.dark.getRgbaColor(),
        false,
        vertical
      )
    }

    // Draw max measured value indicator in maxMeasuredValueBuffer
    if (initIndicators && maxMeasuredValueVisible) {
      maxMeasuredValueBuffer = createMeasuredValueImage(
        indicatorSize,
        ColorDef.RED.medium.getRgbaColor(),
        false,
        vertical
      )
    }

    // Draw tickmarks and strings
    if (initBackground && backgroundVisible) {
      drawLinearTickmarksImage(
        backgroundCtx,
        width,
        height,
        gaugeType,
        backgroundColor,
        labelNumberFormat,
        minValue,
        maxValue,
        niceScale,
        vertical
      )

      // Create title in background buffer (backgroundBuffer)
      drawTitleImage(
        backgroundCtx,
        width,
        height,
        titleString,
        unitString,
        backgroundColor,
        vertical,
        null,
        lcdVisible,
        gaugeType
      )
    }

    // Draw threshold image to background context
    if (initBackground && thresholdVisible) {
      drawLinearIndicator(
        backgroundCtx,
        createThresholdImage(indicatorSize, indicatorSize, false, vertical),
        threshold,
        minValue,
        maxValue,
        gaugeType,
        vertical,
        false
      )
    }

    // Init LCD gauge
    if (initLcd && lcdVisible) {
      lcdBuffer = createBuffer(10, 10)
      lcdGauge = new DisplaySingle(lcdBuffer, {
        width: lcdW,
        height: lcdH,
        lcdColor: lcdColor,
        lcdDecimals: lcdDecimals,
        digitalFont: digitalFont,
        value: value
      })
    }

    // add thermometer stem foreground
    if (initForeground && gaugeType.type === 'type2') {
      drawThermometerForeground(foregroundCtx)
    }

    // Create foreground in foreground buffer (foregroundBuffer)
    if (initForeground && foregroundVisible) {
      drawLinearForegroundImage(foregroundCtx, width, height, vertical, false)
    }
  }

  const resetBuffers = function (buffers) {
    buffers = buffers || {}
    const resetFrame = undefined === buffers.frame ? false : buffers.frame
    const resetBackground = undefined === buffers.background ? false : buffers.background
    const resetForeground = undefined === buffers.foreground ? false : buffers.foreground

    if (resetFrame) {
      frameBuffer.width = width
      frameBuffer.height = height
      frameCtx = frameBuffer.getContext('2d')
    }

    if (resetBackground) {
      backgroundBuffer.width = width
      backgroundBuffer.height = height
      backgroundCtx = backgroundBuffer.getContext('2d')
    }

    if (resetForeground) {
      foregroundBuffer.width = width
      foregroundBuffer.height = height
      foregroundCtx = foregroundBuffer.getContext('2d')
    }
  }

  const blink = function (blinking) {
    if (blinking) {
      ledTimer = setInterval(toggleAndRepaintLed, 1000)
    } else {
      clearInterval(ledTimer)
      if (ledGauge !== undefined) {
        ledGauge.setLedOnOff(false)
      }
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

  const drawValueBackground = function (ctx) {
    ctx.save()

    const labelColor = backgroundColor.labelColor

    const top = vertical ? height * 0.12864 : width * 0.871012
    const bottom = vertical ? height * 0.856796 : width * 0.142857
    const fullSize = vertical ? bottom - top : top - bottom

    const bgStartX = vertical ? 0 : top
    const bgStartY = vertical ? top : 0
    const bgStopX = vertical ? 0 : bottom
    const bgStopY = vertical ? bottom : 0

    // Create background track gradient
    const darker =
      [BgColor.CARBON, BgColor.PUNCHED_SHEET, BgColor.STAINLESS, BgColor.BRUSHED_STAINLESS, BgColor.TURNED].includes(backgroundColor)
        ? 0.3
        : 0
    const bgTrackGradient = ctx.createLinearGradient(bgStartX, bgStartY, bgStopX, bgStopY)
    labelColor.setAlpha(0.05 + darker)
    bgTrackGradient.addColorStop(0, labelColor.getRgbaColor())
    labelColor.setAlpha(0.15 + darker)
    bgTrackGradient.addColorStop(0.48, labelColor.getRgbaColor())
    labelColor.setAlpha(0.15 + darker)
    bgTrackGradient.addColorStop(0.49, labelColor.getRgbaColor())
    labelColor.setAlpha(0.05 + darker)
    bgTrackGradient.addColorStop(1, labelColor.getRgbaColor())
    ctx.fillStyle = bgTrackGradient

    if (vertical) {
      ctx.fillRect(width * 0.435714, top, width * 0.142857, fullSize)
    } else {
      ctx.fillRect(width * 0.142857, height * 0.435714, fullSize, height * 0.142857)
    }

    // Define border sizes
    const borderStartX = vertical ? 0 : width * 0.142857 + fullSize
    const borderStartY = vertical ? top : 0
    const borderStopX = vertical ? 0 : width * 0.142857
    const borderStopY = vertical ? top + fullSize : 0

    // Create border gradient
    const borderGradient = ctx.createLinearGradient(borderStartX, borderStartY, borderStopX, borderStopY)
    labelColor.setAlpha(0.3 + darker)
    borderGradient.addColorStop(0, labelColor.getRgbaColor())
    labelColor.setAlpha(0.69)
    borderGradient.addColorStop(0.48, labelColor.getRgbaColor())
    labelColor.setAlpha(0.7)
    borderGradient.addColorStop(0.49, labelColor.getRgbaColor())
    labelColor.setAlpha(0.4)
    borderGradient.addColorStop(1, labelColor.getRgbaColor())
    ctx.fillStyle = borderGradient

    if (vertical) {
      ctx.fillRect(width * 0.435714, top, width * 0.007142, fullSize)
      ctx.fillRect(width * 0.571428, top, width * 0.007142, fullSize)
    } else {
      ctx.fillRect(width * 0.142857, height * 0.435714, fullSize, height * 0.007142)
      ctx.fillRect(width * 0.142857, height * 0.571428, fullSize, height * 0.007142)
    }

    ctx.restore()
  }

  const drawThermometerBackground = function (ctx) {
    ctx.save()

    if (vertical) {
      ctx.translate(width / 2, 0)
    } else {
      ctx.translate(width / 2, height / 2)
      ctx.rotate(HALF_PI)
      ctx.translate(0, -width / 2 + width * 0.05)
    }

    const size = vertical ? height : width
    ctx.beginPath()
    ctx.moveTo(-0.0516 * size, 0.825 * size)
    ctx.bezierCurveTo(-0.0516 * size, 0.8525 * size, -0.0289 * size, 0.875 * size, 0.0013 * size, 0.875 * size)
    ctx.bezierCurveTo(0.0289 * size, 0.875 * size, 0.0516 * size, 0.8525 * size, 0.0516 * size, 0.825 * size)
    ctx.bezierCurveTo(0.0516 * size, 0.8075 * size, 0.044 * size, 0.7925 * size, 0.0314 * size, 0.7825 * size)
    ctx.bezierCurveTo(0.0314 * size, 0.7825 * size, 0.0314 * size, 0.12 * size, 0.0314 * size, 0.12 * size)
    ctx.bezierCurveTo(0.0314 * size, 0.1025 * size, 0.0189 * size, 0.0875 * size, 0.0013 * size, 0.0875 * size)
    ctx.bezierCurveTo(-0.0163 * size, 0.0875 * size, -0.0289 * size, 0.1025 * size, -0.0289 * size, 0.12 * size)
    ctx.bezierCurveTo(-0.0289 * size, 0.12 * size, -0.0289 * size, 0.7825 * size, -0.0289 * size, 0.7825 * size)
    ctx.bezierCurveTo(-0.0415 * size, 0.79 * size, -0.0516 * size, 0.805 * size, -0.0516 * size, 0.825 * size)
    ctx.closePath()

    const grad = ctx.createLinearGradient(-0.0163 * size, 0, 0.0289 * size, 0)
    grad.addColorStop(0, 'rgba(226, 226, 226, 0.5)')
    grad.addColorStop(0.5, 'rgba(226, 226, 226, 0.2)')
    grad.addColorStop(1, 'rgba(226, 226, 226, 0.5)')
    ctx.fillStyle = grad
    ctx.fill()

    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(153, 153, 153, 0.5)'
    ctx.stroke()

    ctx.restore()
  }

  const drawValue = function (ctx) {
    ctx.save()

    let bottom, fullSize
    if (vertical) {
      const top = height * 0.12864 // position of max value
      bottom = height * (gaugeType.type === 'type2' ? 0.7475 : 0.856796) // position of min value
      fullSize = bottom - top
    } else {
      const top = width * (gaugeType.type === 'type2' ? 0.82 : 0.871012)
      bottom = width * (gaugeType.type === 'type2' ? 0.19857 : 0.142857)
      fullSize = top - bottom
    }

    // Draw value
    const valueSize = (fullSize * (value - minValue)) / (maxValue - minValue)
    const valueTop = vertical ? bottom - valueSize : bottom
    const valueStartX = vertical
      ? gaugeType.type === 'type2' ? (width / 2 - (height * 0.0486) / 2) : (width * 0.45)
      : 0
    const valueStartY = vertical
      ? 0
      : gaugeType.type === 'type2' ? (height / 2 - width * 0.025) : (height * 0.45)
    const valueStopX = vertical
      ? valueStartX + (gaugeType.type === 'type2' ? (height * 0.053) : (width * 0.114285))
      : 0
    const valueStopY = vertical
      ? 0
      : valueStartY + (gaugeType.type === 'type2' ? (width * 0.053) : (height * 0.114285))

    const bgGradient = ctx.createLinearGradient(valueStartX, valueStartY, valueStopX, valueStopY)
    bgGradient.addColorStop(0, valueColor.medium.getRgbaColor())
    bgGradient.addColorStop(1, valueColor.light.getRgbaColor())
    ctx.fillStyle = bgGradient

    const thermoTweak = gaugeType.type === 'type2' ? 0.05 * (vertical ? height : width) : 0
    if (vertical) {
      ctx.fillRect(valueStartX, valueTop, valueStopX - valueStartX, valueSize + thermoTweak)
    } else {
      ctx.fillRect(valueTop - thermoTweak, valueStartY, valueSize + thermoTweak, valueStopY - valueStartY)
    }

    // Draw light effect foreground
    if (gaugeType.type === 'type1') {
      const fgStartX = vertical ? width * 0.45 : 0
      const fgStartY = vertical ? 0 : height * 0.45
      const fgStopX = vertical ? fgStartX + width * 0.05 : 0
      const fgStopY = vertical ? 0 : fgStartY + height * 0.05

      const fgGradient = ctx.createLinearGradient(fgStartX, fgStartY, fgStopX, fgStopY)
      fgGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)')
      fgGradient.addColorStop(0.98, 'rgba(255, 255, 255, 0.0)')
      ctx.fillStyle = fgGradient

      if (vertical) {
        ctx.fillRect(fgStartX, valueTop, fgStopX, valueSize)
      } else {
        ctx.fillRect(valueTop, fgStartY, valueSize, fgStopY - fgStartY)
      }
    }

    ctx.restore()
  }

  const drawThermometerForeground = function (ctx) {
    ctx.save()

    if (vertical) {
      ctx.translate(width / 2, 0)
    } else {
      ctx.translate(width / 2, height / 2)
      ctx.rotate(HALF_PI)
      ctx.translate(0, -width / 2 + width * 0.05)
    }

    const size = vertical ? height : width

    // draw bulb
    ctx.beginPath()
    ctx.moveTo(-0.049 * size, 0.825 * size)
    ctx.bezierCurveTo(-0.049 * size, 0.7975 * size, -0.0264 * size, 0.775 * size, 0.0013 * size, 0.775 * size)
    ctx.bezierCurveTo(0.0264 * size, 0.775 * size, 0.049 * size, 0.7975 * size, 0.049 * size, 0.825 * size)
    ctx.bezierCurveTo(0.049 * size, 0.85 * size, 0.0264 * size, 0.8725 * size, 0.0013 * size, 0.8725 * size)
    ctx.bezierCurveTo(-0.0264 * size, 0.8725 * size, -0.049 * size, 0.85 * size, -0.049 * size, 0.825 * size)
    ctx.closePath()

    let grad = ctx.createRadialGradient(0 * size, 0.825 * size, 0, 0 * size, 0.825 * size, 0.049 * size)
    grad.addColorStop(0, valueColor.medium.getRgbaColor())
    grad.addColorStop(0.3, valueColor.medium.getRgbaColor())
    grad.addColorStop(1, valueColor.light.getRgbaColor())
    ctx.fillStyle = grad
    ctx.fill()

    // draw bulb highlight
    ctx.beginPath()
    if (vertical) {
      ctx.moveTo(-0.0365 * size, 0.8075 * size)
      ctx.bezierCurveTo(-0.0365 * size, 0.7925 * size, -0.0214 * size, 0.7875 * size, -0.0214 * size, 0.7825 * size)
      ctx.bezierCurveTo(0.0189 * size, 0.785 * size, 0.0365 * size, 0.7925 * size, 0.0365 * size, 0.8075 * size)
      ctx.bezierCurveTo(0.0365 * size, 0.8175 * size, 0.0214 * size, 0.815 * size, 0.0013 * size, 0.8125 * size)
      ctx.bezierCurveTo(-0.0189 * size, 0.8125 * size, -0.0365 * size, 0.8175 * size, -0.0365 * size, 0.8075 * size)

      grad = ctx.createRadialGradient(0, 0.8 * size, 0, 0, 0.8 * size, 0.0377 * size)
    } else {
      // ctx.beginPath()
      ctx.moveTo(-0.0214 * size, 0.86 * size)
      ctx.bezierCurveTo(-0.0365 * size, 0.86 * size, -0.0415 * size, 0.845 * size, -0.0465 * size, 0.825 * size)
      ctx.bezierCurveTo(-0.0465 * size, 0.805 * size, -0.0365 * size, 0.7875 * size, -0.0214 * size, 0.7875 * size)
      ctx.bezierCurveTo(-0.0113 * size, 0.7875 * size, -0.0163 * size, 0.8025 * size, -0.0163 * size, 0.8225 * size)
      ctx.bezierCurveTo(-0.0163 * size, 0.8425 * size, -0.0113 * size, 0.86 * size, -0.0214 * size, 0.86 * size)

      grad = ctx.createRadialGradient(-0.03 * size, 0.8225 * size, 0, -0.03 * size, 0.8225 * size, 0.0377 * size)
    }
    ctx.closePath()

    grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.55)')
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.05)')
    ctx.fillStyle = grad
    ctx.fill()

    // stem highlight
    ctx.beginPath()
    ctx.moveTo(-0.0214 * size, 0.115 * size)
    ctx.bezierCurveTo(-0.0214 * size, 0.1075 * size, -0.0163 * size, 0.1025 * size, -0.0113 * size, 0.1025 * size)
    ctx.bezierCurveTo(-0.0113 * size, 0.1025 * size, -0.0113 * size, 0.1025 * size, -0.0113 * size, 0.1025 * size)
    ctx.bezierCurveTo(-0.0038 * size, 0.1025 * size, 0.0013 * size, 0.1075 * size, 0.0013 * size, 0.115 * size)
    ctx.bezierCurveTo(0.0013 * size, 0.115 * size, 0.0013 * size, 0.76 * size, 0.0013 * size, 0.76 * size)
    ctx.bezierCurveTo(0.0013 * size, 0.7675 * size, -0.0038 * size, 0.7725 * size, -0.0113 * size, 0.7725 * size)
    ctx.bezierCurveTo(-0.0113 * size, 0.7725 * size, -0.0113 * size, 0.7725 * size, -0.0113 * size, 0.7725 * size)
    ctx.bezierCurveTo(-0.0163 * size, 0.7725 * size, -0.0214 * size, 0.7675 * size, -0.0214 * size, 0.76 * size)
    ctx.bezierCurveTo(-0.0214 * size, 0.76 * size, -0.0214 * size, 0.115 * size, -0.0214 * size, 0.115 * size)
    ctx.closePath()

    grad = ctx.createLinearGradient(-0.0189 * size, 0, 0.0013 * size, 0)
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.1)')
    grad.addColorStop(0.34, 'rgba(255, 255, 255, 0.5)')
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.1)')
    ctx.fillStyle = grad
    ctx.fill()

    ctx.restore()
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
        if (undefined !== tween && tween.isPlaying) {
          tween.stop()
        }

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
    const gauge = this
    let time
    newValue = parseFloat(newValue)
    if (!isNaN(newValue)) {
      const targetValue = setInRange(newValue, minValue, maxValue)
      if (value !== targetValue) {
        if (undefined !== tween && tween.isPlaying) {
          tween.stop()
        }

        time =
          (fullScaleDeflectionTime * Math.abs(targetValue - value)) /
          (maxValue - minValue)
        time = Math.max(time, fullScaleDeflectionTime / 5)
        tween = new Tween(
          {},
          '',
          Tween.regularEaseInOut,
          value,
          targetValue,
          time
        )
        // tween = new Tween({}, '', Tween.regularEaseInOut, value, targetValue, 1);

        tween.onMotionChanged = function (event) {
          value = event.target._pos
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

  this.resetMinMeasuredValue = function () {
    minMeasuredValue = value
    this.repaint()
    return this
  }

  this.resetMaxMeasuredValue = function () {
    maxMeasuredValue = value
    this.repaint()
    return this
  }

  this.getMinMeasuredValue = function () {
    return minMeasuredValue
  }

  this.setMinMeasuredValue = function (newVal) {
    newVal = parseFloat(newVal)
    if (!isNaN(newVal)) {
      const targetValue = setInRange(newVal, minValue, maxValue)
      if (targetValue !== minMeasuredValue) {
        minMeasuredValue = targetValue
        this.repaint()
      }
    }

    return this
  }

  this.getMaxMeasuredValue = function () {
    return maxMeasuredValue
  }

  this.setMaxMeasuredValue = function (newVal) {
    newVal = parseFloat(newVal)
    if (!isNaN(newVal)) {
      const targetValue = setInRange(newVal, minValue, maxValue)
      if (targetValue !== maxMeasuredValue) {
        maxMeasuredValue = targetValue
        this.repaint()
      }
    }

    return this
  }

  this.isMinMeasuredValueVisible = function () {
    return minMeasuredValueVisible
  }

  this.setMinMeasuredValueVisible = function (visible) {
    minMeasuredValueVisible = !!visible
    if (minMeasuredValueVisible && minMeasuredValueBuffer === undefined) {
      init({ indicators: true })
    }
    this.repaint()
    return this
  }

  this.isMaxMeasuredValueVisible = function () {
    return maxMeasuredValueVisible
  }

  this.setMaxMeasuredValueVisible = function (visible) {
    maxMeasuredValueVisible = !!visible
    if (maxMeasuredValueVisible && maxMeasuredValueBuffer === undefined) {
      init({ indicators: true })
    }
    this.repaint()
    return this
  }

  this.getMinValue = function () {
    return minValue
  }

  this.setMinValue = function (newVal) {
    newVal = parseFloat(newVal)
    if (!isNaN(newVal)) {
      minValue = newVal
      resetBuffers({ background: true })
      init({ background: true })
      this.repaint()
    }

    return this
  }

  this.getMaxValue = function () {
    return maxValue
  }

  this.setMaxValue = function (newVal) {
    newVal = parseFloat(newVal)
    if (!isNaN(newVal)) {
      maxValue = newVal
      resetBuffers({ background: true })
      init({ background: true })
      this.repaint()
    }

    return this
  }

  this.getThreshold = function () {
    return threshold
  }

  this.setThreshold = function (threshVal) {
    threshVal = parseFloat(threshVal)
    if (!isNaN(threshVal)) {
      const targetValue = setInRange(threshVal, minValue, maxValue)
      if (targetValue !== threshold) {
        threshold = targetValue
        resetBuffers({ background: true })
        init({ background: true })
        this.repaint()
      }
    }

    return this
  }

  this.isThresholdVisible = function () {
    return thresholdVisible
  }

  this.setThresholdVisible = function (visible) {
    thresholdVisible = !!visible
    resetBuffers({ background: true })
    init({ background: true })
    this.repaint()
    return this
  }

  this.isThresholdRising = function () {
    return thresholdRising
  }

  this.setThresholdRising = function (rising) {
    thresholdRising = !!rising
    // reset existing threshold alerts
    // TODO improve alert handling?
    // audioElement not modified here
    ledBlinking = !ledBlinking
    blink(ledBlinking)
    this.repaint()
    return this
  }

  this.getLcdDecimals = function () {
    return lcdGauge.getLcdDecimals()
  }

  this.setLcdDecimals = function (decimals) {
    decimals = parseInt(decimals, 10)
    if (lcdGauge !== undefined && !isNaN(decimals) && decimals !== lcdGauge.getLcdDecimals()) {
      lcdGauge.setLcdDecimals(decimals)
      this.repaint()
    }

    return this
  }

  this.getFrameDesign = function () {
    return frameDesign
  }

  this.setFrameDesign = function (newFrameDesign) {
    // TODO validate input
    frameDesign = newFrameDesign
    resetBuffers({ frame: true })
    init({ frame: true })
    this.repaint()
    return this
  }

  this.getBackgroundColor = function () {
    return backgroundColor
  }

  this.setBackgroundColor = function (newBackgroundColor) {
    // TODO validate input
    backgroundColor = newBackgroundColor
    resetBuffers({ background: true })
    init({ background: true })
    this.repaint()
    return this
  }

  this.getValueColor = function () {
    return valueColor
  }

  this.setValueColor = function (newValueColor) {
    // TODO validate input
    valueColor = newValueColor
    resetBuffers({ foreground: true })
    init({ foreground: true })
    this.repaint()
    return this
  }

  this.getLedColor = function () {
    return ledGauge.getLedColor()
  }

  this.setLedColor = function (newLedColor) {
    // TODO validate input
    if (undefined !== ledGauge && newLedColor !== ledGauge.getLedColor()) {
      ledGauge.setLedColor(newLedColor)
      this.repaint()
    }
    // resetBuffers({ led: true })
    // ledColor = newLedColor
    // init({ led: true })
    // this.repaint()
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

  this.getLcdColor = function () {
    if (lcdGauge !== undefined) {
      return lcdGauge.getLcdColor()
    }
  }

  this.setLcdColor = function (newLcdColor) {
    // TODO validate input
    if (undefined !== lcdGauge && newLcdColor !== lcdGauge.getLcdColor()) {
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
    unitString = unit
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
        indicators: true,
        lcd: true,
        led: true,
        foreground: true
      })
    }

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
      mainCtx.drawImage(lcdBuffer, lcdPosX, lcdPosY)
    }

    // Draw led
    if (ledVisible) {
      mainCtx.drawImage(ledBuffer, ledPosX, ledPosY)
    }

    // Draw min measured value indicator
    if (minMeasuredValueVisible) {
      drawLinearIndicator(
        mainCtx,
        minMeasuredValueBuffer,
        minMeasuredValue,
        minValue,
        maxValue,
        gaugeType,
        vertical,
        true
      )
    }

    // Draw max measured value indicator
    if (maxMeasuredValueVisible) {
      drawLinearIndicator(
        mainCtx,
        maxMeasuredValueBuffer,
        maxMeasuredValue,
        minValue,
        maxValue,
        gaugeType,
        vertical,
        true
      )
    }

    drawValue(mainCtx, width, height)

    // Draw foreground
    if (foregroundVisible || gaugeType.type === 'type2') {
      mainCtx.drawImage(foregroundBuffer, 0, 0)
    }

    repainting = false
  }

  // Visualize the component
  this.repaint()

  return this
}
