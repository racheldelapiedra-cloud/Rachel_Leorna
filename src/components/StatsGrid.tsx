/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Tool } from '../types';
import { Hammer, CheckCircle2, HelpCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface StatsGridProps {
  tools: Tool[];
}

export default function StatsGrid({ tools }: StatsGridProps) {
  const totalTools = tools.length;
  const available = tools.filter(t => t.status === 'available').length;
  const inUse = tools.filter(t => t.status === 'in_use').length;
  const underMaint = tools.filter(t => t.status === 'under_maintenance').length;
  const serviceReq = tools.filter(t => t.status === 'service_required').length;

  const totalValue = tools.reduce((sum, t) => sum + (t.acquisitionCost ?? 0), 0);

  const stats = [
    {
      id: 'stat-total',
      label: 'Total Equipment',
      value: totalTools,
      icon: Hammer,
      bg: 'bg-zinc-900 border-zinc-800 text-zinc-300',
      iconBg: 'bg-zinc-950 text-zinc-400',
      valueColor: 'text-zinc-100',
      desc: `Fleet Value: Php ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    },
    {
      id: 'stat-avail',
      label: 'Available',
      value: available,
      icon: CheckCircle2,
      bg: 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400',
      iconBg: 'bg-emerald-950/50 text-emerald-400',
      valueColor: 'text-emerald-400',
      desc: 'Ready for jobsite deployment'
    },
    {
      id: 'stat-use',
      label: 'In Active Use',
      value: inUse,
      icon: ShieldCheck,
      bg: 'bg-blue-950/20 border-blue-800/40 text-blue-400',
      iconBg: 'bg-blue-950/50 text-blue-400',
      valueColor: 'text-blue-400',
      desc: 'Deployed under personnel custody'
    },
    {
      id: 'stat-maint',
      label: 'Maintenance',
      value: underMaint,
      icon: HelpCircle,
      bg: 'bg-amber-950/20 border-amber-800/40 text-amber-400',
      iconBg: 'bg-amber-950/50 text-amber-400',
      valueColor: 'text-amber-400',
      desc: 'Currently in the repair bay'
    },
    {
      id: 'stat-critical',
      label: 'Needs Service',
      value: serviceReq,
      icon: AlertTriangle,
      bg: 'bg-rose-950/20 border-rose-800/40 text-rose-400',
      iconBg: 'bg-rose-950/50 text-rose-400',
      valueColor: 'text-rose-400',
      desc: 'Flagged for inspection / damage'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.id}
            id={stat.id}
            className={`p-4 rounded-xl border transition-all hover:brightness-110 flex flex-col justify-between ${stat.bg}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase opacity-85 text-zinc-400">{stat.label}</span>
              <div className={`p-1.5 rounded-lg ${stat.iconBg}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className={`text-3xl font-light tracking-tight font-sans ${stat.valueColor}`}>
                {stat.value}
              </div>
              <p className="text-[10px] mt-1 font-normal text-zinc-500 leading-tight truncate">
                {stat.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
