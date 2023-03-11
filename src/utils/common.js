export const coalesce = function (prop, _default = undefined) {
  return prop !== undefined ? prop : _default
}

export function setAlpha (hex, alpha) {
  const hexColor = hex.charAt(0) === '#' ? hex.substring(1, 7) : hex
  const red = parseInt(hexColor.substring(0, 2), 16)
  const green = parseInt(hexColor.substring(2, 4), 16)
  const blue = parseInt(hexColor.substring(4, 6), 16)
  const color = 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')'

  return color
}

export function Section (start, stop, color) {
  return {
    start: start,
    stop: stop,
    color: color
  }
}

export function calcNiceNumber (range, round) {
  const exponent = Math.floor(Math.log10(range)) // exponent of range
  const fraction = range / Math.pow(10, exponent) // fractional part of range
  let niceFraction // nice, rounded fraction

  if (round) {
    if (fraction < 1.5) {
      niceFraction = 1
    } else if (fraction < 3) {
      niceFraction = 2
    } else if (fraction < 7) {
      niceFraction = 5
    } else {
      niceFraction = 10
    }
  } else {
    if (fraction <= 1) {
      niceFraction = 1
    } else if (fraction <= 2) {
      niceFraction = 2
    } else if (fraction <= 5) {
      niceFraction = 5
    } else {
      niceFraction = 10
    }
  }
  return niceFraction * Math.pow(10, exponent)
}

export function roundedRectangle (ctx, x, y, w, h, radius) {
  const r = x + w
  const b = y + h
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(r - radius, y)
  ctx.quadraticCurveTo(r, y, r, y + radius)
  ctx.lineTo(r, y + h - radius)
  ctx.quadraticCurveTo(r, b, r - radius, b)
  ctx.lineTo(x + radius, b)
  ctx.quadraticCurveTo(x, b, x, b - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
  //        ctx.stroke();
}

export function createAudioElement (audioSrc) {
  audioSrc = audioSrc || ''

  if (audioSrc === '') {
    return null
  }

  const audioElement = document.createElement('audio')
  audioElement.setAttribute('src', audioSrc)
  audioElement.setAttribute('preload', 'auto')
  return audioElement
}

export function createBuffer (width, height) {
  const buffer = document.createElement('canvas')
  buffer.width = width
  buffer.height = height
  return buffer
}

export function drawToBuffer (width, height, drawFunction) {
  const buffer = document.createElement('canvas')
  buffer.width = width
  buffer.height = height
  drawFunction(buffer.getContext('2d'))
  return buffer
}

export function getColorValues (color) {
  const lookupBuffer = drawToBuffer(1, 1, function (ctx) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.rect(0, 0, 1, 1)
    ctx.fill()
  })
  const colorData = lookupBuffer.getContext('2d').getImageData(0, 0, 2, 2).data

  return [colorData[0], colorData[1], colorData[2], colorData[3]]
}

export function rgbToHsl (red, green, blue) {
  let hue
  let saturation
  let delta

  red /= 255
  green /= 255
  blue /= 255

  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2

  if (max === min) {
    hue = saturation = 0 // achromatic
  } else {
    delta = max - min
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
    switch (max) {
      case red:
        hue = (green - blue) / delta + (green < blue ? 6 : 0)
        break
      case green:
        hue = (blue - red) / delta + 2
        break
      case blue:
        hue = (red - green) / delta + 4
        break
    }
    hue /= 6
  }
  return [hue, saturation, lightness]
}

export function hsbToRgb (hue, saturation, brightness) {
  let r
  let g
  let b
  const i = Math.floor(hue * 6)
  const f = hue * 6 - i
  const p = brightness * (1 - saturation)
  const q = brightness * (1 - f * saturation)
  const t = brightness * (1 - (1 - f) * saturation)

  switch (i % 6) {
    case 0:
      r = brightness
      g = t
      b = p
      break
    case 1:
      r = q
      g = brightness
      b = p
      break
    case 2:
      r = p
      g = brightness
      b = t
      break
    case 3:
      r = p
      g = q
      b = brightness
      break
    case 4:
      r = t
      g = p
      b = brightness
      break
    case 5:
      r = brightness
      g = p
      b = q
      break
  }

  return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)]
}

export function rgbToHsb (r, g, b) {
  let hue

  r = r / 255
  g = g / 255
  b = b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const brightness = max
  const delta = max - min
  const saturation = max === 0 ? 0 : delta / max

  if (max === min) {
    hue = 0 // achromatic
  } else {
    switch (max) {
      case r:
        hue = (g - b) / delta + (g < b ? 6 : 0)
        break
      case g:
        hue = (b - r) / delta + 2
        break
      case b:
        hue = (r - g) / delta + 4
        break
    }
    hue /= 6
  }
  return [hue, saturation, brightness]
}

export function setInRange (value, min, max) {
  return value < min ? min : value > max ? max : value
}

export function wrap (value, lower, upper) {
  if (upper <= lower) {
    throw new Error('Rotary bounds are of negative or zero size')
  }

  const distance = upper - lower
  const times = Math.floor((value - lower) / distance)

  return value - times * distance
}

export function getShortestAngle (from, to) {
  return wrap(to - from, -180, 180)
}

// shim layer
export const requestAnimFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 16)
    }
  )
})()

export function getCanvasContext (elementOrId) {
  const element =
    typeof elementOrId === 'string' || elementOrId instanceof String
      ? document.getElementById(elementOrId)
      : elementOrId
  return element.getContext('2d')
}
