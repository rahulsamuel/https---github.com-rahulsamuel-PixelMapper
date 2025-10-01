
import { LedProductForm } from "@/components/admin/led-product-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
