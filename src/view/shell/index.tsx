import {StatusBar, View} from 'react-native';
import {ModalsContainer} from '../com/modals/Modal';
import {atoms as a, useTheme} from '#/theme';

import {RootNavigator, RoutesContainer} from '#/navigation/root';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import React from 'react';
import {useSession} from '#/state/session';
import * as notifications from '#/lib/notifications/notifications';
function ShellInner() {
  const {session} = useSession();
  // start undefined
  const currentAccount = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (session && currentAccount.current !== session.user.id) {
      currentAccount.current = session.user.id;
      notifications.getFCMToken(session.user.id);
      const unsub = notifications.registerTokenChangeHandler(session);
      return unsub;
    }
  }, [session]);

  return (
    <>
      <RootNavigator />
      <ModalsContainer />
    </>
  );
}

export const Shell: React.FC = function shellImpl() {
  const t = useTheme();
  return (
    <View style={[a.h_full, t.atoms.bg]}>
      <StatusBar />
      <RoutesContainer>
        <BottomSheetModalProvider>
          <ShellInner />
        </BottomSheetModalProvider>
      </RoutesContainer>
    </View>
  );
};
