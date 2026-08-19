import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { updateAccount } from "@/app/actions/accounts";
import { PageHeader } from "@/components/ui/PageHeader";
import { AccountForm } from "../../AccountForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const account = await db.account.findUnique({
    where: { slug },
    select: { name: true },
  });
  return { title: account ? `Edit ${account.name}` : "Edit brand" };
}

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [account, members] = await Promise.all([
    db.account.findUnique({ where: { slug } }),
    db.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!account) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Brands" title={`Edit ${account.name}`} />
      <AccountForm
        action={updateAccount}
        values={account}
        members={members}
        submitLabel="Save changes"
        cancelHref={`/accounts/${account.slug}`}
      />
    </div>
  );
}
