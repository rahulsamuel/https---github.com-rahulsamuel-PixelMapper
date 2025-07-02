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
    const newLabels: string[] = [];
    let sequentialCounter = 1;
    let dmxCounter = 1;
    let dmxUniverse = 'A';

    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        if (labelFormat === 'none' || tile.deleted) {
            newLabels.push('');
            continue;
        }

        switch (labelFormat) {
            case 'sequential':
                newLabels.push(String(sequentialCounter++));
                break;
            case 'row-col':
                const y = Math.floor(i / screenWidth) + 1;
                const x = (i % screenWidth) + 1;
                newLabels.push(`${y}-${x}`);
                break;
            case 'dmx-style':
                newLabels.push(`${dmxUniverse}${dmxCounter++}`);
                if (dmxCounter > 170) { // 512 channels / 3 colors
                    dmxCounter = 1;
                    dmxUniverse = String.fromCharCode(dmxUniverse.charCodeAt(0) + 1);
                }
                break;
            default:
                newLabels.push('');
        }
    }
    // For row-col we need to iterate over all tiles, not just non-deleted ones
    if (labelFormat === 'row-col') {
      for(let i = 0; i < tiles.length; i++) {
        const y = Math.floor(i / screenWidth) + 1;
        const x = (i % screenWidth) + 1;
        newLabels[i] = `${y}-${x}`;
      }
    }

    setLabels(newLabels);
  }, [dimensions, tiles, labelFormat]);

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
      console.error("Grid element not found.");
      return;
    }

    const nodeToCapture = gridRef.current;

    toPng(nodeToCapture, {
      cacheBust: true,
      pixelRatio: 1,
      // Use the element's true rendered dimensions, including borders,
      // to prevent any clipping.
      width: nodeToCapture.offsetWidth,
      height: nodeToCapture.offsetHeight,
      // Apply styles to counteract transforms and positioning from the parent
      // elements, ensuring a clean capture of the grid itself.
      style: {
        position: "static",
        transform: "none",
        top: "auto",
        left: "auto",
      },
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
  }, [gridRef]);

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
  };

  return (
    <PixelMapperContext.Provider value={value}>
      {children}
    </PixelMapperContext.Provider>
  );
};
