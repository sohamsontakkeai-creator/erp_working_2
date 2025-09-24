import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Package, 
  Factory, 
  ShoppingCart, 
  Warehouse, 
  Wrench, 
  DollarSign, 
  Store, 
  TrendingUp, 
  Truck, 
  Shield,
  RefreshCw,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { API_BASE } from '@/lib/api';

// Department icons mapping
const DEPARTMENT_ICONS = {
  'production': Factory,
  'purchase': ShoppingCart,
  'store': Warehouse,
  'assembly': Wrench,
  'finance': DollarSign,
  'showroom': Store,
  'sales': TrendingUp,
  'dispatch': Package,
  'transport': Truck,
  'watchman': Shield
};

// Status colors mapping
const STATUS_COLORS = {
  'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'in_progress': 'bg-blue-100 text-blue-800 border-blue-300',
  'waiting': 'bg-orange-100 text-orange-800 border-orange-300',
  'completed': 'bg-green-100 text-green-800 border-green-300',
  'failed': 'bg-red-100 text-red-800 border-red-300',
  'materials_ready': 'bg-purple-100 text-purple-800 border-purple-300',
  'customer_details_required': 'bg-amber-100 text-amber-800 border-amber-300',
  'ready_for_pickup': 'bg-indigo-100 text-indigo-800 border-indigo-300'
};

const OrderStatusBar = ({ className = "" }) => {
  const [productionOrders, setProductionOrders] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Only fetch and auto-refresh when there is an active search term
    if (!searchTerm.trim()) {
      setProductionOrders([]);
      setSalesOrders([]);
      setLoading(false);
      return;
    }

    fetchOrderStatus();

    const interval = setInterval(fetchOrderStatus, 30000);
    return () => clearInterval(interval);
  }, [searchTerm]);

  const fetchOrderStatus = async () => {
    if (!searchTerm.trim()) {
      // Do not fetch when there is no search term
      setProductionOrders([]);
      setSalesOrders([]);
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      const q = encodeURIComponent(searchTerm || '');
      const url = `${API_BASE}/orders/status-tracking${q ? `?q=${q}` : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProductionOrders(Array.isArray(data?.productionOrders) ? data.productionOrders : []);
        setSalesOrders(Array.isArray(data?.salesOrders) ? data.salesOrders : []);
      } else {
        console.error('Failed to fetch order status');
      }
    } catch (error) {
      console.error('Error fetching order status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchOrderStatus();
  };

  const filterOrders = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter(order => {
      if (!searchTerm.trim()) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.productName?.toLowerCase().includes(searchLower) ||
        order.customerName?.toLowerCase().includes(searchLower) ||
        order.currentDepartment?.toLowerCase().includes(searchLower) ||
        getDepartmentName(order.currentDepartment)?.toLowerCase().includes(searchLower) ||
        order.status?.toLowerCase().includes(searchLower) ||
        formatStatus(order.status)?.toLowerCase().includes(searchLower) ||
        order.id?.toString().includes(searchTerm)
      );
    });
  };
  // When there is a search term, API already filtered relations; still apply client filtering by text
  const filteredProduction = filterOrders(productionOrders);
  const filteredSales = filterOrders(salesOrders);

  function getStatusIcon(status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return Clock;
      case 'in_progress':
      case 'materials_ready':
        return Package;
      case 'completed':
        return CheckCircle;
      case 'failed':
        return AlertCircle;
      default:
        return Clock;
    }
  }

  function getDepartmentName(dept) {
    const names = {
      'production': 'Production Planning',
      'purchase': 'Purchase Department',
      'store': 'Store Department',
      'assembly': 'Assembly Team',
      'finance': 'Finance Department',
      'showroom': 'Showroom Department',
      'sales': 'Sales Department',
      'dispatch': 'Dispatch Department',
      'transport': 'Transport Department',
      'watchman': 'Security Department'
    };
    return names[dept] || dept;
  }

  function formatStatus(status) {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }

  if (loading) {
    return (
      <Card className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-600" />
            <span className="text-blue-800 font-medium">Loading order status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prompt user to search before showing any orders
  const hasSearch = !!searchTerm.trim();

  return (
    <Card className={`relative z-10 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-blue-900 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Order Status Tracker
            </h3>
            <p className="text-xs text-blue-600 mt-1">
              Search by: Order Number, Product Name, Customer Name, Department, or Status
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by order #, product, customer, department, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64 h-8 text-sm border-blue-300 focus:border-blue-500"
              />
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing || !hasSearch}
              size="sm"
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {!hasSearch ? (
          <div className="text-center py-6 text-gray-600">
            <Search className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            <p className="font-medium">Search to view order status</p>
            <p className="text-sm">Type a product, customer, or order number, then press Refresh</p>
          </div>
        ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Production Orders Section */}
          <div>
            <div className="flex items-center mb-2">
              <Factory className="w-4 h-4 text-blue-700 mr-2" />
              <h4 className="text-sm font-semibold text-blue-800">Production Orders</h4>
              <span className="ml-2 text-xs text-gray-500">({filteredProduction.length})</span>
            </div>
            {filteredProduction.length === 0 ? (
              <div className="text-center py-4 text-gray-500 border border-dashed border-blue-200 rounded">
                <p className="text-sm">No production orders</p>
              </div>
            ) : (
              filteredProduction.map((order) => {
              const DepartmentIcon = DEPARTMENT_ICONS[order.currentDepartment] || Package;
              const StatusIcon = getStatusIcon(order.status);
              const statusColor = STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800 border-gray-300';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg border border-blue-200 p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <DepartmentIcon className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-blue-700">
                              {getDepartmentName(order.currentDepartment)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {order.productName} {order.quantity && `(Qty: ${order.quantity})`}
                            {order.customerName && ` • ${order.customerName}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${statusColor} border font-medium flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {formatStatus(order.status)}
                      </Badge>
                      {order.updatedAt && (
                        <span className="text-xs text-gray-500">
                          {new Date(order.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress removed as per requirement */}
                </div>
              );
              })
            )}
          </div>

          {/* Sales Orders Section */}
          <div>
            <div className="flex items-center mb-2">
              <TrendingUp className="w-4 h-4 text-blue-700 mr-2" />
              <h4 className="text-sm font-semibold text-blue-800">Sales Orders</h4>
              <span className="ml-2 text-xs text-gray-500">({filteredSales.length})</span>
            </div>
            {filteredSales.length === 0 ? (
              <div className="text-center py-4 text-gray-500 border border-dashed border-blue-200 rounded">
                <p className="text-sm">No sales orders</p>
              </div>
            ) : (
              filteredSales.map((order) => {
                const DepartmentIcon = DEPARTMENT_ICONS[order.currentDepartment] || Package;
                const StatusIcon = getStatusIcon(order.status);
                const statusColor = STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800 border-gray-300';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg border border-blue-200 p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <DepartmentIcon className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-blue-700">
                                {getDepartmentName(order.currentDepartment)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {order.productName} {order.quantity && `(Qty: ${order.quantity})`}
                              {order.customerName && ` • ${order.customerName}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${statusColor} border font-medium flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {formatStatus(order.status)}
                        </Badge>
                        {order.updatedAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(order.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        )}

        {hasSearch && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 font-medium">
                Totals — Production: {filteredProduction.length}, Sales: {filteredSales.length}
              </span>
              <span className="text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderStatusBar;