import { Button } from "@/components/ui/button"


type InventoryItem = {
  id: number;
  name: string;
  sku: string;
  category: string;
  inStock: number;
  reorderPoint: number;
  unitCost: number;
};

const inventory: InventoryItem[] = [
  {
    id: 1,
    name: "Small Cardboard Box",
    sku: "BX-SM",
    category: "Boxes",
    inStock: 120,
    reorderPoint: 50,
    unitCost: 0.25,
  },
  {
    id: 2,
    name: "Medium Cardboard Box",
    sku: "BX-MD",
    category: "Boxes",
    inStock: 40,
    reorderPoint: 60,
    unitCost: 0.35,
  },
  {
    id: 3,
    name: "Large Cardboard Box",
    sku: "BX-LG",
    category: "Boxes",
    inStock: 15,
    reorderPoint: 40,
    unitCost: 0.5,
  },
  {
    id: 4,
    name: "Packing Tape Roll",
    sku: "TP-CLR",
    category: "Supplies",
    inStock: 75,
    reorderPoint: 30,
    unitCost: 1.2,
  },
  {
    id: 5,
    name: "Bubble Wrap (Roll)",
    sku: "BW-ROLL",
    category: "Supplies",
    inStock: 18,
    reorderPoint: 25,
    unitCost: 3.5,
  },
];

function getStatus(item: InventoryItem) {
  if (item.inStock <= 0) return "Out of Stock";
  if (item.inStock <= item.reorderPoint) return "Reorder";
  return "OK";
}

function getStatusClasses(status: string) {
  if (status === "Out of Stock") {
    return "inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700";
  }
  if (status === "Reorder") {
    return "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700";
  }
  return "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700";
}

export default function SupplyCostPage() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-4xl font-semibold text-sky-600 tracking-wide drop-shadow-md">Inventory</h2>
        <p className="mt-2 text-white-600 text-sm">
          Simple inventory view. Later you can hook this up to MongoDB instead
          of hard-coded data.
        </p>
      </header>

      <div>
        <Button>Add Data</Button>
      </div>
      
      <div>
        <Button>Load Data</Button>
      </div>

      <section className="rounded-xl border bg-sky-600 shadow-sm">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
            Inventory Table
          </h3>
          <span className="text-xs text-slate-500">
            Total items: {inventory.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Item</th>
                <th className="px-6 py-3 text-left font-medium">SKU</th>
                <th className="px-6 py-3 text-left font-medium">Category</th>
                <th className="px-6 py-3 text-right font-medium">In Stock</th>
                <th className="px-6 py-3 text-right font-medium">
                  Reorder Point
                </th>
                <th className="px-6 py-3 text-right font-medium">Unit Cost ($)</th>
                <th className="px-6 py-3 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map((item) => {
                const status = getStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-slate-800">{item.name}</td>
                    <td className="px-6 py-3 text-slate-600">{item.sku}</td>
                    <td className="px-6 py-3 text-slate-600">{item.category}</td>
                    <td className="px-6 py-3 text-right tabular-nums text-slate-800">
                      {item.inStock}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums text-slate-600">
                      {item.reorderPoint}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums text-slate-800">
                      {item.unitCost.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={getStatusClasses(status)}>{status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t bg-slate-50 text-xs text-slate-500">
          In the future we are planning to add a filter by category or show low-stock items only.
        </div>
      </section>
    </div>
  );
}