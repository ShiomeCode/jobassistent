// Form for the user's contact details, which are printed at the top of exported applications.

import { useEffect, useState, type FormEvent } from "react";
import type { Profile } from "@jobassistent/core";
import { useProfile } from "../hooks/useProfile";
import { saveProfile } from "../db";
import { t } from "../texts";

const EMPTY_PROFILE: Profile = { name: "", email: "", phone: "", address: "" };

// Used on page: BankPage
export function ProfileForm() {
  const { profile, isLoading } = useProfile();
  const [formValues, setFormValues] = useState<Profile>(EMPTY_PROFILE);
  const [status, setStatus] = useState<"idle" | "saved" | "nameMissing">("idle");

  useEffect(() => {
    if (profile) {
      setFormValues({ ...EMPTY_PROFILE, ...profile });
    }
  }, [profile]);

  const updateField = (field: keyof Profile, value: string) => {
    setFormValues(currentValues => ({ ...currentValues, [field]: value }));
    setStatus("idle");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (formValues.name.trim().length === 0) {
      setStatus("nameMissing");
      return;
    }
    await saveProfile({
      name: formValues.name.trim(),
      email: formValues.email?.trim() || undefined,
      phone: formValues.phone?.trim() || undefined,
      address: formValues.address?.trim() || undefined,
    });
    setStatus("saved");
  };

  if (isLoading) {
    return null;
  }

  return (
    <section className="profile-form" aria-labelledby="profile-heading">
      <h2 id="profile-heading">{t("profile.heading")}</h2>
      <p className="muted">{t("profile.intro")}</p>
      <form className="profile-form__fields" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">{t("profile.name")}</span>
          <input
            type="text"
            autoComplete="name"
            value={formValues.name}
            aria-invalid={status === "nameMissing"}
            onChange={event => updateField("name", event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">{t("profile.email")}</span>
          <input type="email" autoComplete="email" value={formValues.email ?? ""} onChange={event => updateField("email", event.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">{t("profile.phone")}</span>
          <input type="tel" autoComplete="tel" value={formValues.phone ?? ""} onChange={event => updateField("phone", event.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">{t("profile.address")}</span>
          <input
            type="text"
            autoComplete="street-address"
            value={formValues.address ?? ""}
            onChange={event => updateField("address", event.target.value)}
          />
        </label>
        <button type="submit" className="button button--secondary">
          {t("profile.save")}
        </button>
        <p role="status" className={status === "nameMissing" ? "field__error" : "form__success"}>
          {status === "saved" && t("profile.saved")}
          {status === "nameMissing" && t("profile.nameRequired")}
        </p>
      </form>
    </section>
  );
}
