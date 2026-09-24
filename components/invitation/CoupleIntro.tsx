import { Reveal } from "@/components/invitation/Reveal";
import { SectionDivider } from "@/components/invitation/Ornament";
import { SmartImage } from "@/components/invitation/SmartImage";
import type { WeddingContent } from "@/lib/types";

type CoupleIntroProps = {
  wedding: WeddingContent;
  guestName: string;
};

export function CoupleIntro({ wedding, guestName }: CoupleIntroProps) {
  return (
    <section id="membuka" className="px-5 py-16 sm:py-20">
      <Reveal>
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-arabic text-2xl text-sapphire-deep">
            بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
          </p>
          <div className="mt-6">
            <SectionDivider />
          </div>
          {guestName ? (
            <p className="mt-6 text-sm text-muted">
              Kepada Yth. <span className="font-medium text-ink">{guestName}</span>
            </p>
          ) : null}
          <p className="mt-5 text-[1.02rem] leading-8 text-muted">
            {wedding.openingLine}
          </p>
        </div>
      </Reveal>

      <div className="mx-auto mt-10 grid max-w-4xl items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
        <Reveal>
          <article className="rounded-3xl border border-line bg-card px-5 py-7 text-center">
            <p className="text-[0.68rem] tracking-[0.22em] text-jade uppercase">
              Mempelai Wanita
            </p>
            <h3 className="mt-3 font-serif text-3xl text-sapphire-deep">
              {wedding.bride.fullName}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              {wedding.bride.parents}
            </p>
          </article>
        </Reveal>

        <Reveal className="hidden justify-center md:flex">
          <SmartImage
            src={wedding.couplePortrait}
            alt="Potret Aisyah dan Yusuf"
            className="size-36 rounded-full object-cover ring-4 ring-sand"
          />
        </Reveal>

        <Reveal>
          <article className="rounded-3xl border border-line bg-card px-5 py-7 text-center">
            <p className="text-[0.68rem] tracking-[0.22em] text-jade uppercase">
              Mempelai Pria
            </p>
            <h3 className="mt-3 font-serif text-3xl text-sapphire-deep">
              {wedding.groom.fullName}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              {wedding.groom.parents}
            </p>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
