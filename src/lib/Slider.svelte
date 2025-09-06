<script lang="ts">
  export let name: string;
  export let label: string;
  export let value: number;
  export let min = 0;
  export let max = 1;
  export let step = 0.01;
  export let onChange: (v: number) => void;

  let trackEl: HTMLDivElement;

  function roundToStep(v: number) {
    const s = step || 0.01;
    return Math.round(v / s) * s;
  }

  function posToValue(clientX: number) {
    const rect = trackEl.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(1, rect.width)));
    const raw = min + t * (max - min);
    return roundToStep(raw);
  }

  function pointerDown(e: PointerEvent | MouseEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId as number);
    const v = posToValue((e as PointerEvent).clientX);
    onChange(v);
  }

  function pointerMove(e: PointerEvent) {
    if ((e.buttons ?? 0) & 1) {
      const v = posToValue(e.clientX);
      onChange(v);
    }
  }

  $: t = (value - min) / Math.max(1e-9, (max - min)); // normalized 0..1
</script>

<div class="param">
  <div class="row">
    <span class="label">{label || name}</span>
    <span class="val">{value.toFixed(step >= 1 ? 0 : 2)}</span>
  </div>
  <div
    class="track"
    bind:this={trackEl}
    on:pointerdown={pointerDown}
    on:pointermove={pointerMove}
  >
    <div class="fill" style={`width:${Math.round(t * 100)}%;`}></div>
  </div>
</div>

<style>
  .param { display:flex; flex-direction:column; gap:6px; }
  .row { display:flex; justify-content:space-between; align-items:center; font-size:.85rem; }
  .label { color:#24292f; font-weight:500; }
  .val { font-family: SFMono-Regular, Consolas, monospace; color:#0000eb; }
  .track {
    position:relative;
    height:10px;
    border-radius:6px;
    background:#e1e4e8;
    cursor:pointer;
    user-select:none;
    touch-action:none;
  }
  .fill {
    position:absolute; left:0; top:0; bottom:0;
    background:#0000eb; border-radius:6px;
  }
</style>
