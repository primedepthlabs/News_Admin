"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

function SettingsSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-5 w-96 mb-6" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <SettingsSkeleton />;

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-4 md:mb-6 text-sm md:text-base">
        Configure your application settings.
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            General Settings
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Manage your application preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Site Name</label>
            <Input type="text" placeholder="My Awesome Site" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" placeholder="admin@example.com" />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="notifications" />
            <label
              htmlFor="notifications"
              className="text-sm font-medium cursor-pointer"
            >
              Enable email notifications
            </label>
          </div>
          <Button className="cursor-pointer w-full sm:w-auto">
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
