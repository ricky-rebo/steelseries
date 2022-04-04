// TODO add polyfills
// Path2D
// Array.prototype.includes
// Array.prototype.find
// Array.prototype.every

// import Radial from './Radial'
import RadialBargraph from './RadialBargraph'
import RadialVertical from './RadialVertical'
// import Linear from './Linear'
// import LinearBargraph from './LinearBargraph'
import WindDirection from './WindDirection'
import StopWatch from './StopWatch'
// import Trafficlight from './TrafficLight'

import drawFrame from './tools/drawFrame'
import drawBackground from './tools/drawBackground'
import drawForeground from './tools/drawForeground'

// Direct export
export { Altimeter } from './Altimeter'
export { Battery } from './Battery'
export { Clock } from './Clock'
export { Compass } from './Compass'
export { DisplayMulti } from './DisplayMulti'
export { DisplaySingle } from './DisplaySingle'
export { Horizon } from './Horizon'
export { Led } from './Led'
export { Level } from './Level'
export { Lightbulb as LightBulb } from './LightBulb'
export { Linear } from './Linear'
export { LinearBargraph } from './LinearBargraph'
export { Odometer } from './Odometer'
export { Radial } from './Radial'
export { Trafficlight as TrafficLight } from './TrafficLight'

export {
  rgbaColor,
  ConicalGradient,
  gradientWrapper,
  setAlpha,
  getColorFromFraction,
  Section
} from './tools/tools'

export {
  BackgroundColor,
  LcdColor,
  ColorDef,
  LedColor,
  GaugeType,
  Orientation,
  KnobType,
  KnobStyle,
  FrameDesign,
  PointerType,
  ForegroundType,
  LabelNumberFormat,
  TickLabelOrientation,
  TrendState
} from './tools/definitions'

// export { Radial }
export { RadialBargraph }
export { RadialVertical }
// export { Linear }
// export { LinearBargraph }
// export { DisplaySingle }
// export { DisplayMulti }
// export { Level }
// export { Compass }
export { WindDirection }
// export { Horizon }
// export { Led }
// export { Clock }
// export { Battery }
export { StopWatch }
// export { Altimeter }
// export { Lightbulb as LightBulb }
// export { Odometer }

// Images
export { drawFrame }
export { drawBackground }
export { drawForeground }
