import React, { useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  ArrowRight,
  Plus,
  PackageCheck,
  CheckCircle2,
  X
} from 'lucide-react';
import { InventoryItem } from '../../types';
import { StorageService } from '../../services/storage';

interface LowStockWidgetProps {
  inventory: InventoryItem[];
  onOpenInventory: () => void;
  onRefresh: () => void;
}

export const LowStockWidget: React.FC<LowStockWidgetProps> = ({
  inventory,
  onOpenInventory,
  onRefresh
}) => {
  const [restockingItem, setRestockingItem] = useState<InventoryItem | null>(null);
  const [addedStock, setAddedStock] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(0);

  // Filter low stock items
  const lowStockItems = inventory.filter(
    item => item.isActive && item.currentStock <= item.minStockAlert
  );

  const handleQuickRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingItem) return;

    const newStock = restockingItem.currentStock + Number(addedStock);
    const updated: InventoryItem = {
      ...restockingItem,
      currentStock: newStock,
      updatedAt: new Date().toISOString()
    };

    StorageService.saveInventoryItem(updated);

    // Record transaction
    StorageService.addInventoryTransaction({
      inventoryItemId: restockingItem.id,
      itemName: restockingItem.name,
      type: 'stock_in',
      quantity: Number(addedStock),
      unitPrice: Number(unitCost) || restockingItem.unitPrice,
      totalCost: Number(addedStock) * (Number(unitCost) || restockingItem.unitPrice),
      reason: 'Restok Cepat dari Peringatan Dashboard',
      date: new Date().toISOString().split('T')[0]
    });

    onRefresh();
    setRestockingItem(null);
  };

  return (
    <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#e9ece6]">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            lowStockItems.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {lowStockItems.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <PackageCheck className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              Peringatan Stok & Inventaris
            </h3>
            <p className="text-[11px] text-gray-500">
              {lowStockItems.length > 0
                ? `${lowStockItems.length} bahan pertanian di bawah batas minimum`
                : 'Semua stok pupuk & obat dalam kondisi aman'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenInventory}
          className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
        >
          Ke Inventaris <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-3 space-y-2.5">
        {lowStockItems.length > 0 ? (
          lowStockItems.slice(0, 3).map(item => {
            const isCritical = item.currentStock <= 0;
            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                  isCritical
                    ? 'bg-red-50/70 border-red-200'
                    : 'bg-amber-50/50 border-amber-200'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 truncate">{item.name}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        isCritical
                          ? 'bg-red-200 text-red-900'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {isCritical ? 'HABIS' : 'MENIPIS'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
                    <span>
                      Sisa: <strong className="text-slate-800 font-mono">{item.currentStock} {item.unit}</strong>
                    </span>
                    <span>•</span>
                    <span>Min: {item.minStockAlert} {item.unit}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRestockingItem(item);
                    setAddedStock(Math.max(10, item.minStockAlert * 2));
                    setUnitCost(item.unitPrice || 0);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  Restok
                </button>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-xs text-gray-500 bg-[#f9faf8] rounded-xl border border-[#e9ece6]">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
            Stok bahan (pupuk, pestisida, fungisida) mencukupi kebutuhan SOP.
          </div>
        )}
      </div>

      {/* Quick Restock Modal */}
      {restockingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-sm p-5 text-slate-800 text-xs shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e9ece6]">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Restok: {restockingItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRestockingItem(null)}
                className="p-1 text-gray-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickRestockSubmit} className="space-y-3">
              <div className="bg-[#f9faf8] p-3 rounded-xl border border-[#e9ece6] text-[11px] space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Stok Saat Ini:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {restockingItem.currentStock} {restockingItem.unit}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Ambang Minimum:</span>
                  <span className="font-mono">{restockingItem.minStockAlert} {restockingItem.unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-1 font-semibold">
                  Jumlah Tambah Stok ({restockingItem.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={addedStock}
                  onChange={e => setAddedStock(Number(e.target.value))}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono font-bold text-center text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1 font-semibold">
                  Estimasi Harga Beli Satuan (Rp/{restockingItem.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  value={unitCost}
                  onChange={e => setUnitCost(Number(e.target.value))}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono text-sm"
                />
              </div>

              <div className="pt-2 border-t border-[#e9ece6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockingItem(null)}
                  className="px-3 py-2 rounded-xl bg-[#f3f5f0] text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Simpan & Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
