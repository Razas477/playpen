import { CategoryDirectoryItem, HeroChapter, Product } from '../types/store';

export const PLAYPEN_IMAGES = {
  // Product 1: Versatile Foldable Baby Play Mat – 120x120x1cm (4 images in exact PDF order)
  p1_1: '/assets/products/p1_mat_120_1.jpg',
  p1_2: '/assets/products/p1_mat_120_2.jpg',
  p1_3: '/assets/products/p1_mat_120_3.jpg',
  p1_4: '/assets/products/p1_mat_120_4.jpg',

  // Product 2: Baby Playpen Fence with 10 Balls & 2 Pull Rings (3 images in exact PDF order)
  p2_1: '/assets/products/p2_playpen_10balls_1.jpg',
  p2_2: '/assets/products/p2_playpen_10balls_2.jpg',
  p2_3: '/assets/products/p2_playpen_10balls_3.jpg',

  // Product 3: 100 Pcs Soft & Colorful 5.5cm Ocean Balls (4 images in exact PDF order)
  p3_1: '/assets/products/p3_balls_100pcs_1.jpg',
  p3_2: '/assets/products/p3_balls_100pcs_2.jpg',
  p3_3: '/assets/products/p3_balls_100pcs_3.jpg',
  p3_4: '/assets/products/p3_balls_100pcs_4.jpg',

  // Product 4: Baby Playpen Extra Large with Gate (4 images in exact PDF order)
  p4_1: '/assets/products/p4_playpen_gate_xl_1.jpg',
  p4_2: '/assets/products/p4_playpen_gate_xl_2.jpg',
  p4_3: '/assets/products/p4_playpen_gate_xl_3.jpg',
  p4_4: '/assets/products/p4_playpen_gate_xl_4.jpg',

  // Product 5: Baby & Toddler Playpen Fence with Soft Play Mat & 50 Pit Balls (4 images in exact PDF order)
  p5_1: '/assets/products/p5_playpen_mat_50balls_1.jpg',
  p5_2: '/assets/products/p5_playpen_mat_50balls_2.jpg',
  p5_3: '/assets/products/p5_playpen_mat_50balls_3.jpg',
  p5_4: '/assets/products/p5_playpen_mat_50balls_4.jpg',

  // Product 6: Baby Playpen with 2 Pull Rings and Carry Bag (3 images in exact PDF order)
  p6_1: '/assets/products/p6_playpen_bag_rings_1.jpg',
  p6_2: '/assets/products/p6_playpen_bag_rings_2.jpg',
  p6_3: '/assets/products/p6_playpen_bag_rings_3.jpg',

  // Product 7: Foldable Baby Play Mat 150x180x1.3cm (4 images in exact PDF order)
  p7_1: '/assets/products/p7_mat_150x180_1.jpg',
  p7_2: '/assets/products/p7_mat_150x180_2.jpg',
  p7_3: '/assets/products/p7_mat_150x180_3.jpg',
  p7_4: '/assets/products/p7_mat_150x180_4.jpg',

  // Product 8: 50 PCS Plastic Ball Pit Balls 5.5cm (4 images in exact PDF order)
  p8_1: '/assets/products/p8_balls_50pcs_1.jpg',
  p8_2: '/assets/products/p8_balls_50pcs_2.jpg',
  p8_3: '/assets/products/p8_balls_50pcs_3.jpg',
  p8_4: '/assets/products/p8_balls_50pcs_4.jpg',

  // Product 9: Multicolor Baby Playpen with Balls, Basketball & Accessories (4 images in exact PDF order)
  p9_1: '/assets/products/p9_playpen_basketball_1.jpg',
  p9_2: '/assets/products/p9_playpen_basketball_2.jpg',
  p9_3: '/assets/products/p9_playpen_basketball_3.jpg',
  p9_4: '/assets/products/p9_playpen_basketball_4.jpg',
} as const;

export function roundCurrency(amount: number): number {
  return Math.round((Number(amount) || 0) * 100) / 100;
}

