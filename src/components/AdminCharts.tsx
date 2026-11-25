import { useMemo, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { OrderItemRecord, OrderRecord } from '../types/store';

function toDate(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (
    typeof ts === 'object' &&
    ts !== null &&
    'toDate' in ts &&
    typeof (ts as { toDate: () => Date }).toDate === 'function'
  ) {
    return (ts as { toDate: () => Date }).toDate();
  }
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string' || typeof ts === 'number') {
    const parsed = new Date(ts);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export function AdminCharts({
  orders,
  orderItems,
}: {
  orders: OrderRecord[];
  orderItems: OrderItemRecord[];
}) {
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.orderStatus !== 'Cancelled'),
    [orders]
  );

  // 1. Daily Sales (Last 10 days)
  const dailySeries = useMemo(() => {
    const days: { key: string; label: string; revenue: number; count: number }[] = [];
    const now = new Date();
    for (let i = 9; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-AE', { day: '2-digit', month: 'short' });
      days.push({ key, label, revenue: 0, count: 0 });
    }
    const dayMap = new Map(days.map((d) => [d.key, d]));
    for (const o of activeOrders) {
      const d = toDate(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const bucket = dayMap.get(key);
      if (bucket) {
        bucket.revenue += Number(o.totalAed || 0);
        bucket.count += 1;
      }
    }
    return days;
  }, [activeOrders]);

  const maxDailyRev = Math.max(1, ...dailySeries.map((d) => d.revenue));

  // 2. Monthly Sales (Last 6 months)
  const monthlySeries = useMemo(() => {
    const months: { key: string; label: string; revenue: number; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-AE', { month: 'short', year: '2-digit' });
      months.push({ key, label, revenue: 0, count: 0 });
    }
    const monthMap = new Map(months.map((m) => [m.key, m]));
    for (const o of activeOrders) {
      const d = toDate(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthMap.get(key);
      if (bucket) {
        bucket.revenue += Number(o.totalAed || 0);
        bucket.count += 1;
      }
    }
    return months;
  }, [activeOrders]);

  const maxMonthlyRev = Math.max(1, ...monthlySeries.map((m) => m.revenue));

  // 3. Order Statistics Breakdown
  const statusBuckets = useMemo(() => {
    const counts = {
      newOrders: orders.filter(
        (o) => o.orderStatus === 'Order Placed' || o.orderStatus === 'Order Confirmed'
      ).length,
      processing: orders.filter(
        (o) => o.orderStatus === 'Processing' || o.orderStatus === 'Packed'
      ).length,
      shipped: orders.filter(
        (o) => o.orderStatus === 'Shipped' || o.orderStatus === 'Out for Delivery'
      ).length,
      delivered: orders.filter((o) => o.orderStatus === 'Delivered').length,
      cancelled: orders.filter((o) => o.orderStatus === 'Cancelled').length,
    };
    const total = Math.max(1, orders.length);
    return [
      { label: 'New / Confirmed', count: counts.newOrders, pct: Math.round((counts.newOrders / total) * 100), color: '#B88D52' },
      { label: 'Processing / Packed', count: counts.processing, pct: Math.round((counts.processing / total) * 100), color: '#3C4B48' },
      { label: 'Shipped / En Route', count: counts.shipped, pct: Math.round((counts.shipped / total) * 100), color: '#2D5D73' },
      { label: 'Delivered', count: counts.delivered, pct: Math.round((counts.delivered / total) * 100), color: '#2B5B51' },
      { label: 'Cancelled', count: counts.cancelled, pct: Math.round((counts.cancelled / total) * 100), color: '#993A32' },
    ];
  }, [orders]);

  // 4. Best-Selling Products (from active orders / items)
  const bestSellers = useMemo(() => {
    const cancelledOrderIds = new Set(
      orders.filter((o) => o.orderStatus === 'Cancelled').map((o) => o.id)
    );
    const map = new Map<
      string,
      { productId: string; name: string; image: string; units: number; revenue: number }
    >();

    if (orderItems.length > 0) {
      for (const item of orderItems) {
        if (cancelledOrderIds.has(item.orderId)) continue;
        const prev = map.get(item.productId) || {
          productId: item.productId,
          name: item.productName,
          image: item.productImage,
          units: 0,
          revenue: 0,
        };
        prev.units += Number(item.quantity || 0);
        prev.revenue += Number(item.lineTotalAed || 0);
        map.set(item.productId, prev);
      }
    } else {
      for (const o of activeOrders) {
        for (const item of o.itemsSummary || []) {
          const prev = map.get(item.productId) || {
            productId: item.productId,
            name: item.productName,
            image: item.productImage,
            units: 0,
            revenue: 0,
          };
          prev.units += Number(item.quantity || 0);
          prev.revenue += Number(item.lineTotalAed || 0);
          map.set(item.productId, prev);
        }
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders, orderItems, activeOrders]);

  const maxBestRevenue = Math.max(1, ...bestSellers.map((b) => b.revenue));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Daily Sales Bar Chart */}
      <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-6 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#4A5B57]">
              Last 10 Days
            </p>
            <h3 className="mt-1 font-serif text-xl font-bold text-[#142220]">
              Daily Sales Revenue
            </h3>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-[#4A5B57]">
              {hoveredDayIdx !== null
                ? dailySeries[hoveredDayIdx].label
                : 'Last 10 Days'}
            </p>
            <p className="text-sm font-semibold text-[#142220] tabular-nums">
              AED{' '}
              {(hoveredDayIdx !== null
                ? dailySeries[hoveredDayIdx].revenue
                : dailySeries.reduce((s, d) => s + d.revenue, 0)
              ).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6 h-48 flex items-end gap-2 sm:gap-3 pt-4 border-b border-[#142220]/12 pb-2">
          {dailySeries.map((day, idx) => {
            const pct = Math.max(4, Math.round((day.revenue / maxDailyRev) * 100));
            const isHovered = hoveredDayIdx === idx;
            return (
              <div
                key={day.key}
                onMouseEnter={() => setHoveredDayIdx(idx)}
                onMouseLeave={() => setHoveredDayIdx(null)}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
              >
                <span
                  className={`mb-1.5 text-[10px] tabular-nums transition-opacity ${
                    isHovered ? 'opacity-100 text-[#142220] font-semibold' : 'opacity-0 group-hover:opacity-100 text-[#3C4B48]'
                  }`}
                >
                  {day.count > 0 ? `${day.count}×` : ''}
                </span>
                <div
                  style={{ height: `${day.revenue > 0 ? pct : 4}%` }}
                  className={`w-full max-w-[34px] rounded-t-lg transition-all duration-300 ${
                    day.revenue > 0
                      ? isHovered
                        ? 'bg-[#142220]'
                        : 'bg-[#2B5B51]/85 group-hover:bg-[#142220]'
                      : 'bg-[#142220]/10'
                  }`}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-[#4A5B57]">
          {dailySeries.map((day, idx) => (
            <span
              key={day.key}
              className={`flex-1 text-center truncate ${
                idx % 2 === 1 ? 'hidden sm:block' : ''
              }`}
            >
              {day.label}
            </span>
          ))}
        </div>
      </div>

      {/* Monthly Sales Chart */}
      <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-6 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#4A5B57]">
              Last 6 Months
            </p>
            <h3 className="mt-1 font-serif text-xl font-bold text-[#142220]">
              Monthly Sales (AED)
            </h3>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-[#4A5B57]">
              {hoveredMonthIdx !== null
                ? monthlySeries[hoveredMonthIdx].label
                : '6-Month Total'}
            </p>
            <p className="text-sm font-semibold text-[#142220] tabular-nums">
              AED{' '}
              {(hoveredMonthIdx !== null
                ? monthlySeries[hoveredMonthIdx].revenue
                : monthlySeries.reduce((s, m) => s + m.revenue, 0)
              ).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6 h-48 flex items-end gap-3 sm:gap-5 pt-4 border-b border-[#142220]/12 pb-2">
          {monthlySeries.map((month, idx) => {
            const pct = Math.max(5, Math.round((month.revenue / maxMonthlyRev) * 100));
            const isHovered = hoveredMonthIdx === idx;
            return (
              <div
                key={month.key}
                onMouseEnter={() => setHoveredMonthIdx(idx)}
                onMouseLeave={() => setHoveredMonthIdx(null)}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
              >
                <span className="mb-1.5 text-[11px] tabular-nums text-[#3C4B48] font-medium">
                  {month.revenue > 0 ? `AED ${month.revenue.toLocaleString()}` : '—'}
                </span>
                <div
                  style={{ height: `${month.revenue > 0 ? pct : 5}%` }}
                  className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 ${
                    month.revenue > 0
                      ? isHovered
                        ? 'bg-[#142220]'
                        : 'bg-[#B88D52]/85 group-hover:bg-[#142220]'
                      : 'bg-[#142220]/10'
                  }`}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-[#4A5B57]">
          {monthlySeries.map((month) => (
            <span key={month.key} className="flex-1 text-center">
              {month.label}
            </span>
          ))}
        </div>
      </div>

      {/* Order Statistics Breakdown */}
      <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#4A5B57]">
              Order Progress
            </p>
            <h3 className="mt-1 font-serif text-xl font-bold text-[#142220]">
              Order Status Breakdown
            </h3>
          </div>
          <span className="text-xs font-semibold text-[#3C4B48] tabular-nums">
            {orders.length} total
          </span>
        </div>

        <div className="mt-5 h-3 w-full rounded-full bg-[#D7DDD5] overflow-hidden flex">
          {statusBuckets.map((b) =>
            b.count > 0 ? (
              <div
                key={b.label}
                style={{ width: `${Math.max(4, b.pct)}%`, backgroundColor: b.color }}
                title={`${b.label}: ${b.count}`}
                className="h-full transition-all duration-500"
              />
            ) : null
          )}
        </div>

        <div className="mt-5 space-y-3">
          {statusBuckets.map((b) => (
            <div key={b.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: b.color }}
                />
                <span className="text-[#142220] font-medium">{b.label}</span>
              </div>
              <div className="flex items-center gap-3 tabular-nums">
                <span className="text-[#4A5B57]">{b.pct}%</span>
                <span className="font-semibold text-[#142220] w-7 text-right">
                  {b.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best-Selling Products */}
      <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#4A5B57]">
              Customer Favorites
            </p>
            <h3 className="mt-1 font-serif text-xl font-bold text-[#142220]">
              Best-Selling Products
            </h3>
          </div>
          <span className="text-xs font-medium text-[#4A5B57]">By Revenue (AED)</span>
        </div>

        {bestSellers.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#4A5B57]">
            Best sellers will appear here automatically as orders arrive.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {bestSellers.map((item, idx) => {
              const barPct = Math.max(8, Math.round((item.revenue / maxBestRevenue) * 100));
              return (
                <div key={item.productId} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[#4A5B57] font-medium tabular-nums w-4">
                        0{idx + 1}
                      </span>
                      <span className="font-semibold text-[#142220] truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[#142220] font-semibold tabular-nums shrink-0">
                      {item.units} sold · AED {item.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#D7DDD5] overflow-hidden">
                    <div
                      style={{ width: `${barPct}%` }}
                      className="h-full rounded-full bg-[#2B5B51] transition-all duration-500"
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
}
