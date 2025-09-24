import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import OrderStatusBar from '@/components/ui/OrderStatusBar';
import {
  Package,
  Users,
  ArrowLeft,
  PlusCircle,
  ClipboardList,
  CheckCircle,
  Warehouse,
  WarehouseIcon,
} from "lucide-react";

import { API_BASE as API_URL } from '@/lib/api'; // use unified API base

const StoreDepartment = () => {
  const [inventory, setInventory] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", quantity: "" });

  // === Fetch inventory & purchase orders from backend ===
  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_URL}/store/inventory`);
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error("Error fetching inventory", err);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/store/orders/pending`);
      const data = await res.json();
      setPurchaseOrders(data);
    } catch (err) {
      console.error("Error fetching purchase orders", err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchPurchaseOrders();
  }, []);

  // === Store Check (Stock Availability) ===
  const handleStoreCheck = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/store/orders/${orderId}/check-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok) {
        if (data.message.toLowerCase().includes("insufficient")) {
  toast({
    title: "Insufficient Stock ❌",
    description: data.message,
    variant: "destructive",
  });
} else {
  toast({
    title: "Stock Allocated ✅",
    description: data.message,
  });
}
        // toast({ title: "Stock Checked ✅", description: data.message });
        fetchInventory();
        fetchPurchaseOrders();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to check stock", variant: "destructive" });
    }
  };

  // === Verify Purchase (After Purchase Dept Approval) ===
  const verifyAndAddToInventory = async (orderId) => {
    try {
      const res = await fetch(
        `${API_URL}/store/orders/${orderId}/verify-purchase`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.json();

      if (res.ok) {
        toast({ title: "Purchase Verified ✅", description: data.message });
        fetchInventory();
        fetchPurchaseOrders();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to verify purchase", variant: "destructive" });
    }
  };

  // === Add New Inventory Item ===
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.quantity) return;

    try {
      const res = await fetch(`${API_URL}/store/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      const data = await res.json();

      if (res.ok) {
        toast({ title: "Item Added ✅", description: data.message });
        setNewItem({ name: "", quantity: "" });
        fetchInventory();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    }
  };

return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    {/* Main Header */}
    <div className="max-w-7xl mx-auto bg-white shadow-md border-b-4 border-blue-800 rounded-b-lg">
      <div className="px-6 py-6">
        <div className="flex justify-between items-center">

          {/* Left: Back + Title */}
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate(user.department === 'admin' ? '/dashboard/admin' : '/dashboard')}
              variant="outline"
              className="border border-gray-300 bg-white text-gray-800 text-sm placeholder-gray-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
                <WarehouseIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Store Department</h1>
                <p className="text-gray-600 text-base font-medium">Inventory Management System</p>
              </div>
            </div>
          </div>

      {/* User Info Panel */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 px-6 py-4 rounded-lg shadow-sm">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-gray-600 text-xs font-medium">Store Team</p>
                <p className="text-blue-600 text-xs font-medium">Inventory Management</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    {/* Order Status Bar */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <OrderStatusBar className="mb-4" />
      </div>
      
    {/* Main Content */}
    <div className="px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Inventory */}
        <div>
          <Card className="bg-white border border-gray-300 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center">
                <PlusCircle className="w-5 h-5 mr-2" /> Add Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-800 font-medium">Item Name</Label>
                  <Input
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                    placeholder="e.g., Steel Rod"
                    className="w-full border-2 border-gray-300 bg-white text-gray-900 mt-1 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-800 font-medium">Quantity</Label>
                  <Input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({ ...newItem, quantity: e.target.value })
                    }
                    placeholder="e.g., 100"
                    className="w-full border-2 border-gray-300 bg-white text-gray-900 mt-1 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-gray-500"
                  />
                </div>
                <Button
                  onClick={handleAddItem}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory List */}
        <div>
          <Card className="bg-white border border-gray-300 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center">
                <ClipboardList className="w-5 h-5 mr-2" /> Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inventory.length > 0 ? (
                  inventory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex justify-between items-center"
                    >
                      <span className="text-gray-800 font-medium">{item.name}</span>
                      <Badge className="bg-green-500/20 text-green-400 border-0">
                        Qty: {item.quantity}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">No items</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Orders */}
        <div>
          <Card className="bg-white border border-gray-300 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center">
                <ClipboardList className="w-5 h-5 mr-2" /> Purchase Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purchaseOrders.length > 0 ? (
                  purchaseOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2"
                    >
                      <p className="text-gray-800 font-medium">
                        {order.product_name} (Qty: {order.quantity})
                      </p>
                      <p className="text-sm text-gray-600">
                        Status:{" "}
                        <span className="capitalize">{order.status}</span>
                      </p>
                      <div className="flex space-x-2">
                        {order.status === "pending_store_check" && (
                          <Button
                            size="sm"
                            onClick={() => handleStoreCheck(order.id)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          >
                            Check Stock
                          </Button>
                        )}

                        {order.status === "finance_approved" && (
                          <Button
                            size="sm"
                            onClick={() => verifyAndAddToInventory(order.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Verify & Send Stock
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">
                    No purchase orders
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="mt-12 bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm text-center text-gray-600">
      <p className="font-medium">© Inventory Management System</p>
      <p className="text-sm mt-1">For technical support, contact IT Department</p>
    </div>
  </div>
);

};


export default StoreDepartment;
