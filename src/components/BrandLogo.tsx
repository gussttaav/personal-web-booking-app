import { useId } from "react";

/**
 * BrandLogo — the single source of truth for the GUSTAVOAI.DEV mark.
 *
 * The gradient id is generated per-instance via useId() so multiple logos
 * can render on the same page (e.g. Navbar + Footer) without the
 * `url(#id)` fill references colliding.
 */
export default function BrandLogo({
  size = 20,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const gradientId = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 28 28"
      aria-hidden="true"
      className={className}
      style={{ flexShrink: 0, ...style }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4edea3" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        fillRule="evenodd"
        d="M21.8844 14.4497c-.4575-.1116-1.8449-.06-2.3983-.06h-1.0193l-.9593.06h-2.5782l-1.0192.0599h-1.7987c-.2045 0-.6032.0366-.7609-.0959-.1613-.1361-.1379-.3729-.1385-.5636v-1.9786c0-.1943-.0288-.6781.0612-.8304.1187-.2009.3351-.1877.5384-.1889h1.0792l.8994-.0599h12.7109c.2386 0 .7009-.054.8634.1385.1163.1379.0923.3525.0965.521l.0593.8394.0576 1.0792c-.0258.4893-.3975.7015-.7171 1.0193l-1.9786 1.9186-2.5781 2.4607-2.6981 2.6333-2.9979 2.8803-2.4582 2.3384c-.2129.2122-.6182.7279-.9539.6127-.2069-.0707-.6805-.6643-.8478-.8526l-2.0523-2.3383-7.0672-8.0342-2.458263-2.7977c-.170878-.1943-.6979014-.7027-.666124-.9569.017987-.1463.160685-.2746.260814-.3711l.834003-.7357L4.3169 8.44911l6.8351-5.91837 1.5589-1.35443c.2266-.19666.0229-.04193.2891-.14686.2272-.089335 1.7332-.032454 2-.029456h.5l1 .000004L17.5 1c.3106.0012.8805-.046088 1.1916.02946-.1259.42809-.5737.74946-.8993 1.03606l-1.9186 1.73876-3.4776 3.16094-3.47747 3.16098L7 11.8715c-.18887.1709-.75546.6332-.82441.8496-.06715.2105-.33995.3801-.21464.5294l1.29687 1.499 4.68268 5.3961 1.147 1.3191c.1193.1343.3219.3825.5228.3567.1541-.0204.5306-.3711.6595-.4862l1.4989-1.3443 3.7773-3.366c.5636-.4958 1.9457-1.656 2.3384-2.1752"
      />
    </svg>
  );
}
