
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


export function MyProfile() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>This section is unavailable as authentication has been removed.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">To re-enable profile management, authentication must be added back to the application.</p>
      </CardContent>
    </Card>
  )
}
