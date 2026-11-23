import Link from 'next/link';

type Props = { eyebrow: string; heading: string; toHome: string; homeHref: string };

// Temporary 404 until the page from the design (stage 2, with the app header).
export function NotFoundView({ eyebrow, heading, toHome, homeHref }: Props) {
  return (
    <main className="mx-auto box-content flex min-h-dvh max-w-[760px] flex-col items-center gap-4 bg-pl-bg px-4 py-16 text-center sm:px-6">
      <p className="text-[13px] font-semibold tracking-[0.12em] text-pl-link uppercase">
        {eyebrow}
      </p>
      <h1 className="font-serif text-[32px] leading-tight font-medium tracking-[-0.02em] text-pl-ink sm:text-[48px]">
        {heading}
      </h1>
      <Link href={homeHref} className="text-pl-link underline underline-offset-4">
        {toHome}
      </Link>
    </main>
  );
}
