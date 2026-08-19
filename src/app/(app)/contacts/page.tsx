import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, EmptyState } from "@/components/ui/Card";
import { ContactRow, type ContactRowData } from "./ContactRow";
import { NewContactForm } from "./NewContactForm";

export const metadata = { title: "Contacts" };
export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const [contacts, accounts] = await Promise.all([
    db.contact.findMany({
      include: { account: { select: { name: true, slug: true, brandHex: true } } },
      orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
    }),
    db.account.findMany({
      where: { kind: { not: "INTERNAL" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Revenue"
        title="Contacts"
        description={`${contacts.length} ${contacts.length === 1 ? "person" : "people"} across ${accounts.length} ${accounts.length === 1 ? "brand" : "brands"}.`}
        actions={<NewContactForm accounts={accounts} />}
      />

      {contacts.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          hint="Add the people you actually talk to at each brand."
        />
      ) : (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr
                  className="border-b text-left"
                  style={{ borderColor: "var(--line)" }}
                >
                  <th className="label px-5 py-3">Person</th>
                  <th className="label py-3 pr-3">Brand</th>
                  <th className="label py-3 pr-3">Email</th>
                  <th className="label py-3 pr-3">Phone</th>
                  <th className="label py-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--line)" }}>
                {contacts.map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact as ContactRowData}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
