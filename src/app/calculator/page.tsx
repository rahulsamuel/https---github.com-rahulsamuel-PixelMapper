
'use client';

import dynamic from 'next/dynamic';
import { computeLedPower } from '@/lib/led-power';
import { useState, useMemo, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calculator, Spline } from 'lucide-react';
import { loadLedProducts } from '@/lib/led-products-client';
import { useSavedPixelMapSelection } from '@/hooks/use-saved-pixel-map-selection';
import type { Screen } from '@/contexts/pixel-map-types';
import type { CloudProject } from '@/lib/cloud-projects';
import { buildCalculatorTitle, getScreenProductId, getScreenSetupNotice, saveScreenProductToProject } from '@/lib/calculator-screens';
import { SavedProjectPicker } from '@/components/calculator/saved-project-picker';
import { usePersistentState } from '@/hooks/use-persistent-state';
import {
  CurvingSettings,
  CurvingPreview,
  DEFAULT_CURVING_STATE,
  type CurvingState,
} from '@/components/calculator/curving-calculator';

const CalculatorForm = dynamic(() => import('@/components/calculator/calculator-form').then(mod => mod.CalculatorForm), {
  ssr: false,
  loading: () => <CalculatorFormSkeleton />,
});

const ResultsDisplay = dynamic(() => import('@/components/calculator/results-display').then(mod => mod.ResultsDisplay), {
  ssr: false,
  loading: () => <ResultsDisplaySkeleton />,
});

import type { LedProduct } from '@/services/supabase';

interface FormState {
    projectName: string;
    selectedProductId: string | null;
    voltage: '110v' | '208v' | '230v';
    phase: 'single-phase' | 'three-phase';
    screenWidthTiles: number;
    screenHeightTiles: number;
}

interface CalculatedResults {
    resolution: { width: number; height: number };
    totalPixels: number;
    aspectRatio: string;
    dimensionsMm: { width: number; height: number };
    dimensionsIn: { width: number; height: number };
    totalWeightKg: number;
    totalWeightLbs: number;
    powerPerM2: { max: number; avg: number };
    totalPower: { max: number; avg: number };
    currentDraw: { max: number; avg: number; label: string };
    totalTiles: number;
}

