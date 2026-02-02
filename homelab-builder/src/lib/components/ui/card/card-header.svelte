<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
		ref?: HTMLDivElement | null;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	}

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: CardHeaderProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="card-header"
	class={cn(
		"@container/card-header has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
