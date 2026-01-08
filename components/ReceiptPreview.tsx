
import React from 'react';
import { ReceiptData } from '../types';

interface ReceiptPreviewProps {
  data: ReceiptData;
  isPrint: boolean;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ data, isPrint }) => {
  const taxableTotal = data.items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (taxableTotal * data.taxRate) / 100;
  const grandTotal = taxableTotal + taxAmount;
  const itemCount = data.items.length;

  // Optimized widths for thermal printing
  const containerWidth = data.printerWidth === '58mm' ? '58mm' : '80mm';
  
  // Base font size
  const baseFontSize = data.printerWidth === '58mm' ? '12px' : '14px'; 

  const printAdjustStyles: React.CSSProperties = {
    WebkitPrintColorAdjust: 'exact',
    colorAdjust: 'exact',
  } as any;

  // Clean font style with taller text using scaleY on text elements only
  const contentFontStyle: React.CSSProperties = {
    fontFamily: "'Metrophobic', 'Consolas', monospace",
    fontWeight: 400,
    lineHeight: '1.6', // Extra line height to account for scaleY
  };

  // Style for individual text lines to make them taller
  const tallTextStyle: React.CSSProperties = {
    transform: 'scaleY(1.3)',
    transformOrigin: 'top',
  };

  return (
    <div 
      className={`bg-white text-black flex flex-col ${isPrint ? 'm-0 p-0' : 'p-2 shadow-inner'}`}
      style={{ 
        width: containerWidth, 
        backgroundColor: '#ffffff',
        color: '#000000',
        ...printAdjustStyles
      }}
    >
      <div className="w-full px-1" style={printAdjustStyles}>
        {/* Logo Header */}
        <div className="flex flex-col items-start mb-1" style={{ paddingLeft: '8%', marginTop: '1px', ...printAdjustStyles }}>
          <img 
            src="/redesign/-logo_eltrade.png" 
            alt="ELTRADE" 
            style={{ 
              width: data.printerWidth === '58mm' ? '55%' : '50%', 
              height: 'auto',
              filter: 'grayscale(1) contrast(1.5)',
              ...printAdjustStyles
            }} 
          />
        </div>

        {/* Business Details */}
        <div className="text-center mb-3" style={{ ...contentFontStyle, fontSize: baseFontSize, lineHeight: '1.2' }}>
          <div style={tallTextStyle}>TIN:{data.tin}</div>
          <div style={tallTextStyle}>{data.ownerName}</div>
          <div style={tallTextStyle}>{data.address}</div>
          <div style={tallTextStyle}>TEL:-{data.phone}</div>
          <div style={tallTextStyle}>{data.bankInfo}</div>
          <div style={{ ...tallTextStyle, lineHeight: '0.9' }}>{data.businessType}</div>
        </div>

        {/* FS No and Date/Time */}
        <div className="mb-3" style={{ ...contentFontStyle, fontSize: baseFontSize }}>
          <div style={tallTextStyle}>FS No. {data.fsNo}</div>
          <div className="flex justify-between" style={tallTextStyle}>
            <span>{data.date}</span>
            <span>{data.time}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="mb-2" style={{ ...contentFontStyle, fontSize: baseFontSize }}>
          {data.items.map((item) => (
            <div key={item.id} className="mb-1">
              <div style={{ ...tallTextStyle, marginLeft: '8%' }}>
                {item.quantity} x {item.unitPrice.toFixed(2)} =
              </div>
              <div className="flex justify-between" style={tallTextStyle}>
                <span className="break-all mr-2">{item.description}</span>
                <span className="whitespace-nowrap">*{item.amount.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Dashed Line */}
        <div 
          className="my-2 mx-auto" 
          style={{ 
            borderBottom: '1px dashed black',
            width: '85%',
            paddingTop: '10px',
            ...printAdjustStyles
          }}
        ></div>

        {/* Totals Section */}
        <div className="mb-1" style={{ ...contentFontStyle, fontSize: baseFontSize }}>
          <div className="flex justify-between" style={tallTextStyle}>
            <span>TAXBL1</span>
            <span>*{taxableTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between" style={tallTextStyle}>
            <span>TAX1 {data.taxRate.toFixed(2)}%</span>
            <span>*{taxAmount.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Dashed Line */}
        <div 
          className="my-2 mx-auto" 
          style={{ 
            borderBottom: '1px dashed black',
            width: '85%',
            paddingTop: '15px',
            ...printAdjustStyles
          }}
        ></div>

        {/* Grand Total */}
        <div className="mb-2" style={{ ...contentFontStyle, fontSize: baseFontSize }}>
          <div className="flex justify-between font-bold" style={{ ...tallTextStyle, fontSize: '1.3em' }}>
            <span>TOTAL :</span>
            <span>*{grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between" style={tallTextStyle}>
            <span>{data.paymentMethod}</span>
            <span>*{grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between" style={tallTextStyle}>
            <span>ITEM#</span>
            <span>{itemCount}</span>
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-4 flex flex-col items-center text-center" style={{ ...contentFontStyle, fontSize: baseFontSize }}>
          <div className="mb-1 uppercase" style={tallTextStyle}>{data.ercaLabel}</div>
          <img 
            src="/redesign/et_nff_logo.png" 
            alt="ET NFF" 
            style={{ 
              width: data.printerWidth === '58mm' ? '95%' : '90%', 
              height: 'auto',
              filter: 'grayscale(1) contrast(1.5)',
              ...printAdjustStyles 
            }} 
          />
        </div>

        {/* Feed space for cut */}
        <div className="h-6"></div>
      </div>
    </div>
  );
};
