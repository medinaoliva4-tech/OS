import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { approveOAuth, denyOAuth } from "@/app/actions/oauth";
import { brand } from "@/lib/brand";
import { InherentLockup } from "@/components/ui/brand/InherentMarks";
import { Avatar } from "@/components/ui/Avatar";

export const metadata = { title: "Connect an app" };
export const dynamic = "force-dynamic";

type Search = {
  response_type?: string;
  client_id?: string;
  redirect_uri?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  state?: string;
  scope?: string;
};

function ErrorScreen({ reason }: { reason: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="surface max-w-sm p-6 text-center">
        <InherentLockup height={26} />
        <p className="mt-4 text-[13px]" style={{ color: "var(--text-muted)" }}>
          {reason}
        </p>
      </div>
    </main>
  );
}

export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const {
    response_type: responseType,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod = "S256",
    state,
  } = params;

  if (responseType !== "code" || !clientId || !redirectUri || !codeChallenge) {
    return <ErrorScreen reason="This connection request is missing required parameters." />;
  }

  const client = await db.oAuthClient.findUnique({ where: { id: clientId } });
  if (!client || !client.redirectUris.includes(redirectUri)) {
    return <ErrorScreen reason="Unknown client, or this redirect address wasn't registered." />;
  }

  const user = await getCurrentUser();
  if (!user) {
    const here = `/oauth/authorize?${new URLSearchParams(params as Record<string, string>).toString()}`;
    redirect(`/login?next=${encodeURIComponent(here)}`);
  }

  const requesterLabel = client.name || new URL(redirectUri).hostname;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <InherentLockup height={30} />
          <p className="mt-3 text-[13px]" style={{ color: "var(--text-muted)" }}>
            {brand.productName}
          </p>
        </div>

        <div className="surface p-6" style={{ boxShadow: "0 24px 60px -20px rgb(0 0 0 / 0.6)" }}>
          <div className="mb-5 flex items-center gap-3">
            <Avatar name={user.name} hue={user.avatarHue} imageUrl={user.avatarUrl} size={36} />
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium">{user.name}</p>
              <p className="truncate text-[11.5px]" style={{ color: "var(--text-faint)" }}>
                {user.email}
              </p>
            </div>
          </div>

          <p className="mb-1 text-[15px] font-semibold">
            Let <span style={{ color: "var(--accent)" }}>{requesterLabel}</span> connect?
          </p>
          <p className="mb-5 text-[12.5px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            It will be able to read and edit accounts, deals, tasks, content, and everything
            else the MCP connector exposes — as you, {user.name.split(" ")[0]}. You can revoke
            access any time from Settings.
          </p>

          <div className="flex gap-2">
            <form action={denyOAuth} className="flex-1">
              <input type="hidden" name="client_id" value={clientId} />
              <input type="hidden" name="redirect_uri" value={redirectUri} />
              {state && <input type="hidden" name="state" value={state} />}
              <button type="submit" className="btn btn-ghost focusable w-full">
                Cancel
              </button>
            </form>
            <form action={approveOAuth} className="flex-1">
              <input type="hidden" name="client_id" value={clientId} />
              <input type="hidden" name="redirect_uri" value={redirectUri} />
              <input type="hidden" name="code_challenge" value={codeChallenge} />
              <input type="hidden" name="code_challenge_method" value={codeChallengeMethod} />
              {state && <input type="hidden" name="state" value={state} />}
              <button type="submit" className="btn btn-primary focusable w-full">
                Allow
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
