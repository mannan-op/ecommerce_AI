"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api/types";
import {
  addressSchema,
  type AddressFormData,
} from "@/lib/validation/address";

interface AddressFormProps {
  onSaved: (addressId: string) => void;
  initial?: Partial<AddressFormData>;
}

const emptyForm: AddressFormData = {
  label: "Home",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "PK",
  is_default: true,
};

export function AddressForm({ onSaved, initial }: AddressFormProps) {
  const [form, setForm] = useState<AddressFormData>({
    ...emptyForm,
    ...initial,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = addressSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.addresses.create(parsed.data);
      onSaved(data.id);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fields) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(err.fields)) {
            fieldErrors[key] = msgs[0];
          }
          setErrors(fieldErrors);
        } else {
          setErrors({ _form: err.message });
        }
      } else {
        setErrors({ _form: "Failed to save address" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="address-form" onSubmit={handleSubmit} noValidate>
      <h2>Shipping address</h2>
      <Input
        label="Label"
        value={form.label}
        error={errors.label}
        onChange={(e) => setForm({ ...form, label: e.target.value })}
      />
      <Input
        label="Address line 1"
        value={form.line1}
        error={errors.line1}
        onChange={(e) => setForm({ ...form, line1: e.target.value })}
        required
      />
      <Input
        label="Address line 2 (optional)"
        value={form.line2 ?? ""}
        error={errors.line2}
        onChange={(e) => setForm({ ...form, line2: e.target.value })}
      />
      <div className="filter-row">
        <Input
          label="City"
          value={form.city}
          error={errors.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          required
        />
        <Input
          label="State / Province"
          value={form.state ?? ""}
          error={errors.state}
          onChange={(e) => setForm({ ...form, state: e.target.value })}
        />
      </div>
      <div className="filter-row">
        <Input
          label="Postal code"
          value={form.postal_code}
          error={errors.postal_code}
          onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
          required
        />
        <Input
          label="Country (2-letter)"
          value={form.country}
          error={errors.country}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
          required
          maxLength={2}
        />
      </div>
      {errors._form ? <p className="error-message">{errors._form}</p> : null}
      <Button type="submit" loading={loading} fullWidth>
        Continue to summary
      </Button>
    </form>
  );
}
