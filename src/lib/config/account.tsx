import {AccountNavigationItem} from '#/types/automate'
import {CarIcon, Newspaper, Settings, Store} from 'lucide-react-native'
import {SupportSVG} from '../icons/Support'

export const accountRoutes = [
  {
    id: 1,
    title: 'My Vehicles',
    name: 'Cars',
    iconElement: <CarIcon color="#000" />,
    subTitle: 'Add new car, Manage car',
  },
  // {
  //   id: 3,
  //   title: 'Support',
  //   name: 'Support',
  //   iconElement: <SupportSVG color="#000" fill={'#000'} />,
  //   subTitle: 'Frequently asked questions',
  // },
  {
    id: 2,
    title: 'Terms & Conditions',
    name: 'Terms',
    iconElement: <Newspaper size={20} color="#000" />,
    subTitle: 'About our policy',
  },
] as AccountNavigationItem[]
