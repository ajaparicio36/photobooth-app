export interface FilterPreset {
  name: string;
  description: string;
  modulate?: {
    brightness?: number;
    saturation?: number;
    hue?: number;
  };
  tint?: {
    r: number;
    g: number;
    b: number;
  };
  gamma?: number;
  linear?: {
    multiplier: number;
    offset: number;
  };
  blur?: number;
  grayscale?: boolean;
}

export const sharpPresets: Record<string, FilterPreset> = {
  vintage: {
    name: "Vintage",
    description: "Classic film look with warm tones and grain",
    modulate: {
      brightness: 0.95,
      saturation: 0.8,
      hue: 10,
    },
    tint: { r: 255, g: 245, b: 220 },
    gamma: 1.2,
    linear: { multiplier: 0.8, offset: 20 },
  },

  vscoA6: {
    name: "VSCO A6",
    description: "Clean, modern look with lifted shadows",
    modulate: {
      brightness: 1.05,
      saturation: 0.9,
      hue: -5,
    },
    linear: { multiplier: 0.9, offset: 15 },
    gamma: 1.1,
  },

  goldenHour: {
    name: "Golden Hour",
    description: "Warm, golden sunset vibes",
    modulate: {
      brightness: 1.1,
      saturation: 1.2,
      hue: 15,
    },
    tint: { r: 255, g: 230, b: 180 },
    gamma: 1.1,
  },

  coolBlue: {
    name: "Cool Blue",
    description: "Cool, moody blue tones",
    modulate: {
      brightness: 0.95,
      saturation: 1.1,
      hue: -20,
    },
    tint: { r: 200, g: 220, b: 255 },
    gamma: 1.1,
  },

  blackWhite: {
    name: "Black & White",
    description: "Classic monochrome with enhanced contrast",
    grayscale: true,
    modulate: {
      brightness: 1.05,
      saturation: 0,
    },
    linear: { multiplier: 1.2, offset: -10 },
    gamma: 1.05,
  },

  sepia: {
    name: "Sepia",
    description: "Warm brown vintage tone",
    grayscale: true,
    tint: { r: 255, g: 235, b: 205 },
    modulate: {
      brightness: 1.05,
      saturation: 0.6,
    },
    gamma: 1.1,
  },

  vibrant: {
    name: "Vibrant",
    description: "Enhanced colors and saturation",
    modulate: {
      brightness: 1.05,
      saturation: 1.4,
      hue: 5,
    },
    linear: { multiplier: 1.1, offset: 5 },
    gamma: 1.05,
  },

  dreamy: {
    name: "Dreamy",
    description: "Soft, ethereal look with lifted shadows",
    modulate: {
      brightness: 1.1,
      saturation: 0.85,
      hue: 5,
    },
    gamma: 1.3,
    linear: { multiplier: 0.85, offset: 25 },
    blur: 0.3,
  },

  cinematic: {
    name: "Cinematic",
    description: "Film-like color grading with teal and orange",
    modulate: {
      brightness: 0.98,
      saturation: 1.15,
      hue: -8,
    },
    tint: { r: 255, g: 240, b: 220 },
    linear: { multiplier: 1.05, offset: -5 },
    gamma: 1.05,
  },

  portrait: {
    name: "Portrait",
    description: "Optimized for skin tones and portraits",
    modulate: {
      brightness: 1.02,
      saturation: 0.95,
      hue: 3,
    },
    tint: { r: 255, g: 248, b: 240 },
    gamma: 1.1,
    linear: { multiplier: 0.95, offset: 8 },
  },

  food: {
    name: "Food",
    description: "Enhanced warmth and saturation for food photos",
    modulate: {
      brightness: 1.08,
      saturation: 1.25,
      hue: 8,
    },
    tint: { r: 255, g: 245, b: 230 },
    gamma: 1.05,
    linear: { multiplier: 1.05, offset: 3 },
  },

  moody: {
    name: "Moody",
    description: "Dark, atmospheric look",
    modulate: {
      brightness: 0.85,
      saturation: 1.1,
      hue: -10,
    },
    tint: { r: 240, g: 235, b: 255 },
    gamma: 1.2,
    linear: { multiplier: 1.1, offset: -15 },
  },
};
