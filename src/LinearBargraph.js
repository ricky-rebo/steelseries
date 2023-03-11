import Tween from './libs/tween.js'

import { 
  legacy,
  ColorDef,
  BackgroundColor, LcdColor, LedColor,
  GaugeType, FrameDesign, LabelNumberFormat
} from 'steelseries-tools'

import { drawActiveBargraphLed } from './tools/draw/drawActiveBargraphLed.js'

import { DisplaySingle } from './DisplaySingle.js'
import { Led } from './Led.js'

import {
  calcNiceNumber,
  createBuffer,
  requestAnimFrame,
  getCanvasContext,
  createAudioElement,
  setInRange
} from './utils/common'

import { validBackgroundColor, validColor, validFrameDesign } from './utils/validation.js'

export const LinearBargraph = function (canvas, parameters) {
  // Get the canvas context
  const mainCtx = getCanvasContext(canvas)

  // Parameters
  parameters = parameters || {}
  const width = undefined === parameters.width ? mainCtx.canvas.width : parameters.width
  const height = undefined === parameters.height ? mainCtx.canvas.height : parameters.height
  let minValue = undefined === parameters.minValue ? 0 : parameters.minValue
  let maxValue = undefined === parameters.maxValue ? minValue + 100 : parameters.maxValue
  let valueColor = undefined === parameters.valueColor ? legacy.ColorDef.RED : parameters.valueColor
  let section = undefined === parameters.section ? null : parameters.section
  let useValueSection = undefined === parameters.useValueSection ? false : parameters.useValueSection
  let valueGradient = undefined === parameters.valueGradient ? null : parameters.valueGradient
  let useValueGradient = undefined === parameters.useValueGradient ? false : parameters.useValueGradient
  const niceScale = undefined === parameters.niceScale ? true : parameters.niceScale
  let threshold = undefined === parameters.threshold ? (maxValue - minValue) / 2 + minValue : parameters.threshold
  let titleString = undefined === parameters.titleString ? '' : parameters.titleString
  let unitString = undefined === parameters.unitString ? '' : parameters.unitString
  let frameDesign = undefined === parameters.frameDesign ? FrameDesign.METAL : parameters.frameDesign
  const frameVisible = undefined === parameters.frameVisible ? true : parameters.frameVisible
  let backgroundColor = undefined === parameters.backgroundColor ? BackgroundColor.DARK_GRAY : parameters.backgroundColor
  const backgroundVisible = undefined === parameters.backgroundVisible ? true : parameters.backgroundVisible
  const lcdColor = undefined === parameters.lcdColor ? LcdColor.STANDARD : parameters.lcdColor
  const lcdVisible = undefined === parameters.lcdVisible ? true : parameters.lcdVisible
  let lcdDecimals = undefined === parameters.lcdDecimals ? 2 : parameters.lcdDecimals
  const digitalFont = undefined === parameters.digitalFont ? false : parameters.digitalFont
  const ledColor = undefined === parameters.ledColor ? LedColor.RED_LED : parameters.ledColor
  let ledVisible = undefined === parameters.ledVisible ? true : parameters.ledVisible
  let thresholdVisible = undefined === parameters.thresholdVisible ? true : parameters.thresholdVisible
  let thresholdRising = undefined === parameters.thresholdRising ? true : parameters.thresholdRising
  let minMeasuredValueVisible = undefined === parameters.minMeasuredValueVisible ? false : parameters.minMeasuredValueVisible
  let maxMeasuredValueVisible = undefined === parameters.maxMeasuredValueVisible ? false : parameters.maxMeasuredValueVisible
  const labelNumberFormat = undefined === parameters.labelNumberFormat ? LabelNumberFormat.STANDARD : parameters.labelNumberFormat
  const foregroundVisible = undefined === parameters.foregroundVisible ? true : parameters.foregroundVisible
  const playAlarm = undefined === parameters.playAlarm ? false : parameters.playAlarm
  const alarmSound = undefined === parameters.alarmSound ? false : parameters.alarmSound
  const fullScaleDeflectionTime = undefined === parameters.fullScaleDeflectionTime ? 2.5 : parameters.fullScaleDeflectionTime

  // Set the size
  mainCtx.canvas.width = width
  mainCtx.canvas.height = height

  // Constants
  const vertical = (width <= height)

  const lcdW = vertical ? (width * 0.571428) : (width * 0.18)
  const lcdH = vertical ? (height * 0.055) : (height * 0.15)
  const lcdPosX = vertical ? ((width - width * 0.571428) / 2) : (width * 0.695)
  const lcdPosY = vertical ? (height * 0.88) : (height * 0.22)

  const ledSize = Math.round((vertical ? height : width) * 0.05)
  const ledPosX = vertical ? (width / 2 - ledSize / 2) : (0.89 * width)
  const ledPosY = vertical ? (0.053 * height) : (height / 1.95 - ledSize / 2)

  const barLedW = vertical ? (width * 0.121428) : (width * 0.012135)
  const barLedH = vertical ? (height * 0.012135) : (height * 0.121428)
  const barLedRefX = vertical ? (width * 0.45) : (width * 0.142857)
  const barLedRefY = vertical ? (height * 0.851941) : (height * 0.45)

  const indicatorSize = Math.round((vertical ? width : height) * 0.05)

  // Value related
  const top = vertical ? (height * 0.12864) : (width * 0.856796)
  const bottom = vertical ? (height * 0.856796) : (width * 0.12864)
  const fullSize = vertical ? (bottom - top) : (top - bottom)

  const self = this

  // Properties
  let value = minValue
  let minMeasuredValue = maxValue
  let maxMeasuredValue = minValue
  let isSectionsVisible = false
  let isGradientVisible = false

  // Internal variables
  let initialized = false
  let tween
  let ledBlinking = false
  let repainting = false
  let sectionPixels = []
  let ledTimerId = 0

  // Tickmark specific private variables
  let niceRange = maxValue - minValue
  let majorTickSpacing = 0
  const maxNoOfMajorTicks = 10

  // Create audio tag for alarm sound
  const audioElement = playAlarm ? createAudioElement(alarmSound) : null

  // **************   Internal Utils   ********************
  const isThresholdExcedeed = function () {
    return (value >= threshold && thresholdRising) || (value <= threshold && !thresholdRising)
  }

  const calcIndicatorPos = function (val) {
    let valuePos, posX, posY
    if (vertical) {
      valuePos = height * 0.856796 - (height * 0.728155 * (val - minValue)) / (maxValue - minValue)
      posX = width * 0.34 - indicatorSize
      posY = valuePos - indicatorSize / 2
    } else {
      valuePos = ((width * 0.856796 - width * 0.12864) * (val - minValue)) / (maxValue - minValue)
      posX = width * 0.142857 - indicatorSize / 2 + valuePos
      posY = height * 0.65
    }

    return [posX, posY]
  }

  // **************   Buffer creation  ********************
  // Buffer for the frame
  const frameBuffer = createBuffer(width, height)
  let frameCtx = frameBuffer.getContext('2d')

  // Buffer for the background
  const backgroundBuffer = createBuffer(width, height)
  let backgroundCtx = backgroundBuffer.getContext('2d')

  // Buffer for LCD display
  let lcdBuffer
  let lcdGauge

  // Buffer for active bargraph led
  const activeLedBuffer = createBuffer(barLedW, barLedH)
  let activeLedContext = activeLedBuffer.getContext('2d')

  // Buffer for inactive bargraph led
  const inactiveLedBuffer = createBuffer(barLedW, barLedH)
  let inactiveLedContext = inactiveLedBuffer.getContext('2d')

  // Buffer for threshold alarm led
  let ledBuffer
  let ledGauge

  // Buffer for the minMeasuredValue & maxMeasuredValue indicators
  let minMeasuredValueBuffer
  let maxMeasuredValueBuffer

  // Buffer for static foreground painting code
  const foregroundBuffer = createBuffer(width, height)
  let foregroundCtx = foregroundBuffer.getContext('2d')

  // **************   Image creation  ********************
  const drawValueBackground = function (ctx) {
    ctx.save()

    const labelColor = backgroundColor.labelColor

    // Orientation dependend definitions
    const bgStartX = vertical ? 0 : (width * 0.13)
    const bgStartY = vertical ? top : (height * 0.435714)
    const bgStopX = vertical ? 0 : (bgStartX + fullSize * 1.035)
    const bgStopY = vertical ? (top + fullSize * 1.014) : bgStartY

    const darker =
      backgroundColor === BackgroundColor.CARBON ||
      backgroundColor === BackgroundColor.PUNCHED_SHEET ||
      backgroundColor === BackgroundColor.STAINLESS ||
      backgroundColor === BackgroundColor.BRUSHED_STAINLESS ||
      backgroundColor === BackgroundColor.TURNED
        ? 0.3
        : 0

    const valueBackgroundTrackGradient = ctx.createLinearGradient(bgStartX, bgStartY, bgStopX, bgStopY)
    labelColor.setAlpha(0.047058 + darker)
    valueBackgroundTrackGradient.addColorStop(0, labelColor.getRgbaColor())
    labelColor.setAlpha(0.145098 + darker)
    valueBackgroundTrackGradient.addColorStop(0.48, labelColor.getRgbaColor())
    labelColor.setAlpha(0.149019 + darker)
    valueBackgroundTrackGradient.addColorStop(0.49, labelColor.getRgbaColor())
    labelColor.setAlpha(0.047058 + darker)
    valueBackgroundTrackGradient.addColorStop(1, labelColor.getRgbaColor())
    ctx.fillStyle = valueBackgroundTrackGradient

    if (vertical) {
      ctx.fillRect(width * 0.435714, top, width * 0.15, fullSize * 1.014)
    } else {
      ctx.fillRect(bgStartX, bgStartY, fullSize * 1.035, height * 0.152857)
    }

    const borderStartX = vertical ? 0 : bgStartX
    const borderStartY = vertical ? top : 0
    const borderStopX = vertical ? 0 : bgStopX
    const borderStopY = vertical ? (top + fullSize * 1.014) : 0

    const valueBorderGradient = ctx.createLinearGradient(borderStartX, borderStartY, borderStopX, borderStopY)
    labelColor.setAlpha(0.298039 + darker)
    valueBorderGradient.addColorStop(0, labelColor.getRgbaColor())
    labelColor.setAlpha(0.686274 + darker)
    valueBorderGradient.addColorStop(0.48, labelColor.getRgbaColor())
    labelColor.setAlpha(0.698039 + darker)
    valueBorderGradient.addColorStop(0.49, labelColor.getRgbaColor())
    labelColor.setAlpha(0.4 + darker)
    valueBorderGradient.addColorStop(1, labelColor.getRgbaColor())
    ctx.fillStyle = valueBorderGradient

    if (vertical) {
      ctx.fillRect(width * 0.435714, top, width * 0.007142, fullSize * 1.014)
      ctx.fillRect(width * 0.571428, top, width * 0.007142, fullSize * 1.014)
    } else {
      ctx.fillRect(width * 0.13, height * 0.435714, fullSize * 1.035, height * 0.007142)
      ctx.fillRect(width * 0.13, height * 0.571428, fullSize * 1.035, height * 0.007142)
    }

    // Draw inactive leds
    if (vertical) {
      for (let translateY = 0; translateY <= fullSize; translateY += barLedH + 1) {
        ctx.drawImage(inactiveLedBuffer, barLedRefX, barLedRefY - translateY)
      }
    } else {
      for (let translateX = -(barLedW / 2); translateX <= fullSize; translateX += barLedW + 1) {
        ctx.drawImage(inactiveLedBuffer, barLedRefX + translateX, barLedRefY)
      }
    }

    ctx.restore()
  }

  const drawValue = function (ctx) {
    ctx.save()

    const activeLeds = ((value - minValue) / (maxValue - minValue)) * fullSize

    const start = vertical ? 0 : (-(barLedW / 2))
    const inc = vertical ? (barLedH + 1) : (barLedW + 1)

    let ledColor
    let lastLedColor = valueColor
    let currentValue, gradRange, fraction // For gradient
    let currentSection // For sections
    for (let offset = start; offset <= activeLeds; offset += inc) {
      // Get current led color
      ledColor = valueColor
      if (isGradientVisible) {
        currentValue = minValue + (offset / fullSize) * (maxValue - minValue)
        gradRange = valueGradient.getEnd() - valueGradient.getStart()
        fraction = Math.max(
          Math.min((currentValue - minValue) / gradRange, 1),
          0
        )
        // ledColor = customColorDef(valueGradient.getColorAt(fraction).getRgbaColor())
        ledColor = ColorDef.fromColorString(valueGradient.getColorAt(fraction).getRgbaColor())
      } else if (isSectionsVisible) {
        currentSection = sectionPixels.find(({ start, stop }) => (offset >= start && offset <= stop))
        if (currentSection) { ledColor = currentSection.color }
      }

      // Has LED color changed? If so redraw the buffer
      if (lastLedColor.medium.getHexColor() !== ledColor.medium.getHexColor()) {
        drawActiveBargraphLed(activeLedContext, ledColor, mainCtx, vertical)
        lastLedColor = ledColor
      }

      // Draw led
      if (vertical) {
        ctx.drawImage(activeLedBuffer, barLedRefX, barLedRefY - offset)
      } else {
        ctx.drawImage(activeLedBuffer, barLedRefX + offset, barLedRefY)
      }

      ctx.restore()
    }
  }

  const drawInactiveLed = function (ctx) {
    ctx.save()

    // Draw path
    ctx.beginPath()
    ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.closePath()

    // Create gradient
    const centerX = ctx.canvas.width / 2
    const centerY = ctx.canvas.height / 2
    const ledGradient = mainCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, centerX)
    ledGradient.addColorStop(0, '#3c3c3c')
    ledGradient.addColorStop(1, '#323232')

    ctx.fillStyle = ledGradient
    ctx.fill()

    ctx.restore()
  }

  // **************   Initialization  ********************
  const init = function (buffers) {
    buffers = buffers || {}
    const initFrame = undefined === buffers.frame ? false : buffers.frame
    const initBackground = undefined === buffers.background ? false : buffers.background
    const initLed = undefined === buffers.led ? false : buffers.led
    const initForeground = undefined === buffers.foreground ? false : buffers.foreground
    const initBargraphLed = undefined === buffers.bargraphled ? false : buffers.bargraphled

    // Calculate the current min and max values and the range
    if (niceScale) {
      niceRange = calcNiceNumber(maxValue - minValue, false)
      majorTickSpacing = calcNiceNumber(niceRange / (maxNoOfMajorTicks - 1), true)
      minValue = Math.floor(minValue / majorTickSpacing) * majorTickSpacing
      maxValue = Math.ceil(maxValue / majorTickSpacing) * majorTickSpacing

      // Make sure values are still in range
      value = setInRange(value, minValue, maxValue)
      minMeasuredValue = setInRange(minMeasuredValue, minValue, maxValue)
      maxMeasuredValue = setInRange(maxMeasuredValue, minValue, maxValue)
      threshold = setInRange(threshold, minValue, maxValue)
    } else {
      niceRange = maxValue - minValue
      majorTickSpacing = 10
    }

    // Draw leds of bargraph
    if (initBargraphLed) {
      drawInactiveLed(inactiveLedContext)
      drawActiveBargraphLed(activeLedContext, valueColor, mainCtx, vertical)
    }

    // Create frame in frame buffer (backgroundBuffer)
    if (initFrame && frameVisible) {
      legacy.drawLinearFrameImage(frameCtx, frameDesign, width, height, vertical)
    }

    // Create background in background buffer (backgroundBuffer)
    if (initBackground) {
      if (backgroundVisible) {
        // Draw background image
        legacy.drawLinearBackgroundImage(backgroundCtx, backgroundColor, width, height, vertical)

        // Draw scale tickmarks
        legacy.drawLinearTickmarksImage(
          backgroundCtx,
          width,
          height,
          GaugeType.TYPE1,
          backgroundColor,
          labelNumberFormat,
          minValue,
          maxValue,
          niceScale,
          vertical
        )

        // Draw strings
        legacy.drawTitleImage(
          backgroundCtx,
          width,
          height,
          titleString,
          unitString,
          backgroundColor,
          vertical,
          null,
          lcdVisible
        )
      }

      // Draw bargraph background
      drawValueBackground(backgroundCtx)

      // Draw threshold indicator
      if (thresholdVisible) {
        legacy.drawLinearIndicator(
          backgroundCtx,
          legacy.createThresholdImage(indicatorSize, indicatorSize, false, vertical),
          threshold,
          minValue,
          maxValue,
          GaugeType.TYPE1,
          vertical,
          false
        )
      }
    }

    if (initLed && ledVisible) {
      ledBuffer = createBuffer(ledSize, ledSize)
      ledGauge = new Led(ledBuffer, { ledColor: ledColor })
    }

    // Draw min measured value indicator in minMeasuredValueBuffer
    if (minMeasuredValueVisible) {
      minMeasuredValueBuffer = legacy.createMeasuredValueImage(
        indicatorSize,
        legacy.ColorDef.BLUE.dark.getRgbaColor(),
        false,
        vertical
      )
    }

    // Draw max measured value indicator in maxMeasuredValueBuffer
    if (maxMeasuredValueVisible) {
      maxMeasuredValueBuffer = legacy.createMeasuredValueImage(
        indicatorSize,
        legacy.ColorDef.RED.medium.getRgbaColor(),
        false,
        vertical
      )
    }

    // Create lcd background if selected in background buffer (backgroundBuffer)
    if (!initialized && lcdVisible) {
      lcdBuffer = createBuffer(lcdW, lcdH)
      lcdGauge = new DisplaySingle(lcdBuffer, {
        // width: lcdW,
        // height: lcdH,
        lcdColor: lcdColor,
        lcdDecimals: lcdDecimals,
        digitalFont: digitalFont,
        value: value
      })
      // lcdBuffer = createLcdBackgroundImage(lcdW, lcdH, lcdColor)
      // backgroundCtx.drawImage(lcdBuffer, lcdPosX, lcdPosY)
    }

    isGradientVisible = (useValueGradient && valueGradient !== null)
    isSectionsVisible = isGradientVisible ? false : (useValueSection && section !== null && section.length > 0)

    // Convert Section values into pixels
    if (isSectionsVisible) {
      const ledWidth2 = vertical ? 0 : ((width * 0.012135) / 2)

      // TODO use for loop ???
      let sectionIndex = section.length
      sectionPixels = []
      do {
        sectionIndex--
        sectionPixels.push({
          start: ((section[sectionIndex].start + Math.abs(minValue)) / (maxValue - minValue)) * fullSize - ledWidth2,
          stop: ((section[sectionIndex].stop + Math.abs(minValue)) / (maxValue - minValue)) * fullSize - ledWidth2,
          // color: customColorDef(section[sectionIndex].color)
          color: ColorDef.fromColorString(section[sectionIndex].color)
        })
      } while (sectionIndex > 0)
    }

    // Create foreground in foreground buffer (foregroundBuffer)
    if (initForeground && foregroundVisible) {
      legacy.drawLinearForegroundImage(foregroundCtx, width, height, vertical, false)
    }

    initialized = true
  }

  const resetBuffers = function (buffers) {
    buffers = buffers || {}
    const resetFrame = undefined === buffers.frame ? false : buffers.frame
    const resetBackground =
      undefined === buffers.background ? false : buffers.background
    // const resetLed = undefined === buffers.led ? false : buffers.led
    const resetBargraphLed =
      undefined === buffers.bargraphled ? false : buffers.bargraphled
    const resetForeground =
      undefined === buffers.foreground ? false : buffers.foreground

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

    if (resetBargraphLed) {
      activeLedBuffer.width = barLedW
      activeLedBuffer.height = barLedH
      activeLedContext = activeLedBuffer.getContext('2d')

      // Buffer for active bargraph led
      inactiveLedBuffer.width = barLedW
      inactiveLedBuffer.height = barLedH
      inactiveLedContext = inactiveLedBuffer.getContext('2d')
    }

    // if (resetLed) {
    //   ledBufferOn.width = Math.ceil(width * 0.093457)
    //   ledBufferOn.height = Math.ceil(height * 0.093457)
    //   ledContextOn = ledBufferOn.getContext('2d')

    //   ledBufferOff.width = Math.ceil(width * 0.093457)
    //   ledBufferOff.height = Math.ceil(height * 0.093457)
    //   ledContextOff = ledBufferOff.getContext('2d')

    //   // Buffer for current led painting code
    //   ledBuffer = ledBufferOff
    // }

    if (resetForeground) {
      foregroundBuffer.width = width
      foregroundBuffer.height = height
      foregroundCtx = foregroundBuffer.getContext('2d')
    }
  }

  const setBlinking = function (blinking) {
    if (blinking) {
      ledTimerId = setInterval(toggleAndRepaintLed, 1000)
    } else {
      clearInterval(ledTimerId)
      if (ledGauge !== undefined) {
        ledGauge.setLedOnOff(false)
      }
      // ledBuffer = ledBufferOff
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

  //* *********************************** Public methods **************************************
  this.getValue = function () {
    return value
  }

  this.setValue = function (newValue) {
    newValue = parseFloat(newValue)
    if (!isNaN(newValue)) {
      const targetValue = setInRange(newValue, minValue, maxValue)
      if (value !== targetValue) {
        // Stop eventual animations
        if (tween !== undefined && tween.isPlaying) {
          tween.stop()
        }

        // Update value
        value = targetValue

        // Possibly, update minMeasuredValue / maxMeasuredValue
        if (value > maxMeasuredValue) {
          maxMeasuredValue = value
        }
        if (value < minMeasuredValue) {
          minMeasuredValue = value
        }

        if (isThresholdExcedeed() && !ledBlinking) {
          ledBlinking = true
          setBlinking(ledBlinking)
          if (playAlarm && audioElement !== null) {
            audioElement.play()
          }
        } else if (!isThresholdExcedeed() && ledBlinking) {
          ledBlinking = false
          setBlinking(ledBlinking)
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
      if (value !== targetValue) {
        if (undefined !== tween && tween.isPlaying) {
          tween.stop()
        }

        const gauge = this
        let time = (fullScaleDeflectionTime * Math.abs(targetValue - value)) / (maxValue - minValue)
        time = Math.max(time, fullScaleDeflectionTime / 5)

        tween = new Tween({}, '', Tween.regularEaseInOut, value, targetValue, time)
        tween.onMotionChanged = function (event) {
          value = event.target._pos

          if (value > maxMeasuredValue) {
            maxMeasuredValue = value
          }
          if (value < minMeasuredValue) {
            minMeasuredValue = value
          }

          if (isThresholdExcedeed() && !ledBlinking) {
            ledBlinking = true
            setBlinking(ledBlinking)
            if (playAlarm && audioElement !== null) {
              audioElement.play()
            }
          } else if (!isThresholdExcedeed() && ledBlinking) {
            ledBlinking = false
            setBlinking(ledBlinking)
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

  this.getMinMeasuredValue = function () {
    return minMeasuredValue
  }

  this.resetMinMeasuredValue = function () {
    minMeasuredValue = value
    this.repaint()
    return this
  }

  this.setMinMeasuredValue = function (newValue) {
    newValue = parseFloat(newValue)
    if (!isNaN(newValue)) {
      const targetValue = setInRange(newValue, minValue, maxValue)
      if (minMeasuredValue !== targetValue) {
        minMeasuredValue = targetValue
        this.repaint()
      }
    }

    return this
  }

  this.getMaxMeasuredValue = function () {
    return maxMeasuredValue
  }

  this.resetMaxMeasuredValue = function () {
    maxMeasuredValue = value
    this.repaint()
    return this
  }

  this.setMaxMeasuredValue = function (newValue) {
    newValue = parseFloat(newValue)
    if (!isNaN(newValue)) {
      const targetValue = setInRange(newValue, minValue, maxValue)
      if (maxMeasuredValue !== targetValue) {
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
    this.repaint()
    return this
  }

  this.isMaxMeasuredValueVisible = function () {
    return maxMeasuredValueVisible
  }

  this.setMaxMeasuredValueVisible = function (visible) {
    maxMeasuredValueVisible = !!visible
    this.repaint()
    return this
  }

  this.getMinValue = function () {
    return minValue
  }

  this.setMinValue = function (newValue) {
    newValue = parseFloat(newValue)
    if (!isNaN(newValue) && newValue !== minValue) {
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
    if (!isNaN(newValue) && newValue !== maxValue) {
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
      const targetValue = setInRange(newValue, minValue, maxValue)
      if (threshold !== targetValue) {
        threshold = targetValue
        resetBuffers({ background: true })
        init({ background: true })
        this.repaint()
      }
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
    setBlinking(ledBlinking)
    this.repaint()
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

  this.getLcdDecimals = function () {
    return lcdDecimals
  }

  this.setLcdDecimals = function (decimals) {
    decimals = parseInt(decimals, 10)
    if (!isNaN(decimals)) {
      lcdDecimals = parseInt(decimals, 10)
      this.repaint()
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
      resetBuffers({ background: true })
      init({ background: true })
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
      resetBuffers({ bargraphled: true })
      init({ bargraphled: true })
      this.repaint()
    }

    return this
  }

  this.getLedColor = function () {
    if (ledGauge !== undefined) {
      return ledGauge.getLcdColor()
    } else {
      return ledColor // First LED Value passed on creation
    }
  }

  this.setLedColor = function (newLedColor) {
    if (ledGauge !== undefined) {
      ledGauge.setLedColor(newLedColor) // LED Gauge setter validate color
      this.repaint()
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

  this.getLcdColor = function () {
    if (lcdGauge !== undefined) {
      return lcdGauge.getLcdColor()
    } else {
      return lcdColor
    }
  }

  this.setLcdColor = function (newLcdColor) {
    if (lcdGauge !== undefined) {
      lcdGauge.setLcdColor(newLcdColor) // LCD Gauge setter validate color
      this.repaint()
    }

    return this
  }

  this.getSection = function () {
    return section
  }

  this.setSection = function (newSection) {
    if (Object.prototype.toString.call(newSection) === '[object Array]') {
      section = newSection
      init()
      this.repaint()
    }

    return this
  }

  this.isSectionActive = function () {
    return useValueSection
  }

  this.setSectionActive = function (active) {
    useValueSection = !!active
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

  this.getTitleString = function () {
    return titleString
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

  this.getUnitString = function () {
    return unitString
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

  this.repaint = function () {
    // First initialization
    if (!initialized) {
      init({
        frame: true,
        background: true,
        led: true,
        foreground: true,
        bargraphled: true
      })
    }

    // Clear canvas
    mainCtx.clearRect(0, 0, mainCtx.canvas.width, mainCtx.canvas.height)

    // Draw frame
    if (frameVisible) {
      mainCtx.drawImage(frameBuffer, 0, 0)
    }

    // Draw buffered image to visible canvas
    mainCtx.drawImage(backgroundBuffer, 0, 0)

    // Draw lcd display
    if (lcdVisible && lcdGauge !== undefined) {
      lcdGauge.setValue(value)
      mainCtx.drawImage(lcdBuffer, lcdPosX, lcdPosY)
    }

    // Draw led
    if (ledVisible) {
      mainCtx.drawImage(ledBuffer, ledPosX, ledPosY)
    }

    // Draw min measured value indicator
    if (minMeasuredValueVisible) {
      const [minX, minY] = calcIndicatorPos(minMeasuredValue)
      mainCtx.drawImage(minMeasuredValueBuffer, minX, minY)
    }

    // Draw max measured value indicator
    if (maxMeasuredValueVisible) {
      const [maxX, maxY] = calcIndicatorPos(maxMeasuredValue)
      mainCtx.drawImage(maxMeasuredValueBuffer, maxX, maxY)
    }

    drawValue(mainCtx, width, height)

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
