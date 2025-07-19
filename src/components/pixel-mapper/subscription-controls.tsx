
"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, Star } from "lucide-react";
import { Badge } from "../ui/badge";

export function SubscriptionControls() {
  const { user, subscriptionStatus, trialDaysRemaining } = useAuth();

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Checking your subscription status.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please wait...</p>
        </CardContent>
      </Card>
    );
  }

  const handleSubscribe = () => {
    // This would typically redirect to a checkout page (e.g., Stripe)
    alert("Redirecting to subscription page...");
  };

  return (
    <Card className="bg-muted/30">
        <CardHeader className="text-center">
            {subscriptionStatus === 'pro' && <Badge variant="secondary" className="absolute top-4 right-4"><Gem className="mr-1" />PRO</Badge>}
            <CardTitle>
                {subscriptionStatus === 'pro' ? 'You are a Pro!' : 'Upgrade to Pro'}
            </CardTitle>
            <CardDescription>
                {subscriptionStatus === 'pro' 
                    ? 'You have full access to all features.' 
                    : 'Unlock advanced features and remove watermarks.'}
            </CardDescription>
        </CardHeader>
        <CardContent>
            {subscriptionStatus === 'free' && (
                <div className="text-center space-y-4">
                    <p className="font-semibold text-lg">Your trial has expired.</p>
                    <Button onClick={handleSubscribe} className="w-full">
                        <Gem className="mr-2" />
                        Subscribe Now
                    </Button>
                </div>
            )}
            {subscriptionStatus === 'trial' && (
                <div className="text-center space-y-4">
                    <p className="font-semibold text-lg">{trialDaysRemaining} days left in your trial.</p>
                    <p className="text-sm text-muted-foreground">Subscribe now to continue enjoying Pro features after your trial ends.</p>
                    <Button onClick={handleSubscribe} className="w-full">
                        <Gem className="mr-2" />
                        Subscribe to Pro
                    </Button>
                </div>
            )}
            {subscriptionStatus === 'pro' && (
                <div className="text-center space-y-4">
                    <p>Thank you for being a Pro member!</p>
                </div>
            )}
             <div className="mt-6 text-left text-sm space-y-2">
                <p className="flex items-start gap-2"><Star className="text-primary mt-1 size-4 shrink-0" /> <strong>Pro Feature:</strong> Download raster map slices.</p>
                <p className="flex items-start gap-2"><Star className="text-primary mt-1 size-4 shrink-0" /> <strong>Pro Feature:</strong> Download full-resolution raster maps.</p>
                <p className="flex items-start gap-2"><Star className="text-primary mt-1 size-4 shrink-0" /> <strong>Pro Feature:</strong> No watermarks on any downloads.</p>
             </div>
        </CardContent>
    </Card>
  );
}
