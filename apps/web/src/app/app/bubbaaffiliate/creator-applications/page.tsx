import { requireWorkspace } from '@/lib/workspace';
import { STATUS_FILTERS } from '@/lib/bubbaaffiliate-intake';
import { SubmissionList } from '../_list';

export const dynamic = 'force-dynamic';

type Args = { searchParams: Promise<{ status?: string; sort?: string }> };

export default async function CreatorApplicationsPage({ searchParams }: Args) {
  const { status: rawStatus, sort } = await searchParams;
  const status = STATUS_FILTERS.some((f) => f.value === rawStatus) ? rawStatus! : 'all';
  const newestFirst = sort !== 'oldest';
  const ws = await requireWorkspace();
  return <SubmissionList scope={ws.scope} kind="creator" status={status} newestFirst={newestFirst} />;
}
