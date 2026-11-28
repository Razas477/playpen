export interface CustomerTestimonial {
  id: string;
  customerName: string;
  location: string;
  dateLabel: string;
  rating: 5 | 4;
  category: 'playpens' | 'mats-balls';
  title: string;
  quote: string;
  productId: string;
  productLabel: string;
  verifiedPurchase: boolean;
}

export const CUSTOMER_TESTIMONIALS: CustomerTestimonial[] = [
  {
    id: 'rev-1',
    customerName: 'Nadia Al Mansoori',
    location: 'Dubai',
    dateLabel: 'November 2026',
    rating: 5,
    category: 'playpens',
    title: 'Easy to assemble and safe from every angle',
    quote:
      'We set up the breathable mesh playpen in our living room in less than ten minutes. My son loves using the two pull rings to practice standing, and I can always see him clearly while making dinner.',
    productId: 'baby-playpen-2-pull-rings-carry-bag',
    productLabel: 'Baby Playpen with 2 Pull Rings & Carry Bag',
    verifiedPurchase: true,
  },
  {
    id: 'rev-2',
    customerName: 'Tariq & Sara Haddad',
    location: 'Abu Dhabi',
    dateLabel: 'November 2026',
    rating: 5,
    category: 'playpens',
    title: 'Rock-solid panels that never tip over',
    quote:
      'Our toddler leans against the rails all day and the thickened HDPE panels stay completely steady. The walk-through gate latch and built-in basketball hoop keep him busy and safe.',
    productId: 'baby-playpen-extra-large-gate-120x120',
    productLabel: 'Extra Large Activity Playpen with Gate',
    verifiedPurchase: true,
  },
  {
    id: 'rev-3',
    customerName: 'Hannah Patel',
    location: 'Sharjah',
    dateLabel: 'October 2026',
    rating: 5,
    category: 'mats-balls',
    title: 'Wipes clean in seconds on tile floors',
    quote:
      'Our apartment has marble tiles, so tummy time used to feel too hard. This 1.3 cm waterproof foam mat is soft, comfortable, and wipes dry right away after snacks or spilled milk.',
    productId: 'foldable-baby-play-mat-150x180',
    productLabel: 'Foldable Baby Play Mat (150 × 180 cm)',
    verifiedPurchase: true,
  },
  {
    id: 'rev-4',
    customerName: 'Omar Al Hashimi',
    location: 'Dubai',
    dateLabel: 'October 2026',
    rating: 5,
    category: 'playpens',
    title: 'Everything ready in one complete bundle',
    quote:
      'Getting the 120 × 120 cm playpen with the padded mat and 50 pit balls saved us so much time. The delivery team brought it straight to our door with Cash on Delivery.',
    productId: 'baby-toddler-playpen-mat-50-balls-120x120',
    productLabel: 'Playpen Fence with Mat & 50 Pit Balls',
    verifiedPurchase: true,
  },
  {
    id: 'rev-5',
    customerName: 'Layla Al Suwaidi',
    location: 'Al Ain',
    dateLabel: 'October 2026',
    rating: 5,
    category: 'mats-balls',
    title: 'Folds neatly behind our sofa after playtime',
    quote:
      'We take the 120 × 120 cm mat from the nursery out to the garden terrace on weekends. Both sides have cute prints and it folds flat in seconds without taking up closet space.',
    productId: 'versatile-foldable-baby-play-mat-120x120',
    productLabel: 'Versatile Foldable Baby Play Mat (120 × 120 cm)',
    verifiedPurchase: true,
  },
  {
    id: 'rev-6',
    customerName: 'Maya Khoury',
    location: 'Dubai',
    dateLabel: 'September 2026',
    rating: 5,
    category: 'mats-balls',
    title: 'Soft, crush-proof balls with smooth edges',
    quote:
      'The 5.5 cm ocean balls are bright, sturdy, and have zero plastic smell. Even when our toddler steps on them, they bounce right back into shape inside the playpen.',
    productId: '100-pcs-soft-colorful-55mm-ocean-balls',
    productLabel: '100 Pcs Soft & Colorful 5.5cm Ocean Balls',
    verifiedPurchase: true,
  },
];
