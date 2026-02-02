<script lang="ts">
	import { getContext } from 'svelte';
	import { cn } from '$lib/utils';

	type TabsContext = {
		activeTab: string;
		orientation: 'horizontal' | 'vertical';
		activationMode: 'automatic' | 'manual';
	};

	export let value: string;

	const { activeTab } = getContext<TabsContext>('tabs');

	let className: string = '';
	export { className as class };

	$: isActive = $activeTab === value;
</script>

{#if isActive}
	<div
		class={cn(
			'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
			className
		)}
		data-state={isActive ? 'active' : 'inactive'}
		role="tabpanel"
		tabindex="0"
		{...$$restProps}
	>
		<slot />
	</div>
{/if}