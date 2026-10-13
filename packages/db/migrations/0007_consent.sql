CREATE TABLE "identity"."consent" (
	"consent_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"notice_version" integer NOT NULL,
	"consented_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "identity"."consent" ADD CONSTRAINT "consent_user_id_reader_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."reader"("user_id") ON DELETE no action ON UPDATE no action;