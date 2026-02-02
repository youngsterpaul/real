// src/components/MultiStepBooking.tsx
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Users, Loader2, CheckCircle2, Phone, CreditCard, X, AlertTriangle, Check, ChevronRight, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PaymentStatusDialog } from "./PaymentStatusDialog";
import { usePaystackPayment } from "@/hooks/usePaystackPayment";
import { cn } from "@/lib/utils";
import { useRealtimeItemAvailability } from "@/hooks/useRealtimeBookings";
import { useFacilityRangeAvailability } from "@/hooks/useDateRangeAvailability";

interface Facility {
    name: string;
    price: number;
    capacity?: number;
}

interface Activity {
    name: string;
    price: number;
}

interface MultiStepBookingProps {
    onSubmit: (data: BookingFormData) => Promise<void>;
    facilities?: Facility[];
    activities?: Activity[];
    priceAdult?: number;
    priceChild?: number;
    entranceType?: string;
    isProcessing?: boolean;
    isCompleted?: boolean;
    itemName: string;
    skipDateSelection?: boolean;
    fixedDate?: string;
    skipFacilitiesAndActivities?: boolean;
    itemId?: string;
    bookingType?: string;
    hostId?: string;
    onPaymentSuccess?: () => void;
    primaryColor?: string;
    accentColor?: string;
    totalCapacity?: number;
    slotLimitType?: 'inventory' | 'per_booking';
    isFlexibleDate?: boolean;
    workingDays?: string[];
}

export interface BookingFormData {
    visit_date: string;
    num_adults: number;
    num_children: number;
    selectedFacilities: Array<{ name: string; price: number; capacity?: number; startDate?: string; endDate?: string }>;
    selectedActivities: Array<{ name: string; price: number; numberOfPeople: number }>;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    mpesa_phone: string;
}

