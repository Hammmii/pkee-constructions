"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { BUILD_TYPE_LABELS, PROJECT_TYPE_LABELS, TIMELINE_LABELS, UNIT_LABELS } from "@/lib/quote";
import type { QuoteFormInput } from "@/lib/validators/quote";
import type { ProductOption } from "../types";

type StepReviewProps = {
  products: ProductOption[];
  onEdit: (step: number) => void;
};

function ReviewRow({
  label,
  value,
  step,
  onEdit,
}: {
  label: string;
  value: string | null | undefined;
  step: number;
  onEdit: (step: number) => void;
}) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-6 border-t py-3.5 rule">
      <dt className="text-label shrink-0 text-ink/55">{label}</dt>
      <dd className="text-right text-ink">
        {value}{" "}
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="ml-3 align-baseline text-[0.75rem] uppercase tracking-[0.12em] text-brass underline-offset-4 hover:underline"
        >
          Edit
        </button>
      </dd>
    </div>
  );
}

/** Step 7 — a readable summary with an edit link back to each step. */
export function StepReview({ products, onEdit }: StepReviewProps) {
  const { control } = useFormContext<QuoteFormInput>();
  const values = useWatch<QuoteFormInput>({ control });

  const product = products.find((entry) => entry.slug === values?.material?.productSlug);
  const projectParts = [
    values?.project?.projectType
      ? (PROJECT_TYPE_LABELS[values.project.projectType] ?? values.project.projectType)
      : null,
    values?.project?.buildType
      ? (BUILD_TYPE_LABELS[values.project.buildType] ?? values.project.buildType)
      : null,
    values?.project?.roomType,
  ].filter(Boolean);
  const dimensionParts = [
    values?.dimensions?.width && values?.dimensions?.height
      ? `${values.dimensions.width} × ${values.dimensions.height} ft`
      : null,
    values?.dimensions?.floorArea ? `${values.dimensions.floorArea} sq ft floor` : null,
    values?.dimensions?.wallCount ? `${values.dimensions.wallCount} walls` : null,
    values?.dimensions?.doorCount ? `${values.dimensions.doorCount} doors/openings` : null,
  ].filter(Boolean);
  const services = [
    values?.customization?.installationRequired ? "Installation" : null,
    values?.customization?.deliveryRequired ? "Delivery" : null,
  ].filter(Boolean);

  return (
    <div>
      <p className="mb-8 max-w-xl text-ink/60">
        One last look — jump back to any step to change something, then submit.
      </p>
      <dl>
        <ReviewRow label="Name" value={values?.customer?.name} step={0} onEdit={onEdit} />
        <ReviewRow label="Email" value={values?.customer?.email} step={0} onEdit={onEdit} />
        <ReviewRow
          label="Phone"
          value={values?.customer?.phone ? values.customer.phone : null}
          step={0}
          onEdit={onEdit}
        />
        <ReviewRow
          label="Location"
          value={
            [values?.customer?.city, values?.customer?.postalCode].filter(Boolean).join(", ") ||
            null
          }
          step={0}
          onEdit={onEdit}
        />
        <ReviewRow
          label="Project"
          value={projectParts.join(" · ") || null}
          step={1}
          onEdit={onEdit}
        />
        <ReviewRow
          label="Timeline"
          value={
            values?.project?.timeline
              ? (TIMELINE_LABELS[values.project.timeline] ?? values.project.timeline)
              : null
          }
          step={1}
          onEdit={onEdit}
        />
        <ReviewRow
          label="Product"
          value={product ? product.name : values?.material?.productSlug ? "Undecided" : null}
          step={2}
          onEdit={onEdit}
        />
        <ReviewRow
          label="Quantity"
          value={
            values?.material?.quantity
              ? `${values.material.quantity} ${values.material.unit ? (UNIT_LABELS[values.material.unit] ?? values.material.unit) : ""}`.trim()
              : null
          }
          step={2}
          onEdit={onEdit}
        />
        <ReviewRow
          label="Finish / colour"
          value={
            [values?.material?.finish, values?.material?.color].filter(Boolean).join(" · ") || null
          }
          step={2}
          onEdit={onEdit}
        />
        <ReviewRow
          label="Dimensions"
          value={dimensionParts.join(" · ") || null}
          step={3}
          onEdit={onEdit}
        />
        <ReviewRow
          label="Design requirements"
          value={values?.customization?.designRequirements}
          step={4}
          onEdit={onEdit}
        />
        <ReviewRow label="Services" value={services.join(" · ") || null} step={4} onEdit={onEdit} />
      </dl>
    </div>
  );
}
