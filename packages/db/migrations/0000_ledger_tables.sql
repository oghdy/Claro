CREATE SCHEMA "identity";
--> statement-breakpoint
CREATE TABLE "article_record" (
	"article_id" uuid NOT NULL,
	"article_version" integer NOT NULL,
	"package" json NOT NULL,
	"authoring" json NOT NULL,
	CONSTRAINT "article_record_article_id_article_version_pk" PRIMARY KEY("article_id","article_version"),
	CONSTRAINT "article_record_version_positive" CHECK ("article_version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "knowledge_evidence" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"concept_id" uuid NOT NULL,
	"content_version" integer NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"evidence_type" text NOT NULL,
	"position" text,
	"interaction_id" uuid NOT NULL,
	"probe_id" uuid,
	"article_id" uuid,
	"article_version" integer,
	"content_block_id" jsonb,
	"exposure_context" jsonb NOT NULL,
	"model_version" text,
	CONSTRAINT "knowledge_evidence_evidence_type" CHECK ("evidence_type" in ('PROBE_RESPONSE', 'SELF_REPORT_KNOWN')),
	CONSTRAINT "knowledge_evidence_position" CHECK ("position" is null or "position" in ('PRE', 'POST', 'DELAYED')),
	CONSTRAINT "knowledge_evidence_article_pair" CHECK (("article_id" is null) = ("article_version" is null)),
	CONSTRAINT "knowledge_evidence_probe_by_type" CHECK (("evidence_type" = 'PROBE_RESPONSE' and "probe_id" is not null and "position" is not null) or ("evidence_type" = 'SELF_REPORT_KNOWN' and "probe_id" is null))
);
--> statement-breakpoint
CREATE TABLE "probe" (
	"probe_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"created_on" date NOT NULL,
	"event_id" uuid,
	"goal_ref" uuid,
	"targets" jsonb NOT NULL,
	"prompt" text NOT NULL,
	"choices" jsonb,
	"correct_choice" integer,
	CONSTRAINT "probe_probe_id_version_pk" PRIMARY KEY("probe_id","version"),
	CONSTRAINT "probe_version_from_one" CHECK ("version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "probe_exposure" (
	"exposure_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"probe_id" uuid NOT NULL,
	"probe_version" integer NOT NULL,
	"probe_type" text NOT NULL,
	"position" text NOT NULL,
	"plan_id" uuid,
	"shown_at_loc" jsonb,
	"shown_at" timestamp with time zone NOT NULL,
	CONSTRAINT "probe_exposure_probe_type" CHECK ("probe_type" in ('DIAGNOSTIC', 'ACTIVE', 'AUDIT', 'COMPREHENSION')),
	CONSTRAINT "probe_exposure_position" CHECK ("position" in ('PRE', 'POST', 'DELAYED'))
);
--> statement-breakpoint
CREATE TABLE "probe_response" (
	"interaction_id" uuid PRIMARY KEY NOT NULL,
	"exposure_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"responded_at" timestamp with time zone NOT NULL,
	"response" text NOT NULL,
	"is_correct" boolean,
	CONSTRAINT "probe_response_one_per_exposure" UNIQUE("exposure_id")
);
--> statement-breakpoint
CREATE TABLE "identity"."reader" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_event" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"reading_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"type" text NOT NULL,
	"slide_index" integer,
	"from_plan_id" uuid,
	CONSTRAINT "reading_event_reading_seq" UNIQUE("reading_id","seq"),
	CONSTRAINT "reading_event_type" CHECK ("type" in ('SLIDE_ENTERED', 'SLIDE_END_SHOWN', 'LEVEL_SWITCHED', 'CLOSED')),
	CONSTRAINT "reading_event_seq_from_zero" CHECK ("seq" >= 0),
	CONSTRAINT "reading_event_slide_index_by_type" CHECK (("type" in ('SLIDE_ENTERED', 'SLIDE_END_SHOWN')) = ("slide_index" is not null) and ("slide_index" is null or "slide_index" >= 0)),
	CONSTRAINT "reading_event_from_plan_by_type" CHECK (("type" = 'LEVEL_SWITCHED') = ("from_plan_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "reading_plan_log" (
	"plan_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"reading_id" uuid NOT NULL,
	"article_id" uuid NOT NULL,
	"article_version" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"level" text NOT NULL,
	"level_chosen_by" text NOT NULL,
	"estimator_version" text,
	"selected_blocks" jsonb,
	"skipped_blocks" jsonb,
	"block_decisions" jsonb NOT NULL,
	"narrative_form" text,
	"probe_plan" jsonb NOT NULL,
	CONSTRAINT "reading_plan_log_reading_level" UNIQUE("reading_id","level"),
	CONSTRAINT "reading_plan_log_level" CHECK ("level" in ('basic', 'intermediate', 'advanced')),
	CONSTRAINT "reading_plan_log_level_chosen_by" CHECK ("level_chosen_by" in ('DEFAULT', 'READER'))
);
--> statement-breakpoint
ALTER TABLE "knowledge_evidence" ADD CONSTRAINT "knowledge_evidence_article_fk" FOREIGN KEY ("article_id","article_version") REFERENCES "public"."article_record"("article_id","article_version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "probe_exposure" ADD CONSTRAINT "probe_exposure_plan_id_reading_plan_log_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."reading_plan_log"("plan_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "probe_exposure" ADD CONSTRAINT "probe_exposure_probe_fk" FOREIGN KEY ("probe_id","probe_version") REFERENCES "public"."probe"("probe_id","version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "probe_response" ADD CONSTRAINT "probe_response_exposure_id_probe_exposure_exposure_id_fk" FOREIGN KEY ("exposure_id") REFERENCES "public"."probe_exposure"("exposure_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_event" ADD CONSTRAINT "reading_event_plan_id_reading_plan_log_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."reading_plan_log"("plan_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_event" ADD CONSTRAINT "reading_event_from_plan_id_reading_plan_log_plan_id_fk" FOREIGN KEY ("from_plan_id") REFERENCES "public"."reading_plan_log"("plan_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_plan_log" ADD CONSTRAINT "reading_plan_log_article_fk" FOREIGN KEY ("article_id","article_version") REFERENCES "public"."article_record"("article_id","article_version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_evidence_one_per_target" ON "knowledge_evidence" USING btree ("interaction_id","concept_id") WHERE "evidence_type" = 'PROBE_RESPONSE';--> statement-breakpoint
CREATE UNIQUE INDEX "reading_event_end_shown_once" ON "reading_event" USING btree ("plan_id","slide_index") WHERE "type" = 'SLIDE_END_SHOWN';