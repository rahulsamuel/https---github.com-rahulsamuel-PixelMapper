
'use server';

import { getData } from '@/services/firestore';

export interface LedProduct {
    id: string;
    manufacturer: string;
    productName: string;
    // Add other product properties as needed
}

export async function getLedProducts(): Promise<{ products: LedProduct[] | null; error: string | null; }> {
    const { data, error } = await getData('led_products');
    if (error) {
        return { products: null, error };
    }
    return { products: data as LedProduct[], error: null };
}
