
import { getData } from "@/services/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TrackingEvent {
    id: string;
    ip: string;
    timestamp: string;
    type: string;
    data: {
        [key: string]: any;
    };
}

function getBadgeVariant(eventType: string) {
    switch (eventType) {
        case 'download':
            return 'secondary';
        case 'project-import':
            return 'outline';
        default:
            return 'default';
    }
}

export default async function TrackingPage() {
    const { data: events, error } = await getData('tracking_events');

    if (error) {
        return (
            <div className="container mx-auto p-4 sm:p-6 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                        <CardDescription>Could not load tracking data.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-destructive">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const typedEvents = events as TrackingEvent[];

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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Event Type</TableHead>
                                <TableHead>IP Address</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {typedEvents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        No tracking events found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                typedEvents.map(event => (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            {new Date(event.timestamp).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getBadgeVariant(event.type)}>
                                                {event.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono">{event.ip}</TableCell>
                                        <TableCell>
                                            <pre className="text-xs bg-muted p-2 rounded-md">
                                                {JSON.stringify(event.data, null, 2)}
                                            </pre>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
