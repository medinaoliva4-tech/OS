import { db } from "@/lib/db";
import { createAccount } from "@/app/actions/accounts";
import { PageHeader } from "@/components/ui/PageHeader";
import { AccountForm } from "../AccountForm";

export const metadata = { title: "New brand" };
export const dynamic = "force-dynamic";

export default async function NewAccountPage() {
  const members = await db.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Brands"
        title="Onboard a brand"
        description="Add the logo and colour up front so the brand looks like itself everywhere in the OS. It arrives with the full guideline checklist and all nine content-system checkpoints already in place — never a blank page."
      />
      <AccountForm
        action={createAccount}
        members={members}
        submitLabel="Create brand"
        cancelHref="/accounts"
      />
    </div>
  );
}
