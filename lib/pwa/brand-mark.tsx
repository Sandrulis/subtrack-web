/** Kopīgs SubTrack zīmola kvadrāts OG / PWA ikonām (ImageResponse). */
export function SubtrackBrandMark({
  letterSize = 36,
  boxSize = 72,
}: {
  letterSize?: number;
  boxSize?: number;
}) {
  return (
    <div
      style={{
        width: boxSize,
        height: boxSize,
        borderRadius: Math.round(boxSize * 0.25),
        background: "linear-gradient(145deg, #00a38d 0%, #008a78 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: letterSize,
        fontWeight: 700,
      }}
    >
      S
    </div>
  );
}
