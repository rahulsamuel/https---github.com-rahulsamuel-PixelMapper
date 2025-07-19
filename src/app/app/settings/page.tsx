
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, CreditCard, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { AccountSettings } from "@/app/app/account/page";
import { SubscriptionControls } from "@/components/pixel-mapper/subscription-controls";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

function MyProfile() {
  const { user } = useAuth();
  
  if (!user) {
    return null;
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

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-screen bg-muted/20">
        <header className="bg-background border-b p-4">
            <div className="container mx-auto flex items-center justify-between">
                <h1 className="text-2xl font-bold">Settings</h1>
                <Button asChild variant="outline">
                    <Link href="/app">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to App
                    </Link>
                </Button>
            </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
            <div className="container mx-auto max-w-4xl">
                 <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile">
                            <User className="mr-2 h-4 w-4" />
                            My Profile
                        </TabsTrigger>
                        <TabsTrigger value="account">
                            <SettingsIcon className="mr-2 h-4 w-4" />
                            Account
                        </TabsTrigger>
                        <TabsTrigger value="subscription">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Subscription
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile" className="mt-6">
                        <MyProfile />
                    </TabsContent>
                    <TabsContent value="account" className="mt-6">
                        <AccountSettings />
                    </TabsContent>
                    <TabsContent value="subscription" className="mt-6">
                        <SubscriptionControls />
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    </div>
  );
}
