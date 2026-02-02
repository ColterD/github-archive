<script lang="ts">
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	export let value: string = '';
	export let orientation: 'horizontal' | 'vertical' = 'horizontal';
	export let activationMode: 'automatic' | 'manual' = 'automatic';

	const activeTab = writable(value);

	setContext('tabs', {
		activeTab,
		orientation,
		activationMode
	});

	$: activeTab.set(value);
</script>

<div
	class="tabs-root"
	data-orientation={orientation}
	{...$$restProps}
>
	<slot />
</div>

<style>
	.tabs-root {
		display: flex;
		flex-direction: column;
	}

	.tabs-root[data-orientation='vertical'] {
		flex-direction: row;
	}
</style>