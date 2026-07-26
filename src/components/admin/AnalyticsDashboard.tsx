import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Film, Award } from 'lucide-react';
import { Order } from '../../types';

interface AnalyticsDashboardProps {
  orders: Order[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ orders }) => {
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const delivered = orders.filter(o => o.status === 'delivered').length;
  const conversionRate = orders.length > 0 ? Math.round((delivered / orders.length) * 100) : 0;

  const revenueByMovie: Record<string, { revenue: number; count: number }> = {};
  orders.forEach(o => {
    const m = o.movieTitle || 'Kalki 2898 AD (IMAX 3D)';
    if (!revenueByMovie[m]) revenueByMovie[m] = { revenue: 0, count: 0 };
    revenueByMovie[m].revenue += o.totalAmount;
    revenueByMovie[m].count += 1;
  });

  const topMovies = Object.entries(revenueByMovie).sort((a, b) => b[1].revenue - a[1].revenue);
  const maxRevenue = topMovies.length > 0 ? topMovies[0][1].revenue : 1;

  const kpis = [
    { label: 'Gross Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, sub: 'Total sales today', icon: DollarSign, color: 'var(--color-green-text)', bg: 'var(--color-green-subtle)', border: 'var(--color-green-border)' },
    { label: 'Orders Placed', value: orders.length, sub: `${delivered} delivered`, icon: ShoppingBag, color: 'var(--color-blue-text)', bg: 'var(--color-blue-subtle)', border: 'var(--color-blue-border)' },
    { label: 'Avg. Order Value', value: `₹${Math.round(avgOrderValue).toLocaleString('en-IN')}`, sub: 'Per transaction', icon: TrendingUp, color: 'var(--color-violet-text)', bg: 'var(--color-violet-subtle)', border: 'var(--color-violet-border)' },
    { label: 'Completion Rate', value: `${conversionRate}%`, sub: 'Placed → Delivered', icon: Award, color: 'var(--color-amber-text)', bg: 'var(--color-amber-subtle)', border: 'var(--color-amber-border)' },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={16} color="var(--color-violet-text)" />
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Analytics</h1>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', paddingLeft: 42 }}>
          Decoupled event telemetry aggregated by screening title, auditorium, and time slot
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '18px 20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)' }}>{kpi.label}</span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: kpi.bg, border: `1px solid ${kpi.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={13} color={kpi.color} />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color, letterSpacing: '-0.04em', fontFeatureSettings: '"tnum"', marginBottom: 4 }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{kpi.sub}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue by Movie */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Film size={15} color="var(--color-violet-text)" />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Revenue by Screening</h2>
        </div>

        {topMovies.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-disabled)', fontSize: 13 }}>
            No order data yet — place some orders to see analytics.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {topMovies.map(([movie, stats], idx) => {
              const pct = Math.round((stats.revenue / maxRevenue) * 100);
              return (
                <div key={movie}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', minWidth: 20 }}>{idx + 1}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0, marginLeft: 20 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-green-text)' }}>₹{stats.revenue.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-disabled)' }}>{stats.count} orders</div>
                      </div>
                    </div>
                  </div>
                  <div className="progress-track" style={{ height: 4 }}>
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.4, 0, 0.2, 1] }}
                      style={{ background: idx === 0 ? 'var(--color-violet-bright)' : 'var(--border-strong)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
