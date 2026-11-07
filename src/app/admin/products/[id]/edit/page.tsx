import { ProductEditLoader } from "@/components/admin/product-edit-loader";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="container mx-auto max-w-3xl p-4 sm:p-6 md:p-8">
            <ProductEditLoader productId={id} backHref="/admin/products" backLabel="Back to Product List" />
        </div>
    );
}
