export const drawActiveBargraphLed = function (ctx, color, mainCtx, vertical) {
  ctx.save()

  // Draw path
  ctx.beginPath()
  ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.closePath()

  // Create gradient
  const centerX = ctx.canvas.width / 2
  const centerY = ctx.canvas.height / 2
  const outerRadius = vertical ? centerX : centerY
  const ledGradient = mainCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, outerRadius)
  ledGradient.addColorStop(0, color.light.getRgbaColor())
  ledGradient.addColorStop(1, color.dark.getRgbaColor())

  // Color path
  ctx.fillStyle = ledGradient
  ctx.fill()

  ctx.restore()
}
