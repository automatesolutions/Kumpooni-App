import 'react-native-url-polyfill/auto'
import 'view/icons'
import React, {useEffect, useState} from 'react'
import {
  asyncStoragePersister,
  dehydrateOptions,
  queryClient,
} from './lib/react-query'
import {I18nextProvider} from 'react-i18next'
import {RootSiblingParent} from 'react-native-root-siblings'
import {SafeAreaProvider} from 'react-native-safe-area-context'

import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client'
import {init as initPersistedState} from 'state/persisted'
import {Provider as SessionProvider} from 'state/session'
import {Provider as ShellStateProvider} from 'state/shell'
import {Provider as InvitesStateProvider} from 'state/invites'
import {Provider as LoggedOutViewProvider} from 'state/shell/logged-out'
import {Provider as ModalStateProvider} from 'state/modals'
import {Provider as CurrentCarProvider} from 'state/car'
import {Provider as PortalProvider} from '#/components/Portal'
import {Provider as DialogStateProvider} from 'state/dialogs'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {ThemeProvider} from '#/theme'
import {useColorModeTheme} from './theme/util/useColorModeTheme'
import {useLocationStore} from './stores/location'
import {MenuProvider} from 'react-native-popup-menu'

import {Shell} from 'view/shell'
import {i18n} from './i18n'
import {Splash} from './Splash'

function InnerApp() {
  const theme = useColorModeTheme()
  const [isReady, setReady] = useState(false)
  React.useEffect(() => {
    Promise.all([
      initPersistedState(),
      new Promise(resolve =>
        useLocationStore.persist.onFinishHydration(resolve),
      ),
    ]).then(() => {
      setReady(true)
    })
  }, [])

  return (
    <SafeAreaProvider style={{backgroundColor: '#fff', flex: 1}}>
      <ThemeProvider theme={theme}>
        <Splash isReady={isReady}>
          <RootSiblingParent>
            <LoggedOutViewProvider>
              <GestureHandlerRootView style={{height: '100%'}}>
                <MenuProvider>
                  <Shell />
                </MenuProvider>
              </GestureHandlerRootView>
            </LoggedOutViewProvider>
          </RootSiblingParent>
        </Splash>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        dehydrateOptions: dehydrateOptions,
      }}>
      <SessionProvider>
        <ShellStateProvider>
          <InvitesStateProvider>
            <ModalStateProvider>
              <DialogStateProvider>
                <CurrentCarProvider>
                  <I18nextProvider key={'I18nextProvider'} i18n={i18n}>
                    <PortalProvider>
                      <InnerApp />
                    </PortalProvider>
                  </I18nextProvider>
                </CurrentCarProvider>
              </DialogStateProvider>
            </ModalStateProvider>
          </InvitesStateProvider>
        </ShellStateProvider>
      </SessionProvider>
    </PersistQueryClientProvider>
  )
}

export default App
