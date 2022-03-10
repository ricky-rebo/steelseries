import { calcNiceNumber } from './tools'

const MAX_MAJOR_TICKS_COUNT = 10
const MAX_MINOR_TICKS_COUNT = 10

const drawLinearTick = function (ctx, tickStart, tickStop, currentPos, vertical) {
  const startX = vertical ? tickStart : currentPos
  const startY = vertical ? currentPos : tickStart
  const stopX = vertical ? tickStop : currentPos
  const stopY = vertical ? currentPos : tickStop

  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.lineTo(stopX, stopY)
  ctx.closePath()
  ctx.stroke()
}

const drawLinearTickmarksImage = function (ctx, width, height, gaugeType, color, labelFormat, minValue, maxValue, niceScale, vertical) {
  // Parameters init
  color.labelColor.setAlpha(1)

  ctx.save()

  let majorTickSpacing
  let minorTickSpacing
  if (niceScale) {
    const niceRange = calcNiceNumber(maxValue - minValue, false)
    majorTickSpacing = calcNiceNumber(niceRange / (MAX_MAJOR_TICKS_COUNT - 1), true)
    minorTickSpacing = calcNiceNumber(majorTickSpacing / (MAX_MINOR_TICKS_COUNT - 1), true)
  } else {
    majorTickSpacing = 10
    minorTickSpacing = 1
  }

  // Ticks sizes
  const minorTickStart = vertical ? width * 0.34 : height * 0.65
  const minorTickStop = vertical ? width * 0.36 : height * 0.63
  const mediumTickStart = vertical ? width * 0.33 : height * 0.66
  const mediumTickStop = vertical ? width * 0.36 : height * 0.63
  const majorTickStart = vertical ? width * 0.32 : height * 0.67
  const majorTickStop = vertical ? width * 0.36 : height * 0.63

  const scaleBoundsX = vertical
    ? 0
    : width * (gaugeType.type === 'type2' ? 0.19857 : 0.142857)
  const scaleBoundsY = vertical
    ? height * 0.12864
    : 0
  const scaleBoundsW = vertical
    ? 0
    : width * (gaugeType.type === 'type2' ? 0.82 : 0.871012) - scaleBoundsX
  const scaleBoundsH = vertical
    ? height * (gaugeType.type === 'type2' ? 0.7475 : 0.856796) - scaleBoundsY
    : 0

  const tickSpaceScaling = (vertical ? scaleBoundsH : scaleBoundsW) / (maxValue - minValue)

  const TEXT_WIDTH = width * 0.1

  // Init context
  ctx.textBaseline = 'middle'
  ctx.textAlign = vertical ? 'right' : 'center'

  ctx.strokeStyle = color.labelColor.getRgbaColor()
  ctx.fillStyle = color.labelColor.getRgbaColor()

  let valueCounter = minValue
  let majorTickCounter = MAX_MINOR_TICKS_COUNT - 1
  let tickCounter
  let currentPos

  let labelCounter
  for (
    labelCounter = minValue, tickCounter = 0;
    labelCounter <= maxValue;
    labelCounter += minorTickSpacing, tickCounter += minorTickSpacing
  ) {
    // Calculate the bounds of the scaling
    if (vertical) {
      currentPos = scaleBoundsY + scaleBoundsH - tickCounter * tickSpaceScaling
    } else {
      currentPos = scaleBoundsX + tickCounter * tickSpaceScaling
    }

    majorTickCounter++

    // Draw tickmark every major tickmark spacing
    if (majorTickCounter === MAX_MINOR_TICKS_COUNT) {
      ctx.lineWidth = 1.5
      drawLinearTick(ctx, majorTickStart, majorTickStop, currentPos, vertical)

      // Draw the standard tickmark labels
      const labelPosX = (vertical) ? width * 0.28 : currentPos
      const labelPosY = (vertical) ? currentPos : height * 0.73
      switch (labelFormat.format) {
        case 'fractional':
          ctx.fillText(valueCounter.toFixed(2), labelPosX, labelPosY, TEXT_WIDTH)
          break

        case 'scientific':
          ctx.fillText(valueCounter.toPrecision(2), labelPosX, labelPosY, TEXT_WIDTH)
          break

        case 'standard':
        default:
          ctx.fillText(valueCounter.toFixed(0), labelPosX, labelPosY, TEXT_WIDTH)
          break
      }

      valueCounter += majorTickSpacing
      majorTickCounter = 0
      continue
    }

    // Draw tickmark every minor tickmark spacing
    if (MAX_MINOR_TICKS_COUNT % 2 === 0 && majorTickCounter === MAX_MINOR_TICKS_COUNT / 2) {
      ctx.lineWidth = 1
      drawLinearTick(ctx, mediumTickStart, mediumTickStop, currentPos, vertical)
    } else {
      ctx.lineWidth = 0.5
      drawLinearTick(ctx, minorTickStart, minorTickStop, currentPos, vertical)
    }
  }

  ctx.restore()
}

export default drawLinearTickmarksImage
