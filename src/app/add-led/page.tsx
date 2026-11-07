
import { LedProductForm } from "@/components/admin/led-product-form";
import { ListingFeeGate } from "@/components/admin/listing-fee-gate";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AddLedPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
    const { checkout } = await searchParams;
    const returnedFromCheckout = checkout === "success" || checkout === "cancelled";

    return (
        <div className="container mx-auto max-w-3xl p-4 sm:p-6 md:p-8">
            {checkout === "success" && (
                <Alert className="mb-4">
                    <AlertTitle>Payment received</AlertTitle>
                    <AlertDescription>
                        Thank you. Your product is being saved and will appear under My Products shortly. Your receipt is available under Receipts.
                    </AlertDescription>
                </Alert>
            )}
            {checkout === "cancelled" && (
                <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Checkout cancelled</AlertTitle>
                    <AlertDescription>No payment was taken and no product was saved.</AlertDescription>
                </Alert>
            )}
            <Card>
                <CardHeader>
                    <CardTitle>Add New LED Product</CardTitle>
                    <CardDescription>
                        Pre-fills the form when a spec sheet or URL is parsed.
                        This will make it available in the calculator dropdowns.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ListingFeeGate skip={returnedFromCheckout}>
                        <LedProductForm />
                    </ListingFeeGate>
                </CardContent>
            </Card>
            <div className="mt-4">
              <Link href="/calculator">
                  <Button variant="outline" className="w-full">
                      <ArrowLeft className="mr-2" />
                      Back to LED Calculator
                  </Button>
              </Link>
          </div>
        </div>
    );
}
