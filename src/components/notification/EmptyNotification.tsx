import { Image, View } from 'react-native'
import React from 'react'
import { Text } from '../Typography'
import { atoms as a } from '#/theme'
export const EmptyNotification = ({
  title,
  message,
}: {
  title: string
  message: string
}) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Image
      source={require('#/assets/images/no_notification.png')}
      style={{
        resizeMode: 'contain',
        height: 150,
        width: 150,
      }}
    />
    <View style={{ marginTop: 20, alignItems: 'center' }}>
      <Text style={[a.font_bold, { color: '#1E1E1E' }]}>{title}</Text>
      <Text style={[a.text_sm, { lineHeight: 20, color: '#1E1E1E' }]}>
        {message}
      </Text>
    </View>
  </View>
)
