import type { Screen } from "@/contexts/pixel-map-types";
import type { LedProduct } from "@/services/supabase";
import { getCloudProject, updateCloudProject } from "@/lib/cloud-projects";

export function getScreenProductId(screen: Screen): string | null {
  const sectionProductId = screen.sections.find((s) => s.productId && s.productId !== "custom")?.productId;
  if (sectionProductId) return sectionProductId;
  return screen.selectedProductId && screen.selectedProductId !== "custom" ? screen.selectedProductId : null;
}

export function getScreenSetupNotice(screen: Screen, productId: string | null): string | null {
  if (!productId) return "This screen has no LED product yet. Finish setting it up in the Pixel Map.";
  if (!(screen.dimensions.screenWidth > 0 && screen.dimensions.screenHeight > 0)) {
    return "This screen has no size yet. Finish setting it up in the Pixel Map.";
  }
  return null;
}

export function buildCalculatorTitle(projectName: string, screenName?: string | null): string {
  const project = projectName.trim();
  const screen = screenName?.trim();
  if (project && screen) return `${project} - ${screen}`;
  return project || "LED Calculator";
}

export async function saveScreenProductToProject(
  projectId: string,
  screenId: string,
  product: LedProduct | null
): Promise<{ success: boolean; error: string | null }> {
  const { data, error } = await getCloudProject(projectId);
  if (error) return { success: false, error };
  if (!data) return { success: false, error: "This project no longer exists." };

  const screenExists = data.projectData.screens.some((s) => s.id === screenId);
  if (!screenExists) return { success: false, error: "This screen no longer exists in the project." };

  const screens = data.projectData.screens.map((s) => {
    if (s.id !== screenId) return s;
    if (!product) return { ...s, selectedProductId: null };
    return {
      ...s,
      selectedProductId: product.id,
      sections: s.sections.map((section) => ({
        ...section,
        productId: product.id,
        tileWidthPx: product.tileWidthPx,
        tileHeightPx: product.tileHeightPx,
        tileWidthMm: product.tileWidthMm ?? 0,
        tileHeightMm: product.tileHeightMm ?? 0,
      })),
    };
  });
  return updateCloudProject(projectId, data.projectName, { ...data.projectData, screens });
}
