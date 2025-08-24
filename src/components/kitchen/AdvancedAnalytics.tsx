import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import {
  TrendUp,
  TrendDown,
  Users,
  ShoppingCart,
  CurrencyDollar,
  Clock,
  Star,
  Target,
  Download,
  Calendar
} from '@phosphor-icons/react';

interface AnalyticsData {
  revenue: {
    daily: Array<{ date: string; amount: number; orders: number }>;
    weekly: Array<{ week: string; amount: number; orders: number }>;
    monthly: Array<{ month: string; amount: number; orders: number }>;
  };
  orders: {
    statusDistribution: Array<{ status: string; count: number; color: string }>;
    hourlyPattern: Array<{ hour: string; orders: number }>;
    customerTypes: Array<{ type: string; count: number; value: number }>;
  };
  performance: {
    avgPreparationTime: number;
    customerSatisfaction: number;
    orderAccuracy: number;
    onTimeDelivery: number;
  };
  popular: {
    items: Array<{ name: string; orders: number; revenue: number }>;
    categories: Array<{ category: string; percentage: number }>;
  };
}

const mockAnalyticsData: AnalyticsData = {
  revenue: {
    daily: [
      { date: '2024-08-18', amount: 1250, orders: 28 },
      { date: '2024-08-19', amount: 1420, orders: 32 },
      { date: '2024-08-20', amount: 1180, orders: 26 },
      { date: '2024-08-21', amount: 1680, orders: 38 },
      { date: '2024-08-22', amount: 1540, orders: 35 },
      { date: '2024-08-23', amount: 1890, orders: 42 },
      { date: '2024-08-24', amount: 980, orders: 22 }
    ],
    weekly: [
      { week: 'Week 1', amount: 8500, orders: 190 },
      { week: 'Week 2', amount: 9200, orders: 205 },
      { week: 'Week 3', amount: 8900, orders: 198 },
      { week: 'Week 4', amount: 10100, orders: 228 }
    ],
    monthly: [
      { month: 'يناير', amount: 28500, orders: 650 },
      { month: 'فبراير', amount: 31200, orders: 720 },
      { month: 'مارس', amount: 29800, orders: 680 },
      { month: 'أبريل', amount: 33500, orders: 760 },
      { month: 'مايو', amount: 35200, orders: 800 },
      { month: 'يونيو', amount: 37800, orders: 850 }
    ]
  },
  orders: {
    statusDistribution: [
      { status: 'مكتمل', count: 156, color: '#22c55e' },
      { status: 'قيد التحضير', count: 23, color: '#f59e0b' },
      { status: 'في الانتظار', count: 8, color: '#3b82f6' },
      { status: 'ملغي', count: 4, color: '#ef4444' }
    ],
    hourlyPattern: [
      { hour: '06:00', orders: 2 },
      { hour: '07:00', orders: 5 },
      { hour: '08:00', orders: 8 },
      { hour: '09:00', orders: 12 },
      { hour: '10:00', orders: 15 },
      { hour: '11:00', orders: 22 },
      { hour: '12:00', orders: 35 },
      { hour: '13:00', orders: 42 },
      { hour: '14:00', orders: 38 },
      { hour: '15:00', orders: 28 },
      { hour: '16:00', orders: 25 },
      { hour: '17:00', orders: 30 },
      { hour: '18:00', orders: 45 },
      { hour: '19:00', orders: 52 },
      { hour: '20:00', orders: 48 },
      { hour: '21:00', orders: 35 },
      { hour: '22:00', orders: 18 },
      { hour: '23:00', orders: 8 }
    ],
    customerTypes: [
      { type: 'عملاء جدد', count: 45, value: 2250 },
      { type: 'عملاء عائدين', count: 128, value: 8960 },
      { type: 'عملاء مميزين', count: 18, value: 1890 }
    ]
  },
  performance: {
    avgPreparationTime: 18.5,
    customerSatisfaction: 4.6,
    orderAccuracy: 96.8,
    onTimeDelivery: 92.3
  },
  popular: {
    items: [
      { name: 'كبسة دجاج', orders: 89, revenue: 4005 },
      { name: 'تشيز برجر', orders: 76, revenue: 2128 },
      { name: 'بيتزا مارجريتا', orders: 65, revenue: 1950 },
      { name: 'فلافل', orders: 58, revenue: 1160 },
      { name: 'شاورما', orders: 52, revenue: 1300 }
    ],
    categories: [
      { category: 'عربي', percentage: 42 },
      { category: 'وجبات سريعة', percentage: 28 },
      { category: 'حلويات', percentage: 18 },
      { category: 'صحي', percentage: 12 }
    ]
  }
};

