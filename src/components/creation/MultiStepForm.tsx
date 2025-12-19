import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  CORAL_LIGHT: "#FF9E7A",
  SOFT_GRAY: "#F8F9FA"
};

interface MultiStepFormProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  description?: string;
  children: ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  onSubmit?: () => void;
  nextDisabled?: boolean;
  isLoading?: boolean;
}

export const MultiStepForm = ({
  currentStep,
  totalSteps,
  title,
  description,
  children,
  onNext,
  onPrev,
  onSubmit,
  nextDisabled = false,
  isLoading = false,
}: MultiStepFormProps) => {
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;

  return (
    <Card className="w-full max-w-2xl mx-auto border-none shadow-2xl rounded-[40px] overflow-hidden bg-white">
      <CardHeader className="bg-slate-50/50 pb-8 border-b border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Process Detail
            </p>
            <CardTitle className="text-2xl font-black uppercase tracking-tighter text-slate-800">
              {title}
            </CardTitle>
          </div>
          <div 
            className="flex items-center justify-center h-12 w-12 rounded-2xl font-black text-sm shadow-sm border border-slate-200"
            style={{ color: COLORS.TEAL, backgroundColor: 'white' }}
          >
            {currentStep}/{totalSteps}
          </div>
        </div>
        
        {description && (
          <CardDescription className="text-xs font-bold uppercase tracking-tight text-slate-500 leading-relaxed">
            {description}
          </CardDescription>
        )}
        
        {/* Stylized Progress bar */}
        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-6 overflow-hidden">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ 
              width: `${(currentStep / totalSteps) * 100}%`,
              backgroundColor: COLORS.TEAL
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-8">
        <div className="min-h-[200px] animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </div>

        {/* Navigation buttons - Styled like the "Reserve Spot" button */}
        <div className="flex gap-4 pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onPrev}
            disabled={isFirstStep || isLoading}
            className="flex-1 py-7 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] border border-slate-200 hover:bg-slate-50 transition-all"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={nextDisabled || isLoading}
              className="flex-[2] py-7 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 border-none"
              style={{ 
                background: `linear-gradient(135deg, ${COLORS.CORAL_LIGHT} 0%, ${COLORS.CORAL} 100%)`,
                boxShadow: `0 8px 20px -6px ${COLORS.CORAL}88`
              }}
            >
              {isLoading ? "Processing..." : "Complete Booking"}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || isLoading}
              className="flex-[2] py-7 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 border-none"
              style={{ 
                background: `linear-gradient(135deg, ${COLORS.TEAL} 0%, #006666 100%)`,
                boxShadow: `0 8px 20px -6px ${COLORS.TEAL}88`
              }}
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};