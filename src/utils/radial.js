import { HALF_PI, PI, TWO_PI, RAD_FACTOR } from './constants'

export function getRadialRotationParams (gaugeType) {
  let freeAreaAngle, rotationOffset, angleRange
  switch (gaugeType.type) {
    case 'type1':
      freeAreaAngle = 0
      rotationOffset = PI
      angleRange = HALF_PI
      break
    case 'type2':
      freeAreaAngle = 0
      rotationOffset = PI
      angleRange = PI
      break
    case 'type3':
      freeAreaAngle = 0
      rotationOffset = HALF_PI
      angleRange = 1.5 * PI
      break
    case 'type4':
    default:
      freeAreaAngle = 60 * RAD_FACTOR
      rotationOffset = HALF_PI + freeAreaAngle / 2
      angleRange = TWO_PI - freeAreaAngle
      break
  }
  return { angleRange, rotationOffset }
}