function greatestCommonDivisor(a: number, b: number): number {
    return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

export default function CalculatorPage() {
    const [products, setProducts] = useState<LedProduct[]>([]);
    const [activeTab, setActiveTab] = useState<string>('results');
    const [formState, setFormState] = usePersistentState<FormState>('calculator:formState', {
        projectName: "My LED Project",
        selectedProductId: null,
        voltage: '208v',
        phase: 'three-phase',
        screenWidthTiles: 8,
        screenHeightTiles: 5,
    });
    const [curvingState, setCurvingState] = useState<CurvingState>(DEFAULT_CURVING_STATE);

    const { signedIn, summaries, listLoading, listError, activeProject, projectError, activeScreenId, selectProject, selectScreen, refreshActiveProject } = useSavedPixelMapSelection();
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const activeScreen = activeProject?.projectData.screens.find(s => s.id === activeScreenId) ?? null;
    const savedProductId = activeScreen ? getScreenProductId(activeScreen) : null;

    const applyScreen = (project: CloudProject, screen: Screen) => {
        selectScreen(screen.id);
        setSaveError(null);
        setFormState(prev => ({
            ...prev,
            projectName: project.projectName,
            selectedProductId: getScreenProductId(screen),
            screenWidthTiles: screen.dimensions.screenWidth,
            screenHeightTiles: screen.dimensions.screenHeight,
        }));
        setActiveTab('results');
    };

    const handleSelectProject = async (projectId: string | null) => {
        setSaveError(null);
        const project = await selectProject(projectId);
        const firstScreen = project?.projectData.screens[0];
        if (project && firstScreen) applyScreen(project, firstScreen);
    };

    const handleSelectScreen = (screenId: string) => {
        const screen = activeProject?.projectData.screens.find(s => s.id === screenId);
        if (activeProject && screen) applyScreen(activeProject, screen);
    };

    const handleSaveScreen = async () => {
        if (!activeProject || !activeScreen) return;
        if (formState.selectedProductId && !selectedProduct) {
            setSaveError('LED products are still loading. Try again in a moment.');
            return;
        }
        setSaving(true);
        setSaveError(null);
        const { success, error } = await saveScreenProductToProject(activeProject.id, activeScreen.id, selectedProduct);
        setSaving(false);
        if (!success) {
            setSaveError(error ?? 'Could not save to the Pixel Map project.');
            return;
        }
        await refreshActiveProject();
    };

    useEffect(() => {
        if (!activeProject || !activeScreen) return;
        setFormState(prev => ({
            ...prev,
            projectName: activeProject.projectName,
            selectedProductId: savedProductId ?? prev.selectedProductId,
            screenWidthTiles: activeScreen.dimensions.screenWidth,
            screenHeightTiles: activeScreen.dimensions.screenHeight,
        }));
    }, [activeProject, activeScreenId]);

    useEffect(() => {
        loadLedProducts().then(({ data, error }) => {
            if (error) {
                console.error("Failed to fetch LED products:", error);
                return;
            }
            setProducts(data);
            if (data.length > 0 && !formState.selectedProductId) {
                handleFormChange('selectedProductId', data[0].id);
            }
        });
    }, []);

    const selectedProduct = useMemo(() => {
        if (!formState.selectedProductId) return null;
        return products.find(p => p.id === formState.selectedProductId) ?? null;
    }, [formState.selectedProductId, products]);

    const screenNotice = activeScreen ? getScreenSetupNotice(activeScreen, formState.selectedProductId) : null;
    const hasUnsavedChanges = activeScreen !== null && formState.selectedProductId !== savedProductId;
    const reportTitle = buildCalculatorTitle(formState.projectName, activeScreen?.name);

    const results = useMemo<CalculatedResults | null>(() => {
        if (!selectedProduct || screenNotice) return null;

        const { screenWidthTiles, screenHeightTiles, voltage, phase } = formState;

        const resWidth = screenWidthTiles * selectedProduct.tileWidthPx;
        const resHeight = screenHeightTiles * selectedProduct.tileHeightPx;
        const totalPixels = resWidth * resHeight;
        const gcd = greatestCommonDivisor(resWidth, resHeight);
        const aspectX = resWidth / gcd;
        const aspectY = resHeight / gcd;
        const aspectRatio = `${aspectX}:${aspectY} (${(aspectX / aspectY).toFixed(2)}:1)`;
        const totalTiles = screenWidthTiles * screenHeightTiles;

        const widthMm = screenWidthTiles * (selectedProduct.tileWidthMm ?? 0);
        const heightMm = screenHeightTiles * (selectedProduct.tileHeightMm ?? 0);
        const widthIn = widthMm / 25.4;
        const heightIn = heightMm / 25.4;

        const totalWeightKg = totalTiles * (selectedProduct.tileWeightKg ?? 0);
        const totalWeightLbs = totalWeightKg * 2.20462;

        const vNum = parseInt(voltage.replace('v', ''));
        const power = computeLedPower({
            wattsPerTile: selectedProduct.wattsPerTile ?? 0,
            avgWattsPerTile: selectedProduct.avgWattsPerTile ?? null,
            avgPowerWPerSqm: selectedProduct.avgPowerWPerSqm ?? null,
            tileWidthMm: selectedProduct.tileWidthMm ?? 0,
            tileHeightMm: selectedProduct.tileHeightMm ?? 0,
            totalTiles,
            volts: vNum,
            threePhase: phase === 'three-phase',
        });

        const phaseText = phase === 'three-phase' ? 'Three Phase' : 'Single Phase';
        const currentDrawLabel = `Current Draw @ ${vNum}V (${phaseText})`;

        return {
            resolution: { width: resWidth, height: resHeight },
            totalPixels,
            aspectRatio,
            dimensionsMm: { width: widthMm, height: heightMm },
            dimensionsIn: { width: widthIn, height: heightIn },
            totalWeightKg,
            totalWeightLbs,
            powerPerM2: { max: power.maxPerM2, avg: power.avgPerM2 },
            totalPower: { max: power.totalMaxW, avg: power.totalAvgW },
            currentDraw: { max: power.maxAmps, avg: power.avgAmps, label: currentDrawLabel },
            totalTiles,
        };
    }, [formState, selectedProduct, screenNotice]);

    const handleFormChange = (field: keyof FormState, value: any) => {
        setFormState(prevState => {
            const next = { ...prevState, [field]: value };
            if (field === 'voltage' && value === '110v') {
                next.phase = 'single-phase';
            }
            return next;
        });
    };

    const handleCurvingChange = (patch: Partial<CurvingState>) => {
        setCurvingState(prev => ({ ...prev, ...patch }));
    };

    const isCurving = activeTab === 'curving';

    return (
        <div className="h-[calc(100svh-3.5rem)] flex overflow-hidden">
            {/* Left sidebar */}
            <div className="w-80 flex-shrink-0 border-r bg-sidebar flex flex-col overflow-hidden">
                <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b">
                    <h2 className="font-semibold text-sm">Input Parameters</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Enter your LED setup details.</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-6">
                        <SavedProjectPicker
                            signedIn={signedIn}
                            projects={summaries}
                            projectsLoading={listLoading}
                            projectsError={listError ?? projectError}
                            activeProject={activeProject}
                            activeScreenId={activeScreenId}
                            saveAvailable={activeScreen !== null}
                            screenNotice={screenNotice}
                            hasUnsavedChanges={hasUnsavedChanges}
                            saving={saving}
                            saveError={saveError}
                            onSelectProject={handleSelectProject}
                            onSelectScreen={handleSelectScreen}
                            onSave={handleSaveScreen}
                        />
                        <CalculatorForm
                            products={products}
                            formState={formState}
                            onFormChange={handleFormChange}
                            selectedProduct={selectedProduct}
                            hidePowerConfig={isCurving}
                            lockedToScreen={activeScreen !== null}
                        />
                        {/* Add New LED Product button — hidden on Curving tab */}
                        {!isCurving && (
                            <div>
                                <Link href="/add-led">
                                    <Button variant="outline" className="w-full" size="sm">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add New LED Product
                                    </Button>
                                </Link>
                            </div>
                        )}
                        {/* Curve Settings — shown only on the Curving tab */}
                        {isCurving && (
                            <div className="space-y-4">
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold text-sm mb-0.5">Curve Settings</h3>
                                    <p className="text-xs text-muted-foreground mb-4">Configure your screen curvature.</p>
                                    <CurvingSettings
                                        screenWidthTiles={formState.screenWidthTiles}
                                        tileWidthMm={selectedProduct?.tileWidthMm ?? 500}
                                        state={curvingState}
                                        onChange={handleCurvingChange}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-hidden p-6 flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <TabsList className="mb-4 self-start">
                        <TabsTrigger value="results" className="gap-1.5">
                            <Calculator className="h-4 w-4" />
                            Results
                        </TabsTrigger>
                        <TabsTrigger value="curving" className="gap-1.5">
                            <Spline className="h-4 w-4" />
                            Curving
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="results" className="flex-1 overflow-auto mt-0">
                        {results ? (
                            <ResultsDisplay results={results} title={reportTitle} formState={formState} product={selectedProduct} />
                        ) : screenNotice ? (
                            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{screenNotice}</div>
                        ) : (
                            <ResultsDisplaySkeleton />
                        )}
                    </TabsContent>
                    <TabsContent value="curving" className="flex-1 min-h-0 mt-0">
                        {selectedProduct ? (
                            <CurvingPreview
                                screenWidthTiles={formState.screenWidthTiles}
                                tileWidthMm={selectedProduct.tileWidthMm ?? 500}
                                state={curvingState}
                                onZoom={(z) => handleCurvingChange({ zoom: z })}
                            />
                        ) : (
                            <ResultsDisplaySkeleton />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function CalculatorFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/4" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/4" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

function ResultsDisplaySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
