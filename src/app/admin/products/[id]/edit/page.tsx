
import { getDataById } from "@/services/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditProductForm } from "@/components/admin/edit-product-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditProductPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const { data: product, error } = await getDataById('led_products', id);

    if (error || !product) {
        return (
             <div className="container mx-auto max-w-3xl p-4 sm:p-6 md:p-8">
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {error || "Product not found."}
                    </AlertDescription>
                </Alert>
             </div>
        )
    }

    return (
        <div className="container mx-auto max-w-3xl p-4 sm:p-6 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Edit LED Product</CardTitle>
                    <CardDescription>
                        Update the details for &quot;{product.manufacturer} {product.productName}&quot; below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <EditProductForm product={product} />
                </CardContent>
            </Card>
            <div className="mt-4">
              <Link href="/admin/products">
                  <Button variant="outline" className="w-full">
                      <ArrowLeft className="mr-2" />
                      Back to Product List
                  </Button>
              </Link>
          </div>
        </div>
    );
}