export function formatAed(amount: number): string {
  return `AED ${roundCurrency(amount).toLocaleString('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getProductUnitPrice(product: Product, selectedSize?: string): number {
  if (selectedSize && product.sizePricesAed && selectedSize in product.sizePricesAed) {
    return roundCurrency(product.sizePricesAed[selectedSize]);
  }
  return roundCurrency(product.priceAed);
}

export const PRODUCTS: Product[] = [
  // 1. Versatile Foldable Baby Play Mat – 120x120x1cm
  {
    id: 'versatile-foldable-baby-play-mat-120x120',
    name: 'Versatile Foldable Baby Play Mat – Waterproof, Easy-to-Clean, Ideal for Infants and Toddlers – 120x120x1cm – Indoor/Outdoor Use',
    subtitle: 'Waterproof, double-sided cushioned XPE foam play mat',
    category: 'foldable',
    categoryLabel: 'Foldable Play Mats',
    subCategory: 'Waterproof XPE Play Mat',
    priceAed: 1155,
    originalPriceAed: 1300,
    rating: 5,
    reviewCount: 5,
    image: PLAYPEN_IMAGES.p1_1,
    aspect: '4:3',
    dimensions: '120 × 120 × 1 cm',
    dimensionsGroup: 'Compact',
    material: 'Waterproof XPE Foam with Anti-Microbial Non-Slip Surface',
    materialGroup: 'Waterproof XPE Foam',
    weightCapacity: 'Cushioned 1 cm high-density foam',
    ageSuitability: '0 – 48 Months',
    safetySpecs: [
      'Waterproof, dustproof, and anti-microbial XPE surface',
      'Non-slip textured pattern keeps crawling babies steady',
      'Soft 1 cm cushioning protects knees and elbows during tummy time',
      'BPA-free, odorless, and safe for sensitive baby skin',
    ],
    foldingAndStorage:
      'Folds quickly along neat crease panels so you can tuck it beside a sofa, inside a closet, or into a car trunk.',
    deliveryInfo:
      'Free UAE delivery on orders over AED 750. Cash on Delivery available across all 7 Emirates.',
    careNote: 'Just wipe spills, milk, or dirt with a damp cloth in seconds.',
    originNote: 'Designed for indoor living rooms and outdoor patio or park play.',
    sizes: ['120 × 120 × 1 cm'],
    gallery: [
      { label: 'Waterproof Surface', src: PLAYPEN_IMAGES.p1_1, objectPosition: '50% 50%' },
      { label: 'Double-Sided Design', src: PLAYPEN_IMAGES.p1_2, objectPosition: '50% 50%' },
      { label: 'Floor Setup', src: PLAYPEN_IMAGES.p1_3, objectPosition: '50% 50%' },
      { label: 'Playtime View', src: PLAYPEN_IMAGES.p1_4, objectPosition: '50% 50%' },
    ],
    colors: [{ name: 'Reversible Road & Bear Print', hex: '#D8D2C5' }],
    description:
      'A soft, waterproof foldable baby play mat built for safe tummy time, rolling, crawling, and toddler play. Simply wipe clean after messy playtime and fold flat when you are done.',
    benefits: [
      'Enhance Development: Stimulates sensory growth, coordination, and spatial awareness.',
      'Tummy Time Fun: Encourages neck and core strength in comfort.',
      'Safety First: Thick cushioned surface shields babies from hard tile or wood floors.',
      'Bonding and Interaction: Large 120 × 120 cm surface lets parents sit and play together.',
      'Spark Imagination: Engaging city road and animal artwork invites creative play.',
    ],
    bundleIncludes: ['1 Reversible Foldable Baby Play Mat (120 × 120 × 1 cm)'],
    featuredTag: 'Sale · Save AED 145',
    inStock: true,
    isFeatured: true,
    isBestSeller: true,
    active: true,
  },

  // 2. Extensively Useful Baby Playpen – 10 Non-Toxic Pit Balls & 2 Pull Rings (No Bag Included)
  {
    id: 'baby-playpen-fence-10-balls-2-rings-120x120',
    name: 'Extensively Useful Baby Playpen – Elegant Baby Playpen Fence with 10 Non-Toxic Pit Balls & 2 Pull Rings, Baby Play Yard (120 x 120 cm) – No Bag Included',
    subtitle: 'Breathable mesh play yard with 10 pit balls and 2 pull rings',
    category: 'mesh',
    categoryLabel: 'Mesh Playpens',
    subCategory: 'Cationic Mesh Playpen',
    priceAed: 120,
    rating: 5,
    reviewCount: 5,
    image: PLAYPEN_IMAGES.p2_1,
    aspect: '4:3',
    dimensions: '120 × 120 × 65 cm',
    dimensionsGroup: 'Standard',
    material: '300D Cationic Fabric, Breathable Mesh & Steel Tube Frame',
    materialGroup: 'Breathable Mesh & Cationic',
    weightCapacity: 'Up to 30 kg',
    ageSuitability: '0 – 36 Months',
    safetySpecs: [
      '360-degree breathable mesh walls keep airflow fresh and baby in clear view',
      'Anti-pinch joints and soft fabric-covered corner connectors',
      'Outer zippered crawl gate lets toddlers enter safely only when opened by parents',
      'Includes 2 sturdy pull rings to help babies practice standing',
    ],
    foldingAndStorage:
      'Lightweight steel poles and T-connectors disassemble cleanly with zero tools required (no carry bag included).',
    deliveryInfo: 'In stock for fast UAE courier delivery with Cash on Delivery.',
    careNote: 'Wipe the cationic fabric and mesh panels with mild soapy water.',
    originNote: 'Compact 120 × 120 cm square footprint fits effortlessly in apartments.',
    sizes: ['120cm x 120cm'],
    gallery: [
      { label: 'Full Playpen View', src: PLAYPEN_IMAGES.p2_1, objectPosition: '50% 50%' },
      { label: 'Mesh & Zipper Door', src: PLAYPEN_IMAGES.p2_2, objectPosition: '50% 50%' },
      { label: 'Play Yard Setup', src: PLAYPEN_IMAGES.p2_3, objectPosition: '50% 50%' },
    ],
    colors: [{ name: 'Soft Dove Grey', hex: '#B3B7BC' }],
    description:
      'An easy-to-assemble baby playpen fence made with cationic fabric and breathable mesh sides. Gives babies a safe play zone with 10 non-toxic pit balls and 2 pull rings included (no bag included).',
    benefits: [
      'Breathable see-through mesh lets you keep an eye on your child from any angle',
      'Includes 10 non-toxic pit balls and 2 easy-grip pull rings for standing practice',
      'Tool-free push-fit frame sets up in minutes inside living rooms or bedrooms',
    ],
    bundleIncludes: [
      '1 Baby Playpen Fence (120 × 120 cm)',
      '10 Non-Toxic Ocean Pit Balls',
      '2 Detachable Pull Rings (No Bag Included)',
    ],
    featuredTag: 'Great Value',
    inStock: true,
    isFeatured: true,
    isBestSeller: true,
    active: true,
  },

  // 3. 100 Pcs Soft & Colorful 5.5cm Ocean Balls
  {
    id: '100-pcs-soft-colorful-55mm-ocean-balls',
    name: '100 Pcs Soft & Colorful 5.5cm Ocean Balls – Perfect for Ball Pits & Play Areas for Kids',
    subtitle: 'Pack of 100 crush-proof, BPA-free 5.5 cm ball pit balls',
    category: 'balls',
    categoryLabel: 'Ocean Ball Sets',
    subCategory: '100-Piece Play Balls',
    priceAed: 69.99,
    rating: 5,
    reviewCount: 5,
    image: PLAYPEN_IMAGES.p3_1,
    aspect: '4:3',
    dimensions: '5.5 cm (2.17 in) diameter · 100 pcs',
    dimensionsGroup: 'Compact',
    material: '100% Phthalate-Free, BPA-Free & Lead-Free PE Plastic',
    materialGroup: 'BPA-Free PE Plastic',
    weightCapacity: 'Crush-proof up to 100+ lbs pressure',
    ageSuitability: '6 – 60 Months',
    safetySpecs: [
      'Safe 5.5 cm diameter sized carefully to prevent swallowing risks',
      'Made from non-toxic, phthalate-free, BPA-free, and lead-free virgin PE',
      'Smooth burr-free seams are gentle on baby hands and faces',
      'Flexible crush-proof wall bounces right back after squeezing',
    ],
    foldingAndStorage:
      'Lightweight and easy to store inside any mesh playpen, toy basket, or kids tent.',
    deliveryInfo: 'Ships quickly across Dubai, Abu Dhabi, and all UAE Emirates.',
    careNote: 'Rinse with warm water and mild soap, then air dry.',
    originNote: 'Tested for durability in active ball pits and baby playpens.',
    sizes: ['5.5cm'],
    gallery: [
      { label: '7 Bright Colors', src: PLAYPEN_IMAGES.p3_1, objectPosition: '50% 50%' },
      { label: 'Soft & Safe', src: PLAYPEN_IMAGES.p3_2, objectPosition: '50% 50%' },
      { label: 'Size & Material', src: PLAYPEN_IMAGES.p3_3, objectPosition: '50% 50%' },
      { label: 'Ball Pit Fun', src: PLAYPEN_IMAGES.p3_4, objectPosition: '50% 50%' },
    ],
    colors: [{ name: '7 Bright Colors Mix', hex: '#4FA3D1' }],
    description:
      'Add instant color and excitement to any baby playpen, ball pit, or kiddie pool. This 100-piece set features soft, crush-proof 5.5 cm balls in seven cheerful non-toxic colors.',
    benefits: [
      'Supports color recognition, counting, throwing, and motor skill development',
      'Strong enough to handle over 100 lbs of weight without cracking',
      'BPA-free, non-PVC plastic with smooth child-safe edges',
    ],
    bundleIncludes: ['100 × 5.5 cm Soft Ocean Pit Balls in 7 Colors'],
    featuredTag: '100-Pack',
    inStock: true,
    isNewArrival: true,
    active: true,
  },

  // 4. Baby Playpen Extra Large – Portable Play Yard with Gate (120 x 120 cm)
  {
    id: 'baby-playpen-extra-large-gate-120x120',
    name: 'Baby Playpen Extra Large – Portable Play Yard with Gate, Safe Activity Center for Toddlers & Babies with Balls and Accessories (120 x 120 cm)',
    subtitle: 'Sturdy HDPE panel play yard with frog activity gate & basketball hoop',
    category: 'large',
    categoryLabel: 'Gate & Activity Playpens',
    subCategory: 'Heavy-Duty HDPE Play Yard',
    priceAed: 399,
    rating: 5,
    reviewCount: 5,
    image: PLAYPEN_IMAGES.p4_1,
    aspect: '4:3',
    dimensions: '120 × 120 cm · Thickened Panels',
    dimensionsGroup: 'Large',
    material: 'Food-Grade Thickened HDPE Panels & Non-Slip Mat',
    materialGroup: 'HDPE Activity Fence',
    weightCapacity: 'Cannot be pushed down · Heavy-duty base',
    ageSuitability: '6 – 48 Months',
    safetySpecs: [
      'Food-grade virgin HDPE material free from harmful chemicals',
      '360-degree rotatable interlocking joints keep panels locked upright',
      'External safety latch on the walk-through frog gate',
      'Smooth thickened fence panels with zero sharp edges',
    ],
    foldingAndStorage:
      'Panels fold or unclip cleanly into flat stacks for easy room-to-room moving or closet storage.',
    deliveryInfo: 'In stock with fast UAE delivery and Cash on Delivery available.',
    careNote: 'Wipe HDPE plastic panels and soft mat with a damp cloth.',
    originNote: 'Built to resist leaning and pushing as toddlers learn to stand.',
    sizes: ['120cm x 120cm'],
    gallery: [
      { label: 'Sturdy Construction', src: PLAYPEN_IMAGES.p4_1, objectPosition: '50% 50%' },
      { label: 'Activity Wall & Gate', src: PLAYPEN_IMAGES.p4_2, objectPosition: '50% 50%' },
      { label: 'Full Activity View', src: PLAYPEN_IMAGES.p4_3, objectPosition: '50% 50%' },
      { label: 'Hoop & Accessories', src: PLAYPEN_IMAGES.p4_4, objectPosition: '50% 50%' },
    ],
    colors: [{ name: 'Blue, Yellow & White', hex: '#3B5C9B' }],
    description:
      'A rock-solid extra-large activity play yard built with thickened food-grade HDPE panels that cannot be pushed over. Includes a locking safety gate, basketball hoop, spinning activity toys, pit balls, and soft floor mat.',
    benefits: [
      'Solid rotatable joints prevent tipping even when toddlers lean on the rails',
      'Walk-through gate with outer safety lock makes access effortless for parents',
      'Built-in basketball hoop and spinning toys keep toddlers engaged indoors',
    ],
    bundleIncludes: [
      'Interlocking HDPE Playpen Panels & Safety Gate',
      'Basketball Hoop & Mini Basketball',
      'Pit Balls & Soft Floor Mat',
    ],
    featuredTag: 'Activity Center',
    inStock: true,
    isFeatured: true,
    isBestSeller: true,
    active: true,
  },

  // 5. Extensively Useful Baby Playpen – With Soft Play Mat & 50 Non-Toxic Pit Balls (120 x 120 cm)
  {
    id: 'baby-toddler-playpen-mat-50-balls-120x120',
    name: 'Extensively Useful Baby Playpen – Versatile Baby & Toddler Playpen Fence with Soft Play Mat & 50 Non-Toxic Pit Balls (120 x 120 cm)',
    subtitle: 'Complete 120 × 120 cm mesh playpen bundle with padded mat & 50 balls',
    category: 'mesh',
    categoryLabel: 'Mesh Playpens',
    subCategory: 'Playpen + Mat + 50 Balls Set',
    priceAed: 189,
    originalPriceAed: 210,
    rating: 5,
    reviewCount: 5,
    image: PLAYPEN_IMAGES.p5_1,
    aspect: '4:3',
    dimensions: '120 × 120 × 65 cm',
    dimensionsGroup: 'Standard',
    material: 'Cationic Fabric, Breathable Mesh & Padded Play Mat',
    materialGroup: 'Breathable Mesh & Cationic',
    weightCapacity: 'Up to 32 kg',
    ageSuitability: '0 – 36 Months',
    safetySpecs: [
      'Soft breathable mesh walls give babies cool airflow and visibility',
      'Cushioned top corners protect against bumps',
      'External zipper door keeps little explorers safely inside',
      'Includes 50 non-toxic pit balls and matching soft play mat',
    ],
    foldingAndStorage:
      'Tool-free lightweight pipes connect in minutes and dismantle quickly for compact storage.',
    deliveryInfo: 'Ships across Dubai, Abu Dhabi, Sharjah, and all 7 Emirates.',
    careNote: 'Wipe mesh walls and play mat clean with warm soapy water.',
    originNote: 'Everything needed for an instant, ready-to-play baby corner.',
    sizes: ['120cm x 120cm'],
    gallery: [
      { label: 'Complete Bundle', src: PLAYPEN_IMAGES.p5_1, objectPosition: '50% 50%' },
      { label: 'Playpen & Pit Balls', src: PLAYPEN_IMAGES.p5_2, objectPosition: '50% 50%' },
      { label: 'Zipper Door View', src: PLAYPEN_IMAGES.p5_3, objectPosition: '50% 50%' },
      { label: 'Soft Floor Mat Detail', src: PLAYPEN_IMAGES.p5_4, objectPosition: '50% 50%' },
    ],
    colors: [{ name: 'Cool Grey Mesh', hex: '#A5A9AE' }],
    description:
      'A ready-to-use 120 × 120 cm baby playpen bundle that includes a soft padded floor mat and 50 non-toxic pit balls. Built with breathable mesh sides and durable cationic fabric for everyday comfort.',
    benefits: [
      'Complete bundle: playpen fence, cushioned play mat, and 50 pit balls',
      'Breathable mesh walls let parents keep baby in full view',
      'Tool-free assembly sets up cleanly in minutes',
    ],
    bundleIncludes: [
      '1 Breathable Mesh Playpen Fence (120 × 120 cm)',
      '1 Soft Padded Play Mat',
      '50 Non-Toxic Ocean Pit Balls',
    ],
    featuredTag: 'Sale · Save AED 21',
    inStock: true,
    isFeatured: true,
    isNewArrival: true,
    active: true,
  },

  // 6. Baby Playpen with 2 Pull Rings and Carry Bag (AED 149.00 – AED 189.99)
  {
    id: 'baby-playpen-2-pull-rings-carry-bag',
    name: 'Baby Playpen with 2 Pull Rings and Carry Bag – Portable Safe Indoor & Outdoor Playard & Activity Center, Baby Bumper Foam Play Fence with Breathable Mesh Sides',
    subtitle: 'Bumper-foam padded portable playard with 2 pull rings & carry bag',
    category: 'mesh',
    categoryLabel: 'Mesh Playpens',
    subCategory: 'Portable Playard with Carry Bag',
    priceAed: 149,
    priceRangeMaxAed: 189.99,
    sizePricesAed: {
      '120cm x 120cm': 149,
      '150cm x 180cm': 189.99,
    },
    rating: 5,
    reviewCount: 5,
    image: PLAYPEN_IMAGES.p6_1,
    aspect: '4:3',
    dimensions: '120 × 120 cm or 150 × 180 cm',
    dimensionsGroup: 'Standard',
    material: 'Cationic Fabric, Bumper Foam Padding & Breathable Mesh',
    materialGroup: 'Breathable Mesh & Cationic',
    weightCapacity: 'Up to 35 kg',
    ageSuitability: '0 – 48 Months',
    safetySpecs: [
      'Thick baby-bumper foam cushioning wraps top rails to soften accidental bumps',
      'Sturdy suction-cup corner bases keep the frame steady on smooth tile floors',
      '360-degree breathable mesh sides with external zipper entry door',
      'Includes 2 pull-up rings to encourage balance and first steps',
    ],
    foldingAndStorage:
      'Packs cleanly into the included zippered carry bag for indoor rooms, garden patios, or family travel.',
    deliveryInfo: 'Choose 120 × 120 cm (AED 149) or 150 × 180 cm (AED 189.99).',
    careNote: 'Wipe fabric and mesh sides with a damp cloth and mild soap.',
    originNote: 'Available in two sizes to fit compact bedrooms or large lounges.',
    sizes: ['120cm x 120cm', '150cm x 180cm'],
    gallery: [
      { label: 'Portable Playard View', src: PLAYPEN_IMAGES.p6_1, objectPosition: '50% 50%' },
      { label: 'Pull Rings & Mesh', src: PLAYPEN_IMAGES.p6_2, objectPosition: '50% 50%' },
      { label: 'Carry Bag Included', src: PLAYPEN_IMAGES.p6_3, objectPosition: '50% 50%' },
    ],
    colors: [{ name: 'Dove Grey & Cream', hex: '#A9ADB2' }],
    description:
      'A portable indoor and outdoor baby playard featuring soft bumper-foam padding, sturdy breathable mesh walls, an external zipper door, 2 pull rings, and a convenient carry bag.',
    benefits: [
      'Bumper-foam padded rails shield babies while learning to stand and walk',
      'Available in two roomy sizes: 120 × 120 cm and extra-wide 150 × 180 cm',
      'Includes 2 pull rings and a travel carry bag for easy storage and trips',
    ],
    bundleIncludes: [
      '1 Portable Bumper-Foam Mesh Playard',
      '2 Easy-Grip Pull Rings',
      '1 Zippered Travel Carry Bag',
    ],
    featuredTag: '2 Sizes · Carry Bag',
    inStock: true,
    isFeatured: true,
    isBestSeller: true,
    active: true,
  },

  // 7. Foldable Baby Play Mat – Large 150 x 180 cm, 1.3 cm Thick
  {
    id: 'foldable-baby-play-mat-150x180',
    name: 'Foldable Baby Play Mat – Waterproof Luxurious Foam Activity Mat for Infants, Toddlers, and Babies | Large 150 x 180 cm, 1.3 cm Thick, Indoor & Outdoor Use',
    subtitle: 'Extra-thick 1.3 cm reversible cushioned floor mat (150 × 180 cm)',
    category: 'foldable',
    categoryLabel: 'Foldable Play Mats',
    subCategory: 'Large 1.3 cm Cushioned Mat',
    priceAed: 175.5,
    rating: 5,
    reviewCount: 5,
    image: PLAYPEN_IMAGES.p7_1,
    aspect: '4:3',
    dimensions: '150 × 180 × 1.3 cm',
    dimensionsGroup: 'Large',
    material: 'High-Density Reversible XPE Foam (1.3 cm Thick)',
    materialGroup: 'Waterproof XPE Foam',
    weightCapacity: 'Extra-thick 1.3 cm impact cushioning',
    ageSuitability: '0 – 60 Months',
    safetySpecs: [
      'Extra-thick 1.3 cm XPE foam absorbs tumbles on hard marble or tile floors',
      '100% waterproof, non-toxic, and BPA-free material safe for newborns',
      'Anti-slip textured embossing gives steady traction for first steps',
      'Reversible dual-sided prints refresh your playroom look in seconds',
    ],
    foldingAndStorage:
      'Folds smoothly in seconds to fit behind furniture, inside closets, or in a carry tote.',
    deliveryInfo: 'In stock for fast delivery across Dubai, Abu Dhabi, and UAE.',
    careNote: 'Wipe clean with a damp cloth; resists stains and water absorption.',
    originNote: 'Sized generously for playpens, nurseries, and outdoor picnics.',
    sizes: ['150 × 180 cm (1.3 cm Thick)'],
    gallery: [
      { label: 'Large 150 × 180 cm Mat', src: PLAYPEN_IMAGES.p7_1, objectPosition: '50% 50%' },
      { label: '1.3 cm Thick Cushion', src: PLAYPEN_IMAGES.p7_2, objectPosition: '50% 50%' },
      { label: 'Reversible Animal Print', src: PLAYPEN_IMAGES.p7_3, objectPosition: '50% 50%' },
      { label: 'Quick-Fold Storage', src: PLAYPEN_IMAGES.p7_4, objectPosition: '50% 50%' },
    ],
    colors: [{ name: 'Reversible Safari & Track', hex: '#D4CFC3' }],
    description:
      'A spacious, luxurious 150 × 180 cm foldable baby play mat made with extra-thick 1.3 cm waterproof foam. Reversible double-sided artwork makes tummy time, crawling, and family playtime comfortable anywhere.',
    benefits: [
      'Extra-thick 1.3 cm padding keeps babies cozy and safe on hard floors',
      'Generous 150 × 180 cm size pairs easily with large playpens or open rooms',
      'Waterproof surface wipes clean effortlessly after snacks or spills',
    ],
    bundleIncludes: ['1 Large Reversible Foldable Play Mat (150 × 180 × 1.3 cm)'],
    featuredTag: '1.3 cm Extra Thick',
    inStock: true,
    isNewArrival: true,
    active: true,
  },

  // 8. 50 PCS Plastic Ball Pit Balls (5.5cm)
  {
    id: '50-pcs-plastic-ball-pit-balls-55mm',
    name: '50 PCS Plastic Ball Pit Balls (5.5cm) – Ideal for Baby Ball Pits, Playpens, Indoor & Outdoor Fun, Perfect for Kids’ Birthday Parties',
    subtitle: '50 crush-proof pastel PE balls with handy mesh storage bag',
    category: 'balls',
    categoryLabel: 'Ocean Ball Sets',
    subCategory: '50-Piece Pastel Balls + Mesh Bag',
    priceAed: 59,
    rating: 5,
    reviewCount: 5,
    image: PLAYPEN_IMAGES.p8_1,
    aspect: '4:3',
    dimensions: '5.5 cm diameter · 50 pcs + Mesh Bag',
    dimensionsGroup: 'Compact',
    material: 'BPA-Free, Phthalate-Free & Lead-Free Crush-Proof PE',
    materialGroup: 'BPA-Free PE Plastic',
    weightCapacity: 'Holds over 130 lbs without crushing',
    ageSuitability: '6 – 60 Months',
    safetySpecs: [
      '5.5 cm safe diameter designed for small hands without choking hazards',
      'Zero BPA, phthalates, or lead—100% baby-safe virgin plastic',
      'Ultra-strong crush-proof walls withstand over 130 lbs of pressure',
      'Smooth polished finish with soft pastel pink, green, and blue shades',
    ],
    foldingAndStorage:
      'Includes a lightweight mesh drawstring bag so cleanup takes seconds after playtime.',
    deliveryInfo: 'In stock for UAE-wide delivery with Cash on Delivery.',
    careNote: 'Wash inside the mesh bag with warm soapy water and air dry.',
    originNote: 'Ideal starter pack for playpens, play tents, and birthday parties.',
    sizes: ['5.5cm'],
    gallery: [
      { label: '50-Piece Pastel Set', src: PLAYPEN_IMAGES.p8_1, objectPosition: '50% 50%' },
      { label: 'Crush-Proof & BPA-Free', src: PLAYPEN_IMAGES.p8_2, objectPosition: '50% 50%' },
      { label: 'Includes Mesh Bag', src: PLAYPEN_IMAGES.p8_3, objectPosition: '50% 50%' },
      { label: 'Playpen Ready', src: PLAYPEN_IMAGES.p8_4, objectPosition: '50% 50%' },
    ],
    colors: [{ name: 'Pastel Pink, Green & Blue', hex: '#D8A7B1' }],
    description:
      'A 50-piece set of 5.5 cm crush-proof pastel ball pit balls designed for baby playpens, indoor ball pits, and kids’ parties. BPA-free, phthalate-free, and packed with a convenient mesh storage bag.',
    benefits: [
      'Crush-proof PE material bounces back even under 130+ lbs of pressure',
      'Calm pastel pink, green, and blue tones blend neatly into home interiors',
      'Comes with a mesh drawstring bag for fast tidy-up',
    ],
    bundleIncludes: [
      '50 × 5.5 cm Pastel Ocean Balls',
      '1 Drawstring Mesh Storage Bag',
    ],
    featuredTag: 'Includes Mesh Bag',
    inStock: true,
    isNewArrival: true,
    active: true,
  },

  // 9. Multicolor Baby Playpen with Balls, Basketball & Accessories (120x120 cm)
  {
    id: 'multicolor-baby-playpen-balls-basketball-120x120',
    name: 'Multicolor Baby Playpen with Balls, Basketball & Accessories – Stylish & Versatile Play Fence for Babies & Toddlers (120×120 cm)',
    subtitle: 'Ocean-themed 120 × 120 cm playpen with basketball hoop, balls, mat & bag',
    category: 'mesh',
    categoryLabel: 'Mesh Playpens',
    subCategory: 'Multicolor Activity Bundle',
    priceAed: 175.5,
    rating: 5,
    reviewCount: 5,
    image: PLAYPEN_IMAGES.p9_1,
    aspect: '4:3',
    dimensions: '120 × 120 × 65 cm',
    dimensionsGroup: 'Standard',
    material: 'Breathable Printed Mesh, Cationic Fabric & Foam-Wrapped Poles',
    materialGroup: 'Breathable Mesh & Cationic',
    weightCapacity: 'Up to 35 kg',
    ageSuitability: '0 – 48 Months',
    safetySpecs: [
      'Breathable ocean-themed mesh panels keep airflow circulating',
      'Soft padded top frame rails protect toddlers while standing',
      'Non-slip suction feet keep the playpen steady on indoor floors',
      'Includes basketball hoop, pit balls, pull rings, soft mat, and carry bag',
    ],
    foldingAndStorage:
      'Disassembles without tools and packs neatly into the matching zippered carry bag.',
    deliveryInfo: 'Ships quickly across all Emirates with Cash on Delivery available.',
    careNote: 'Wipe mesh sides and folding play mat with a damp cloth.',
    originNote: 'Cheerful ocean illustrations keep curious babies engaged inside.',
    sizes: ['120cm x 120cm'],
    gallery: [
      { label: 'Complete Activity Set', src: PLAYPEN_IMAGES.p9_1, objectPosition: '50% 50%' },
      { label: 'Hoop & Ocean Graphics', src: PLAYPEN_IMAGES.p9_2, objectPosition: '50% 50%' },
      { label: 'Playpen Dimensions', src: PLAYPEN_IMAGES.p9_3, objectPosition: '50% 50%' },
      { label: 'Included Accessories', src: PLAYPEN_IMAGES.p9_4, objectPosition: '50% 50%' },
    ],
    colors: [{ name: 'Sky Blue Ocean Print', hex: '#94BBE0' }],
    description:
      'A stylish 120 × 120 cm multicolor baby playpen featuring playful ocean mesh illustrations, a built-in basketball hoop, pit balls, pull rings, a folding road-print play mat, and a carry bag.',
    benefits: [
      'Built-in basketball hoop and pit balls encourage active toddler play',
      'Complete set includes folding road play mat, pull rings, and carry bag',
      'Breathable mesh walls let parents supervise clearly from across the room',
    ],
    bundleIncludes: [
      '1 Multicolor Ocean-Themed Playpen (120 × 120 cm)',
      'Built-In Basketball Hoop & Pit Balls',
      '2 Pull Rings, Folding Play Mat & Carry Bag',
    ],
    featuredTag: 'Full Activity Kit',
    inStock: true,
    isFeatured: true,
    isNewArrival: true,
    active: true,
  },
];

export const HERO_CHAPTERS: HeroChapter[] = [
  {
    id: 'hero-mesh',
    indexLabel: '01',
    kicker: 'PLAYPEN UAE · CERTIFIED SAFE',
    headline: 'A Safer Space.\nA Happier Childhood.',
    description:
      'Breathable mesh playpens, sturdy activity fences, waterproof folding play mats, and soft non-toxic ocean balls for UAE homes.',
    ctaLabel: 'Shop Now',
    targetRoute: 'shop',
    bgColor: '#FAFAF8',
    surfaceColor: '#EFF2EE',
    image: PLAYPEN_IMAGES.p6_1,
    featuredProductId: 'baby-playpen-2-pull-rings-carry-bag',
  },
  {
    id: 'hero-large',
    indexLabel: '02',
    kicker: 'EXTRA-LARGE ACTIVITY FENCE',
    headline: 'Solid & Sturdy\nPlay Yards.',
    description:
      'Thickened food-grade HDPE panels with a walk-through safety gate, basketball hoop, and spinning toddler toys.',
    ctaLabel: 'Shop Now',
    targetRoute: 'large',
    bgColor: '#F1F4F0',
    surfaceColor: '#E5EAE4',
    image: PLAYPEN_IMAGES.p4_1,
    featuredProductId: 'baby-playpen-extra-large-gate-120x120',
  },
  {
    id: 'hero-mats',
    indexLabel: '03',
    kicker: 'WATERPROOF PLAY MATS',
    headline: 'Soft Cushioning.\nEasy to Wipe Clean.',
    description:
      'Reversible high-density XPE foam mats in 120×120 cm and 150×180 cm sizes for comfortable crawling and indoor/outdoor play.',
    ctaLabel: 'Shop Now',
    targetRoute: 'foldable',
    bgColor: '#EDF2F3',
    surfaceColor: '#E0E7E9',
    image: PLAYPEN_IMAGES.p1_1,
    featuredProductId: 'versatile-foldable-baby-play-mat-120x120',
  },
];

export const CATEGORY_DIRECTORY: CategoryDirectoryItem[] = [
  {
    route: 'mesh',
    label: 'Mesh Playpens',
    shortDesc: 'Breathable 360° mesh playpens with pull rings, pit balls, and carry bags.',
    ageOrNote: '120×120 & 150×180 cm',
    group: 'playpen',
    image: PLAYPEN_IMAGES.p6_1,
  },
  {
    route: 'large',
    label: 'Gate & Activity Playpens',
    shortDesc: 'Sturdy food-grade HDPE play yards with safety gate and basketball hoop.',
    ageOrNote: 'Heavy-Duty HDPE Fence',
    group: 'collection',
    image: PLAYPEN_IMAGES.p4_1,
  },
  {
    route: 'foldable',
    label: 'Foldable Play Mats',
    shortDesc: 'Waterproof, double-sided XPE foam play mats for indoor and outdoor use.',
    ageOrNote: '120×120 & 150×180 cm',
    group: 'playpen',
    image: PLAYPEN_IMAGES.p1_1,
  },
  {
    route: 'balls',
    label: 'Ocean Ball Sets',
    shortDesc: 'Crush-proof, BPA-free 5.5 cm ball pit balls in 50 and 100 piece packs.',
    ageOrNote: 'BPA-Free 5.5 cm',
    group: 'collection',
    image: PLAYPEN_IMAGES.p3_1,
  },
];
