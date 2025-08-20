
'use client';

import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LegalLayout from '../legal/layout';

export default function LoginPage() {
  return (
    <LegalLayout>
        <div className="max-w-md mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Admin Login</CardTitle>
                    <CardDescription>
                        Please enter your credentials to access the admin area.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm />
                </CardContent>
            </Card>
        </div>
    </LegalLayout>
  );
}
