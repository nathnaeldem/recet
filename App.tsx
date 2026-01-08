
import React, { useState, useRef } from 'react';
import { ReceiptData, ReceiptItem } from './types';
import { ReceiptForm } from './components/ReceiptForm';
import { ReceiptPreview } from './components/ReceiptPreview';
import { GoogleGenAI, Type } from "@google/genai";

const INITIAL_DATA: ReceiptData = {
  companyName: "ELTRADE",
  tin: "0062533191",
  ownerName: "YISAK GETACHEW",
  address: "HOSSANA K-HETO",
  phone: "0910796232",
  bankInfo: "ARUND CBE HOSSANA BRANCH",
  businessType: "RETAIL TRADE OF CONSTRUCTION MATERIALS",
  fsNo: "00004387",
  date: new Date().toLocaleDateString('en-GB'),
  time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
  items: [
    { 
      id: '1', 
      description: 'cermic_normal_60*60*', 
      quantity: 4,
      unitPrice: 45.00,
      amount: 180.00 
    }
  ],
  taxRate: 15.00,
  paymentMethod: "CASH Birr",
  nffNo: "NFF0001180",
  ercaLabel: "ERCA",
  printerWidth: '58mm'
};

const App: React.FC = () => {
  const [data, setData] = useState<ReceiptData>(INITIAL_DATA);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleUpdateData = (newData: Partial<ReceiptData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      id: Math.random().toString(36).substring(2, 11),
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0
    };
    setData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleRemoveItem = (id: string) => {
    setData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const handleUpdateItem = (id: string, updates: Partial<ReceiptItem>) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  };

  // --- ESC/POS Layout Helpers ---
  const wrapText = (text: string, limit: number): string[] => {
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length > limit) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    });
    lines.push(currentLine.trim());
    return lines;
  };

  const generateEscPos = (receipt: ReceiptData): Uint8Array => {
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];

    const add = (text: string) => chunks.push(encoder.encode(text));
    const command = (bytes: number[]) => chunks.push(new Uint8Array(bytes));

    const lineLimit = receipt.printerWidth === '58mm' ? 32 : 48;

    // 1. Initialize
    command([0x1b, 0x40]); 

    // 2. Header (Impact Italic simulation via bold + double height)
    command([0x1b, 0x61, 0x01]); // Center
    command([0x1d, 0x21, 0x11]); // Double height + Double width
    command([0x1b, 0x45, 0x01]); // Bold on
    add(`${receipt.companyName}\n`);
    command([0x1d, 0x21, 0x00]); // Reset font
    command([0x1b, 0x45, 0x00]); // Bold off
    
    add(`TIN: ${receipt.tin}\n`);
    add(`${receipt.ownerName}\n`);
    // Wrapped address
    wrapText(receipt.address, lineLimit).forEach(line => add(`${line}\n`));
    add(`TEL: ${receipt.phone}\n`);
    add("-".repeat(lineLimit) + "\n");

    // 3. Meta
    command([0x1b, 0x61, 0x00]); // Left
    add(`FS No: ${receipt.fsNo.padEnd(lineLimit - 12)}\n`);
    add(`${receipt.date} ${receipt.time.padStart(lineLimit - receipt.date.length - 1)}\n`);
    add("-".repeat(lineLimit) + "\n");

    // 4. Items
    let taxableTotal = 0;
    receipt.items.forEach(item => {
      taxableTotal += item.amount;
      const desc = item.description.toLowerCase().substring(0, lineLimit - 12).padEnd(lineLimit - 12);
      const price = `*${item.amount.toFixed(2)}`.padStart(12);
      add(`${desc}${price}\n`);
    });
    add("-".repeat(lineLimit) + "\n");

    // 5. Totals
    const tax = (taxableTotal * receipt.taxRate) / 100;
    const total = taxableTotal + tax;
    
    add(`TAXABLE`.padEnd(lineLimit - 12) + `*${taxableTotal.toFixed(2)}`.padStart(12) + "\n");
    add(`TAX (${receipt.taxRate}%)`.padEnd(lineLimit - 12) + `*${tax.toFixed(2)}`.padStart(12) + "\n");
    
    add("=".repeat(lineLimit) + "\n");
    command([0x1b, 0x45, 0x01]); // Bold
    command([0x1d, 0x21, 0x01]); // Double height
    add(`TOTAL`.padEnd(10) + `*${total.toFixed(2)}`.padStart(lineLimit - 10) + "\n");
    command([0x1d, 0x21, 0x00]); 
    command([0x1b, 0x45, 0x00]);
    add("=".repeat(lineLimit) + "\n");

    add(`${receipt.paymentMethod.padEnd(lineLimit - 12)}${total.toFixed(2).padStart(12)}\n`);
    add(`ITEMS COUNT`.padEnd(lineLimit - 8) + `${receipt.items.length.toString().padStart(8)}\n`);
    add("-".repeat(lineLimit) + "\n");

    // 6. Footer (Special character box for ET)
    command([0x1b, 0x61, 0x01]); // Center
    add(`${receipt.ercaLabel}\n`);
    command([0x1b, 0x45, 0x01]);
    add(`[ ET ] ${receipt.nffNo}\n`);
    command([0x1b, 0x45, 0x00]);

    // 7. Finish
    add("\n\n\n\n"); 
    command([0x1b, 0x69]); // Cut command

    // Merge chunks
    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    chunks.forEach(c => {
      result.set(c, offset);
      offset += c.length;
    });
    return result;
  };

  // --- Image to ESC/POS Helper ---
  const canvasToEscPos = (canvas: HTMLCanvasElement): Uint8Array => {
    const context = canvas.getContext('2d');
    if (!context) return new Uint8Array();

    const width = canvas.width;
    const height = canvas.height;
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Bytes per line (width / 8)
    const bytesPerLine = Math.ceil(width / 8);
    
    const buffer: number[] = [];
    
    // Initialize
    buffer.push(0x1b, 0x40);

    // GS v 0 m xL xH yL yH d1...dk
    buffer.push(0x1d, 0x76, 0x30, 0x00);
    buffer.push(bytesPerLine & 0xff);
    buffer.push((bytesPerLine >> 8) & 0xff);
    buffer.push(height & 0xff);
    buffer.push((height >> 8) & 0xff);

    for (let y = 0; y < height; y++) {
      for (let b = 0; b < bytesPerLine; b++) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = b * 8 + bit;
          if (x < width) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b_val = data[idx + 2];
            const a = data[idx + 3];
            
            // Luminance formula
            const luminance = (r * 0.299 + g * 0.587 + b_val * 0.114);
            // Threshold (adjust if needed, 200 is a safe bet for receipts)
            if (a > 128 && luminance < 200) {
              byte |= (1 << (7 - bit));
            }
          }
        }
        buffer.push(byte);
      }
    }

    // Cut and feed
    buffer.push(0x1d, 0x56, 0x42, 0x00);

    return new Uint8Array(buffer);
  };

  const handleDirectUsbPrint = async () => {
    setIsPrinting(true);
    const element = document.querySelector('.print-only') as HTMLElement;
    if (!element) {
      setIsPrinting(false);
      return;
    }

    // Temporarily show the element for capturing
    const originalDisplay = element.style.display;
    const originalPosition = element.style.position;
    const originalTop = element.style.top;
    
    // Use !important to override the CSS rule
    element.style.setProperty('display', 'block', 'important');
    element.style.position = 'fixed';
    element.style.top = '-9999px';

    try {
      const device = await (navigator as any).usb.requestDevice({ filters: [] });
      await device.open();
      if (device.configuration === null) await device.selectConfiguration(1);
      await device.claimInterface(0);

      const outEndpoint = device.configuration?.interfaces[0].alternates[0].endpoints.find(
        (e: any) => e.direction === 'out' && e.type === 'bulk'
      );

      if (!outEndpoint) throw new Error("Could not find a valid output endpoint.");

      // Determine target width in dots
      const targetWidth = data.printerWidth === '58mm' ? 384 : 576;

      // @ts-ignore
      const canvasSource = await window.html2canvas(element, {
        scale: 2, // Capture at higher resolution
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });

      // Resize to printer width
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      const scaleFactor = targetWidth / canvasSource.width;
      canvas.height = canvasSource.height * scaleFactor;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(canvasSource, 0, 0, canvas.width, canvas.height);
      }

      const dataToPrint = canvasToEscPos(canvas);
      
      // Transfer in chunks to avoid buffer overflows
      const chunkSize = 8192;
      for (let i = 0; i < dataToPrint.length; i += chunkSize) {
        const chunk = dataToPrint.slice(i, i + chunkSize);
        await device.transferOut(outEndpoint.endpointNumber, chunk);
      }
      
      await device.releaseInterface(0);
      await device.close();
      
    } catch (error) {
      console.error(error);
      alert(`USB Print Error: ${error instanceof Error ? error.message : "Ensure the printer is connected and WinUSB driver is active."}`);
    } finally {
      // Restore styles
      element.style.removeProperty('display');
      element.style.position = originalPosition;
      element.style.top = originalTop;
      setIsPrinting(false);
    }
  };

  const handleExportImage = async () => {
    const element = document.querySelector('.print-only') as HTMLElement;
    if (!element) return;
    
    element.style.setProperty('display', 'block', 'important');
    element.style.position = 'fixed';
    element.style.top = '-9999px';
    try {
      // @ts-ignore
      const canvas = await window.html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        width: 384,
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `receipt-${data.fsNo}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      element.style.removeProperty('display');
      element.style.position = '';
      element.style.top = ''; // Reset top as well
    }
  };

  const parseWithAi = async (text: string) => {
    if (!text.trim()) return;
    setIsAiProcessing(text.length > 0);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract items from this receipt text: ${text}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER }
              },
              required: ["description", "amount"]
            }
          }
        }
      });
      const items = JSON.parse(response.text || "[]");
      if (Array.isArray(items)) {
        const mappedItems: ReceiptItem[] = items.map(item => ({
          id: Math.random().toString(36).substring(2, 11),
          description: item.description,
          quantity: 1,
          unitPrice: item.amount,
          amount: item.amount
        }));
        setData(prev => ({ ...prev, items: [...prev.items, ...mappedItems] }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col md:flex-row p-4 md:p-8 gap-8 max-w-7xl mx-auto no-print">
        <div className="flex-1 space-y-6 overflow-y-auto pb-20 md:pb-0">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Receipt Pro</h1>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">ECO250 Optimized</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleExportImage}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-all text-sm"
                >
                  Save Image
                </button>
                <button 
                  onClick={handleDirectUsbPrint}
                  disabled={isPrinting}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  {isPrinting ? 'Printing...' : 'Direct Hardware Print'}
                </button>
                <button 
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-md flex items-center gap-2"
                >
                  Print via Browser
                </button>
              </div>
            </header>

            <ReceiptForm 
              data={data} 
              onUpdate={handleUpdateData}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onUpdateItem={handleUpdateItem}
              onAiParse={parseWithAi}
              isAiProcessing={isAiProcessing}
            />
          </div>
        </div>

        <div className="w-full md:w-[450px] flex flex-col items-center sticky top-8">
          <div className="bg-gray-200 p-8 rounded-lg shadow-inner border border-gray-300 flex justify-center w-full">
             <div className="bg-white shadow-2xl overflow-hidden scale-110" ref={previewRef}>
               <ReceiptPreview data={data} isPrint={false} />
             </div>
          </div>
          <div className="mt-6 bg-white p-4 rounded-lg border border-gray-300 w-full shadow-sm">
            <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1">
              🔍 Styling Check
            </h4>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              <strong>Direct Hardware Print</strong> now renders the receipt as an image to ensure it matches the screen exactly. This may be slightly slower than text-mode printing but guarantees the correct layout and fonts.
            </p>
          </div>
        </div>
      </div>

      <div className="print-only">
         <ReceiptPreview data={data} isPrint={true} />
      </div>
    </>
  );
};

export default App;
