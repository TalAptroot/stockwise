import { formatCount, formatDateTime } from "../lib/format.ts";

export function MovementTable({
  rows,
}: {
  rows: ReadonlyArray<{
    id: number;
    createdAt: string;
    productName: string;
    type: "IN" | "OUT";
    quantity: number;
  }>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <caption className="sr-only">Stock movements</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
          <tr>
            <th scope="col" className="px-5 py-3 font-medium">
              Date
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Product
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Type
            </th>
            <th scope="col" className="px-5 py-3 text-right font-medium">
              Quantity
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-slate-50">
              <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">{formatDateTime(row.createdAt)}</td>
              <td className="px-5 py-3.5 font-medium break-words text-slate-900">{row.productName}</td>
              <td className="px-5 py-3.5">
                <TypeBadge type={row.type} />
              </td>
              <td className="px-5 py-3.5 text-right font-medium text-slate-900 tabular-nums">
                {formatCount(row.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TypeBadge({ type }: { type: "IN" | "OUT" }) {
  const tone =
    type === "IN" ? "bg-teal-50 text-teal-800 ring-teal-600/15" : "bg-orange-50 text-orange-800 ring-orange-600/15";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>
      {type}
    </span>
  );
}
