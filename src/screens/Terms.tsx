import {StyleSheet, View, ScrollView} from 'react-native'
import React from 'react'

import {Separator} from '#/components/utils/Views'
import {data, spacing} from '#/utils/theme'
import {Text} from '#/components/Typography'
import {atoms as a} from '#/theme'
import Markdown from 'react-native-markdown-display'
import {termsMarkdown} from '#/lib/markdown/terms'
import {text} from '@fortawesome/fontawesome-svg-core'

export function TermsScreen() {
  const {terms} = data
  return (
    <ScrollView style={styles.container}>
      <Text style={[a.text_lg, a.font_bold, {paddingVertical: 10}]}>
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

      <Text style={[a.text_sm, {fontWeight: '400', textAlign: 'justify'}]}>
        Welcome to Kumpooni, your one-stop shop for finding reliable car care
        services! These Terms & Conditions establish a friendly agreement
        between you and Auto-Mate Solutions Inc. ("Company"). By using the
        Kumpooni app ("App"), you agree to these terms.
      </Text>
      <Markdown
        style={{
          text: {
            color: '#000',
          },
          bullet_list: {
            fontSize: 14,
            color: '#000',
            marginTop: -5,
          },
          bullet_list_icon: {
            fontSize: 16,
            fontWeight: 'bold',
          },
        }}>
        {termsMarkdown}
      </Markdown>
      {/* 
      <View style={{gap: 5, marginTop: 10, paddingBottom: 20}}>
        {terms.map(({title, text}, index) => (
          <View key={`terms-title-${index}`} style={{marginVertical: 5}}>
            {!!title && (
              <Text style={[a.font_bold, {marginBottom: 10}]}>{title}</Text>
            )}
            {!!text && <Text style={[{fontWeight: '400'}]}>{text}</Text>}
          </View>
        ))}
      </View> */}
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
