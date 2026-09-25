/** Heading block used at the top of each auth card. */
export function AuthHeading({ title, description }: { title: string; description?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="mt-1.5 text-[15px] text-muted text-pretty">{description}</p>}
    </div>
  );
}
