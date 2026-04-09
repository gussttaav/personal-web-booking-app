// Thin wrapper — the real implementation lives in ZoomRoomSession.tsx.
//
// The @zoom/videosdk package accesses browser globals (navigator, window) at
// MODULE EVALUATION time, so it MUST NOT be statically imported here.
// Using next/dynamic with ssr:false causes Next.js to skip module evaluation
// on the server entirely, which prevents "navigator is not defined" SSR crashes.

import dynamic from "next/dynamic";
import type { ZoomRoomInnerProps } from "./ZoomRoomSession";

const ZoomRoom = dynamic<ZoomRoomInnerProps>(
  () => import("./ZoomRoomSession"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center h-full"
        style={{ background: "#0d0f10" }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: "#4edea3" }}
        />
      </div>
    ),
  }
);

export default ZoomRoom;
