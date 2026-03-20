interface Dish {
  menuItemId: string;
  name: string;
  category: string;
  ordersCount: number;
  totalSpend: number;
}

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + '₫';
}

interface Props {
  dishes: Dish[];
}

export function TopDishes({ dishes }: Props) {
  if (dishes.length === 0) {
    return <p className="text-sm text-[#94A3B8] py-4">No order history yet.</p>;
  }

  const maxOrders = Math.max(...dishes.map((d) => d.ordersCount), 1);

  return (
    <div className="space-y-3">
      {dishes.map((dish, i) => (
        <div key={dish.menuItemId} className="flex items-center gap-3">
          <span className="w-5 text-xs font-bold text-[#94A3B8] text-right shrink-0">{i + 1}.</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-[#1E293B] truncate">{dish.name}</span>
              <span className="text-xs text-[#64748B] shrink-0 ml-2">{dish.ordersCount} orders · {formatVND(dish.totalSpend)}</span>
            </div>
            <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F97316] rounded-full transition-all"
                style={{ width: `${(dish.ordersCount / maxOrders) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
