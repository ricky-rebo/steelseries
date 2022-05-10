import createLcdBackgroundImage from './tools/create/createLcdBackgroundImage'
import { createBuffer, getCanvasContext, lcdFontName, stdFontName } from './utils/common'

import { LcdColor } from './tools/customization/colors'

export const DisplayMulti = function (canvas, parameters) {
  // Get the canvas context
  const mainCtx = getCanvasContext(canvas)

  // Parameters
  parameters = parameters || {}
  const width = undefined === parameters.width ? mainCtx.canvas.width : parameters.width
  const height = undefined === parameters.height ? mainCtx.canvas.height : parameters.height
  let lcdColor =
    undefined === parameters.lcdColor ? LcdColor.STANDARD : parameters.lcdColor
  const lcdDecimals =
    undefined === parameters.lcdDecimals ? 2 : parameters.lcdDecimals
  let headerString =
    undefined === parameters.headerString ? '' : parameters.headerString
  let headerStringVisible =
    undefined === parameters.headerStringVisible
      ? false
      : parameters.headerStringVisible
  let detailString =
    undefined === parameters.detailString ? '' : parameters.detailString
  let detailStringVisible =
    undefined === parameters.detailStringVisible
      ? false
      : parameters.detailStringVisible
  const linkAltValue =
    undefined === parameters.linkAltValue ? true : parameters.linkAltValue
  let unitString =
    undefined === parameters.unitString ? '' : parameters.unitString
  let unitStringVisible =
    undefined === parameters.unitStringVisible
      ? false
      : parameters.unitStringVisible
  const digitalFont =
    undefined === parameters.digitalFont ? false : parameters.digitalFont
  const valuesNumeric =
    undefined === parameters.valuesNumeric ? true : parameters.valuesNumeric
  let value = undefined === parameters.value ? 0 : parameters.value
  let altValue = undefined === parameters.altValue ? 0 : parameters.altValue

  // Set the size
  mainCtx.canvas.width = width
  mainCtx.canvas.height = height

  // Constants
  const stdFont = Math.floor(height / 1.875) + 'px ' + stdFontName
  const lcdFont = Math.floor(height / 1.875) + 'px ' + lcdFontName
  const stdAltFont = Math.floor(height / 3.5) + 'px ' + stdFontName
  const lcdAltFont = Math.floor(height / 3.5) + 'px ' + lcdFontName

  // Internal Variables
  let unitStringWidth = 0

  let initialized = false

  // **************   Buffer creation  ********************
  // Buffer for the lcd
  let backgroundBuffer

  // Buffer for lcd 'static' text
  const textBuffer = createBuffer(width, height)
  let textCtx = textBuffer.getContext('2d')

  // **************   Image creation  ********************
  const drawLcdText = function (ctx) {
    ctx.save()
    initTextCtx(ctx)

    ctx.textAlign = 'right'

    if (valuesNumeric) { // Numeric values
      if (unitStringVisible) {
        // Calc unitString text width
        const factor = headerStringVisible ? 3 : 2.5
        ctx.font = Math.floor(height / factor) + 'px ' + stdFontName
        unitStringWidth = ctx.measureText(unitString).width

        // Draw unitString text
        ctx.font = Math.floor(height / 3) + 'px ' + stdFontName
        ctx.fillText(unitString, width - 2, height * 0.55)
      } else {
        unitStringWidth = 0
      }

      if (headerStringVisible) {
        // Draw headerString
        ctx.textAlign = 'center'
        ctx.font = digitalFont ? lcdAltFont : (Math.floor(height / 5) + 'px ' + stdFontName)
        ctx.fillText(headerString, width / 2, height * 0.16)
      }
    } else { // Non-Numeric values
      if (headerStringVisible) {
        // Draw headerString
        ctx.font = Math.floor(height / 5) + 'px ' + stdFontName
        ctx.textAlign = 'center'
        ctx.fillText(headerString, width / 2, height * 0.17)
      }
    }

    ctx.restore()
  }

  const drawLcdValueText = function (ctx) {
    ctx.save()
    initTextCtx(ctx)

    let heightFactor

    ctx.textAlign = 'right'

    if (valuesNumeric) { // Numeric value
      // Set font
      ctx.font = digitalFont ? lcdFont : stdFont

      // Draw value text
      const valueText = value.toFixed(lcdDecimals)
      heightFactor = headerStringVisible ? 0.5 : 0.38
      ctx.fillText(valueText, width - unitStringWidth - 4, height * heightFactor)

      // Draw altValue + detailString text
      ctx.textAlign = 'center'
      const altValueText = altValue.toFixed(lcdDecimals) + (detailStringVisible ? detailString : '')
      ctx.font = digitalFont
        ? lcdAltFont
        : (
          headerStringVisible
            ? (Math.floor(height / 5) + 'px ' + stdFontName)
            : stdAltFont
        )
      heightFactor = headerStringVisible ? 0.83 : 0.8
      ctx.fillText(altValueText, width / 2, height * heightFactor)
    } else { // Non-numeric value
      // Draw value
      heightFactor = headerStringVisible ? 0.48 : 0.38
      ctx.font = headerStringVisible
        ? stdAltFont
        : Math.floor(height / 2.5) + 'px ' + stdFontName
      ctx.fillText(value, width - 2, height * heightFactor)

      // Draw altValue
      ctx.textAlign = 'center'
      heightFactor = headerStringVisible ? 0.83 : 0.8
      ctx.font = headerStringVisible // Used as font itself here
        ? Math.floor(height / 5) + 'px ' + stdFontName
        : stdAltFont
      ctx.fillText(altValue, width / 2, height * heightFactor)
    }
    ctx.restore()
  }

  // **************   Initialization  ********************
  const initTextCtx = function (ctx) {
    ctx.textBaseline = 'middle'
    ctx.strokeStyle = lcdColor.textColor
    ctx.fillStyle = lcdColor.textColor

    if (lcdColor === LcdColor.STANDARD || lcdColor === LcdColor.STANDARD_GREEN) {
      ctx.shadowColor = 'gray'
      ctx.shadowOffsetX = height * 0.025
      ctx.shadowOffsetY = height * 0.025
      ctx.shadowBlur = height * 0.05
    }
  }

  const init = function (buffers) {
    buffers = buffers || {}
    const initBackground = undefined === buffers.background ? false : buffers.background
    const initText = undefined === buffers.text ? false : buffers.text

    initialized = true

    // Create lcd background if selected in background buffer (backgroundBuffer)
    if (initBackground) {
      backgroundBuffer = createLcdBackgroundImage(width, height, lcdColor)
    }

    if (initText) {
      drawLcdText(textCtx)
    }
  }

  const resetBuffers = function (buffers) {
    buffers = buffers || {}

    const resetText = undefined === buffers.text ? false : buffers.text

    if (resetText) {
      textBuffer.width = width
      textBuffer.height = height
      textCtx = textBuffer.getContext('2d')
    }
  }

  // **************   Public methods  ********************
  this.getValue = function () {
    return value
  }

  this.setValue = function (newValue) {
    newValue = valuesNumeric ? parseFloat(newValue) : newValue
    if ((valuesNumeric && !isNaN(newValue)) || !valuesNumeric) {
      if (value !== newValue) {
        if (linkAltValue) {
          altValue = value
        }
        value = newValue
        this.repaint()
      }
      return this
    }
  }

  this.getAltValue = function () {
    return altValue
  }

  this.setAltValue = function (newAltValue) {
    if ((valuesNumeric && !isNaN(newAltValue)) || !valuesNumeric) {
      if (altValue !== newAltValue) {
        altValue = newAltValue
        this.repaint()
      }
    }
    return this
  }

  this.getLcdColor = function () {
    return lcdColor
  }

  this.setLcdColor = function (newLcdColor) {
    if (undefined !== newLcdColor.textColor) {
      lcdColor = newLcdColor
      init()
      this.repaint()
    }

    return this
  }

  this.getHeaderStringVisible = function () {
    return headerStringVisible
  }

  this.setHeaderStringVisible = function (visible) {
    headerStringVisible = !!visible
    resetBuffers({ text: true })
    init({ text: true })
    this.repaint()
    return this
  }

  this.getHeaderString = function () {
    return headerString
  }

  this.setHeaderString = function (newString) {
    headerString = newString
    resetBuffers({ text: true })
    init({ text: true })
    this.repaint()
    return this
  }

  this.getDetailStringVisible = function () {
    return detailStringVisible
  }

  this.setDetailStringVisible = function (visible) {
    detailStringVisible = !!visible
    this.repaint()
    return this
  }

  this.getDetailString = function () {
    return detailString
  }

  this.setDetailString = function (newString) {
    detailString = newString
    this.repaint()
    return this
  }

  this.getUnitStringVisible = function () {
    return unitStringVisible
  }

  this.setUnitStringVisible = function (visible) {
    unitStringVisible = !!visible
    resetBuffers({ text: true })
    init({ text: true })
    this.repaint()
    return this
  }

  this.getUnitString = function () {
    return unitString
  }

  this.setUnitString = function (newString) {
    unitString = newString
    resetBuffers({ text: true })
    init({ text: true })
    this.repaint()
    return this
  }

  this.repaint = function () {
    if (!initialized) {
      init({
        background: true,
        text: true
      })
    }

    // Clear context
    mainCtx.clearRect(0, 0, width, height)

    // Draw LCD Background
    mainCtx.drawImage(backgroundBuffer, 0, 0)

    // Draw LCD 'static' text
    mainCtx.drawImage(textBuffer, 0, 0)

    // Draw LCD values Text
    drawLcdValueText(mainCtx)
  }

  // Visualize the component
  this.repaint()

  return this
}
