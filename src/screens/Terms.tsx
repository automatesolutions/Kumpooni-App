import { StyleSheet, View, ScrollView } from 'react-native'
import React from 'react'

import { Separator } from '#/components/utils/Views'
import { data, spacing } from '#/utils/theme'
import { Text } from '#/components/Typography'
import { atoms as a } from '#/theme'

export function TermsScreen() {
  const { terms } = data
  return (
    <ScrollView style={styles.container}>
      <Text style={[a.text_lg, a.font_bold, { paddingVertical: 10 }]}>
        Terms & Conditions
      </Text>
      <Separator
        style={{
          width: 80,
          marginTop: 5,
          marginBottom: 15,
          height: 4,
          backgroundColor: '#000',
        }}
      />
      <Text style={[a.text_2xs, { fontWeight: '400' }]}>
        These terms and conditions constitute a legally binding agreement
        between you and Auto-Mate Services Inc. Auto-Mate, governing your use of
        the Auto-Mate car service mobile application.
      </Text>

      <View style={{ gap: 5, marginTop: 10, paddingBottom: 20 }}>
        {terms.map(({ title, text }, index) => (
          <View key={`terms-title-${index}`} style={{ marginVertical: 5 }}>
            {!!title && (
              <Text style={[a.font_bold, { marginBottom: 10 }]}>{title}</Text>
            )}
            {!!text && <Text style={[{ fontWeight: '400' }]}>{text}</Text>}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: spacing.medium,
  },
})
