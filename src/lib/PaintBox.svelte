<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	const dispatch = createEventDispatcher();

	export let brush = 0xffffffff;
	export let color = 'black';
	export let height = 500;
	export let width = 500;

	let canvas: HTMLCanvasElement;
	let ctx2d: CanvasRenderingContext2D;
	let imageData: ImageData;
	let imageView: DataView;

	onMount(() => {
		if (canvas) {
			const _ctx2d = canvas.getContext('2d');
			if (_ctx2d !== null) {
				ctx2d = _ctx2d;
				imageData = _ctx2d.getImageData(0, 0, width, height);
				imageView = new DataView(imageData.data.buffer);
				canvas.addEventListener('pointercancel', pointerCancel, false);
				canvas.addEventListener('pointerdown', pointerDown, false);
				document.addEventListener('pointermove', pointerMove, false);
				document.addEventListener('pointerup', pointerUp, false);
				//canvas.addEventListener('touchcancel', touchCancel, false);
				//canvas.addEventListener('touchstart', touchStart, false);
				//document.addEventListener('touchmove', touchMove, false);
				//document.addEventListener('touchend', touchEnd, false);
			}
		}
	});

	onDestroy(() => {
		if (canvas) {
			canvas.removeEventListener('pointercancel', pointerCancel, false);
			canvas.removeEventListener('pointerdown', pointerDown, false);
			document.removeEventListener('pointermove', pointerMove, false);
			document.removeEventListener('pointerup', pointerUp, false);
			//canvas.removeEventListener('touchcancel', touchCancel, false);
			//canvas.removeEventListener('touchstart', touchStart, false);
			//document.removeEventListener('touchmove', touchMove, false);
			//document.removeEventListener('touchend', touchEnd, false);
		}
	});

	let active = false;

	/** [x1, y1, x0, y0] */
	const pointerCoordinates = new Int32Array([0, 0, 0, 0]);

	function pointerCancel(this: HTMLCanvasElement, event: PointerEvent) {
		drawStop();
	}
	function pointerUp(this: Document, event: PointerEvent) {
		drawStop();
	}
	function touchCancel(this: HTMLCanvasElement, event: TouchEvent) {
		drawStop();
	}
	function touchEnd(this: Document, event: TouchEvent) {
		drawStop();
	}
	function drawStop() {
		active = false;
	}

	function pointerMove(this: Document, event: PointerEvent) {
		drawMove(event.clientX, event.clientY);
	}
	function touchMove(this: Document, event: TouchEvent) {
		event.preventDefault();
		drawMove(event.touches[0].clientX, event.touches[0].clientY);
	}
	function drawMove(clientX: number, clientY: number) {
		if (active) {
			updatePointerCoordinates(clientX, clientY);
			const [x1, y1, x0, y0] = pointerCoordinates;
			emitLine(x0, y0, x1, y1);
		}
	}

	function pointerDown(this: HTMLCanvasElement, event: PointerEvent) {
		drawStart(event.clientX, event.clientY);
	}
	function touchStart(this: HTMLCanvasElement, event: TouchEvent) {
		drawStart(event.touches[0].clientX, event.touches[0].clientY);
	}
	function drawStart(clientX: number, clientY: number) {
		active = true;
		updatePointerCoordinates(clientX, clientY);
	}

	/** Bresenham's line algorithm. */
	function emitLine(x0: number, y0: number, x1: number, y1: number) {
		const dx = Math.abs(x1 - x0);
		const dy = Math.abs(y1 - y0);
		const sx = x0 < x1 ? 1 : -1;
		const sy = y0 < y1 ? 1 : -1;
		let err = dx - dy;

		const points: number[][] = [];
		const point = new Int32Array([0, 0]);
		point[0] = x0;
		point[1] = y0;
		points.push([point[0], point[1]]);
		while (!(x0 === x1 && y0 === y1)) {
			const e2 = 2 * err;
			if (e2 > -dy) {
				err -= dy;
				x0 += sx;
			}
			if (e2 < dx) {
				err += dx;
				y0 += sy;
			}
			point[0] = x0;
			point[1] = y0;
			points.push([point[0], point[1]]);
		}

		emitPoints(points);
	}

	function isValid([x, y]: number[]) {
		return 0 <= x && x < width && 0 <= y && y < height;
	}

	function emitPoints(points: number[][]) {
		const valid = points.filter(isValid);
		if (valid.length > 0) {
			const data = `${brush}\n${valid.map(([x, y]) => `${x}.${y}`).join('\n')}`;
			dispatch('points', data);
		}
	}

	export function setBrush(_brush: number) {
		brush = _brush;
	}

	export function plotPoints(points: number[][]) {
		for (const [x, y] of points) {
			imageView.setUint32(4 * (width * y + x), brush, false);
		}
		ctx2d.putImageData(imageData, 0, 0);
	}

	/** Clip mouse coordinates to canvas dimensions */
	function updatePointerCoordinates(clientX: number, clientY: number) {
		pointerCoordinates[2] = pointerCoordinates[0];
		pointerCoordinates[3] = pointerCoordinates[1];
		const rect = canvas.getBoundingClientRect();
		const scaleX = width / rect.width;
		const scaleY = height / rect.height;
		pointerCoordinates[0] = (clientX - rect.left) * scaleX;
		pointerCoordinates[1] = (clientY - rect.top) * scaleY;
	}
</script>

<canvas bind:this={canvas} {width} {height} style:background-color={color} />

<style>
	canvas {
		border: 1px solid black;
		touch-action: none;
	}
</style>
