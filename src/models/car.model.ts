export const CAR_MODELS = ['MAZDA', 'KIA RIO', 'TOYOTA', 'MINI COOPER'] as const;
export type CarModel = (typeof CAR_MODELS)[number];

export interface Car {
  model: CarModel;
  name: string;
  color: string;
  image_emoji: string;
}

export const CARS_REGISTRY: Record<CarModel, Car> = {
  'MAZDA': {
    model:       'MAZDA',
    name:        'Mazda 3',
    color:       'Червона',
    image_emoji: '🚗',
  },
  'KIA RIO': {
    model:       'KIA RIO',
    name:        'Kia Rio',
    color:       'Біла',
    image_emoji: '🚙',
  },
  'TOYOTA': {
    model:       'TOYOTA',
    name:        'Toyota Camry',
    color:       'Чорна',
    image_emoji: '🏎️',
  },
  'MINI COOPER': {
    model:       'MINI COOPER',
    name:        'Mini Cooper',
    color:       'Синя',
    image_emoji: '🚓',
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