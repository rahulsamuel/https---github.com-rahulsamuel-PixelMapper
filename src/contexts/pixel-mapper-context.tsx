
"use client";

import { toPng } from "html-to-image";
import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode, Dispatch, SetStateAction } from "react";

interface Dimensions {
  tileWidth: number;
  tileHeight: number;
  screenWidth: number;
  screenHeight: number;
}

interface Tile {
  id: number;
  deleted: boolean;
}

type ActiveTool = 'delete' | 'label' | 'color';
type LabelFormat = 'none' | 'sequential' | 'row-col' | 'dmx-style';

interface PixelMapperState {
  appState: string;
  gridRef: React.RefObject<HTMLDivElement>;
  dimensions: Dimensions;
  setDimensions: Dispatch<SetStateAction<Dimensions>>;
  tiles: Tile[];
  labels: string[];
  handleTileClick: (index: number) => void;
  restoreAll: () => void;
  deletedCount: number;
  tileColor: string;
  setTileColor: Dispatch<SetStateAction<string>>;
  tileColorTwo: string;
  setTileColorTwo: Dispatch<SetStateAction<string>>;
  borderWidth: number;
  setBorderWidth: Dispatch<SetStateAction<number>>;
  borderColor: string;
  setBorderColor: Dispatch<SetStateAction<string>>;
  handleDownloadPng: (filename: string) => void;
  handleDownloadOnOffPattern: (filename: string) => void;
  activeTool: ActiveTool;
  setActiveTool: Dispatch<SetStateAction<ActiveTool>>;
  showLabels: boolean;
  setShowLabels: Dispatch<SetStateAction<boolean>>;
  labelFormat: LabelFormat;
  setLabelFormat: Dispatch<SetStateAction<LabelFormat>>;
  labelFontSize: number;
  setLabelFontSize: Dispatch<SetStateAction<number>>;
  labelColor: string;
  setLabelColor: Dispatch<SetStateAction<string>>;
  zoom: number;
  setZoom: Dispatch<SetStateAction<number>>;
}

const PixelMapperContext = createContext<PixelMapperState | undefined>(undefined);

export const usePixelMapper = () => {
  const context = useContext(PixelMapperContext);
  if (!context) {
    throw new Error("usePixelMapper must be used within a PixelMapperProvider");
  }
  return context;
};

