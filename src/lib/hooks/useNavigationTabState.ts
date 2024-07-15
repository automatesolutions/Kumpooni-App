import {useNavigationState} from '@react-navigation/native';
import {getTabState, TabState} from 'lib/routes/helpers';

export function useNavigationTabState() {
  return useNavigationState(state => {
    const res = {
      isAtHome: getTabState(state, 'Home') !== TabState.Outside,
      isAtOrders: getTabState(state, 'Orders') !== TabState.Outside,
      isAtShops: getTabState(state, 'Shops') !== TabState.Outside,
      isAtParts: getTabState(state, 'Parts') !== TabState.Outside,
      isAtMyAccount: getTabState(state, 'MyAccount') !== TabState.Outside,
    };
    if (
      !res.isAtHome &&
      !res.isAtOrders &&
      !res.isAtParts &&
      !res.isAtShops &&
      !res.isAtMyAccount
    ) {
      // HACK for some reason useNavigationState will give us pre-hydration results
      //      and not update after, so we force isAtHome if all came back false
      //      -prf
      res.isAtHome = true;
    }
    return res;
  });
}
