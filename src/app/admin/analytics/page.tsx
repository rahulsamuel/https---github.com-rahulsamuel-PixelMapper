
import { getData } from '@/services/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export const revalidate = 10; // Revalidate data every 10 seconds

async function AnalyticsPage() {
  const { data, error } = await getData('tracking_events');

  if (error) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>Could not load analytics data.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">There was an issue fetching data from the database. Please check the server logs.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>App Analytics</CardTitle>
        <CardDescription>
          A log of user events and downloads within the application. Data is refreshed automatically.
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
            {data.length > 0 ? (
              data.map((event: any) => (
                <TableRow key={event.id}>
                  <TableCell className="font-mono text-xs">{new Date(event.timestamp).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={event.type === 'download' ? 'secondary' : 'outline'}>{event.type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">{event.ip}</TableCell>
                  <TableCell>
                    <pre className="text-xs bg-muted/50 p-2 rounded-md">{JSON.stringify(event.data, null, 2)}</pre>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  No tracking data yet. Perform some downloads in the app to see events here.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default AnalyticsPage;
