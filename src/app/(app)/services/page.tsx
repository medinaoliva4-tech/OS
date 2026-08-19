import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/Card";
import { ServiceCard, type ServiceData } from "./ServiceCard";
import { NewServiceForm } from "./NewServiceForm";

export const metadata = { title: "Services" };
export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const [services, members] = await Promise.all([
    db.service.findMany({
      include: {
        members: {
          select: { id: true, name: true, avatarHue: true, avatarUrl: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: [{ status: "asc" }, { position: "asc" }, { name: "asc" }],
    }),
    db.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Production"
        title="Services"
        description="The lines of work the agency sells — content, design, photography — and who runs each one."
        actions={<NewServiceForm />}
      />

      {services.length === 0 ? (
        <EmptyState
          title="No services yet"
          hint="Add the first one — Content Creation, Graphic Design, Photography, whatever you actually sell."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service as ServiceData}
              allMembers={members}
            />
          ))}
        </div>
      )}
    </>
  );
}
