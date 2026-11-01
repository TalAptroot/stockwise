import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../../components/Button.tsx";
import { EmptyState, ErrorState, Feedback, LoadingState } from "../../components/Feedback.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { Panel } from "../../components/Panel.tsx";
import { errorMessage, isAbortError, listProducts, type Product } from "../../lib/api.ts";
import { formatCount, formatDecimal } from "../../lib/format.ts";
import { controlClassName } from "../../lib/styles.ts";
import { DeleteProductModal } from "./DeleteProductModal.tsx";
import { ProductFormModal } from "./ProductFormModal.tsx";

type ProductDialog =
  | { kind: "create" }
  | { kind: "edit"; product: Product }
  | { kind: "delete"; product: Product };

export function ProductsPage() {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [dialog, setDialog] = useState<ProductDialog | null>(null);
  const loadKey = `${query}:${reloadToken}`;
  const [seenLoadKey, setSeenLoadKey] = useState(loadKey);
  if (seenLoadKey !== loadKey) {
    setSeenLoadKey(loadKey);
    setLoading(true);
    setLoadError(null);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(draft.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    listProducts(query.length > 0 ? query : undefined, { signal: controller.signal })
      .then((next) => {
        if (cancelled) {
          return;
        }
        setProducts(next);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) {
          return;
        }
        setLoadError(errorMessage(error));
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [query, reloadToken]);

  function handleComplete(message: string) {
    setDialog(null);
    setBanner({ tone: "success", message });
    setReloadToken((value) => value + 1);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(draft.trim());
  }

  const description =
    products === null
      ? "Search by name or SKU, then add or update the catalog."
      : query.length > 0
        ? `${formatCount(products.length)} matching ${products.length === 1 ? "product" : "products"}`
        : `${formatCount(products.length)} ${products.length === 1 ? "product" : "products"}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Catalog, prices, and minimum stock levels."
        actions={
          <>
            <Button variant="secondary" onClick={() => setReloadToken((value) => value + 1)}>
              Refresh
            </Button>
            <Button onClick={() => setDialog({ kind: "create" })}>Add product</Button>
          </>
        }
      />

      {banner ? <Feedback tone={banner.tone} message={banner.message} onDismiss={() => setBanner(null)} /> : null}

      <form
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
        onSubmit={submitSearch}
      >
        <label className="sr-only" htmlFor="product-search">
          Search products
        </label>
        <input
          id="product-search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search name or SKU"
          maxLength={191}
          autoComplete="off"
          className={controlClassName}
        />
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            Search
          </Button>
          {draft.length > 0 ? (
            <Button
              variant="ghost"
              onClick={() => {
                setDraft("");
                setQuery("");
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </form>

      {products === null && loading ? (
        <Panel title="Catalog" description={description}>
          <LoadingState label="Loading products" />
        </Panel>
      ) : null}
      {products === null && !loading && loadError ? (
        <div className="overflow-hidden rounded-xl border border-rose-200 bg-white">
          <ErrorState message={loadError} onRetry={() => setReloadToken((value) => value + 1)} />
        </div>
      ) : null}
      {products !== null ? (
        <Panel title="Catalog" description={description}>
          {loadError ? (
            <div className="px-5 pt-4">
              <Feedback tone="error" message={loadError} />
            </div>
          ) : null}
          {loading ? (
            <p className="px-5 pt-4 text-xs text-slate-500" role="status">
              Updating products…
            </p>
          ) : null}
          {products.length === 0 ? (
            <EmptyState
              title={query.length > 0 ? "No matching products" : "No products yet"}
              description={
                query.length > 0
                  ? "Try a different name or SKU, or clear the search to see the full catalog."
                  : "Add a product to start tracking price and stock."
              }
              action={
                query.length > 0 ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setDraft("");
                      setQuery("");
                    }}
                  >
                    Clear search
                  </Button>
                ) : (
                  <Button onClick={() => setDialog({ kind: "create" })}>Add product</Button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] text-left text-sm">
                <caption className="sr-only">Products</caption>
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Name
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      SKU
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Category
                    </th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">
                      Price
                    </th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">
                      Quantity
                    </th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">
                      Min. quantity
                    </th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-medium break-words text-slate-900">{product.name}</td>
                      <td className="px-5 py-3.5 font-mono text-xs whitespace-nowrap text-slate-700">{product.sku}</td>
                      <td className="px-5 py-3.5 break-words text-slate-600">{product.category}</td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap text-slate-900 tabular-nums">
                        {formatDecimal(product.price)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <span className="tabular-nums text-slate-900">{formatCount(product.quantity)}</span>
                          {product.quantity <= product.minQuantity ? <LowStockBadge /> : null}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-600 tabular-nums">
                        {formatCount(product.minQuantity)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1 whitespace-nowrap">
                          <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "edit", product })}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger-ghost"
                            onClick={() => setDialog({ kind: "delete", product })}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      ) : null}

      {dialog?.kind === "create" ? (
        <ProductFormModal mode="create" onClose={() => setDialog(null)} onComplete={handleComplete} />
      ) : null}
      {dialog?.kind === "edit" ? (
        <ProductFormModal
          key={dialog.product.id}
          mode="edit"
          product={dialog.product}
          onClose={() => setDialog(null)}
          onComplete={handleComplete}
        />
      ) : null}
      {dialog?.kind === "delete" ? (
        <DeleteProductModal product={dialog.product} onClose={() => setDialog(null)} onComplete={handleComplete} />
      ) : null}
    </div>
  );
}

function LowStockBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200 ring-inset">
      Low stock
    </span>
  );
}
