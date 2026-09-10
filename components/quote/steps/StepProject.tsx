"use client";

import { useFormContext } from "react-hook-form";
import { SelectField } from "@/components/ui/field/SelectField";
import { TextField } from "@/components/ui/field/TextField";
import {
  BUILD_TYPE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  type QuoteFormInput,
  TIMELINE_OPTIONS,
} from "@/lib/validators/quote";

const ROOM_SUGGESTIONS = [
  "Living room",
  "Kitchen",
  "Bathroom",
  "Bedroom",
  "Basement",
  "Office",
  "Feature wall",
  "Ceiling",
  "Restaurant",
  "Retail",
  "Hotel",
  "Prayer room",
];

const PROJECT_TYPE_LABELS: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
};

const BUILD_TYPE_LABELS: Record<string, string> = {
  "new-build": "New build",
  renovation: "Renovation",
};

const TIMELINE_LABELS: Record<string, string> = {
  asap: "ASAP",
  "1-3-months": "1–3 months",
  "3-6-months": "3–6 months",
  "6-plus-months": "6+ months",
  researching: "Just researching",
};

/** Step 2 — what kind of project this is and when it needs to happen. */
export function StepProject() {
  const {
    register,
    formState: { errors },
  } = useFormContext<QuoteFormInput>();

  return (
    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      <SelectField
        id="project.projectType"
        label="Project type"
        error={errors.project?.projectType?.message}
        {...register("project.projectType")}
      >
        <option value="">Select…</option>
        {PROJECT_TYPE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {PROJECT_TYPE_LABELS[option] ?? option}
          </option>
        ))}
      </SelectField>
      <SelectField
        id="project.buildType"
        label="New build or renovation"
        error={errors.project?.buildType?.message}
        {...register("project.buildType")}
      >
        <option value="">Select…</option>
        {BUILD_TYPE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {BUILD_TYPE_LABELS[option] ?? option}
          </option>
        ))}
      </SelectField>
      <TextField
        id="project.roomType"
        label="Room / space"
        list="quote-room-suggestions"
        error={errors.project?.roomType?.message}
        {...register("project.roomType")}
      />
      <datalist id="quote-room-suggestions">
        {ROOM_SUGGESTIONS.map((room) => (
          <option key={room} value={room} />
        ))}
      </datalist>
      <SelectField
        id="project.timeline"
        label="Timeline"
        error={errors.project?.timeline?.message}
        {...register("project.timeline")}
      >
        <option value="">Select…</option>
        {TIMELINE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {TIMELINE_LABELS[option] ?? option}
          </option>
        ))}
      </SelectField>
    </div>
  );
}
