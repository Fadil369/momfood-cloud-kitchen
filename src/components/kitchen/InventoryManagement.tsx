import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  Plus,
  Warning,
  TrendDown,
  TrendUp,
  MagnifyingGlass,
  Funnel,
  Download,
  Barcode
} from '@phosphor-icons/react';

interface InventoryItem {
  id: string;
  name: string;
  nameAr: string;
  category: 'vegetables' | 'meat' | 'dairy' | 'spices' | 'grains' | 'beverages' | 'other';
  currentStock: number;
  unit: 'kg' | 'pieces' | 'liters' | 'grams';
  minThreshold: number;
  maxCapacity: number;
  costPerUnit: number;
  supplier: string;
  expiryDate?: Date;
  lastRestocked: Date;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}

interface StockTransaction {
  id: string;
  itemId: string;
  type: 'restock' | 'usage' | 'waste' | 'adjustment';
  quantity: number;
  reason: string;
  timestamp: Date;
  cost?: number;
  supplier?: string;
}

const mockInventoryData: InventoryItem[] = [
  {
    id: 'inv-001',
    name: 'Chicken Breast',
    nameAr: 'صدور دجاج',
    category: 'meat',
    currentStock: 15,
    unit: 'kg',
    minThreshold: 5,
    maxCapacity: 50,
    costPerUnit: 25,
    supplier: 'المورد الذهبي',
    expiryDate: new Date('2024-08-26'),
    lastRestocked: new Date('2024-08-22'),
    status: 'in_stock'
  },
  {
    id: 'inv-002',
    name: 'Tomatoes',
    nameAr: 'طماطم',
    category: 'vegetables',
    currentStock: 3,
    unit: 'kg',
    minThreshold: 5,
    maxCapacity: 30,
    costPerUnit: 8,
    supplier: 'مزرعة الخضار',
    expiryDate: new Date('2024-08-25'),
    lastRestocked: new Date('2024-08-21'),
    status: 'low_stock'
  },
  {
    id: 'inv-003',
    name: 'Basmati Rice',
    nameAr: 'أرز بسمتي',
    category: 'grains',
    currentStock: 0,
    unit: 'kg',
    minThreshold: 10,
    maxCapacity: 100,
    costPerUnit: 12,
    supplier: 'مستودع الحبوب',
    lastRestocked: new Date('2024-08-15'),
    status: 'out_of_stock'
  },
  {
    id: 'inv-004',
    name: 'Mozzarella Cheese',
    nameAr: 'جبن موزاريلا',
    category: 'dairy',
    currentStock: 8,
    unit: 'kg',
    minThreshold: 3,
    maxCapacity: 20,
    costPerUnit: 45,
    supplier: 'ألبان الريف',
    expiryDate: new Date('2024-08-28'),
    lastRestocked: new Date('2024-08-23'),
    status: 'in_stock'
  },
  {
    id: 'inv-005',
    name: 'Black Pepper',
    nameAr: 'فلفل أسود',
    category: 'spices',
    currentStock: 2,
    unit: 'kg',
    minThreshold: 1,
    maxCapacity: 10,
    costPerUnit: 120,
    supplier: 'بيت البهارات',
    lastRestocked: new Date('2024-08-20'),
    status: 'in_stock'
  }
];

const mockTransactions: StockTransaction[] = [
  {
    id: 'txn-001',
    itemId: 'inv-001',
    type: 'restock',
    quantity: 20,
    reason: 'Weekly restock',
    timestamp: new Date('2024-08-22T10:00:00'),
    cost: 500,
    supplier: 'المورد الذهبي'
  },
  {
    id: 'txn-002',
    itemId: 'inv-001',
    type: 'usage',
    quantity: -5,
    reason: 'Chicken dishes preparation',
    timestamp: new Date('2024-08-23T14:30:00')
  },
  {
    id: 'txn-003',
    itemId: 'inv-002',
    type: 'usage',
    quantity: -2,
    reason: 'Salad preparation',
    timestamp: new Date('2024-08-23T12:15:00')
  }
];

