import {StyleSheet} from 'react-native';
import {colors} from 'lib/styles';

export const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: colors.gray2,
    paddingLeft: 5,
    paddingRight: 10,
    backgroundColor: '#fff',
  },
  bottomBarWeb: {
    // @ts-ignore web-only
    position: 'fixed',
  },
  ctrl: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 0,
  },
  notificationCount: {
    position: 'absolute',
    left: '52%',
    top: 8,
    backgroundColor: colors.blue3,
    paddingHorizontal: 4,
    paddingBottom: 1,
    borderRadius: 6,
    zIndex: 1,
  },
  notificationCountLight: {
    borderColor: colors.white,
  },
  notificationCountDark: {
    borderColor: colors.gray8,
  },
  notificationCountLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  ctrlIcon: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  ctrlIconSizingWrapper: {
    height: 27,
  },
  homeIcon: {
    top: 0,
  },
  feedsIcon: {
    top: -2,
  },
  searchIcon: {
    top: -2,
  },
  accountIcon: {
    top: -1,
  },
  orderIcon: {
    top: -1,
  },
  bellIcon: {
    top: -2.5,
  },
  profileIcon: {
    top: -4,
  },
  onProfile: {
    borderWidth: 1,
    borderRadius: 100,
  },
});
