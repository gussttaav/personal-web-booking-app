// Thin wrapper — the real implementation lives in ZoomRoomSession.tsx.
//
// The @zoom/videosdk package accesses browser globals (navigator, window) at
// MODULE EVALUATION time, so it MUST NOT be statically imported here.
// Using next/dynamic with ssr:false causes Next.js to skip module evaluation
// on the server entirely, which prevents "navigator is not defined" SSR crashes.

import dynamic from "next/dynamic";
import type { ZoomRoomInnerProps } from "./ZoomRoomSession";

export type ZoomRoomProps = ZoomRoomInnerProps;

const ZoomRoom = dynamic<ZoomRoomProps>(
  () => import("./ZoomRoomSession"),
  { ssr: false }
);

export default ZoomRoom;
