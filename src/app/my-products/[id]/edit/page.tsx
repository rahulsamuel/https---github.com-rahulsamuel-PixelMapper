import { ProductEditLoader } from "@/components/admin/product-edit-loader";

export default async function MyProductEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="container mx-auto max-w-3xl p-4 sm:p-6 md:p-8">
            <ProductEditLoader productId={id} backHref="/my-products" backLabel="Back to My Products" />
        </div>
    );
}
