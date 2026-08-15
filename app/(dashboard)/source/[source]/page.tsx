import { notFound } from "next/navigation";
import { getSourceData } from "@/lib/google-sheets";
import { ALL_SOURCES, SOURCE_LABELS, Source } from "@/types";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SourceNav } from "@/components/ui/SourceNav";
import { SourceDashboard } from "@/components/source/SourceDashboard";

export const revalidate = 300;

interface PageProps {
  params: { source: string };
}

export default async function SourcePage({ params }: PageProps) {
  const source = decodeURIComponent(params.source) as Source;

  if (!ALL_SOURCES.includes(source)) notFound();

  const rows = await getSourceData(source);
  const label = SOURCE_LABELS[source];

  return (
    <div>
      <SourceNav current={source} />
      <SectionHeader title={label} subtitle="Monthly performance breakdown" />
      <SourceDashboard allRows={rows} label={label} source={source} />
    </div>
  );
}
