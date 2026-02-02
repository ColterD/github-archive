<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils.js";

	interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
		ref?: HTMLParagraphElement | null;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	}

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: CardDescriptionProps = $props();
</script>

<p
	bind:this={ref}
	data-slot="card-description"
	class={cn("text-muted-foreground text-sm", className)}
	{...restProps}
>
	{@render children?.()}
</p>
