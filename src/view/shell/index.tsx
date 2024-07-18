import {StatusBar, View} from 'react-native'
import {ModalsContainer} from '../com/modals/Modal'
import {atoms as a, useTheme} from '#/theme'

import {RootNavigator, RoutesContainer} from '#/navigation/root'
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet'
import React from 'react'

import {useNotificationRegistration} from '#/lib/notifications/useNotificationRegistration'
import {useNotificationsHandler} from '#/lib/hooks/useNotificationHandler'
function ShellInner() {
  useNotificationRegistration()
  useNotificationsHandler()
  return (
    <>
      <RootNavigator />
      <ModalsContainer />
    </>
  )
}

export const Shell: React.FC = function shellImpl() {
  const t = useTheme()
  return (
    <View style={[a.h_full, t.atoms.bg]}>
      <StatusBar />
      <RoutesContainer>
        <BottomSheetModalProvider>
          <ShellInner />
        </BottomSheetModalProvider>
      </RoutesContainer>
    </View>
  )
}
