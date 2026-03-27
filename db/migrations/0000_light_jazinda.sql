CREATE TABLE "todo" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"text" text,
	"done" boolean DEFAULT false NOT NULL
);
