"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function addLedProduct(data: {
  manufacturer: string;
  productName: string;
  tileWidthPx: number;
  tileHeightPx: number;
  wattsPerTile: number;
  createdBy: string;
}) {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("led_products").insert({
      manufacturer: data.manufacturer,
      product_name: data.productName,
      tile_width_px: data.tileWidthPx,
      tile_height_px: data.tileHeightPx,
      watts_per_tile: data.wattsPerTile,
      created_by: data.createdBy,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred";
    return { success: false, error };
  }
}

export async function getLedProducts() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("led_products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return {
      data: data.map((product) => ({
        id: product.id,
        manufacturer: product.manufacturer,
        productName: product.product_name,
        tileWidthPx: product.tile_width_px,
        tileHeightPx: product.tile_height_px,
        wattsPerTile: product.watts_per_tile,
        createdBy: product.created_by,
        createdAt: product.created_at,
      })),
      error: null,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred";
    return { data: [], error };
  }
}

export async function getLedProductById(id: string) {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("led_products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: "Product not found" };
    }

    return {
      data: {
        id: data.id,
        manufacturer: data.manufacturer,
        productName: data.product_name,
        tileWidthPx: data.tile_width_px,
        tileHeightPx: data.tile_height_px,
        wattsPerTile: data.watts_per_tile,
        createdBy: data.created_by,
        createdAt: data.created_at,
      },
      error: null,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred";
    return { data: null, error };
  }
}

export async function updateLedProduct(
  id: string,
  data: {
    manufacturer: string;
    productName: string;
    tileWidthPx: number;
    tileHeightPx: number;
    wattsPerTile: number;
  }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("led_products")
      .update({
        manufacturer: data.manufacturer,
        product_name: data.productName,
        tile_width_px: data.tileWidthPx,
        tile_height_px: data.tileHeightPx,
        watts_per_tile: data.wattsPerTile,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred";
    return { success: false, error };
  }
}

export async function deleteLedProduct(id: string) {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("led_products").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred";
    return { success: false, error };
  }
}

export async function savePixelMapProject(data: {
  userId: string;
  projectName: string;
  projectData: any;
  projectId?: string;
}) {
  try {
    const supabase = getSupabaseServerClient();

    if (data.projectId) {
      const { error } = await supabase
        .from("pixel_map_projects")
        .update({
          project_name: data.projectName,
          project_data: data.projectData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.projectId);

      if (error) {
        return { success: false, error: error.message, projectId: null };
      }

      return { success: true, projectId: data.projectId };
    } else {
      const { data: newProject, error } = await supabase
        .from("pixel_map_projects")
        .insert({
          user_id: data.userId,
          project_name: data.projectName,
          project_data: data.projectData,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message, projectId: null };
      }

      return { success: true, projectId: newProject.id };
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred";
    return { success: false, error, projectId: null };
  }
}

export async function getUserPixelMapProjects(userId: string) {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("pixel_map_projects")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return {
      data: data.map((project) => ({
        id: project.id,
        userId: project.user_id,
        projectName: project.project_name,
        projectData: project.project_data,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      })),
      error: null,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred";
    return { data: [], error };
  }
}

export async function submitContactMessage(data: {
  name: string;
  email: string;
  message: string;
}) {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      message: data.message,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred";
    return { success: false, error };
  }
}