export const AdvancedAnalytics = () => {
  const [data, setData] = useState<AnalyticsData>(mockAnalyticsData);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // In a real app, fetch analytics data based on timeRange
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [timeRange]);

  const exportData = () => {
    // Export analytics data as CSV or PDF
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getPerformanceColor = (value: number, threshold: number = 80) => {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold - 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const chartConfig = {
    revenue: {
      color: 'hsl(var(--primary))',
      label: 'الإيرادات'
    },
    orders: {
      color: 'hsl(var(--secondary))',
      label: 'الطلبات'
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">التحليلات المتقدمة</h2>
          <p className="text-muted-foreground">رؤى شاملة حول أداء مطعمك</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            className="gap-2"
          >
            <Download size={16} />
            تصدير البيانات
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Calendar size={16} />
            تخصيص التاريخ
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">زمن التحضير</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(100 - data.performance.avgPreparationTime, 20)}`}>
                  {data.performance.avgPreparationTime} دقيقة
                </p>
                <p className="text-xs text-muted-foreground">متوسط الوقت</p>
              </div>
              <Clock size={24} className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">رضا العملاء</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(data.performance.customerSatisfaction * 20, 80)}`}>
                  {data.performance.customerSatisfaction}/5
                </p>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-yellow-500 fill-current" />
                  <p className="text-xs text-muted-foreground">متوسط التقييم</p>
                </div>
              </div>
              <Star size={24} className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">دقة الطلبات</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(data.performance.orderAccuracy, 85)}`}>
                  {data.performance.orderAccuracy}%
                </p>
                <p className="text-xs text-muted-foreground">نسبة الصحة</p>
              </div>
              <Target size={24} className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">التوصيل في الوقت</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(data.performance.onTimeDelivery, 85)}`}>
                  {data.performance.onTimeDelivery}%
                </p>
                <p className="text-xs text-muted-foreground">في الموعد المحدد</p>
              </div>
              <Clock size={24} className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">الإيرادات</TabsTrigger>
          <TabsTrigger value="orders">الطلبات</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="popular">الأكثر طلباً</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>تطور الإيرادات</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={timeRange === 'daily' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('daily')}
                  >
                    يومي
                  </Button>
                  <Button
                    variant={timeRange === 'weekly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('weekly')}
                  >
                    أسبوعي
                  </Button>
                  <Button
                    variant={timeRange === 'monthly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('monthly')}
                  >
                    شهري
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenue[timeRange]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'week' : 'month'} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>توزيع حالة الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.orders.statusDistribution}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ status, count }) => `${status}: ${count}`}
                      >
                        {data.orders.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>نمط الطلبات خلال اليوم</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.orders.hourlyPattern}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="orders" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>أنواع العملاء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.orders.customerTypes.map((type, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{type.type}</span>
                      <div className="text-right">
                        <p className="text-sm font-bold">{type.count} عميل</p>
                        <p className="text-xs text-muted-foreground">{type.value} ريال</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>مؤشرات الأداء الرئيسية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">دقة الطلبات</span>
                      <span className={`text-sm font-bold ${getPerformanceColor(data.performance.orderAccuracy, 85)}`}>
                        {data.performance.orderAccuracy}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${data.performance.orderAccuracy}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">التوصيل في الوقت</span>
                      <span className={`text-sm font-bold ${getPerformanceColor(data.performance.onTimeDelivery, 85)}`}>
                        {data.performance.onTimeDelivery}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${data.performance.onTimeDelivery}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>الأطباق الأكثر طلباً</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.popular.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.orders} طلب</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{item.revenue} ريال</p>
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع الفئات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.popular.categories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{category.category}</span>
                        <span className="text-sm font-bold">{category.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};