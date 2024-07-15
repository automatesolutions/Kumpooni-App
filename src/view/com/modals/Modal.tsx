import React, { useEffect, useRef, useCallback } from 'react'
import { Keyboard, StyleSheet } from 'react-native'
import BottomSheet from '@gorhom/bottom-sheet'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useModalControls, useModals } from '#/state/modals'
import { createCustomBackdrop } from '../util/BottomSheetCustomBackdrop'

import * as WaitlistModal from './Waitlist'
import * as ServiceVariationModal from './ServiceVariation'
import * as ShopFiltersModal from './ShopFilters'

const DEFAULT_SNAPPOINTS = ['100%']
const HANDLE_HEIGHT = 24

export function ModalsContainer() {
  const { isModalActive, activeModals } = useModals()
  const { closeModal } = useModalControls()
  const bottomSheetRef = useRef<BottomSheet>(null)

  const safeAreaInsets = useSafeAreaInsets()

  const activeModal = activeModals[activeModals.length - 1]

  const onBottomSheetChange = useCallback(
    async (snapPoint: number) => {
      if (snapPoint === -1) {
        closeModal()
      }
    },
    [closeModal],
  )

  const onClose = () => {
    Keyboard.dismiss()
    closeModal()
  }

  useEffect(() => {
    if (isModalActive) {
      bottomSheetRef.current?.snapToIndex(0)
    } else {
      bottomSheetRef.current?.close()
    }
  }, [isModalActive, bottomSheetRef, activeModal?.name])

  let needsSafeTopInset = false
  let snapPoints: (string | number)[] = DEFAULT_SNAPPOINTS
  let element
  if (activeModal?.name === 'confirm') {
    snapPoints = WaitlistModal.snapPoints
    element = <WaitlistModal.Component />
  } else if (activeModal?.name === 'service-variation') {
    snapPoints = ServiceVariationModal.snapPoints
    element = <ServiceVariationModal.Component {...activeModal} />
  } else if (activeModal?.name === 'shop-filters') {
    snapPoints = ShopFiltersModal.snapPoints
    element = <ShopFiltersModal.Component {...activeModal} />
  } else {
    return null
  }

  if (snapPoints[0] === 'fullscreen') {
    return (
      <SafeAreaView
        style={[styles.fullscreenContainer, { backgroundColor: '#fff' }]}>
        {element}
      </SafeAreaView>
    )
  }

  const topInset = needsSafeTopInset ? safeAreaInsets.top - HANDLE_HEIGHT : 0

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      // topInset={topInset}
      handleHeight={HANDLE_HEIGHT}
      index={isModalActive ? 0 : -1}
      enablePanDownToClose
      android_keyboardInputMode="adjustResize"
      keyboardBlurBehavior="restore"
      backdropComponent={
        isModalActive ? createCustomBackdrop(onClose) : undefined
      }
      handleIndicatorStyle={{ height: 0 }}
      // handleStyle={[styles.handle]}
      onChange={onBottomSheetChange}>
      {element}
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  handle: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
})
