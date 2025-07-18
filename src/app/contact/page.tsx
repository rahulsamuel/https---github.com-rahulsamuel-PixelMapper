
'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LegalLayout from '../legal/layout';
import { Skeleton } from '@/components/ui/skeleton';

const ContactForm = dynamic(() => import('@/components/contact/contact-form').then(mod => mod.ContactForm), { 
  ssr: false,
  loading: () => <ContactFormSkeleton />,
});

export default function ContactPage() {
  return (
    <LegalLayout>
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Contact Us</CardTitle>
                    <CardDescription>
                        Have a question or feedback? Fill out the form below and we'll get back to you as soon as possible.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactForm />
                </CardContent>
            </Card>
        </div>
    </LegalLayout>
  );
}

function ContactFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}
