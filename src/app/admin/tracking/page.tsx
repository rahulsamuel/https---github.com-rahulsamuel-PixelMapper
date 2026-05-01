
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default async function TrackingPage() {
    const events: any[] = [];
    const error = null;

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
                    {events.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12">
                            <p>No tracking events found.</p>
                            <p className="text-sm">Events will appear here as visitors interact with your site.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Event Type</TableHead>
                                    <TableHead>IP Address</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead>Thumbnail</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.map((event: any) => (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            {new Date(event.timestamp).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{event.type}</Badge>
                                        </TableCell>
                                        <TableCell className="font-mono">{event.ip}</TableCell>
                                        <TableCell>
                                            <pre className="text-xs bg-muted p-2 rounded-md font-mono">{JSON.stringify(event.data, (key, value) => key === 'thumbnail' ? '...' : value, 2)}</pre>
                                        </TableCell>
                                        <TableCell>
                                            {event.data.thumbnail && event.data.thumbnail.startsWith('data:image') ? (
                                                <Image 
                                                    src={event.data.thumbnail} 
                                                    alt="Download thumbnail" 
                                                    width={100} 
                                                    height={100}
                                                    className="object-contain border rounded-md bg-white"
                                                />
                                            ) : null}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
