import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { c3Action } from '@/c3Action';
import { useErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { ActionItem, WeeklyReview } from '@/Interfaces';

const STATUSES: ActionItem['status'][] = ['Open', 'In Progress', 'Done'];

const columns: ColumnDef<ActionItem>[] = [
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'owner', header: 'Owner' },
  {
    accessorKey: 'dueDate',
    header: 'Due',
    cell: ({ row }) => new Date(row.original.dueDate).toLocaleDateString(),
  },
  { accessorKey: 'priority', header: 'Priority' },
  { accessorKey: 'status', header: 'Status' },
];

function startOfWeekIso(): string {
  const now = new Date();
  const day = (now.getUTCDay() + 6) % 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day));
  return monday.toISOString();
}

export default function ActionTrackerPage() {
  const { reportError } = useErrorBoundary();
  const [items, setItems] = useState<ActionItem[]>([]);
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [fetched, weekly] = await Promise.all([
        c3Action('ActionItem', 'fetch', { include: 'this', limit: 100, order: 'ascending(dueDate)' }),
        c3Action('ActionItem', 'weeklyReview', [startOfWeekIso()]),
      ]);
      setItems(fetched.objs ?? []);
      setReview(weekly);
    } catch (err) {
      reportError(err);
    } finally {
      setLoading(false);
    }
  }, [reportError]);

  useEffect(() => {
    load();
  }, [load]);

  const chartData = useMemo(
    () => STATUSES.map((status) => ({ status, count: items.filter((i) => i.status === status).length })),
    [items]
  );

  if (loading) return <Skeleton className="m-4 h-64" />;

  return (
    <div className="flex flex-col gap-6 p-4">
      <header>
        <h1 className="text-xl font-semibold">Weekly Action Items</h1>
        {review && <p className="text-sm text-muted-foreground">This week: {review.summary}</p>}
      </header>
      <section className="h-56 w-full" aria-label="Items by status">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="currentColor" />
          </BarChart>
        </ResponsiveContainer>
      </section>
      <DataTable data={items} columns={columns} />
    </div>
  );
}
