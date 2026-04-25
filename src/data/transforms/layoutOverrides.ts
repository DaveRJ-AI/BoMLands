export interface LayoutOverride {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  labelOffsetX?: number;
  labelOffsetY?: number;
}

export const LAYOUT_OVERRIDES: Record<string, LayoutOverride> = {
  land_northward: {
    x: 720,
    y: 40,
    width: 300,
    height: 150,
    labelOffsetY: -10
  },

  desolation: {
    x: 720,
    y: 255,
    width: 290,
    height: 145,
    labelOffsetY: -10
  },

  bountiful: {
    x: 720,
    y: 430,
    width: 180,
    height: 88,
    labelOffsetY: -14
  },

  zarahemla: {
    x: 690,
    y: 670,
    width: 235,
    height: 118,
    labelOffsetY: -12
  },

  manti: {
    x: 780,
    y: 900,
    width: 215,
    height: 126,
    labelOffsetY: -12
  },

  nephi: {
    x: 700,
    y: 1135,
    width: 260,
    height: 145,
    labelOffsetY: -12
  },

  west_sea: {
    x: 150,
    y: 650,
    width: 230,
    height: 145
  },

  east_sea: {
    x: 1250,
    y: 650,
    width: 230,
    height: 145
  },

  hermounts: {
    x: 545,
    y: 690,
    width: 135,
    height: 74,
    labelOffsetX: -8,
    labelOffsetY: -2
  },

  narrow_pass: {
    x: 735,
    y: 610,
    width: 110,
    height: 66,
    labelOffsetY: -4
  },

  zarahemla_border_wilderness: {
    x: 975,
    y: 675,
    width: 175,
    height: 92,
    labelOffsetX: 14,
    labelOffsetY: -2
  },

  southern_wilderness_route: {
    x: 1110,
    y: 980,
    width: 120,
    height: 68
  },

  sidon_headwaters_near_manti: {
    x: 800,
    y: 980,
    width: 150,
    height: 80,
    labelOffsetY: -8
  },

  morianton: {
    x: 970,
    y: 560
  },

  onidah: {
    x: 700,
    y: 790
  },

  jershon: {
    x: 970,
    y: 690
  },

  nephihah: {
    x: 690,
    y: 1060
  }
};