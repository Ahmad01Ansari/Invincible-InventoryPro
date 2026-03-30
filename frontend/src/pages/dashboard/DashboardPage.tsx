import { useQuery } from '@tanstack/react-query';
import { Package, Users, IndianRupee, ShoppingCart, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '@/services/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => api.get('/dashboard/overview').then(r => r.data),
  });

  const { data: perfChart } = useQuery({
    queryKey: ['dashboard', 'sales-chart'],
    queryFn: () => api.get('/dashboard/sales-chart').then(r => r.data),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['dashboard', 'top-products'],
    queryFn: () => api.get('/dashboard/top-products').then(r => r.data),
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => api.get('/dashboard/recent-activity').then(r => r.data),
  });

  const { data: stockDist } = useQuery({
    queryKey: ['dashboard', 'stock-distribution'],
    queryFn: () => api.get('/dashboard/stock-distribution').then(r => r.data),
  });

  if (overviewLoading) return (
    <div className="flex items-center justify-center p-12">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent animate-spin rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Here's what's happening in your business today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-blue-50/10 dark:to-blue-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <IndianRupee className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{overview?.monthlySales?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {overview?.salesChange >= 0 ? (
                <><TrendingUp className="w-3 h-3 text-green-500" /><span className="text-green-500">+{overview?.salesChange}%</span></>
              ) : (
                <><TrendingDown className="w-3 h-3 text-red-500" /><span className="text-red-500">{overview?.salesChange}%</span></>
              )}
              vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-green-50/10 dark:to-green-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-red-500 font-medium">{overview?.lowStockProducts} low stock</span> alerts
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-purple-50/10 dark:to-purple-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Purchases</CardTitle>
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{overview?.monthlyPurchases?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {overview?.pendingPurchases} pending POs
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-orange-50/10 dark:to-orange-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{overview?.pendingPayments?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              across {overview?.totalCustomers} customers
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-5 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Financial Performance (6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              {perfChart && perfChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={perfChart} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" className="opacity-50" />
                    <XAxis dataKey="month" stroke="currentColor" className="text-xs opacity-60" tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="currentColor" className="text-xs opacity-60" tickLine={false} axisLine={false} dx={-10} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                      formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']}
                    />
                    <Legend />
                    <Area type="monotone" name="Revenue" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    <Area type="monotone" name="Spends" dataKey="purchases" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorPurchases)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No performance data yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Inventory Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              {stockDist && stockDist.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stockDist.filter((d: any) => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {stockDist.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value}%`]} contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Add products to see health stats</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-2">
              {topProducts && topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" className="opacity-50" />
                    <XAxis type="number" stroke="currentColor" className="text-xs opacity-60" tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="currentColor" className="text-xs font-medium" width={100} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'var(--muted)', opacity: 0.4}} contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                    <Bar dataKey="quantity" name="Units Sold" radius={[0, 4, 4, 0]}>
                      {topProducts.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No sales data yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Recent Activity</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mt-4">
              {recentActivity && recentActivity.length > 0 ? recentActivity.map((activity: any, index: number) => (
                <div key={index} className="flex items-start gap-4 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className={`mt-0.5 w-2 h-2 rounded-full ring-4 flex-shrink-0 ${
                    activity.type === 'sale' ? 'bg-green-500 ring-green-500/20' :
                    activity.type === 'purchase' ? 'bg-blue-500 ring-blue-500/20' :
                    activity.type === 'stock_out' ? 'bg-red-500 ring-red-500/20' :
                    'bg-orange-500 ring-orange-500/20'
                  }`} />
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.detail}</p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(activity.time).toLocaleDateString()}
                  </div>
                </div>
              )) : (
                <div className="py-12 flex items-center justify-center text-muted-foreground text-sm">No recent activity detected</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
