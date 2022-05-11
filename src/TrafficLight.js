import { createBuffer, drawToBuffer, getCanvasContext } from './utils/common'
import { TWO_PI } from "./utils/constants"

export const Trafficlight = function (canvas, parameters) {
  // Get canvas context
  const mainCtx = getCanvasContext(canvas)

  // Parameters
  parameters = parameters || {}
  const canvasWidth = undefined === parameters.width ? mainCtx.canvas.width : parameters.width
  const canvasHeight = undefined === parameters.height ? mainCtx.canvas.height : parameters.height

  // Properties
  let redOn = false
  let yellowOn = false
  let greenOn = false

  let initialized = false

  // Constants
  const prefHeight = canvasWidth < canvasHeight * 0.352517 ? canvasWidth * 2.836734 : canvasHeight
  const width = prefHeight * 0.352517
  const height = prefHeight

  // Buffers
  const housingBuffer = createBuffer(width, height)
  const housingCtx = housingBuffer.getContext('2d')

  const offLightsBuffer = createBuffer(width, height)
  const offLightsCtx = offLightsBuffer.getContext('2d')

  const greenOnBuffer = createBuffer(width, height)
  const greenOnCtx = greenOnBuffer.getContext('2d')

  const yellowOnBuffer = createBuffer(width, height)
  const yellowOnCtx = yellowOnBuffer.getContext('2d')

  const redOnBuffer = createBuffer(width, height)
  const redOnCtx = redOnBuffer.getContext('2d')

  const hatchBuffer = drawToBuffer(2, 2, function (ctx) {
    ctx.save()
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.beginPath()
    ctx.lineTo(0, 0, 1, 0)
    ctx.lineTo(0, 1, 0, 1)
    ctx.stroke()
    ctx.restore()
  })

  // Set the size - also clears the canvas
  mainCtx.canvas.width = canvasWidth
  mainCtx.canvas.height = canvasHeight

  /* **********  INTERNAL UTILS  ********** */
  const drawHousing = function (ctx) {
    ctx.save()

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0.107142 * width, 0)
    ctx.lineTo(width - 0.107142 * width, 0)
    ctx.quadraticCurveTo(width, 0, width, 0.107142 * width)
    ctx.lineTo(width, height - 0.107142 * width)
    ctx.quadraticCurveTo(width, height, width - 0.107142 * width, height)
    ctx.lineTo(0.107142 * width, height)
    ctx.quadraticCurveTo(0, height, 0, height - 0.107142 * width)
    ctx.lineTo(0, 0.107142 * width)
    ctx.quadraticCurveTo(0, 0, 0.107142 * width, height)
    ctx.closePath()
    const housingFill = ctx.createLinearGradient(
      0.040816 * width,
      0.007194 * height,
      0.952101 * width,
      0.995882 * height
    )
    housingFill.addColorStop(0, 'rgb(152, 152, 154)')
    housingFill.addColorStop(0.01, 'rgb(152, 152, 154)')
    housingFill.addColorStop(0.09, '#333333')
    housingFill.addColorStop(0.24, 'rgb(152, 152, 154)')
    housingFill.addColorStop(0.55, 'rgb(31, 31, 31)')
    housingFill.addColorStop(0.78, '#363636')
    housingFill.addColorStop(0.98, '#000000')
    housingFill.addColorStop(1, '#000000')
    ctx.fillStyle = housingFill
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0.030612 * width + 0.084183 * width, 0.010791 * height)
    ctx.lineTo(0.030612 * width + 0.938775 * width - 0.084183 * width, 0.010791 * height)
    ctx.quadraticCurveTo(
      0.030612 * width + 0.938775 * width,
      0.010791 * height,
      0.030612 * width + 0.938775 * width,
      0.010791 * height + 0.084183 * width
    )
    ctx.lineTo(0.030612 * width + 0.938775 * width, 0.010791 * height + 0.978417 * height - 0.084183 * width)
    ctx.quadraticCurveTo(
      0.030612 * width + 0.938775 * width,
      0.010791 * height + 0.978417 * height,
      0.030612 * width + 0.938775 * width - 0.084183 * width,
      0.010791 * height + 0.978417 * height
    )
    ctx.lineTo(0.030612 * width + 0.084183 * width, 0.010791 * height + 0.978417 * height)
    ctx.quadraticCurveTo(
      0.030612 * width,
      0.010791 * height + 0.978417 * height,
      0.030612 * width,
      0.010791 * height + 0.978417 * height - 0.084183 * width
    )
    ctx.lineTo(0.030612 * width, 0.010791 * height + 0.084183 * width)
    ctx.quadraticCurveTo(
      0.030612 * width,
      0.010791 * height,
      0.030612 * width + 0.084183 * width,
      0.010791 * height
    )
    ctx.closePath()
    const housingFrontFill = ctx.createLinearGradient(
      -0.132653 * width,
      -0.053956 * height,
      2.061408 * width,
      0.667293 * height
    )
    housingFrontFill.addColorStop(0, '#000000')
    housingFrontFill.addColorStop(0.01, '#000000')
    housingFrontFill.addColorStop(0.16, '#373735')
    housingFrontFill.addColorStop(0.31, '#000000')
    housingFrontFill.addColorStop(0.44, '#303030')
    housingFrontFill.addColorStop(0.65, '#000000')
    housingFrontFill.addColorStop(0.87, '#363636')
    housingFrontFill.addColorStop(0.98, '#000000')
    housingFrontFill.addColorStop(1, '#000000')
    ctx.fillStyle = housingFrontFill
    ctx.fill()
    ctx.restore()

    ctx.restore()
  }

  const drawLightGreen = function (ctx) {
    ctx.save()

    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(0.5 * width, 0.805755 * height, 0.397959 * width, 0, TWO_PI, false)
    const lightGreenFrameFill = ctx.createLinearGradient(0, 0.665467 * height, 0, 0.946043 * height)
    lightGreenFrameFill.addColorStop(0, '#ffffff')
    lightGreenFrameFill.addColorStop(0.05, 'rgb(204, 204, 204)')
    lightGreenFrameFill.addColorStop(0.1, 'rgb(153, 153, 153)')
    lightGreenFrameFill.addColorStop(0.17, '#666666')
    lightGreenFrameFill.addColorStop(0.27, '#333333')
    lightGreenFrameFill.addColorStop(1, '#010101')
    ctx.fillStyle = lightGreenFrameFill
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.scale(1.083333, 1)
    ctx.beginPath()
    ctx.arc(0.461538 * width, 0.816546 * height, 0.367346 * width, 0, TWO_PI, false)
    const lightGreenInnerFill = ctx.createLinearGradient(0, 0.68705 * height, 0, 0.946043 * height)
    lightGreenInnerFill.addColorStop(0, '#000000')
    lightGreenInnerFill.addColorStop(0.35, '#040404')
    lightGreenInnerFill.addColorStop(0.66, '#000000')
    lightGreenInnerFill.addColorStop(1, '#010101')
    ctx.fillStyle = lightGreenInnerFill
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(0.5 * width, 0.809352 * height, 0.357142 * width, 0, TWO_PI, false)
    const lightGreenEffectFill = ctx.createRadialGradient(
      0.5 * width,
      0.809352 * height,
      0,
      0.5 * width,
      0.809352 * height,
      0.362244 * width
    )
    lightGreenEffectFill.addColorStop(0, '#000000')
    lightGreenEffectFill.addColorStop(0.88, '#000000')
    lightGreenEffectFill.addColorStop(0.95, 'rgb(94, 94, 94)')
    lightGreenEffectFill.addColorStop(1, '#010101')
    ctx.fillStyle = lightGreenEffectFill
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(0.5 * width, 0.809352 * height, 0.357142 * width, 0, TWO_PI, false)
    const lightGreenInnerShadowFill = ctx.createLinearGradient(0, 0.68705 * height, 0, 0.917266 * height)
    lightGreenInnerShadowFill.addColorStop(0, '#000000')
    lightGreenInnerShadowFill.addColorStop(1, 'rgba(1, 1, 1, 0)')
    ctx.fillStyle = lightGreenInnerShadowFill
    ctx.fill()
    ctx.restore()
    ctx.restore()
  }

  const drawGreenOn = function (ctx) {
    ctx.save()

    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(0.5 * width, 0.809352 * height, 0.32653 * width, 0, TWO_PI, false)
    const greenOnFill = ctx.createRadialGradient(
      0.5 * width,
      0.809352 * height,
      0,
      0.5 * width,
      0.809352 * height,
      0.32653 * width
    )
    greenOnFill.addColorStop(0, 'rgb(85, 185, 123)')
    greenOnFill.addColorStop(1, 'rgb(0, 31, 0)')
    ctx.fillStyle = greenOnFill
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0, 0.812949 * height)
    ctx.bezierCurveTo(
      0,
      0.910071 * height,
      0.224489 * width,
      0.989208 * height,
      0.5 * width,
      0.989208 * height
    )
    ctx.bezierCurveTo(
      0.77551 * width,
      0.989208 * height,
      width,
      0.910071 * height,
      width,
      0.809352 * height
    )
    ctx.bezierCurveTo(
      0.908163 * width,
      0.751798 * height,
      0.704081 * width,
      0.68705 * height,
      0.5 * width,
      0.68705 * height
    )
    ctx.bezierCurveTo(
      0.285714 * width,
      0.68705 * height,
      0.081632 * width,
      0.751798 * height,
      0,
      0.812949 * height
    )
    ctx.closePath()
    const greenOnGlowFill = ctx.createRadialGradient(
      0.5 * width,
      0.809352 * height,
      0,
      0.5 * width,
      0.809352 * height,
      0.515306 * width
    )
    greenOnGlowFill.addColorStop(0, 'rgb(65, 187, 126)')
    greenOnGlowFill.addColorStop(1, 'rgba(4, 37, 8, 0)')
    ctx.fillStyle = greenOnGlowFill
    ctx.fill()
    ctx.restore()
    ctx.restore()
  }

  const drawGreenOff = function (ctx) {
    ctx.save()

    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(
      0.5 * width,
      0.809352 * height,
      0.32653 * width,
      0,
      TWO_PI,
      false
    )
    const greenOffFill = ctx.createRadialGradient(
      0.5 * width,
      0.809352 * height,
      0,
      0.5 * width,
      0.809352 * height,
      0.32653 * width
    )
    greenOffFill.addColorStop(0, 'rgba(0, 255, 0, 0.25)')
    greenOffFill.addColorStop(1, 'rgba(0, 255, 0, 0.05)')
    ctx.fillStyle = greenOffFill
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(
      0.5 * width,
      0.809352 * height,
      0.32653 * width,
      0,
      TWO_PI,
      false
    )
    const greenOffInnerShadowFill = ctx.createRadialGradient(
      0.5 * width,
      0.809352 * height,
      0,
      0.5 * width,
      0.809352 * height,
      0.32653 * width
    )
    greenOffInnerShadowFill.addColorStop(0, 'rgba(1, 1, 1, 0)')
    greenOffInnerShadowFill.addColorStop(0.55, 'rgba(0, 0, 0, 0)')
    greenOffInnerShadowFill.addColorStop(0.5501, 'rgba(0, 0, 0, 0)')
    greenOffInnerShadowFill.addColorStop(0.78, 'rgba(0, 0, 0, 0.12)')
    greenOffInnerShadowFill.addColorStop(0.79, 'rgba(0, 0, 0, 0.12)')
    greenOffInnerShadowFill.addColorStop(1, 'rgba(0, 0, 0, 0.5)')
    ctx.fillStyle = greenOffInnerShadowFill
    ctx.fill()
    ctx.restore()

    ctx.fillStyle = ctx.createPattern(hatchBuffer, 'repeat')
    ctx.fill()

    ctx.restore()
  }

  const drawLightYellow = function (ctx) {
    ctx.save()

    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(
      0.5 * width,
      0.496402 * height,
      0.397959 * width,
      0,
      TWO_PI,
      false
    )
    const lightYellowFrameFill = ctx.createLinearGradient(
      0,
      0.356115 * height,
      0,
      0.63669 * height
    )
    lightYellowFrameFill.addColorStop(0, '#ffffff')
    lightYellowFrameFill.addColorStop(0.05, 'rgb(204, 204, 204)')
    lightYellowFrameFill.addColorStop(0.1, 'rgb(153, 153, 153)')
    lightYellowFrameFill.addColorStop(0.17, '#666666')
    lightYellowFrameFill.addColorStop(0.27, '#333333')
    lightYellowFrameFill.addColorStop(1, '#010101')
    ctx.fillStyle = lightYellowFrameFill
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.scale(1.083333, 1)
    ctx.beginPath()
    ctx.arc(
      0.461538 * width,
      0.507194 * height,
      0.367346 * width,
      0,
      TWO_PI,
      false
    )
    const lightYellowInnerFill = ctx.createLinearGradient(
      0,
      0.377697 * height,
      0,
      0.63669 * height
    )
    lightYellowInnerFill.addColorStop(0, '#000000')
    lightYellowInnerFill.addColorStop(0.35, '#040404')
    lightYellowInnerFill.addColorStop(0.66, '#000000')
    lightYellowInnerFill.addColorStop(1, '#010101')
    ctx.fillStyle = lightYellowInnerFill
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(
      0.5 * width,
      0.5 * height,
      0.357142 * width,
      0,
      TWO_PI,
      false
    )
    const lightYellowEffectFill = ctx.createRadialGradient(
      0.5 * width,
      0.5 * height,
      0,
      0.5 * width,
      0.5 * height,
      0.362244 * width
    )
    lightYellowEffectFill.addColorStop(0, '#000000')
    lightYellowEffectFill.addColorStop(0.88, '#000000')
    lightYellowEffectFill.addColorStop(0.95, '#5e5e5e')
    lightYellowEffectFill.addColorStop(1, '#010101')
    ctx.fillStyle = lightYellowEffectFill
    ctx.fill()
    ctx.restore()

    // lIGHT_YELLOW_4_E_INNER_SHADOW_3_4
    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(
      0.5 * width,
      0.5 * height,
      0.357142 * width,
      0,
      TWO_PI,
      false
    )
    const lightYellowInnerShadowFill = ctx.createLinearGradient(
      0,
      0.377697 * height,
      0,
      0.607913 * height
    )
    lightYellowInnerShadowFill.addColorStop(0, '#000000')
    lightYellowInnerShadowFill.addColorStop(1, 'rgba(1, 1, 1, 0)')
    ctx.fillStyle = lightYellowInnerShadowFill
    ctx.fill()
    ctx.restore()
    ctx.restore()
  }

  const drawYellowOn = function (ctx) {
    ctx.save()

    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(
      0.5 * width,
      0.5 * height,
      0.32653 * width,
      0,
      TWO_PI,
      false
    )
    const yellowOnFill = ctx.createRadialGradient(
      0.5 * width,
      0.5 * height,
      0,
      0.5 * width,
      0.5 * height,
      0.32653 * width
    )
    yellowOnFill.addColorStop(0, '#fed434')
    yellowOnFill.addColorStop(1, '#82330c')
    ctx.fillStyle = yellowOnFill
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0, 0.503597 * height)
    ctx.bezierCurveTo(
      0,
      0.600719 * height,
      0.224489 * width,
      0.679856 * height,
      0.5 * width,
      0.679856 * height
    )
    ctx.bezierCurveTo(
      0.77551 * width,
      0.679856 * height,
      width,
      0.600719 * height,
      width,
      0.5 * height
    )
    ctx.bezierCurveTo(
      0.908163 * width,
      0.442446 * height,
      0.704081 * width,
      0.377697 * height,
      0.5 * width,
      0.377697 * height
    )
    ctx.bezierCurveTo(
      0.285714 * width,
      0.377697 * height,
      0.081632 * width,
      0.442446 * height,
      0,
      0.503597 * height
    )
    ctx.closePath()
    const yellowOnGlowFill = ctx.createRadialGradient(
      0.5 * width,
      0.5 * height,
      0,
      0.5 * width,
      0.5 * height,
      0.515306 * width
    )
    yellowOnGlowFill.addColorStop(0, '#fed434')
    yellowOnGlowFill.addColorStop(1, 'rgba(130, 51, 12, 0)')
    ctx.fillStyle = yellowOnGlowFill
    ctx.fill()
    ctx.restore()
    ctx.restore()
  }

  const drawYellowOff = function (ctx) {
    ctx.save()

    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(
      0.5 * width,
      0.5 * height,
      0.32653 * width,
      0,
      TWO_PI,
      false
    )
    const yellowOffFill = ctx.createRadialGradient(
      0.5 * width,
      0.5 * height,
      0,
      0.5 * width,
      0.5 * height,
      0.32653 * width
    )
    yellowOffFill.addColorStop(0, 'rgba(255, 255, 0, 0.25)')
    yellowOffFill.addColorStop(1, 'rgba(255, 255, 0, 0.05)')
    ctx.fillStyle = yellowOffFill
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(
      0.5 * width,
      0.5 * height,
      0.32653 * width,
      0,
      TWO_PI,
      false
    )
    const yellowOffInnerShadowFill = ctx.createRadialGradient(
      0.5 * width,
      0.5 * height,
      0,
      0.5 * width,
      0.5 * height,
      0.32653 * width
    )
    yellowOffInnerShadowFill.addColorStop(0, 'rgba(1, 1, 1, 0)')
    yellowOffInnerShadowFill.addColorStop(0.55, 'rgba(0, 0, 0, 0)')
    yellowOffInnerShadowFill.addColorStop(0.5501, 'rgba(0, 0, 0, 0)')
    yellowOffInnerShadowFill.addColorStop(0.78, 'rgba(0, 0, 0, 0.12)')
    yellowOffInnerShadowFill.addColorStop(0.79, 'rgba(0, 0, 0, 0.13)')
    yellowOffInnerShadowFill.addColorStop(1, 'rgba(0, 0, 0, 0.5)')
    ctx.fillStyle = yellowOffInnerShadowFill
    ctx.fill()
    ctx.restore()

    ctx.fillStyle = ctx.createPattern(hatchBuffer, 'repeat')
    ctx.fill()

    ctx.restore()
  }

  const drawLightRed = function (ctx) {
    ctx.save()

    // lIGHT_RED_7_E_FRAME_0_1
    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(
      0.5 * width,
      0.18705 * height,
      0.397959 * width,
      0,
      TWO_PI,
      false
    )
    const lightRedFrameFill = ctx.createLinearGradient(
      0.5 * width,
      0.046762 * height,
      0.5 * width,
      0.327338 * height
    )
    lightRedFrameFill.addColorStop(0, '#ffffff')
    lightRedFrameFill.addColorStop(0.05, '#cccccc')
    lightRedFrameFill.addColorStop(0.1, '#999999')
    lightRedFrameFill.addColorStop(0.17, '#666666')
    lightRedFrameFill.addColorStop(0.27, '#333333')
    lightRedFrameFill.addColorStop(1, '#010101')
    ctx.fillStyle = lightRedFrameFill
    ctx.fill()
    ctx.restore()

    // lIGHT_RED_7_E_INNER_CLIP_1_2
    ctx.save()
    ctx.scale(1.083333, 1)
    ctx.beginPath()
    ctx.arc(
      0.461538 * width,
      0.197841 * height,
      0.367346 * width,
      0,
      TWO_PI,
      false
    )
    const lightRedInnerFill = ctx.createLinearGradient(
      0.5 * width,
      0.068345 * height,
      0.5 * width,
      0.327338 * height
    )
    lightRedInnerFill.addColorStop(0, '#000000')
    lightRedInnerFill.addColorStop(0.35, '#040404')
    lightRedInnerFill.addColorStop(0.66, '#000000')
    lightRedInnerFill.addColorStop(1, '#010101')
    ctx.fillStyle = lightRedInnerFill
    ctx.fill()
    ctx.restore()

    // lIGHT_RED_7_E_LIGHT_EFFECT_2_3
    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(
      0.5 * width,
      0.190647 * height,
      0.357142 * width,
      0,
      TWO_PI,
      false
    )
    const lightRedEffectFill = ctx.createRadialGradient(
      0.5 * width,
      0.190647 * height,
      0,
      0.5 * width,
      0.190647 * height,
      0.362244 * width
    )
    lightRedEffectFill.addColorStop(0, '#000000')
    lightRedEffectFill.addColorStop(0.88, '#000000')
    lightRedEffectFill.addColorStop(0.95, '#5e5e5e')
    lightRedEffectFill.addColorStop(1, '#010101')
    ctx.fillStyle = lightRedEffectFill
    ctx.fill()
    ctx.restore()

    // lIGHT_RED_7_E_INNER_SHADOW_3_4
    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(
      0.5 * width,
      0.190647 * height,
      0.357142 * width,
      0,
      TWO_PI,
      false
    )
    const lightRedInnerShadowFill = ctx.createLinearGradient(
      0.5 * width,
      0.068345 * height,
      0.5 * width,
      0.298561 * height
    )
    lightRedInnerShadowFill.addColorStop(0, '#000000')
    lightRedInnerShadowFill.addColorStop(1, 'rgba(1, 1, 1, 0)')
    ctx.fillStyle = lightRedInnerShadowFill
    ctx.fill()
    ctx.restore()
    ctx.restore()
  }

  const drawRedOn = function (ctx) {
    ctx.save()

    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(
      0.5 * width,
      0.190647 * height,
      0.32653 * width,
      0,
      TWO_PI,
      false
    )
    const redOnFill = ctx.createRadialGradient(
      0.5 * width,
      0.190647 * height,
      0,
      0.5 * width,
      0.190647 * height,
      0.32653 * width
    )
    redOnFill.addColorStop(0, '#ff0000')
    redOnFill.addColorStop(1, '#410004')
    ctx.fillStyle = redOnFill
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0, 0.194244 * height)
    ctx.bezierCurveTo(
      0,
      0.291366 * height,
      0.224489 * width,
      0.370503 * height,
      0.5 * width,
      0.370503 * height
    )
    ctx.bezierCurveTo(
      0.77551 * width,
      0.370503 * height,
      width,
      0.291366 * height,
      width,
      0.190647 * height
    )
    ctx.bezierCurveTo(
      0.908163 * width,
      0.133093 * height,
      0.704081 * width,
      0.068345 * height,
      0.5 * width,
      0.068345 * height
    )
    ctx.bezierCurveTo(
      0.285714 * width,
      0.068345 * height,
      0.081632 * width,
      0.133093 * height,
      0,
      0.194244 * height
    )
    ctx.closePath()
    const redOnGlowFill = ctx.createRadialGradient(
      0.5 * width,
      0.190647 * height,
      0,
      0.5 * width,
      0.190647 * height,
      0.515306 * width
    )
    redOnGlowFill.addColorStop(0, '#ff0000')
    redOnGlowFill.addColorStop(1, 'rgba(118, 5, 1, 0)')
    ctx.fillStyle = redOnGlowFill
    ctx.fill()
    ctx.restore()

    ctx.restore()
  }

  const drawRedOff = function (ctx) {
    ctx.save()

    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(
      0.5 * width,
      0.190647 * height,
      0.32653 * width,
      0,
      TWO_PI,
      false
    )
    const redOffFill = ctx.createRadialGradient(
      0.5 * width,
      0.190647 * height,
      0,
      0.5 * width,
      0.190647 * height,
      0.32653 * width
    )
    redOffFill.addColorStop(0, 'rgba(255, 0, 0, 0.25)')
    redOffFill.addColorStop(1, 'rgba(255, 0, 0, 0.05)')
    ctx.fillStyle = redOffFill
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.scale(1, 1)
    ctx.beginPath()
    ctx.arc(
      0.5 * width,
      0.190647 * height,
      0.32653 * width,
      0,
      TWO_PI,
      false
    )
    const redOffInnerShadowFill = ctx.createRadialGradient(
      0.5 * width,
      0.190647 * height,
      0,
      0.5 * width,
      0.190647 * height,
      0.32653 * width
    )
    redOffInnerShadowFill.addColorStop(0, 'rgba(1, 1, 1, 0)')
    redOffInnerShadowFill.addColorStop(0.55, 'rgba(0, 0, 0, 0)')
    redOffInnerShadowFill.addColorStop(0.5501, 'rgba(0, 0, 0, 0)')
    redOffInnerShadowFill.addColorStop(0.78, 'rgba(0, 0, 0, 0.12)')
    redOffInnerShadowFill.addColorStop(0.79, 'rgba(0, 0, 0, 0.13)')
    redOffInnerShadowFill.addColorStop(1, 'rgba(0, 0, 0, 0.5)')
    ctx.fillStyle = redOffInnerShadowFill
    ctx.fill()
    ctx.restore()

    ctx.fillStyle = ctx.createPattern(hatchBuffer, 'repeat')
    ctx.fill()

    ctx.restore()
  }

  const init = function () {
    // Housing
    drawHousing(housingCtx)
    drawLightGreen(housingCtx)
    drawLightYellow(housingCtx)
    drawLightRed(housingCtx)

    // Lights Off
    drawGreenOff(offLightsCtx)
    drawYellowOff(offLightsCtx)
    drawRedOff(offLightsCtx)

    // Lights On
    drawGreenOn(greenOnCtx)
    drawYellowOn(yellowOnCtx)
    drawRedOn(redOnCtx)

    initialized = true
  }

  // **********  PUBLIC METHODS  **********
  this.isRedOn = function () {
    return redOn
  }

  this.setRedOn = function (on) {
    redOn = !!on
    this.repaint()
  }

  this.isYellowOn = function () {
    return yellowOn
  }

  this.setYellowOn = function (on) {
    yellowOn = !!on
    this.repaint()
  }

  this.isGreenOn = function () {
    return greenOn
  }

  this.setGreenOn = function (on) {
    greenOn = !!on
    this.repaint()
  }

  this.repaint = function () {
    if (!initialized) {
      init()
    }

    mainCtx.save()
    mainCtx.clearRect(0, 0, mainCtx.canvas.width, mainCtx.canvas.height)

    // housing
    mainCtx.drawImage(housingBuffer, 0, 0)

    // Green Light On
    if (greenOn) {
      mainCtx.drawImage(greenOnBuffer, 0, 0)
    }

    // Yellow Light On
    if (yellowOn) {
      mainCtx.drawImage(yellowOnBuffer, 0, 0)
    }

    // Red Light On
    if (redOn) {
      mainCtx.drawImage(redOnBuffer, 0, 0)
    }

    // Lights Off
    mainCtx.drawImage(offLightsBuffer, 0, 0)

    mainCtx.restore()
  }

  // Visualize the component
  this.repaint()

  return this
}
