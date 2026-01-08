
export interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number; // calculated as quantity * unitPrice
}

export type PrinterWidth = '58mm' | '80mm';

export interface ReceiptData {
  companyName: string;
  tin: string;
  ownerName: string;
  address: string;
  phone: string;
  bankInfo: string;
  businessType: string;
  fsNo: string;
  date: string;
  time: string;
  items: ReceiptItem[];
  taxRate: number;
  paymentMethod: string;
  nffNo: string;
  ercaLabel: string;
  printerWidth: PrinterWidth;
}
