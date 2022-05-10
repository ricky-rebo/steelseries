import createLcdBackgroundImage from './tools/create/createLcdBackgroundImage'
import {
  roundedRectangle,
  createBuffer,
  getColorValues,
  hsbToRgb,
  rgbToHsb,
  requestAnimFrame,
  getCanvasContext,
  lcdFontName,
  stdFontName
} from './tools/tools'

import { LcdColor } from './tools/definitions'

export const DisplaySingle = function (canvas, parameters) {
  parameters = parameters || {}

  // Get the canvas context
  const mainCtx = undefined === parameters._context
    ? getCanvasContext(canvas)
    : parameters._context

  // Parameters
  const width = undefined === parameters.width ? mainCtx.canvas.width : parameters.width
  const height = undefined === parameters.height ? mainCtx.canvas.height : parameters.height
  let lcdColor =
    undefined === parameters.lcdColor ? LcdColor.STANDARD : parameters.lcdColor
  let lcdDecimals =
    undefined === parameters.lcdDecimals ? 2 : parameters.lcdDecimals
  let unitString =
    undefined === parameters.unitString ? '' : parameters.unitString
  let unitStringVisible =
    undefined === parameters.unitStringVisible
      ? false
      : parameters.unitStringVisible
  let headerString =
    undefined === parameters.headerString ? '' : parameters.headerString
  let headerStringVisible =
    undefined === parameters.headerStringVisible
      ? false
      : parameters.headerStringVisible
  const digitalFont =
    undefined === parameters.digitalFont ? false : parameters.digitalFont
  const valuesNumeric =
    undefined === parameters.valuesNumeric ? true : parameters.valuesNumeric
  let value = undefined === parameters.value ? 0 : parameters.value
  const alwaysScroll =
    undefined === parameters.alwaysScroll ? false : parameters.alwaysScroll
  const autoScroll =
    undefined === parameters.autoScroll ? false : parameters.autoScroll
  let sections = undefined === parameters.section ? [] : parameters.section

  // Set the size
  mainCtx.canvas.width = width
  mainCtx.canvas.height = height

  // Constants
  const fontHeight = Math.floor(height / 1.5)
  const stdFont = fontHeight + 'px ' + stdFontName
  const lcdFont = fontHeight + 'px ' + lcdFontName

  const self = this

  // Internal variables
  let textWidth = 0

  let scrolling = false
  let scrollX = 0
  let scrollTimer
  let repainting = false

  let initialized = false

  // **************   Buffer creation  ********************
  // Buffer for the lcd
  let lcdBuffer
  const sectionBuffer = []
  const sectionForeColor = []

  // **************   Image creation  ********************
  const drawLcdValueText = function (ctx, textColor) {
    ctx.save()

    // Init context
    ctx.textAlign = 'right'
    ctx.strokeStyle = textColor
    ctx.fillStyle = textColor

    ctx.beginPath()
    ctx.rect(2, 0, width - 4, height)
    ctx.closePath()
    ctx.clip()

    if ((lcdColor === LcdColor.STANDARD || lcdColor === LcdColor.STANDARD_GREEN) && sections.length <= 0) {
      ctx.shadowColor = 'gray'
      ctx.shadowOffsetX = height * 0.035
      ctx.shadowOffsetY = height * 0.035
      ctx.shadowBlur = height * 0.055
    }

    ctx.font = digitalFont ? lcdFont : stdFont

    if (valuesNumeric) { // Numeric value
      // Calc unitString text width
      let unitWidth = 0
      if (unitStringVisible) {
        ctx.save()
        ctx.font = Math.floor(height / 2.5) + 'px ' + stdFontName
        unitWidth = ctx.measureText(unitString).width
        ctx.restore()
      }

      // Draw value text
      const lcdText = value.toFixed(lcdDecimals)
      const vPos = headerStringVisible ? 0.52 : 0.38
      textWidth = ctx.measureText(lcdText).width

      ctx.fillText(lcdText, width - unitWidth - 4 - scrollX, height * 0.5 + fontHeight * vPos)

      // Draw unitString text
      if (unitStringVisible) {
        ctx.font = Math.floor(height / 2.5) + 'px ' + stdFontName
        ctx.fillText(unitString, width - 2 - scrollX, height * 0.5 + fontHeight * vPos)
      }

      // Draw headerString text
      if (headerStringVisible) {
        ctx.textAlign = 'center'
        ctx.font = Math.floor(height / 3.5) + 'px ' + stdFontName
        ctx.fillText(headerString, width / 2, height * 0.3)
      }
    } else {
      // Text value
      textWidth = ctx.measureText(value).width
      if (alwaysScroll || (autoScroll && textWidth > width - 4)) {
        if (!scrolling) {
          if (textWidth > width * 0.8) {
            // leave 20% blank leading space to give time to read start of message
            scrollX = width - textWidth - width * 0.2
          } else {
            scrollX = 0
          }
          scrolling = true
          clearTimeout(scrollTimer) // kill any pending animate
          scrollTimer = setTimeout(animate, 200)
        }
      } else if (autoScroll && textWidth <= width - 4) {
        scrollX = 0
        scrolling = false
      }
      ctx.fillText(
        value,
        width - 2 - scrollX,
        height * 0.5 + fontHeight * 0.38
      )
    }
    ctx.restore()
  }

  const createLcdSectionImage = function (width, height, color, lcdColor) {
    const lcdSectionBuffer = createBuffer(width, height)
    const lcdCtx = lcdSectionBuffer.getContext('2d')

    lcdCtx.save()
    const xB = 0
    const yB = 0
    const wB = width
    const hB = height
    const rB = Math.min(width, height) * 0.095

    const lcdBackground = lcdCtx.createLinearGradient(0, yB, 0, yB + hB)

    lcdBackground.addColorStop(0, '#4c4c4c')
    lcdBackground.addColorStop(0.08, '#666666')
    lcdBackground.addColorStop(0.92, '#666666')
    lcdBackground.addColorStop(1, '#e6e6e6')
    lcdCtx.fillStyle = lcdBackground

    roundedRectangle(lcdCtx, xB, yB, wB, hB, rB)

    lcdCtx.fill()
    lcdCtx.restore()

    lcdCtx.save()

    const rgb = getColorValues(color)
    const hsb = rgbToHsb(rgb[0], rgb[1], rgb[2])

    const rgbStart = getColorValues(lcdColor.gradientStartColor)
    const hsbStart = rgbToHsb(rgbStart[0], rgbStart[1], rgbStart[2])
    const rgbFraction1 = getColorValues(lcdColor.gradientFraction1Color)
    const hsbFraction1 = rgbToHsb(rgbFraction1[0], rgbFraction1[1], rgbFraction1[2])
    const rgbFraction2 = getColorValues(lcdColor.gradientFraction2Color)
    const hsbFraction2 = rgbToHsb(rgbFraction2[0], rgbFraction2[1], rgbFraction2[2])
    const rgbFraction3 = getColorValues(lcdColor.gradientFraction3Color)
    const hsbFraction3 = rgbToHsb(rgbFraction3[0], rgbFraction3[1], rgbFraction3[2])
    const rgbStop = getColorValues(lcdColor.gradientStopColor)
    const hsbStop = rgbToHsb(rgbStop[0], rgbStop[1], rgbStop[2])

    const startColor = hsbToRgb(hsb[0], hsb[1], hsbStart[2] - 0.31)
    const fraction1Color = hsbToRgb(hsb[0], hsb[1], hsbFraction1[2] - 0.31)
    const fraction2Color = hsbToRgb(hsb[0], hsb[1], hsbFraction2[2] - 0.31)
    const fraction3Color = hsbToRgb(hsb[0], hsb[1], hsbFraction3[2] - 0.31)
    const stopColor = hsbToRgb(hsb[0], hsb[1], hsbStop[2] - 0.31)

    const xF = 1
    const yF = 1
    const wF = width - 2
    const hF = height - 2
    const rF = rB - 1
    const lcdForeground = lcdCtx.createLinearGradient(0, yF, 0, yF + hF)
    lcdForeground.addColorStop(0, `rgb(${startColor[0]}, ${startColor[1]}, ${startColor[2]})`)
    lcdForeground.addColorStop(0.03, `rgb(${fraction1Color[0]},${fraction1Color[1]},${fraction1Color[2]})`)
    lcdForeground.addColorStop(0.49, `rgb(${fraction2Color[0]},${fraction2Color[1]},${fraction2Color[2]})`)
    lcdForeground.addColorStop(0.5, `rgb(${fraction3Color[0]},${fraction3Color[1]},${fraction3Color[2]})`)
    lcdForeground.addColorStop(1, `rgb(${stopColor[0]},${stopColor[1]},${stopColor[2]})`)
    lcdCtx.fillStyle = lcdForeground

    roundedRectangle(lcdCtx, xF, yF, wF, hF, rF)

    lcdCtx.fill()
    lcdCtx.restore()

    return lcdSectionBuffer
  }

  const createSectionForegroundColor = function (sectionColor) {
    const rgbSection = getColorValues(sectionColor)
    const hsbSection = rgbToHsb(rgbSection[0], rgbSection[1], rgbSection[2])
    const sectionForegroundRgb = hsbToRgb(hsbSection[0], 0.57, 0.83)
    return `rgb(${sectionForegroundRgb[0]}, ${sectionForegroundRgb[1]}, ${sectionForegroundRgb[2]})`
  }

  const animate = function () {
    if (scrolling) {
      if (scrollX > width) {
        scrollX = -textWidth
      }
      scrollX += 2
      scrollTimer = setTimeout(animate, 50)
    } else {
      scrollX = 0
    }
    if (!repainting) {
      repainting = true
      requestAnimFrame(self.repaint)
    }
  }

  // **************   Initialization  ********************
  const init = function () {
    let i
    initialized = true

    // Create lcd background if selected in background buffer (backgroundBuffer)
    lcdBuffer = createLcdBackgroundImage(width, height, lcdColor)

    if (sections.length > 0) {
      for (i = 0; i < sections.length; i++) {
        sectionBuffer[i] = createLcdSectionImage(width, height, sections[i].color, lcdColor)
        sectionForeColor[i] = createSectionForegroundColor(sections[i].color)
      }
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
        value = newValue
        this.repaint()
      }
    } else {
      console.log('invalid value!')
    }
    return this
  }

  this.getLcdDecimals = function () {
    return lcdDecimals
  }

  this.setLcdDecimals = function (decimals) {
    decimals = parseInt(decimals)
    if (!isNaN(decimals)) {
      lcdDecimals = decimals
      this.repaint()
    }

    return this
  }

  this.getLcdColor = function () {
    return lcdColor
  }

  this.setLcdColor = function (newLcdColor) {
    lcdColor = newLcdColor
    init()
    this.repaint()
    return this
  }

  this.getSection = function () {
    return sections
  }

  this.setSection = function (newSection) {
    sections = newSection
    init({
      background: true,
      foreground: true
    })
    this.repaint()
    return this
  }

  this.isScrolling = function () {
    return scrolling
  }

  this.setScrolling = function (scroll) {
    if (scroll) {
      if (scrolling) {
        return
      } else {
        scrolling = scroll
        animate()
      }
    } else {
      // disable scrolling
      scrolling = scroll
    }
    return this
  }

  this.isHeaderStringVisible = function () {
    return headerStringVisible
  }

  this.setHeaderStringVisible = function (visible) {
    headerStringVisible = !!visible
    this.repaint()
    return this
  }

  this.getHeaderString = function () {
    return headerString
  }

  this.setHeaderString = function (str) {
    headerString = str
    this.repaint()
    return this
  }

  this.isUnitStringVisible = function () {
    return unitStringVisible
  }

  this.setUnitStringVisble = function (visible) {
    unitStringVisible = !!visible
    this.repaint()
    return this
  }

  this.getUnitString = function () {
    return unitString
  }

  this.setUnitString = function (str) {
    unitString = str
    this.repaint()
    return this
  }

  this.repaint = function () {
    if (!initialized) {
      init()
    }

    // Clear context
    mainCtx.clearRect(0, 0, mainCtx.canvas.width, mainCtx.canvas.height)

    // Select correct section
    let i
    let lcdBackgroundBuffer = lcdBuffer
    let lcdTextColor = lcdColor.textColor

    if (sections.length > 0) {
      for (i = 0; i < sections.length; i++) {
        if (value >= sections[i].start && value <= sections[i].stop) {
          lcdBackgroundBuffer = sectionBuffer[i]
          lcdTextColor = sectionForeColor[i]
          break
        }
      }
    }

    // Draw LCD background
    mainCtx.drawImage(lcdBackgroundBuffer, 0, 0)

    // Draw LCD text
    drawLcdValueText(mainCtx, lcdTextColor)

    repainting = false
  }

  // Visualize the component
  this.repaint()

  return this
}
