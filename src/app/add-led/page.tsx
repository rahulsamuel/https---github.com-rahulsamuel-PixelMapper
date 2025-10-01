
import { LedProductForm } from "@/components/admin/led-product-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AddLedPage() {
    return (
        <div className="container mx-auto max-w-3xl p-4 sm:p-6 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Add New LED Product</CardTitle>
                    <CardDescription>
                        Fill out the form below to add a new LED product to the database. 
                        This will make it available in the calculator dropdowns.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LedProductForm />
                </CardContent>
            </Card>
        </div>
    );
}
