export const CAR_MODELS = ['MINI COOPER', 'MAZDA', 'KIA RIO', 'TOYOTA'] as const;
export type CarModel = (typeof CAR_MODELS)[number];

export interface Car {
  model:       CarModel;
  name:        string;
  color:       string;
  image_emoji: string;
  plate?:      string;
}

export const CARS_REGISTRY: Record<CarModel, Car> = {
  'MINI COOPER': {
    model:       'MINI COOPER',
    name:        'Mini Cooper',
    color:       'Червона',
    image_emoji: '🚗',
  },
  'MAZDA': {
    model:       'MAZDA',
    name:        'Mazda 3',
    color:       'Темно-сіра',
    image_emoji: '🚘',
  },
  'KIA RIO': {
    model:       'KIA RIO',
    name:        'Kia Rio',
    color:       'Сіро-бежева',
    image_emoji: '🚙',
    plate:       'СВ9942АС',
  },
  'TOYOTA': {
    model:       'TOYOTA',
    name:        'Toyota Corolla',
    color:       'Сіра',
    image_emoji: '🚕',
    plate:       'СВ9028ВА',
  },
};

export function getAllCars(): Car[] {
  return CAR_MODELS.map((m) => CARS_REGISTRY[m]);
}

export function getCarByModel(model: string): Car | null {
  return CARS_REGISTRY[model as CarModel] ?? null;
}

export function isValidCarModel(value: string): value is CarModel {
  return (CAR_MODELS as readonly string[]).includes(value);
}