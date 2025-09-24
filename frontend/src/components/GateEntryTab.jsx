






import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
    Shield,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Car,
    Search,
    AlertTriangle,
    FileText,
    BarChart3,
    RefreshCw,
    ArrowLeft,
    Users,
    Camera,
    CameraOff
} from 'lucide-react';

import { API_BASE } from '@/lib/api';

const GateEntryTab = () => {
    // Gate Entry states
    const [gateEntryUsers, setGateEntryUsers] = useState([]);
    const [gateEntryLogs, setGateEntryLogs] = useState([]);
    const [goingOutLogs, setGoingOutLogs] = useState([]);
    const [isRecognitionActive, setIsRecognitionActive] = useState(false);
    const [recognitionStatus, setRecognitionStatus] = useState('System Ready');
    const [showUserDialog, setShowUserDialog] = useState(false);
    const [showGoingOutDialog, setShowGoingOutDialog] = useState(false);
    const [showLogsDialog, setShowLogsDialog] = useState(false);
    const [showManualEntryDialog, setShowManualEntryDialog] = useState(false);
    const [showManualExitDialog, setShowManualExitDialog] = useState(false);
    const [userForm, setUserForm] = useState({
        name: '',
        phone: '',
        photo: null
    });
    const [goingOutForm, setGoingOutForm] = useState({
        reason: 'Office Work',
        details: ''
    });
    const [manualEntryForm, setManualEntryForm] = useState({
        phone: '',
        details: ''
    });
    const [manualExitForm, setManualExitForm] = useState({
        phone: '',
        details: ''
    });
    const [selectedUser, setSelectedUser] = useState(null);
    const { toast } = useToast();

    // Camera states
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const canvasRef = useRef(null);

    // Load initial data
    useEffect(() => {
        loadUsers();
        loadLogs();
    }, []);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const loadUsers = async () => {
        try {
            const response = await fetch(`${API_BASE}/gate-entry/users`);
            if (response.ok) {
                const users = await response.json();
                setGateEntryUsers(users);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const loadLogs = async () => {
        try {
            const [logsRes, goingOutRes] = await Promise.all([
                fetch(`${API_BASE}/gate-entry/logs`),
                fetch(`${API_BASE}/gate-entry/going-out-logs`)
            ]);

            if (logsRes.ok) {
                const logs = await logsRes.json();
                setGateEntryLogs(logs);
            }

            if (goingOutRes.ok) {
                const goingOutLogs = await goingOutRes.json();
                setGoingOutLogs(goingOutLogs);
            }
        } catch (error) {
            console.error('Error loading logs:', error);
        }
    };

    // Camera functions
    const startCamera = async () => {
        try {
            setCameraError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsCameraActive(true);
                toast({
                    title: "Camera Started",
                    description: "Camera feed is now active",
                });
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setCameraError('Failed to access camera. Please check permissions.');
            toast({
                title: "Camera Error",
                description: "Failed to access camera. Please check permissions.",
                variant: "destructive"
            });
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
        setCameraError(null);
    };

    // Capture photo from video feed
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return null;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.readyState !== 4) { // HAVE_ENOUGH_DATA
            return null;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png');
    };

    // Gate Entry Handlers
    const handleStartRecognition = async () => {
        await startCamera();
        setIsRecognitionActive(true);
        setRecognitionStatus('Recognition Active - Scanning...');
        toast({
            title: "Recognition Started",
            description: "Face recognition system is now active",
        });
    };

    const handleStopRecognition = () => {
        stopCamera();
        setIsRecognitionActive(false);
        setRecognitionStatus('System Ready');
        toast({
            title: "Recognition Stopped",
            description: "Face recognition system has been stopped",
        });
    };

    const handleManualEntry = () => {
        setShowManualEntryDialog(true);
    };

    const handleManualExit = () => {
        setShowManualExitDialog(true);
    };

    const handleEmergencyOverride = () => {
        toast({
            title: "Emergency Override",
            description: "Emergency override activated - all security checks bypassed",
            variant: "destructive"
        });
    };

    const handleGoingOut = () => {
        setShowGoingOutDialog(true);
    };

    const handleComingBack = async () => {
        if (!selectedUser) {
            toast({
                title: "Error",
                description: "Please select a user first",
                variant: "destructive"
            });
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/gate-entry/coming-back`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: selectedUser.phone
                }),
            });

            if (response.ok) {
                const result = await response.json();
                toast({
                    title: "Coming Back Recorded",
                    description: result.message,
                });
                loadLogs();
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.error || "Failed to record coming back",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error recording coming back:', error);
            toast({
                title: "Error",
                description: "Failed to record coming back",
                variant: "destructive"
            });
        }
    };

    const handleRegisterUser = () => {
        setShowUserDialog(true);
    };

    const handleViewUsers = () => {
        // Users are already loaded and displayed
        toast({
            title: "Users Loaded",
            description: `Found ${gateEntryUsers.length} registered users`,
        });
    };

    const handleDeleteUser = () => {
        if (!selectedUser) {
            toast({
                title: "Error",
                description: "Please select a user to delete",
                variant: "destructive"
            });
            return;
        }

        if (window.confirm(`Are you sure you want to delete user ${selectedUser.name}?`)) {
            // Implement delete user logic
            toast({
                title: "User Deleted",
                description: `${selectedUser.name} has been removed from the system`,
            });
        }
    };

    const handleGateLogs = () => {
        setShowLogsDialog(true);
    };

    const handleGoingOutLogs = () => {
        // Show going out logs
        toast({
            title: "Going Out Logs",
            description: `Found ${goingOutLogs.length} going out records`,
        });
    };

    const handleRegisterUserSubmit = async () => {
        if (!userForm.name.trim() || !userForm.phone.trim()) {
            toast({
                title: "Error",
                description: "Please fill in all fields",
                variant: "destructive"
            });
            return;
        }
        // On register click, open camera dialog and show capture button
        setShowUserDialog(false);
        setShowCameraDialog(true);
    };

    const [showCameraDialog, setShowCameraDialog] = useState(false);

    const handleCapturePhotoAndRegister = async () => {
        try {
            if (!isCameraActive) {
                await startCamera();
            }
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) {
                toast({
                    title: "Error",
                    description: "Camera or canvas element not found.",
                    variant: "destructive"
                });
                return;
            }
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const photoDataUrl = canvas.toDataURL('image/jpeg');

            if (!photoDataUrl) {
                toast({
                    title: "Error",
                    description: "Failed to capture photo. Please ensure camera is active.",
                    variant: "destructive"
                });
                return;
            }

            // Proceed with registration API call
            const response = await fetch(`${API_BASE}/gate-entry/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: userForm.name,
                    phone: userForm.phone,
                    photo: photoDataUrl
                }),
            });

            if (response.ok) {
                const result = await response.json();
                setShowCameraDialog(false);
                setUserForm({ name: '', phone: '', photo: null });
                loadUsers();
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.error || "Failed to register user",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: `Registration failed: ${error.message || error}`,
                variant: "destructive"
            });
        }
    };

    const handleStartCameraForRegistration = async () => {
        try {
            if (!isCameraActive) {
                await startCamera();
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to start camera for registration.",
                variant: "destructive"
            });
        }
    };

    const handleGoingOutSubmit = async () => {
        if (!selectedUser) {
            toast({
                title: "Error",
                description: "Please select a user",
                variant: "destructive"
            });
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/gate-entry/going-out`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: selectedUser.phone,
                    reason: goingOutForm.reason,
                    details: goingOutForm.details
                }),
            });

            if (response.ok) {
                const result = await response.json();
                toast({
                    title: "Going Out Recorded",
                    description: result.message,
                });
                setShowGoingOutDialog(false);
                setGoingOutForm({ reason: 'Office Work', details: '' });
                loadLogs();
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.error || "Failed to record going out",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error recording going out:', error);
            toast({
                title: "Error",
                description: "Failed to record going out",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Panel - Camera and Recognition */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="bg-white border border-gray-300 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-gray-800">
                                <Shield className="h-5 w-5" />
                                Live Camera Feed
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                                Camera for face recognition and manual verification
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
                                {isCameraActive ? (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                        <div className="text-center">
                                            <Car className="w-16 h-16 mx-auto mb-2" />
                                            <p className="text-lg font-medium">Camera Off</p>
                                            <p className="text-sm">Click "Start Recognition" to begin</p>
                                            {cameraError && (
                                                <p className="text-red-500 text-xs mt-2">{cameraError}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={handleStartRecognition}
                                    disabled={isRecognitionActive}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Start Recognition
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleStopRecognition}
                                    disabled={!isRecognitionActive}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Stop Recognition
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recognition Status */}
                    <Card className="bg-white border border-gray-300 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="text-center py-8">
                                <div className="text-2xl font-bold text-gray-800 mb-2">{recognitionStatus}</div>
                                <div className="text-gray-600">
                                    {isRecognitionActive ? 'Face recognition is active...' : 'Waiting for recognition to start...'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Users List */}
                    <Card className="bg-white border border-gray-300 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-gray-800">Registered Users ({gateEntryUsers.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {gateEntryUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className={`p-3 rounded-lg border cursor-pointer ${
                                            selectedUser?.id === user.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-medium text-gray-800">{user.name}</div>
                                                <div className="text-sm text-gray-600">{user.phone}</div>
                                            </div>
                                            <Badge className="bg-green-100 text-green-800 border border-green-300">
                                                Active
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {gateEntryUsers.length === 0 && (
                                    <p className="text-gray-600 text-center py-4">No users registered yet</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel - Controls */}
                <div className="space-y-4">
                    {/* Manual Entry/Exit */}
                    <Card className="bg-white border border-gray-300 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-gray-800">Manual Controls</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                onClick={handleManualEntry}
                            >
                                <User className="h-4 w-4 mr-2" />
                                Manual Entry
                            </Button>
                            <Button
                                className="w-full bg-orange-600 hover:bg-orange-700"
                                onClick={handleManualExit}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Manual Exit
                            </Button>
                            <Button
                                className="w-full bg-red-600 hover:bg-red-700"
                                onClick={handleEmergencyOverride}
                            >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Emergency Override
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Going Out Controls */}
                    <Card className="bg-white border border-gray-300 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-gray-800">Going Out</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                onClick={handleGoingOut}
                            >
                                <Users className="h-4 w-4 mr-2" />
                                Going Out
                            </Button>
                            <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                                onClick={handleComingBack}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Coming Back
                            </Button>
                        </CardContent>
                    </Card>

                    {/* User Management */}
                    <Card className="bg-white border border-gray-300 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-gray-800">User Management</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={handleRegisterUser}
                            >
                                <User className="h-4 w-4 mr-2" />
                                Register User
                            </Button>
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                onClick={handleViewUsers}
                            >
                                <Users className="h-4 w-4 mr-2" />
                                View Users
                            </Button>
                            <Button
                                className="w-full bg-red-600 hover:bg-red-700"
                                onClick={handleDeleteUser}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Delete User
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Logs */}
                    <Card className="bg-white border border-gray-300 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-gray-800">Reports & Logs</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                className="w-full bg-yellow-600 hover:bg-yellow-700"
                                onClick={handleGateLogs}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Gate Logs
                            </Button>
                            <Button
                                className="w-full bg-orange-600 hover:bg-orange-700"
                                onClick={handleGoingOutLogs}
                            >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Going Out Logs
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* User Registration Dialog */}
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-green-600" />
                            Register New User
                        </DialogTitle>
                    <DialogDescription>
                        Add a new user to the face recognition system. Make sure the camera is active to capture a photo.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="userName">Full Name *</Label>
                        <Input
                            id="userName"
                            value={userForm.name}
                            onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter full name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="userPhone">Phone Number *</Label>
                        <Input
                            id="userPhone"
                            type="number"
                            value={userForm.phone}
                            onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Enter phone number"
                        />
                    </div>

                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
                        {isCameraActive ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <CameraOff className="w-16 h-16 mx-auto mb-2" />
                                    <p className="text-lg font-medium">Camera Off</p>
                                    <p className="text-sm">Click "Start Camera" to begin</p>
                                    {cameraError && (
                                        <p className="text-red-500 text-xs mt-2">{cameraError}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {!isCameraActive && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <CameraOff className="h-4 w-4 inline mr-1" />
                                Camera is not active. Please start recognition first to capture a photo.
                            </p>
                        </div>
                    )}
                    {!isCameraActive && (
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                            onClick={handleStartCameraForRegistration}
                        >
                            Start Camera
                        </Button>
                    )}
                    {isCameraActive && (
                        <div className="space-y-2">
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <Camera className="h-4 w-4 inline mr-1" />
                                    Camera is active. Please capture a photo before registering.
                                </p>
                            </div>
                            <button
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                                onClick={handleCapturePhoto}
                            >
                                Capture Photo
                            </button>
                        </div>
                    )}
                </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRegisterUserSubmit}
                            disabled={!userForm.name.trim() || !userForm.phone.trim()}
                        >
                            <User className="h-4 w-4 mr-1" />
                            Register User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Going Out Dialog */}
            <Dialog open={showGoingOutDialog} onOpenChange={setShowGoingOutDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-purple-600" />
                            Going Out
                        </DialogTitle>
                        <DialogDescription>
                            Record going out activity for {selectedUser?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason</Label>
                            <Select
                                value={goingOutForm.reason}
                                onValueChange={(value) => setGoingOutForm(prev => ({ ...prev, reason: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Office Work">Office Work</SelectItem>
                                    <SelectItem value="Personal Work">Personal Work</SelectItem>
                                    <SelectItem value="Medical">Medical</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="details">Details</Label>
                            <Input
                                id="details"
                                value={goingOutForm.details}
                                onChange={(e) => setGoingOutForm(prev => ({ ...prev, details: e.target.value }))}
                                placeholder="Additional details (optional)"
                            />
                        </div>

                        {selectedUser && (
                            <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg text-sm">
                                <div><strong>User:</strong> {selectedUser.name}</div>
                                <div><strong>Phone:</strong> {selectedUser.phone}</div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowGoingOutDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleGoingOutSubmit}
                            disabled={!selectedUser}
                        >
                            <Users className="h-4 w-4 mr-1" />
                            Record Going Out
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Logs Dialog */}
            <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-yellow-600" />
                            Gate Entry Logs
                        </DialogTitle>
                        <DialogDescription>
                            Recent gate entry and exit activities
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-black">Name</TableHead>
                                    <TableHead className="text-black">Type</TableHead>
                                    <TableHead className="text-black">Timestamp</TableHead>
                                    <TableHead className="text-black">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {gateEntryLogs.slice(0, 20).map((log, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium text-gray-800">{log.name || 'Unknown'}</TableCell>
                                        <TableCell className="text-gray-800">{log.type || 'Entry'}</TableCell>
                                        <TableCell className="text-gray-800">
                                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-gray-800">
                                            <Badge className="bg-green-100 text-green-800 border border-green-300">
                                                Success
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {gateEntryLogs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-gray-600 py-4">
                                            No logs available
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLogsDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manual Entry Dialog */}
            <Dialog open={showManualEntryDialog} onOpenChange={setShowManualEntryDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-600" />
                            Manual Entry
                        </DialogTitle>
                        <DialogDescription>
                            Record manual gate entry for a user
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="manualEntryPhone">Phone Number *</Label>
                            <Input
                                id="manualEntryPhone"
                                name="manualEntryPhone"
                                type="text"
                                value={manualEntryForm.phone}
                                onChange={(e) => setManualEntryForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Enter phone number"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manualEntryDetails">Details</Label>
                            <Input
                                id="manualEntryDetails"
                                name="manualEntryDetails"
                                type="text"
                                value={manualEntryForm.details}
                                onChange={(e) => setManualEntryForm(prev => ({ ...prev, details: e.target.value }))}
                                placeholder="Enter details (optional)"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowManualEntryDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                if (!manualEntryForm.phone.trim()) {
                                    toast({
                                        title: "Error",
                                        description: "Phone number is required",
                                        variant: "destructive"
                                    });
                                    return;
                                }
                                try {
                                    const response = await fetch(`${API_BASE}/gate-entry/manual-entry`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            phone: manualEntryForm.phone,
                                            details: manualEntryForm.details
                                        }),
                                    });
                                    if (response.ok) {
                                        const result = await response.json();
                                        toast({
                                            title: "Success",
                                            description: result.message,
                                        });
                                        setShowManualEntryDialog(false);
                                        setManualEntryForm({ phone: '', details: '' });
                                        loadLogs();
                                    } else {
                                        const error = await response.json();
                                        toast({
                                            title: "Error",
                                            description: error.message || "Failed to record manual entry",
                                            variant: "destructive"
                                        });
                                    }
                                } catch (error) {
                                    toast({
                                        title: "Error",
                                        description: "Failed to record manual entry",
                                        variant: "destructive"
                                    });
                                }
                            }}
                        >
                            Record Entry
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manual Exit Dialog */}
            <Dialog open={showManualExitDialog} onOpenChange={setShowManualExitDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowLeft className="h-5 w-5 text-orange-600" />
                            Manual Exit
                        </DialogTitle>
                        <DialogDescription>
                            Record manual gate exit for a user
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="manualExitPhone">Phone Number *</Label>
                            <Input
                                id="manualExitPhone"
                                name="manualExitPhone"
                                type="text"
                                value={manualExitForm.phone}
                                onChange={(e) => setManualExitForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Enter phone number"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manualExitDetails">Details</Label>
                            <Input
                                id="manualExitDetails"
                                name="manualExitDetails"
                                type="text"
                                value={manualExitForm.details}
                                onChange={(e) => setManualExitForm(prev => ({ ...prev, details: e.target.value }))}
                                placeholder="Enter details (optional)"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowManualExitDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                if (!manualExitForm.phone.trim()) {
                                    toast({
                                        title: "Error",
                                        description: "Phone number is required",
                                        variant: "destructive"
                                    });
                                    return;
                                }
                                try {
                                    const response = await fetch(`${API_BASE}/gate-entry/manual-exit`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            phone: manualExitForm.phone,
                                            details: manualExitForm.details
                                        }),
                                    });
                                    if (response.ok) {
                                        const result = await response.json();
                                        toast({
                                            title: "Success",
                                            description: result.message,
                                        });
                                        setShowManualExitDialog(false);
                                        setManualExitForm({ phone: '', details: '' });
                                        loadLogs();
                                    } else {
                                        const error = await response.json();
                                        toast({
                                            title: "Error",
                                            description: error.message || "Failed to record manual exit",
                                            variant: "destructive"
                                        });
                                    }
                                } catch (error) {
                                    toast({
                                        title: "Error",
                                        description: "Failed to record manual exit",
                                        variant: "destructive"
                                    });
                                }
                            }}
                        >
                            Record Exit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GateEntryTab;
