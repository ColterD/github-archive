<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<"div"> & { children?: Snippet; ref?: HTMLDivElement | null } = $props();
</script>

<div
	bind:this={ref}
	data-slot="card-action"
	class={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
	{...restProps}
>
	{@render children?.()}
</div>
