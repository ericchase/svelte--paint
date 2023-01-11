<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	import PaintBox from '$lib/PaintBox.svelte';

	let paintbox: PaintBox;

	onDestroy(() => {
		closeEventSource();
	});
	onMount(() => {
		openEventSource();
	});

	interface ServerEvents {
		eventSource: EventSource | null;
		eventSourceErrorCount: number;
	}
	const serverEvents: ServerEvents = {
		eventSource: null,
		eventSourceErrorCount: 0,
	} satisfies ServerEvents;
	function onError() {
		console.log('onError');
		closeEventSource();
		if (serverEvents.eventSourceErrorCount < 3) {
			++serverEvents.eventSourceErrorCount;
			openEventSource();
		} else {
			console.log('Problem connecting to server. Please try again later.');
			window.location.href = '/404.html';
		}
	}
	function onMessage(event: MessageEvent<string>) {
		if (paintbox) {
			const [brush, ...rest] = event.data.split('\n');
			const points = rest.map((_) => _.split('.')).map(([x, y]) => [Number.parseInt(x), Number.parseInt(y)]);
			paintbox.setBrush(Number.parseInt(brush));
			paintbox.plotPoints(points);
		}
	}
	function onOpen() {
		console.log('onOpen');
		serverEvents.eventSourceErrorCount = 0;
	}
	function closeEventSource() {
		serverEvents.eventSource?.close();
	}
	function openEventSource() {
		serverEvents.eventSource = new window.EventSource(`/api/paintbox/events`);
		serverEvents.eventSource.onerror = onError;
		serverEvents.eventSource.onmessage = onMessage;
		serverEvents.eventSource.onopen = onOpen;
		console.log('Event Source Opened');
	}

	function onPoints(event: CustomEvent) {
		data.sendPoints(event.detail);
	}
</script>

<h1>Paint</h1>
<PaintBox bind:this={paintbox} on:points={onPoints} brush={0x000000ff} color="white" width={600} height={800} />
