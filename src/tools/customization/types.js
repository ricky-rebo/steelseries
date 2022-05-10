import {
  GaugeTypeDef,
  OrientationDef,
  KnobTypeDef,
  KnobStyleDef,
  FrameDesignDef,
  PointerTypeDef,
  ForegroundTypeDef,
  LabelNumberFormatDef,
  TickLabelOrientationDef,
  TrendStateDef
} from './type-descriptors'

export const GaugeType = {
  TYPE1: new GaugeTypeDef('type1'),
  TYPE2: new GaugeTypeDef('type2'),
  TYPE3: new GaugeTypeDef('type3'),
  TYPE4: new GaugeTypeDef('type4'),
  TYPE5: new GaugeTypeDef('type5')
}

export const Orientation = {
  NORTH: new OrientationDef('north'),
  SOUTH: new OrientationDef('south'),
  EAST: new OrientationDef('east'),
  WEST: new OrientationDef('west')
}

export const KnobType = {
  STANDARD_KNOB: new KnobTypeDef('standardKnob'),
  METAL_KNOB: new KnobTypeDef('metalKnob')
}

export const KnobStyle = {
  BLACK: new KnobStyleDef('black'),
  BRASS: new KnobStyleDef('brass'),
  SILVER: new KnobStyleDef('silver')
}

export const FrameDesign = {
  BLACK_METAL: new FrameDesignDef('blackMetal'),
  METAL: new FrameDesignDef('metal'),
  SHINY_METAL: new FrameDesignDef('shinyMetal'),
  BRASS: new FrameDesignDef('brass'),
  STEEL: new FrameDesignDef('steel'),
  CHROME: new FrameDesignDef('chrome'),
  GOLD: new FrameDesignDef('gold'),
  ANTHRACITE: new FrameDesignDef('anthracite'),
  TILTED_GRAY: new FrameDesignDef('tiltedGray'),
  TILTED_BLACK: new FrameDesignDef('tiltedBlack'),
  GLOSSY_METAL: new FrameDesignDef('glossyMetal')
}

export const PointerType = {
  TYPE1: new PointerTypeDef('type1'),
  TYPE2: new PointerTypeDef('type2'),
  TYPE3: new PointerTypeDef('type3'),
  TYPE4: new PointerTypeDef('type4'),
  TYPE5: new PointerTypeDef('type5'),
  TYPE6: new PointerTypeDef('type6'),
  TYPE7: new PointerTypeDef('type7'),
  TYPE8: new PointerTypeDef('type8'),
  TYPE9: new PointerTypeDef('type9'),
  TYPE10: new PointerTypeDef('type10'),
  TYPE11: new PointerTypeDef('type11'),
  TYPE12: new PointerTypeDef('type12'),
  TYPE13: new PointerTypeDef('type13'),
  TYPE14: new PointerTypeDef('type14'),
  TYPE15: new PointerTypeDef('type15'),
  TYPE16: new PointerTypeDef('type16')
}

export const ForegroundType = {
  TYPE1: new ForegroundTypeDef('type1'),
  TYPE2: new ForegroundTypeDef('type2'),
  TYPE3: new ForegroundTypeDef('type3'),
  TYPE4: new ForegroundTypeDef('type4'),
  TYPE5: new ForegroundTypeDef('type5')
}

export const LabelNumberFormat = {
  STANDARD: new LabelNumberFormatDef('standard'),
  FRACTIONAL: new LabelNumberFormatDef('fractional'),
  SCIENTIFIC: new LabelNumberFormatDef('scientific')
}

export const TickLabelOrientation = {
  NORMAL: new TickLabelOrientationDef('normal'),
  HORIZONTAL: new TickLabelOrientationDef('horizontal'),
  TANGENT: new TickLabelOrientationDef('tangent')
}

export const TrendState = {
  UP: new TrendStateDef('up'),
  STEADY: new TrendStateDef('steady'),
  DOWN: new TrendStateDef('down'),
  OFF: new TrendStateDef('off')
}
