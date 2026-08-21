import { InherentLockup } from "@/components/ui/brand/InherentMarks";

export const metadata = { title: "Connection failed" };

const REASONS: Record<string, string> = {
  invalid_client: "Unknown client, or this redirect address wasn't registered.",
};

export default async function OAuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="surface max-w-sm p-6 text-center">
        <InherentLockup height={26} />
        <p className="mt-4 text-[13px]" style={{ color: "var(--text-muted)" }}>
          {(reason && REASONS[reason]) || "Something went wrong with this connection request."}
        </p>
      </div>
    </main>
  );
}
