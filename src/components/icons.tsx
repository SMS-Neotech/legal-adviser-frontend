import { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>Legal Advisor Logo</title>
      <path d="M10 3L8 21" />
      <path d="M14 3L16 21" />
      <path d="M3 10H21" />
      <path d="M3 14H21" />
    </svg>
  );
}
