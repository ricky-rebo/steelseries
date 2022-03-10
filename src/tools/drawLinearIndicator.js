function drawLinearIndicator (ctx, indicator, value, minValue, maxValue, gaugeType, vertical, altPos) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height

  let valuePos, yOffset, yRange, posX, posY
  if (vertical) {
    yOffset = gaugeType.type === 'type2' ? 0.7475 : 0.856796
    yRange = yOffset - 0.12864
    valuePos = height * yOffset - (height * yRange * (value - minValue)) / (maxValue - minValue)
    posX = altPos ? width * 0.34 - indicator.width : width * 0.365
    posY = valuePos - indicator.height / 2
  } else {
    const factor = gaugeType.type === 'type2' ? 0.19857 : 0.142857
    yOffset = gaugeType.type === 'type2' ? 0.82 : 0.871012
    yRange = yOffset - factor
    valuePos = (width * yRange * (value - minValue)) / (maxValue - minValue)
    posX = width * factor - indicator.height / 2 + valuePos
    posY = height * (altPos ? 0.65 : 0.58)
  }

  ctx.save()
  ctx.drawImage(indicator, posX, posY)
  ctx.restore()
}

export default drawLinearIndicator
