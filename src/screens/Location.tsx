import React, {useCallback, useEffect, useLayoutEffect, useRef} from 'react';
import {Text} from '#/components/Typography';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {useTheme, atoms as a} from '#/theme';

import {AllNavigatorParams} from '#/lib/routes/types';
import {NativeStackScreenProps} from '@react-navigation/native-stack/src/types';

import {Icon} from '#/components/utils/icon';
import {GooglePlacesInput} from '#/view/com/GooglePlacesInput';
import {Navigation} from 'lucide-react-native';
import {Coords} from '#/types/automate';
import {Address, useLocationStore} from '#/stores/location';
import {useGlobalLoadingControls} from '#/state/shell/global-loading';
import {useLocationPermission} from '#/components/hooks/usePermission';
import {Separator} from '#/components/utils/Views';

type Props = NativeStackScreenProps<AllNavigatorParams, 'Location'>;
export function LocationScreen({navigation}: Props) {
  const t = useTheme();

  const initialRequestLocation = useRef(false);

  const {
    setLocationAndAddress,
    getCurrentLocation,
    address,
    location,
    isLoading,
  } = useLocationStore(s => ({
    setLocationAndAddress: s.setLocationAndAddress,
    getCurrentLocation: s.getCurrentLocation,
    isLoading: s.isLoading,
    location: s.location,
    address: s.address,
  }));
  const globalLoading = useGlobalLoadingControls();
  console.log('location', location);
  const {requestLocationAccessIfNeeded} = useLocationPermission();
  const onPressLocation = useCallback((location: Coords, address: Address) => {
    setLocationAndAddress({lat: location.lat, lng: location.lng}, address);
    setTimeout(() => {
      navigation.goBack();
    }, 0);
  }, []);

  const onGetCurrentLocation = useCallback(async () => {
    globalLoading.show();
    await requestLocationAccessIfNeeded();
    const isProceed = await getCurrentLocation();

    globalLoading.hide();
    if (isProceed) {
      navigation.goBack();
    }
  }, [location, setLocationAndAddress, isLoading, getCurrentLocation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: props => (
        <TouchableOpacity {...props} onPress={() => navigation.goBack()}>
          <Icon icon="x" size={20} />
        </TouchableOpacity>
      ),
    });
  }, []);

  return (
    <View style={[t.atoms.bg, a.flex_1]}>
      <GooglePlacesInput onPressLocation={onPressLocation} />
      <View style={[a.px_2xl, a.gap_2xs, {marginTop: 90}]}>
        <CurrentLocation
          onPress={onGetCurrentLocation}
          address={address}
          isLoading={isLoading}
        />
        <Separator style={{height: 3}} />
      </View>
    </View>
  );
}

export function CurrentLocation({
  onPress,
  address,
  isLoading,
}: {
  onPress: () => void;
  address: Address | null;
  isLoading: boolean;
}) {
  const formattedAddress = address?.formatted_address;
  return (
    <TouchableOpacity
      style={[a.flex_row, a.align_center, a.gap_2xs]}
      onPress={onPress}>
      <View style={{marginTop: 4}}>
        <Navigation size={20} color="#000" />
      </View>
      <View>
        <Text style={[a.text_md, a.font_bold]}>Current location</Text>
        {isLoading ? (
          <Text key={'locating'}>Using GPS.</Text>
        ) : (
          <Text style={[a.text_sm]}>
            {formattedAddress
              ? `${formattedAddress}`
              : 'Allow Location Permission'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({});
