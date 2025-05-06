"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

// PAN Input with validation
export function PanInput({
  value,
  onChange,
  id = "panNumber",
  required = true,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
}) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isTouched, setIsTouched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    onChange(newValue);
    
    if (isTouched) {
      validatePan(newValue);
    }
  };

  const validatePan = (pan: string) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    setIsValid(panRegex.test(pan));
  };

  const handleBlur = () => {
    setIsTouched(true);
    validatePan(value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>PAN Number</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="ABCDE1234F"
          required={required}
          maxLength={10}
          className={`uppercase ${
            isTouched && isValid !== null
              ? isValid
                ? "border-green-500 focus-visible:ring-green-500"
                : "border-red-500 focus-visible:ring-red-500"
              : ""
          }`}
        />
        {isTouched && isValid !== null && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      {isTouched && isValid === false && (
        <p className="text-xs text-red-500">
          Invalid PAN format. It should be 10 characters (e.g., ABCDE1234F)
        </p>
      )}
      <p className="text-xs text-muted-foreground">10 character alphanumeric identifier</p>
    </div>
  );
}

// Aadhaar Input with validation
export function AadhaarInput({
  value,
  onChange,
  id = "aadhaarNumber",
  required = true,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
}) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isTouched, setIsTouched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, 12);
    onChange(newValue);
    
    if (isTouched) {
      validateAadhaar(newValue);
    }
  };

  const validateAadhaar = (aadhaar: string) => {
    const aadhaarRegex = /^[0-9]{12}$/;
    setIsValid(aadhaarRegex.test(aadhaar));
  };

  const handleBlur = () => {
    setIsTouched(true);
    validateAadhaar(value);
  };

  // Format with spaces for display (e.g., XXXX XXXX XXXX)
  const formattedValue = value
    .replace(/\D/g, '')
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Aadhaar Number</Label>
      <div className="relative">
        <Input
          id={id}
          value={formattedValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="XXXX XXXX XXXX"
          required={required}
          maxLength={14} // 12 digits + 2 spaces
          className={
            isTouched && isValid !== null
              ? isValid
                ? "border-green-500 focus-visible:ring-green-500"
                : "border-red-500 focus-visible:ring-red-500"
              : ""
          }
        />
        {isTouched && isValid !== null && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      {isTouched && isValid === false && (
        <p className="text-xs text-red-500">
          Invalid Aadhaar number. It should be 12 digits
        </p>
      )}
      <p className="text-xs text-muted-foreground">12-digit unique identifier</p>
    </div>
  );
}

// Mobile Number Input with validation
export function MobileInput({
  value,
  onChange,
  id = "mobileNumber",
  required = true,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
}) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isTouched, setIsTouched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(newValue);
    
    if (isTouched) {
      validateMobile(newValue);
    }
  };

  const validateMobile = (mobile: string) => {
    const mobileRegex = /^[6-9][0-9]{9}$/;
    setIsValid(mobileRegex.test(mobile));
  };

  const handleBlur = () => {
    setIsTouched(true);
    validateMobile(value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Mobile Number</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="9876543210"
          required={required}
          maxLength={10}
          type="tel"
          className={
            isTouched && isValid !== null
              ? isValid
                ? "border-green-500 focus-visible:ring-green-500"
                : "border-red-500 focus-visible:ring-red-500"
              : ""
          }
        />
        {isTouched && isValid !== null && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      {isTouched && isValid === false && (
        <p className="text-xs text-red-500">
          Invalid mobile number. It should be 10 digits starting with 6-9
        </p>
      )}
    </div>
  );
}

// Bank Account Input with validation
export function BankAccountInput({
  value,
  onChange,
  id = "accountNumber",
  required = true,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
}) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '');
    onChange(newValue);
    
    if (isTouched) {
      validateAccount(newValue);
    }
  };

  const validateAccount = (account: string) => {
    const accountRegex = /^[0-9]{9,18}$/;
    setIsValid(accountRegex.test(account));
  };

  const handleBlur = () => {
    setIsTouched(true);
    validateAccount(value);
  };

  // Mask the account number to show only last 4 digits
  const maskedValue = showAccount 
    ? value 
    : value.length > 4 
      ? '•'.repeat(value.length - 4) + value.slice(-4) 
      : value;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Account Number</Label>
      <div className="relative">
        <Input
          id={id}
          value={maskedValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter account number"
          required={required}
          type={showAccount ? "text" : "password"}
          className={
            isTouched && isValid !== null
              ? isValid
                ? "border-green-500 focus-visible:ring-green-500"
                : "border-red-500 focus-visible:ring-red-500"
              : ""
          }
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2"
          onClick={() => setShowAccount(!showAccount)}
        >
          {showAccount ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>
      {isTouched && isValid === false && (
        <p className="text-xs text-red-500">
          Invalid account number. It should be between 9-18 digits
        </p>
      )}
    </div>
  );
}

// IFSC Code Input with validation
export function IFSCInput({
  value,
  onChange,
  id = "ifscCode",
  required = true,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
}) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isTouched, setIsTouched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    onChange(newValue);
    
    if (isTouched) {
      validateIFSC(newValue);
    }
  };

  const validateIFSC = (ifsc: string) => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    setIsValid(ifscRegex.test(ifsc));
  };

  const handleBlur = () => {
    setIsTouched(true);
    validateIFSC(value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>IFSC Code</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="SBIN0000001"
          required={required}
          maxLength={11}
          className={`uppercase ${
            isTouched && isValid !== null
              ? isValid
                ? "border-green-500 focus-visible:ring-green-500"
                : "border-red-500 focus-visible:ring-red-500"
              : ""
          }`}
        />
        {isTouched && isValid !== null && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      {isTouched && isValid === false && (
        <p className="text-xs text-red-500">
          Invalid IFSC code format (e.g., SBIN0000001)
        </p>
      )}
    </div>
  );
}