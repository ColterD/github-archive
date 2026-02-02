<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils.js";

	interface CardProps extends HTMLAttributes<HTMLDivElement> {
		class?: string;
		children?: Snippet;
		ref?: HTMLDivElement | null;
	}

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: CardProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	class={cn(
		"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
