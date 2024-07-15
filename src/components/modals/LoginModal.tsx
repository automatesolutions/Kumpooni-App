import React from 'react'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import { XCircle } from 'lucide-react-native'
import { View, Text, StyleSheet, Pressable, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NavigationProp } from '#/lib/routes/types'

export function LoginModal({ handleDismiss }: { handleDismiss: () => void }) {
  const navigation = useNavigation<NavigationProp>()

  return (
    <BottomSheetView
      style={{
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: 20,
      }}>
      <View style={{ width: '100%' }}>
        <Pressable style={{ alignSelf: 'flex-end' }} onPress={handleDismiss}>
          <XCircle size={24} color="#fff" fill="#CECECE" />
        </Pressable>
        <Image
          style={{ alignSelf: 'center' }}
          source={require('#/assets/images/logo-without-tagline.png')}
          resizeMode="contain"
        />
      </View>
      <Text
        style={{
          fontSize: 15,
          color: '#000',
          maxWidth: 240,
          textAlign: 'center',
          lineHeight: 18,
        }}
        numberOfLines={2}>
        Please login/sign up to receive your estimated quote.
      </Text>

      <Pressable
        style={({ pressed }) => [
          {
            alignSelf: 'center',
            paddingVertical: 10,
            width: '100%',
            alignItems: 'center',
            borderRadius: 10,
            marginBottom: 20,
          },
          {
            backgroundColor: '#cecece',
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        onPress={() => {
          handleDismiss()
          navigation.navigate('Login')
        }}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#000' }}>
          Login / Sign up
        </Text>
      </Pressable>
    </BottomSheetView>
  )
}

const styles = StyleSheet.create({})
