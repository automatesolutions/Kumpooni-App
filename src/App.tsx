import 'react-native-url-polyfill/auto';
import 'view/icons';
import React, {useState} from 'react';
import {
  asyncStoragePersister,
  dehydrateOptions,
  queryClient,
} from './lib/react-query';

import {SafeAreaProvider} from 'react-native-safe-area-context';

import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client';
import {init as initPersistedState} from 'state/persisted';
import {Provider as SessionProvider} from 'state/session';
import {Provider as ShellStateProvider} from 'state/shell';
import {Provider as InvitesStateProvider} from 'state/invites';
import {Provider as LoggedOutViewProvider} from 'state/shell/logged-out';
import {Provider as ModalStateProvider} from 'state/modals';
import {Provider as CurrentCarProvider} from 'state/car';
import {Provider as PortalProvider} from '#/components/Portal';
import {Provider as DialogStateProvider} from 'state/dialogs';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {ThemeProvider} from '#/theme';
import {useColorModeTheme} from './theme/util/useColorModeTheme';
import {useLocationStore} from './stores/location';
import {RootSiblingParent} from 'react-native-root-siblings';
import {I18nextProvider} from 'react-i18next';
import {i18n} from './i18n';

import * as notification from '#/lib/notifications/notifications';
import messaging from '@react-native-firebase/messaging';
import {Shell} from './view/shell';

function InnerApp() {
  const theme = useColorModeTheme();

  React.useEffect(() => {
    //On ForeGround

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      await notification.onDisplayNotification(remoteMessage.notification);
    });

    return unsubscribe;
  }, []);
  return (
    <SafeAreaProvider style={{backgroundColor: '#fff', flex: 1}}>
      <LoggedOutViewProvider>
        <ThemeProvider theme={theme}>
          <RootSiblingParent>
            <GestureHandlerRootView style={{height: '100%'}}>
              <Shell />
            </GestureHandlerRootView>
          </RootSiblingParent>
        </ThemeProvider>
      </LoggedOutViewProvider>
    </SafeAreaProvider>
  );
}
function App() {
  const [isReady, setReady] = useState(false);
  React.useEffect(() => {
    Promise.all([
      initPersistedState(),
      new Promise(resolve =>
        useLocationStore.persist.onFinishHydration(resolve),
      ),
    ]).then(() => setReady(true));
  }, []);

  if (!isReady) {
    return null;
  }

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
  );
}

export default App;
