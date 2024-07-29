import {Insets} from 'react-native'

export const MAX_DISPLAY_NAME = 64
export const MAX_DESCRIPTION = 256
export const MAX_GRAPHEME_LENGTH = 300

// Recommended is 100 per: https://www.w3.org/WAI/GL/WCAG20/tests/test3.html
// but increasing limit per user feedback
export const MAX_ALT_TEXT = 1000

export function IS_TEST_USER(handle?: string) {
  return handle && handle?.endsWith('.test')
}

// Hitslop constants
export const createHitslop = (size: number): Insets => ({
  top: size,
  left: size,
  bottom: size,
  right: size,
})
export const HITSLOP_10 = createHitslop(10)
export const HITSLOP_20 = createHitslop(20)
export const HITSLOP_30 = createHitslop(30)
export const BACK_HITSLOP = HITSLOP_30
export const MAX_POST_LINES = 25

export type TransactionTabTypes =
  | 'scheduled'
  | 'completed'
  | 'canceled'
  | 'inprogress|awaiting-parts'
export const tabs: Array<{
  key: TransactionTabTypes
  label: string
}> = [
  {
    key: 'scheduled',
    label: 'Upcoming',
  },
  {
    key: 'inprogress|awaiting-parts',
    label: 'Ongoing',
  },
  {
    key: 'completed',
    label: 'Completed',
  },
  {
    key: 'canceled',
    label: 'Canceled',
  },
]

export type SortShop = 'rating' | 'distance' | 'price'

export const sortColumns: Array<{
  key: SortShop
  label: string
}> = [
  {
    key: 'rating',
    label: 'Rating',
  },
  {
    key: 'distance',
    label: 'Distance',
  },
  {
    key: 'price',
    label: 'Price',
  },
]

export type PartsCategoryType = 'auto-parts' | 'tires' | 'battery' | 'oils'

export type PartsCategory = {
  key: PartsCategoryType
  label: string
  textQuery: string
}
export const partsCategories: PartsCategory[] = [
  {
    key: 'auto-parts',
    label: 'Auto Parts',
    textQuery: 'auto parts store',
  },
  {
    key: 'tires',
    label: 'Tires',
    textQuery: 'car tires shop',
  },
  {
    key: 'battery',
    label: 'Battery',
    textQuery: 'car battery store',
  },
  {
    key: 'oils',
    label: 'Oils',
    textQuery: 'car oils store',
  },
]

