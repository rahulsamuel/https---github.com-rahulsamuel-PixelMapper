
import { getData } from "@/services/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { deleteProduct } from "./actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from "next/link";

export default async function ProductsPage() {
    const { data: products, error } = await getData('led_products');

    if (error) {
        return <div>Error loading products: {error}</div>
    }

    const DeleteButton = ({ productId }: { productId: string }) => {
        const deleteProductWithId = deleteProduct.bind(null, productId);
        return (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Trash className="text-destructive" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <form action={deleteProductWithId}>
                            <AlertDialogAction type="submit">
                                Continue
                            </AlertDialogAction>
                        </form>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Manage LED Products</CardTitle>
                    <CardDescription>
                        View, edit, or delete the products in your database.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Manufacturer</TableHead>
                                <TableHead>Product Name</TableHead>
                                <TableHead>Dimensions (px)</TableHead>
                                <TableHead>Dimensions (mm)</TableHead>
                                <TableHead>Weight (kg)</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product: any) => (
                                <TableRow key={product.id}>
                                    <TableCell>{product.manufacturer}</TableCell>
                                    <TableCell>{product.productName}</TableCell>
                                    <TableCell>{`${product.tileWidthPx}x${product.tileHeightPx}`}</TableCell>
                                    <TableCell>{`${product.tileWidthMm}x${product.tileHeightMm}`}</TableCell>
                                    <TableCell>{product.tileWeightKg}</TableCell>
                                    <TableCell className="flex gap-2">
                                        <Link href={`/admin/products/${product.id}/edit`}>
                                            <Button variant="ghost" size="icon">
                                                <Pencil />
                                            </Button>
                                        </Link>
                                        <DeleteButton productId={product.id} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
