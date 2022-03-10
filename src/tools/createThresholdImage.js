import { createBuffer } from './tools'

const createThresholdImage = function (width, height, radial, vertical) {
  const cacheKey = width.toString() + height.toString() + radial + vertical

  if (!createThresholdImage.cache[cacheKey]) {
    const buffer = createBuffer(width, height)
    const ctx = buffer.getContext('2d')

    ctx.save()

    const gradient = ctx.createLinearGradient(0, 0.1, 0, height * 0.9)
    gradient.addColorStop(0, '#520000')
    gradient.addColorStop(0.3, '#fc1d00')
    gradient.addColorStop(0.59, '#fc1d00')
    gradient.addColorStop(1, '#520000')
    ctx.fillStyle = gradient

    if (radial) { // Radial Gauge case
      ctx.beginPath()
      ctx.moveTo(width * 0.5, 0.1)
      ctx.lineTo(width * 0.9, height * 0.9)
      ctx.lineTo(width * 0.1, height * 0.9)
      ctx.lineTo(width * 0.5, 0.1)
      ctx.closePath()
    } else if (vertical) { // Linear Vertical Gauge case
      ctx.beginPath()
      ctx.moveTo(0.1, height * 0.5)
      ctx.lineTo(width * 0.9, 0.1)
      ctx.lineTo(width * 0.9, height * 0.9)
      ctx.closePath()
    } else { // Linear Horizontal Gauge case
      ctx.beginPath()
      ctx.moveTo(0.1, 0.1)
      ctx.lineTo(width * 0.9, 0.1)
      ctx.lineTo(width * 0.5, height * 0.9)
      ctx.closePath()
    }
    ctx.fill()

    ctx.strokeStyle = '#FFFFFF'
    ctx.stroke()

    ctx.restore()

    // cache the buffer
    createThresholdImage.cache[cacheKey] = buffer
  }

  return createThresholdImage.cache[cacheKey]
}
createThresholdImage.cache = {}

export default createThresholdImage
