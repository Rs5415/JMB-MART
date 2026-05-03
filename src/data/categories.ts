export interface SubCategory {
  name: string;
  icon: string;
  image?: string;
}

export interface CategoryGroup {
  id: string;
  name: string;
  tagline?: string;
  subCategories: SubCategory[];
}

export interface SidebarCategory {
  id: string;
  name: string;
  icon: string;
  groups: CategoryGroup[];
}

export const CATEGORY_DATA: SidebarCategory[] = [
  {
    id: 'groceries',
    name: 'Groceries',
    icon: '🏢',
    groups: [
      {
        id: 'fresh',
        name: 'Fresh',
        subCategories: [
          { name: 'Fresh Vegetables', icon: '🥦', image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=200&h=200&fit=crop&q=80' },
          { name: 'Fresh Fruits', icon: '🍎', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&h=200&fit=crop&q=80' },
          { name: 'Cakes, Rusk & More', icon: '🍰', image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=200&h=200&fit=crop&q=80' },
          { name: 'Batter & Chutney', icon: '🥣', image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=200&h=200&fit=crop&q=80' },
          { name: 'Breads & Chapatis', icon: '🍞', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop&q=80' },
          { name: 'Milk & Milk Products', icon: '🥛', image: 'https://images.unsplash.com/photo-1550583724-125581cc2532?w=200&h=200&fit=crop&q=80' },
          { name: 'Cheese, Paneer & Tofu', icon: '🧀', image: 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=200&h=200&fit=crop&q=80' },
          { name: 'Ice Cream & Frozen', icon: '🍦', image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=200&h=200&fit=crop&q=80' },
        ]
      },
      {
        id: 'biscuits-drinks',
        name: 'Biscuits, Drinks & Packaged Food',
        subCategories: [
          { name: 'Chips & Namkeens', icon: '🍟', image: 'https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=200&h=200&fit=crop&q=80' },
          { name: 'Biscuits & Cookies', icon: '🍪', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&h=200&fit=crop&q=80' },
          { name: 'Chocolates & Candies', icon: '🍫', image: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=200&h=200&fit=crop&q=80' },
          { name: 'Indian Sweets', icon: '🍬', image: 'https://images.unsplash.com/photo-1605192554106-d549b1b975cd?w=200&h=200&fit=crop&q=80' },
          { name: 'Drinks & Juices', icon: '🥤', image: 'https://images.unsplash.com/photo-1622483767028-3f66f36145ca?w=200&h=200&fit=crop&q=80' },
          { name: 'Breakfast Cereals', icon: '🥣', image: 'https://images.unsplash.com/photo-1521482772590-761356e9c600?w=200&h=200&fit=crop&q=80' },
          { name: 'Noodles, Pasta & Vermicelli', icon: '🍜', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop&q=80' },
          { name: 'Ready to Cook & Eat', icon: '🍱', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop&q=80' },
          { name: 'Spread, Sauces & Ketchup', icon: '🥫', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&h=200&fit=crop&q=80' },
          { name: 'Pickles & Chutney', icon: '🍯', image: 'https://images.unsplash.com/photo-1589135398309-1cd44a5b9cbd?w=200&h=200&fit=crop&q=80' },
          { name: 'Tea & Coffee', icon: '☕', image: 'https://images.unsplash.com/photo-1544787210-22c165939db0?w=200&h=200&fit=crop&q=80' },
        ]
      },
      {
        id: 'cooking-essentials',
        name: 'Cooking Essentials',
        subCategories: [
          { name: 'Atta, Flours & Sooji', icon: '🌾', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop&q=80' },
          { name: 'Dals & Pulses', icon: '🍛', image: 'https://images.unsplash.com/photo-1585993439219-c11b037d5a77?w=200&h=200&fit=crop&q=80' },
          { name: 'Rice', icon: '🍚', image: 'https://images.unsplash.com/photo-1586201327102-337514b89eb7?w=200&h=200&fit=crop&q=80' },
          { name: 'Salt, Sugar & Jaggery', icon: '🧂', image: 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=200&h=200&fit=crop&q=80' },
          { name: 'Wheat & Soya', icon: '🌾', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&h=200&fit=crop&q=80' },
          { name: 'Ghee', icon: '🧈', image: 'https://images.unsplash.com/photo-1631557253503-4f923c6d482a?w=200&h=200&fit=crop&q=80' },
          { name: 'Dry Fruits & Nuts', icon: '🥜', image: 'https://images.unsplash.com/photo-1536620453303-4f515c1e9b2f?w=200&h=200&fit=crop&q=80' },
          { name: 'Millets & Organic', icon: '🥣', image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=200&h=200&fit=crop&q=80' },
        ]
      },
      {
        id: 'personal-care',
        name: 'Personal Care',
        subCategories: [
          { name: 'Hair Care', icon: '🧴', image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=200&h=200&fit=crop&q=80' },
          { name: 'Bath & Hand Wash', icon: '🧼', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&h=200&fit=crop&q=80' },
          { name: 'Oral Care', icon: '🪥', image: 'https://images.unsplash.com/photo-1559590126-72990cb8c962?w=200&h=200&fit=crop&q=80' },
          { name: 'Skin Care', icon: '🧖‍♀️', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&h=200&fit=crop&q=80' },
          { name: 'Feminine Hygiene', icon: '👗', image: 'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=200&h=200&fit=crop&q=80' },
          { name: "Men's Grooming", icon: '🪒', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&h=200&fit=crop&q=80' },
        ]
      },
      {
        id: 'beauty',
        name: 'Beauty',
        subCategories: [
          { name: 'Face', icon: '💄', image: 'https://images.unsplash.com/photo-1522335789203-aa9fb8381287?w=200&h=200&fit=crop&q=80' },
          { name: 'Nails & Lips', icon: '💅', image: 'https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=200&h=200&fit=crop&q=80' },
          { name: 'Eyes', icon: '👁️', image: 'https://images.unsplash.com/photo-1583241475862-595085444ca4?w=200&h=200&fit=crop&q=80' },
          { name: 'Beauty Accessories', icon: '🎀', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?w=200&h=200&fit=crop&q=80' },
        ]
      },
      {
        id: 'mom-baby',
        name: 'Mom & Baby Care',
        subCategories: [
          { name: 'Diapers & Wipes', icon: '👶', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=200&h=200&fit=crop&q=80' },
          { name: 'Bath, Hygiene & Care', icon: '🧴', image: 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=200&h=200&fit=crop&q=80' },
          { name: 'Food & Feeding', icon: '🍼', image: 'https://images.unsplash.com/photo-1522771935873-199af2f12ee5?w=200&h=200&fit=crop&q=80' },
          { name: 'Bedding, Toys & Acc.', icon: '🧸', image: 'https://images.unsplash.com/photo-1535572290543-960a8046f5af?w=200&h=200&fit=crop&q=80' },
        ]
      },
      {
        id: 'home',
        name: 'Home',
        subCategories: [
          { name: 'Home & Cleaning Tools', icon: '🧹', image: 'https://images.unsplash.com/photo-1584622781564-1d9876a31f13?w=200&h=200&fit=crop&q=80' },
          { name: 'Pooja Needs', icon: '🕯️', image: 'https://images.unsplash.com/photo-1621245053420-5cc278ca90fb?w=200&h=200&fit=crop&q=80' },
          { name: 'Basic Electricals', icon: '💡', image: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=200&h=200&fit=crop&q=80' },
          { name: 'Furnishing & Personal', icon: '🛌', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&h=200&fit=crop&q=80' },
          { name: 'Decor & Gifting', icon: '🎁', image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=200&h=200&fit=crop&q=80' },
          { name: 'Games, Toys & Act.', icon: '🎲', image: 'https://images.unsplash.com/photo-1558223843-ea7d27e8a939?w=200&h=200&fit=crop&q=80' },
          { name: 'Home Needs', icon: '🏠', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&h=200&fit=crop&q=80' },
        ]
      },
      {
        id: 'kitchenware',
        name: 'Kitchenware',
        subCategories: [
          { name: 'Gas Stove', icon: '🔥', image: 'https://images.unsplash.com/photo-1522339223543-d6383fa64386?w=200&h=200&fit=crop&q=80' },
          { name: 'Pots & Pans', icon: '🍳', image: 'https://images.unsplash.com/photo-1584990344469-5a8b30e9282b?w=200&h=200&fit=crop&q=80' },
          { name: 'Containers & Storage', icon: '🫙', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&h=200&fit=crop&q=80' },
          { name: 'Flask, Bottle & Tiffin', icon: '🧪', image: 'https://images.unsplash.com/photo-1551021703-355fe14643b7?w=200&h=200&fit=crop&q=80' },
          { name: 'Cutting & Chopping', icon: '🔪', image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=200&h=200&fit=crop&q=80' },
          { name: 'Kitchen Tools', icon: '🍴', image: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=200&h=200&fit=crop&q=80' },
          { name: 'Bakeware', icon: '🥧', image: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=200&h=200&fit=crop&q=80' },
        ]
      },
      {
        id: 'tableware',
        name: 'Tableware',
        subCategories: [
          { name: 'Dining', icon: '🍽️', image: 'https://images.unsplash.com/photo-1577221084712-45b0445d2b00?w=200&h=200&fit=crop&q=80' },
          { name: 'Cups, Mugs & more', icon: '☕', image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=200&h=200&fit=crop&q=80' },
          { name: 'Cutlery', icon: '🍴', image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=200&h=200&fit=crop&q=80' },
          { name: 'Barware', icon: '🍷', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=200&h=200&fit=crop&q=80' },
        ]
      },
      {
        id: 'home-care',
        name: 'Home Care',
        subCategories: [
          { name: 'Dishwash', icon: '🧽', image: 'https://images.unsplash.com/photo-1584622781564-1d9876a31f13?w=200&h=200&fit=crop&q=80' },
          { name: 'Detergents & Cleaners', icon: '🧴', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&h=200&fit=crop&q=80' },
          { name: 'Fresheners & Repellents', icon: '🌬️', image: 'https://images.unsplash.com/photo-1622262911369-075f8263e80c?w=200&h=200&fit=crop&q=80' },
          { name: 'Bags & Travel Luggage', icon: '🧳', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop&q=80' },
          { name: 'Furniture', icon: '🪑', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop&q=80' },
        ]
      }
    ]
  },
  {
    id: 'fashion',
    name: 'Fashion',
    icon: '👗',
    groups: [
      {
        id: 'mens-wear',
        name: 'Men\'s Wear',
        subCategories: [
          { name: 'T-Shirts', icon: '👕', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop&q=80' },
          { name: 'Shirts', icon: '👔', image: 'https://images.unsplash.com/photo-1596755094514-f87034a7a28d?w=200&h=200&fit=crop&q=80' },
          { name: 'Jeans', icon: '👖', image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=200&h=200&fit=crop&q=80' },
        ]
      },
      {
        id: 'womens-wear',
        name: 'Women\'s Wear',
        subCategories: [
          { name: 'Kurtas', icon: '👗', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop&q=80' },
          { name: 'Sarees', icon: '👗', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&h=200&fit=crop&q=80' },
          { name: 'Tops', icon: '👚', image: 'https://images.unsplash.com/photo-1583911300263-d39581358175?w=200&h=200&fit=crop&q=80' },
        ]
      }
    ]
  }
];
