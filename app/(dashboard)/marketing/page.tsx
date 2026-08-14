import { getAllSourcesData } from "@/lib/google-sheets";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MarketingDashboard } from "@/components/marketing/MarketingDashboard";

export const revalidate = 300;

export default async function MarketingPage() {
  const allData = await getAllSourcesData();
  return (
    <div>
      <SectionHeader
        title="Marketing Dashboard"
        subtitle="Revenue · Pipeline · Cost efficiency for Got Watts Solar"
      />
      <MarketingDashboard allData={allData} />
    </div>
  );
}
