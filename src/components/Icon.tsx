import type { SVGProps } from 'react'

const paths = {
  gift: <><path d="M20 12v10H4V12" /><path d="M2 7h20v5H2zM12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 1 1 2.5-2.5C10 6 12 7 12 7ZM12 7h4.5a2.5 2.5 0 1 0-2.5-2.5C14 6 12 7 12 7Z" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
  sparkles: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14ZM5 2l.8 2.2L8 5l-2.2.8L5 8l-.8-2.2L2 5l2.2-.8L5 2Z" /></>,
  snowflake: <><path d="M12 2v20M4.93 6l14.14 12M4.93 18 19.07 6" /><path d="m8 4 4 2 4-2M8 20l4-2 4 2M3 10l4-1 1-4m13 9-4 1-1 4M3 14l4 1 1 4m13-9-4-1-1-4" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  close: <path d="m18 6-12 12M6 6l12 12" />,
  arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
  lock: <><rect x="4" y="10" width="16" height="12" rx="2" /><path d="M8 10V6a4 4 0 1 1 8 0v4" /></>,
} satisfies Record<string, SVGProps<SVGPathElement>['d'] | React.ReactNode>

export type IconName = keyof typeof paths

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
