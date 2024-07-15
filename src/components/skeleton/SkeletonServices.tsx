import {
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewProps,
} from 'react-native'
import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { spacing } from '#/utils/theme'

export const SkeletonServices = (props: ViewProps) => {
  const { width } = useWindowDimensions()
  return (
    <ContentLoader
      speed={2}
      width={width}
      height={85}
      //   viewBox="0 0 200 124"
      backgroundColor="#f3f3f3"
      foregroundColor="#ecebeb"
      {...props}>
      <Rect x="8" y="0" rx="4" ry="4" width="70" height="70" />
      <Rect x="90" y="8" width="200" height="12" />
      <Rect x="90" y="26" width="80" height="8" />
      <Rect x="90" y="60" width="40" height="8" />

      <Rect x="0" y="75" width={width - spacing.medium * 2} height="2" />
    </ContentLoader>
  )
}

const styles = StyleSheet.create({})
