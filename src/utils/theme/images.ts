interface ImageSources {
  [key: string]: any
}

export const images: ImageSources = {
  no_notification: require('#/assets/images/no_notification.png'),
  no_messages: require('#/assets/images/no_messages.png'),
  no_internet: require('#/assets/images/no_internet.png'),
  gearLoading: require('#/assets/images/gear-loading.gif'),
  logoWithTagline: require('#/assets/images/logo-with-tagline.png'),
  logoWithouTagline: require('#/assets/images/logo-without-tagline.png'),
  kumpooniLogo: require('#/assets/images/kumpooni-logo.png'),
  kumpooni: require('#/assets/images/kumpooni.png'),
  gear: require('#/assets/images/gear.png'),
} as const

// export const carousel = [
//   {key: '1', image_path: images.carousel1},
//   {key: '2', image_path: images.carousel2},
//   {key: '3', image_path: images.carousel3},
//   {key: '4', image_path: images.carousel4},
//   {key: '5', image_path: images.carousel5},
// ];

export const banner = [
  {
    key: '1',
    image_path: images.home_service,
    name: 'Home Service',
    categoryId: 21,
    path: 'Services',
  },
  {
    key: '2',
    image_path: images.change_oil,
    name: 'Maintenance',
    categoryId: 1,
    path: 'Services',
  },
  {
    key: '3',
    image_path: images.car_wash,
    name: 'Car Wash',
    categoryId: 3,
    path: 'Services',
  },
  {
    key: '4',
    image_path: images.emergency,
    name: '',
    categoryId: 0,
    path: '',
  },
]
