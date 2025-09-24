import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
    Shield,
    CheckCircle,
    XCircle,
    Clock,
    User,
    AlertTriangle,
    BarChart3,
    RefreshCw,
    ArrowLeft,
    Users,
    FileText,
    Search
} from 'lucide-react';

import { API_BASE } from '@/lib/api';
import GateEntryTab from './GateEntryTab';
import OrderStatusBar from '@/components/ui/OrderStatusBar';

const WatchmanDepartment = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [pendingPickups, setPendingPickups] = useState([]);
    const [allGatePasses, setAllGatePasses] = useState([]);
    const [watchmanSummary, setWatchmanSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedGatePass, setSelectedGatePass] = useState(null);
    const [showVerifyDialog, setShowVerifyDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);

    const [allPassesSearchTerm, setAllPassesSearchTerm] = useState('');
    const [notificationCounts, setNotificationCounts] = useState({
        pendingPickups: 0
    });
    const { toast } = useToast();

    // Form states
    const [verificationForm, setVerificationForm] = useState({
        customerName: '',
        vehicleNo: '',
        driverName: '',
        note: ''
    });

    const [rejectionForm, setRejectionForm] = useState({
        rejectionReason: ''
    });

    useEffect(() => {
        fetchData();
    }, []);
    
    // Update notification counts when pendingPickups changes
    useEffect(() => {
        setNotificationCounts({
            pendingPickups: pendingPickups.length
        });
    }, [pendingPickups]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pickupsRes, gatePassesRes, summaryRes] = await Promise.all([
                fetch(`${API_BASE}/watchman/pending-pickups`),
                fetch(`${API_BASE}/watchman/gate-passes`),
                fetch(`${API_BASE}/watchman/summary`)
            ]);

            if (pickupsRes.ok) {
                const pickups = await pickupsRes.json();
                setPendingPickups(pickups);
            }

            if (gatePassesRes.ok) {
                const gatePasses = await gatePassesRes.json();
                setAllGatePasses(gatePasses);
            }

            if (summaryRes.ok) {
                const summary = await summaryRes.json();
                setWatchmanSummary(summary);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: "Error",
                description: "Failed to fetch watchman data",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPickup = async (action) => {
        try {
            const requestData = {
                ...verificationForm,
                action: action
            };

            const response = await fetch(`${API_BASE}/watchman/verify/${selectedGatePass.gatePassId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                const result = await response.json();

                if (result.status === 'identity_mismatch') {
                    toast({
                        title: "Identity Mismatch",
                        description: result.message,
                        variant: "destructive"
                    });
                    return;
                }

                setShowVerifyDialog(false);
                setVerificationForm({
                    customerName: '',
                    vehicleNo: '',
                    driverName: '',
                    note: ''
                });

                toast({
                    title: "Success",
                    description: result.message,
                });

                fetchData(); // Refresh data
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.error || "Failed to verify pickup",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error verifying pickup:', error);
            toast({
                title: "Error",
                description: "Failed to verify pickup",
                variant: "destructive"
            });
        }
    };

    const handleRejectPickup = async () => {
        try {
            const response = await fetch(`${API_BASE}/watchman/reject/${selectedGatePass.gatePassId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rejectionForm),
            });

            if (response.ok) {
                const result = await response.json();
                setShowRejectDialog(false);
                setRejectionForm({
                    rejectionReason: ''
                });

                toast({
                    title: "Pickup Rejected",
                    description: result.message,
                    variant: "destructive"
                });

                fetchData(); // Refresh data
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.error || "Failed to reject pickup",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error rejecting pickup:', error);
            toast({
                title: "Error",
                description: "Failed to reject pickup",
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'pending': {
                className: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
                text: 'Pending Verification'
            },
            'verified': {
                className: 'bg-green-100 text-green-800 border border-green-300',
                text: 'Verified & Released'
            },
            'entered_for_pickup': {
                className: 'bg-blue-100 text-blue-800 border border-blue-300',
                text: 'Entered for Pickup'
            },
            'rejected': {
                className: 'bg-red-100 text-red-800 border border-red-300',
                text: 'Rejected'
            }
        };
        const config = statusConfig[status] || {
            className: 'bg-gray-100 text-gray-800 border border-gray-300',
            text: status
        };
        return <Badge className={`${config.className} font-medium`}>{config.text}</Badge>;
    };

    const openVerifyDialog = (gatePass) => {
        setSelectedGatePass(gatePass);
        setVerificationForm({
            customerName: gatePass.customerName || '',
            vehicleNo: gatePass.customerVehicle || '',
            driverName: gatePass.driverName || ''
        });
        setShowVerifyDialog(true);
    };

    const openRejectDialog = (gatePass) => {
        setSelectedGatePass(gatePass);
        setRejectionForm({
            rejectionReason: ''
        });
        setShowRejectDialog(true);
    };

    const filteredAllGatePasses = allGatePasses.filter((gatePass) => {
        if (!allPassesSearchTerm.trim()) return true;
        const searchLower = allPassesSearchTerm.toLowerCase();
        return (
            gatePass.customerName?.toLowerCase().includes(searchLower) ||
            gatePass.orderNumber?.toLowerCase().includes(searchLower) ||
            gatePass.productName?.toLowerCase().includes(searchLower) ||
            gatePass.customerVehicle?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Government Header */}
            <div className="max-w-7xl mx-auto bg-white shadow-md border-b-4 border-blue-800 rounded-b-lg">
                {/* Main Header */}
                <div className="px-6 py-6">
                    <div className="flex justify-between items-center">
                        {/* Left: Back + Title */}
                        <div className="flex items-center space-x-4">
                            <Button
                                onClick={() => navigate(user?.department === 'admin' ? '/dashboard/admin' : '/dashboard')}
                                variant="outline"
                                className="border border-gray-300 bg-white text-gray-800 text-sm placeholder-gray-500"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Button>
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center shadow-lg">
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Security Department</h1>
                                    <p className="text-gray-600 text-base font-medium">
                                        Access Control & Security Management
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* User Info Panel */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 px-6 py-4 rounded-lg shadow-sm">
                            <div className="flex items-center space-x-3">
                                <Users className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-gray-600 text-xs font-medium">Security Team</p>
                                    <p className="text-blue-600 text-xs font-medium">Security Management</p>
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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4 bg-gray-100 border border-gray-300">
                        <TabsTrigger value="dashboard" className="text-gray-800">Dashboard</TabsTrigger>
                        <TabsTrigger value="pending" className="text-gray-800 relative">
                            Pending Pickups
                            {notificationCounts.pendingPickups > 0 && (
                                <div className="absolute -top-2 -right-2 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold min-w-[1.25rem] h-5 px-1">
                                    {notificationCounts.pendingPickups}
                                </div>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="all-passes" className="text-gray-800">All Gate Passes</TabsTrigger>
                        <TabsTrigger value="gate-entry" className="text-gray-800">Gate Entry</TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <Card className="bg-white border border-gray-300 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-800">Pending Verification</CardTitle>
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-gray-800">{watchmanSummary.todayPending || 0}</div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border border-gray-300 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-800">Entered Today</CardTitle>
                                    <User className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-gray-800">{watchmanSummary.todayEntered || 0}</div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border border-gray-300 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-800">Verified Today</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-gray-800">{watchmanSummary.todayVerified || 0}</div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border border-gray-300 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-800">Rejected Today</CardTitle>
                                    <XCircle className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-gray-800">{watchmanSummary.todayRejected || 0}</div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border border-gray-300 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-800">Total Activity</CardTitle>
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-gray-800">{watchmanSummary.todayTotal || 0}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Card className="bg-white border border-gray-300 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-gray-800">
                                        <Shield className="h-5 w-5" />
                                        Security Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-800">Total Pending</span>
                                            <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 font-medium">
                                                {watchmanSummary.totalPending || 0}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-800">Total Verified</span>
                                            <Badge className="bg-green-100 text-green-800 border border-green-300 font-medium">
                                                {watchmanSummary.totalVerified || 0}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-800">Total Rejected</span>
                                            <Badge className="bg-red-100 text-red-800 border border-red-300 font-medium">
                                                {watchmanSummary.totalRejected || 0}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border border-gray-300 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-gray-800">Recent Pickups</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        {pendingPickups.slice(0, 5).map((pickup) => (
                                            <div key={pickup.gatePassId} className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium text-gray-800">{pickup.customerName}</div>
                                                    <div className="text-xs text-gray-600">{pickup.orderNumber}</div>
                                                </div>
                                                {getStatusBadge(pickup.status)}
                                            </div>
                                        ))}
                                        {pendingPickups.length === 0 && (
                                            <p className="text-gray-600 text-center">No recent pickups</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="pending" className="space-y-4">
                        <Card className="bg-white border border-gray-300 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-gray-800">
                                    <Shield className="h-5 w-5" />
                                    Pending Customer Pickups ({pendingPickups.length})
                                </CardTitle>
                                <CardDescription className="text-gray-600">
                                    Customers waiting for verification and product pickup
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : pendingPickups.length === 0 ? (
                                    <div className="text-center py-8 text-gray-600">
                                        <Shield className="mx-auto h-12 w-12 mb-4" />
                                        <p>No pending customer pickups</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-black">Gate Pass #</TableHead>
                                                <TableHead className="text-black">Order #</TableHead>
                                                <TableHead className="text-black">Customer</TableHead>
                                                <TableHead className="text-black">Product</TableHead>
                                                <TableHead className="text-black">Vehicle</TableHead>
                                                <TableHead className="text-black">Driver Name</TableHead>
                                                <TableHead className="text-black">Driver Contact</TableHead>
                                                <TableHead className="text-black">Ready Status</TableHead>
                                                <TableHead className="text-black">Issued At</TableHead>
                                                <TableHead className="text-black">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingPickups.map((pickup) => (
                                                <TableRow key={pickup.gatePassId}>
                                                    <TableCell className="font-medium text-gray-800">GP-{pickup.gatePassId}</TableCell>
                                                    <TableCell className="font-medium text-gray-800">{pickup.orderNumber}</TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium text-gray-800">{pickup.customerName}</div>
                                                            <div className="text-sm text-gray-600">{pickup.customerContact}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium text-gray-800">{pickup.productName}</div>
                                                            <div className="text-sm text-gray-600">Qty: {pickup.quantity}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-gray-800">{pickup.customerVehicle || 'Not provided'}</TableCell>
                                                    <TableCell className="font-medium text-gray-800">{pickup.driverName}</TableCell>
                                                    <TableCell className="font-medium text-gray-800">{pickup.driverContact || 'Not provided'}</TableCell>
                                                    <TableCell className="text-center">
                                                        {pickup.dispatchStatus === 'ready_for_pickup' || pickup.dispatchStatus === 'ready_for_load' || pickup.dispatchStatus === 'entered_for_pickup' || pickup.dispatchStatus === 'loaded' ? (
                                                            <div className="flex items-center justify-center">
                                                                <CheckCircle className="h-6 w-6 text-green-600" />
                                                                <span className="ml-2 text-green-600 font-semibold">
                                                                    {pickup.dispatchStatus === 'loaded' ? 'Loaded' :
                                                                     pickup.dispatchStatus === 'entered_for_pickup' ? 'Sent In' : 'Ready'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center">
                                                                <XCircle className="h-6 w-6 text-red-500" />
                                                                <span className="ml-2 text-red-500 font-semibold">Not Ready</span>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-gray-800">{new Date(pickup.issuedAt).toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => openVerifyDialog(pickup)}
                                                                className="bg-green-600 hover:bg-green-700"
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                                Verify
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => openRejectDialog(pickup)}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-1" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="all-passes" className="space-y-4">
                        <Card className="bg-white border border-gray-300 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-gray-800">
                                    <FileText className="h-5 w-5" />
                                    All Gate Passes ({filteredAllGatePasses.length})
                                </CardTitle>
                                <CardDescription className="text-gray-600">
                                    Search by customer name, order number, product name, or vehicle number
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 mb-4">
                                    <Input
                                        placeholder="Enter customer name, order number, product, or vehicle..."
                                        value={allPassesSearchTerm}
                                        onChange={(e) => setAllPassesSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && setAllPassesSearchTerm(e.target.value)}
                                    />
                                    <Button onClick={() => setAllPassesSearchTerm(allPassesSearchTerm)}>
                                        <Search className="h-4 w-4 mr-1" />
                                        Search
                                    </Button>
                                </div>
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-black">Gate Pass #</TableHead>
                                                <TableHead className="text-black">Order #</TableHead>
                                                <TableHead className="text-black">Customer</TableHead>
                                                <TableHead className="text-black">Product</TableHead>
                                                <TableHead className="text-black">Delivery Type</TableHead>
                                                <TableHead className="text-black">Status</TableHead>
                                                <TableHead className="text-black">Issued</TableHead>
                                                <TableHead className="text-black">Verified</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAllGatePasses.map((gatePass) => {
                                                const deliveryType = (gatePass.deliveryType || gatePass.originalDeliveryType || 'N/A').toUpperCase();
                                                let deliveryTypeClass = 'px-2 py-1 rounded font-semibold border whitespace-nowrap ';
                                                if (deliveryType === 'PART LOAD') {
                                                    deliveryTypeClass += 'bg-blue-100 text-blue-800 border-blue-200';
                                                } else if (deliveryType === 'SELF') {
                                                    deliveryTypeClass += 'bg-green-100 text-green-800 border-green-200';
                                                } else {
                                                    deliveryTypeClass += 'bg-gray-100 text-gray-800 border-gray-200';
                                                }
                                                return (
                                                    <TableRow key={gatePass.gatePassId}>
                                                        <TableCell className="font-medium text-gray-800">GP-{gatePass.gatePassId}</TableCell>
                                                        <TableCell className="text-gray-800">{gatePass.orderNumber}</TableCell>
                                                        <TableCell className="text-gray-800">{gatePass.customerName}</TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <div className="text-gray-800">{gatePass.productName}</div>
                                                                <div className="text-sm text-gray-600">Qty: {gatePass.quantity}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className={deliveryTypeClass}>
                                                                {deliveryType}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-gray-800">{getStatusBadge(gatePass.status)}</TableCell>
                                                        <TableCell className="text-gray-800">{new Date(gatePass.issuedAt).toLocaleString()}</TableCell>
                                                        <TableCell className="text-gray-800">
                                                            {gatePass.verifiedAt
                                                                ? new Date(gatePass.verifiedAt).toLocaleString()
                                                                : '-'
                                                            }
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="gate-entry" className="space-y-4">
                        <GateEntryTab />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Verify Pickup Dialog */}
            <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Verify Customer Pickup
                        </DialogTitle>
                        <DialogDescription>
                            {selectedGatePass && (
                                <>Verify identity for {selectedGatePass.customerName} - Gate Pass #{selectedGatePass.gatePassId}</>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="verifyCustomerName">Customer Name Verification</Label>
                            <Input
                                id="verifyCustomerName"
                                value={verificationForm.customerName}
                                onChange={(e) => setVerificationForm(prev => ({ ...prev, customerName: e.target.value }))}
                                placeholder="Enter customer name for verification"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="verifyDriverName">Driver Name</Label>
                            <Input
                                id="verifyDriverName"
                                value={verificationForm.driverName}
                                onChange={(e) => setVerificationForm(prev => ({ ...prev, driverName: e.target.value }))}
                                placeholder="Enter driver name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="verifyVehicle">Vehicle Number</Label>
                            <Input
                                id="verifyVehicle"
                                value={verificationForm.vehicleNo}
                                onChange={(e) => setVerificationForm(prev => ({ ...prev, vehicleNo: e.target.value }))}
                                placeholder="Enter vehicle number"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="verifyNote">Note</Label>
                            <Input
                                id="verifyNote"
                                value={verificationForm.note}
                                onChange={(e) => setVerificationForm(prev => ({ ...prev, note: e.target.value }))}
                                placeholder="Add any notes about the driver or verification"
                            />
                        </div>

                        {selectedGatePass && (
                            <div className="space-y-2">
                                <div><strong>Expected Customer:</strong> {selectedGatePass.customerName}</div>
                                <div><strong>Product:</strong> {selectedGatePass.productName}</div>
                                <div><strong>Quantity:</strong> {selectedGatePass.quantity}</div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleVerifyPickup('send_in')}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={selectedGatePass?.status === 'entered_for_pickup' || selectedGatePass?.status === 'loaded' || selectedGatePass?.status === 'verified'}
                        >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify & Send In
                        </Button>
                        {selectedGatePass?.status !== 'ready' && (
                            <Button onClick={() => handleVerifyPickup('release')} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Verify & Release
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Pickup Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Reject Customer Pickup
                        </DialogTitle>
                        <DialogDescription>
                            {selectedGatePass && (
                                <>Reject pickup for {selectedGatePass.customerName} - Gate Pass #{selectedGatePass.gatePassId}</>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="rejectionReason">Reason for Rejection *</Label>
                            <Input
                                id="rejectionReason"
                                value={rejectionForm.rejectionReason}
                                onChange={(e) => setRejectionForm(prev => ({ ...prev, rejectionReason: e.target.value }))}
                                placeholder="e.g., Invalid ID, Wrong vehicle, Security concerns..."
                            />
                        </div>

                        {selectedGatePass && (
                            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm">
                                <div><strong>Customer:</strong> {selectedGatePass.customerName}</div>
                                <div><strong>Order:</strong> {selectedGatePass.orderNumber}</div>
                                <div><strong>Product:</strong> {selectedGatePass.productName}</div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectPickup}
                            disabled={!rejectionForm.rejectionReason.trim()}
                        >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject Pickup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Footer */}
            <div className="mt-12 bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="text-center text-gray-600">
                    <p className="font-medium">
                        © Security Management System
                    </p>
                    <p className="text-sm mt-1">
                        For technical support, contact IT Department
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WatchmanDepartment;
