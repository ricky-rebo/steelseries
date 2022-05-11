import { calcNiceNumber } from '../../utils/common'
import { HALF_PI, PI, stdFontName, } from '../../utils/constants'
import { getRadialRotationParams } from '../../utils/radial.js'

const MAX_MINOR_TICKS_COUNT = 10
const MAX_MAJOR_TICKS_COUNT = 10

function drawRadialTickmarksImage (ctx, size, gaugeType, minValue, maxValue, niceValues, backgroundColor, labelOrientation, numberFormat, fractionalScaleDecimals, labelAltPos, labelsOnly) {
  const CENTER = size / 2

  const RANGE = niceValues ? calcNiceNumber(maxValue - minValue, false) : maxValue - minValue
  const MAJOR_TICK_SPACING = calcNiceNumber(RANGE / (MAX_MAJOR_TICKS_COUNT - 1), true)
  const MINOR_TICK_SPACING = calcNiceNumber(MAJOR_TICK_SPACING / (MAX_MINOR_TICKS_COUNT - 1), true)

  const TEXT_TRANSLATE_X = labelAltPos
    ? size * 0.28
    : size * 0.3
  const TEXT_WIDTH = (gaugeType.type === 'type1' || gaugeType.type === 'type2')
    ? (labelAltPos ? size * 0.0375 : size * 0.04)
    : size * 0.1

  const OUTER_POINT = size * 0.38
  const MAJOR_INNER_POINT = size * 0.35
  const MED_INNER_POINT = size * 0.355
  const MINOR_INNER_POINT = size * 0.36

  const MAX_VALUE_ROUNDED = parseFloat(maxValue.toFixed(2))

  const { angleRange, rotationOffset } = getRadialRotationParams(gaugeType)
  const ANGLE_STEP = angleRange / RANGE
  const ROTATION_STEP = ANGLE_STEP * MINOR_TICK_SPACING

  let alpha = rotationOffset // Tracks total rotation
  let labelCounter = minValue
  let majorTickCounter = MAX_MINOR_TICKS_COUNT - 1

  backgroundColor.labelColor.setAlpha(1)

  ctx.save()

  // Init context
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${Math.ceil(size * 0.04)}px ${stdFontName}`
  ctx.strokeStyle = backgroundColor.labelColor.getRgbaColor()
  ctx.fillStyle = backgroundColor.labelColor.getRgbaColor()
  ctx.translate(CENTER, CENTER)
  ctx.rotate(rotationOffset)

  for (let i = minValue; parseFloat(i.toFixed(2)) <= MAX_VALUE_ROUNDED; i += MINOR_TICK_SPACING) {
    majorTickCounter++

    // Draw major tickmarks
    if (majorTickCounter === MAX_MINOR_TICKS_COUNT) {
      drawLabel(ctx, labelCounter, alpha, labelOrientation, numberFormat, fractionalScaleDecimals, TEXT_WIDTH, TEXT_TRANSLATE_X)

      if (!labelsOnly) {
        drawTickmark(ctx, 1.5, OUTER_POINT, MAJOR_INNER_POINT)
      }

      labelCounter += MAJOR_TICK_SPACING
      majorTickCounter = 0
      ctx.rotate(ROTATION_STEP)
      alpha += ROTATION_STEP

      continue
    }

    if (!labelsOnly) {
      // Draw tickmark every minor tickmark spacing
      if (MAX_MINOR_TICKS_COUNT % 2 === 0 && majorTickCounter === (MAX_MINOR_TICKS_COUNT / 2)) {
        drawTickmark(ctx, 1, OUTER_POINT, MED_INNER_POINT)
      } else {
        drawTickmark(ctx, 0.5, OUTER_POINT, MINOR_INNER_POINT)
      }
    }

    ctx.rotate(ROTATION_STEP)
    alpha += ROTATION_STEP
  }

  ctx.restore()
}

function drawTickmark (ctx, lineWidth, outerPoint, innerPoint) {
  ctx.save()

  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.moveTo(outerPoint, 0)
  ctx.lineTo(innerPoint, 0)
  ctx.closePath()
  ctx.stroke()

  ctx.restore()
}

function drawLabel (ctx, label, angle, labelOrientation, numberFormat, fractionalScaleDecimals, textWidth, textTranslate) {
  ctx.save()

  ctx.translate(textTranslate, 0)
  ctx.rotate(getLabelRotationAngle(labelOrientation, angle))
  ctx.fillText(
    getLabelString(numberFormat, label, fractionalScaleDecimals),
    0,
    0,
    textWidth
  )

  ctx.restore()
}

function getLabelString (numberFormat, label, fractionalScaleDecimals) {
  switch (numberFormat.format) {
    case 'fractional': return label.toFixed(fractionalScaleDecimals)
    case 'scientific': return label.toPrecision(2)
    case 'standard':
    default: return label.toFixed(0)
  }
}

function getLabelRotationAngle (labelOrientation, angle) {
  switch (labelOrientation.type) {
    case 'horizontal': return -angle
    case 'tangent': return angle <= HALF_PI + PI ? PI : 0
    case 'normal':
    default: return HALF_PI
  }
}

export {
  drawRadialTickmarksImage,
  MAX_MAJOR_TICKS_COUNT,
  MAX_MINOR_TICKS_COUNT
}
