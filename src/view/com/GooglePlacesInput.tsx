import React, { useCallback } from 'react'

import { View, StyleSheet, TextStyle } from 'react-native'
import {
  GooglePlaceData,
  GooglePlacesAutocomplete,
} from 'react-native-google-places-autocomplete'
import { logger } from '#/logger'
import { GOOGLE_MAP_KEY } from 'react-native-dotenv'
import { MapPin, Search } from 'lucide-react-native'

import { s } from '#/lib/styles'

// import {Location} from '#/types/automate';
// import {useGetNearbyStoreQuery} from '#/state/queries/nearby-store';

import { Address, useLocationStore } from '#/stores/location'
import { Text } from '#/components/Typography'
import { useTheme, atoms as a } from '#/theme'
import type { Coords } from '#/types/automate'
import { colors } from '#/utils/theme'
type Props = {
  onPressLocation: (location: Coords, address: Address) => void
}

export function GooglePlacesInput({ onPressLocation }: Props) {
  const t = useTheme()
  const location = useLocationStore(s => s.location)
  const renderRow = useCallback((data: GooglePlaceData, index: number) => {
    logger.log('Index:', { ...data })
    return <LocationCard data={data} />
  }, [])

  return (
    <>
      <GooglePlacesAutocomplete
        placeholder="Search for an address"
        textInputProps={{
          placeholderTextColor: '#000',
        }}
        query={{
          key: GOOGLE_MAP_KEY,
          language: 'en',
          type: 'geocode',
          components: 'country:ph',
        }}
        // nearbyPlacesAPI={'GoogleReverseGeocoding'}
        minLength={3}
        keyboardShouldPersistTaps="handled"
        onPress={(data, details) => {
          logger.info('data', { ...data })
          logger.info('Details', { ...details })
          if (details === null) return
          onPressLocation(details.geometry.location, {
            formatted_address: details.formatted_address || '',
            main_text: data.structured_formatting.main_text || '',
            secondary_text: data.structured_formatting.secondary_text || '',
          })
        }}
        GooglePlacesDetailsQuery={{
          fields: 'formatted_address,name,geometry',
        }}
        debounce={500}
        styles={placesStyles}
        renderRow={renderRow}
        fetchDetails={true}
        renderLeftButton={() => <Search size={20} color="#000" />}
        enablePoweredByContainer={false}
      />
    </>
  )
}

const placesStyles = {
  container: {
    zIndex: 10,
    overflow: 'visible',
    flexGrow: 0,
    flexShrink: 0,
  },
  textInputContainer: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
    height: 50,
    overflow: 'visible',
    backgroundColor: colors.gray300,
    borderColor: colors.white,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    margin: 10,
  },

  textInput: {
    backgroundColor: 'transparent',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22.5,
    paddingBottom: 0,
    flex: 1,
    color: '#000',
  } as TextStyle,

  listView: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    borderRadius: 5,
    flex: 1,
    elevation: 3,
    zIndex: 10,
  },
  description: {
    color: '#1faadb',
  },
  predefinedPlacesDescription: {
    color: '#1faadb',
  },
}

function LocationCard({
  data,
  index,
}: {
  data: GooglePlaceData
  index?: number
}) {
  const t = useTheme()
  const { structured_formatting } = data
  return (
    <View style={[a.flex_row, a.align_center, { gap: 10 }]}>
      <View
        style={[
          s.justifyCenter,
          s.alignCenter,
          {
            height: 20,
            width: 20,
            borderRadius: 99,
            backgroundColor: colors.gray300,
          },
        ]}>
        <MapPin size={14} fill={colors.palette.neutral700} color="#fff" />
      </View>
      <View style={{}}>
        <Text style={[a.text_md]}>
          {structured_formatting?.main_text
            ? structured_formatting.main_text
            : ''}
        </Text>
        <Text style={[a.text_sm]}>
          {structured_formatting?.secondary_text
            ? structured_formatting.secondary_text
            : ''}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({})
