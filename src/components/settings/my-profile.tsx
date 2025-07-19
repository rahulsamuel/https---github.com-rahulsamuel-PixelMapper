
'use client';

import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export function MyProfile() {
  const { user } = useAuth();
  
  if (!user) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>View and update your profile information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-32" />
            </CardContent>
        </Card>
    );
  }

  const getInitials = (email: string) => {
    return email?.[0]?.toUpperCase() ?? '?';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>View and update your profile information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
           <Avatar className="h-20 w-20">
            <AvatarImage src={user.picture} alt={user.email || 'User'} />
            <AvatarFallback>{getInitials(user.email || '')}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{user.name || "No name provided"}</h3>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" defaultValue={user.name || ''} />
        </div>
        <Button>Update Profile</Button>
      </CardContent>
    </Card>
  )
}
