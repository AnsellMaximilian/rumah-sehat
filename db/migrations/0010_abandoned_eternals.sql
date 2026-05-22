CREATE TABLE "account_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"amount_delta" integer NOT NULL,
	"entry_type" varchar(32) NOT NULL,
	"source_type" varchar(64),
	"source_id" uuid,
	"description" varchar(255) NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(32) NOT NULL,
	"owner_type" varchar(32),
	"owner_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "change_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" uuid,
	"action" varchar(32) NOT NULL,
	"field_name" varchar(64),
	"old_value" text,
	"new_value" text,
	"changed_by" text NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "delivery_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"default_charge_type" varchar(32),
	"default_bill_to_customer" boolean DEFAULT true NOT NULL,
	"default_account_id" uuid,
	"requires_manual_amount" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	CONSTRAINT "delivery_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity_delta" double precision NOT NULL,
	"movement_type" varchar(32) NOT NULL,
	"source_type" varchar(64),
	"source_id" uuid,
	"occurred_at" timestamp NOT NULL,
	"notes" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_purchase_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_purchase_item_id" uuid NOT NULL,
	"sales_line_id" uuid NOT NULL,
	"allocated_quantity" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "delivery_type_id" uuid;--> statement-breakpoint
ALTER TABLE "delivery_charges" ADD COLUMN "account_id" uuid;--> statement-breakpoint
ALTER TABLE "delivery_charges" ADD COLUMN "account_entry_id" uuid;--> statement-breakpoint
ALTER TABLE "delivery_charges" ADD COLUMN "invoice_item_id" uuid;--> statement-breakpoint
ALTER TABLE "sales_lines" ADD COLUMN "source_delivery_id" uuid;--> statement-breakpoint
ALTER TABLE "sales_lines" ADD COLUMN "source_supplier_purchase_item_id" uuid;--> statement-breakpoint
ALTER TABLE "supplier_purchase_items" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "supplier_purchases" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "account_entries" ADD CONSTRAINT "account_entries_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_entries" ADD CONSTRAINT "account_entries_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_logs" ADD CONSTRAINT "change_logs_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_types" ADD CONSTRAINT "delivery_types_default_account_id_accounts_id_fk" FOREIGN KEY ("default_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_purchase_allocations" ADD CONSTRAINT "supplier_purchase_allocations_supplier_purchase_item_id_supplier_purchase_items_id_fk" FOREIGN KEY ("supplier_purchase_item_id") REFERENCES "public"."supplier_purchase_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_purchase_allocations" ADD CONSTRAINT "supplier_purchase_allocations_sales_line_id_sales_lines_id_fk" FOREIGN KEY ("sales_line_id") REFERENCES "public"."sales_lines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_delivery_type_id_delivery_types_id_fk" FOREIGN KEY ("delivery_type_id") REFERENCES "public"."delivery_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_charges" ADD CONSTRAINT "delivery_charges_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_charges" ADD CONSTRAINT "delivery_charges_account_entry_id_account_entries_id_fk" FOREIGN KEY ("account_entry_id") REFERENCES "public"."account_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_charges" ADD CONSTRAINT "delivery_charges_invoice_item_id_invoice_items_id_fk" FOREIGN KEY ("invoice_item_id") REFERENCES "public"."invoice_items"("id") ON DELETE set null ON UPDATE no action;