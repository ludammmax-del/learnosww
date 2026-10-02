import React, { useState } from 'react';
import { Calculator, HardDrive } from 'lucide-react';

export const ByteConverterWidget: React.FC = () => {
  const [val, setVal] = useState<string>('64');
  const [unit, setUnit] = useState<'MB' | 'GB' | 'KB' | 'Bytes' | 'PGPage'>('MB');

  const num = parseFloat(val) || 0;

  // Convert everything to Bytes first
  let bytes = 0;
  if (unit === 'Bytes') bytes = num;
  else if (unit === 'KB') bytes = num * 1024;
  else if (unit === 'MB') bytes = num * 1024 * 1024;
  else if (unit === 'GB') bytes = num * 1024 * 1024 * 1024;
  else if (unit === 'PGPage') bytes = num * 8192; // 8KB PostgreSQL default page size

  const kb = (bytes / 1024).toLocaleString('ru-RU', { maximumFractionDigits: 1 });
  const mb = (bytes / (1024 * 1024)).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  const gb = (bytes / (1024 * 1024 * 1024)).toLocaleString('ru-RU', { maximumFractionDigits: 3 });
  const pgPages = Math.round(bytes / 8192).toLocaleString('ru-RU');
  const osPages = Math.round(bytes / 4096).toLocaleString('ru-RU');

  return (
    <div className="h-full flex flex-col justify-between p-3.5 text-slate-800 select-none text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-900 text-xs">
          <Calculator className="w-3.5 h-3.5 text-indigo-500" />
          <span>Конвертер Памяти & Страниц</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">B-Tree / OS</span>
      </div>

      {/* Input */}
      <div className="my-1.5 flex items-center space-x-1.5">
        <input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold text-slate-900 outline-hidden focus:border-indigo-400"
          placeholder="Число..."
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as any)}
          className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 outline-hidden cursor-pointer"
        >
          <option value="KB">KB</option>
          <option value="MB">MB</option>
          <option value="GB">GB</option>
          <option value="Bytes">Bytes</option>
          <option value="PGPage">PG (8KB)</option>
        </select>
      </div>

      {/* Output Table */}
      <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-100 space-y-1 font-mono text-[11px]">
        <div className="flex justify-between">
          <span className="text-slate-400 font-sans">КБ:</span>
          <span className="font-semibold text-slate-800">{kb} KB</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 font-sans">МБ:</span>
          <span className="font-semibold text-slate-800">{mb} MB</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 font-sans">ГБ:</span>
          <span className="font-semibold text-slate-800">{gb} GB</span>
        </div>
        <div className="flex justify-between border-t border-slate-200/60 pt-1 text-indigo-900 font-medium">
          <span className="font-sans">Страниц PG (8KB):</span>
          <span>{pgPages}</span>
        </div>
        <div className="flex justify-between text-indigo-900 font-medium">
          <span className="font-sans">Страниц OS (4KB):</span>
          <span>{osPages}</span>
        </div>
      </div>
    </div>
  );
};
