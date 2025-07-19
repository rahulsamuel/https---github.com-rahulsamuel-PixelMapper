
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyProfile } from "@/components/settings/my-profile";
import { SubscriptionControls } from "@/components/pixel-mapper/subscription-controls";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "@/lib/auth/firebase";


const formSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

function AccountSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      toast({
        title: "Error",
        description: "You must be logged in to update your password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, data.currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, data.newPassword);
      
      toast({
        title: "Success!",
        description: "Your password has been updated successfully.",
      });
      form.reset();

    } catch (error: any) {
      console.error("Password update error:", error);
      toast({
        title: "Update Failed",
        description: error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential'
          ? "The current password you entered is incorrect."
          : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>Manage your account settings and set a new password here.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user?.email || ''} disabled />
            </div>
             <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


export default function SettingsTabs() {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="profile">My Profile</TabsTrigger>
        <TabsTrigger value="account">Account Settings</TabsTrigger>
        <TabsTrigger value="subscription">Manage Subscription</TabsTrigger>
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
  );
}
