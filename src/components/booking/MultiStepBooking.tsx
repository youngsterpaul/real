import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Users, Loader2, CreditCard } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";

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
  payment_method: string;
  payment_phone: string;
  card_number: string;
  card_expiry: string;
  card_cvv: string;
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
}: MultiStepBookingProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>({
    visit_date: "",
    num_adults: 1,
    num_children: 0,
    selectedFacilities: [],
    selectedActivities: [],
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    payment_method: "mpesa",
    payment_phone: "",
    card_number: "",
    card_expiry: "",
    card_cvv: "",
  });

  const totalSteps = 5; // Date, People, Facilities/Activities, Guest Info (if not logged in), Payment

  const handleNext = () => {
    if (currentStep === 1 && !formData.visit_date) return;
    if (currentStep === 2 && formData.num_adults === 0 && formData.num_children === 0) return;
    
    // Skip guest info step if user is logged in
    if (currentStep === 3 && user) {
      setCurrentStep(5);
    } else {
      setCurrentStep(Math.min(currentStep + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    // Skip guest info step when going back if user is logged in
    if (currentStep === 5 && user) {
      setCurrentStep(3);
    } else {
      setCurrentStep(Math.max(currentStep - 1, 1));
    }
  };

  const handleSubmit = async () => {
    await onSubmit(formData);
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
        selectedFacilities: [...formData.selectedFacilities, { ...facility, startDate: "", endDate: "" }],
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

  const updateFacilityDates = (name: string, field: 'startDate' | 'endDate', value: string) => {
    setFormData({
      ...formData,
      selectedFacilities: formData.selectedFacilities.map(f =>
        f.name === name ? { ...f, [field]: value } : f
      ),
    });
  };

  const calculateTotal = () => {
    let total = 0;
    
    // Entrance fees
    if (entranceType !== 'free') {
      total += (formData.num_adults * priceAdult) + (formData.num_children * priceChild);
    }
    
    // Facilities
    formData.selectedFacilities.forEach(f => {
      if (f.startDate && f.endDate) {
        const days = Math.ceil((new Date(f.endDate).getTime() - new Date(f.startDate).getTime()) / (1000 * 60 * 60 * 24));
        total += f.price * Math.max(days, 1);
      } else {
        total += f.price;
      }
    });
    
    // Activities
    formData.selectedActivities.forEach(a => {
      total += a.price * a.numberOfPeople;
    });
    
    return total;
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">Processing Payment...</p>
        <p className="text-sm text-muted-foreground">Please wait while we confirm your payment</p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-xl font-bold">Booking Confirmed!</p>
        <p className="text-sm text-muted-foreground text-center">Your booking has been successfully confirmed. You will receive a confirmation email shortly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-6">
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className={`h-2 flex-1 mx-1 rounded ${
              step <= currentStep ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Visit Date */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Select Visit Date</h3>
          </div>
          <div>
            <Label htmlFor="visit_date">Visit Date</Label>
            <Input
              id="visit_date"
              type="date"
              value={formData.visit_date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
              className="mt-2"
            />
          </div>
        </div>
      )}

      {/* Step 2: Number of People */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Number of Guests</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="adults">Adults</Label>
              <Input
                id="adults"
                type="number"
                min="0"
                value={formData.num_adults}
                onChange={(e) => setFormData({ ...formData, num_adults: parseInt(e.target.value) || 0 })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="children">Children</Label>
              <Input
                id="children"
                type="number"
                min="0"
                value={formData.num_children}
                onChange={(e) => setFormData({ ...formData, num_children: parseInt(e.target.value) || 0 })}
                className="mt-2"
              />
            </div>
          </div>
          <div className="mt-4 p-4 bg-muted rounded">
            <p className="text-sm font-medium">Preview:</p>
            <p className="text-sm text-muted-foreground">
              {formData.num_adults} Adult{formData.num_adults !== 1 ? 's' : ''}, {formData.num_children} Child{formData.num_children !== 1 ? 'ren' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Facilities & Activities */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Additional Services (Optional)</h3>
          
          {facilities.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Facilities</h4>
              <div className="space-y-3">
                {facilities.map((facility) => {
                  const selected = formData.selectedFacilities.find(f => f.name === facility.name);
                  return (
                    <div key={facility.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={!!selected}
                            onCheckedChange={() => toggleFacility(facility)}
                          />
                          <Label className="cursor-pointer">{facility.name}</Label>
                        </div>
                        <span className="text-sm font-medium">KES {facility.price}</span>
                      </div>
                      {selected && (
                        <div className="ml-6 grid grid-cols-2 gap-2">
                          <Input
                            type="date"
                            placeholder="Start Date"
                            value={selected.startDate || ""}
                            onChange={(e) => updateFacilityDates(facility.name, 'startDate', e.target.value)}
                          />
                          <Input
                            type="date"
                            placeholder="End Date"
                            value={selected.endDate || ""}
                            onChange={(e) => updateFacilityDates(facility.name, 'endDate', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activities.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Activities</h4>
              <div className="space-y-3">
                {activities.map((activity) => {
                  const selected = formData.selectedActivities.find(a => a.name === activity.name);
                  return (
                    <div key={activity.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={!!selected}
                            onCheckedChange={() => toggleActivity(activity)}
                          />
                          <Label className="cursor-pointer">{activity.name}</Label>
                        </div>
                        <span className="text-sm font-medium">KES {activity.price}</span>
                      </div>
                      {selected && (
                        <div className="ml-6">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Number of people"
                            value={selected.numberOfPeople}
                            onChange={(e) => updateActivityPeople(activity.name, parseInt(e.target.value) || 1)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-4 bg-muted rounded">
            <p className="text-sm font-medium">Preview:</p>
            <p className="text-sm text-muted-foreground">
              {formData.selectedFacilities.length} Facilit{formData.selectedFacilities.length !== 1 ? 'ies' : 'y'}, {formData.selectedActivities.length} Activit{formData.selectedActivities.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
        </div>
      )}

      {/* Step 4: Guest Information (if not logged in) */}
      {currentStep === 4 && !user && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Information</h3>
          <div>
            <Label htmlFor="guest_name">Full Name</Label>
            <Input
              id="guest_name"
              value={formData.guest_name}
              onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="guest_email">Email</Label>
            <Input
              id="guest_email"
              type="email"
              value={formData.guest_email}
              onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="guest_phone">Phone Number</Label>
            <Input
              id="guest_phone"
              type="tel"
              value={formData.guest_phone}
              onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
              className="mt-2"
            />
          </div>
        </div>
      )}

      {/* Step 5: Payment */}
      {currentStep === 5 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Payment Details</h3>
          </div>
          
          <div className="p-4 bg-muted rounded space-y-2">
            <p className="text-sm font-medium">Booking Summary:</p>
            <p className="text-sm text-muted-foreground">
              Visit Date: {formData.visit_date}
            </p>
            <p className="text-sm text-muted-foreground">
              Guests: {formData.num_adults} Adult{formData.num_adults !== 1 ? 's' : ''}, {formData.num_children} Child{formData.num_children !== 1 ? 'ren' : ''}
            </p>
            <p className="text-lg font-bold mt-2">Total: KES {calculateTotal()}</p>
          </div>

          <div>
            <Label>Payment Method</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                type="button"
                variant={formData.payment_method === "mpesa" ? "default" : "outline"}
                onClick={() => setFormData({ ...formData, payment_method: "mpesa" })}
              >
                M-Pesa
              </Button>
              <Button
                type="button"
                variant={formData.payment_method === "airtel" ? "default" : "outline"}
                onClick={() => setFormData({ ...formData, payment_method: "airtel" })}
              >
                Airtel
              </Button>
              <Button
                type="button"
                variant={formData.payment_method === "card" ? "default" : "outline"}
                onClick={() => setFormData({ ...formData, payment_method: "card" })}
              >
                Card
              </Button>
            </div>
          </div>

          {(formData.payment_method === "mpesa" || formData.payment_method === "airtel") && (
            <div>
              <Label htmlFor="payment_phone">Phone Number</Label>
              <Input
                id="payment_phone"
                type="tel"
                value={formData.payment_phone}
                onChange={(e) => setFormData({ ...formData, payment_phone: e.target.value })}
                placeholder="254XXXXXXXXX"
                className="mt-2"
              />
            </div>
          )}

          {formData.payment_method === "card" && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="card_number">Card Number</Label>
                <Input
                  id="card_number"
                  value={formData.card_number}
                  onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                  placeholder="1234 5678 9012 3456"
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="card_expiry">Expiry</Label>
                  <Input
                    id="card_expiry"
                    value={formData.card_expiry}
                    onChange={(e) => setFormData({ ...formData, card_expiry: e.target.value })}
                    placeholder="MM/YY"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="card_cvv">CVV</Label>
                  <Input
                    id="card_cvv"
                    value={formData.card_cvv}
                    onChange={(e) => setFormData({ ...formData, card_cvv: e.target.value })}
                    placeholder="123"
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4 mt-6 pt-6 border-t">
        {currentStep > 1 && (
          <Button type="button" variant="outline" onClick={handlePrevious}>
            Previous
          </Button>
        )}
        {currentStep < 5 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="ml-auto"
            disabled={
              (currentStep === 1 && !formData.visit_date) ||
              (currentStep === 2 && formData.num_adults === 0 && formData.num_children === 0)
            }
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            className="ml-auto"
            disabled={isProcessing}
          >
            Confirm Booking
          </Button>
        )}
      </div>
    </div>
  );
};
