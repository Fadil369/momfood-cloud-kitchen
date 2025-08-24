import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Brain,
  TrendUp,
  TrendDown,
  Users,
  Heart,
  Star,
  Clock,
  CurrencyDollar,
  Target,
  Lightbulb,
  ChartBar,
  Eye,
  Share,
  Download
} from '@phosphor-icons/react';

interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  count: number;
  percentage: number;
  avgOrderValue: number;
  frequency: string;
  characteristics: string[];
  recommendations: string[];
}

interface AIInsight {
  id: string;
  type: 'trend' | 'opportunity' | 'warning' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionItems: string[];
  estimatedImpact: string;
}

interface PredictiveMetric {
  metric: string;
  current: number;
  predicted: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  timeframe: string;
}

interface CustomerBehavior {
  ordering_patterns: {
    peak_hours: string[];
    preferred_days: string[];
    seasonal_trends: string[];
  };
  preferences: {
    cuisine_preferences: Array<{ cuisine: string; percentage: number }>;
    price_sensitivity: 'low' | 'medium' | 'high';
    delivery_preferences: string[];
  };
  satisfaction: {
    rating: number;
    feedback_sentiment: 'positive' | 'neutral' | 'negative';
    repeat_rate: number;
  };
}

const mockSegments: CustomerSegment[] = [
  {
    id: 'seg-001',
    name: 'VIP العملاء المميزين',
    description: 'عملاء بقيمة طلبات عالية ومعدل طلب مرتفع',
    count: 45,
    percentage: 12,
    avgOrderValue: 185,
    frequency: 'أسبوعيا',
    characteristics: ['طلبات أسبوعية', 'قيمة عالية', 'تقييمات إيجابية', 'ولاء عالي'],
    recommendations: ['برنامج ولاء مخصص', 'خصومات حصرية', 'تجربة مخصصة', 'خدمة عملاء أولوية']
  },
  {
    id: 'seg-002',
    name: 'العملاء المنتظمين',
    description: 'عملاء بمعدل طلب منتظم وقيمة متوسطة',
    count: 156,
    percentage: 42,
    avgOrderValue: 95,
    frequency: 'شهريا',
    characteristics: ['طلبات منتظمة', 'قيمة متوسطة', 'حساسية سعر متوسطة'],
    recommendations: ['عروض شهرية', 'برنامج نقاط', 'تذكير بالعروض']
  },
  {
    id: 'seg-003',
    name: 'العملاء الجدد',
    description: 'عملاء جدد في أول 3 أشهر',
    count: 89,
    percentage: 24,
    avgOrderValue: 65,
    frequency: 'مرة واحدة',
    characteristics: ['تجربة أولى', 'قيمة منخفضة', 'حاجة لتحفيز'],
    recommendations: ['خصم الطلب الثاني', 'تجربة مجانية', 'دليل التطبيق']
  },
  {
    id: 'seg-004',
    name: 'العملاء غير النشطين',
    description: 'عملاء لم يطلبوا منذ 3 أشهر أو أكثر',
    count: 78,
    percentage: 22,
    avgOrderValue: 45,
    frequency: 'نادرا',
    characteristics: ['غير نشط', 'آخر طلب قديم', 'احتمال فقدان'],
    recommendations: ['حملة إعادة التفعيل', 'خصم كبير', 'استبيان الرضا']
  }
];

const mockInsights: AIInsight[] = [
  {
    id: 'insight-001',
    type: 'opportunity',
    title: 'زيادة طلبات عطلة نهاية الأسبوع',
    description: 'تشير البيانات إلى انخفاض طلبات عطلة نهاية الأسبوع بنسبة 15% مقارنة بأيام الأسبوع',
    impact: 'high',
    confidence: 87,
    actionItems: [
      'إطلاق عروض خاصة لعطلة نهاية الأسبوع',
      'تسويق عبر وسائل التواصل الاجتماعي',
      'قائمة طعام خاصة بعطلة نهاية الأسبوع'
    ],
    estimatedImpact: '+25% زيادة في الطلبات'
  },
  {
    id: 'insight-002',
    type: 'trend',
    title: 'تزايد الطلب على الطعام الصحي',
    description: 'نمو طلبات الطعام الصحي بنسبة 35% في الشهرين الماضيين',
    impact: 'medium',
    confidence: 92,
    actionItems: [
      'توسيع قائمة الطعام الصحي',
      'إضافة معلومات غذائية للأطباق',
      'شراكة مع خبراء التغذية'
    ],
    estimatedImpact: '+40% نمو في هذا القطاع'
  },
  {
    id: 'insight-003',
    type: 'warning',
    title: 'انخفاض رضا العملاء عن وقت التوصيل',
    description: 'متوسط تقييم وقت التوصيل انخفض من 4.5 إلى 4.1 في الأسبوع الماضي',
    impact: 'high',
    confidence: 89,
    actionItems: [
      'مراجعة شبكة التوصيل',
      'زيادة عدد السائقين في أوقات الذروة',
      'تحسين توقعات وقت التوصيل'
    ],
    estimatedImpact: 'تحسن الرضا بنسبة 20%'
  },
  {
    id: 'insight-004',
    type: 'recommendation',
    title: 'فرصة التوسع في منطقة جديدة',
    description: 'تحليل البيانات يظهر طلب عالي غير مُلبى في منطقة شمال الرياض',
    impact: 'medium',
    confidence: 78,
    actionItems: [
      'دراسة جدوى للتوسع',
      'تحليل المنافسة في المنطقة',
      'خطة تسويق للمنطقة الجديدة'
    ],
    estimatedImpact: '+15% زيادة في العملاء'
  }
];

