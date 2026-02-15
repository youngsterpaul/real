import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Smartphone, Building2, Save, Loader2, CheckCircle } from "lucide-react";

interface WithdrawalDetailsSectionProps {
  userId: string;
}

export const WithdrawalDetailsSection = ({ userId }: WithdrawalDetailsSectionProps) => {
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      const { data } = await supabase
        .from("bank_details")
        .select("bank_name, account_number, account_holder_name")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (data) {
        setBankCode(data.bank_name || "");
        setAccountNumber(data.account_number || "");
        setAccountName(data.account_holder_name || "");
      }

      // Load mpesa from profile phone
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone_number")
        .eq("id", userId)
        .single();
      
      if (profile?.phone_number) {
        setMpesaNumber(profile.phone_number);
      }
      setLoaded(true);
    };
    fetchDetails();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save bank details
      if (bankCode || accountNumber || accountName) {
        const { data: existing } = await supabase
          .from("bank_details")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          await supabase.from("bank_details").update({
            bank_name: bankCode,
            account_number: accountNumber,
            account_holder_name: accountName,
            last_updated: new Date().toISOString(),
          }).eq("user_id", userId);
        } else {
          await supabase.from("bank_details").insert({
            user_id: userId,
            bank_name: bankCode,
            account_number: accountNumber,
            account_holder_name: accountName,
          });
        }
      }

      // Save mpesa number to profile
      if (mpesaNumber) {
        await supabase.from("profiles").update({
          phone_number: mpesaNumber,
        }).eq("id", userId);
      }

      toast.success("Withdrawal details saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  return (
    <div className="bg-card rounded-xl p-4 border border-border mb-4">
      <h2 className="text-sm font-black uppercase tracking-tight text-foreground mb-1">Withdrawal Details</h2>
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Set your M-Pesa & bank info for payouts</p>
      
      <div className="space-y-4">
        {/* M-Pesa */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Smartphone className="h-3 w-3" /> M-Pesa Number
          </Label>
          <Input
            type="tel"
            value={mpesaNumber}
            onChange={(e) => setMpesaNumber(e.target.value)}
            placeholder="e.g. 0712345678"
            className="rounded-lg h-10 text-sm"
          />
        </div>

        {/* Bank */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Building2 className="h-3 w-3" /> Bank Name
          </Label>
          <Input
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            placeholder="e.g. Equity, KCB"
            className="rounded-lg h-10 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account No.</Label>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Account number"
              className="rounded-lg h-10 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account Name</Label>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Holder name"
              className="rounded-lg h-10 text-sm"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} size="sm" className="rounded-lg text-[9px] font-bold uppercase h-8 px-4 w-full">
          {saving ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Saving...</> : <><Save className="h-3 w-3 mr-1" /> Save Details</>}
        </Button>
      </div>
    </div>
  );
};
