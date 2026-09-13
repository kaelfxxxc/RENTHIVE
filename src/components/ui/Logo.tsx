import logoFull from "../../assets/rent-hive-logo.png";
import logoMark from "../../assets/rent-hive-mark.png";

interface LogoProps {
  /**
   * "full" is the stacked hive + "Rent Hive" lockup.
   * "mark" is the hive alone, for places too narrow for the wordmark to stay
   * legible — the collapsed sidebar rails.
   */
  variant?: "full" | "mark";
  /** Sizing classes. Height drives it; the width follows the aspect ratio. */
  className?: string;
  /**
   * Defaults to "RentHive". Pass "" where an adjacent element already names the
   * brand, so screen readers don't announce it twice.
   */
  alt?: string;
}

/**
 * The brand lockup, rendered from the same source artwork at every call site.
 *
 * The PNGs are transparent, so this reads correctly on both the white renter
 * surfaces and the navy admin/lessor sidebars.
 */
export function Logo({ variant = "full", className = "h-8", alt = "RentHive" }: LogoProps) {
  return (
    <img
      src={variant === "mark" ? logoMark : logoFull}
      alt={alt}
      // w-auto + object-contain keeps the lockup proportional at any height,
      // and shrink-0 stops a flex parent from squashing it.
      className={`w-auto object-contain shrink-0 ${className}`}
    />
  );
}
