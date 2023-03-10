import { doc, HALF_PI, PI } from '../../utils/constants'

const createMeasuredValueImage = function (
  size,
  indicatorColor,
  radial,
  vertical
) {
  let indicatorBuffer
  let indicatorCtx
  const cacheKey = size.toString() + indicatorColor + radial + vertical

  // check if we have already created and cached this buffer, if so return it and exit
  if (!createMeasuredValueImage.cache[cacheKey]) {
    indicatorBuffer = doc.createElement('canvas')
    indicatorCtx = indicatorBuffer.getContext('2d')
    indicatorBuffer.width = size
    indicatorBuffer.height = size
    indicatorCtx.fillStyle = indicatorColor

    const center = size / 2
    const indicator = createIndicatorPath(size)
    if (radial) {
      // indicatorCtx.beginPath()
      // indicatorCtx.moveTo(size * 0.5, size)
      // indicatorCtx.lineTo(0, 0)
      // indicatorCtx.lineTo(size, 0)
      // indicatorCtx.closePath()
      // indicatorCtx.fill()
      // indicatorCtx.translate(center, center)
      // indicatorCtx.rotate(PI)
      // indicatorCtx.translate(-center, -center)

      indicatorCtx.fill(indicator)
    } else {
      if (vertical) {
        // indicatorCtx.beginPath()
        // indicatorCtx.moveTo(size, size * 0.5)
        // indicatorCtx.lineTo(0, 0)
        // indicatorCtx.lineTo(0, size)
        // indicatorCtx.closePath()
        // indicatorCtx.fill()
        indicatorCtx.translate(center, center)
        indicatorCtx.rotate(-HALF_PI)
        indicatorCtx.translate(-center, -center)

        indicatorCtx.fill(indicator)
      } else {
        // indicatorCtx.beginPath()
        // indicatorCtx.moveTo(size * 0.5, 0)
        // indicatorCtx.lineTo(size, size)
        // indicatorCtx.lineTo(0, size)
        // indicatorCtx.closePath()

        indicatorCtx.translate(center, center)
        indicatorCtx.rotate(PI)
        indicatorCtx.translate(-center, -center)
        indicatorCtx.fill(indicator)
      }
    }
    // cache the buffer
    createMeasuredValueImage.cache[cacheKey] = indicatorBuffer
  }
  return createMeasuredValueImage.cache[cacheKey]
}
createMeasuredValueImage.cache = {}

export default createMeasuredValueImage

function createIndicatorPath (size) {
  const path = new Path2D()

  // Linear Horizontal Indicator
  // path.moveTo(size * 0.5, 0)
  // path.lineTo(size, size)
  // path.lineTo(0, size)
  // path.closePath()

  // Radial Indicator
  path.moveTo(size * 0.5, size)
  path.lineTo(0, 0)
  path.lineTo(size, 0)
  path.closePath()

  return path
}
