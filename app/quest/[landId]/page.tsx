import { Suspense } from "react";
import { notFound } from "next/navigation";
import QuestWorld from "@/components/QuestWorld";
import { CHAPTERS } from "@/lib/chapters";
import { LANDS } from "@/lib/lands";
import { QUEST_CONTENT } from "@/lib/quests";

type Props = { params: Promise<{ landId: string }> };

async function Quest({ params }: Props) {
  const { landId } = await params;

  const known =
    CHAPTERS[landId] !== undefined ||
    (LANDS.some((l) => l.id === landId) && QUEST_CONTENT[landId] !== undefined);

  if (!known) notFound();

  return <QuestWorld questId={landId} />;
}

export default function QuestPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <main className="wrap">
          <p className="dim">Загрузка…</p>
        </main>
      }
    >
      <Quest params={params} />
    </Suspense>
  );
}