import { Reveal } from "@/components/invitation/Reveal";
import { SectionHeading } from "@/components/invitation/SectionHeading";
import type { StoryChapter } from "@/lib/types";

type StorySectionProps = {
  chapters: StoryChapter[];
};

export function StorySection({ chapters }: StorySectionProps) {
  return (
    <section id="cerita" className="px-5 py-16 sm:py-20">
      <SectionHeading
        eyebrow="Perjalanan"
        title="Cerita Kita"
        description="Bukan kisah yang ribut. Hanya langkah-langkah yang kami syukuri."
      />
      <div className="relative mx-auto max-w-2xl">
        <div className="absolute top-1 bottom-1 left-4 w-px bg-line sm:left-1/2" />
        <div className="flex flex-col gap-8">
          {chapters.map((chapter, index) => (
            <Reveal key={chapter.id}>
              <article
                className={`relative pl-12 sm:w-1/2 sm:pl-0 ${
                  index % 2 === 0
                    ? "sm:pr-10 sm:text-right"
                    : "sm:ml-auto sm:pl-10"
                }`}
              >
                <span
                  className={`absolute top-2 size-3 rounded-full border-2 border-jade bg-cream left-2.5 ${
                    index % 2 === 0
                      ? "sm:left-auto sm:right-[-7px]"
                      : "sm:left-[-7px]"
                  }`}
                />
                <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-jade uppercase">
                  {chapter.dateLabel}
                </p>
                <h3 className="mt-2 font-serif text-2xl text-sapphire-deep">
                  {chapter.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted">{chapter.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
