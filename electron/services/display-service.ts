import { Display, screen } from 'electron';

/**
 * Display management service
 */

export interface DisplayInfo {
	id: number;
	label: string;
	bounds: { x: number; y: number; width: number; height: number };
	primary: boolean;
}

/**
 * Gets all available displays with formatted information
 */
export function getAllDisplays(): DisplayInfo[] {
	const displays = screen.getAllDisplays();
	return displays.map((display, index) => ({
		id: index,
		label: `Monitor ${index + 1}${display.internal ? ' (Interno)' : ''}${
			display.bounds.x === 0 && display.bounds.y === 0 ? ' [Principal]' : ''
		}`,
		bounds: display.bounds,
		primary: display.bounds.x === 0 && display.bounds.y === 0,
	}));
}

/**
 * Gets cursor position relative to a display
 */
export function getCursorRelativePosition(displayBounds: {
	x: number;
	y: number;
	width: number;
	height: number;
}): { x: number; y: number } {
	const cursorPos = screen.getCursorScreenPoint();
	return {
		x: cursorPos.x - displayBounds.x,
		y: cursorPos.y - displayBounds.y,
	};
}

/**
 * Gets a specific display by index, or primary display as fallback
 */
export function getDisplayByIndex(index: number): Display {
	const displays = screen.getAllDisplays();
	return displays[index] || displays[0];
}