export function PixelMapperProvider({ children }: { children: ReactNode }) {
  const [appState] = useState("ready");
  const gridRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState<Dimensions>({
    tileWidth: 200,
    tileHeight: 200,
    screenWidth: 5,
    screenHeight: 3,
  });
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [deletedCount, setDeletedCount] = useState(0);

  const [tileColor, setTileColor] = useState("#3961b1");
  const [tileColorTwo, setTileColorTwo] = useState("#a7b8ec");
  const [borderWidth, setBorderWidth] = useState(1);
  const [borderColor, setBorderColor] = useState("#ffffff");
  const [activeTool, setActiveTool] = useState<ActiveTool>("delete");
  
  // Labeling state
  const [showLabels, setShowLabels] = useState(true);
  const [labelFormat, setLabelFormat] = useState<LabelFormat>('sequential');
  const [labelFontSize, setLabelFontSize] = useState(48);
  const [labelColor, setLabelColor] = useState("#ffffff");
  const [labels, setLabels] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);


  useEffect(() => {
    const totalTiles = dimensions.screenWidth * dimensions.screenHeight;
    if (totalTiles > 0 && totalTiles <= 4096) { // Safety limit
        setTiles(
            Array.from({ length: totalTiles }, (_, i) => ({ id: i, deleted: false }))
        );
    } else {
        setTiles([]);
    }
  }, [dimensions]);

  useEffect(() => {
    setDeletedCount(tiles.filter((tile) => tile.deleted).length);
  }, [tiles]);

  useEffect(() => {
    const { screenWidth, screenHeight } = dimensions;
    if (screenWidth * screenHeight === 0) {
      setLabels([]);
      return;
    }

    let sequentialCounter = 1;
    let dmxCounter = 1;
    let dmxUniverse = 'A';
    
    const newLabels = tiles.map((tile, i) => {
      if (labelFormat === 'none' || !showLabels) {
        return '';
      }

      switch (labelFormat) {
        case 'sequential':
          return !tile.deleted ? String(sequentialCounter++) : '';
        case 'row-col':
          const y = Math.floor(i / screenWidth) + 1;
          const x = (i % screenWidth) + 1;
          return `${y}-${x}`;
        case 'dmx-style':
          if (!tile.deleted) {
            const label = `${dmxUniverse}${dmxCounter++}`;
            if (dmxCounter > 170) { // 512 channels / 3 colors
              dmxCounter = 1;
              dmxUniverse = String.fromCharCode(dmxUniverse.charCodeAt(0) + 1);
            }
            return label;
          }
          return '';
        default:
          return '';
      }
    });

    setLabels(newLabels);
  }, [dimensions, tiles, labelFormat, showLabels]);

  const toggleTile = useCallback((index: number) => {
    setTiles((prev) =>
      prev.map((tile, i) => (i === index ? { ...tile, deleted: !tile.deleted } : tile))
    );
  }, []);

  const handleTileClick = useCallback((index: number) => {
    switch (activeTool) {
      case 'delete':
        toggleTile(index);
        break;
      case 'color':
        // Placeholder for color functionality
        console.log(`Color tool clicked on tile ${index}`);
        break;
      default:
        break;
    }
  }, [activeTool, toggleTile]);

  const restoreAll = useCallback(() => {
    setTiles((prev) => prev.map((tile) => ({ ...tile, deleted: false })));
  }, []);

  const handleDownloadPng = useCallback((filename: string) => {
    if (gridRef.current === null) {
      return;
    }
    
    // Calculate exact dimensions from state to avoid rounding errors or zoom influence
    const width = dimensions.screenWidth * dimensions.tileWidth;
    const height = dimensions.screenHeight * dimensions.tileHeight;
  
    toPng(gridRef.current, {
      cacheBust: true,
      pixelRatio: 2, // Render at 2x resolution for higher quality
      width: width,
      height: height,
      style: {
        // Override styles to ensure clean capture
        transform: 'none',
        position: 'static',
        // Ensure the container itself isn't influencing the size
        width: `${width}px`,
        height: `${height}px`,
      }
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Could not generate PNG.", err);
      });
  }, [gridRef, dimensions]);

  const handleDownloadOnOffPattern = useCallback((filename: string) => {
    const offscreenContainer = document.createElement('div');
    offscreenContainer.style.position = 'absolute';
    offscreenContainer.style.left = '-9999px';
    offscreenContainer.style.top = '-9999px';

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${dimensions.screenWidth}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${dimensions.screenHeight}, 1fr)`;
    grid.style.width = `${dimensions.screenWidth * dimensions.tileWidth}px`;
    grid.style.height = `${dimensions.screenHeight * dimensions.tileHeight}px`;
    grid.style.backgroundColor = 'black';
    grid.style.border = '1px solid black';
    grid.style.boxSizing = 'border-box';

    tiles.forEach((tile) => {
        const tileEl = document.createElement('div');
        tileEl.style.width = `${dimensions.tileWidth}px`;
        tileEl.style.height = `${dimensions.tileHeight}px`;
        tileEl.style.border = `1px solid black`;
        tileEl.style.boxSizing = 'border-box';
        tileEl.style.backgroundColor = tile.deleted ? 'black' : 'white';
        grid.appendChild(tileEl);
    });
    
    offscreenContainer.appendChild(grid);
    document.body.appendChild(offscreenContainer);

    toPng(grid, {
      cacheBust: true,
      pixelRatio: 1,
      width: dimensions.screenWidth * dimensions.tileWidth,
      height: dimensions.screenHeight * dimensions.tileHeight,
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Could not generate ON/OFF pattern PNG.', err);
      })
      .finally(() => {
        document.body.removeChild(offscreenContainer);
      });

  }, [dimensions, tiles]);


  const value = {
    appState,
    gridRef,
    dimensions,
    setDimensions,
    tiles,
    labels,
    handleTileClick,
    restoreAll,
    deletedCount,
    tileColor,
    setTileColor,
    tileColorTwo,
    setTileColorTwo,
    borderWidth,
    setBorderWidth,
    borderColor,
    setBorderColor,
    handleDownloadPng,
    handleDownloadOnOffPattern,
    activeTool,
    setActiveTool,
    showLabels,
    setShowLabels,
    labelFormat,
    setLabelFormat,
    labelFontSize,
    setLabelFontSize,
    labelColor,
    setLabelColor,
    zoom,
    setZoom,
  };

  return (
    <PixelMapperContext.Provider value={value}>
      {children}
    </PixelMapperContext.Provider>
  );
};
