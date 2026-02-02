<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLTextareaAttributes } from "svelte/elements";

  type $$Props = HTMLTextareaAttributes & {
    class?: string;
    maxLength?: number;
  };

  let className: $$Props["class"] = undefined;
  export { className as class };
  export let value: $$Props["value"] = undefined;
</script>

<textarea
  class={cn(
    "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  bind:value
  {...$$restProps}
  on:blur
  on:change
  on:click
  on:focus
  on:keydown
  on:keypress
  on:keyup
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:paste
  on:input
></textarea>