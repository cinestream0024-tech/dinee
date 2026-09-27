import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import AdminModal from "@/components/admin/AdminModal";
import FormField from "@/components/admin/FormField";
import { controlClass, textAreaClass } from "@/components/admin/formStyles";
import { MutationError } from "@/components/admin/AsyncState";
import {
  apiErrorMessageKey,
  hasFieldError,
} from "@/components/admin/apiErrors";
import { saveEvent } from "@/features/events/api";
import type { DineeEvent, EventPayload, EventStatus } from "@/types/dinee";

interface EventFormState {
  title: string;
  starts_at_local: string;
  timezone: string;
  location: string;
  description: string;
  capacity: string;
  status: EventStatus;
}

const emptyForm: EventFormState = {
  title: "",
  starts_at_local: "",
  timezone: "Africa/Kinshasa",
  location: "",
  description: "",
  capacity: "30",
  status: "draft",
};

function fromEvent(event: DineeEvent | null): EventFormState {
  if (!event) return emptyForm;
  return {
    title: event.title,
    starts_at_local: event.starts_at_local ?? "",
    timezone: event.timezone,
    location: event.location ?? "",
    description: event.description ?? "",
    capacity: event.capacity === null ? "" : String(event.capacity),
    status: event.status,
  };
}

function statusOptions(event: DineeEvent | null): EventStatus[] {
  if (!event) return ["draft", "upcoming"];
  if (event.status === "draft") return ["draft", "upcoming", "cancelled"];
  if (event.status === "upcoming") {
    const hasStarted = Boolean(
      event.starts_at && new Date(event.starts_at).getTime() <= Date.now(),
    );
    return hasStarted
      ? ["upcoming", "completed", "cancelled"]
      : ["upcoming", "cancelled"];
  }
  return [event.status];
}

export default function EventFormModal({
  isOpen,
  event,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  event: DineeEvent | null;
  onClose: () => void;
  onSaved: (event: DineeEvent) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<EventFormState>(() => fromEvent(event));
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const mutation = useMutation({
    mutationFn: (payload: EventPayload) => saveEvent(payload, event?.id),
    onSuccess: ({ data }) => onSaved(data),
  });

  const set = (field: keyof EventFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setClientErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const fieldError = (field: keyof EventFormState) =>
    clientErrors[field] ||
    (hasFieldError(mutation.error, field)
      ? t("dinee.invalidField")
      : undefined);

  const submit = (eventObject: React.FormEvent<HTMLFormElement>) => {
    eventObject.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = t("dinee.requiredField");
    if (form.status === "upcoming" && !form.starts_at_local)
      errors.starts_at_local = t("dinee.requiredField");
    if (form.status === "upcoming" && !form.location.trim())
      errors.location = t("dinee.requiredField");
    if (
      form.capacity &&
      (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) < 1)
    )
      errors.capacity = t("dinee.invalidCapacity");
    if (Object.keys(errors).length) {
      setClientErrors(errors);
      return;
    }

    mutation.mutate({
      title: form.title.trim(),
      starts_at_local: form.starts_at_local || null,
      timezone: form.timezone,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      status: form.status,
    });
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      busy={mutation.isPending}
      title={t(event ? "dinee.editEvent" : "dinee.newEvent")}
      description={t("dinee.eventFormDescription")}
    >
      <form onSubmit={submit} noValidate>
        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          {mutation.isError && (
            <div className="sm:col-span-2">
              <MutationError message={t(apiErrorMessageKey(mutation.error))} />
            </div>
          )}

          <FormField
            id="event-title"
            label={t("dinee.eventTitle")}
            required
            error={fieldError("title")}
            className="sm:col-span-2"
          >
            <input
              id="event-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={controlClass(Boolean(fieldError("title")))}
              aria-invalid={Boolean(fieldError("title"))}
              aria-describedby={
                fieldError("title") ? "event-title-error" : undefined
              }
              autoFocus
              required
            />
          </FormField>

          <FormField
            id="event-start"
            label={t("dinee.dateTime")}
            required={form.status === "upcoming"}
            error={fieldError("starts_at_local")}
          >
            <input
              id="event-start"
              type="datetime-local"
              value={form.starts_at_local}
              onChange={(e) => set("starts_at_local", e.target.value)}
              className={controlClass(Boolean(fieldError("starts_at_local")))}
              aria-invalid={Boolean(fieldError("starts_at_local"))}
              aria-describedby={
                fieldError("starts_at_local") ? "event-start-error" : undefined
              }
              required={form.status === "upcoming"}
            />
          </FormField>

          <FormField id="event-timezone" label={t("dinee.timezone")} required>
            <select
              id="event-timezone"
              required
              value={form.timezone}
              onChange={(e) => set("timezone", e.target.value)}
              className={controlClass()}
            >
              <option value="Africa/Kinshasa">Africa/Kinshasa</option>
              <option value="Africa/Lubumbashi">Africa/Lubumbashi</option>
              <option value="UTC">UTC</option>
            </select>
          </FormField>

          <FormField
            id="event-location"
            label={t("dinee.location")}
            required={form.status === "upcoming"}
            error={fieldError("location")}
          >
            <input
              id="event-location"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              className={controlClass(Boolean(fieldError("location")))}
              aria-invalid={Boolean(fieldError("location"))}
              aria-describedby={
                fieldError("location") ? "event-location-error" : undefined
              }
              required={form.status === "upcoming"}
            />
          </FormField>

          <FormField
            id="event-capacity"
            label={t("dinee.capacity")}
            error={fieldError("capacity")}
          >
            <input
              id="event-capacity"
              type="number"
              min="1"
              max="10000"
              value={form.capacity}
              onChange={(e) => set("capacity", e.target.value)}
              className={controlClass(Boolean(fieldError("capacity")))}
              aria-invalid={Boolean(fieldError("capacity"))}
              aria-describedby={
                fieldError("capacity") ? "event-capacity-error" : undefined
              }
            />
          </FormField>

          <FormField id="event-status" label={t("dinee.status")} required>
            <select
              id="event-status"
              required
              value={form.status}
              onChange={(e) => set("status", e.target.value as EventStatus)}
              className={controlClass()}
            >
              {statusOptions(event).map((status) => (
                <option key={status} value={status}>
                  {t(`dinee.status_${status}`)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id="event-description"
            label={t("dinee.description")}
            className="sm:col-span-2"
          >
            <textarea
              id="event-description"
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={textAreaClass()}
            />
          </FormField>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {t("dinee.cancel")}
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? t("dinee.saving") : t("dinee.save")}
          </button>
        </footer>
      </form>
    </AdminModal>
  );
}
