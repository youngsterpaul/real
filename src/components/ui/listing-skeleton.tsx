import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface ListingSkeletonProps {
  compact?: boolean;
  className?: string;
}

const ListingSkeletonComponent = ({ compact = false, className }: ListingSkeletonProps) => {
  return (
    <Card className={cn(
      "group relative flex flex-row md:flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
      compact ? "h-auto" : "h-full",
      className
    )}>
      {/* Image */}
      <div className="relative w-[100px] sm:w-[120px] md:w-full flex-shrink-0 min-h-[120px] md:aspect-[16/9] md:min-h-0">
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        {/* Heart */}
        <Skeleton className="absolute top-2 right-2 h-8 w-8 rounded-full" />
      </div>

      {/* Content - matches ListingCard right side */}
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-4 min-w-0 gap-1.5">
        {/* Category + Urgency */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-20 rounded-sm" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <Skeleton className="h-4 w-11/12 rounded-sm" />
          <Skeleton className="h-4 w-7/12 rounded-sm" />
        </div>

        {/* Activities subtitle */}
        <Skeleton className="h-3 w-3/4 rounded-sm" />

        {/* Location */}
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3 rounded-sm flex-shrink-0" />
          <Skeleton className="h-3 w-28 rounded-sm" />
        </div>

        {/* Bottom row: Rating + Date + Price */}
        <div className="flex items-center justify-between gap-2 pt-1.5 mt-auto border-t border-border/50">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-10 rounded-sm" />
            <Skeleton className="h-3 w-14 rounded-sm" />
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <Skeleton className="h-4 w-16 rounded-sm" />
            <Skeleton className="h-2 w-10 rounded-sm" />
          </div>
        </div>
      </div>
    </Card>
  );
};

// Memoize to prevent unnecessary re-renders
export const ListingSkeleton = memo(ListingSkeletonComponent);

// Grid skeleton for displaying multiple loading cards - matches listing grid layout
export const ListingGridSkeleton = memo(({ count = 8, className }: { count?: number; className?: string }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ListingSkeleton key={i} />
      ))}
    </>
  );
});

// Horizontal scroll skeleton - matches the horizontal scroll containers
export const HorizontalScrollSkeleton = memo(({ count = 5 }: { count?: number }) => {
  return (
    <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide pl-1 pr-8 md:pl-2 md:pr-12">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[45vw] md:w-56">
          <ListingSkeleton compact />
        </div>
      ))}
    </div>
  );
});

// Page detail skeleton
export function DetailPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero image skeleton */}
      <Skeleton className="w-full h-[40vh] md:h-[50vh] rounded-none" />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Title and rating */}
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-3/4 rounded-none" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-none" />
              <Skeleton className="h-4 w-32 rounded-none" />
            </div>
          </div>
          <Skeleton className="h-10 w-24 rounded-none" />
        </div>
        
        {/* Quick navigation shortcuts (mobile) */}
        <div className="flex gap-3 md:hidden">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
        
        {/* Description */}
        <div className="space-y-3 p-6 rounded-3xl border border-slate-100 bg-white">
          <Skeleton className="h-4 w-24 rounded-none" />
          <Skeleton className="h-4 w-full rounded-none" />
          <Skeleton className="h-4 w-full rounded-none" />
          <Skeleton className="h-4 w-3/4 rounded-none" />
        </div>
        
        {/* Operating hours (mobile) */}
        <div className="md:hidden space-y-3 p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24 rounded-none" />
            <Skeleton className="h-3 w-32 rounded-none" />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Skeleton className="h-4 w-16 rounded-none" />
            <Skeleton className="h-4 w-20 rounded-none" />
            <Skeleton className="h-4 w-16 rounded-none" />
          </div>
        </div>
        
        {/* Amenities section */}
        <div className="space-y-3 p-6 rounded-3xl border border-slate-100 bg-white">
          <Skeleton className="h-5 w-24 rounded-none" />
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            <Skeleton className="h-4 w-full rounded-none" />
            <Skeleton className="h-4 w-full rounded-none" />
            <Skeleton className="h-4 w-3/4 rounded-none" />
            <Skeleton className="h-4 w-2/3 rounded-none" />
          </div>
        </div>
        
        {/* Facilities section */}
        <div className="space-y-3 p-6 rounded-3xl border border-slate-100 bg-white">
          <Skeleton className="h-6 w-32 rounded-none" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-20 rounded-xl" />
          </div>
        </div>
        
        {/* Booking section */}
        <div className="space-y-4 p-6 rounded-[32px] border border-slate-100 bg-white shadow-xl">
          <Skeleton className="h-6 w-24 rounded-none" />
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <Skeleton className="h-3 w-16 rounded-none" />
              <Skeleton className="h-8 w-32 rounded-none" />
            </div>
            <div className="text-right">
              <Skeleton className="h-6 w-16 rounded-none" />
              <Skeleton className="h-3 w-20 rounded-none" />
            </div>
          </div>
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
