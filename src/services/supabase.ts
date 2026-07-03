import { getSupabaseServerClient } from "@/lib/supabase/server";

export type LedProductData = {
  manufacturer: string;
  productName: string;
  tileWidthPx: number;
  tileHeightPx: number;
  wattsPerTile: number;
  // Extended spec fields
  pixelPitchMm?: number | null;
  tileWidthMm?: number | null;
  tileHeightMm?: number | null;
  tileDepthMm?: number | null;
  tileWeightKg?: number | null;
  maxPowerWPerSqm?: number | null;
  avgPowerWPerSqm?: number | null;
  maxBrightnessNit?: number | null;
  refreshRateHz?: number | null;
  grayscaleBit?: number | null;
  contrastRatio?: string | null;
  colorTemperatureK?: number | null;
  viewingAngleH?: number | null;
  viewingAngleV?: number | null;
  driveMode?: string | null;
  ledType?: string | null;
  ipRating?: string | null;
  certification?: string | null;
  applicationIndoor?: boolean;
  applicationOutdoor?: boolean;
  applicationFloor?: boolean;
  productImageUrl?: string | null;
  specSheetUrl?: string | null;
};

export type LedProduct = LedProductData & {
  id: string;
  createdBy: string | null;
  createdAt: string;
};

function mapRow(product: Record<string, unknown>): LedProduct {
  return {
    id: product.id as string,
    manufacturer: product.manufacturer as string,
    productName: product.product_name as string,
    tileWidthPx: product.tile_width_px as number,
    tileHeightPx: product.tile_height_px as number,
    wattsPerTile: product.watts_per_tile as number,
    pixelPitchMm: product.pixel_pitch_mm as number | null,
    tileWidthMm: product.tile_width_mm as number | null,
    tileHeightMm: product.tile_height_mm as number | null,
    tileDepthMm: product.tile_depth_mm as number | null,
    tileWeightKg: product.tile_weight_kg as number | null,
    maxPowerWPerSqm: product.max_power_w_per_sqm as number | null,
    avgPowerWPerSqm: product.avg_power_w_per_sqm as number | null,
    maxBrightnessNit: product.max_brightness_nit as number | null,
    refreshRateHz: product.refresh_rate_hz as number | null,
    grayscaleBit: product.grayscale_bit as number | null,
    contrastRatio: product.contrast_ratio as string | null,
    colorTemperatureK: product.color_temperature_k as number | null,
    viewingAngleH: product.viewing_angle_h as number | null,
    viewingAngleV: product.viewing_angle_v as number | null,
    driveMode: product.drive_mode as string | null,
    ledType: product.led_type as string | null,
    ipRating: product.ip_rating as string | null,
    certification: product.certification as string | null,
    applicationIndoor: (product.application_indoor as boolean) ?? false,
    applicationOutdoor: (product.application_outdoor as boolean) ?? false,
    applicationFloor: (product.application_floor as boolean) ?? false,
    productImageUrl: product.product_image_url as string | null,
    specSheetUrl: product.spec_sheet_url as string | null,
    createdBy: product.created_by as string | null,
    createdAt: product.created_at as string,
  };
}

