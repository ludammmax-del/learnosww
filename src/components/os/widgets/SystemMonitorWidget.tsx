import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Wifi, Cloud, Users } from 'lucide-react';
import { SyncStatus } from '../../../services/firestoreSync.ts';

interface SystemMonitorWidgetProps {
  syncStatus?: SyncStatus;
  onlinePeersCount?: number;
}

export const SystemMonitorWidget: React.FC<SystemMonitorWidgetProps> = ({
  syncStatus = 'synced',
  onlinePeersCount = 1,
}) => {
  const [cpuUsage, setCpuUsage] = useState<number>(14);
  const [ramMb, setRamMb] = useState<number>(140);
  const [pingMs, setPingMs] = useState<number>(18);
  const [uptimeSec, setUptimeSec] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      const pingStart = performance.now();
      try {
        const res = await fetch('/api/system/metrics');
        const roundtripPing = Math.round(performance.now() - pingStart);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data && data.success) {
            setCpuUsage(data.cpuUsagePercent ?? 12);
            setRamMb(data.processRamMb ?? 140);
            setPingMs(roundtripPing);
            setUptimeSec(data.uptimeSec ?? 0);
          }
        }
      } catch {
        // Keep previous state on transient network hiccup
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const formatUptime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col justify-between p-3.5 text-slate-800 select-none text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-900 text-xs">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>Системный монитор OS</span>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
          <span>UP</span>
          <span className="text-slate-700 font-medium">{formatUptime(uptimeSec)}</span>
        </div>
      </div>

      {/* Grid of Gauges */}
      <div className="grid grid-cols-2 gap-2 my-2">
        {/* CPU */}
        <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="flex items-center space-x-1">
              <Cpu className="w-3 h-3 text-sky-500" />
              <span>CPU Core</span>
            </span>
            <span className="font-mono font-semibold text-slate-900">{cpuUsage}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-700 rounded-full"
              style={{ width: `${cpuUsage}%` }}
            />
          </div>
        </div>

        {/* RAM */}
        <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="flex items-center space-x-1">
              <HardDrive className="w-3 h-3 text-purple-500" />
              <span>RAM</span>
            </span>
            <span className="font-mono font-semibold text-slate-900">{ramMb}M</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-700 rounded-full"
              style={{ width: `${(ramMb / 1024) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Network & Cloud Status */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5 text-slate-500">
            <Cloud className="w-3 h-3 text-sky-500" />
            <span>Firestore DB</span>
          </span>
          <span className="flex items-center space-x-1 font-medium text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{syncStatus === 'synced' ? 'Синхронизировано' : 'Синхронизация'}</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5 text-slate-500">
            <Wifi className="w-3 h-3 text-emerald-500" />
            <span>Сетевой пинг</span>
          </span>
          <span className="font-mono text-slate-700 font-medium">{pingMs} ms</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5 text-slate-500">
            <Users className="w-3 h-3 text-indigo-500" />
            <span>P2P Студенты</span>
          </span>
          <span className="font-mono text-slate-700 font-medium">{onlinePeersCount} онлайн</span>
        </div>
      </div>
    </div>
  );
};