export const MultiStepBooking = ({
    onSubmit,
    facilities = [],
    activities = [],
    priceAdult = 0,
    priceChild = 0,
    entranceType = "paid",
    isProcessing = false,
    isCompleted = false,
    itemName,
    skipDateSelection = false,
    fixedDate = "",
    skipFacilitiesAndActivities = false,
    itemId = "",
    bookingType = "",
    hostId = "",
    onPaymentSuccess,
    primaryColor = "#008080",
    accentColor = "#FF7F50",
    totalCapacity = 0,
    slotLimitType = 'inventory',
    isFlexibleDate = false,
    workingDays = [],
}: MultiStepBookingProps) => {
    const { user } = useAuth();
    
    const { remainingSlots, isSoldOut } = useRealtimeItemAvailability(
        slotLimitType === 'inventory' ? (itemId || undefined) : undefined, 
        slotLimitType === 'inventory' ? totalCapacity : 0
    );
    
    const { checkFacilityAvailability, loading: checkingFacility } = useFacilityRangeAvailability(itemId || undefined);
    const [facilityAvailabilityStatus, setFacilityAvailabilityStatus] = useState<Record<string, { isAvailable: boolean; message: string | null }>>({});
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    const hasFacilities = facilities.filter(f => f.price > 0).length > 0;
    const hasActivities = activities.filter(a => a.price > 0).length > 0;
    
    const baseSteps = skipDateSelection ? 1 : 2;
    const facilityStep = !skipFacilitiesAndActivities && hasFacilities ? 1 : 0;
    const activityStep = !skipFacilitiesAndActivities && hasActivities ? 1 : 0;
    const totalSteps = baseSteps + facilityStep + activityStep + 1;
    
    const dateStepNum = skipDateSelection ? 0 : 1;
    const guestsStepNum = skipDateSelection ? 1 : 2;
    const facilitiesStepNum = !skipFacilitiesAndActivities && hasFacilities ? guestsStepNum + 1 : 0;
    const activitiesStepNum = !skipFacilitiesAndActivities && hasActivities 
        ? (facilitiesStepNum > 0 ? facilitiesStepNum + 1 : guestsStepNum + 1) 
        : 0;
    const summaryStepNum = totalSteps;
    
    const [currentStep, setCurrentStep] = useState(skipDateSelection ? 2 : 1);
    const [formData, setFormData] = useState<BookingFormData>({
        visit_date: skipDateSelection ? fixedDate : "",
        num_adults: 1,
        num_children: 0,
        selectedFacilities: [],
        selectedActivities: [],
        guest_name: "",
        guest_email: user?.email || "",
        guest_phone: "",
        mpesa_phone: "",
    });

    const [paymentSucceeded, setPaymentSucceeded] = useState(false);
    const [isCardPaymentLoading, setIsCardPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const { 
        initiatePayment: initiateCardPayment, 
        isLoading: isPaystackLoading,
        resetPayment: resetCardPayment 
    } = usePaystackPayment({
        onSuccess: (reference) => {
            console.log('✅ Card payment succeeded:', reference);
            setPaymentSucceeded(true);
            if (onPaymentSuccess) {
                onPaymentSuccess();
            }
        },
        onError: (error) => {
            console.log('❌ Card payment failed:', error);
            setIsCardPaymentLoading(false);
            setPaymentError(error);
        },
    });

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('name, email, phone_number')
                    .eq('id', user.id)
                    .single();
                
                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        guest_name: profile.name || "",
                        guest_email: profile.email || user.email || "",
                        guest_phone: profile.phone_number || "",
                    }));
                }
            }
        };
        
        fetchUserProfile();
    }, [user]);

    const areFacilityDatesValid = () => {
        return formData.selectedFacilities.every(f => {
            if (!f.startDate || !f.endDate) return false; 
            const start = new Date(f.startDate).getTime();
            const end = new Date(f.endDate).getTime();
            if (end < start) return false;
            const status = facilityAvailabilityStatus[f.name];
            if (status && !status.isAvailable) return false;
            return true;
        });
    };
    
    const hasAvailabilityConflict = () => {
        return Object.values(facilityAvailabilityStatus).some(status => !status.isAvailable);
    };

    const hasBookingItems = () => {
        const totalGuests = formData.num_adults + formData.num_children;
        if (totalGuests > 0) return true;
        if (formData.selectedFacilities.length > 0) return true;
        if (formData.selectedActivities.length > 0) return true;
        return false;
    };

    const handleNext = () => {
        if (currentStep === dateStepNum && !formData.visit_date && !skipDateSelection) return;
        if (currentStep === guestsStepNum && formData.num_adults === 0 && formData.num_children === 0) return;
        if (currentStep === facilitiesStepNum && facilitiesStepNum > 0 && formData.selectedFacilities.length > 0 && !areFacilityDatesValid()) {
            return;
        }
        setCurrentStep(Math.min(currentStep + 1, totalSteps));
    };

    const handlePrevious = () => {
        const minStep = skipDateSelection ? guestsStepNum : dateStepNum;
        setCurrentStep(Math.max(currentStep - 1, minStep));
    };

    const handleSubmit = async () => {
        const totalAmount = calculateTotal();
        
        if (totalAmount === 0) {
            await onSubmit(formData);
            if (onPaymentSuccess) onPaymentSuccess();
            return;
        }
        
        const bookingData = {
            item_id: itemId,
            booking_type: bookingType,
            total_amount: totalAmount,
            booking_details: {
                adults: formData.num_adults,
                children: formData.num_children,
                selectedFacilities: formData.selectedFacilities,
                selectedActivities: formData.selectedActivities,
            },
            user_id: user?.id || null,
            is_guest_booking: !user,
            guest_name: formData.guest_name,
            guest_email: formData.guest_email,
            guest_phone: formData.guest_phone || undefined,
            visit_date: formData.visit_date,
            slots_booked: formData.num_adults + formData.num_children,
            host_id: hostId,
            emailData: {
                itemName,
            },
        };

        setIsCardPaymentLoading(true);
        await initiateCardPayment(
            formData.guest_email || user?.email || '',
            totalAmount,
            bookingData
        );
    };

    const toggleFacility = (facility: Facility) => {
        const exists = formData.selectedFacilities.find(f => f.name === facility.name);
        if (exists) {
            setFormData({
                ...formData,
                selectedFacilities: formData.selectedFacilities.filter(f => f.name !== facility.name),
            });
        } else {
            setFormData({
                ...formData,
                selectedFacilities: [
                    ...formData.selectedFacilities, 
                    { ...facility, startDate: "", endDate: "" }
                ],
            });
        }
    };

    const toggleActivity = (activity: Activity) => {
        const exists = formData.selectedActivities.find(a => a.name === activity.name);
        if (exists) {
            setFormData({
                ...formData,
                selectedActivities: formData.selectedActivities.filter(a => a.name !== activity.name),
            });
        } else {
            setFormData({
                ...formData,
                selectedActivities: [...formData.selectedActivities, { ...activity, numberOfPeople: 1 }],
            });
        }
    };

    const updateActivityPeople = (name: string, count: number) => {
        setFormData({
            ...formData,
            selectedActivities: formData.selectedActivities.map(a =>
                a.name === name ? { ...a, numberOfPeople: Math.max(1, count) } : a
            ),
        });
    };

    const updateFacilityDates = useCallback((name: string, field: 'startDate' | 'endDate', value: string) => {
        setFormData(prev => {
            const updated = {
                ...prev,
                selectedFacilities: prev.selectedFacilities.map(f =>
                    f.name === name ? { ...f, [field]: value } : f
                ),
            };
            
            const facility = updated.selectedFacilities.find(f => f.name === name);
            if (facility?.startDate && facility?.endDate) {
                setCheckingAvailability(true);
                const result = checkFacilityAvailability(name, facility.startDate, facility.endDate);
                setFacilityAvailabilityStatus(prevStatus => ({
                    ...prevStatus,
                    [name]: { isAvailable: result.isAvailable, message: result.conflictMessage }
                }));
                setCheckingAvailability(false);
            } else {
                setFacilityAvailabilityStatus(prevStatus => {
                    const newStatus = { ...prevStatus };
                    delete newStatus[name];
                    return newStatus;
                });
            }
            
            return updated;
        });
    }, [checkFacilityAvailability]);

    const calculateTotal = () => {
        let total = 0;
        
        if (entranceType !== 'free') {
            total += (formData.num_adults * priceAdult) + (formData.num_children * priceChild);
        }
        
        formData.selectedFacilities.forEach(f => {
            if (f.startDate && f.endDate) {
                const start = new Date(f.startDate).getTime();
                const end = new Date(f.endDate).getTime();
                if (end >= start) {
                    const dayDifferenceMs = end - start;
                    const days = Math.ceil(dayDifferenceMs / (1000 * 60 * 60 * 24));
                    total += f.price * Math.max(days, 1);
                }
            } 
        });
        
        formData.selectedActivities.forEach(a => {
            total += a.price * a.numberOfPeople;
        });
        
        return total;
    };

    if (isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 min-h-[300px] bg-gradient-to-br from-slate-50 to-white">
                <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin opacity-20" style={{ color: primaryColor }} />
                    <Sparkles className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ color: primaryColor }} />
                </div>
                <p className="text-xl font-bold tracking-tight" style={{ color: primaryColor }}>Processing Your Booking</p>
                <p className="text-sm text-slate-400">Just a moment...</p>
            </div>
        );
    }

    const total = calculateTotal();
    const requestedSlots = formData.num_adults + formData.num_children;
    const insufficientSlots = slotLimitType === 'inventory' 
        ? (totalCapacity > 0 && requestedSlots > remainingSlots)
        : (totalCapacity > 0 && requestedSlots > totalCapacity);
    const isGloballySoldOut = slotLimitType === 'inventory' && isSoldOut && totalCapacity > 0;

    const stepTitles = [
        { num: dateStepNum, title: "When", subtitle: "Choose your date" },
        { num: guestsStepNum, title: "Who", subtitle: "Select guests" },
        { num: facilitiesStepNum, title: "Where", subtitle: "Pick facilities" },
        { num: activitiesStepNum, title: "What", subtitle: "Add activities" },
        { num: summaryStepNum, title: "Confirm", subtitle: "Review & pay" },
    ].filter(s => s.num > 0);

    return (
        <div className="relative flex flex-col bg-white overflow-hidden max-h-[90vh] sm:max-h-[85vh]" 
             style={{ 
                 boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                 background: `linear-gradient(135deg, ${primaryColor}08 0%, white 50%, ${accentColor}08 100%)`
             }}>
            
            {/* Decorative Header Bar */}
            <div className="h-2 w-full" style={{ 
                background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` 
            }} />

            {/* Sold Out Banner */}
            {isGloballySoldOut && (
                <div className="px-4 sm:px-6 py-4 bg-red-500 text-white flex items-center gap-3 animate-in slide-in-from-top">
                    <AlertTriangle className="h-6 w-6 flex-shrink-0" />
                    <div>
                        <p className="font-bold text-sm sm:text-base">Fully Booked</p>
                        <p className="text-xs opacity-90">All slots reserved. Please choose another option.</p>
                    </div>
                </div>
            )}

            {/* Main Header */}
            <div className="relative px-6 sm:px-8 pt-8 sm:pt-10 pb-6 sm:pb-8 flex-shrink-0 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5" style={{ 
                    backgroundImage: `radial-gradient(circle at 2px 2px, ${primaryColor} 1px, transparent 0)`,
                    backgroundSize: '32px 32px'
                }} />
                
                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-2 leading-none tracking-tight" 
                                style={{ 
                                    color: primaryColor,
                                    fontFamily: '"Space Mono", "Courier New", monospace'
                                }}>
                                Reserve
                            </h1>
                            <p className="text-base sm:text-lg text-slate-600 font-medium max-w-md">{itemName}</p>
                        </div>
                        
                        {isFlexibleDate && (
                            <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                                <Sparkles className="h-3 w-3" />
                                Flexible
                            </div>
                        )}
                    </div>
                    
                    {/* Step Indicator - Horizontal pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {stepTitles.map((step, index) => (
                            <div key={step.num} className="flex items-center gap-2 flex-shrink-0">
                                <div className={cn(
                                    "px-4 py-2 rounded-full transition-all duration-300 border-2",
                                    currentStep === step.num 
                                        ? "border-current shadow-lg scale-105"
                                        : currentStep > step.num 
                                        ? "border-transparent opacity-50"
                                        : "border-transparent opacity-30"
                                )}
                                style={{
                                    backgroundColor: currentStep >= step.num ? primaryColor : '#e2e8f0',
                                    color: currentStep >= step.num ? 'white' : '#64748b'
                                }}>
                                    <p className="text-xs font-black">{step.title}</p>
                                </div>
                                {index < stepTitles.length - 1 && (
                                    <ChevronRight className="h-4 w-4 text-slate-300" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-6 space-y-8">
                
                {/* Step 1: Visit Date */}
                {currentStep === dateStepNum && !skipDateSelection && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" 
                                     style={{ backgroundColor: primaryColor }}>
                                    <Calendar className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black" style={{ color: primaryColor }}>
                                        Pick Your Date
                                    </h2>
                                    <p className="text-sm text-slate-500">When would you like to visit?</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm border-2 p-6 rounded-3xl shadow-xl" 
                             style={{ borderColor: `${primaryColor}40` }}>
                            <Label htmlFor="visit_date" className="text-sm font-bold text-slate-700 mb-3 block">
                                Select Date
                            </Label>
                            <Input
                                id="visit_date"
                                type="date"
                                value={formData.visit_date}
                                min={new Date().toISOString().split('T')[0]} 
                                onChange={(e) => {
                                    const selectedDate = e.target.value;
                                    if (workingDays.length > 0 && selectedDate) {
                                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                        const dayOfWeek = dayNames[new Date(selectedDate).getDay()];
                                        const isWorkingDay = workingDays.some(d => 
                                            d.toLowerCase().startsWith(dayOfWeek.toLowerCase()) ||
                                            dayOfWeek.toLowerCase().startsWith(d.toLowerCase().substring(0, 3))
                                        );
                                        if (!isWorkingDay) return;
                                    }
                                    setFormData({ ...formData, visit_date: selectedDate });
                                }}
                                className="h-14 text-lg font-semibold rounded-2xl border-2 focus:ring-4 transition-all"
                                style={{ 
                                    borderColor: formData.visit_date ? primaryColor : '#e2e8f0',
                                    '--tw-ring-color': `${primaryColor}40` 
                                } as any}
                            />
                            {!formData.visit_date && (
                                <p className="text-sm text-red-500 mt-3 font-medium flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Please select a date to continue
                                </p>
                            )}
                            {workingDays.length > 0 && (
                                <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                                    <p className="text-xs font-bold text-slate-600 mb-1">Available Days</p>
                                    <p className="text-sm text-slate-700">{workingDays.join(' • ')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Number of Guests */}
                {currentStep === guestsStepNum && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" 
                                 style={{ backgroundColor: primaryColor }}>
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black" style={{ color: primaryColor }}>
                                    Guest Count
                                </h2>
                                <p className="text-sm text-slate-500">How many people are coming?</p>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {/* Adults */}
                            <div className="bg-white/80 backdrop-blur-sm border-2 p-6 rounded-3xl shadow-xl group hover:shadow-2xl transition-all"
                                 style={{ borderColor: `${primaryColor}40` }}>
                                <div className="flex items-center justify-between mb-4">
                                    <Label htmlFor="adults" className="text-lg font-black" style={{ color: primaryColor }}>
                                        Adults
                                    </Label>
                                    {entranceType !== 'free' && priceAdult > 0 && (
                                        <span className="text-sm font-bold px-3 py-1 rounded-full" 
                                              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                            KES {priceAdult.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                <Input
                                    id="adults"
                                    type="number"
                                    min="0"
                                    max={slotLimitType === 'per_booking' ? totalCapacity : undefined}
                                    value={formData.num_adults}
                                    onChange={(e) => setFormData({ ...formData, num_adults: parseInt(e.target.value) || 0 })}
                                    className="h-16 text-3xl font-black text-center rounded-2xl border-2"
                                    style={{ borderColor: primaryColor }}
                                />
                                <p className="text-xs text-slate-400 mt-2 text-center">18 years and older</p>
                            </div>

                            {/* Children */}
                            <div className="bg-white/80 backdrop-blur-sm border-2 p-6 rounded-3xl shadow-xl group hover:shadow-2xl transition-all"
                                 style={{ borderColor: `${primaryColor}40` }}>
                                <div className="flex items-center justify-between mb-4">
                                    <Label htmlFor="children" className="text-lg font-black" style={{ color: primaryColor }}>
                                        Children
                                    </Label>
                                    {entranceType !== 'free' && priceChild > 0 && (
                                        <span className="text-sm font-bold px-3 py-1 rounded-full" 
                                              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                            KES {priceChild.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                <Input
                                    id="children"
                                    type="number"
                                    min="0"
                                    max={slotLimitType === 'per_booking' ? totalCapacity : undefined}
                                    value={formData.num_children}
                                    onChange={(e) => setFormData({ ...formData, num_children: parseInt(e.target.value) || 0 })}
                                    className="h-16 text-3xl font-black text-center rounded-2xl border-2"
                                    style={{ borderColor: primaryColor }}
                                />
                                <p className="text-xs text-slate-400 mt-2 text-center">Under 18 years</p>
                            </div>
                        </div>

                        {/* Total Summary */}
                        <div className="p-6 rounded-3xl shadow-xl relative overflow-hidden"
                             style={{ 
                                 background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}15)`
                             }}>
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-slate-600 mb-2">Total Guests</p>
                                <p className="text-4xl font-black" style={{ color: primaryColor }}>
                                    {formData.num_adults + formData.num_children}
                                </p>
                                {(formData.num_adults === 0 && formData.num_children === 0) && (
                                    <p className="text-sm text-red-600 font-medium mt-2 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        At least one guest required
                                    </p>
                                )}
                                {insufficientSlots && (
                                    <p className="text-sm text-red-600 font-medium mt-2 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        {slotLimitType === 'per_booking' 
                                            ? `Maximum ${totalCapacity} guests allowed`
                                            : `Only ${remainingSlots} slots available`
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Facilities */}
                {currentStep === facilitiesStepNum && facilitiesStepNum > 0 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" 
                                 style={{ backgroundColor: primaryColor }}>
                                <CheckCircle2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black" style={{ color: primaryColor }}>
                                    Facilities
                                </h2>
                                <p className="text-sm text-slate-500">Optional rentals available</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {facilities.filter(f => f.price > 0).map((facility, index) => {
                                const selected = formData.selectedFacilities.find(f => f.name === facility.name);
                                const isDateInvalid = selected && (
                                    !selected.startDate || 
                                    !selected.endDate || 
                                    new Date(selected.endDate).getTime() < new Date(selected.startDate).getTime()
                                );

                                return (
                                    <div key={facility.name} 
                                         className="bg-white border-2 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all"
                                         style={{ 
                                             borderColor: selected ? primaryColor : '#e2e8f0',
                                             animationDelay: `${index * 100}ms`
                                         }}>
                                        <div className="p-5">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <Checkbox
                                                        id={`facility-${facility.name}`}
                                                        checked={!!selected}
                                                        onCheckedChange={() => toggleFacility(facility)}
                                                        className="mt-1 w-6 h-6 rounded-lg"
                                                    />
                                                    <div className="flex-1">
                                                        <Label htmlFor={`facility-${facility.name}`} 
                                                               className="text-lg font-bold cursor-pointer block mb-1"
                                                               style={{ color: primaryColor }}>
                                                            {facility.name}
                                                        </Label>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black" style={{ color: accentColor }}>
                                                        {facility.price.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-medium">KES per day</p>
                                                </div>
                                            </div>

                                            {selected && (
                                                <div className="mt-6 pt-6 border-t-2 border-dashed" style={{ borderColor: `${primaryColor}30` }}>
                                                    <p className="text-sm font-bold text-slate-700 mb-4">Rental Period</p>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label className="text-xs font-bold text-slate-500 mb-2 block">Start</Label>
                                                            <Input
                                                                type="date"
                                                                value={selected.startDate || ""}
                                                                onChange={(e) => updateFacilityDates(facility.name, 'startDate', e.target.value)}
                                                                min={formData.visit_date || new Date().toISOString().split('T')[0]}
                                                                className="h-12 rounded-xl border-2"
                                                                style={{ borderColor: primaryColor }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs font-bold text-slate-500 mb-2 block">End</Label>
                                                            <Input
                                                                type="date"
                                                                value={selected.endDate || ""}
                                                                onChange={(e) => updateFacilityDates(facility.name, 'endDate', e.target.value)}
                                                                min={selected.startDate || formData.visit_date || new Date().toISOString().split('T')[0]}
                                                                className="h-12 rounded-xl border-2"
                                                                style={{ borderColor: primaryColor }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {isDateInvalid && (
                                                        <p className="text-sm text-red-500 mt-3 font-medium flex items-center gap-2">
                                                            <X className="h-4 w-4" />
                                                            Please select valid dates
                                                        </p>
                                                    )}

                                                    {selected.startDate && selected.endDate && !isDateInvalid && (
                                                        <div className={cn(
                                                            "flex items-center gap-2 mt-4 p-3 rounded-xl font-medium text-sm",
                                                            facilityAvailabilityStatus[facility.name]?.isAvailable === true 
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : facilityAvailabilityStatus[facility.name]?.isAvailable === false
                                                                ? "bg-red-50 text-red-700"
                                                                : "bg-slate-50 text-slate-500"
                                                        )}>
                                                            {checkingAvailability ? (
                                                                <><Loader2 className="h-4 w-4 animate-spin" /> Checking...</>
                                                            ) : facilityAvailabilityStatus[facility.name]?.isAvailable === true ? (
                                                                <><Check className="h-4 w-4" /> Available</>
                                                            ) : facilityAvailabilityStatus[facility.name]?.isAvailable === false ? (
                                                                <><X className="h-4 w-4" /> {facilityAvailabilityStatus[facility.name]?.message}</>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <p className="text-center text-sm text-slate-400 italic">Skip if not needed</p>
                    </div>
                )}

                {/* Step 4: Activities */}
                {currentStep === activitiesStepNum && activitiesStepNum > 0 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" 
                                 style={{ backgroundColor: accentColor }}>
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black" style={{ color: primaryColor }}>
                                    Activities
                                </h2>
                                <p className="text-sm text-slate-500">Enhance your experience</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {activities.filter(a => a.price > 0).map((activity, index) => {
                                const selected = formData.selectedActivities.find(a => a.name === activity.name);
                                return (
                                    <div key={activity.name}
                                         className="bg-white border-2 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all"
                                         style={{ 
                                             borderColor: selected ? accentColor : '#e2e8f0',
                                             animationDelay: `${index * 100}ms`
                                         }}>
                                        <div className="p-5">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <Checkbox
                                                        id={`activity-${activity.name}`}
                                                        checked={!!selected}
                                                        onCheckedChange={() => toggleActivity(activity)}
                                                        className="mt-1 w-6 h-6 rounded-lg"
                                                    />
                                                    <div className="flex-1">
                                                        <Label htmlFor={`activity-${activity.name}`}
                                                               className="text-lg font-bold cursor-pointer block"
                                                               style={{ color: primaryColor }}>
                                                            {activity.name}
                                                        </Label>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black" style={{ color: accentColor }}>
                                                        {activity.price.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-medium">KES per person</p>
                                                </div>
                                            </div>

                                            {selected && (
                                                <div className="mt-6 pt-6 border-t-2 border-dashed" style={{ borderColor: `${accentColor}30` }}>
                                                    <Label className="text-sm font-bold text-slate-700 mb-3 block">
                                                        Number of Participants
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={selected.numberOfPeople}
                                                        onChange={(e) => updateActivityPeople(activity.name, parseInt(e.target.value) || 1)}
                                                        className="h-14 text-2xl font-black text-center rounded-xl border-2 w-32"
                                                        style={{ borderColor: accentColor }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <p className="text-center text-sm text-slate-400 italic">Skip if not interested</p>
                    </div>
                )}

                {/* Final Step: Summary & Payment */}
                {currentStep === totalSteps && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {!user && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" 
                                         style={{ backgroundColor: primaryColor }}>
                                        <Users className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-black" style={{ color: primaryColor }}>
                                            Your Details
                                        </h2>
                                        <p className="text-sm text-slate-500">For booking confirmation</p>
                                    </div>
                                </div>

                                <div className="bg-white/80 backdrop-blur-sm border-2 p-6 rounded-3xl shadow-xl space-y-4"
                                     style={{ borderColor: `${primaryColor}40` }}>
                                    <div>
                                        <Label htmlFor="guest_name" className="text-sm font-bold text-slate-700 mb-2 block">
                                            Full Name
                                        </Label>
                                        <Input
                                            id="guest_name"
                                            placeholder="John Doe"
                                            value={formData.guest_name}
                                            onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                                            className="h-12 rounded-xl border-2 text-base"
                                            style={{ borderColor: primaryColor }}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="guest_email" className="text-sm font-bold text-slate-700 mb-2 block">
                                            Email Address
                                        </Label>
                                        <Input
                                            id="guest_email"
                                            type="email"
                                            placeholder="john@example.com"
                                            value={formData.guest_email}
                                            onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                                            className="h-12 rounded-xl border-2 text-base"
                                            style={{ borderColor: primaryColor }}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="guest_phone" className="text-sm font-bold text-slate-700 mb-2 block">
                                            Phone (Optional)
                                        </Label>
                                        <Input
                                            id="guest_phone"
                                            type="tel"
                                            placeholder="0712345678"
                                            value={formData.guest_phone}
                                            onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                                            className="h-12 rounded-xl border-2 text-base"
                                            style={{ borderColor: primaryColor }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Order Summary */}
                        <div className="bg-white border-2 rounded-3xl shadow-2xl overflow-hidden"
                             style={{ borderColor: primaryColor }}>
                            <div className="p-6 border-b-2" style={{ 
                                background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}10)`,
                                borderColor: `${primaryColor}20`
                            }}>
                                <h3 className="text-2xl font-black" style={{ color: primaryColor }}>
                                    Booking Summary
                                </h3>
                            </div>

                            <div className="p-6 space-y-4">
                                {formData.visit_date && (
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                        <span className="text-sm text-slate-600 font-medium">Visit Date</span>
                                        <span className="text-base font-bold text-slate-900">
                                            {new Date(formData.visit_date).toLocaleDateString('en-GB', { 
                                                day: 'numeric', 
                                                month: 'short', 
                                                year: 'numeric' 
                                            })}
                                        </span>
                                    </div>
                                )}

                                {formData.num_adults > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">
                                            {formData.num_adults} Adult{formData.num_adults > 1 ? 's' : ''}
                                        </span>
                                        <span className="text-base font-bold">
                                            KES {(formData.num_adults * priceAdult).toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                {formData.num_children > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">
                                            {formData.num_children} Child{formData.num_children > 1 ? 'ren' : ''}
                                        </span>
                                        <span className="text-base font-bold">
                                            KES {(formData.num_children * priceChild).toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                {formData.selectedFacilities.map(f => {
                                    if (!f.startDate || !f.endDate) return null;
                                    const days = Math.ceil((new Date(f.endDate).getTime() - new Date(f.startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;
                                    return (
                                        <div key={f.name} className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600">
                                                {f.name} <span className="text-xs">({days}d)</span>
                                            </span>
                                            <span className="text-base font-bold">
                                                KES {(f.price * days).toLocaleString()}
                                            </span>
                                        </div>
                                    );
                                })}

                                {formData.selectedActivities.map(a => (
                                    <div key={a.name} className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">
                                            {a.name} <span className="text-xs">×{a.numberOfPeople}</span>
                                        </span>
                                        <span className="text-base font-bold">
                                            KES {(a.price * a.numberOfPeople).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 border-t-2" style={{ 
                                background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}15)`,
                                borderColor: `${primaryColor}30`
                            }}>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-lg font-black" style={{ color: primaryColor }}>
                                        TOTAL
                                    </span>
                                    <span className="text-4xl font-black" style={{ color: accentColor }}>
                                        KES {total.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Badge */}
                        {total > 0 && (
                            <div className="flex items-center justify-center gap-3 p-4 rounded-2xl"
                                 style={{ backgroundColor: `${primaryColor}10` }}>
                                <CreditCard className="h-6 w-6" style={{ color: primaryColor }} />
                                <div>
                                    <p className="text-sm font-bold" style={{ color: primaryColor }}>Secure Payment via Paystack</p>
                                    <p className="text-xs text-slate-500">You'll be redirected to complete payment</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Fixed Footer Navigation */}
            <div className="flex-shrink-0 p-4 sm:p-6 bg-white border-t-2 border-slate-100">
                <div className="flex gap-3">
                    {currentStep > (skipDateSelection ? guestsStepNum : dateStepNum) && (
                        <Button
                            onClick={handlePrevious}
                            variant="outline"
                            className="flex-1 h-14 sm:h-16 rounded-2xl font-bold text-base border-2 hover:scale-[0.98] transition-transform"
                            style={{ borderColor: primaryColor, color: primaryColor }}
                        >
                            ← Back
                        </Button>
                    )}

                    {currentStep < totalSteps ? (
                        <Button
                            onClick={handleNext}
                            disabled={
                                (currentStep === dateStepNum && !formData.visit_date && !skipDateSelection) ||
                                (currentStep === guestsStepNum && (formData.num_adults === 0 && formData.num_children === 0)) ||
                                (currentStep === guestsStepNum && insufficientSlots) ||
                                (currentStep === facilitiesStepNum && formData.selectedFacilities.length > 0 && !areFacilityDatesValid()) ||
                                isGloballySoldOut
                            }
                            className="flex-1 h-14 sm:h-16 rounded-2xl font-bold text-base text-white shadow-lg hover:shadow-xl hover:scale-[0.98] transition-all disabled:opacity-50"
                            style={{ backgroundColor: primaryColor }}
                        >
                            Continue →
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={
                                isPaystackLoading || 
                                isCardPaymentLoading ||
                                isGloballySoldOut ||
                                insufficientSlots ||
                                (!user && (!formData.guest_name || !formData.guest_email))
                            }
                            className="flex-1 h-14 sm:h-16 rounded-2xl font-bold text-base text-white shadow-lg hover:shadow-xl hover:scale-[0.98] transition-all disabled:opacity-50"
                            style={{ backgroundColor: accentColor }}
                        >
                            {(isPaystackLoading || isCardPaymentLoading) ? (
                                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Processing</>
                            ) : total === 0 ? (
                                "Confirm Booking"
                            ) : (
                                `Pay KES ${total.toLocaleString()}`
                            )}
                        </Button>
                    )}
                </div>
            </div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-in-from-bottom-4 {
                    from { transform: translateY(1rem); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slide-in-from-top {
                    from { transform: translateY(-1rem); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-in {
                    animation: fade-in 0.3s ease-out, slide-in-from-bottom-4 0.5s ease-out;
                }
            `}</style>
        </div>
    );
};