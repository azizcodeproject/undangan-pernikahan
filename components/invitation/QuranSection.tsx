import { Reveal } from "@/components/invitation/Reveal";
import { SectionHeading } from "@/components/invitation/SectionHeading";
import type { QuranAyah } from "@/lib/types";

type QuranSectionProps = {
  ayahs: QuranAyah[];
};

export function QuranSection({ ayahs }: QuranSectionProps) {
  return (
    <section id="ayat" className="px-5 py-16 sm:py-20">
      <SectionHeading
        eyebrow="Sebuah ayat"
        title="Tentang pernikahan"
        description="Kami menyimpan satu pengingat yang lembut untuk hari ini."
      />
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {ayahs.map((ayah) => (
          <Reveal key={ayah.id}>
            <article className="rounded-3xl border border-line bg-card px-6 py-8 shadow-sm sm:px-10">
              <p className="text-center text-[0.7rem] font-semibold tracking-[0.22em] text-jade uppercase">
                {ayah.surah} {ayah.reference}
              </p>
              <p
                dir="rtl"
                lang="ar"
                className="font-arabic mt-6 text-center text-2xl leading-[2.15] text-sapphire-deep sm:text-[1.85rem]"
              >
                {ayah.arabic}
              </p>
              <p className="mt-6 text-center text-sm leading-7 text-muted">
                {ayah.meaning}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
