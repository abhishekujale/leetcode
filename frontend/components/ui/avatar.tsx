import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: "sm" | "default" | "lg"
}

function Avatar({ className, src, alt, fallback, size = "default", ...props }: AvatarProps) {
  const [imageError, setImageError] = React.useState(false)

  const sizeClasses = {
    sm: "size-7 text-xs",
    default: "size-9 text-sm",
    lg: "size-12 text-base",
  }

  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt ?? "avatar"}
          className="aspect-square h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-muted font-medium uppercase text-muted-foreground">
          {fallback ? fallback.slice(0, 2) : "?"}
        </div>
      )}
    </div>
  )
}

export { Avatar }
