<script lang="ts">
	import { getContext } from 'svelte';
	import { cn } from '$lib/utils';

	type TabsContext = {
		activeTab: string;
		orientation: 'horizontal' | 'vertical';
		activationMode: 'automatic' | 'manual';
	};

	const { orientation } = getContext<TabsContext>('tabs');

	let className: string = '';
	export { className as class };
</script>

<div
	class={cn(
		'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
		orientation === 'vertical' && 'flex-col h-auto w-auto',
		className
	)}
	data-orientation={orientation}
	{...$$restProps}
>
	<slot />
</div>