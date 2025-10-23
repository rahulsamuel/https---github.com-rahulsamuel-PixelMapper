
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Server } from "lucide-react";

export default function RackDrawingPage() {
    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Rack Drawing</CardTitle>
                    <CardDescription>
                        Design and visualize your equipment racks.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                        <Server className="w-16 h-16 mb-4" />
                        <h3 className="text-xl font-semibold">Coming Soon!</h3>
                        <p className="max-w-md mt-2">
                            This section will allow you to create detailed rack drawings with your video and LED processing equipment.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
