import * as Slider from '@radix-ui/react-slider'

type SliderFieldProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (value: number) => void
}

/** Labelled slider on Radix (keyboard, pointer and touch). The readout sits above the track. */
export function SliderField({ label, value, min, max, step, display, onChange }: SliderFieldProps) {
  return (
    <div className="grid min-w-[9.5rem] flex-1 gap-2.5">
      <div className="flex items-baseline justify-between gap-3 text-xs text-dim">
        <span>{label}</span>
        <span className="font-mono num text-fg">{display}</span>
      </div>
      <Slider.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
      >
        <Slider.Track className="relative h-1 grow overflow-hidden rounded-full bg-edge">
          <Slider.Range className="absolute h-full rounded-full bg-metal" />
        </Slider.Track>
        <Slider.Thumb
          aria-label={label}
          className="block size-4 rounded-full border-2 border-metal bg-ground transition duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-metal/30"
        />
      </Slider.Root>
    </div>
  )
}
