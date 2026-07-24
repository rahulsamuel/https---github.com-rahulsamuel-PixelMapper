import { getLedProducts } from "@/services/supabase";
import { LedProductAdmin } from "@/components/admin/led-product-admin";

export default async function ProductsPage() {
  const { data: products, error } = await getLedProducts();

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-destructive">Error loading products: {error}</p>
      </div>
    );
  }

  return <LedProductAdmin products={products} />;
}
