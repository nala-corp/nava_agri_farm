import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Search,
  History,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InventoryItem, InventoryCategory } from '../../types';
import { StorageService } from '../../services/storage';

export const InventoryManager: React.FC = () => {
  const { inventory, refreshData } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedItemForStock, setSelectedItemForStock] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [stockTxType, setStockTxType] = useState<'stock_in' | 'stock_out'>('stock_in');
  const [stockTxQty, setStockTxQty] = useState<number>(10);
  const [stockTxPrice, setStockTxPrice] = useState<number>(0);
  const [stockTxNotes, setStockTxNotes] = useState<string>('');

  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<InventoryCategory>('pupuk');
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [newItemStock, setNewItemStock] = useState(10);
  const [newItemMinStock, setNewItemMinStock] = useState(5);
  const [newItemCost, setNewItemCost] = useState(25000);
  const [newItemBrand, setNewItemBrand] = useState('');
  const [newItemLocation, setNewItemLocation] = useState('');

  // Transactions list
  const transactions = useMemo(() => {
    return StorageService.getInventoryTransactions();
  }, [inventory]);

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [inventory, categoryFilter, searchQuery]);

  // Summary Metrics
  const lowStockCount = inventory.filter(i => i.currentStock <= i.minStockAlert).length;
  const totalValuation = inventory.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);

  // Handle Add Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const item: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: newItemName,
      category: newItemCategory,
      unit: newItemUnit,
      currentStock: Number(newItemStock),
      minStockAlert: Number(newItemMinStock),
      unitPrice: Number(newItemCost),
      brand: newItemBrand || undefined,
      storageLocation: newItemLocation || undefined,
      isActive: true,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    StorageService.saveInventoryItem(item);
    refreshData();
    setShowAddItemModal(false);
    setNewItemName('');
    setNewItemBrand('');
    setNewItemLocation('');
  };

  // Handle Stock In / Out Transaction
  const handleStockTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForStock) return;

    const qty = Number(stockTxQty);
    const unitPrice = Number(stockTxPrice) || selectedItemForStock.unitPrice;
    
    // Update item stock
    const newStock = stockTxType === 'stock_in' 
      ? selectedItemForStock.currentStock + qty 
      : Math.max(0, selectedItemForStock.currentStock - qty);

    StorageService.saveInventoryItem({
      ...selectedItemForStock,
      currentStock: newStock,
      updatedAt: new Date().toISOString().split('T')[0]
    });

    StorageService.addInventoryTransaction({
      inventoryItemId: selectedItemForStock.id,
      itemName: selectedItemForStock.name,
      type: stockTxType,
      quantity: qty,
      unitPrice: unitPrice,
      totalCost: unitPrice * qty,
      date: new Date().toISOString().split('T')[0],
      reason: stockTxNotes || (stockTxType === 'stock_in' ? 'Pembelian / Penambahan Stok' : 'Pemakaian Lahan Manual')
    });

    refreshData();
    setSelectedItemForStock(null);
    setStockTxNotes('');
  };

  // Handle Edit Item
  const handleSaveEditedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    StorageService.saveInventoryItem({
      ...editingItem,
      currentStock: Number(editingItem.currentStock),
      minStockAlert: Number(editingItem.minStockAlert),
      unitPrice: Number(editingItem.unitPrice),
      updatedAt: new Date().toISOString().split('T')[0]
    });

    refreshData();
    setEditingItem(null);
  };

  // Handle Confirm Delete Item
  const handleConfirmDeleteItem = () => {
    if (!itemToDelete) return;
    StorageService.deleteInventoryItem(itemToDelete.id);
    refreshData();
    setItemToDelete(null);
  };

  return (
    <div className="space-y-5">
      
      {/* 1. HEADER & METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-medium">Total Item Saprotan</span>
            <Boxes className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 font-mono">
            {inventory.length} <span className="text-xs font-sans text-gray-400 font-normal">jenis item</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-2">
            Pupuk, Benih, Pestisida & Perlengkapan
          </div>
        </div>

        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-medium">Stok Kritis / Menipis</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono">
            {lowStockCount} <span className="text-xs font-sans text-gray-400 font-normal">perlu restock</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-2">
            Di bawah batas minimum cadangan SOP
          </div>
        </div>

        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-medium">Valuasi Aset Stok</span>
            <span className="text-emerald-700 text-xs font-mono font-bold">IDR</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
            Rp {totalValuation.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-gray-500 mt-2">
            Nilai persediaan sarana produksi
          </div>
        </div>

      </div>

      {/* 2. CONTROLS & FILTER */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Manajemen Inventaris & Saprotan
            </h2>
          </div>

          <button
            onClick={() => setShowAddItemModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-200 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + Tambah Item Baru
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama pupuk, benih, obat pestisida..."
              className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-emerald-600 focus:bg-white"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 text-xs">
            {['all', 'pupuk', 'obat', 'benih', 'alat', 'bahan'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 cursor-pointer transition-colors ${
                  categoryFilter === cat
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#f3f5f0] text-slate-600 hover:bg-[#e9ece6]'
                }`}
              >
                {cat === 'all' && 'Semua'}
                {cat === 'pupuk' && 'Pupuk'}
                {cat === 'obat' && 'Obat / Pestisida'}
                {cat === 'benih' && 'Benih'}
                {cat === 'alat' && 'Alat'}
                {cat === 'bahan' && 'Bahan'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. INVENTORY ITEMS TABLE */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="text-[11px] text-gray-500 uppercase bg-[#f9faf8] border-b border-[#e9ece6]">
              <tr>
                <th className="px-4 py-3">Nama Saprotan</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Stok Saat Ini</th>
                <th className="px-4 py-3">Batas Min</th>
                <th className="px-4 py-3">Harga Satuan</th>
                <th className="px-4 py-3">Total Nilai</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2ed]">
              {filteredInventory.map((item) => {
                const isLow = item.currentStock <= item.minStockAlert;

                return (
                  <tr key={item.id} className="hover:bg-[#f3f5f0]">
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        {isLow && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Stok menipis" />
                        )}
                        <span>{item.name}</span>
                      </div>
                      {item.storageLocation && (
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Lokasi: {item.storageLocation}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 capitalize text-gray-500">
                      <span className="px-2 py-0.5 rounded-md bg-[#f3f5f0] border border-[#e1e5db] text-[10px] font-medium text-slate-700">
                        {item.category}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono">
                      <span className={`font-bold text-sm ${isLow ? 'text-amber-700' : 'text-slate-800'}`}>
                        {item.currentStock}
                      </span> <span className="text-gray-400 text-xs">{item.unit}</span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-gray-500">
                      {item.minStockAlert} {item.unit}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-slate-700">
                      Rp {item.unitPrice.toLocaleString('id-ID')}
                    </td>

                    <td className="px-4 py-3.5 font-mono font-semibold text-emerald-700">
                      Rp {(item.currentStock * item.unitPrice).toLocaleString('id-ID')}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedItemForStock(item);
                            setStockTxType('stock_in');
                            setStockTxPrice(item.unitPrice);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] flex items-center gap-1 border border-emerald-200 cursor-pointer shadow-2xs transition-colors"
                          title="Tambah / Masuk Stok"
                        >
                          <ArrowDownRight className="w-3 h-3" /> Masuk
                        </button>

                        <button
                          onClick={() => {
                            setSelectedItemForStock(item);
                            setStockTxType('stock_out');
                            setStockTxPrice(item.unitPrice);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-[11px] flex items-center gap-1 border border-amber-200 cursor-pointer shadow-2xs transition-colors"
                          title="Gunakan / Kurang Stok"
                        >
                          <ArrowUpRight className="w-3 h-3" /> Keluar
                        </button>

                        <button
                          onClick={() => setEditingItem({ ...item })}
                          className="p-1 rounded-lg bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 border border-[#e1e5db] cursor-pointer shadow-2xs transition-colors"
                          title="Edit Detail Item"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer shadow-2xs transition-colors"
                          title="Hapus Item dari Inventaris"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. RECENT TRANSACTIONS LOG */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#e9ece6]">
          <History className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-sm text-slate-800">Riwayat Keluar/Masuk Stok & Pemakaian SOP</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="text-[10px] text-gray-500 uppercase bg-[#f9faf8] border-b border-[#e9ece6]">
              <tr>
                <th className="px-3 py-2">Tanggal</th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Tipe Transaksi</th>
                <th className="px-3 py-2">Jumlah</th>
                <th className="px-3 py-2">Total Biaya</th>
                <th className="px-3 py-2">Referensi / Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2ed] font-mono">
              {transactions.slice(0, 8).map((tx) => (
                <tr key={tx.id} className="hover:bg-[#f3f5f0]">
                  <td className="px-3 py-2 text-gray-500 font-sans">{tx.date}</td>
                  <td className="px-3 py-2 font-sans font-semibold text-slate-800">{tx.itemName}</td>
                  <td className="px-3 py-2 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tx.type === 'stock_in' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {tx.type === 'stock_in' ? 'STOK MASUK' : 'PEMAKAIAN / KELUAR'}
                    </span>
                  </td>
                  <td className={`px-3 py-2 font-bold ${tx.type === 'stock_in' ? 'text-emerald-700' : 'text-red-600'}`}>
                    {tx.type === 'stock_in' ? '+' : '-'}{tx.quantity}
                  </td>
                  <td className="px-3 py-2 text-slate-800">
                    Rp {(tx.totalCost || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="px-3 py-2 font-sans text-gray-500 max-w-[200px] truncate">
                    {tx.reason}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-400 font-sans">
                    Belum ada transaksi mutasi persediaan tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: STOCK IN / OUT TRANSACTION */}
      {selectedItemForStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-md p-5 text-slate-800 text-xs shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Catat Mutasi Stok: <span className="text-emerald-700">{selectedItemForStock.name}</span>
            </h3>
            <p className="text-gray-500 text-[11px] mb-3">
              Stok saat ini: {selectedItemForStock.currentStock} {selectedItemForStock.unit}
            </p>

            <form onSubmit={handleStockTransaction} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStockTxType('stock_in')}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    stockTxType === 'stock_in' ? 'bg-emerald-600 text-white' : 'bg-[#f3f5f0] text-slate-600 hover:bg-[#e9ece6]'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" /> Stok Masuk (Beli)
                </button>
                <button
                  type="button"
                  onClick={() => setStockTxType('stock_out')}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    stockTxType === 'stock_out' ? 'bg-red-600 text-white' : 'bg-[#f3f5f0] text-slate-600 hover:bg-[#e9ece6]'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> Stok Keluar (Pakai)
                </button>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Jumlah ({selectedItemForStock.unit})</label>
                <input
                  type="number"
                  step="any"
                  value={stockTxQty}
                  onChange={e => setStockTxQty(Number(e.target.value))}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono text-sm font-bold focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Harga Satuan (Rp/{selectedItemForStock.unit})</label>
                <input
                  type="number"
                  value={stockTxPrice}
                  onChange={e => setStockTxPrice(Number(e.target.value))}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Catatan Transaksi / Keterangan</label>
                <input
                  type="text"
                  value={stockTxNotes}
                  onChange={e => setStockTxNotes(e.target.value)}
                  placeholder="Contoh: Pembelian dari Toko Tani Makmur..."
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemForStock(null)}
                  className="px-3 py-1.5 rounded-lg bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-white cursor-pointer shadow-xs"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW INVENTORY ITEM */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-md p-5 text-slate-800 text-xs shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Tambah Item Saprotan Baru</h3>
            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-gray-600 mb-1 font-medium">Nama Item</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="Contoh: Pupuk NPK Mutiara 16-16-16"
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Kategori</label>
                  <select
                    value={newItemCategory}
                    onChange={e => setNewItemCategory(e.target.value as any)}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  >
                    <option value="pupuk">Pupuk</option>
                    <option value="obat">Obat / Pestisida</option>
                    <option value="benih">Benih / Bibit</option>
                    <option value="alat">Alat & Perlengkapan</option>
                    <option value="bahan">Bahan / Mulsa / Tali</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Satuan (Unit)</label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={e => setNewItemUnit(e.target.value)}
                    placeholder="kg, liter, botol, pack"
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Stok Awal</label>
                  <input
                    type="number"
                    step="any"
                    value={newItemStock}
                    onChange={e => setNewItemStock(Number(e.target.value))}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Batas Min Cadangan</label>
                  <input
                    type="number"
                    step="any"
                    value={newItemMinStock}
                    onChange={e => setNewItemMinStock(Number(e.target.value))}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    value={newItemCost}
                    onChange={e => setNewItemCost(Number(e.target.value))}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Merk / Brand (Opsional)</label>
                  <input
                    type="text"
                    value={newItemBrand}
                    onChange={e => setNewItemBrand(e.target.value)}
                    placeholder="Contoh: Cap Panah Merah"
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Lokasi Penyimpanan (Opsional)</label>
                <input
                  type="text"
                  value={newItemLocation}
                  onChange={e => setNewItemLocation(e.target.value)}
                  placeholder="Gudang A, Rak B2..."
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-white cursor-pointer shadow-xs"
                >
                  Simpan Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT INVENTORY ITEM */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-md p-5 text-slate-800 text-xs shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#e9ece6] pb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Edit className="w-4 h-4 text-emerald-700" />
                Edit Detail Item Saprotan
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedItem} className="space-y-3">
              <div>
                <label className="block text-gray-600 mb-1 font-medium">Nama Item Saprotan</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Kategori</label>
                  <select
                    value={editingItem.category}
                    onChange={e => setEditingItem({ ...editingItem, category: e.target.value as any })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  >
                    <option value="pupuk">Pupuk</option>
                    <option value="obat">Obat / Pestisida</option>
                    <option value="benih">Benih / Bibit</option>
                    <option value="alat">Alat & Perlengkapan</option>
                    <option value="bahan">Bahan / Mulsa / Tali</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Satuan (Unit)</label>
                  <input
                    type="text"
                    value={editingItem.unit}
                    onChange={e => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Stok Fisik Saat Ini</label>
                  <input
                    type="number"
                    step="any"
                    value={editingItem.currentStock}
                    onChange={e => setEditingItem({ ...editingItem, currentStock: Number(e.target.value) })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Batas Min Cadangan</label>
                  <input
                    type="number"
                    step="any"
                    value={editingItem.minStockAlert}
                    onChange={e => setEditingItem({ ...editingItem, minStockAlert: Number(e.target.value) })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    value={editingItem.unitPrice}
                    onChange={e => setEditingItem({ ...editingItem, unitPrice: Number(e.target.value) })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Merk / Produsen</label>
                  <input
                    type="text"
                    value={editingItem.brand || ''}
                    onChange={e => setEditingItem({ ...editingItem, brand: e.target.value })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Lokasi Penyimpanan</label>
                <input
                  type="text"
                  value={editingItem.storageLocation || ''}
                  onChange={e => setEditingItem({ ...editingItem, storageLocation: e.target.value })}
                  placeholder="Gudang A, Rak B2..."
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e9ece6]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 rounded-lg bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-white cursor-pointer shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-sm p-5 text-slate-800 text-xs shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Hapus Item Inventaris</h3>
                <p className="text-[11px] text-gray-500">Mencegah data salah input</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1 text-slate-700">
              <p>Apakah Anda yakin ingin menghapus item ini?</p>
              <div className="font-bold text-slate-800 text-xs mt-1">{itemToDelete.name}</div>
              <div className="text-[11px] text-gray-500">
                Kategori: <span className="capitalize">{itemToDelete.category}</span> | Stok: {itemToDelete.currentStock} {itemToDelete.unit}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] cursor-pointer font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteItem}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-xs transition-colors"
              >
                Ya, Hapus Item
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
