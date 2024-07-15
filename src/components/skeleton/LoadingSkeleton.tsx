import React from 'react'
import { Dimensions, StyleSheet, View, ViewProps } from 'react-native'
import ContentLoader, { Rect } from 'react-content-loader/native'

export const LoadingSkeleton = (props: ViewProps) => {
  const { width, height } = Dimensions.get('window')

  return (
    <ContentLoader
      speed={2}
      width={width}
      height={height * 0.2}
      //   viewBox="0 0 200 124"
      backgroundColor="#f3f3f3"
      foregroundColor="#ecebeb"
      style={{ marginHorizontal: 16, borderRadius: 10 }}
      {...props}>
      <Rect width={width - 32} height={height * 0.18} y={10} rx={10} ry={10} />
    </ContentLoader>
  )
}

const styles = StyleSheet.create({})
