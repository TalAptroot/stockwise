import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "../../components/Button.tsx";
import { Field } from "../../components/Field.tsx";
import { EmptyState, ErrorState, Feedback, LoadingState } from "../../components/Feedback.tsx";
import { MovementTable } from "../../components/MovementTable.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { Panel } from "../../components/Panel.tsx";
import {
  createMovement,
  errorMessage,
  isAbortError,
  listMovements,
  listProducts,
  type Product,
  type StockMovement,
} from "../../lib/api.ts";
import { formatCount, productLabel } from "../../lib/format.ts";
import { controlClassName, controlErrorClassName } from "../../lib/styles.ts";
import {
  MAX_INT,
  parseIntegerInRange,
  validateMovement,
  type MovementFormErrors,
} from "../../lib/validation.ts";

type MovementRow = {
  id: number;
  createdAt: string;
  productName: string;
  type: "IN" | "OUT";
  quantity: number;
};

export function MovementsPage({ onOpenProducts }: { onOpenProducts: () => void }) {
  const formId = useId();
  const productFieldId = `${formId}-product`;
  const quantityFieldId = `${formId}-quantity`;
  const mountedRef = useRef(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [movements, setMovements] = useState<StockMovement[] | null>(null);
  const [movementsError, setMovementsError] = useState<string | null>(null);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [productId, setProductId] = useState("");
  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState("");
  const [errors, setErrors] = useState<MovementFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const loadKey = String(reloadToken);
  const [seenLoadKey, setSeenLoadKey] = useState(loadKey);
  if (seenLoadKey !== loadKey) {
    setSeenLoadKey(loadKey);
    setLoadingProducts(true);
    setLoadingMovements(true);
    setProductsError(null);
    setMovementsError(null);
  }
  const catalogKey = products?.map((product) => product.id).join(",") ?? "";
  const [seenCatalog, setSeenCatalog] = useState(catalogKey);
  if (seenCatalog !== catalogKey) {
    setSeenCatalog(catalogKey);
    if (products !== null) {
      setProductId((current) => {
        if (current.length === 0) {
          return current;
        }
        const id = Number(current);
        return products.some((product) => product.id === id) ? current : "";
      });
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    listProducts(undefined, { signal: controller.signal })
      .then((next) => {
        if (cancelled) {
          return;
        }
        setProducts(next);
        setLoadingProducts(false);
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) {
          return;
        }
        setProductsError(errorMessage(error));
        setLoadingProducts(false);
      });

    listMovements({ signal: controller.signal })
      .then((next) => {
        if (cancelled) {
          return;
        }
        setMovements(next);
        setLoadingMovements(false);
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) {
          return;
        }
        setMovementsError(errorMessage(error));
        setLoadingMovements(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadToken]);

  const selected = products?.find((product) => String(product.id) === productId);
  const parsedQuantity = parseIntegerInRange(quantity.trim(), 1, MAX_INT);
  const quantityInvalid = quantity.trim().length > 0 && parsedQuantity === undefined;
  const quantityError =
    errors.quantity ?? (quantityInvalid ? "Enter a whole number from 1 to 2147483647." : undefined);
  const canSubmit = !saving && parsedQuantity !== undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBanner(null);
    setFormError(null);
    const result = validateMovement({ productId, type, quantity });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (products !== null && !products.some((product) => product.id === result.value.productId)) {
      setErrors({ productId: "Select a product." });
      return;
    }
    setSaving(true);
    try {
      await createMovement(result.value);
      if (!mountedRef.current) {
        return;
      }
      setQuantity("");
      setErrors({});
      setBanner("Movement recorded.");
      setReloadToken((value) => value + 1);
      setSaving(false);
    } catch (error: unknown) {
      if (!mountedRef.current || isAbortError(error)) {
        return;
      }
      setFormError(errorMessage(error));
      setSaving(false);
    }
  }

  const rows: MovementRow[] | null =
    movements === null
      ? null
      : movements.map((movement) => ({
          id: movement.id,
          createdAt: movement.createdAt,
          productName: productLabel(
            products?.find((product) => product.id === movement.productId)?.name,
            movement.productId,
          ),
          type: movement.type,
          quantity: movement.quantity,
        }));

  const historyLoading = rows === null || (products === null && productsError === null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock movements"
        description="Record stock in or stock out, then review the history."
        actions={
          <Button variant="secondary" onClick={() => setReloadToken((value) => value + 1)}>
            Refresh
          </Button>
        }
      />

      {banner ? <Feedback tone="success" message={banner} onDismiss={() => setBanner(null)} /> : null}

      <Panel title="Record movement" description="Choose a product, a direction, and a whole-number quantity.">
        {products === null && productsError === null ? <LoadingState label="Loading products" /> : null}
        {products === null && productsError !== null ? (
          <ErrorState message={productsError} onRetry={() => setReloadToken((value) => value + 1)} />
        ) : null}
        {products !== null && products.length === 0 ? (
          <EmptyState
            title="No products yet"
            description="Add a product before recording a stock movement."
            action={<Button onClick={onOpenProducts}>Go to products</Button>}
          />
        ) : null}
        {products !== null && products.length > 0 ? (
          <form id={formId} className="grid gap-4 px-5 py-4 sm:grid-cols-2" noValidate onSubmit={handleSubmit}>
            {loadingProducts ? (
              <p className="text-xs text-slate-500 sm:col-span-2" role="status">
                Updating products…
              </p>
            ) : null}
            {productsError ? (
              <div className="sm:col-span-2">
                <Feedback tone="error" message={productsError} />
              </div>
            ) : null}
            {formError ? (
              <div className="sm:col-span-2">
                <Feedback tone="error" message={formError} />
              </div>
            ) : null}
            <Field
              id={productFieldId}
              label="Product"
              error={errors.productId}
              hint={selected ? stockHint(selected) : undefined}
            >
              <select
                id={productFieldId}
                value={productId}
                onChange={(event) => {
                  setProductId(event.target.value);
                  setErrors((current) => ({ ...current, productId: undefined }));
                }}
                aria-invalid={errors.productId ? true : undefined}
                aria-describedby={errors.productId || selected ? `${productFieldId}-message` : undefined}
                className={`${controlClassName} ${errors.productId ? controlErrorClassName : ""}`}
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={String(product.id)}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </Field>
            <fieldset>
              <legend className="mb-1.5 block text-sm font-medium text-slate-700">Type</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["IN", "OUT"] as const).map((option) => {
                  const selectedType = type === option;
                  return (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition focus-within:ring-2 focus-within:ring-teal-700/30 ${
                        selectedType
                          ? "border-teal-700 bg-teal-50 text-teal-800"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-medium">{option === "IN" ? "Stock in" : "Stock out"}</span>
                      <span className="text-xs">{option}</span>
                      <input
                        type="radio"
                        name={`${formId}-type`}
                        value={option}
                        checked={selectedType}
                        onChange={() => {
                          setType(option);
                          setErrors((current) => ({ ...current, type: undefined }));
                        }}
                        className="sr-only"
                      />
                    </label>
                  );
                })}
              </div>
              {errors.type ? <p className="mt-1.5 text-sm text-rose-700">{errors.type}</p> : null}
              {type === "OUT" ? (
                <p className="mt-1.5 text-sm text-slate-500">Stock out cannot exceed the quantity on hand.</p>
              ) : null}
            </fieldset>
            <div className="sm:col-span-2 sm:max-w-xs">
              <label htmlFor={quantityFieldId} className="mb-1.5 block text-sm font-medium text-slate-700">
                Quantity
              </label>
              <input
                id={quantityFieldId}
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value);
                  setErrors((current) => ({ ...current, quantity: undefined }));
                }}
                inputMode="numeric"
                maxLength={10}
                autoComplete="off"
                aria-invalid={quantityError ? true : undefined}
                aria-describedby={`${quantityFieldId}-message`}
                className={`${controlClassName} ${quantityError ? controlErrorClassName : ""}`}
              />
              <p
                id={`${quantityFieldId}-message`}
                className={`mt-1.5 text-sm ${quantityError ? "text-rose-700" : "text-slate-500"}`}
              >
                {quantityError ?? "Whole number of at least 1."}
              </p>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={!canSubmit}>
                {saving ? "Recording…" : "Record movement"}
              </Button>
            </div>
          </form>
        ) : null}
      </Panel>

      <Panel title="History" description="Newest movements first.">
        {movementsError && rows !== null ? (
          <div className="px-5 pt-4">
            <Feedback tone="error" message={movementsError} />
          </div>
        ) : null}
        {loadingMovements && rows !== null ? (
          <p className="px-5 pt-4 text-xs text-slate-500" role="status">
            Updating movements…
          </p>
        ) : null}
        {rows === null && loadingMovements ? <LoadingState label="Loading movements" /> : null}
        {rows === null && !loadingMovements && movementsError ? (
          <ErrorState message={movementsError} onRetry={() => setReloadToken((value) => value + 1)} />
        ) : null}
        {rows !== null && historyLoading ? <LoadingState label="Loading product names" /> : null}
        {rows !== null && !historyLoading && rows.length === 0 ? (
          <EmptyState title="No movements yet" description="Record stock in or stock out to build a history." />
        ) : null}
        {rows !== null && !historyLoading && rows.length > 0 ? <MovementTable rows={rows} /> : null}
      </Panel>
    </div>
  );
}

function stockHint(product: Product): string {
  const onHand = `${formatCount(product.quantity)} on hand`;
  if (product.quantity <= product.minQuantity) {
    return `${onHand}. This product is at or below its minimum of ${formatCount(product.minQuantity)}.`;
  }
  return `${onHand}.`;
}
