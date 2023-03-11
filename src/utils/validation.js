export const isHexColor = function (color) {
  // Accept both '#abc' and '#abcdef' format
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)
}

export const validBackgroundColor = function (color) {
  // IMPROVE validate rgba colors
  return [
    color.gradientStart,
    color.gradientFraction,
    color.gradientStop,
    color.labelColor,
    color.symbolColor,
    color.name
  ].every(prop => prop !== undefined)
}

export const validLcdColor = function (color) {
  return [
    color.gradientStartColor,
    color.gradientFraction1Color,
    color.gradientFraction2Color,
    color.gradientFraction3Color,
    color.gradientStopColor,
    color.textColor
  ].every(prop => prop !== undefined)
}

export const validColor = function (color) {
  return [
    color.veryDark,
    color.dark,
    color.medium,
    color.light,
    color.lighter,
    color.veryLight
  ].every(prop => prop !== undefined)
}

export const validLedColor = function (color) {
  return [
    color.innerColor1_ON,
    color.innerColor2_ON,
    color.outerColor_ON,
    color.coronaColor,
    color.innerColor1_OFF,
    color.innerColor2_OFF,
    color.outerColor_OFF
  ].every(prop => prop !== undefined)
}

export const validGaugeType = function (obj) {
  return obj.type !== undefined
}

export const validOrientation = function (obj) {
  return obj.type !== undefined
}

export const validKnobType = function (obj) {
  return obj.type !== undefined
}

export const validKnobStyle = function (obj) {
  return obj.style !== undefined
}

export const validFrameDesign = function (obj) {
  return obj.design !== undefined
}

export const validPointerType = function (obj) {
  return obj.type !== undefined
}

export const validForegroundType = function (obj) {
  return obj.type !== undefined
}

export const validLabelNumberFormat = function (obj) {
  return obj.format !== undefined
}

export const validTickLabelOrientation = function (obj) {
  return obj.type !== undefined
}

export const validTrendState = function (obj) {
  return obj.state !== undefined
}
