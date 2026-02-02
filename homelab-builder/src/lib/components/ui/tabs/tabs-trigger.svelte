<script lang="ts">
	import { getContext } from 'svelte';
	import { cn } from '$lib/utils';

	type TabsContext = {
		activeTab: string;
		orientation: 'horizontal' | 'vertical';
		activationMode: 'automatic' | 'manual';
	};

	export let value: string;
	export let disabled: boolean = false;

	const { activeTab, orientation, activationMode } = getContext<TabsContext>('tabs');

	let className: string = '';
	export { className as class };

	function handleClick() {
		if (!disabled) {
			activeTab.set(value);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (activationMode === 'manual' && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			handleClick();
		}
	}

	$: isActive = $activeTab === value;
</script>

<button
	type="button"
	class={cn(
		'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
		isActive && 'bg-background text-foreground shadow-sm',
		!isActive && 'text-muted-foreground hover:text-foreground',
		orientation === 'vertical' && 'w-full justify-start',
		className
	)}
	data-state={isActive ? 'active' : 'inactive'}
	data-orientation={orientation}
	{disabled}
	onclick={handleClick}
	onkeydown={handleKeydown}
	{...$$restProps}
>
	<slot />
</button>