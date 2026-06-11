type IconName =
  | "cloud"
  | "rain"
  | "road"
  | "river"
  | "megaphone"
  | "shield"
  | "facebook"
  | "send"
  | "filter";

interface IconProps {
  name: IconName;
  className?: string;
}

const paths: Record<IconName, string> = {
  cloud:
    "M17.5 18H8a5 5 0 1 1 1.1-9.88A6.5 6.5 0 0 1 21 12.5 3.5 3.5 0 0 1 17.5 18Z",
  rain:
    "M17.5 15.5H8a4.5 4.5 0 1 1 1-8.89A6 6 0 0 1 20 10.5a3 3 0 0 1-2.5 5ZM8 20l1-2M12 21l1-3M16 20l1-2",
  road:
    "M9 21 11 3h2l2 18M4 21l5-18M20 21 15 3M11.5 8h1M11 13h2M10.5 18h3",
  river:
    "M4 7c3-3 5 3 8 0s5-3 8 0M4 13c3-3 5 3 8 0s5-3 8 0M4 19c3-3 5 3 8 0s5-3 8 0",
  megaphone:
    "M4 13h3l9 4V7l-9 4H4v2Zm3 0 1 5h3l-1-4M18 9l2-2M19 12h3M18 15l2 2",
  shield:
    "M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3Zm-3 9 2 2 4-5",
  facebook:
    "M14 8h2V4h-3a5 5 0 0 0-5 5v2H6v4h2v6h4v-6h3l1-4h-4V9a1 1 0 0 1 1-1Z",
  send:
    "M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z",
  filter:
    "M4 6h16M7 12h10M10 18h4",
};

export function Icon({ name, className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d={paths[name]} />
    </svg>
  );
}
