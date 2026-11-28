import { useEffect, useState } from 'react';
import { ImagePlus, Plus, Trash2, Upload, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PLAYPEN_IMAGES } from '../data/catalog';
import { saveProductAdmin } from '../lib/storeDb';
import {
  CategoryDirectoryItem,
  DimensionsGroup,
  MaterialGroup,
  Product,
  ProductCategory,
  ProductColorOption,
} from '../types/store';
import { ResilientImage } from './ResilientImage';

interface AdminProductModalProps {
  isOpen: boolean;
  editingProduct: Product | null;
  categories: CategoryDirectoryItem[];
  onClose: () => void;
  onSaved: (msg: string) => void;
}

const FOOTPRINT_PRESETS = [
  '120cm x 120cm',
  '150cm x 180cm',
  '120 × 120 × 1 cm',
  '150 × 180 cm (1.3 cm Thick)',
  '5.5cm',
];

const DIMENSIONS_GROUPS: DimensionsGroup[] = [
  'Compact',
  'Standard',
  'Large',
];

const MATERIAL_GROUPS: MaterialGroup[] = [
  'Breathable Mesh & Cationic',
  'HDPE Activity Fence',
  'Waterproof XPE Foam',
  'BPA-Free PE Plastic',
];

async function compressImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const maxSide = 880;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const webp = canvas.toDataURL('image/webp', 0.8);
        if (webp.startsWith('data:image/webp') && webp.length < 250000) {
          resolve(webp);
          return;
        }
        const jpeg = canvas.toDataURL('image/jpeg', 0.78);
        if (jpeg.length >= 280000) {
          reject(
            new Error('Image is still too large after compression. Please use a smaller photo.')
          );
          return;
        }
        resolve(jpeg);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function AdminProductModal({
  isOpen,
  editingProduct,
  categories,
  onClose,
  onSaved,
}: AdminProductModalProps) {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<ProductCategory>('mesh');
  const [priceAed, setPriceAed] = useState('149');
  const [image, setImage] = useState<string>(PLAYPEN_IMAGES.p6_1);
  const [dimensions, setDimensions] = useState('120 × 120 × 65 cm');
  const [dimensionsGroup, setDimensionsGroup] = useState<DimensionsGroup>('Standard');
  const [material, setMaterial] = useState(
    'Cationic Fabric, Bumper Foam Padding & Breathable Mesh'
  );
  const [materialGroup, setMaterialGroup] = useState<MaterialGroup>(
    'Breathable Mesh & Cationic'
  );
  const [weightCapacity, setWeightCapacity] = useState('Up to 35 kg');
  const [ageSuitability, setAgeSuitability] = useState('0 – 48 Months');
  const [safetySpecsText, setSafetySpecsText] = useState(
    '360-degree breathable mesh walls keep airflow fresh and baby in clear view\nSoft bumper-foam padding wraps top rails to soften bumps\nExternal zippered crawl door keeps toddlers safely inside'
  );
  const [foldingAndStorage, setFoldingAndStorage] = useState(
    'Disassembles without tools and packs cleanly into the included zippered carry bag.'
  );
  const [deliveryInfo, setDeliveryInfo] = useState(
    'Fast UAE courier delivery across all 7 Emirates with Cash on Delivery.'
  );
  const [careNote, setCareNote] = useState(
    'Wipe fabric and breathable mesh sides with a damp cloth and mild soap.'
  );
  const [originNote, setOriginNote] = useState(
    'Compact footprint suitable for apartments, living rooms, and patios.'
  );
  const [description, setDescription] = useState('');
  const [featuredTag, setFeaturedTag] = useState('');
  const [sizes, setSizes] = useState<string[]>(['120cm x 120cm']);
  const [unavailableSizes, setUnavailableSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState('');
  const [colors, setColors] = useState<ProductColorOption[]>([
    { name: 'Soft Dove Grey', hex: '#B3B7BC' },
  ]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#B3B7BC');
  const [initialStock, setInitialStock] = useState('16');
  const [inStock, setInStock] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    if (editingProduct) {
      setName(editingProduct.name);
      setSubtitle(editingProduct.subtitle || '');
      setCategory(editingProduct.category);
      setPriceAed(String(editingProduct.priceAed));
      setImage(editingProduct.image);
      setDimensions(editingProduct.dimensions || '120 × 120 × 65 cm');
      setDimensionsGroup(editingProduct.dimensionsGroup || 'Standard');
      setMaterial(editingProduct.material || '');
      setMaterialGroup(editingProduct.materialGroup || 'Breathable Mesh & Cationic');
      setWeightCapacity(editingProduct.weightCapacity || 'Up to 35 kg');
      setAgeSuitability(editingProduct.ageSuitability || '0 – 48 Months');
      setSafetySpecsText((editingProduct.safetySpecs || []).join('\n'));
      setFoldingAndStorage(editingProduct.foldingAndStorage || '');
      setDeliveryInfo(editingProduct.deliveryInfo || '');
      setCareNote(editingProduct.careNote || '');
      setOriginNote(editingProduct.originNote || '');
      setDescription(editingProduct.description || '');
      setFeaturedTag(editingProduct.featuredTag || '');
      setSizes(
        editingProduct.sizes.length > 0
          ? editingProduct.sizes
          : ['120cm x 120cm']
      );
      setUnavailableSizes(editingProduct.unavailableSizes || []);
      setColors(
        editingProduct.colors.length > 0
          ? editingProduct.colors
          : [{ name: 'Soft Dove Grey', hex: '#B3B7BC' }]
      );
      setInStock(editingProduct.inStock !== false);
      setIsFeatured(Boolean(editingProduct.isFeatured ?? editingProduct.featuredTag));
      setIsNewArrival(Boolean(editingProduct.isNewArrival));
      setIsBestSeller(Boolean(editingProduct.isBestSeller));
      setActive(editingProduct.active !== false);
      setInitialStock('16');
    } else {
      setName('');
      setSubtitle('');
      setCategory('mesh');
      setPriceAed('149');
      setImage(PLAYPEN_IMAGES.p6_1);
      setDimensions('120 × 120 × 65 cm');
      setDimensionsGroup('Standard');
      setMaterial('Cationic Fabric, Bumper Foam Padding & Breathable Mesh');
      setMaterialGroup('Breathable Mesh & Cationic');
      setWeightCapacity('Up to 35 kg');
      setAgeSuitability('0 – 48 Months');
      setSafetySpecsText(
        '360-degree breathable mesh walls keep airflow fresh and baby in clear view\nSoft bumper-foam padding wraps top rails to soften bumps\nExternal zippered crawl door keeps toddlers safely inside'
      );
      setFoldingAndStorage(
        'Disassembles without tools and packs cleanly into the included zippered carry bag.'
      );
      setDeliveryInfo(
        'Fast UAE courier delivery across all 7 Emirates with Cash on Delivery.'
      );
      setCareNote(
        'Wipe fabric and breathable mesh sides with a damp cloth and mild soap.'
      );
      setOriginNote('Compact footprint suitable for apartments, living rooms, and patios.');
      setDescription('');
      setFeaturedTag('');
      setSizes(['120cm x 120cm']);
      setUnavailableSizes([]);
      setColors([{ name: 'Soft Dove Grey', hex: '#B3B7BC' }]);
      setInStock(true);
      setIsFeatured(false);
      setIsNewArrival(true);
      setIsBestSeller(false);
      setActive(true);
      setInitialStock('16');
    }
  }, [isOpen, editingProduct]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    setErrorMsg('');
    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      setImage(dataUrl);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to process image upload.'
      );
    } finally {
      setUploadingImg(false);
    }
  };

  const togglePresetFootprint = (code: string) => {
    setSizes((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
    );
  };

  const toggleUnavailableSize = (code: string) => {
    setUnavailableSizes((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
    );
  };

  const handleAddCustomSize = () => {
    const trimmed = customSize.trim();
    if (!trimmed) return;
    if (!sizes.includes(trimmed)) {
      setSizes((prev) => [...prev, trimmed]);
    }
    setCustomSize('');
  };

  const handleAddColor = () => {
    const trimmed = newColorName.trim();
    if (!trimmed) return;
    setColors((prev) => [...prev, { name: trimmed, hex: newColorHex }]);
    setNewColorName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const matchedCat = categories.find((c) => c.route === category);
      const categoryLabel = matchedCat?.label || `${category} Playpens`;
      const parsedSafetySpecs = safetySpecsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      await saveProductAdmin(
        {
          id: editingProduct?.id,
          name,
          subtitle,
          category,
          categoryLabel,
          priceAed: Number(priceAed),
          image,
          dimensions,
          dimensionsGroup,
          material,
          materialGroup,
          weightCapacity,
          ageSuitability,
          safetySpecs:
            parsedSafetySpecs.length > 0
              ? parsedSafetySpecs
              : ['Breathable mesh sides & baby-safe rounded edges'],
          foldingAndStorage,
          deliveryInfo,
          careNote,
          originNote,
          description,
          featuredTag,
          sizes,
          unavailableSizes,
          colors,
          inStock,
          isFeatured,
          isNewArrival,
          isBestSeller,
          active,
        },
        Number(initialStock || 16)
      );
      onSaved(
        editingProduct
          ? `Updated "${name}" across PLAYPEN catalog and inventory.`
          : `Published "${name}" to live PLAYPEN storefront.`
      );
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save playpen.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && onClose()}
            className="fixed inset-0 bg-[#142220]/45 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            role="dialog"
            aria-modal="true"
            aria-label={editingProduct ? 'Edit Playpen' : 'Add Playpen'}
            className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#FAFAF8] border border-[#142220]/12 shadow-2xl p-4 sm:p-8 text-[#142220]"
          >
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#142220]/10">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#4A5B57]">
                  PLAYPEN Product Editor
                </p>
                <h2 className="font-serif text-xl sm:text-3xl font-bold truncate">
                  {editingProduct ? `Edit · ${editingProduct.name}` : 'Add New Playpen'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                aria-label="Close modal"
                className="w-11 h-11 rounded-full border border-[#142220]/15 flex items-center justify-center hover:bg-[#E6EAE4] shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 rounded-2xl bg-[#F7E8E6] border border-[#993A32]/20 px-4 py-3 text-xs text-[#6F251F]">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Image Preview + Upload + Studio Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center rounded-2xl bg-[#F1F3EF] p-4">
                <div className="sm:col-span-3">
                  <ResilientImage
                    src={image}
                    alt={name || 'Playpen preview'}
                    className="w-full aspect-[4/3] rounded-2xl object-cover bg-[#E6EAE4]"
                  />
                </div>
                <div className="sm:col-span-9 space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-semibold hover:bg-[#1F3532] cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImg ? 'Uploading...' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-[#4A5B57]">
                      PNG, JPEG, or WebP · Automatically optimized
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                      Or paste image URL / choose preset photo
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        required
                        type="text"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://... or /assets/..."
                        className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-[#FAFAF8] text-base sm:text-xs text-[#142220] border border-[#142220]/10 focus:outline-none"
                      />
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) setImage(e.target.value);
                        }}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-[#FAFAF8] text-base sm:text-xs text-[#142220] border border-[#142220]/10 focus:outline-none"
                      >
                        <option value="">Studio Preset</option>
                        <option value={PLAYPEN_IMAGES.p1_1}>Foldable Play Mat (120×120×1cm)</option>
                        <option value={PLAYPEN_IMAGES.p2_1}>Playpen Fence (10 Balls &amp; 2 Rings)</option>
                        <option value={PLAYPEN_IMAGES.p3_1}>100 Pcs Ocean Balls (5.5cm)</option>
                        <option value={PLAYPEN_IMAGES.p4_1}>Extra Large Activity Playpen with Gate</option>
                        <option value={PLAYPEN_IMAGES.p5_1}>Playpen Fence with Mat &amp; 50 Balls</option>
                        <option value={PLAYPEN_IMAGES.p6_1}>Baby Playpen with 2 Pull Rings &amp; Bag</option>
                        <option value={PLAYPEN_IMAGES.p7_1}>Foldable Play Mat (150×180×1.3cm)</option>
                        <option value={PLAYPEN_IMAGES.p8_1}>50 PCS Pastel Ball Pit Balls (5.5cm)</option>
                        <option value={PLAYPEN_IMAGES.p9_1}>Multicolor Playpen with Basketball Hoop</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                    Product Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Baby Playpen with 2 Pull Rings and Carry Bag"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F1F3EF] text-base sm:text-sm border border-[#142220]/10 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                    Short Subtitle
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Breathable mesh play yard with carry bag"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F1F3EF] text-base sm:text-sm border border-[#142220]/10 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F1F3EF] text-base sm:text-sm border border-[#142220]/10 focus:outline-none"
                  >
                    <option value="mesh">Mesh Playpens</option>
                    <option value="large">Gate &amp; Activity Playpens</option>
                    <option value="foldable">Foldable Play Mats</option>
                    <option value="balls">Ocean Ball Sets</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                      Price (AED) *
                    </label>
                    <input
                      required
                      min={1}
                      max={100000}
                      step="0.01"
                      type="number"
                      value={priceAed}
                      onChange={(e) => setPriceAed(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F1F3EF] text-base sm:text-sm tabular-nums border border-[#142220]/10 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                      Stock per Size/Color
                    </label>
                    <input
                      min={0}
                      max={10000}
                      type="number"
                      value={initialStock}
                      onChange={(e) => setInitialStock(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F1F3EF] text-base sm:text-sm tabular-nums border border-[#142220]/10 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Structural Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                    Dimensions *
                  </label>
                  <input
                    required
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="120 × 120 × 65 cm"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F1F3EF] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                    Size Group
                  </label>
                  <select
                    value={dimensionsGroup}
                    onChange={(e) =>
                      setDimensionsGroup(e.target.value as DimensionsGroup)
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F1F3EF] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                  >
                    {DIMENSIONS_GROUPS.map((grp) => (
                      <option key={grp} value={grp}>
                        {grp}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                    Material Group
                  </label>
                  <select
                    value={materialGroup}
                    onChange={(e) =>
                      setMaterialGroup(e.target.value as MaterialGroup)
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F1F3EF] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                  >
                    {MATERIAL_GROUPS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                    Material Details
                  </label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F1F3EF] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                    Weight Limit
                  </label>
                  <input
                    type="text"
                    value={weightCapacity}
                    onChange={(e) => setWeightCapacity(e.target.value)}
                    placeholder="Up to 35 kg"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F1F3EF] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                    Age Range
                  </label>
                  <input
                    type="text"
                    value={ageSuitability}
                    onChange={(e) => setAgeSuitability(e.target.value)}
                    placeholder="0 – 48 Months"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F1F3EF] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                    Product Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what the playpen is, what it is made of, its size, and why parents love it..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F1F3EF] text-base sm:text-sm border border-[#142220]/10 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                    Safety Features (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={safetySpecsText}
                    onChange={(e) => setSafetySpecsText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F1F3EF] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                    Folding &amp; Storage
                  </label>
                  <input
                    type="text"
                    value={foldingAndStorage}
                    onChange={(e) => setFoldingAndStorage(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F1F3EF] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                    Badge / Label
                  </label>
                  <input
                    type="text"
                    value={featuredTag}
                    onChange={(e) => setFeaturedTag(e.target.value)}
                    placeholder="Best Seller"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F1F3EF] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                  />
                </div>
              </div>

              {/* Footprint Configurations */}
              <div className="rounded-2xl bg-[#F1F3EF] p-4 space-y-3">
                <span className="block text-xs font-semibold text-[#142220]">
                  Available Sizes (Click preset to add · Click tag below to mark Out of Stock)
                </span>

                <div className="flex flex-wrap gap-1.5">
                  {FOOTPRINT_PRESETS.map((preset) => {
                    const selected = sizes.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => togglePresetFootprint(preset)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#142220] text-[#FAFAF8]'
                            : 'bg-[#FAFAF8] text-[#3C4B48] border border-[#142220]/12'
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value)}
                    placeholder="Add custom size (e.g. 150cm x 180cm)"
                    className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-[#FAFAF8] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#E6EAE4] text-xs font-semibold hover:bg-[#D7DDD5] inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Size</span>
                  </button>
                </div>

                {sizes.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-2">
                    {sizes.map((sz) => {
                      const isOut = unavailableSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleUnavailableSize(sz)}
                          className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs border cursor-pointer ${
                            isOut
                              ? 'bg-[#F7E8E6] border-[#993A32]/30 text-[#993A32] line-through'
                              : 'bg-[#FAFAF8] border-[#142220]/12 text-[#142220]'
                          }`}
                          title="Click to toggle Out of Stock"
                        >
                          {sz} {isOut ? '(Out)' : '(In Stock)'}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Finishes / Colors */}
              <div className="rounded-2xl bg-[#F1F3EF] p-4 space-y-3">
                <span className="block text-xs font-semibold text-[#142220]">
                  Colors &amp; Finishes
                </span>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c, idx) => (
                    <span
                      key={`${c.name}-${idx}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAFAF8] border border-[#142220]/12 text-xs"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-[#142220]/15"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                      {colors.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setColors((prev) => prev.filter((_, i) => i !== idx))
                          }
                          aria-label={`Remove ${c.name}`}
                          className="text-[#4A5B57] hover:text-[#993A32] p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-11 h-11 rounded-lg border border-[#142220]/15 bg-[#FAFAF8] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    placeholder="Color name (e.g. Warm Oat)"
                    className="flex-1 min-w-[140px] min-h-[44px] px-3 py-2 rounded-xl bg-[#FAFAF8] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#E6EAE4] text-xs font-semibold hover:bg-[#D7DDD5] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>Add Color</span>
                  </button>
                </div>
              </div>

              {/* Merchandise Toggles */}
              <div className="flex flex-wrap gap-5 text-xs">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="accent-[#142220] w-4 h-4"
                  />
                  <span>In Stock</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="accent-[#142220] w-4 h-4"
                  />
                  <span>Featured</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="accent-[#142220] w-4 h-4"
                  />
                  <span>Best Seller</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewArrival}
                    onChange={(e) => setIsNewArrival(e.target.checked)}
                    className="accent-[#142220] w-4 h-4"
                  />
                  <span>New Arrival</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="accent-[#142220] w-4 h-4"
                  />
                  <span>Show in Store</span>
                </label>
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 border-t border-[#142220]/10">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-full border border-[#142220]/20 text-xs font-semibold hover:bg-[#E6EAE4] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImg}
                  className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-semibold hover:bg-[#1F3532] cursor-pointer disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingProduct
                    ? 'Save Changes'
                    : 'Add Product'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
