import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "../../components/Button.tsx";
import { TextField } from "../../components/Field.tsx";
import { Feedback } from "../../components/Feedback.tsx";
import { Modal } from "../../components/Modal.tsx";
import { createProduct, errorMessage, isAbortError, updateProduct, type Product } from "../../lib/api.ts";
import { formatCount } from "../../lib/format.ts";
import { validateProductCreate, validateProductUpdate, type ProductFormErrors } from "../../lib/validation.ts";

type FormValues = {
  name: string;
  sku: string;
  category: string;
  price: string;
  quantity: string;
  minQuantity: string;
};

export function ProductFormModal({
  mode,
  product,
  onClose,
  onComplete,
}: {
  mode: "create" | "edit";
  product?: Product;
  onClose: () => void;
  onComplete: (message: string) => void;
}) {
  const formId = useId();
  const mountedRef = useRef(true);
  const [values, setValues] = useState<FormValues>(() =>
    mode === "edit" && product
      ? {
          name: product.name,
          sku: product.sku,
          category: product.category,
          price: product.price,
          quantity: "",
          minQuantity: String(product.minQuantity),
        }
      : {
          name: "",
          sku: "",
          category: "",
          price: "",
          quantity: "",
          minQuantity: "",
        },
  );
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function updateField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (current[field] === undefined) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (mode === "edit") {
      if (product === undefined) {
        setSubmitError("This product is no longer available.");
        return;
      }
      const result = validateProductUpdate(values);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setSaving(true);
      try {
        await updateProduct(product.id, result.value);
        if (!mountedRef.current) {
          return;
        }
        onComplete("Product updated.");
      } catch (error: unknown) {
        if (!mountedRef.current || isAbortError(error)) {
          return;
        }
        setSubmitError(errorMessage(error));
        setSaving(false);
      }
      return;
    }

    const result = validateProductCreate(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setSaving(true);
    try {
      await createProduct(result.value);
      if (!mountedRef.current) {
        return;
      }
      onComplete("Product added.");
    } catch (error: unknown) {
      if (!mountedRef.current || isAbortError(error)) {
        return;
      }
      setSubmitError(errorMessage(error));
      setSaving(false);
    }
  }

  return (
    <Modal
      title={mode === "create" ? "Add product" : "Edit product"}
      description={
        mode === "create"
          ? "Name, SKU, category, and price are required."
          : "Quantity stays unchanged. Record a stock movement to adjust it."
      }
      wide
      busy={saving}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} className="w-full sm:w-auto" disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Add product" : "Save changes"}
          </Button>
        </>
      }
    >
      <form id={formId} className="grid gap-4 sm:grid-cols-2" noValidate onSubmit={handleSubmit}>
        {submitError ? (
          <div className="sm:col-span-2">
            <Feedback tone="error" message={submitError} />
          </div>
        ) : null}
        {mode === "edit" && product ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:col-span-2">
            {formatCount(product.quantity)} on hand. Change quantity by recording a stock movement.
          </p>
        ) : null}
        <TextField
          id={`${formId}-name`}
          label="Name"
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
          error={errors.name}
          maxLength={191}
          autoFocus
          autoComplete="off"
          className="sm:col-span-2"
        />
        <TextField
          id={`${formId}-sku`}
          label="SKU"
          value={values.sku}
          onChange={(event) => updateField("sku", event.target.value)}
          error={errors.sku}
          maxLength={191}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <TextField
          id={`${formId}-category`}
          label="Category"
          value={values.category}
          onChange={(event) => updateField("category", event.target.value)}
          error={errors.category}
          maxLength={191}
          autoComplete="off"
        />
        <TextField
          id={`${formId}-price`}
          label="Price"
          value={values.price}
          onChange={(event) => updateField("price", event.target.value)}
          error={errors.price}
          hint="Up to 8 digits and 2 decimal places."
          inputMode="decimal"
          maxLength={11}
          autoComplete="off"
          placeholder="12.50"
        />
        {mode === "create" ? (
          <TextField
            id={`${formId}-quantity`}
            label="Quantity"
            value={values.quantity}
            onChange={(event) => updateField("quantity", event.target.value)}
            error={errors.quantity}
            hint="Blank counts as 0."
            inputMode="numeric"
            maxLength={10}
            autoComplete="off"
          />
        ) : null}
        <TextField
          id={`${formId}-min`}
          label="Minimum quantity"
          value={values.minQuantity}
          onChange={(event) => updateField("minQuantity", event.target.value)}
          error={errors.minQuantity}
          hint={mode === "create" ? "Blank counts as 0." : "Whole number, 0 or greater."}
          inputMode="numeric"
          maxLength={10}
          autoComplete="off"
          className={mode === "edit" ? "sm:col-span-2" : undefined}
        />
      </form>
    </Modal>
  );
}
