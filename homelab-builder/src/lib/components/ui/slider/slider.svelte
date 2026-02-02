<script lang="ts">
  import { cn } from '$lib/utils.js';
  import { createEventDispatcher } from 'svelte';

  export let value: number[] = [0];
  export let min: number = 0;
  export let max: number = 100;
  export let step: number = 1;
  export let disabled: boolean = false;
  export let className: string = '';
  export let onValueChange: ((value: number[]) => void) | undefined = undefined;

  const dispatch = createEventDispatcher<{
    change: number[];
  }>();

  function handleChange(event: Event) {
    if (disabled) return;
    
    const target = event.target as HTMLInputElement;
    const newValue = [Number(target.value)];
    
    value = newValue;
    dispatch('change', value);
    
    if (onValueChange) {
      onValueChange(value);
    }
  }

  const trackClasses = cn(
    'relative h-2 w-full grow overflow-hidden rounded-full bg-secondary',
    className
  );

  const rangeClasses = cn(
    'absolute h-full bg-primary'
  );

  const thumbClasses = cn(
    'block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
  );

  $: percentage = ((value[0] - min) / (max - min)) * 100;
</script>

<div class={trackClasses} {...$$restProps}>
  <div class={rangeClasses} style="width: {percentage}%"></div>
  <input
    type="range"
    {min}
    {max}
    {step}
    {disabled}
    value={value[0]}
    class="absolute inset-0 w-full cursor-pointer opacity-0"
    oninput={handleChange}
  />
  <div
    class={thumbClasses}
    style="left: calc({percentage}% - 10px); position: absolute; top: 50%; transform: translateY(-50%);"
  ></div>
</div>