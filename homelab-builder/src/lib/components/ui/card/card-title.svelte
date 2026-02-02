<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils.js";

	interface CardTitleProps extends HTMLAttributes<HTMLDivElement> {
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
	}: CardTitleProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="card-title"
	class={cn("font-semibold leading-none", className)}
	{...restProps}
>
	{@render children?.()}
</div>
