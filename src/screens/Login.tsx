import React, {useCallback} from 'react'
import {View, StyleSheet, Image, Button} from 'react-native'
import {Text} from '#/components/Typography'
import {Header} from '#/components/Header'
import {colors, images, spacing} from '#/utils/theme'
import {useNavigation} from '@react-navigation/native'
import {NavigationProp} from '#/lib/routes/types'
import {useSessionApi} from '#/state/session'
import {LoginWithPhone} from '#/components/forms/LoginWithPhone'
import {useGlobalLoadingControls} from '#/state/shell/global-loading'

import {useTheme} from '#/theme'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {logger} from '#/logger'
import {supabase} from '#/lib/supabase'
import {isProfileIncomplete} from '#/state/queries/auth'

const renderHeader = (props: any) => {
  const {navigation} = props
  return (
    <Header
      titleStyle={{color: colors.black}}
      leftIcon="caretLeft"
      leftIconColor={colors.black}
      onLeftPress={() => navigation.goBack()}
    />
  )
}

export function LoginScreen() {
  const navigation = useNavigation<NavigationProp>()
  const t = useTheme()
  const {loginWithPhone, loginWithEmailPassword} = useSessionApi()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const globalLoading = useGlobalLoadingControls()

  const handleSubmitPhoneNumber = async (phone: string) => {
    try {
      globalLoading.show()
      await loginWithPhone(phone)
      setShowLoggedOut(false)
      navigation.navigate('Otp', {phone: phone})
    } catch (error) {
      logger.error('handleSubmitPhoneNumber', {e: error})
    } finally {
      globalLoading.hide()
    }
  }
  const loginAlice = useCallback(async () => {
    try {
      globalLoading.show()
      const {data} = await supabase.auth.signInWithPassword({
        email: 'alice@testuser.com',
        password: 'P@ssw0rd',
      })
      if (data?.session && data?.user) {
        const userExist = await isProfileIncomplete(data.user.id)
        if (userExist) {
          //@ts-ignore
          navigation.navigate('HomeTab')
        } else {
          navigation.navigate('CreateAccount')
        }
        setShowLoggedOut(false)
        return
      }

      // navigation.navigate('')
    } catch (error) {
      logger.error('loginAlice', {e: error})
    } finally {
      globalLoading.hide()
    }
  }, [])
  return (
    <View style={styles.$root}>
      <Image source={images.kumpooniLogo} style={styles.logo} />

      <View style={styles.container}>
        <View style={styles.flexColumn}>
          <LoginWithPhone handleSubmitPhoneNumber={handleSubmitPhoneNumber} />
          <Button title="Login Test User" onPress={loginAlice} />

          <Text style={styles.terms}>
            By signing in you agree to our{' '}
            <Text
              onPress={() => {
                navigation.navigate('Terms')
              }}
              style={[styles.terms, styles.fontBold]}>
              Terms & Conditions
            </Text>
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  $root: {
    flex: 1,
    paddingTop: spacing.large,
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.medium,
  },
  container: {
    width: '100%',
    paddingTop: spacing.extraLarge,
  },

  flexColumn: {
    marginHorizontal: spacing.large,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  phoneBox: {
    flexDirection: 'row',
  },

  terms: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  textOr: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '500',
    color: colors.black,
    textAlign: 'center',
    marginHorizontal: spacing.extraSmall,
  },
  fontBold: {fontFamily: 'Inter-SemiBold', fontWeight: 'bold'},
  logo: {
    marginTop: 100,
    height: 120,
    width: 270,
    resizeMode: 'cover',
  },
})
