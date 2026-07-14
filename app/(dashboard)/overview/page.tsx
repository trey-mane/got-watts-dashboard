import { getAllSourcesData } from "@/lib/google-sheets";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { OverviewContent } from "@/components/overview/OverviewContent";

export const revalidate = 300;

export default async function OverviewPage() {
  const allData = await getAllSourcesData();

  return (
    <div>
      <SectionHeader
        title="Overview"
        subtitle="Performance across every lead source since Jan '25"
      />
      <OverviewContent allData={allData} />
    </div>
  );
}
