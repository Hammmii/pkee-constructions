import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";
import { sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_consultations_source" AS ENUM('website-quote', 'website-samples', 'website-consultation', 'website-custom-studio', 'phone', 'walk-in', 'other');
  ALTER TABLE "dealer_applications" ADD COLUMN "reference" varchar;
  UPDATE "dealer_applications" SET "reference" = 'DA-' || EXTRACT(YEAR FROM "created_at")::int::text || '-' || LPAD((ROW_NUMBER() OVER (ORDER BY "created_at", "id"))::text, 4, '0');
  ALTER TABLE "dealer_applications" ALTER COLUMN "reference" SET NOT NULL;
  ALTER TABLE "consultations" ADD COLUMN "source" "enum_consultations_source" DEFAULT 'website-consultation';
  UPDATE "consultations" SET "source" = 'website-consultation' WHERE "source" IS NULL;
  CREATE UNIQUE INDEX "dealer_applications_reference_idx" ON "dealer_applications" USING btree ("reference");
  CREATE INDEX "consultations_source_idx" ON "consultations" USING btree ("source");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "dealer_applications_reference_idx";
  DROP INDEX "consultations_source_idx";
  ALTER TABLE "dealer_applications" DROP COLUMN "reference";
  ALTER TABLE "consultations" DROP COLUMN "source";
  DROP TYPE "public"."enum_consultations_source";`);
}
