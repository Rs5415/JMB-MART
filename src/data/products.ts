export interface Product {
  id: string;
  name: string;
  price: number;
  mrp?: number | null;
  category: string;
  image: string;
  description: string;
  inStock?: boolean;
  status?: 'available' | 'out_of_stock' | 'unavailable';
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Basmati Rice (5kg)',
    price: 450,
    category: 'Grains',
    image: 'https://picsum.photos/seed/rice/400/400',
    description: 'Premium long-grain basmati rice for your daily meals.',
    inStock: true
  },
  {
    id: '2',
    name: 'Mustard Oil (1L)',
    price: 180,
    category: 'Oil',
    image: 'https://picsum.photos/seed/oil/400/400',
    description: 'Pure and pungent mustard oil for traditional cooking.',
    inStock: true
  },
  {
    id: '3',
    name: 'Bathing Soap (Pack of 3)',
    price: 120,
    category: 'Personal Care',
    image: 'https://picsum.photos/seed/soap/400/400',
    description: 'Refreshing soap with natural extracts.',
    inStock: true
  },
  {
    id: '4',
    name: 'Wheat Flour (10kg)',
    price: 380,
    category: 'Grains',
    image: 'https://picsum.photos/seed/flour/400/400',
    description: 'Freshly ground wheat flour for soft rotis.',
    inStock: true
  },
  {
    id: '5',
    name: 'Refined Sunflower Oil (1L)',
    price: 165,
    category: 'Oil',
    image: 'https://picsum.photos/seed/sunflower/400/400',
    description: 'Healthy refined oil for all types of frying.',
    inStock: true
  },
  {
    id: '6',
    name: 'Detergent Powder (1kg)',
    price: 95,
    category: 'Household',
    image: 'https://picsum.photos/seed/detergent/400/400',
    description: 'Powerful stain removal for your clothes.',
    inStock: true
  },
  {
    id: '7',
    name: 'Toor Dal (1kg)',
    price: 140,
    category: 'Pulses',
    image: 'https://picsum.photos/seed/dal/400/400',
    description: 'High-quality pulses for a protein-rich diet.',
    inStock: true
  },
  {
    id: '8',
    name: 'Sugar (1kg)',
    price: 45,
    category: 'Essentials',
    image: 'https://picsum.photos/seed/sugar/400/400',
    description: 'Fine granulated sugar for your tea and sweets.',
    inStock: true
  }
];
