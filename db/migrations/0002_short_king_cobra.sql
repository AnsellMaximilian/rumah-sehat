CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"product_code" varchar(32),
	"description" text,
	"default_unit" varchar(32),
	"default_cost_price" integer NOT NULL,
	"default_sell_price" integer NOT NULL,
	"default_fulfillment_mode" varchar(32) NOT NULL,
	"track_stock" boolean DEFAULT false NOT NULL,
	"stock_tracking_started_at" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_product_code_unique" UNIQUE("product_code")
);
