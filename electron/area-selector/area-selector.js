const { ipcRenderer } = require('electron');

let startX, startY;
let isDrawing = false;
let isResizing = false;
let isDragging = false;
let resizeHandle = null;
let dragStartX, dragStartY, selectionStartX, selectionStartY;

const selection = document.getElementById('selection');
const confirmBtn = document.getElementById('confirmBtn');
const handles = document.querySelectorAll('.resize-handle');
const info = document.getElementById('info');

document.addEventListener('mousedown', (e) => {
	if (e.target.classList.contains('resize-handle')) {
		isResizing = true;
		resizeHandle = e.target;
		e.stopPropagation();
		return;
	}

	if (e.target === confirmBtn) return;

	if (e.target === selection) {
		isDragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		selectionStartX = parseInt(selection.style.left);
		selectionStartY = parseInt(selection.style.top);
		e.stopPropagation();
		return;
	}

	if (selection.style.display === 'block') return;

	startX = e.clientX;
	startY = e.clientY;
	isDrawing = true;
	selection.style.left = startX + 'px';
	selection.style.top = startY + 'px';
	selection.style.width = '0px';
	selection.style.height = '0px';
	selection.style.display = 'block';
});

document.addEventListener('mousemove', (e) => {
	if (isResizing && resizeHandle) {
		const rect = {
			left: parseInt(selection.style.left),
			top: parseInt(selection.style.top),
			width: parseInt(selection.style.width),
			height: parseInt(selection.style.height),
		};

		const handle = resizeHandle.classList;

		if (handle.contains('handle-br')) {
			selection.style.width = Math.max(20, e.clientX - rect.left) + 'px';
			selection.style.height = Math.max(20, e.clientY - rect.top) + 'px';
		} else if (handle.contains('handle-bl')) {
			const newWidth = Math.max(20, rect.left + rect.width - e.clientX);
			selection.style.left = rect.left + rect.width - newWidth + 'px';
			selection.style.width = newWidth + 'px';
			selection.style.height = Math.max(20, e.clientY - rect.top) + 'px';
		} else if (handle.contains('handle-tr')) {
			selection.style.width = Math.max(20, e.clientX - rect.left) + 'px';
			const newHeight = Math.max(20, rect.top + rect.height - e.clientY);
			selection.style.top = rect.top + rect.height - newHeight + 'px';
			selection.style.height = newHeight + 'px';
		} else if (handle.contains('handle-tl')) {
			const newWidth = Math.max(20, rect.left + rect.width - e.clientX);
			const newHeight = Math.max(20, rect.top + rect.height - e.clientY);
			selection.style.left = rect.left + rect.width - newWidth + 'px';
			selection.style.top = rect.top + rect.height - newHeight + 'px';
			selection.style.width = newWidth + 'px';
			selection.style.height = newHeight + 'px';
		} else if (handle.contains('handle-t')) {
			const newHeight = Math.max(20, rect.top + rect.height - e.clientY);
			selection.style.top = rect.top + rect.height - newHeight + 'px';
			selection.style.height = newHeight + 'px';
		} else if (handle.contains('handle-b')) {
			selection.style.height = Math.max(20, e.clientY - rect.top) + 'px';
		} else if (handle.contains('handle-l')) {
			const newWidth = Math.max(20, rect.left + rect.width - e.clientX);
			selection.style.left = rect.left + rect.width - newWidth + 'px';
			selection.style.width = newWidth + 'px';
		} else if (handle.contains('handle-r')) {
			selection.style.width = Math.max(20, e.clientX - rect.left) + 'px';
		}
		return;
	}

	if (isDragging) {
		const deltaX = e.clientX - dragStartX;
		const deltaY = e.clientY - dragStartY;
		selection.style.left = selectionStartX + deltaX + 'px';
		selection.style.top = selectionStartY + deltaY + 'px';
		return;
	}

	if (!isDrawing) return;

	const currentX = e.clientX;
	const currentY = e.clientY;
	const width = Math.abs(currentX - startX);
	const height = Math.abs(currentY - startY);
	const left = Math.min(startX, currentX);
	const top = Math.min(startY, currentY);

	selection.style.left = left + 'px';
	selection.style.top = top + 'px';
	selection.style.width = width + 'px';
	selection.style.height = height + 'px';
});

document.addEventListener('mouseup', () => {
	if (isDrawing) {
		isDrawing = false;
		const width = parseInt(selection.style.width);
		const height = parseInt(selection.style.height);

		if (width > 10 && height > 10) {
			handles.forEach((h) => (h.style.display = 'block'));
			confirmBtn.style.display = 'block';
			info.textContent =
				'Ajuste a seleção • Clique OK para confirmar • ESC para cancelar';
		} else {
			selection.style.display = 'none';
		}
	}

	isResizing = false;
	isDragging = false;
	resizeHandle = null;
});

confirmBtn.addEventListener('click', () => {
	const x = parseInt(selection.style.left);
	const y = parseInt(selection.style.top);
	const width = parseInt(selection.style.width);
	const height = parseInt(selection.style.height);

	ipcRenderer.send(window.eventName || 'area-selected-for-screenshot', {
		x,
		y,
		width,
		height,
	});
});

document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') {
		ipcRenderer.send('area-selection-cancelled');
	}
});
