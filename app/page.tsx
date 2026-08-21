"use client";

import { useCallback, useEffect, useState } from "react";
import OnamPreloader from "./component/OnamPreloader";
import OnamHeroBanner from "./component/Onamherobanner";
import OnamProgramme from "./component/OnamProgramme";

/** One song for the whole page (preloader + hero share the same player). */
const BG_MUSIC = "/song/onam.mp4";

export default function Home() {
  const [ready, setReady] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const markReady = () => {
      if (!cancelled) setReady(true);
    };

    const fontsReady =
      typeof document !== "undefined" && "fonts" in document
        ? (document as Document & { fonts: FontFaceSet }).fonts.ready
        : Promise.resolve();

    fontsReady.then(markReady).catch(markReady);
    const fallback = window.setTimeout(markReady, 1500);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, []);

  const handleLoaderDone = useCallback(() => setIsLoaded(true), []);

  return (
    <main className="relative w-full">
      {/* Song starts here, under the loader, and continues into the hero */}
      <OnamPreloader
        ready={ready}
        minDuration={2600}
        maxDuration={6000}
        bgMusic={BG_MUSIC}
        onDone={handleLoaderDone}
      />

      <div aria-hidden={!isLoaded} className={isLoaded ? "" : "pointer-events-none"}>
        <OnamHeroBanner bgMusic={BG_MUSIC} />
      </div>

      <OnamProgramme />
    </main>
  );
}