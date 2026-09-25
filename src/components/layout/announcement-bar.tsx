import Link from "next/link";

type Message = { text: string; href: string | null | undefined };

/** Slim CMS-driven bar. Desktop shows all messages; mobile rotates them. */
export function AnnouncementBar({ messages }: { messages: Message[] }) {
  if (!messages.length) return null;
  const item = (m: Message, i: number) =>
    m.href ? (
      <Link key={i} href={m.href} className="hover:underline hover:underline-offset-4">
        {m.text}
      </Link>
    ) : (
      <span key={i}>{m.text}</span>
    );
  const rotate = messages.slice(0, 3);

  return (
    <div className="bg-primary text-[12.5px] text-white/90">
      <div className="container-page flex h-9 items-center justify-center">
        <p className="hidden items-center gap-6 md:flex">
          {messages.map((m, i) => (
            <span key={i} className="flex items-center gap-6">
              {i > 0 && <span aria-hidden className="size-1 rounded-full bg-white/30" />}
              {item(m, i)}
            </span>
          ))}
        </p>
        <div className="h-5 overflow-hidden md:hidden" aria-live="off">
          <div
            className={rotate.length > 1 ? "motion-safe:animate-[ticker_12s_ease-in-out_infinite]" : undefined}
            style={rotate.length === 2 ? { animationName: "none" } : undefined}
          >
            {rotate.map((m, i) => (
              <p key={i} className="flex h-5 items-center justify-center text-center">
                {item(m, i)}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