const mockPredictions: PredictiveMetric[] = [
  {
    metric: 'إجمالي الطلبات (الشهر القادم)',
    current: 1250,
    predicted: 1420,
    trend: 'up',
    confidence: 85,
    timeframe: '30 يوم'
  },
  {
    metric: 'متوسط قيمة الطلب',
    current: 95,
    predicted: 102,
    trend: 'up',
    confidence: 78,
    timeframe: '30 يوم'
  },
  {
    metric: 'معدل الاحتفاظ بالعملاء',
    current: 72,
    predicted: 75,
    trend: 'up',
    confidence: 82,
    timeframe: '90 يوم'
  },
  {
    metric: 'رضا العملاء',
    current: 4.6,
    predicted: 4.4,
    trend: 'down',
    confidence: 71,
    timeframe: '30 يوم'
  }
];

const mockBehavior: CustomerBehavior = {
  ordering_patterns: {
    peak_hours: ['12:00-14:00', '18:00-21:00'],
    preferred_days: ['الجمعة', 'السبت', 'الأحد'],
    seasonal_trends: ['زيادة 20% في رمضان', 'نمو الطعام الصحي في الصيف']
  },
  preferences: {
    cuisine_preferences: [
      { cuisine: 'عربي', percentage: 45 },
      { cuisine: 'وجبات سريعة', percentage: 30 },
      { cuisine: 'صحي', percentage: 15 },
      { cuisine: 'حلويات', percentage: 10 }
    ],
    price_sensitivity: 'medium',
    delivery_preferences: ['توصيل سريع', 'تتبع الطلب', 'خيارات دفع متعددة']
  },
  satisfaction: {
    rating: 4.6,
    feedback_sentiment: 'positive',
    repeat_rate: 68
  }
};

