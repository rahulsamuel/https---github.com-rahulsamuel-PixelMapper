
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default async function TrackingPage() {
    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Visitor Tracking</CardTitle>
                    <CardDescription>
                        A log of all tracked visitor events and downloads from the site.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Database Connection Error</AlertTitle>
                        <AlertDescription>
                            Could not connect to the Firestore database. The service account credentials in 
                            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold mx-1">
                                src/lib/firebase/service-account.ts
                            </code> 
                            could not be parsed. Please verify your credentials to re-enable tracking.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
}
