import { afterWebflowReady, getGsap, getHtmlElement, getMultipleHtmlElements } from "@taj-wf/utils";
import type { EmblaCarouselType } from "embla-carousel";

import { type EmblaNodeElement } from "@/types/embla";

type ChildAnimationElements = {
  details: HTMLElement | undefined | null;
};
type ChildAnimationElementsMap = Map<number, ChildAnimationElements>;

const GAP_ADJUSTMENT_PERCENT = 20;
const INACTIVE_SLIDE_SCALE_RATIO = 0.8;

const initStickyCarouselScroll = () => {
  const [gsap, ScrollTrigger] = getGsap(["ScrollTrigger"], "error");

  if (!gsap || !ScrollTrigger) return;

  const carouselNodes = getMultipleHtmlElements<EmblaNodeElement>({
    selector: "[data-carousel-parent][data-featured-listing]",
  });

  if (!carouselNodes) return;

  for (const carouselNode of carouselNodes) {
    const partnersScrollArea = carouselNode.closest<HTMLElement>("[partners-scroll-area]");

    if (!partnersScrollArea) {
      console.error(
        "Partners scroll area [partners-scroll-area] not found for carousel",
        carouselNode
      );
      continue;
    }

    const initCarouselAnimation = () => {
      let isInitialized = false;
      let carouselApi = carouselNode.emblaApi;
      let slideCards = getMultipleHtmlElements({
        selector: "[data-carousel-card]",
        parent: carouselNode,
      });
      let currentIndex = carouselApi?.selectedScrollSnap();

      const childAnimationElementsMap: ChildAnimationElementsMap = new Map();

      const selectCurrentSlide = (currIndex: number) => {
        if (!slideCards) {
          console.debug("selectCurrentSlide was used before carousel was initialized");
          return;
        }

        const childElementsAnimationRevealState: gsap.TweenVars = {
          height: "auto",
          delay: 0.15,
          overwrite: true,
        };

        const childElementsAnimationHiddenState: gsap.TweenVars = {
          height: 0,
          overwrite: true,
        };

        for (let i = 0; i < slideCards.length; i++) {
          const slideCard = slideCards[i]!;
          const isCurrentSlide = i === currIndex;

          const childAnimationElements = childAnimationElementsMap.get(i);
          const childAnimationElementsArr = [childAnimationElements?.details].filter(
            (el) => el !== undefined && el !== null
          );

          if (isCurrentSlide) {
            gsap.to(slideCard, { scale: 1, x: 0, ease: "back", duration: 0.7 });
            gsap.to(childAnimationElementsArr, childElementsAnimationRevealState);
            slideCard.classList.remove("is-deactive");
          } else {
            const isLeftSide = i < currIndex;

            const positionIndex = isLeftSide ? currIndex - i - 1 : i - currIndex - 1;

            const transformAlign = isLeftSide ? "right" : "left";
            slideCard.style.transformOrigin = `${transformAlign} top`;

            const getXValue = (gapAdjustment: number) => {
              return isLeftSide
                ? `${gapAdjustment * positionIndex}%`
                : `-${gapAdjustment * positionIndex}%`;
            };

            gsap.to(slideCard, {
              x: () => {
                const cssVariableName =
                  "--_responsive---featured-listing-carousel--animation-gap-adjustment-percent";

                const cssVariableValue = getComputedStyle(
                  document.documentElement
                ).getPropertyValue(cssVariableName);

                if (!cssVariableValue) {
                  console.error(
                    `CSS variable ${cssVariableName} is not defined. Using default value of ${GAP_ADJUSTMENT_PERCENT}%`
                  );
                  return getXValue(GAP_ADJUSTMENT_PERCENT);
                }

                const gapAdjustment = Number.parseFloat(cssVariableValue.trim());

                if (isNaN(gapAdjustment)) {
                  console.error(
                    `CSS variable ${cssVariableName} is not a valid number. Using default value of ${GAP_ADJUSTMENT_PERCENT}%`
                  );
                  return getXValue(GAP_ADJUSTMENT_PERCENT);
                }

                return getXValue(gapAdjustment);
              },
              scale: () => {
                const cssVariableName =
                  "--_responsive---featured-listing-carousel--inactive-slide-scale-ratio";

                const cssVariableValue = getComputedStyle(
                  document.documentElement
                ).getPropertyValue(cssVariableName);

                if (!cssVariableValue) {
                  console.error(
                    `CSS variable ${cssVariableName} is not defined. Using default value of ${INACTIVE_SLIDE_SCALE_RATIO}`
                  );
                  return INACTIVE_SLIDE_SCALE_RATIO;
                }

                const scale = Number.parseFloat(cssVariableValue.trim());

                if (isNaN(scale)) {
                  console.error(
                    `CSS variable ${cssVariableName} is not a valid number. Using default value of ${INACTIVE_SLIDE_SCALE_RATIO}`
                  );
                  return INACTIVE_SLIDE_SCALE_RATIO;
                }

                return scale;
              },
              ease: "back",
              duration: 0.7,
            });
            gsap.to(childAnimationElementsArr, childElementsAnimationHiddenState);
            slideCard.classList.add("is-deactive");
          }
        }
      };

      const initializeSliderCards = (carouselApi: EmblaCarouselType, slideCards: HTMLElement[]) => {
        if (isInitialized) return;
        currentIndex = carouselApi.selectedScrollSnap();

        for (let i = 0; i < slideCards.length; i++) {
          const slideCard = slideCards[i]!;
          const details = getHtmlElement({
            selector: "[data-featured-details]",
            parent: slideCard,
          });

          const childAnimationElements: ChildAnimationElements = { details };

          childAnimationElementsMap.set(i, childAnimationElements);
        }

        selectCurrentSlide(currentIndex);
        isInitialized = true;
      };

      if (carouselApi && slideCards) {
        initializeSliderCards(carouselApi, slideCards);
      }

      carouselNode.addEventListener("embla:init", (event) => {
        carouselApi = event.detail.embla;
        slideCards = getMultipleHtmlElements({
          selector: "[data-carousel-card]",
          parent: carouselNode,
        });

        if (!slideCards) {
          console.error("Carousel cards not found during embla:init");
          return;
        }

        initializeSliderCards(carouselApi, slideCards);
      });

      carouselNode.addEventListener("embla:select", (event) => {
        carouselApi = event.detail.embla;

        currentIndex = carouselApi.selectedScrollSnap();

        selectCurrentSlide(currentIndex);
      });

      return carouselApi;
    };

    const carouselApi = initCarouselAnimation();

    if (!carouselApi) {
      console.error("Carousel API failed to initialize, scroll animation will not work");
      return;
    }

    const navbarHeightElement = getHtmlElement({ selector: "[data-navbar-height]" });

    if (!navbarHeightElement) {
      console.error("Navbar height element not found, scroll animation will not work");
      return;
    }

    const totalSlidesLength = carouselApi.slideNodes().length;
    let lastScrolledIndex = -1;

    ScrollTrigger.create({
      trigger: partnersScrollArea,
      start: () => {
        const navbarHeight = navbarHeightElement.getBoundingClientRect().height;
        const offset = (window.innerHeight - navbarHeight - carouselNode.offsetHeight) / 2;
        return `top ${navbarHeight + offset}px`;
      },
      end: () => {
        const navbarHeight = navbarHeightElement.getBoundingClientRect().height;
        const offset = (window.innerHeight - navbarHeight - carouselNode.offsetHeight) / 2;
        return `bottom ${window.innerHeight - offset}px`;
      },
      scrub: true,
      pin: carouselNode,
      onUpdate: (self) => {
        const targetIndex = Math.round(self.progress * (totalSlidesLength - 1));

        if (targetIndex !== lastScrolledIndex) {
          lastScrolledIndex = targetIndex;
          carouselApi.scrollTo(targetIndex, false);
        }
      },
    });
  }
};

afterWebflowReady(() => {
  initStickyCarouselScroll();
});
