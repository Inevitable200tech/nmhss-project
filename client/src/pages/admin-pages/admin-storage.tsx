'use client';

import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, AlertTriangle, AlertCircle, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSound } from "@/hooks/use-sound";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface StorageStats {
  bucket: {
    used: number;
    total: number;
    usagePercent: number;
    objectCount: number;
    itemCount: {
      images: number;
      videos: number;
    };
    breakdown: {
      galleryImages: number;
      galleryVideos: number;
      studentMedia: number;
    };
  };
  database: {
    used: number;
    total: number;
    usagePercent: number;
    name: string;
    itemCount: {
      galleryImages: number;
      galleryVideos: number;
      studentMedia: number;
      totalDocuments: number;
    };
  };
  warning: string | null;
  critical: string | null;
}

export default function AdminStoragePage() {
  const { toast } = useToast();
  const { playHoverSound, playErrorSound, playSuccessSound } = useSound();
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");

  useEffect(() => {
    if (!token) return;
    fetchStorageStats();
  }, [token]);

  const fetchStorageStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/storage-stats", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-requested-with": "SchoolConnect-App",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch storage stats");
      }

      const data = await res.json();
      setStorageStats(data);
      playSuccessSound();
    } catch (err) {
      console.error(err);
      playErrorSound();
      toast({
        title: "Error",
        description: "Failed to fetch storage statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStorageColor = (percent: number) => {
    if (percent >= 95) return "bg-red-600";
    if (percent >= 80) return "bg-orange-500";
    if (percent >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStorageTextColor = (percent: number) => {
    if (percent >= 95) return "text-red-600";
    if (percent >= 80) return "text-orange-500";
    if (percent >= 50) return "text-yellow-500";
    return "text-green-500";
  };

  const formatBytes = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Unauthorized access</p>
      </div>
    );
  }

return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (window.location.href = "/admin")}
              onMouseEnter={playHoverSound}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-4xl font-extrabold text-white">Storage Analytics</h1>
          </div>
          <Button
            onClick={fetchStorageStats}
            disabled={isLoading}
            onMouseEnter={playHoverSound}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Alerts */}
        {storageStats?.critical && (
          <Alert className="mb-6 border-red-600 bg-red-900/20">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-600 font-semibold">
              {storageStats.critical} - Please take immediate action to free up storage.
            </AlertDescription>
          </Alert>
        )}

        {storageStats?.warning && !storageStats.critical && (
          <Alert className="mb-6 border-orange-600 bg-orange-900/20">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-600 font-semibold">
              {storageStats.warning} - Consider optimizing or archiving old content.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-96">
            <div className="relative w-16 h-16 mb-4">
              <Loader2 className="w-16 h-16 text-cyan-500 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Loading Storage Information</h3>
            <p className="text-gray-400">Fetching real-time data from R2 bucket and MongoDB...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Bucket Storage */}
              <Card className="bg-gray-800 border-gray-700 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 border-b border-gray-700">
                  <CardTitle className="text-xl text-blue-300 flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Bucket Storage (R2)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-300 font-semibold">Storage Usage</span>
                        <span className={`text-2xl font-bold ${getStorageTextColor(storageStats?.bucket.usagePercent ?? 0)}`}>
                          {storageStats?.bucket.usagePercent.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={storageStats?.bucket.usagePercent ?? 0}
                        className="h-4 bg-gray-700"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>{formatBytes(storageStats?.bucket.used ?? 0)}</span>
                        <span>of {formatBytes(storageStats?.bucket.total ?? 0)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm font-medium mb-1">Total Objects</div>
                        <div className="text-2xl font-bold text-blue-400">
                          {storageStats?.bucket.objectCount ?? 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {(storageStats?.bucket.itemCount.images ?? 0) + (storageStats?.bucket.itemCount.videos ?? 0)} media items
                        </div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm font-medium mb-1">Images</div>
                        <div className="text-2xl font-bold text-blue-400">
                          {storageStats?.bucket.itemCount.images ?? 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Videos: {storageStats?.bucket.itemCount.videos ?? 0}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-700 pt-4 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Gallery Images</span>
                        <span className="text-gray-200 font-semibold">
                          {storageStats?.bucket.breakdown.galleryImages ?? 0} files
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Gallery Videos</span>
                        <span className="text-gray-200 font-semibold">
                          {storageStats?.bucket.breakdown.galleryVideos ?? 0} files
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Student Media</span>
                        <span className="text-gray-200 font-semibold">
                          {storageStats?.bucket.breakdown.studentMedia ?? 0} files
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Database Storage */}
              <Card className="bg-gray-800 border-gray-700 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 border-b border-gray-700">
                  <CardTitle className="text-xl text-purple-300 flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    Database Storage
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-300 font-semibold">Storage Usage</span>
                        <span className={`text-2xl font-bold ${getStorageTextColor(storageStats?.database.usagePercent ?? 0)}`}>
                          {storageStats?.database.usagePercent.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={storageStats?.database.usagePercent ?? 0}
                        className="h-4 bg-gray-700"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>{formatBytes(storageStats?.database.used ?? 0)}</span>
                        <span>of {formatBytes(storageStats?.database.total ?? 0)}</span>
                      </div>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="text-gray-400 text-sm font-medium mb-2">Database Name</div>
                      <div className="text-white font-mono text-sm">{storageStats?.database.name || 'N/A'}</div>
                    </div>

                    <div className="border-t border-gray-700 pt-4 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Total Documents</span>
                        <span className="text-gray-200 font-semibold">
                          {storageStats?.database.itemCount.totalDocuments ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Gallery Images</span>
                        <span className="text-gray-200 font-semibold">
                          {storageStats?.database.itemCount.galleryImages ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Gallery Videos</span>
                        <span className="text-gray-200 font-semibold">
                          {storageStats?.database.itemCount.galleryVideos ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Student Media</span>
                        <span className="text-gray-200 font-semibold">
                          {storageStats?.database.itemCount.studentMedia ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Health Summary */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="border-b border-gray-700">
                <CardTitle className="text-lg text-cyan-300">Storage Health</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center">
                    <div className={`mb-3 flex items-center justify-center w-16 h-16 rounded-full border-2 ${
                      storageStats?.critical ? "bg-red-900/30 border-red-600" : "bg-green-900/30 border-green-600"
                    }`}>
                      {storageStats?.critical ? <AlertCircle className="w-8 h-8 text-red-500" /> : <Check className="w-8 h-8 text-green-500" />}
                    </div>
                    <h3 className="text-center font-semibold text-white">Overall Status</h3>
                    <p className="text-center text-sm text-gray-400 mt-2">
                      {storageStats?.critical ? "Critical" : storageStats?.warning ? "Warning" : "Healthy"}
                    </p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={`mb-3 w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                      (storageStats?.bucket.usagePercent ?? 0) >= 80 ? "bg-red-900/30 border-red-600" : "bg-green-900/30 border-green-600"
                    }`}>
                      <span className={`text-2xl font-bold ${ (storageStats?.bucket.usagePercent ?? 0) >= 80 ? "text-red-500" : "text-green-500" }`}>
                        {storageStats?.bucket.usagePercent.toFixed(0)}%
                      </span>
                    </div>
                    <h3 className="text-center font-semibold text-white">Bucket Health</h3>
                    <p className="text-center text-xs text-gray-400 mt-2">R2 Storage</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={`mb-3 w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                      (storageStats?.database.usagePercent ?? 0) >= 80 ? "bg-red-900/30 border-red-600" : "bg-green-900/30 border-green-600"
                    }`}>
                      <span className={`text-2xl font-bold ${ (storageStats?.database.usagePercent ?? 0) >= 80 ? "text-red-500" : "text-green-500" }`}>
                        {storageStats?.database.usagePercent.toFixed(0)}%
                      </span>
                    </div>
                    <h3 className="text-center font-semibold text-white">Database Health</h3>
                    <p className="text-center text-xs text-gray-400 mt-2">MongoDB Storage</p>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-gray-700/30 rounded-lg border border-gray-700">
                  <h4 className="font-semibold text-gray-300 mb-2">📋 Recommendations</h4>
                  <ul className="text-sm text-gray-400 space-y-2">
                    <li>• Regularly monitor storage usage to avoid hitting limits</li>
                    <li>• Archive old gallery images and videos periodically</li>
                    <li>• Remove duplicate student media uploads</li>
                    <li>• Consider increasing storage limits if approaching capacity</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};