"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // Light: abu-abu lembut | Dark: lebih gelap
        "bg-muted/50 dark:bg-muted/30 text-muted-foreground dark:text-muted-foreground/80",
        "inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // default
        "text-muted-foreground dark:text-muted-foreground/80",
        // aktif
        "data-[state=active]:bg-card data-[state=active]:text-foreground dark:data-[state=active]:bg-muted dark:data-[state=active]:text-foreground",
        // style tambahan
        "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5",
        "rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap",
        "transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
