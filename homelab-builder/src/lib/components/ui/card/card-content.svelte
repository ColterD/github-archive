<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils.js";

	interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
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
	}: CardContentProps = $props();
</script>

<div bind:this={ref} data-slot="card-content" class={cn("px-6", className)} {...restProps}>
	{@render children?.()}
</div>
