// TODO add polyfills
// Path2D
// Array.prototype.includes
// Array.prototype.find
// Array.prototype.every

import Radial from './Radial'
import RadialBargraph from './RadialBargraph'
import RadialVertical from './RadialVertical'
// import Linear from './Linear'
// import LinearBargraph from './LinearBargraph'
import WindDirection from './WindDirection'
import StopWatch from './StopWatch'
import TrafficLight from './TrafficLight'
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

// DEBUG
export { Radial as Radial2 } from './Radial_2'

export { Radial }
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
export { TrafficLight }
// export { Lightbulb as LightBulb }
// export { Odometer }

// Images
export { drawFrame }
export { drawBackground }
export { drawForeground }

// Tools
// export { rgbaColor }
// export { ConicalGradient }
// export { setAlpha }
// export { getColorFromFraction }
// export { gradientWrapper }

// Constants
// export { BackgroundColor }
// export { LcdColor }
// export { ColorDef }
// export { LedColor }
// export { GaugeType }
// export { Orientation }
// export { FrameDesign }
// export { PointerType }
// export { ForegroundType }
// export { KnobType }
// export { KnobStyle }
// export { LabelNumberFormat }
// export { TickLabelOrientation }
// export { TrendState }

// Other
// export { Section }
