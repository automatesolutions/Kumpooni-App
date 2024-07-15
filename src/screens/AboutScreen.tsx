import React from 'react'
import { Image, Linking, ScrollView, StyleSheet, View } from 'react-native'

import { colors, spacing } from '#/utils/theme'
import { Separator } from '#/components/utils/Views'
import { Text } from '#/components/Typography'
import { atoms as a } from '#/theme'

export function AboutScreen() {
  return (
    <ScrollView style={styles.container}>
      <Image
        source={require('#/assets/images/about-bg.png')}
        resizeMode="cover"
        style={{
          marginTop: spacing.small,
          marginBottom: spacing.medium,
          width: '100%',
          height: 240,
        }}
      />
      <Text style={[a.text_lg, a.font_bold, { paddingVertical: 10 }]}>
        About Us:
      </Text>
      <Separator
        style={{
          width: 60,
          marginVertical: 10,
          height: 4,
          backgroundColor: '#000',
        }}
      />
      <View style={{ marginBottom: 20 }}>
        <Text style={[a.text_xs, styles.paragraph]}>
          Auto-Mate Solutions Inc., a company that specializes in developing
          innovative services to assist vehicle and car owners in the
          Philippines.
        </Text>
        <Text style={[a.text_xs, styles.paragraph]}>
          In a highly competitive vehicle service and parts industry in the
          Philippines with an annual worth of 10 billion dollars, we are setting
          ourselves apart by offering easy access to our services through a
          mobile app. While our service is similar to that of large-scale
          service centers and recovery services, we are trailblazers in the
          Philippines when it comes to providing convenient and accessible
          solutions for our customers.
        </Text>
        <Text style={[a.text_xs, styles.paragraph]}>
          Currently, we possess a local Service Center and an Area for
          Refurbishment Production which was established in 2019 through
          bootstrapping. This was done to provide a suitable testing ground for
          our Mobile App, not only to maximize its functions but also to assess
          its business viability. Additionally, during the course of App
          development, we have generated cash flow from local sales of services,
          parts, and vehicles to sustain operation.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.medium,
  },
  paragraph: { marginVertical: 10, textAlign: 'justify', fontWeight: '400' },
})
