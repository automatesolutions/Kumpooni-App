// TODO: write documentation for colors and palette in own markdown file and add links from here

const palette = {
  almostBlack: '#030303',
  black: '#000000',
  white: 'white',

  gray: '#5e6267',

  neutral100: '#FFFFFF',
  neutral200: '#F4F2F1',
  neutral300: '#D9D9D9',
  neutral400: '#625C58',
  neutral500: '#978F8A',
  neutral600: '#625C58',
  neutral700: '#3C3836',
  neutral800: '#191015',
  neutral900: '#000000',

  primary100: '#F4E0D9',
  primary200: '#E8C1B4',
  primary300: '#DDA28E',
  primary400: '#D28468',
  primary500: '#C76542',
  primary600: '#A54F31',

  secondary100: '#DCDDE9',
  secondary200: '#BCC0D6',
  secondary300: '#9196B9',
  secondary400: '#626894',
  secondary500: '#41476E',

  accent100: '#FFEED4',
  accent200: '#FFE1B2',
  accent300: '#FDD495',
  accent400: '#FBC878',
  accent500: '#FFBB50',

  cyan50: '#ecfeff',
  cyan100: '#cffafe',
  cyan200: '#a5f3fc',
  cyan300: '#67e8f9',
  cyan400: '#22d3ee',
  cyan500: '#06b6d4',
  cyan600: '#0891b2',
  cyan700: '#0e7490',
  cyan800: '#155e75',
  cyan900: '#164e63',
  cyan950: '#083344',

  angry100: '#F2D6CD',
  angry500: '#C03403',

  overlay20: 'rgba(69, 210, 255, 0.11)',
  overlay50: 'rgba(69, 210, 255, 0.05)',
  overlay80: 'rgba(0, 0, 0, 0.5)',
} as const;

export const colors = {
  primary: '#b61616',
  black: '#000',
  white: '#fff',
  gray: palette.gray,
  green: '#41C575',
  orange: 'rgb(234 88 12)',
  gray300: '#f5f5f5',
  gray500: '#D9D9D9',
  info: '#1188CA',
  inactive: '#ccc',
  /**
   * The palette is available to use, but prefer using the name.
   * This is only included for rare, one-off cases. Try to use
   * semantic names as much as possible.
   */
  palette,
  /**
   * A helper for making something see-thru.
   */
  transparent: 'rgba(0, 0, 0, 0)',
  /**
   * The default text color in many components.
   */
  text: palette.neutral100,
  /**
   * Secondary text information.
   */
  textDim: palette.neutral600,
  /**
   * The default color of the screen background.
   */
  background: palette.white,
  /**
   * The default border color.
   */
  border: palette.neutral400,
  /**
   * The main tinting color.
   */
  tint: '#5BC6E0',
  /**
   * A subtle color used for lines.
   */
  separator: palette.cyan900, // palette.cyan800,
  /**
   * Error messages.
   */
  error: palette.angry500,
  /**
   * Error Background.
   *
   */
  errorBackground: palette.angry100,
  /**
   * Inactive color
   */
};
