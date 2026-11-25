import { Gem } from "lucide-react";
import { GlareCard } from "@/components/ui/glare-card";

const UNSPLASH_MARBLE_SURFACE =
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80";

export function GlareCardDemo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 justify-items-center">
      <GlareCard className="flex flex-col items-center justify-center p-6 text-center">
        <Gem className="h-14 w-14 text-white" strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-5 font-semibold tracking-wide text-white text-base">
          IDEA Surface Lab
        </p>
      </GlareCard>
      <GlareCard className="flex flex-col items-center justify-center">
        <img
          className="h-full w-full absolute inset-0 object-cover"
          src={UNSPLASH_MARBLE_SURFACE}
          alt="Architectural interior with warm stone and porcelain surfaces"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = "/images/featured/marble.webp";
          }}
        />
      </GlareCard>
      <GlareCard className="flex flex-col items-start justify-end py-8 px-6">
        <p className="font-bold text-white text-lg">Light reveals texture</p>
        <p className="font-normal text-base text-neutral-200 mt-4 leading-relaxed">
          Move across each surface finish to preview specular sheen, depth, and
          tonal character under directional light.
        </p>
      </GlareCard>
    </div>
  );
}
