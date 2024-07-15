import { images } from '#/utils/theme'

export interface Category {
  id: number
  name: string
  imgUrl?: string
  img_url?: string
}
export const category = [
  {
    id: 1,
    name: 'Maintenance',
    imgUrl: images.car_maintenance,
  },
  {
    id: 2,
    name: 'Aircon',
    imgUrl: images.aircon,
  },
  {
    id: 3,
    name: 'Tires',
    imgUrl: images.tires,
  },
  {
    id: 4,
    name: 'Engine',
    imgUrl: images.engine,
  },
  {
    id: 5,
    name: 'Car Wash',
    imgUrl: images.car_wash_cat,
  },
  {
    id: 6,
    name: 'Clutch System',
    imgUrl: images.brake,
  },
  {
    id: 7,
    name: 'Electrical',
    imgUrl: images.electricals,
  },
  {
    id: 8,
    name: 'Painting',
    imgUrl: images.painting,
  },
  {
    id: 9,
    name: 'Denting',
    imgUrl: images.denting,
  },
  {
    id: 10,
    name: 'Upholstery',
    imgUrl: images.upholstery,
  },
]