export const InventoryManagement = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventoryData);
  const [transactions, setTransactions] = useState<StockTransaction[]>(mockTransactions);
  const [searchTerm, setMagnifyingGlassTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showRestockDialog, setShowRestockDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    nameAr: '',
    category: 'other',
    currentStock: 0,
    unit: 'kg',
    minThreshold: 1,
    maxCapacity: 10,
    costPerUnit: 0,
    supplier: ''
  });

  const [restockData, setRestockData] = useState({
    quantity: 0,
    cost: 0,
    supplier: '',
    reason: ''
  });

  const categories = [
    { value: 'all', label: 'جميع الفئات' },
    { value: 'vegetables', label: 'خضروات' },
    { value: 'meat', label: 'لحوم' },
    { value: 'dairy', label: 'ألبان' },
    { value: 'spices', label: 'بهارات' },
    { value: 'grains', label: 'حبوب' },
    { value: 'beverages', label: 'مشروبات' },
    { value: 'other', label: 'أخرى' }
  ];

  const statusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'in_stock', label: 'متوفر' },
    { value: 'low_stock', label: 'مخزون منخفض' },
    { value: 'out_of_stock', label: 'نفذ المخزون' },
    { value: 'expired', label: 'منتهي الصلاحية' }
  ];

  // Funnel inventory based on search and filters
  const filteredInventory = inventory.filter(item => {
    const matchesMagnifyingGlass = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.nameAr.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    
    return matchesMagnifyingGlass && matchesCategory && matchesStatus;
  });

  // Calculate inventory statistics
  const inventoryStats = {
    totalItems: inventory.length,
    lowStockItems: inventory.filter(item => item.status === 'low_stock').length,
    outOfStockItems: inventory.filter(item => item.status === 'out_of_stock').length,
    expiredItems: inventory.filter(item => item.status === 'expired').length,
    totalValue: inventory.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock': return 'متوفر';
      case 'low_stock': return 'مخزون منخفض';
      case 'out_of_stock': return 'نفذ المخزون';
      case 'expired': return 'منتهي الصلاحية';
      default: return 'غير محدد';
    }
  };

  const handleAddItem = () => {
    const id = `inv-${Date.now()}`;
    const item: InventoryItem = {
      ...newItem,
      id,
      lastRestocked: new Date(),
      status: newItem.currentStock! > newItem.minThreshold! ? 'in_stock' : 
              newItem.currentStock! > 0 ? 'low_stock' : 'out_of_stock'
    } as InventoryItem;

    setInventory([...inventory, item]);
    setNewItem({
      name: '',
      nameAr: '',
      category: 'other',
      currentStock: 0,
      unit: 'kg',
      minThreshold: 1,
      maxCapacity: 10,
      costPerUnit: 0,
      supplier: ''
    });
    setShowAddItemDialog(false);
  };

  const handleRestock = () => {
    if (!selectedItem) return;

    const updatedInventory = inventory.map(item => {
      if (item.id === selectedItem.id) {
        const newStock = item.currentStock + restockData.quantity;
        return {
          ...item,
          currentStock: newStock,
          lastRestocked: new Date(),
          status: (newStock > item.minThreshold ? 'in_stock' : 
                  newStock > 0 ? 'low_stock' : 'out_of_stock') as InventoryItem['status']
        };
      }
      return item;
    });

    const transaction: StockTransaction = {
      id: `txn-${Date.now()}`,
      itemId: selectedItem.id,
      type: 'restock',
      quantity: restockData.quantity,
      reason: restockData.reason || 'Manual restock',
      timestamp: new Date(),
      cost: restockData.cost,
      supplier: restockData.supplier
    };

    setInventory(updatedInventory);
    setTransactions([transaction, ...transactions]);
    setRestockData({ quantity: 0, cost: 0, supplier: '', reason: '' });
    setSelectedItem(null);
    setShowRestockDialog(false);
  };

  const exportInventoryReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      stats: inventoryStats,
      inventory: inventory,
      recentTransactions: transactions.slice(0, 50)
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">إدارة المخزون</h2>
          <p className="text-muted-foreground">تتبع وإدارة مخزون المطعم</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportInventoryReport} variant="outline" size="sm" className="gap-2">
            <Download size={16} />
            تصدير التقرير
          </Button>
          <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus size={16} />
                إضافة مادة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة مادة جديدة للمخزون</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">اسم المادة (English)</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nameAr">اسم المادة (العربية)</Label>
                    <Input
                      id="nameAr"
                      value={newItem.nameAr}
                      onChange={(e) => setNewItem({ ...newItem, nameAr: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">الفئة</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({ ...newItem, category: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="unit">الوحدة</Label>
                    <Select
                      value={newItem.unit}
                      onValueChange={(value) => setNewItem({ ...newItem, unit: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">كيلوجرام</SelectItem>
                        <SelectItem value="pieces">قطعة</SelectItem>
                        <SelectItem value="liters">لتر</SelectItem>
                        <SelectItem value="grams">جرام</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="currentStock">المخزون الحالي</Label>
                    <Input
                      id="currentStock"
                      type="number"
                      value={newItem.currentStock}
                      onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minThreshold">الحد الأدنى</Label>
                    <Input
                      id="minThreshold"
                      type="number"
                      value={newItem.minThreshold}
                      onChange={(e) => setNewItem({ ...newItem, minThreshold: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxCapacity">السعة القصوى</Label>
                    <Input
                      id="maxCapacity"
                      type="number"
                      value={newItem.maxCapacity}
                      onChange={(e) => setNewItem({ ...newItem, maxCapacity: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="costPerUnit">التكلفة لكل وحدة</Label>
                    <Input
                      id="costPerUnit"
                      type="number"
                      step="0.01"
                      value={newItem.costPerUnit}
                      onChange={(e) => setNewItem({ ...newItem, costPerUnit: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">المورد</Label>
                    <Input
                      id="supplier"
                      value={newItem.supplier}
                      onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddItem} className="flex-1">
                    إضافة المادة
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddItemDialog(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي المواد</p>
                <p className="text-2xl font-bold">{inventoryStats.totalItems}</p>
              </div>
              <Package size={24} className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مخزون منخفض</p>
                <p className="text-2xl font-bold text-yellow-600">{inventoryStats.lowStockItems}</p>
              </div>
              <TrendDown size={24} className="text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">نفذ المخزون</p>
                <p className="text-2xl font-bold text-red-600">{inventoryStats.outOfStockItems}</p>
              </div>
              <Warning size={24} className="text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">منتهي الصلاحية</p>
                <p className="text-2xl font-bold text-gray-600">{inventoryStats.expiredItems}</p>
              </div>
              <Warning size={24} className="text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">قيمة المخزون</p>
                <p className="text-2xl font-bold">{inventoryStats.totalValue.toFixed(0)} ريال</p>
              </div>
              <TrendUp size={24} className="text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {inventoryStats.lowStockItems > 0 && (
        <Alert>
          <Warning className="h-4 w-4" />
          <AlertDescription>
            لديك {inventoryStats.lowStockItems} مادة بمخزون منخفض تحتاج إلى إعادة تموين
          </AlertDescription>
        </Alert>
      )}

      {/* Funnels */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="البحث في المخزون..."
              value={searchTerm}
              onChange={(e) => setMagnifyingGlassTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="الفئة" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المادة</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>المخزون الحالي</TableHead>
                <TableHead>الحد الأدنى</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التكلفة/الوحدة</TableHead>
                <TableHead>المورد</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.nameAr}</p>
                      <p className="text-sm text-muted-foreground">{item.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {categories.find(cat => cat.value === item.category)?.label}
                  </TableCell>
                  <TableCell>
                    <span className={item.currentStock <= item.minThreshold ? 'text-red-600 font-bold' : ''}>
                      {item.currentStock} {item.unit}
                    </span>
                  </TableCell>
                  <TableCell>{item.minThreshold} {item.unit}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.costPerUnit} ريال</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowRestockDialog(true);
                      }}
                    >
                      إعادة تموين
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Restock Dialog */}
      <Dialog open={showRestockDialog} onOpenChange={setShowRestockDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إعادة تموين: {selectedItem?.nameAr}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">الكمية</Label>
              <Input
                id="quantity"
                type="number"
                value={restockData.quantity}
                onChange={(e) => setRestockData({ ...restockData, quantity: Number(e.target.value) })}
              />
            </div>
            
            <div>
              <Label htmlFor="cost">التكلفة الإجمالية</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={restockData.cost}
                onChange={(e) => setRestockData({ ...restockData, cost: Number(e.target.value) })}
              />
            </div>
            
            <div>
              <Label htmlFor="supplier">المورد</Label>
              <Input
                id="supplier"
                value={restockData.supplier}
                onChange={(e) => setRestockData({ ...restockData, supplier: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="reason">السبب</Label>
              <Textarea
                id="reason"
                value={restockData.reason}
                onChange={(e) => setRestockData({ ...restockData, reason: e.target.value })}
                placeholder="سبب إعادة التموين..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleRestock} className="flex-1">
                إعادة تموين
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowRestockDialog(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};