export const partsShop = [
  {
    id: 'ChIJLUfgf7HRrjMREF1P8qQ3DyY',
    types: [
      'auto_parts_store',
      'car_repair',
      'point_of_interest',
      'store',
      'establishment',
    ],
    location: {
      latitude: 10.668873999999999,
      longitude: 122.949411,
    },
    rating: 4.5,
    googleMapsUri: 'https://maps.google.com/?cid=2742471879671373072',
    userRatingCount: 6,
    displayName: {
      text: 'Negros International Auto Parts',
      languageCode: 'en',
    },
    shortFormattedAddress: 'USGO Bldg Rizal Street, corner Lacson St, Bacolod',
  },
  {
    id: 'ChIJjUcIz7PRrjMRQOTWS37KmhY',
    types: [
      'auto_parts_store',
      'car_repair',
      'point_of_interest',
      'store',
      'establishment',
    ],
    location: {
      latitude: 10.6687152,
      longitude: 122.94982820000001,
    },
    rating: 4.3,
    googleMapsUri: 'https://maps.google.com/?cid=1628836859034920000',
    userRatingCount: 39,
    displayName: {
      text: 'DYPO AUTO SUPPLY CORPORATION',
      languageCode: 'en',
    },
    shortFormattedAddress: 'MJN Building, Corner Rizal Lacson St, Bacolod',
  },
  {
    id: 'ChIJUeUL1LPRrjMRNe5mzakD5ds',
    types: [
      'auto_parts_store',
      'car_repair',
      'point_of_interest',
      'store',
      'establishment',
    ],
    location: {
      latitude: 10.6687479,
      longitude: 122.949071,
    },
    rating: 5,
    googleMapsUri: 'https://maps.google.com/?cid=15845074891803389493',
    userRatingCount: 8,
    displayName: {
      text: 'DBO Auto Parts',
      languageCode: 'en',
    },
    shortFormattedAddress: 'MW9X+FJW, Rizal St, Bacolod',
    photos: [
      {
        name: 'places/ChIJUeUL1LPRrjMRNe5mzakD5ds/photos/AUc7tXWzSgzE3tP1EPbkIO9o-srxDUGY68Dk-t4g_lJeTZ9wYpCOXgNBvBiNTT7nw5KJ-eVbrQBz8qtUoRBrZzcbhAETsErzELJUbyMs0IdZricvOUIJRcoAJ0LPKeenAGHuAc7mwulRlo4Kime0CnKzERRfwj5l-Sa1_KJd',
        widthPx: 3456,
        heightPx: 4608,
        authorAttributions: [
          {
            displayName: 'JV Rivera',
            uri: '//maps.google.com/maps/contrib/108795248370842228081',
            photoUri:
              '//lh3.googleusercontent.com/a-/ALV-UjXtgMDcfcefWYv4xpllQUsAGh77Ox5eVgQxuajxoDMjjeFNn4uIdg=s100-p-k-no-mo',
          },
        ],
      },
      {
        name: 'places/ChIJUeUL1LPRrjMRNe5mzakD5ds/photos/AUc7tXUZS5h8o615A6k4PPNNZ9YGRW-isAajrS1GkS2wG8j-BnXUyi41H81Kv7f-_jSMM0V4YjO8UbIxn3U2noF6tUFPtN1_2gRJuKj98MGZQ4tsQ4RQnnZNHJXdAkxBExDRU3yXk1Z37gFoUJ_XWt8nTHTrF4al03fYMpXB',
        widthPx: 3456,
        heightPx: 4608,
        authorAttributions: [
          {
            displayName: 'JV Rivera',
            uri: '//maps.google.com/maps/contrib/108795248370842228081',
            photoUri:
              '//lh3.googleusercontent.com/a-/ALV-UjXtgMDcfcefWYv4xpllQUsAGh77Ox5eVgQxuajxoDMjjeFNn4uIdg=s100-p-k-no-mo',
          },
        ],
      },
    ],
  },
  {
    id: 'ChIJ7-sfULHRrjMRVPdarmojtdo',
    types: [
      'auto_parts_store',
      'car_repair',
      'point_of_interest',
      'store',
      'establishment',
    ],
    location: {
      latitude: 10.6669644,
      longitude: 122.9501008,
    },
    rating: 3,
    googleMapsUri: 'https://maps.google.com/?cid=15759541412151621460',
    userRatingCount: 1,
    displayName: {
      text: 'Three N Auto Parts Enterprises',
      languageCode: 'fil',
    },
    shortFormattedAddress: 'MX82+Q2Q L M Building, Gonzaga St, Bacolod',
  },
  {
    id: 'ChIJc2zkNbHRrjMRNQj4KjFLq_4',
    types: [
      'auto_parts_store',
      'car_repair',
      'point_of_interest',
      'store',
      'establishment',
    ],
    location: {
      latitude: 10.666618399999999,
      longitude: 122.95086900000001,
    },
    rating: 5,
    googleMapsUri: 'https://maps.google.com/?cid=18350843781197596725',
    userRatingCount: 1,
    displayName: {
      text: 'Spark Auto Parts',
      languageCode: 'en',
    },
    shortFormattedAddress: 'MX82+J8X, Gonzaga St, Bacolod',
    photos: [
      {
        name: 'places/ChIJc2zkNbHRrjMRNQj4KjFLq_4/photos/AUc7tXWRozyQFvOGebn37u8WX6ebtRV2JB1hJIr9EbPUnVVyY6S7GWFcCsTwi2PzkKKRxjFtPsUELd1xb3L_04STMzrABvqC0GeNveG6Y_T1Cg-lSEHwxBsjF7-i0ap3dsWdo4ZlqFxb0K_XorKDQeVKAfuwgjFrXkcUovJ0',
        widthPx: 1080,
        heightPx: 1920,
        authorAttributions: [
          {
            displayName: 'Aubrey Esteban',
            uri: '//maps.google.com/maps/contrib/114901129368612801969',
            photoUri:
              '//lh3.googleusercontent.com/a/ACg8ocJ0xPW-Dy-iv6vjIZiFxOD6-burOkLPzMd2kOeYLlsVo52l-Q=s100-p-k-no-mo',
          },
        ],
      },
      {
        name: 'places/ChIJc2zkNbHRrjMRNQj4KjFLq_4/photos/AUc7tXUrmAeXIS34cI0x2zvwoUplyCODou6urZZxSyUbFSyQtwxdVzzPJu-__sytmknrj3ywxC4gaNIKmhFC_N4QtLmKAvMaIvvsN_5u50UQLCFo1bKgjcFYxmOvc8uNhGM7YTj82T1rDSN1WznaVDO1T7S4RHXkv4MleMH2',
        widthPx: 1080,
        heightPx: 1920,
        authorAttributions: [
          {
            displayName: 'Aubrey Esteban',
            uri: '//maps.google.com/maps/contrib/114901129368612801969',
            photoUri:
              '//lh3.googleusercontent.com/a/ACg8ocJ0xPW-Dy-iv6vjIZiFxOD6-burOkLPzMd2kOeYLlsVo52l-Q=s100-p-k-no-mo',
          },
        ],
      },
      {
        name: 'places/ChIJc2zkNbHRrjMRNQj4KjFLq_4/photos/AUc7tXXOusfh-62Z1Xqgu1KuuIURpFXl39VqLYapbQ0ea930yUnzhtBNaxMT2jQ-U4gZfWDedgz5jJR9AJyiomjTfIiSYviP4VPTa6LXn3YlISuUj8kqmyKtu8jcptp4KWt77fAa0O6a8nCvzmYD1A9tUVOvj-kz_KLfJH7c',
        widthPx: 3120,
        heightPx: 4160,
        authorAttributions: [
          {
            displayName: 'Aubrey Esteban',
            uri: '//maps.google.com/maps/contrib/114901129368612801969',
            photoUri:
              '//lh3.googleusercontent.com/a/ACg8ocJ0xPW-Dy-iv6vjIZiFxOD6-burOkLPzMd2kOeYLlsVo52l-Q=s100-p-k-no-mo',
          },
        ],
      },
      {
        name: 'places/ChIJc2zkNbHRrjMRNQj4KjFLq_4/photos/AUc7tXWsIEKkrcbFDDgHnmPkRGK8ZasNyUVjP0Hc-l07Xqm2vtQK_juDEtnZBfLHkWwX_QiKThvTEKhQ4cUbI81I6RQuVwQedBA8KyovSbptsyA53MXWoKtrbesujShL23eD1auDH1tRH5Vye_meZSosNuU7R_nHykidMnsM',
        widthPx: 3072,
        heightPx: 3072,
        authorAttributions: [
          {
            displayName: 'Aubrey Esteban',
            uri: '//maps.google.com/maps/contrib/114901129368612801969',
            photoUri:
              '//lh3.googleusercontent.com/a/ACg8ocJ0xPW-Dy-iv6vjIZiFxOD6-burOkLPzMd2kOeYLlsVo52l-Q=s100-p-k-no-mo',
          },
        ],
      },
    ],
  },
  {
    id: 'ChIJlcD08j7RrjMRW-r8F6Y3UEE',
    types: [
      'auto_parts_store',
      'car_repair',
      'point_of_interest',
      'store',
      'establishment',
    ],
    location: {
      latitude: 10.6678708,
      longitude: 122.9495591,
    },
    rating: 4.5,
    googleMapsUri: 'https://maps.google.com/?cid=4706322797108718171',
    userRatingCount: 2,
    displayName: {
      text: 'Hong San Auto Supply',
      languageCode: 'en',
    },
    shortFormattedAddress: '115 Lacson St, 24, Bacolod',
  },
  {
    id: 'ChIJK8Vz2LPRrjMRz7SEECXs1nw',
    types: [
      'auto_parts_store',
      'car_repair',
      'point_of_interest',
      'store',
      'establishment',
    ],
    location: {
      latitude: 10.6684336,
      longitude: 122.9491419,
    },
    rating: 5,
    googleMapsUri: 'https://maps.google.com/?cid=8995636949654222031',
    userRatingCount: 2,
    displayName: {
      text: 'Midway',
      languageCode: 'en',
    },
    shortFormattedAddress: 'MW9X+9MC, Cuadra St, Bacolod',
  },
  {
    id: 'ChIJuf0L4LPRrjMR-Q5QmGMBtgg',
    types: [
      'auto_parts_store',
      'car_repair',
      'point_of_interest',
      'store',
      'establishment',
    ],
    location: {
      latitude: 10.6676737,
      longitude: 122.9494785,
    },
    rating: 5,
    googleMapsUri: 'https://maps.google.com/?cid=627690725333536505',
    userRatingCount: 2,
    displayName: {
      text: 'Joden Auto Parts Merchandising',
      languageCode: 'fil',
    },
    shortFormattedAddress: 'T. Gensoli Building, 23 Gonzaga St, Bacolod',
  },
  {
    id: 'ChIJFZ2L_bPRrjMR4uA8KKuCulI',
    types: [
      'auto_parts_store',
      'car_repair',
      'point_of_interest',
      'store',
      'establishment',
    ],
    location: {
      latitude: 10.6670084,
      longitude: 122.94942559999998,
    },
    rating: 4.3,
    googleMapsUri: 'https://maps.google.com/?cid=5961220728404369634',
    userRatingCount: 4,
    displayName: {
      text: 'Olympia Auto Supply Inc.',
      languageCode: 'en',
    },
    shortFormattedAddress: 'Gensoli Bldg, Lacson St, Bacolod',
    photos: [
      {
        name: 'places/ChIJFZ2L_bPRrjMR4uA8KKuCulI/photos/AUc7tXVVXzhook_eh_e9qcmR3RnsdlvDs0PDZkfdDhV5tIDW-nBU1ZdlOaj9leGLqLi3iLoaD_dIat-M4VWX6HGPPpSGO6bgpQXRO2_hkw5Kuo0ArRcNUfkmw3ApHo1j2qxGByfwzyydm5kPhahXLWiKi5XUa2mzXRGNZGvr',
        widthPx: 3000,
        heightPx: 4000,
        authorAttributions: [
          {
            displayName: 'Marigrace Tan',
            uri: '//maps.google.com/maps/contrib/101513076857017583237',
            photoUri:
              '//lh3.googleusercontent.com/a/ACg8ocJs09p3CF-CX7af0fcJAcvH-6Plqi3sUvXMqyCTsePq6l-zeg=s100-p-k-no-mo',
          },
        ],
      },
      {
        name: 'places/ChIJFZ2L_bPRrjMR4uA8KKuCulI/photos/AUc7tXUhRl1v_quuADiPtGToIh6Y9wVIrIlKpL-IOJWdBNbKuAbZ6tO22EhpqvBfBhUB_NbyPyx-xU6ai0yzXDVoVOSQhTUJGSd9sW6ivtnzz4eD67UHT7F2bXaj0_cBODPyPHHm0n0vVyJBp9llqrHGQ1e9V1tyL2NaCyn3',
        widthPx: 3468,
        heightPx: 4624,
        authorAttributions: [
          {
            displayName: 'Alex Perido',
            uri: '//maps.google.com/maps/contrib/108484318132579216602',
            photoUri:
              '//lh3.googleusercontent.com/a/ACg8ocIdJ7_pp3eYTVwSifO0jMSvx0DVDkFK0A3yOVhsPHgS_uoTRw=s100-p-k-no-mo',
          },
        ],
      },
    ],
  },
  {
    id: 'ChIJT6_UWbHRrjMRNy54Q3RmTdE',
    types: [
      'auto_parts_store',
      'car_repair',
      'point_of_interest',
      'store',
      'establishment',
    ],
    location: {
      latitude: 10.667400299999999,
      longitude: 122.9496677,
    },
    rating: 3.9,
    googleMapsUri: 'https://maps.google.com/?cid=15081823376667848247',
    userRatingCount: 7,
    displayName: {
      text: 'NEGROS PIONEER ENTERPRISES, INC.',
      languageCode: 'en',
    },
    shortFormattedAddress: 'MW8X+XV7, Lacson St, Bacolod',
  },
]
