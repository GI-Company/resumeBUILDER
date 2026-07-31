import { useEffect, useRef, useCallback } from 'react';
import { useResumeStore } from '../lib/store/useResumeStore';
import { useShallow } from 'zustand/react/shallow';

export function usePaginationEngine(containerRef: React.RefObject<HTMLElement | null>) {
  const store = useResumeStore(useShallow(state => ({
    design: state.design,
    sections: state.sections,
    experiences: state.experiences,
    educations: state.educations,
    skills: state.skills,
    projects: state.projects,
    publications: state.publications,
    awards: state.awards,
    summary: state.summary,
    name: state.name,
    contactLine: state.contactLine,
    footer: state.footer,
    manualBreaks: state.manualBreaks
  })));

  const calcPages = useCallback(() => {
    if (!containerRef.current) return;
    
    // Always fetch the freshest state from Zustand directly
    // This avoids stale closures and excessive dependency array re-renders
    const state = useResumeStore.getState();
    const { design, pageBreaks: prevBreaks, pageBreakElementIds: prevBreakIds, idToPageMap: prevIdToPageMap, gapHeights: prevGapHeights } = state;
    
    const resume = containerRef.current;
    const pageHeightPx = design.pageSize === "letter" ? 1056 : 1123;
    const marginPx = design.pageMarginTopBottom ?? design.pageMargin;
    const contentHeightPx = pageHeightPx - marginPx * 2;
    const resumeRect = resume.getBoundingClientRect();
    const scale = resumeRect.width / (design.pageSize === "letter" ? 816 : 794) || 1;
    const rawUnits = Array.from(
      resume.querySelectorAll("[data-page-break-id]"),
    ) as HTMLElement[];

    const seenIds = new Set<string>();
    const units = rawUnits.filter((el) => {
      const id = el.getAttribute("data-page-break-id");
      if (!id) return false;
      
      // Skip hidden duplicates (elements with display: none applied by our page assignment logic)
      if (el.getBoundingClientRect().height === 0) return false;
      
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    });

    if (units.length === 0) {
      state.updateLayout({
        pageBreaks: [],
        pageBreakElementIds: [],
        idToPageMap: {},
        gapHeights: {}
      });
      return;
    }

    const resumeTop = resumeRect.top / scale;

    const naturalCoords = units.map((el) => {
      const colKey = el.closest("[data-column]")?.getAttribute("data-column") || "default";
      const containerEl = el.closest(".physical-page-container") as HTMLElement | null;
      const containerPageIdx = parseInt(containerEl?.getAttribute("data-page-index") || "0", 10);
      const rect = el.getBoundingClientRect();
      const elHeight = rect.height / scale;

      const containerRect = containerEl ? containerEl.getBoundingClientRect() : null;
      const elPageTop = containerRect
        ? (rect.top - containerRect.top) / scale - marginPx
        : (rect.top - resumeRect.top) / scale - marginPx;

      const elTop = Math.max(0, containerPageIdx * contentHeightPx + elPageTop);
      const elBottom = elTop + elHeight;

      const id = el.getAttribute("data-page-break-id");

      return {
        el,
        id,
        colKey,
        rect,
        elTop,
        elBottom,
      };
    });

    const pageStartYMap: Record<string, number | null> = {};
    const pageStartYInitialMap: Record<string, number> = {};
    const currentPIdxTracker: Record<string, number> = {};
    const prevItemPerCol: Record<string, typeof naturalCoords[0] | null> = {};
    const currentIds = prevBreakIds;
    const breakStarts: { el: HTMLElement; id: string | null; colKey: string; elTop: number; elBottom: number }[] = [];
    
    naturalCoords.forEach((item) => {
      const { el, id, colKey, elTop, elBottom } = item;

      if (pageStartYMap[colKey] === undefined || pageStartYMap[colKey] === null) {
        pageStartYMap[colKey] = elTop;
        pageStartYInitialMap[colKey] = elTop;
        currentPIdxTracker[colKey] = 0;
        prevItemPerCol[colKey] = item;
        return;
      }

      const section = el.closest(".section");
      const isHeading = el.classList.contains("section-heading");
      const manualBreakHere =
        isHeading && section && section.classList.contains("manual-break");
      const prevItem = prevItemPerCol[colKey] ?? null;
      const coupledWithHeading =
        !isHeading &&
        prevItem &&
        prevItem.el.classList.contains("section-heading") &&
        prevItem.el.closest(".section") === section;

      const breakItem = coupledWithHeading ? prevItem : item;
      const checkTop = coupledWithHeading ? prevItem.elTop : elTop;
      const maxSafeBottom = currentPIdxTracker[colKey] === 0
        ? pageHeightPx - marginPx
        : pageStartYMap[colKey]! + contentHeightPx;
        
      const isCurrentlyBroken = breakItem.id && currentIds.includes(breakItem.id);
      const hysteresisBuffer = isCurrentlyBroken ? 15 : 0;
      const wouldOverflow = elBottom > (maxSafeBottom - hysteresisBuffer);

      // Prevent moving the very first section heading right below the top/header of page 1 onto page 2 (which leaves page 1 empty)
      const isFirstSectionHeadingUnderHeader =
        coupledWithHeading && currentPIdxTracker[colKey] === 0 && checkTop === pageStartYMap[colKey];

      if ((manualBreakHere || (wouldOverflow && !isFirstSectionHeadingUnderHeader)) && checkTop !== pageStartYMap[colKey]) {
        pageStartYMap[colKey] = checkTop;
        currentPIdxTracker[colKey] = (currentPIdxTracker[colKey] || 0) + 1;
        
        if (breakStarts.length === 0 || breakStarts[breakStarts.length - 1].el !== breakItem.el) {
          breakStarts.push({
            el: breakItem.el,
            id: breakItem.id,
            colKey: breakItem.colKey,
            elTop: breakItem.elTop,
            elBottom: breakItem.elBottom,
          });
        }
      }
      prevItemPerCol[colKey] = item;
    });

    const newBreakIds = breakStarts
      .map((item) => item.id)
      .filter(Boolean) as string[];

    const newIdToPageMap: Record<string, number> = {};
    const currentPIdxMap: Record<string, number> = {};
    units.forEach((el) => {
      const colKey = el.closest("[data-column]")?.getAttribute("data-column") || "default";
      if (currentPIdxMap[colKey] === undefined) {
        currentPIdxMap[colKey] = 0;
      }
      const id = el.getAttribute("data-page-break-id");
      if (!id) return;
      if (newBreakIds.includes(id)) {
        currentPIdxMap[colKey]++;
      }
      if (newIdToPageMap[id] === undefined) {
        newIdToPageMap[id] = currentPIdxMap[colKey];
      }
    });

    const newGapHeights: Record<string, { total: number; top: number }> = {};
    breakStarts.forEach((br, idx) => {
      const brId = br.id;
      if (!brId) return;

      const brIndex = naturalCoords.findIndex((item) => item.el === br.el);
      const prevItem = brIndex > 0 ? naturalCoords[brIndex - 1] : null;

      const prevActualBottomInPage = prevItem 
        ? (prevItem.rect.bottom / scale - resumeTop) 
        : marginPx;

      const sheetBottom = (idx + 1) * pageHeightPx + idx * 32;
      const topSpacer = Math.max(0, Math.round(sheetBottom - prevActualBottomInPage));
      const total = Math.round(topSpacer + 32 + marginPx);

      newGapHeights[brId] = { total, top: topSpacer };
    });

    const newBreaks = breakStarts.map((item) => {
      return Math.round(item.elTop - (pageStartYInitialMap[item.colKey ?? "default"] ?? 0));
    });

    // Smart comparison logic - only dispatch updates if values actually changed
    // This prevents React re-render loops
    const layoutUpdates: any = {};
    
    // Check pageBreaks
    if (
      prevBreaks.length !== newBreaks.length ||
      !prevBreaks.every((v, i) => Math.abs(v - newBreaks[i]) <= 2)
    ) {
      layoutUpdates.pageBreaks = newBreaks;
    }

    // Check pageBreakElementIds
    if (
      prevBreakIds.length !== newBreakIds.length ||
      !prevBreakIds.every((v, i) => v === newBreakIds[i])
    ) {
      layoutUpdates.pageBreakElementIds = newBreakIds;
    }

    // Check idToPageMap
    const mapKeys = Object.keys(newIdToPageMap);
    const prevMapKeys = Object.keys(prevIdToPageMap);
    if (
      mapKeys.length !== prevMapKeys.length ||
      mapKeys.some((k) => prevIdToPageMap[k] !== newIdToPageMap[k])
    ) {
      layoutUpdates.idToPageMap = newIdToPageMap;
    }

    // Check gapHeights
    const gapKeys = Object.keys(newGapHeights);
    const prevGapKeys = Object.keys(prevGapHeights);
    if (
      gapKeys.length !== prevGapKeys.length ||
      gapKeys.some((k) => 
        !prevGapHeights[k] ||
        Math.abs(prevGapHeights[k].total - newGapHeights[k].total) > 2 ||
        Math.abs(prevGapHeights[k].top - newGapHeights[k].top) > 2
      )
    ) {
      layoutUpdates.gapHeights = newGapHeights;
    }

    // Dispatch a single batched update to Zustand if anything changed!
    if (Object.keys(layoutUpdates).length > 0) {
      state.updateLayout(layoutUpdates);
    }
  }, []);

  // Set up the ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const debouncedCalc = () => {
      clearTimeout(timeoutId);
      // 100ms micro-batching debounce
      // This groups cascading reflows (e.g. word wrapping over 3 lines rapidly) into a single calc loop
      timeoutId = setTimeout(() => {
        calcPages();
      }, 100);
    };

    const observer = new ResizeObserver(() => {
      // Physical height/width of the DOM element changed! Fire the debounce.
      debouncedCalc();
    });

    observer.observe(containerRef.current);
    window.addEventListener("resize", debouncedCalc);
    
    // Initial run
    debouncedCalc();

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
      window.removeEventListener("resize", debouncedCalc);
    };
  }, [calcPages, containerRef]);

  // Trigger calculation when content that affects layout changes
  // We must do this because the container has a fixed height based on totalPages,
  // so ResizeObserver won't detect text wrapping or content changes within a page.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calcPages();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [
    calcPages,
    store.design.pageSize,
    store.design.pageMargin,
    store.design.pageMarginTopBottom,
    store.design.fontHeading,
    store.design.fontBody,
    store.design.lineHeight,
    store.design.scale,
    store.design.gap,
    store.sections,
    store.experiences,
    store.educations,
    store.skills,
    store.projects,
    store.publications,
    store.awards,
    store.summary,
    store.name,
    store.contactLine,
    store.footer,
    store.manualBreaks
  ]);
}
