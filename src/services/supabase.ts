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
  const num = (v: unknown): number | null => (v == null ? null : Number(v));
  return {
    id: product.id as string,
    manufacturer: product.manufacturer as string,
    productName: product.product_name as string,
    tileWidthPx: Number(product.tile_width_px),
    tileHeightPx: Number(product.tile_height_px),
    wattsPerTile: Number(product.watts_per_tile),
    pixelPitchMm: num(product.pixel_pitch_mm),
    tileWidthMm: num(product.tile_width_mm),
    tileHeightMm: num(product.tile_height_mm),
    tileDepthMm: num(product.tile_depth_mm),
    tileWeightKg: num(product.tile_weight_kg),
    maxPowerWPerSqm: num(product.max_power_w_per_sqm),
    avgPowerWPerSqm: num(product.avg_power_w_per_sqm),
    maxBrightnessNit: num(product.max_brightness_nit),
    refreshRateHz: num(product.refresh_rate_hz),
    grayscaleBit: num(product.grayscale_bit),
    contrastRatio: product.contrast_ratio as string | null,
    colorTemperatureK: num(product.color_temperature_k),
    viewingAngleH: num(product.viewing_angle_h),
    viewingAngleV: num(product.viewing_angle_v),
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
      created_by: data.createdBy ?? null,
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

// ──────────────────────────────────────────────
// Rack Equipment Library
// ──────────────────────────────────────────────

export type RackEquipmentType = 'processor' | 'power' | 'network' | 'utility' | 'media' | 'other';
export type MountableAt = 'front' | 'rear' | 'both';

export interface RackEquipmentData {
  name: string;
  model: string | null;
  ru: number;
  type: RackEquipmentType;
  color: string;
  wattage: number | null;
  mountableAt: MountableAt;
  isActive: boolean;
  frontImageUrl?: string | null;
  rearImageUrl?: string | null;
}

export interface RackEquipment extends RackEquipmentData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

function mapRackEquipmentRow(row: Record<string, unknown>): RackEquipment {
  return {
    id: row.id as string,
    name: row.name as string,
    model: row.model as string | null,
    ru: row.ru as number,
    type: row.type as RackEquipmentType,
    color: row.color as string,
    wattage: row.wattage as number | null,
    mountableAt: row.mountable_at as MountableAt,
    isActive: row.is_active as boolean,
    frontImageUrl: (row.front_image_url as string | null) ?? null,
    rearImageUrl: (row.rear_image_url as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getRackEquipmentLibrary(includeInactive = false) {
  try {
    const supabase = getSupabaseServerClient();
    let query = supabase.from('rack_equipment_library').select('*').order('type').order('name');
    if (!includeInactive) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data as Record<string, unknown>[]).map(mapRackEquipmentRow), error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function addRackEquipment(data: RackEquipmentData) {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('rack_equipment_library').insert({
      name: data.name,
      model: data.model ?? null,
      ru: data.ru,
      type: data.type,
      color: data.color,
      wattage: data.wattage ?? null,
      mountable_at: data.mountableAt,
      is_active: data.isActive,
      front_image_url: data.frontImageUrl ?? null,
      rear_image_url: data.rearImageUrl ?? null,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateRackEquipment(id: string, data: Partial<RackEquipmentData>) {
  try {
    const supabase = getSupabaseServerClient();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) payload.name = data.name;
    if (data.model !== undefined) payload.model = data.model ?? null;
    if (data.ru !== undefined) payload.ru = data.ru;
    if (data.type !== undefined) payload.type = data.type;
    if (data.color !== undefined) payload.color = data.color;
    if (data.wattage !== undefined) payload.wattage = data.wattage ?? null;
    if (data.mountableAt !== undefined) payload.mountable_at = data.mountableAt;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    if (data.frontImageUrl !== undefined) payload.front_image_url = data.frontImageUrl ?? null;
    if (data.rearImageUrl !== undefined) payload.rear_image_url = data.rearImageUrl ?? null;
    const { error } = await supabase.from('rack_equipment_library').update(payload).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function deleteRackEquipment(id: string) {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('rack_equipment_library').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

// ──────────────────────────────────────────────
// Processor Library
// ──────────────────────────────────────────────

export interface ProcessorData {
  manufacturer: string;
  modelName: string;
  totalPixelCapacity: number;
  outputPortCount: number;
  pixelsPerPort: number;
  baseRefreshRateHz: number;
  maxInputResolutionW: number | null;
  maxInputResolutionH: number | null;
  inputTypes: string | null;
  rackUnits: number;
  weightKg: number | null;
  powerWatts: number | null;
  powerInput: string | null;
  depthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  distributionPerPort: number;
  distributionUnitName: string | null;
  notes: string | null;
  specSheetUrl: string | null;
  productImageUrl: string | null;
  isActive: boolean;
}

export interface Processor extends ProcessorData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

function mapProcessorRow(row: Record<string, unknown>): Processor {
  return {
    id: row.id as string,
    manufacturer: row.manufacturer as string,
    modelName: row.model_name as string,
    totalPixelCapacity: Number(row.total_pixel_capacity),
    outputPortCount: Number(row.output_port_count),
    pixelsPerPort: Number(row.pixels_per_port),
    baseRefreshRateHz: Number(row.base_refresh_rate_hz),
    maxInputResolutionW: row.max_input_resolution_w != null ? Number(row.max_input_resolution_w) : null,
    maxInputResolutionH: row.max_input_resolution_h != null ? Number(row.max_input_resolution_h) : null,
    inputTypes: row.input_types as string | null,
    rackUnits: Number(row.rack_units),
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
    powerWatts: row.power_watts != null ? Number(row.power_watts) : null,
    powerInput: row.power_input as string | null,
    depthMm: row.depth_mm != null ? Number(row.depth_mm) : null,
    widthMm: row.width_mm != null ? Number(row.width_mm) : null,
    heightMm: row.height_mm != null ? Number(row.height_mm) : null,
    distributionPerPort: Number(row.distribution_per_port ?? 1),
    distributionUnitName: row.distribution_unit_name as string | null,
    notes: row.notes as string | null,
    specSheetUrl: row.spec_sheet_url as string | null,
    productImageUrl: row.product_image_url as string | null,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getProcessors(includeInactive = false) {
  try {
    const supabase = getSupabaseServerClient();
    let q = supabase.from('processor_library').select('*').order('manufacturer').order('model_name');
    if (!includeInactive) q = q.eq('is_active', true);
    const { data, error } = await q;
    if (error) return { data: [], error: error.message };
    return { data: (data as Record<string, unknown>[]).map(mapProcessorRow), error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getProcessorById(id: string) {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from('processor_library').select('*').eq('id', id).maybeSingle();
    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: 'Processor not found' };
    return { data: mapProcessorRow(data as Record<string, unknown>), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function addProcessor(data: ProcessorData) {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('processor_library').insert({
      manufacturer: data.manufacturer,
      model_name: data.modelName,
      total_pixel_capacity: data.totalPixelCapacity,
      output_port_count: data.outputPortCount,
      pixels_per_port: data.pixelsPerPort,
      base_refresh_rate_hz: data.baseRefreshRateHz,
      max_input_resolution_w: data.maxInputResolutionW ?? null,
      max_input_resolution_h: data.maxInputResolutionH ?? null,
      input_types: data.inputTypes ?? null,
      rack_units: data.rackUnits,
      weight_kg: data.weightKg ?? null,
      power_watts: data.powerWatts ?? null,
      power_input: data.powerInput ?? null,
      depth_mm: data.depthMm ?? null,
      width_mm: data.widthMm ?? null,
      height_mm: data.heightMm ?? null,
      notes: data.notes ?? null,
      spec_sheet_url: data.specSheetUrl ?? null,
      product_image_url: data.productImageUrl ?? null,
      distribution_per_port: data.distributionPerPort ?? 1,
      distribution_unit_name: data.distributionUnitName ?? null,
      is_active: data.isActive,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateProcessor(id: string, data: Partial<ProcessorData>) {
  try {
    const supabase = getSupabaseServerClient();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.manufacturer !== undefined) payload.manufacturer = data.manufacturer;
    if (data.modelName !== undefined) payload.model_name = data.modelName;
    if (data.totalPixelCapacity !== undefined) payload.total_pixel_capacity = data.totalPixelCapacity;
    if (data.outputPortCount !== undefined) payload.output_port_count = data.outputPortCount;
    if (data.pixelsPerPort !== undefined) payload.pixels_per_port = data.pixelsPerPort;
    if (data.baseRefreshRateHz !== undefined) payload.base_refresh_rate_hz = data.baseRefreshRateHz;
    if (data.maxInputResolutionW !== undefined) payload.max_input_resolution_w = data.maxInputResolutionW ?? null;
    if (data.maxInputResolutionH !== undefined) payload.max_input_resolution_h = data.maxInputResolutionH ?? null;
    if (data.inputTypes !== undefined) payload.input_types = data.inputTypes ?? null;
    if (data.rackUnits !== undefined) payload.rack_units = data.rackUnits;
    if (data.weightKg !== undefined) payload.weight_kg = data.weightKg ?? null;
    if (data.powerWatts !== undefined) payload.power_watts = data.powerWatts ?? null;
    if (data.powerInput !== undefined) payload.power_input = data.powerInput ?? null;
    if (data.depthMm !== undefined) payload.depth_mm = data.depthMm ?? null;
    if (data.widthMm !== undefined) payload.width_mm = data.widthMm ?? null;
    if (data.heightMm !== undefined) payload.height_mm = data.heightMm ?? null;
    if (data.notes !== undefined) payload.notes = data.notes ?? null;
    if (data.specSheetUrl !== undefined) payload.spec_sheet_url = data.specSheetUrl ?? null;
    if (data.productImageUrl !== undefined) payload.product_image_url = data.productImageUrl ?? null;
    if (data.distributionPerPort !== undefined) payload.distribution_per_port = data.distributionPerPort;
    if (data.distributionUnitName !== undefined) payload.distribution_unit_name = data.distributionUnitName ?? null;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    const { error } = await supabase.from('processor_library').update(payload).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function deleteProcessor(id: string) {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('processor_library').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
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
