import React from 'react';
import {Dimensions} from 'react-native';

const MIN_STORE_HEIGHT = 100;

export function useInitialNumToRender(
  minItemHeight: number = MIN_STORE_HEIGHT,
) {
  return React.useMemo(() => {
    const screenHeight = Dimensions.get('window').height;
    return Math.ceil(screenHeight / minItemHeight) + 1;
  }, [minItemHeight]);
}
