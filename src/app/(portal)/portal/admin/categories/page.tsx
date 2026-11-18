import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/portal/admin";
import { PageHead } from "@/components/portal/Dash";
import { CategoryRow, AddCategoryForm } from "@/components/portal/AdminClient";

export const metadata: Metadata = { title: "Job categories", robots: { index: false } };

// The categories job seekers pick from and every job is filed under. The order here is the order on the site.
export default async function Categories() {
  const { sb, admin } = await getAdmin();
  if (!admin) notFound();
  const [{ data: cats }, { data: jobs }] = await Promise.all([
    sb.from("job_categories").select("id, name, sort").order("sort").order("id"),
    sb.from("jobs").select("category_id"),
  ]);
  const used = new Map<number, number>();
  for (const j of jobs ?? []) if (j.category_id) used.set(j.category_id, (used.get(j.category_id) ?? 0) + 1);
  const list = cats ?? [];
  return (
    <div className="pwrap pwrap--narrow">
      <p className="crumb"><a href="/portal/admin/jobs">All jobs</a></p>
      <PageHead title="Job categories" sub="Job seekers choose from these, and every job sits in one. Renaming one updates every profile that uses it." />
      <section className="panel" aria-label="Categories">
        <ul className="acats">
          {list.map((c, i) => <CategoryRow key={c.id} id={c.id} name={c.name} jobs={used.get(c.id) ?? 0} first={i === 0} last={i === list.length - 1} />)}
        </ul>
        <div className="thread__compose"><AddCategoryForm /></div>
      </section>
    </div>
  );
}
