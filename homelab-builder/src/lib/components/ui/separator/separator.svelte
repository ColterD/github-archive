<script lang="ts">
  import { cn } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";

  type $$Props = HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical";
    decorative?: boolean;
  };

  export let orientation: $$Props["orientation"] = "horizontal";
  export let decorative: $$Props["decorative"] = true;

  let classes = "";
  $: classes = cn(
    "shrink-0 bg-border",
    orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
    $$props.class,
  );
</script>

<div
  class={classes}
  role={decorative ? "none" : "separator"}
  aria-orientation={orientation}
  {...$$restProps}
></div> 