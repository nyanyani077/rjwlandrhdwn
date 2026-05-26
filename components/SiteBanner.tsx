import Image from "next/image";

export function SiteBanner() {
  return (
    <section
      className="relative w-full shrink-0 overflow-hidden bg-white"
      aria-label="사이트 배너"
    >
      <div className="relative mx-auto aspect-[1024/549] max-h-36 w-full sm:max-h-40 md:max-h-44">
        <Image
          src="/banner-hero.png"
          alt=""
          fill
          priority
          className="object-contain object-center"
          sizes="(max-width: 768px) 100vw, 1152px"
        />
      </div>
    </section>
  );
}
