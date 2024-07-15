import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { personalInfoSchema } from '../../lib/validations/user'
import { z } from 'zod'

import { colors, spacing } from '#/utils/theme'
import { useNavigation } from '@react-navigation/native'
import { NavigationProp } from '#/lib/routes/types'
import { InputOutline } from './InputOutline'
import { useUpdateProfile } from '#/state/queries/auth'

type Inputs = z.infer<typeof personalInfoSchema>

const activeColor = colors.black
const inactiveColor = colors.palette.neutral400

export const UserDetailForm = ({ userId }: { userId: string }) => {
  const navigation = useNavigation<NavigationProp>()

  const form = useForm<Inputs>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
    },
  })
  const { mutate: updateProfile, isPending } = useUpdateProfile()

  function onSubmit(data: Inputs) {
    updateProfile(
      { id: userId, changes: data },
      {
        onSuccess: () => {
          navigation.navigate('Vehicle', { vehicle: undefined })
        },
        onError: () => {
          // toast({
          //   title: '',
          //   preset: 'error',
          //   message: 'Failed to save',
          //   position: 'bottom',
          // });
        },
      },
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.headingTitle}>Tell us about your details.</Text>

        <Text style={{ color: '#625C58', fontSize: 16, marginBottom: 8 }}>
          Please fill your details
        </Text>
      </View>
      <View style={{ gap: 24 }}>
        <Controller
          control={form.control}
          name="first_name"
          render={({
            field: { onChange, onBlur, value },
            fieldState: { invalid, error },
          }) => (
            <InputOutline
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              keyboardType="default"
              textContentType="givenName"
              autoComplete="name-family"
              autoCapitalize="none"
              assistiveText="Please enter your name"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder={'First Name'}
              error={error ? error?.message : undefined}
            />
          )}
        />
        <Controller
          control={form.control}
          name="last_name"
          render={({
            field: { onChange, onBlur, value },
            fieldState: { invalid, error },
          }) => (
            <InputOutline
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              keyboardType="default"
              textContentType="givenName"
              autoComplete="name-family"
              autoCapitalize="none"
              assistiveText="Please enter your surname"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder={'Last Name'}
              error={error ? error?.message : undefined}
            />
          )}
        />
      </View>
      <Pressable
        onPress={form.handleSubmit(onSubmit)}
        style={[styles.confirmButton, { opacity: isPending ? 0.6 : 1 }]}
        disabled={isPending}>
        {isPending && <ActivityIndicator color={'#fff'} />}
        <Text style={styles.btnText}>Confirm</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.large,
  },
  confirmButton: {
    backgroundColor: '#1E1E1E',
    paddingVertical: spacing.small,
    borderRadius: 5,
    marginVertical: 30,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  heading: {
    gap: 15,
  },
  headingTitle: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: inactiveColor,
    paddingBottom: 5,
  },
})
