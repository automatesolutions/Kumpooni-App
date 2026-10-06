/**
 * What a repair file can be about. Stored in vehicle.kind (the table keeps its
 * old name so the mobile app still works).
 *
 * - vehicle: brand, model, year, plate, VIN. You take it to the shop.
 * - device: brand, model, serial. You take it to the shop.
 * - place: a name like "Kitchen roof". The worker comes to you.
 */
export const ITEM_KINDS = [
  'car',
  'motorcycle',
  'home',
  'construction',
  'electrical',
  'aircon',
  'appliance',
  'computer',
  'phone',
  'other',
] as const

export type ItemKind = (typeof ITEM_KINDS)[number]
export type KindGroup = 'vehicle' | 'device' | 'place'

type KindInfo = {
  label: string
  group: KindGroup
  /** "my ___" in a letter when the item has no name. */
  noun: string
  nounFil: string
  /** Placeholders on the add form. */
  brandHint?: string
  modelHint: string
  /** Placeholder for "What's wrong" when starting a file. */
  problemHint: string
}

/** Who does the work, by group, for the shop box on the start page. */
export const SHOP_LABEL: Record<KindGroup, {label: string; hint: string}> = {
  vehicle: {label: 'Shop or dealer', hint: 'Name on the sign or the receipt'},
  device: {label: 'Shop or service center', hint: 'Name on the sign or the receipt'},
  place: {label: 'Contractor or worker', hint: 'Company name, or the worker’s name'},
}

export const KIND_INFO: Record<ItemKind, KindInfo> = {
  car: {
    label: 'Car',
    group: 'vehicle',
    noun: 'car',
    nounFil: 'kotse',
    modelHint: '',
    problemHint: 'Engine light came back after the tune-up',
  },
  motorcycle: {
    label: 'Motorcycle',
    group: 'vehicle',
    noun: 'motorcycle',
    nounFil: 'motorsiklo',
    brandHint: 'Honda, Yamaha, Suzuki…',
    modelHint: 'Click 125i, NMAX, Raider…',
    problemHint: 'Brakes still squeak after the PMS',
  },
  home: {
    label: 'Home repair',
    group: 'place',
    noun: 'home',
    nounFil: 'bahay',
    modelHint: 'Kitchen sink, roof, bathroom tiles…',
    problemHint: 'Bathroom ceiling still leaks after the repair',
  },
  construction: {
    label: 'Construction',
    group: 'place',
    noun: 'construction project',
    nounFil: 'pinapagawang bahay',
    modelHint: 'Second floor extension, fence, kitchen renovation…',
    problemHint: 'Contractor stopped work after the down payment',
  },
  electrical: {
    label: 'Electrical',
    group: 'place',
    noun: 'electrical wiring',
    nounFil: 'kable ng kuryente',
    modelHint: 'House rewiring, breaker panel, outlets…',
    problemHint: 'Breaker still trips after the rewiring',
  },
  aircon: {
    label: 'Aircon',
    group: 'device',
    noun: 'aircon',
    nounFil: 'aircon',
    brandHint: 'Carrier, Koppel, Daikin…',
    modelHint: '1.5 HP split type, window type…',
    problemHint: 'Aircon blows warm after 10 minutes',
  },
  appliance: {
    label: 'Appliance or electronics',
    group: 'device',
    noun: 'appliance',
    nounFil: 'appliance',
    brandHint: 'Samsung, LG, Sharp…',
    modelHint: '55 inch TV, ref, washing machine…',
    problemHint: 'TV has no picture again after the board repair',
  },
  computer: {
    label: 'Computer',
    group: 'device',
    noun: 'computer',
    nounFil: 'computer',
    brandHint: 'Lenovo, Asus, Acer, custom build…',
    modelHint: 'IdeaPad 5, gaming PC…',
    problemHint: 'Laptop shuts down after the screen replacement',
  },
  phone: {
    label: 'Phone or tablet',
    group: 'device',
    noun: 'phone',
    nounFil: 'cellphone',
    brandHint: 'Samsung, Apple, Xiaomi…',
    modelHint: 'Galaxy A55, iPhone 13…',
    problemHint: 'Phone does not charge after the battery change',
  },
  other: {
    label: 'Something else',
    group: 'place',
    noun: 'item',
    nounFil: 'gamit',
    modelHint: 'Water heater, gate motor, sofa…',
    problemHint: 'Gate motor stopped again a week after the fix',
  },
}

export function kindInfo(kind: ItemKind | null | undefined) {
  return (kind && KIND_INFO[kind]) || KIND_INFO.other
}

export function kindLabel(kind: ItemKind | null | undefined) {
  return kindInfo(kind).label
}

export function kindGroup(kind: ItemKind | null | undefined): KindGroup {
  return kindInfo(kind).group
}
