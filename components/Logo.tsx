export default function Logo({
  className = "",
  variant = "full",
}: {
  className?: string;
  variant?: "full" | "badge";
}) {
  // Use the actual logo image
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="702 Many Cards"
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
