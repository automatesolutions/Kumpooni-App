import React, {useCallback, useMemo, useState} from 'react'

import {Image, Linking, StyleSheet, TouchableOpacity, View} from 'react-native'
import {colors} from '#/utils/theme'

import {Text} from '../Typography'

import {atoms as a, useTheme} from '#/theme'

import {GooglePlaceDto, OpeningHours} from '#/types/automate'
import {GOOGLE_MAP_KEY} from 'react-native-dotenv'
import {FormattedAddress} from '../store/FormattedAddress'
import {color} from '#/theme/tokens'
import {Phone} from 'lucide-react-native'

export function ListShopItem({place}: {place: GooglePlaceDto}) {
  const [visible, setVisible] = useState<boolean>(false)
  const t = useTheme()

  const roundedKm = Math.round((place.dist_meters ?? 0) * 10) / 10
  const onPressViewLocation = () => {
    Linking.openURL(place.googleMapsUri)
  }

  const onClosed = () => {
    setVisible(false)
  }

  return (
    <>
      <View
        style={[
          {
            backgroundColor: '#fff',
            paddingTop: 10,

            borderRadius: 10,
          },
          a.mx_sm,
        ]}>
        <View style={[a.flex_row, a.align_center, a.px_xs, {gap: 10}]}>
          {place.photos ? (
            <Image
              source={{
                uri: `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=1023&key=${GOOGLE_MAP_KEY}`,
              }}
              style={{
                height: 60,
                width: 60,
                borderRadius: 3,
              }}
            />
          ) : null}
          <View
            style={{
              flex: 1,
              height: '100%',
              paddingVertical: 4,
            }}>
            <View style={{}}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.black,
                }}>
                {place.displayName.text}
              </Text>
            </View>
            <FormattedAddress
              address={place.shortFormattedAddress}
              distance={place.dist_meters ?? 0}
            />
          </View>
        </View>
        <View
          style={[
            a.flex_row,
            a.justify_between,
            a.align_center,
            a.pr_2xs,
            a.gap_2xs,
            {marginTop: 4},
          ]}>
          <BusinessHours businessHours={place.regularOpeningHours} />
          <View style={[a.flex_row, a.gap_2xs]}>
            <TouchableOpacity
              style={[styles.viewBtn, {borderColor: color.blue_400}]}>
              <Text
                style={[a.text_xs, {color: t.palette.primary_400}]}
                onPress={onPressViewLocation}>
                See location
              </Text>
            </TouchableOpacity>
            {place.nationalPhoneNumber || place.internationalPhoneNumber ? (
              <TouchableOpacity
                style={[
                  styles.viewBtn,
                  a.flex_row,
                  a.gap_3xs,
                  a.align_center,
                  {borderColor: color.gray_200},
                ]}>
                <Phone size={14} color={color.gray_200} />
                <Text
                  style={[a.text_xs, t.atoms.text_contrast_medium]}
                  onPress={onPressViewLocation}>
                  {place.nationalPhoneNumber ?? place.internationalPhoneNumber}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </>
  )
}

function BusinessHours({businessHours}: {businessHours: OpeningHours}) {
  const openingHours = getBusinessHours(businessHours.weekdayDescriptions ?? [])
  return (
    <View style={[a.pl_2xs]}>
      <Text style={[a.text_2xs]}>{openingHours[0]}</Text>
      <Text style={[a.text_2xs]}>{openingHours[1]}</Text>
    </View>
  )
}

function getBusinessHours(weekdayDescriptions: string[]) {
  if (!weekdayDescriptions.length) return []
  const openDays: string[] = []
  let openTime: string = '',
    closeTime: string = ''

  weekdayDescriptions.forEach(desc => {
    const [day, hours] = desc.split(': ')
    if (hours !== 'Closed') {
      openDays.push(day)
      const [open, close] = hours.split(' – ')
      openTime = openTime || open
      closeTime = closeTime || close
    }
  })

  const firstOpenDay = openDays[0]
  const lastOpenDay = openDays[openDays.length - 1]
  const openDaysRange = `${firstOpenDay.substring(
    0,
    3,
  )}-${lastOpenDay.substring(0, 3)}`

  return [openDaysRange, `${openTime} - ${closeTime}`]
}
const styles = StyleSheet.create({
  viewBtn: {
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 5,
    borderWidth: 1,
    marginBottom: 7,
  },
  appointmentBtn: {
    backgroundColor: '#000',
  },
})
