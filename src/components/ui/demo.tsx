import SocialCards from "@/components/ui/card-fan-carousel";

const DEMO_CARDS = [
  { imgUrl: "/images/featured/ceramics.webp", alt: "Bathroom surfaces", label: "Bathroom", linkUrl: "/inspiration/bathroom" },
  { imgUrl: "/images/featured/porcelain.webp", alt: "Living room surfaces", label: "Living room", linkUrl: "/inspiration/living" },
  { imgUrl: "/images/featured/marble.webp", alt: "Kitchen surfaces", label: "Kitchen", linkUrl: "/inspiration/kitchen" },
  { imgUrl: "/images/featured/wood.webp", alt: "Bedroom surfaces", label: "Bedroom", linkUrl: "/inspiration/bedroom" },
  { imgUrl: "/images/featured/stone.webp", alt: "Commercial surfaces", label: "Commercial", linkUrl: "/inspiration/commercial" },
  { imgUrl: "/images/featured/colour.webp", alt: "Swimming pool surfaces", label: "Swimming pool", linkUrl: "/inspiration/pool" },
  { imgUrl: "/images/featured/tiles.webp", alt: "Outdoor surfaces", label: "Outdoor", linkUrl: "/inspiration/outdoor" },
  { imgUrl: "/images/featured/pattern.webp", alt: "All surfaces", label: "All surfaces", linkUrl: "/products" },
];

export default function Demo() {
  return (
    <div className="min-h-screen flex items-center">
      <SocialCards cards={DEMO_CARDS} />
    </div>
  );
}
