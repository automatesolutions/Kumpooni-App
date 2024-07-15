import React from 'react'
import { View, TouchableOpacity, Image } from 'react-native'
import { Text } from '#/components/Typography'

import { useTheme, atoms as a } from '#/theme'

import { useNavigation } from '@react-navigation/native'
import { NavigationProp } from '#/lib/routes/types'

export function EmptyStore() {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  return (
    <View
      style={{
        flex: 1,
        paddingTop: 20,
        alignItems: 'center',
        gap: 5,
      }}>
      <Image
        source={{
          uri: 'https://vheyzzpdmmyiejsxerzg.supabase.co/storage/v1/object/public/image/no_store_icon.png',
        }}
        style={{
          height: 120,
          width: 150,
          marginBottom: 5,
        }}
        resizeMode="contain"
      />
      <Text
        style={{
          textAlign: 'center',
          fontSize: 20,
          fontWeight: '900',
        }}>
        Sorry! We're not there yet
      </Text>
      <Text
        style={[
          {
            flex: 1,
            textAlign: 'center',
            fontSize: 14,
            maxWidth: '80%',
            letterSpacing: 0.3,
          },
        ]}>
        But we’re working on it! We can contact you when we get there!
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('NotifyMe')}
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 8,
          backgroundColor: '#B61616',
          width: 200,
          borderRadius: 10,
          marginBottom: 20,
        }}>
        <Text style={[a.text_2xl, a.font_bold, { color: '#fff' }]}>
          Email me
        </Text>
      </TouchableOpacity>
    </View>
  )
}
