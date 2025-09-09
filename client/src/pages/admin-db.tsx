"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type MediaDatabase = {
  id: string;
  name: string;
  uri: string;
  createdAt: string;
  logicalUsedMB?: string;
  allocatedMB?: string;
  maxMB?: number;
};

export default function AdminMediaDBPage() {
  const [mediaDbs, setMediaDbs] = useState<MediaDatabase[]>([]);
  const [newUri, setNewUri] = useState("");

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("adminToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchMediaDbs = async () => {
    const res = await fetch("/api/admin/media-dbs", {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      toast({
        title: "Error",
        description: error.message || "Failed to fetch media databases",
        variant: "destructive",
      });
      setMediaDbs([]);
      return;
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      setMediaDbs(data);
    } else {
      setMediaDbs([]);
    }
  };

  const addMediaDb = async () => {
    if (!newUri) {
      toast({
        title: "Error",
        description: "Please enter a URI.",
        variant: "destructive",
      });
      return;
    }

    const res = await fetch("/api/admin/media-dbs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ uri: newUri }),
    });

    if (res.ok) {
      toast({
        title: "Success",
        description: "Media DB added!",
      });
      setNewUri("");
      fetchMediaDbs();
    } else {
      const error = await res.json().catch(() => ({}));
      toast({
        title: "Error",
        description: error.error || "Failed to add Media DB.",
        variant: "destructive",
      });
    }
  };

  const deleteMediaDb = async (id: string) => {
    const res = await fetch(`/api/admin/media-dbs/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      toast({
        title: "Deleted",
        description: "Media DB deleted.",
      });
      fetchMediaDbs();
    } else {
      const error = await res.json().catch(() => ({}));
      toast({
        title: "Error",
        description: error.error || "Failed to delete Media DB.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMediaDbs();
  }, []);

  const maskUri = (uri: string): string => {
    try {
      const u = new URL(uri.replace("mongodb+srv://", "http://"));
      return u.hostname + (u.pathname !== "/" ? u.pathname : "");
    } catch {
      return "Invalid URI";
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Media Database Management</h1>
        <Button onClick={() => (window.location.href = "/admin")}>
          Go to Dashboard
        </Button>
      </div>

      <div className="space-y-2">
        <Input
          placeholder="MongoDB URI"
          value={newUri}
          onChange={(e) => setNewUri(e.target.value)}
        />
        <Button onClick={addMediaDb}>Add Media Database</Button>
      </div>

      <div>
        {mediaDbs.length === 0 ? (
          <p>No Media Databases configured.</p>
        ) : (
          <table className="table-auto w-full border">
            <thead>
              <tr>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">URI</th>
                <th className="border px-2 py-1">Storage Usage</th>
                <th className="border px-2 py-1">Created At</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mediaDbs.map((db) => {
                const hasFiles =
                  !!db.logicalUsedMB && parseFloat(db.logicalUsedMB) > 0;
                const usagePercent =
                  db.logicalUsedMB && db.maxMB
                    ? Math.min(
                        (parseFloat(db.logicalUsedMB) / db.maxMB) * 100,
                        100
                      )
                    : 0;
                return (
                  <tr key={db.id}>
                    <td className="border px-2 py-1">{db.name}</td>
                    <td className="border px-2 py-1 truncate max-w-xs">
                      {maskUri(db.uri)}
                    </td>
                    <td className="border px-2 py-1">
                      {db.logicalUsedMB ? (
                        <div className="space-y-1">
                          <div>
                            {db.logicalUsedMB} MB used / 512 MB total
                          </div>
                          <Progress value={usagePercent} className="h-2" />
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="border px-2 py-1">
                      {new Date(db.createdAt).toLocaleString()}
                    </td>
                    <td className="border px-2 py-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteMediaDb(db.id)}
                              disabled={hasFiles}
                            >
                              Delete
                            </Button>
                          </TooltipTrigger>
                          {hasFiles && (
                            <TooltipContent>
                              Cannot delete non-empty DB
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}