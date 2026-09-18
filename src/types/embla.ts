import type { EmblaCarouselType, EmblaEventType } from "embla-carousel";

// Event type for Embla custom events
interface EmblaCustomEvent extends CustomEvent {
  detail: {
    embla: EmblaCarouselType;
  };
}

// Type for embla node event map
type EmblaNodeEventMap = {
  [K in EmblaEventType as `embla:${K}`]: EmblaCustomEvent;
};

// Extended element type for embla nodes
export interface EmblaNodeElement extends HTMLElement {
  // Store the Embla API instance directly on the element
  emblaApi?: EmblaCarouselType;

  // Include all embla custom events
  addEventListener<K extends keyof EmblaNodeEventMap>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: EmblaNodeElement, ev: EmblaNodeEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;

  removeEventListener<K extends keyof EmblaNodeEventMap>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: EmblaNodeElement, ev: EmblaNodeEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;

  // Add dataset properties specific to embla nodes
  dataset: {
    carouselParent: string;
    dragFree?: string;
    loop?: string;
    autoPlay?: string;
    emblaAlign?: "start" | "center" | "end";
    emblaStartIndex?: string;
    emblaExposedEvents?: string;
    [key: string]: string | undefined;
  };
}