export async function addLedProduct(data: LedProductData & { createdBy?: string }) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("led_products").insert({
      manufacturer: data.manufacturer,
      product_name: data.productName,
      tile_width_px: data.tileWidthPx,
      tile_height_px: data.tileHeightPx,
      watts_per_tile: data.wattsPerTile,
      pixel_pitch_mm: data.pixelPitchMm ?? null,
      tile_width_mm: data.tileWidthMm ?? null,
      tile_height_mm: data.tileHeightMm ?? null,
      tile_depth_mm: data.tileDepthMm ?? null,
      tile_weight_kg: data.tileWeightKg ?? null,
      max_power_w_per_sqm: data.maxPowerWPerSqm ?? null,
      avg_power_w_per_sqm: data.avgPowerWPerSqm ?? null,
      max_brightness_nit: data.maxBrightnessNit ?? null,
      refresh_rate_hz: data.refreshRateHz ?? null,
      grayscale_bit: data.grayscaleBit ?? null,
      contrast_ratio: data.contrastRatio ?? null,
      color_temperature_k: data.colorTemperatureK ?? null,
      viewing_angle_h: data.viewingAngleH ?? null,
      viewing_angle_v: data.viewingAngleV ?? null,
      drive_mode: data.driveMode ?? null,
      led_type: data.ledType ?? null,
      ip_rating: data.ipRating ?? null,
      certification: data.certification ?? null,
      application_indoor: data.applicationIndoor ?? false,
      application_outdoor: data.applicationOutdoor ?? false,
      application_floor: data.applicationFloor ?? false,
      product_image_url: data.productImageUrl ?? null,
      spec_sheet_url: data.specSheetUrl ?? null,
      created_by: user?.id ?? null,
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

    return { data: (data as Record<string, unknown>[]).map(mapRow), error: null };
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

    return { data: mapRow(data as Record<string, unknown>), error: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred";
    return { data: null, error };
  }
}

export async function updateLedProduct(id: string, data: LedProductData) {
  try {
    const supabase = getSupabaseServerClient();

    // Build update payload — only include fields that are explicitly provided (not undefined)
    // so partial updates don't overwrite existing spec data with nulls.
    const payload: Record<string, unknown> = {
      manufacturer: data.manufacturer,
      product_name: data.productName,
      tile_width_px: data.tileWidthPx,
      tile_height_px: data.tileHeightPx,
      watts_per_tile: data.wattsPerTile,
      updated_at: new Date().toISOString(),
    };
    if (data.pixelPitchMm !== undefined) payload['pixel_pitch_mm'] = data.pixelPitchMm ?? null;
    if (data.tileWidthMm !== undefined) payload['tile_width_mm'] = data.tileWidthMm ?? null;
    if (data.tileHeightMm !== undefined) payload['tile_height_mm'] = data.tileHeightMm ?? null;
    if (data.tileDepthMm !== undefined) payload['tile_depth_mm'] = data.tileDepthMm ?? null;
    if (data.tileWeightKg !== undefined) payload['tile_weight_kg'] = data.tileWeightKg ?? null;
    if (data.maxPowerWPerSqm !== undefined) payload['max_power_w_per_sqm'] = data.maxPowerWPerSqm ?? null;
    if (data.avgPowerWPerSqm !== undefined) payload['avg_power_w_per_sqm'] = data.avgPowerWPerSqm ?? null;
    if (data.maxBrightnessNit !== undefined) payload['max_brightness_nit'] = data.maxBrightnessNit ?? null;
    if (data.refreshRateHz !== undefined) payload['refresh_rate_hz'] = data.refreshRateHz ?? null;
    if (data.grayscaleBit !== undefined) payload['grayscale_bit'] = data.grayscaleBit ?? null;
    if (data.contrastRatio !== undefined) payload['contrast_ratio'] = data.contrastRatio ?? null;
    if (data.colorTemperatureK !== undefined) payload['color_temperature_k'] = data.colorTemperatureK ?? null;
    if (data.viewingAngleH !== undefined) payload['viewing_angle_h'] = data.viewingAngleH ?? null;
    if (data.viewingAngleV !== undefined) payload['viewing_angle_v'] = data.viewingAngleV ?? null;
    if (data.driveMode !== undefined) payload['drive_mode'] = data.driveMode ?? null;
    if (data.ledType !== undefined) payload['led_type'] = data.ledType ?? null;
    if (data.ipRating !== undefined) payload['ip_rating'] = data.ipRating ?? null;
    if (data.certification !== undefined) payload['certification'] = data.certification ?? null;
    if (data.applicationIndoor !== undefined) payload['application_indoor'] = data.applicationIndoor ?? false;
    if (data.applicationOutdoor !== undefined) payload['application_outdoor'] = data.applicationOutdoor ?? false;
    if (data.applicationFloor !== undefined) payload['application_floor'] = data.applicationFloor ?? false;
    if (data.productImageUrl !== undefined) payload['product_image_url'] = data.productImageUrl ?? null;
    if (data.specSheetUrl !== undefined) payload['spec_sheet_url'] = data.specSheetUrl ?? null;

    const { error } = await supabase
      .from("led_products")
      .update(payload)
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
  projectData: unknown;
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
      data: (data as Record<string, unknown>[]).map((project) => ({
        id: project.id as string,
        userId: project.user_id as string,
        projectName: project.project_name as string,
        projectData: project.project_data,
        createdAt: project.created_at as string,
        updatedAt: project.updated_at as string,
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
