import { SectionDivider } from "@/components/invitation/Ornament";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-jade uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-serif text-3xl text-sapphire-deep sm:text-4xl">
        {title}
      </h2>
      <div className="mt-5">
        <SectionDivider />
      </div>
      {description ? (
        <p className="mt-5 text-[0.98rem] leading-7 text-muted">{description}</p>
      ) : null}
    </div>
  );
}