export const AICustomerInsights = () => {
  const [segments, setSegments] = useState<CustomerSegment[]>(mockSegments);
  const [insights, setInsights] = useState<AIInsight[]>(mockInsights);
  const [predictions, setPredictions] = useState<PredictiveMetric[]>(mockPredictions);
  const [behavior, setBehavior] = useState<CustomerBehavior>(mockBehavior);
  const [isLoading, setIsLoading] = useState(false);

  const refreshInsights = async () => {
    setIsLoading(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendUp size={20} className="text-blue-600" />;
      case 'opportunity': return <Target size={20} className="text-green-600" />;
      case 'warning': return <TrendDown size={20} className="text-red-600" />;
      case 'recommendation': return <Lightbulb size={20} className="text-yellow-600" />;
      default: return <Brain size={20} className="text-gray-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'trend': return 'border-blue-200 bg-blue-50';
      case 'opportunity': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-red-200 bg-red-50';
      case 'recommendation': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'high': return 'تأثير عالي';
      case 'medium': return 'تأثير متوسط';
      case 'low': return 'تأثير منخفض';
      default: return 'غير محدد';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendUp size={16} className="text-green-600" />;
      case 'down': return <TrendDown size={16} className="text-red-600" />;
      case 'stable': return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
      default: return null;
    }
  };

  const exportInsights = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      segments,
      insights,
      predictions,
      behavior
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-insights-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <Brain size={32} className="text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold">رؤى العملاء بالذكاء الاصطناعي</h2>
            <p className="text-muted-foreground">تحليل سلوك العملاء وتوقعات ذكية</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportInsights}
            className="gap-2"
          >
            <Download size={16} />
            تصدير التقرير
          </Button>
          <Button
            onClick={refreshInsights}
            disabled={isLoading}
            size="sm"
            className="gap-2"
          >
            <Brain size={16} />
            {isLoading ? 'جاري التحليل...' : 'تحديث الرؤى'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي العملاء</p>
                <p className="text-2xl font-bold">{segments.reduce((sum, seg) => sum + seg.count, 0)}</p>
                <p className="text-xs text-green-600">+12% هذا الشهر</p>
              </div>
              <Users size={24} className="text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">متوسط الرضا</p>
                <p className="text-2xl font-bold">{behavior.satisfaction.rating}/5</p>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-yellow-500 fill-current" />
                  <p className="text-xs text-muted-foreground">
                    {behavior.satisfaction.feedback_sentiment === 'positive' ? 'إيجابي' : 'سلبي'}
                  </p>
                </div>
              </div>
              <Heart size={24} className="text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">معدل الاحتفاظ</p>
                <p className="text-2xl font-bold">{behavior.satisfaction.repeat_rate}%</p>
                <p className="text-xs text-green-600">+5% تحسن</p>
              </div>
              <Target size={24} className="text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">رؤى جديدة</p>
                <p className="text-2xl font-bold">{insights.length}</p>
                <p className="text-xs text-blue-600">محدثة اليوم</p>
              </div>
              <Brain size={24} className="text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">الرؤى الذكية</TabsTrigger>
          <TabsTrigger value="segments">تجمعات العملاء</TabsTrigger>
          <TabsTrigger value="predictions">التوقعات</TabsTrigger>
          <TabsTrigger value="behavior">سلوك العملاء</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.map((insight) => (
              <Card key={insight.id} className={`border-l-4 ${getInsightColor(insight.type)}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getInsightIcon(insight.type)}
                      <div>
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getImpactColor(insight.impact)}>
                        {getImpactLabel(insight.impact)}
                      </Badge>
                      <Badge variant="outline">
                        {insight.confidence}% ثقة
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">خطوات العمل المقترحة:</h4>
                      <ul className="space-y-1">
                        {insight.actionItems.map((item, index) => (
                          <li key={index} className="text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-muted/50 p-3 rounded">
                      <p className="text-sm font-medium">التأثير المتوقع: {insight.estimatedImpact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid gap-4">
            {segments.map((segment) => (
              <Card key={segment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{segment.name}</CardTitle>
                    <Badge variant="outline">{segment.count} عميل</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{segment.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">خصائص التجمع:</h4>
                      <div className="flex flex-wrap gap-2">
                        {segment.characteristics.map((char, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {char}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">نسبة من العملاء:</span>
                          <span className="text-sm font-bold">{segment.percentage}%</span>
                        </div>
                        <Progress value={segment.percentage} className="h-2" />
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">متوسط قيمة الطلب</p>
                            <p className="text-lg font-bold">{segment.avgOrderValue} ريال</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">تكرار الطلب</p>
                            <p className="text-lg font-bold">{segment.frequency}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">التوصيات:</h4>
                      <ul className="space-y-2">
                        {segment.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <Lightbulb size={14} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              التوقعات مبنية على تحليل البيانات التاريخية وخوارزميات التعلم الآلي
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4">
            {predictions.map((prediction, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">{prediction.metric}</h3>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(prediction.trend)}
                      <Badge variant="outline">{prediction.confidence}% ثقة</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">القيمة الحالية</p>
                      <p className="text-2xl font-bold">{prediction.current}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">التوقع ({prediction.timeframe})</p>
                      <p className={`text-2xl font-bold ${
                        prediction.trend === 'up' ? 'text-green-600' : 
                        prediction.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {prediction.predicted}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>مستوى الثقة</span>
                      <span>{prediction.confidence}%</span>
                    </div>
                    <Progress value={prediction.confidence} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أنماط الطلب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">أوقات الذروة:</h4>
                  <div className="flex flex-wrap gap-2">
                    {behavior.ordering_patterns.peak_hours.map((hour, index) => (
                      <Badge key={index} variant="outline">{hour}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">الأيام المفضلة:</h4>
                  <div className="flex flex-wrap gap-2">
                    {behavior.ordering_patterns.preferred_days.map((day, index) => (
                      <Badge key={index} variant="outline">{day}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">الاتجاهات الموسمية:</h4>
                  <ul className="space-y-1">
                    {behavior.ordering_patterns.seasonal_trends.map((trend, index) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <ChartBar size={14} className="text-blue-600" />
                        {trend}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تفضيلات العملاء</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">تفضيلات الطبخ:</h4>
                  <div className="space-y-2">
                    {behavior.preferences.cuisine_preferences.map((pref, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{pref.cuisine}</span>
                          <span>{pref.percentage}%</span>
                        </div>
                        <Progress value={pref.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">حساسية السعر:</h4>
                  <Badge className={
                    behavior.preferences.price_sensitivity === 'low' ? 'bg-green-100 text-green-800' :
                    behavior.preferences.price_sensitivity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {behavior.preferences.price_sensitivity === 'low' ? 'منخفضة' :
                     behavior.preferences.price_sensitivity === 'medium' ? 'متوسطة' : 'عالية'}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">تفضيلات التوصيل:</h4>
                  <ul className="space-y-1">
                    {behavior.preferences.delivery_preferences.map((pref, index) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <Clock size={14} className="text-green-600" />
                        {pref}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};