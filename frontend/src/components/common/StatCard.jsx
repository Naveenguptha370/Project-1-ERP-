import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend,
  trendValue,
}) => {
  const colorMap = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 group-hover:border-indigo-500/40',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/40',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/40',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20 group-hover:border-sky-500/40',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 group-hover:border-cyan-500/40',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20 group-hover:border-purple-500/40',
  };

  const accent = colorMap[color] || colorMap.indigo;

  // Handle trend as object (e.g. { positive: true, value: '+5%' }) or string ('up' / 'down')
  const isUp = typeof trend === 'object' ? trend?.positive : trend === 'up';
  const displayTrendVal = typeof trend === 'object' ? trend?.value : trendValue;

  return (
    <div className="glass-card rounded-2xl p-6 border relative overflow-hidden group">
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-300" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border transition-all duration-200 ${accent}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
          {value}
        </div>
        {displayTrendVal && (
          <div
            className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${
              isUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
            }`}
          >
            {isUp ? (
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 mr-1" />
            )}
            {displayTrendVal}
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-400 font-medium">{subtitle}</p>
      )}
    </div>
  );
};

export default StatCard;
