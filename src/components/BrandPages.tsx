import { useState } from 'react';
import { ArrowRight, CheckCircle2, MapPin, Phone, Mail, Clock, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { PLAYPEN_IMAGES } from '../data/catalog';
import { PageRoute } from '../types/store';
import { ResilientImage } from './ResilientImage';

interface BrandPagesProps {
  route: 'about' | 'contact' | 'journal';
  onNavigate: (route: PageRoute) => void;
}

const JOURNAL_ESSAYS = [
  {
    id: 'essay-1',
    kicker: 'Buying Guide · 4 min read',
    title: 'Mesh Playpens vs. HDPE Activity Fences: Which Suits Your Home?',
    excerpt:
      'Learn how floor type, air conditioning, and room space help you pick between breathable cationic mesh and a solid HDPE fence.',
    image: PLAYPEN_IMAGES.p6_1,
    body: 'Many apartments and villas across Dubai and Abu Dhabi have cool tile or marble floors with air conditioning running all day. Our breathable mesh playpens maximize 360-degree airflow and let you watch your baby clearly, while our heavy-duty HDPE activity fence features thickened lockable panels and built-in toys for active toddlers.',
    targetRoute: 'mesh' as PageRoute,
    cta: 'Shop Mesh Playpens',
  },
  {
    id: 'essay-2',
    kicker: 'Baby Safety · 5 min read',
    title: 'What Makes an Activity Fence Safe from Crawling to First Steps',
    excerpt:
      'Why non-tipping interlocking panels, soft floor cushioning, and outer safety locks matter as your baby pulls up to stand.',
    image: PLAYPEN_IMAGES.p4_1,
    body: 'As babies start standing and cruising along rails, stability becomes essential. Our extra-large HDPE activity play yard uses thickened interlocking panels with 360-degree rotatable joints and an outer walk-through safety latch so toddlers stay safely inside without tipping.',
    targetRoute: 'large' as PageRoute,
    cta: 'View Activity Playpens',
  },
  {
    id: 'essay-3',
    kicker: 'Comfort & Care · 3 min read',
    title: 'Choosing the Right Play Mat Thickness: 1 cm vs. 1.3 cm XPE Foam',
    excerpt:
      'Compare our compact 120×120 cm reversible mat and spacious 150×180 cm extra-thick cushioned mat for tile or wood floors.',
    image: PLAYPEN_IMAGES.p1_1,
    body: 'A waterproof XPE foam mat turns any hard floor into a warm, cushioned tummy-time and play zone. Choose the 120×120×1 cm mat for compact corners or the 150×180×1.3 cm extra-thick mat when you want extra padding across larger lounges.',
    targetRoute: 'foldable' as PageRoute,
    cta: 'Shop Play Mats',
  },
];

export function BrandPages({ route, onNavigate }: BrandPagesProps) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [boutique, setBoutique] = useState('Dubai Design District (d3) Showroom');
  const [message, setMessage] = useState('');
  const [expandedEssay, setExpandedEssay] = useState<string | null>('essay-1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (route === 'journal') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="bg-[#FAFAF8] pt-24 sm:pt-28 pb-16 lg:pb-24"
      >
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl pb-10 border-b border-[#142220]/10">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2B5B51]">
              PLAYPEN Parent Guides
            </p>
            <h1
              className="mt-2 font-serif font-bold text-[#142220] leading-[1.12]"
              style={{ fontSize: 'clamp(2rem, 3.8vw, 3.1rem)', textWrap: 'balance' }}
            >
              Simple Guides to Safe Play Spaces at Home
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[#3C4B48] leading-relaxed">
              Practical tips from our Dubai team on choosing playpen sizes, safe materials, and room
              layouts for babies and toddlers across the UAE.
            </p>
          </div>

          <div className="mt-10 space-y-8">
            {JOURNAL_ESSAYS.map((essay) => {
              const isOpen = expandedEssay === essay.id;
              return (
                <article
                  key={essay.id}
                  className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch"
                >
                  <div className="lg:col-span-5 aspect-[4/3] bg-[#E6EAE4]">
                    <ResilientImage
                      src={essay.image}
                      alt={essay.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#2B5B51]">
                        {essay.kicker}
                      </p>
                      <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#142220] leading-snug">
                        {essay.title}
                      </h2>
                      <p className="mt-3 text-sm sm:text-[15px] text-[#3C4B48] leading-relaxed">
                        {essay.excerpt}
                      </p>
                      {isOpen && (
                        <p className="mt-4 pt-4 border-t border-[#142220]/10 text-sm sm:text-[15px] text-[#142220] leading-relaxed">
                          {essay.body}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setExpandedEssay(isOpen ? null : essay.id)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#142220] text-[#FAFAF8] text-xs sm:text-sm font-semibold hover:bg-[#2B5B51] transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>{isOpen ? 'Close Guide' : 'Read Guide'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate(essay.targetRoute)}
                        className="text-sm font-semibold text-[#142220] hover:text-[#2B5B51] hover:underline underline-offset-4 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>{essay.cta}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  if (route === 'about') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="bg-[#FAFAF8] pt-20 sm:pt-24"
      >
        <section className="bg-[#F1F3EF] border-b border-[#142220]/10">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2B5B51]">
                About PLAYPEN · Dubai, UAE
              </p>
              <h1
                className="mt-3 font-serif font-bold text-[#142220] leading-[1.12]"
                style={{ fontSize: 'clamp(2rem, 3.8vw, 3.25rem)', textWrap: 'balance' }}
              >
                A Safer Space. A Happier Childhood.
              </h1>
              <p className="mt-5 text-sm sm:text-base text-[#3C4B48] leading-relaxed max-w-xl">
                Based in Dubai Design District, PLAYPEN provides safe, everyday baby playpens,
                waterproof foldable XPE mats, and BPA-free ocean balls for families across the UAE.
                Everything is built with baby-safe materials, breathable mesh panels, and simple,
                tool-free assembly.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold hover:bg-[#2B5B51] transition-colors cursor-pointer"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="px-6 py-3.5 rounded-full border border-[#142220]/25 text-sm font-semibold text-[#142220] hover:bg-[#E6EAE4] transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="rounded-3xl overflow-hidden aspect-[4/3] bg-[#D7DDD5]">
                <ResilientImage
                  src={PLAYPEN_IMAGES.p5_1}
                  alt="PLAYPEN cushioned baby playpen and pit balls set"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-7 rounded-3xl bg-[#F1F3EF] border border-[#142220]/8">
                <span className="text-xs font-bold text-[#2B5B51] tabular-nums">01.</span>
                <h2 className="mt-2 font-serif text-2xl font-bold text-[#142220]">
                  Certified Safe
                </h2>
                <p className="mt-2.5 text-sm sm:text-[15px] text-[#3C4B48] leading-relaxed">
                  Every playpen features sturdy non-tipping joints, strong floor stability, external
                  safety zippers or latches, and child-safe rounded edges.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-[#F1F3EF] border border-[#142220]/8">
                <span className="text-xs font-bold text-[#2B5B51] tabular-nums">02.</span>
                <h2 className="mt-2 font-serif text-2xl font-bold text-[#142220]">
                  Baby-Safe Materials
                </h2>
                <p className="mt-2.5 text-sm sm:text-[15px] text-[#3C4B48] leading-relaxed">
                  We select breathable cationic fabric, waterproof BPA-free XPE foam, food-grade
                  HDPE panels, and crush-proof virgin PE plastic balls.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-[#F1F3EF] border border-[#142220]/8">
                <span className="text-xs font-bold text-[#2B5B51] tabular-nums">03.</span>
                <h2 className="mt-2 font-serif text-2xl font-bold text-[#142220]">
                  UAE Delivery &amp; Setup
                </h2>
                <p className="mt-2.5 text-sm sm:text-[15px] text-[#3C4B48] leading-relaxed">
                  From compact apartments to large family villas, we deliver across all seven
                  Emirates with optional assembly in your room.
                </p>
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="bg-[#FAFAF8] pt-24 sm:pt-28 pb-16 lg:pb-24"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Showroom Directory */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2B5B51]">
              Showrooms &amp; Support · UAE
            </p>
            <h1
              className="mt-2 font-serif font-bold text-[#142220] leading-[1.12]"
              style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}
            >
              Contact Us
            </h1>
            <p className="mt-3 text-sm sm:text-[15px] text-[#3C4B48] leading-relaxed">
              Visit our showroom, ask about sizing for your room, or get help choosing the right
              playpen from our UAE team.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#F1F3EF] border border-[#142220]/8 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#142220]">
                <MapPin className="w-4 h-4 text-[#2B5B51]" />
                <span>Dubai · Design District (d3) Showroom</span>
              </div>
              <p className="text-xs sm:text-sm text-[#3C4B48]">
                Building 7, Ground Gallery, Dubai Design District, Dubai, UAE
              </p>
              <div className="flex items-center gap-2 text-xs text-[#4A5B57]">
                <Clock className="w-3.5 h-3.5" />
                <span>Daily 10:00 AM – 9:00 PM</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#F1F3EF] border border-[#142220]/8 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#142220]">
                <MapPin className="w-4 h-4 text-[#2B5B51]" />
                <span>Abu Dhabi · Saadiyat Showroom</span>
              </div>
              <p className="text-xs sm:text-sm text-[#3C4B48]">
                Mamsha Al Saadiyat Pavilion, Suite 4, Abu Dhabi, UAE
              </p>
              <div className="flex items-center gap-2 text-xs text-[#4A5B57]">
                <Clock className="w-3.5 h-3.5" />
                <span>By Appointment · Thu–Sun Open Hours</span>
              </div>
            </div>

            <div className="pt-2 space-y-2 text-xs sm:text-sm font-medium text-[#3C4B48]">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#2B5B51]" />
                <span>+971 4 555 0192 (UAE Customer Support)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#2B5B51]" />
                <span>concierge@playpen.ae</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Inquiry & Room Sizing Form */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-5 sm:p-10">
            {submitted ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#FAFAF8] flex items-center justify-center text-[#142220]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="mt-4 font-serif text-2xl font-bold text-[#142220]">
                  Message Received
                </h2>
                <p className="mt-2 text-sm sm:text-[15px] text-[#3C4B48] max-w-md mx-auto leading-relaxed">
                  Thank you, {name}. Our {boutique} team will reply within two hours with size and
                  setup advice.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setName('');
                    setEmail('');
                    setMessage('');
                  }}
                  className="mt-6 w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#142220]">
                    Book a Visit or Ask a Question
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[#4A5B57]">
                    Tell us your room size or which playpen you like, and we will help you choose.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#142220] mb-1.5">
                      Full Name
                    </label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Amna Al Suwaidi"
                      className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#FAFAF8] text-base sm:text-sm text-[#142220] border border-[#142220]/10 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#142220] mb-1.5">
                      Email Address
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="amna@example.ae"
                      className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#FAFAF8] text-base sm:text-sm text-[#142220] border border-[#142220]/10 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#142220] mb-1.5">
                    Preferred Showroom or Service
                  </label>
                  <select
                    value={boutique}
                    onChange={(e) => setBoutique(e.target.value)}
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#FAFAF8] text-base sm:text-sm text-[#142220] border border-[#142220]/10 focus:outline-none"
                  >
                    <option>Dubai Design District (d3) Showroom</option>
                    <option>Abu Dhabi · Saadiyat Showroom</option>
                    <option>Home Sizing &amp; Video Help</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#142220] mb-1.5">
                    Your Room Size or Question
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share your room measurements, preferred style (mesh playpen, activity fence, play mat), or any questions..."
                    className="w-full px-4 py-3 rounded-xl bg-[#FAFAF8] text-base sm:text-sm text-[#142220] border border-[#142220]/10 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold hover:bg-[#2B5B51] transition-colors cursor-pointer"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
