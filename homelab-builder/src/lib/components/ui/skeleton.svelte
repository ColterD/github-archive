<!-- SKELETON LOADING COMPONENT -->
<!-- Enterprise-grade loading states for better user experience -->

<script lang="ts">
  import { cn } from "$lib/utils.js";

  let className: string = "";
  export { className as class };
  export let variant: "default" | "card" | "text" | "circle" | "button" = "default";
  export let animation: "pulse" | "wave" | "none" = "pulse";
  export let width: string = "100%";
  export let height: string = "1rem";
  export let rounded: "none" | "sm" | "md" | "lg" | "full" = "md";
</script>

<div
  class={cn(
    "bg-muted",
    {
      "animate-pulse": animation === "pulse",
      "animate-wave": animation === "wave",
      "rounded-none": rounded === "none",
      "rounded-sm": rounded === "sm", 
      "rounded-md": rounded === "md",
      "rounded-lg": rounded === "lg",
      "rounded-full": rounded === "full",
      "aspect-square": variant === "circle",
      "h-4": variant === "text",
      "h-10": variant === "button",
      "h-32": variant === "card"
    },
    className
  )}
  style="width: {width}; height: {variant === 'text' || variant === 'button' || variant === 'card' || variant === 'circle' ? undefined : height};"
  role="status"
  aria-label="Loading content..."
>
  <span class="sr-only">Loading...</span>
</div>

<style>
  @keyframes wave {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .animate-wave {
    position: relative;
    overflow: hidden;
  }

  .animate-wave::after {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    animation: wave 1.6s linear 0.5s infinite;
    content: "";
  }
</style> 