"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// Income bracket options for Indian context
const INCOME_BRACKETS = [
  { value: "below_250k", label: "Below ₹2.5 Lakhs" },
  { value: "250k_500k", label: "₹2.5 Lakhs - ₹5 Lakhs" },
  { value: "500k_750k", label: "₹5 Lakhs - ₹7.5 Lakhs" },
  { value: "750k_1000k", label: "₹7.5 Lakhs - ₹10 Lakhs" },
  { value: "1000k_1250k", label: "₹10 Lakhs - ₹12.5 Lakhs" },
  { value: "1250k_1500k", label: "₹12.5 Lakhs - ₹15 Lakhs" },
  { value: "above_1500k", label: "Above ₹15 Lakhs" },
];

export function KYCForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Personal Information (Step 1)
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  
  // Address Information (Step 2)
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  
  // Bank and Financial Information (Step 3)
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountType, setAccountType] = useState("");
  const [incomeBracket, setIncomeBracket] = useState("");

  // Validation functions
  const validateStep1 = () => {
    // Pan number validation (10 character alphanumeric)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber)) {
      setError("Invalid PAN number format. It should be 10 characters (e.g., ABCDE1234F)");
      return false;
    }

    // Aadhaar validation (12 digits)
    const aadhaarRegex = /^[0-9]{12}$/;
    if (!aadhaarRegex.test(aadhaarNumber)) {
      setError("Invalid Aadhaar number. It should be 12 digits");
      return false;
    }

    // Mobile number validation (10 digits)
    const mobileRegex = /^[6-9][0-9]{9}$/;
    if (!mobileRegex.test(mobileNumber)) {
      setError("Invalid mobile number. It should be 10 digits starting with 6-9");
      return false;
    }

    // Date of birth validation (must be 18+ years old)
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (age < 18 || (age === 18 && monthDiff < 0)) {
      setError("You must be at least 18 years old to create an account");
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    // Pincode validation (6 digits)
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(pincode)) {
      setError("Invalid pincode. It should be 6 digits");
      return false;
    }

    return true;
  };

  const validateStep3 = () => {
    // IFSC code validation
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifscCode)) {
      setError("Invalid IFSC code format");
      return false;
    }

    // Account number validation (minimum 9 digits, maximum 18)
    const accountRegex = /^[0-9]{9,18}$/;
    if (!accountRegex.test(accountNumber)) {
      setError("Invalid account number. It should be between 9-18 digits");
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    setError(null);
    
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!validateStep3()) {
      setIsSubmitting(false);
      return;
    }

    try {
      if (!user) {
        throw new Error("User is not authenticated");
      }

      // Format the data
      const kycData = {
        user_id: user.id,
        full_name: fullName,
        date_of_birth: dateOfBirth,
        pan_number: panNumber,
        aadhaar_number: aadhaarNumber,
        mobile_number: mobileNumber,
        address_line1: addressLine1,
        address_line2: addressLine2,
        city: city,
        state: state,
        pincode: pincode,
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        account_type: accountType,
        income_bracket: incomeBracket,
        status: "pending", // Initial KYC status (pending review)
        created_at: new Date().toISOString(),
      };

      // Since we're just mocking for now, we'll store this in localStorage
      localStorage.setItem('kyc_data', JSON.stringify(kycData));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to submit KYC information. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div
        className="w-full max-w-3xl mx-auto p-6 bg-card rounded-lg shadow-lg border border-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center py-10">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">KYC Submitted Successfully!</h2>
          <p className="text-muted-foreground mb-6">
            Your KYC information has been submitted for verification. We'll notify you once the verification is complete.
          </p>
          <p className="text-muted-foreground">
            You'll be redirected to the dashboard in a few seconds...
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-3xl mx-auto p-6 bg-card rounded-lg shadow-lg border border-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Complete Your KYC</h2>
        <p className="text-muted-foreground">
          As per regulatory requirements, we need to verify your identity before you can start trading.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Progress steps */}
      <div className="flex mb-8">
        <div className="flex items-center w-full">
          <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${
            currentStep >= 1 ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground text-muted-foreground"
          }`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? "bg-primary" : "bg-muted"}`}></div>
        </div>
        <div className="flex items-center w-full">
          <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${
            currentStep >= 2 ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground text-muted-foreground"
          }`}>
            2
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? "bg-primary" : "bg-muted"}`}></div>
        </div>
        <div className="flex items-center w-full">
          <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${
            currentStep >= 3 ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground text-muted-foreground"
          }`}>
            3
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name (as per PAN card)</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="panNumber">PAN Number</Label>
              <Input
                id="panNumber"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                required
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">10 character alphanumeric identifier</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
              <Input
                id="aadhaarNumber"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="123456789012"
                required
                maxLength={12}
              />
              <p className="text-xs text-muted-foreground">12-digit unique identifier</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                required
                maxLength={10}
              />
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button type="button" onClick={handleNextStep}>
                Next Step
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Address Information */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Address Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="House/Flat No., Building Name, Street"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Locality, Area"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
              />
            </div>
            
            <div className="pt-4 flex justify-between">
              <Button type="button" variant="outline" onClick={handlePrevStep}>
                Previous Step
              </Button>
              <Button type="button" onClick={handleNextStep}>
                Next Step
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Bank and Financial Information */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Bank & Financial Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input
                id="ifscCode"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="SBIN0000001"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={accountType}
                onValueChange={setAccountType}
                required
              >
                <SelectTrigger id="accountType">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="incomeBracket">Annual Income Bracket</Label>
              <Select
                value={incomeBracket}
                onValueChange={setIncomeBracket}
                required
              >
                <SelectTrigger id="incomeBracket">
                  <SelectValue placeholder="Select income bracket" />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_BRACKETS.map((bracket) => (
                    <SelectItem key={bracket.value} value={bracket.value}>
                      {bracket.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4 flex justify-between">
              <Button type="button" variant="outline" onClick={handlePrevStep}>
                Previous Step
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit KYC"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </motion.div>
  );
}