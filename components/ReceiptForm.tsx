
import React, { useState } from 'react';
import { ReceiptData, ReceiptItem, PrinterWidth } from '../types';

interface ReceiptFormProps {
  data: ReceiptData;
  onUpdate: (data: Partial<ReceiptData>) => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, updates: Partial<ReceiptItem>) => void;
  onAiParse: (text: string) => Promise<void>;
  isAiProcessing: boolean;
}

export const ReceiptForm: React.FC<ReceiptFormProps> = ({ 
  data, 
  onUpdate, 
  onAddItem, 
  onRemoveItem, 
  onUpdateItem,
  onAiParse,
  isAiProcessing
}) => {
  const [aiInput, setAiInput] = useState('');

  return (
    <div className="space-y-8">
      {/* Settings Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider">Printer Settings</h3>
        <div className="flex gap-4">
          <label className="flex-1">
            <span className="text-xs font-semibold text-gray-600 block mb-1">Paper Width</span>
            <select 
              value={data.printerWidth}
              onChange={(e) => onUpdate({ printerWidth: e.target.value as PrinterWidth })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="58mm">58mm (Small Mobile/ECO250)</option>
              <option value="80mm">80mm (Desktop Standard)</option>
            </select>
          </label>
        </div>
      </section>

      {/* Company Info Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider">Business Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Company Name</label>
            <input 
              type="text" 
              value={data.companyName}
              onChange={(e) => onUpdate({ companyName: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">TIN Number</label>
            <input 
              type="text" 
              value={data.tin}
              onChange={(e) => onUpdate({ tin: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-gray-600">Address</label>
            <input 
              type="text" 
              value={data.address}
              onChange={(e) => onUpdate({ address: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Phone</label>
            <input 
              type="text" 
              value={data.phone}
              onChange={(e) => onUpdate({ phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">FS Number</label>
            <input 
              type="text" 
              value={data.fsNo}
              onChange={(e) => onUpdate({ fsNo: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </section>

      {/* Items List Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider">Items</h3>
          <button 
            onClick={onAddItem}
            className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold hover:bg-indigo-100 transition-colors"
          >
            + Add Line
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {data.items.map((item) => (
            <div key={item.id} className="flex gap-2 items-start">
              <input 
                type="text" 
                placeholder="Description"
                value={item.description}
                onChange={(e) => onUpdateItem(item.id, { description: e.target.value })}
                className="flex-[2] px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <input 
                type="number" 
                placeholder="Qty"
                value={item.quantity || ''}
                onChange={(e) => {
                   const qty = parseFloat(e.target.value) || 0;
                   onUpdateItem(item.id, { 
                     quantity: qty, 
                     amount: qty * (item.unitPrice || 0)
                   });
                }}
                className="w-16 px-2 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <input 
                type="number" 
                placeholder="Price"
                value={item.unitPrice || ''}
                onChange={(e) => {
                   const price = parseFloat(e.target.value) || 0;
                   onUpdateItem(item.id, { 
                     unitPrice: price, 
                     amount: (item.quantity || 1) * price
                   });
                }}
                className="w-20 px-2 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <div className="w-20 px-3 py-2 bg-gray-50 border rounded-md text-sm text-right font-medium text-gray-600">
                {item.amount?.toFixed(2) || '0.00'}
              </div>
              <button 
                onClick={() => onRemoveItem(item.id)}
                className="p-2 text-red-400 hover:text-red-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* AI Smart Fill */}
        <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
          <label className="text-xs font-bold text-purple-700 uppercase flex items-center gap-1 mb-2">
            AI Extract
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. 3 screws at 5.50 each"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className="flex-grow px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-purple-400 outline-none"
            />
            <button 
              onClick={() => {
                onAiParse(aiInput);
                setAiInput('');
              }}
              disabled={isAiProcessing || !aiInput.trim()}
              className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-purple-700 disabled:bg-purple-300 transition-colors whitespace-nowrap"
            >
              {isAiProcessing ? '...' : 'Add'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
