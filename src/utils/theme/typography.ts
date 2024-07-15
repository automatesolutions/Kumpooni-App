// TODO: write documentation about fonts and typography along with guides on how to add custom fonts in own
// markdown file and add links from here

import {Platform} from 'react-native';
export const customFontsToLoad = {
  interBold: require('../../assets/fonts/Inter-Bold.ttf'),
  interMedium: require('../../assets/fonts/Inter-Medium.ttf'),
  interNormal: require('../../assets/fonts/Inter-Regular.ttf'),
  interLight: require('../../assets/fonts/Inter-Light.ttf'),
  interThin: require('../../assets/fonts/Inter-Thin.ttf'),
};
const fonts = {
  inter: {
    thin: 'Inter-Thin',
    light: 'Inter-Light',
    normal: 'Inter-Regular',
    medium: 'Inter-Medium',
    bold: 'Inter-Bold',
  },
};

export const typography = {
  /**
   * The fonts are available to use, but prefer using the semantic name.
   */
  fonts,
  /**
   * The primary font. Used in most places.
   */
  primary: fonts.inter,
  /**
   * An alternate font used for perhaps titles and stuff.
   */
  secondary: fonts.inter,
  // secondary: Platform.select({
  //   ios: fonts.gothamSsm,
  //   android: fonts.gothamSsm,
  // }),
  /**
   * Lets get fancy with a monospace font!
   */
  code: Platform.select({ios: fonts.inter, android: fonts.inter}),
};
