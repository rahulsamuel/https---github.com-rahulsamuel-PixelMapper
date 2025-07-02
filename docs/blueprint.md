# **App Name**: PixelMapper

## Core Features:

- Dimension Input: Allow users to input the LED tile size (width and height in pixels) and the LED screen size (number of tiles in width and height).
- LED Screen Display: Display a grid representing the LED screen based on the user-defined dimensions, where each tile represents an LED. Tiles will have sharp, non-rounded corners.
- Tile Deletion: Enable users to click on individual LED tiles to toggle their 'deleted' state (visualized as either present or absent).
- Customizable Color: Provide options for users to select the color of LED tiles, including setting the border width.
- Tile Restore: Implement a 'Restore All' function to revert all deleted tiles to their original state.
- Deleted Tile Count: Display a counter showing the current number of deleted LED tiles.
- PNG Download: Generate and export pixel-accurate PNG images of the LED screen at the highest possible quality. Tiles will have sharp, non-rounded corners in the downloaded image.
- Zoom in/out the led Screen: Provide zooming feature to zoom-in or zoom-out the pixel screen with scroll wheel, mouse move, or buttons.
- Media Output Generation: Select either pixel map or raster map creation with following resolutions of HD (1920x1080), 4K (3840x2160) and DCI (4096x2160). If the raster map option is selected, this feature uses an AI tool to determine the closest raster screen match to the media server output based on the tile screen resolution.
- Wiring Diagram: Provide wiring data diagram to define number of tiles on each string connection with specific name such as A1, A2.. A10, then goes to C1, C2...C10 and loop backs to A1 and do data wiring and power wiring labels in each Raster diagram output, so that data and power labels don't over lap on the png output. For power, tiles on 20A circuit labeled as P1, P2, P3...
- Raster Map Download: Allow users to download raster maps. If there are multiple raster maps, allow the user to download each raster map individually.
- Mirror Wiring Diagram Download: Add mirror image option to download wiring diagrams for the ease since LED Screens are wired from back.

## Style Guidelines:

- Primary color: Dark slate gray (#2F4F4F) to give a 'dark web application' feel.
- Background color: Very dark gray (#121212) to complement the primary color and enhance contrast.
- Accent color: Electric purple (#8F00FF) for interactive elements and highlights, providing a visually striking contrast on the dark background.
- Body and headline font: 'Space Grotesk' sans-serif, offering a computerized feel suitable for both headlines and shorter bodies of text. If longer text is needed, use this font for headlines and 'Inter' for the body.
- Implement a sidebar navigation on the left side for easy access to settings and features.
- Use simple, geometric icons to maintain a modern, tech-focused aesthetic.  Keep icon style and weights consistent throughout.
- Use subtle transitions and animations for feedback during tile deletion/restoration to confirm the operation's success. The subtle animation effect applied should be visually noticeable, ensuring users recognize their performed operations, all while maintaining visual consistency.