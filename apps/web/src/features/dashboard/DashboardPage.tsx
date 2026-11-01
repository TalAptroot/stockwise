import { useEffect, useState } from "react";
import { Button } from "../../components/Button.tsx";
import { EmptyState, ErrorState, Feedback, LoadingState } from "../../components/Feedback.tsx";
import { MovementTable } from "../../components/MovementTable.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { Panel } from "../../components/Panel.tsx";
import {
  errorMessage,
  getDashboard,
  isAbortError,
  listMovements,
  listProducts,
  type Dashboard,
  type Product,
} from "../../lib/api.ts";
import { formatCount, formatDecimal, productLabel } from "../../lib/format.ts";

type RecentRow = {
  id: number;
  createdAt: string;
  productName: string;
  type: "IN" | "OUT";
  quantity: number;
};

export function DashboardPage({ onOpenProducts }: { onOpenProducts: () => void }) {
  const [dashboardAttempt, setDashboardAttempt] = useState(0);
  const [recentAttempt, setRecentAttempt] = useState(0);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [recentRows, setRecentRows] = useState<RecentRow[] | null>(null);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [nameWarning, setNameWarning] = useState<string | null>(null);
  const [recentLoading, setRecentLoading] = useState(true);
  const dashboardKey = String(dashboardAttempt);
  const [seenDashboardKey, setSeenDashboardKey] = useState(dashboardKey);
  if (seenDashboardKey !== dashboardKey) {
    setSeenDashboardKey(dashboardKey);
    setDashboardLoading(true);
    setDashboardError(null);
  }
  const recentKey = String(recentAttempt);
  const [seenRecentKey, setSeenRecentKey] = useState(recentKey);
  if (seenRecentKey !== recentKey) {
    setSeenRecentKey(recentKey);
    setRecentLoading(true);
    setRecentError(null);
    setNameWarning(null);
  }

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    getDashboard({ signal: controller.signal })
      .then((data) => {
        if (cancelled) {
          return;
        }
        setDashboard(data);
        setDashboardLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) {
          return;
        }
        setDashboardError(errorMessage(error));
        setDashboardLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [dashboardAttempt]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      const [movementsResult, productsResult] = await Promise.allSettled([
        listMovements({ signal: controller.signal }),
        listProducts(undefined, { signal: controller.signal }),
      ]);
      if (cancelled) {
        return;
      }
      if (movementsResult.status === "rejected") {
        if (isAbortError(movementsResult.reason)) {
          return;
        }
        setRecentError(errorMessage(movementsResult.reason));
        setRecentLoading(false);
        return;
      }

      let products: Product[] = [];
      if (productsResult.status === "fulfilled") {
        products = productsResult.value;
      } else if (isAbortError(productsResult.reason)) {
        return;
      } else {
        setNameWarning(errorMessage(productsResult.reason));
      }

      const names = new Map(products.map((product) => [product.id, product.name]));
      setRecentRows(
        movementsResult.value.slice(0, 5).map((movement) => ({
          id: movement.id,
          createdAt: movement.createdAt,
          productName: productLabel(names.get(movement.productId), movement.productId),
          type: movement.type,
          quantity: movement.quantity,
        })),
      );
      setRecentLoading(false);
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [recentAttempt]);

  const recentDescription =
    dashboard === null
      ? "Latest stock activity"
      : recentRows !== null && dashboard.movementCount > recentRows.length
        ? `Showing ${formatCount(recentRows.length)} of ${formatCount(dashboard.movementCount)}`
        : `${formatCount(dashboard.movementCount)} recorded`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Stock levels, inventory value, and the latest movements."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              setDashboardAttempt((value) => value + 1);
              setRecentAttempt((value) => value + 1);
            }}
          >
            Refresh
          </Button>
        }
      />

      {dashboard === null && dashboardLoading ? <StatSkeletons /> : null}
      {dashboard === null && !dashboardLoading && dashboardError ? (
        <div className="overflow-hidden rounded-xl border border-rose-200 bg-white">
          <ErrorState message={dashboardError} onRetry={() => setDashboardAttempt((value) => value + 1)} />
        </div>
      ) : null}
      {dashboard !== null ? (
        <>
          {dashboardError ? <Feedback tone="error" message={dashboardError} /> : null}
          {dashboardLoading ? (
            <p className="text-xs text-slate-500" role="status">
              Updating dashboard…
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total products" value={formatCount(dashboard.productCount)} detail="Active catalog" />
            <StatCard label="Total stock" value={formatCount(dashboard.totalQuantity)} detail="Units on hand" />
            <StatCard
              label="Inventory value"
              value={formatDecimal(dashboard.inventoryValue)}
              detail="Price × quantity"
            />
            <StatCard
              label="Low stock"
              value={formatCount(dashboard.lowStockCount)}
              detail="At or below minimum"
              emphasize={dashboard.lowStockCount > 0}
            />
          </div>
          <Panel
            title="Low stock"
            description="Products whose quantity is at or below the minimum."
            action={
              <Button variant="ghost" size="sm" onClick={onOpenProducts}>
                View products
              </Button>
            }
          >
            {dashboard.lowStock.length === 0 ? (
              <EmptyState
                title="No low-stock products"
                description="Every product is above its minimum quantity."
              />
            ) : (
              <div className="max-h-96 overflow-auto">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <caption className="sr-only">Low stock products</caption>
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Product
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        SKU
                      </th>
                      <th scope="col" className="px-5 py-3 text-right font-medium">
                        On hand
                      </th>
                      <th scope="col" className="px-5 py-3 text-right font-medium">
                        Minimum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dashboard.lowStock.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-3.5 font-medium break-words text-slate-900">{item.name}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-700">{item.sku}</td>
                        <td className="px-5 py-3.5 text-right font-medium text-amber-800 tabular-nums">
                          {formatCount(item.quantity)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-600 tabular-nums">
                          {formatCount(item.minQuantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      ) : null}

      <Panel title="Recent movements" description={recentDescription}>
        {recentError && recentRows !== null ? (
          <div className="px-5 pt-4">
            <Feedback tone="error" message={recentError} />
          </div>
        ) : null}
        {nameWarning && recentRows !== null && recentRows.length > 0 ? (
          <div className="px-5 pt-4">
            <Feedback tone="error" message={`Could not load product names. ${nameWarning}`} />
          </div>
        ) : null}
        {recentLoading && recentRows !== null ? (
          <p className="px-5 pt-4 text-xs text-slate-500" role="status">
            Updating movements…
          </p>
        ) : null}
        {recentRows === null && recentLoading ? <LoadingState label="Loading recent movements" /> : null}
        {recentRows === null && !recentLoading && recentError ? (
          <ErrorState message={recentError} onRetry={() => setRecentAttempt((value) => value + 1)} />
        ) : null}
        {recentRows !== null && recentRows.length === 0 ? (
          <EmptyState title="No movements yet" description="Stock in and stock out will show up here." />
        ) : null}
        {recentRows !== null && recentRows.length > 0 ? <MovementTable rows={recentRows} /> : null}
      </Panel>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  emphasize = false,
}: {
  label: string;
  value: string;
  detail: string;
  emphasize?: boolean;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-medium text-slate-500">{label}</h2>
      <p
        className={`mt-3 text-2xl font-semibold tracking-tight break-words tabular-nums ${emphasize ? "text-amber-800" : "text-slate-900"}`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

function StatSkeletons() {
  return (
    <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <span className="sr-only">Loading dashboard</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
      ))}
    </div>
  );
}
