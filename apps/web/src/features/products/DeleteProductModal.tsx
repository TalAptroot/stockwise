import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/Button.tsx";
import { Feedback } from "../../components/Feedback.tsx";
import { Modal } from "../../components/Modal.tsx";
import { deleteProduct, errorMessage, isAbortError, type Product } from "../../lib/api.ts";

export function DeleteProductModal({
  product,
  onClose,
  onComplete,
}: {
  product: Product;
  onClose: () => void;
  onComplete: (message: string) => void;
}) {
  const mountedRef = useRef(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function confirmDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteProduct(product.id);
      if (!mountedRef.current) {
        return;
      }
      onComplete("Product deleted.");
    } catch (caught: unknown) {
      if (!mountedRef.current || isAbortError(caught)) {
        return;
      }
      setError(errorMessage(caught));
      setDeleting(false);
    }
  }

  return (
    <Modal
      title={`Delete ${product.name}?`}
      description="Products with stock history cannot be deleted. If this product has movements, it stays in the catalog."
      busy={deleting}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose} disabled={deleting} autoFocus>
            Cancel
          </Button>
          <Button variant="danger" className="w-full sm:w-auto" onClick={() => void confirmDelete()} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete product"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <Feedback tone="error" message={error} /> : null}
        <p className="text-sm text-slate-600">
          This removes <span className="font-medium text-slate-900">{product.name}</span> ({product.sku}). This cannot
          be undone.
        </p>
      </div>
    </Modal>
  );
}
