import {AllNavigatorParams, NavigationProp} from '#/lib/routes/types';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {ServicesScreen} from '#/screens/Services';
import {DetailsScreen} from '#/screens/Details';
import {LoginScreen} from '#/screens/Login';
import {TermsScreen} from '#/screens/Terms';
import {OtpScreen} from '#/screens/Otp';
import {AddressListScreen} from '#/screens/AddressList';
import {LocationScreen} from '#/screens/Location';
import {SearchScreen} from '#/screens/Search';
import {StoreSelectionScreen} from '#/screens/StoreSelection';
import {CarsScreen} from '#/screens/Cars';
import {CartScreen} from '#/screens/Cart';
import {VehicleScreen} from '#/screens/Vehicle';
import {SupportScreen} from '#/screens/SupportScreen';
import {AboutScreen} from '#/screens/AboutScreen';
import {CheckoutScreen} from '#/screens/Checkout';
import {OrderDetailsScreen} from '#/screens/OrderDetails';
import {SearchStoresScreen} from '#/screens/SearchStores';
import {StoreScreen} from '#/screens/Store';
import {CartStoreScreen} from '#/screens/CartStore';
import {CreateAccountScreen} from '#/screens/CreateAccount';
import {WriteReviewScreen} from '#/screens/WriteReview';
import {StoryBook} from '#/screens/StoryBook';
import {NotificationScreen} from '#/screens/Notification';
import {createNativeStackNavigatorWithAuth} from '#/view/shell/createNativeStackNavigatorWithAuth';
import {Header} from '#/components/Header';
import {colors} from '#/utils/theme';
import {TabsNavigator} from './tabs';

const RootStack = createNativeStackNavigatorWithAuth<AllNavigatorParams>();

export function RootNavigator() {
  const navigation = useNavigation<NavigationProp>();
  return (
    <RootStack.Navigator initialRouteName="RootTab">
      {/* Without header */}
      <RootStack.Group screenOptions={{headerShown: false}}>
        <RootStack.Screen name="RootTab" getComponent={() => TabsNavigator} />
        <RootStack.Screen name="Details" getComponent={() => DetailsScreen} />
        <RootStack.Screen name="Login" getComponent={() => LoginScreen} />

        <RootStack.Screen name="Otp" getComponent={() => OtpScreen} />
        <RootStack.Screen
          name="AddressList"
          getComponent={() => AddressListScreen}
        />

        <RootStack.Screen name="Search" getComponent={() => SearchScreen} />

        <RootStack.Screen
          name="SearchStores"
          getComponent={() => SearchStoresScreen}
        />
        <RootStack.Screen name="Store" getComponent={() => StoreScreen} />
      </RootStack.Group>

      <RootStack.Group
        screenOptions={{
          headerTitleAlign: 'center',
        }}>
        <RootStack.Screen
          name="Location"
          getComponent={() => LocationScreen}
          options={{
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: 'bold',
            },
          }}
        />
        <RootStack.Screen
          name="StoreSelection"
          options={{
            title: 'Review Quotes',
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: 'bold',
            },
          }}
          getComponent={() => StoreSelectionScreen}
        />
        <RootStack.Screen
          name="WriteReview"
          options={{title: 'Write a review'}}
          getComponent={() => WriteReviewScreen}
        />
        <RootStack.Screen name="Services" getComponent={() => ServicesScreen} />
      </RootStack.Group>

      <RootStack.Group
        screenOptions={{
          headerShown: true,
          headerShadowVisible: true,

          header: ({options}) => (
            <Header
              title={options.title}
              titleStyle={{
                color: colors.black,
                fontWeight: 'bold',
                fontSize: 15,
                fontFamily: 'Inter-Bold',
                textTransform: 'uppercase',
              }}
              leftIcon="back"
              leftIconColor={colors.black}
              onLeftPress={() => {
                return navigation.goBack();
              }}
            />
          ),
        }}>
        <RootStack.Screen
          name="Cart"
          getComponent={() => CartScreen}
          options={{title: 'Auto Cart'}}
        />

        <RootStack.Screen
          name="Notification"
          getComponent={() => NotificationScreen}
          options={{
            requireAuth: true,
            title: 'Notifications',
          }}
        />
        <RootStack.Screen
          name="Terms"
          getComponent={() => TermsScreen}
          options={{
            title: 'Terms & Conditions',
          }}
        />

        <RootStack.Screen name="Debug" getComponent={() => StoryBook} />
        <RootStack.Screen
          name="Support"
          component={SupportScreen}
          options={{
            title: 'Support',
          }}
        />
        <RootStack.Screen
          name="About"
          getComponent={() => AboutScreen}
          options={{
            title: 'AUTO-MATE SOLUTIONS INC',
            headerTitleStyle: {fontSize: 14},
          }}
        />
        <RootStack.Screen
          name="Cars"
          getComponent={() => CarsScreen}
          options={{}}
        />
        <RootStack.Screen
          name="Vehicle"
          getComponent={() => VehicleScreen}
          options={{title: 'Select your vehicle'}}
        />

        <RootStack.Screen
          name="OrderDetails"
          getComponent={() => OrderDetailsScreen}
        />

        <RootStack.Screen
          name="CartStore"
          getComponent={() => CartStoreScreen}
        />
        <RootStack.Screen
          name="CreateAccount"
          getComponent={() => CreateAccountScreen}
        />

        {/* <RootStack.Screen
          name="Quote"
          getComponent={() => Quote}
          options={{ title: 'Estimate' }}
        /> */}
      </RootStack.Group>

      <RootStack.Group
        screenOptions={{
          headerShown: true,
          headerShadowVisible: false,
          headerTitleAlign: 'left',
          headerTitleStyle: {
            fontSize: 18,
          },
        }}>
        <RootStack.Screen
          name="Checkout"
          getComponent={() => CheckoutScreen}
          options={{
            title: 'Checkout',
          }}
        />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}

function RoutesContainer({children}: React.PropsWithChildren<{}>) {
  return <NavigationContainer>{children}</NavigationContainer>;
}

export {RoutesContainer};
