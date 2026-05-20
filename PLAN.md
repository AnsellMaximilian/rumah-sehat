# Small Business Sales System Plan

## 1. Core Goal

Build a lightweight sales, delivery, supplier, stock, invoicing, and internal account tracking system for a small family/friends business where the real-world workflow is messy and cannot be forced into a strict enterprise process.

The system should prioritize:

* Fast admin entry
* Flexible correction/amendment
* Weekly customer invoicing
* Mixed fulfillment sources
* Auditability without heavy accounting complexity
* Stock tracking only where relevant
* Internal delivery money/account tracking

The main principle is:

> Record what happened, allow correction, preserve history, and generate weekly invoices from delivered uninvoiced items and charges.

---

## 2. Existing Table

You already have a simple customer table.

### customers

```text
customers
- id
- name
- address
- customer_code
- notes
- created_at
- updated_at
```

Optional later additions:

```text
- phone
- active
- default_invoice_day
- default_delivery_notes
```

Keep this simple for now.

---

## 3. Core Concepts

The system should be centered around these concepts:

### Sales Line

A `sales_line` represents something that a customer is being sold or should be billed for.

It may come from:

* Stock
* Supplier direct delivery
* Supplier-prepacked goods delivered by your staff
* Manual entry
* Later correction

A sales line does not require a formal order.

### Delivery

A `delivery` represents a physical delivery event to a customer.

A delivery can contain mixed item sources:

* Your own stock
* Supplier-prepacked package
* Misc/manual items

The delivery header should not define the source of all items. Source belongs to the item or the sales line.

### Supplier Fulfillment / Supplier Purchase

A supplier purchase records what you bought from a supplier.

Supplier items may be:

* Directly delivered to customer by supplier
* Sent to you already packed per customer
* Sent to you as general stock
* Recorded only, with no customer or stock association

### Weekly Invoice

Customers usually want one invoice at the end of the week.

Invoices should be generated from:

* Delivered, uninvoiced sales lines
* Billable, uninvoiced delivery charges
* Billable miscellaneous charges

Issued invoices should not automatically mutate when older deliveries are corrected. Instead, the system should show warnings/status badges.

### Stock Ledger

Stock should be derived from stock movement entries, not stored as a single quantity column.

### Account Ledger

Internal delivery money, staff cash, LalaMove balances, etc. should be tracked as accounts with ledger entries.

---

## 4. Recommended Tables Overview

```text
customers
products
suppliers

sales_lines

deliveries
delivery_items
delivery_charges

supplier_purchases
supplier_purchase_items
supplier_purchase_allocations

invoices
invoice_items

accounts
account_entries

stock_movements

change_logs
```

This looks like a lot, but each table has one clear responsibility.

---

# 5. Product and Supplier Setup

## products

Products are things you sell or buy.

Some are stocked. Some are not. Some are usually dropshipped but can occasionally be stocked.

```text
products
- id
- name
- product_code nullable
- default_unit nullable
- default_sell_price nullable
- default_cost_price nullable
- default_fulfillment_mode
- track_stock boolean
- stock_tracking_started_at nullable
- active boolean
- notes
- created_at
- updated_at
```

### default_fulfillment_mode

Suggested values:

```text
stock
supplier_direct
supplier_prepacked
manual
unknown
```

This is only a UX default. It should not permanently restrict the product.

Example:

```text
Cisarua Kale
- default_fulfillment_mode: supplier_direct
- track_stock: false
```

```text
Ko Sandi Sausage
- default_fulfillment_mode: stock
- track_stock: true
```

```text
Ko Sandi Beef
- default_fulfillment_mode: supplier_prepacked
- track_stock: false, unless you intentionally stock it
```

## suppliers

```text
suppliers
- id
- name
- supplier_code nullable
- contact_info nullable
- notes
- active boolean
- created_at
- updated_at
```

Examples:

```text
Cisarua
Ko Sandi - Daging
```

---

# 6. Sales Lines

## Purpose

A sales line represents a customer-specific sellable item.

It is the missing middle layer between supplier purchases, deliveries, and invoices.

It replaces the earlier concept of “dangling sales” with a cleaner concept:

> Pending / ready / delivered sales lines.

## sales_lines

```text
sales_lines
- id
- customer_id
- product_id
- quantity
- unit_sell_price nullable
- source_mode
- supplier_id nullable
- status
- notes
- created_at
- updated_at
- deleted_at nullable
```

Optional fields:

```text
- order_id nullable
- source_supplier_purchase_item_id nullable
- source_delivery_item_id nullable
- invoice_status nullable
```

But avoid over-linking too early. Most links can be managed through dedicated link tables or source references on related rows.

## source_mode

Suggested values:

```text
stock
supplier_direct
supplier_prepacked
manual
correction
unknown
```

## status

Suggested values:

```text
pending
ordered_from_supplier
ready_for_delivery
delivered
cancelled
invoiced
```

You may not need `invoiced` as a sales line status if invoice linkage is tracked separately. But for simple UI, it is useful.

Recommended practical statuses:

```text
pending
ready_for_delivery
delivered
cancelled
```

Then derive invoice status from invoice links:

```text
not_invoiced
invoiced_current
invoiced_needs_review
```

---

# 7. Deliveries

## deliveries

A delivery is one physical delivery event to a customer.

```text
deliveries
- id
- customer_id
- delivered_at nullable
- recorded_at
- delivered_by nullable
- delivery_type_id nullable
- status
- notes
- created_by
- created_at
- updated_at
- deleted_at nullable
```

## delivery status

Suggested values:

```text
recorded
delivered
void
```

For a small business, avoid too many statuses.

Most deliveries can simply be considered delivered once recorded, unless you also need planned delivery tracking.

## delivery_items

```text
delivery_items
- id
- delivery_id
- sales_line_id nullable
- product_id
- quantity
- unit_sell_price nullable
- source_mode
- source_ref_type nullable
- source_ref_id nullable
- notes
- created_at
- updated_at
- deleted_at nullable
```

Important rule:

> Source belongs to the delivery item or sales line, not the delivery header.

This allows one delivery to contain:

```text
Delivery to Ani
- Eggs x 2 from stock
- Beef 1kg from Ko Sandi customer package
- Milk x 1 from stock
```

## How to handle stock items added directly to delivery

When admin adds a stock item directly on the delivery screen:

1. Create a sales line behind the scenes.
2. Create a delivery item linked to that sales line.
3. Create a stock movement reducing stock.
4. Mark sales line as delivered.

Example:

```text
Admin adds Eggs x 2

System creates:
- sales_line: Ani, Eggs, qty 2, source_mode stock, status delivered
- delivery_item linked to sales_line
- stock_movement: Eggs -2, movement_type delivery_out
```

## How to handle ready supplier items

When admin adds a ready Ko Sandi package:

1. Use the existing sales line.
2. Create delivery item linked to that sales line.
3. Mark sales line delivered.
4. No stock movement unless the item was intentionally stocked.

---

# 8. Delivery Charges and Misc Charges

Delivery charges should be separate from product items.

A delivery can have multiple charges:

* JNE fee
* Paxel fee
* Staff delivery fee
* Box
* Ice pack
* Miscellaneous unexpected charge

## delivery_charges

```text
delivery_charges
- id
- delivery_id
- charge_type
- description
- amount
- bill_to_customer boolean
- account_id nullable
- account_entry_id nullable
- invoice_item_id nullable
- notes
- created_at
- updated_at
- deleted_at nullable
```

## charge_type

Suggested values:

```text
courier
staff_delivery
third_party_delivery
packaging
misc
adjustment
```

Examples:

```text
JNE 30,000
- charge_type: courier
- bill_to_customer: true
- account_id: null
```

```text
Siti delivery fee 25,000
- charge_type: staff_delivery
- bill_to_customer: true
- account_id: Siti Delivery Cash
```

```text
Box 5,000
- charge_type: packaging
- bill_to_customer: true
- account_id: null
```

---

# 9. Delivery Types

Delivery types provide defaults for the delivery UI.

## delivery_types

```text
delivery_types
- id
- name
- default_charge_type nullable
- default_bill_to_customer boolean
- default_account_id nullable
- requires_manual_amount boolean
- active boolean
- notes
```

Examples:

```text
JNE
- default_charge_type: courier
- default_bill_to_customer: true
- default_account_id: null
- requires_manual_amount: true
```

```text
Paxel
- default_charge_type: courier
- default_bill_to_customer: true
- default_account_id: null
```

```text
Staff Siti
- default_charge_type: staff_delivery
- default_bill_to_customer: true
- default_account_id: Siti Delivery Cash
```

```text
Siti LalaMove
- default_charge_type: third_party_delivery
- default_bill_to_customer: true
- default_account_id: Siti LalaMove Account
```

Delivery type defaults should be overrideable per delivery.

---

# 10. Accounts and Account Entries

## Purpose

Accounts track internal money balances such as:

* Siti delivery cash
* Siti LalaMove account
* Business cash
* Bank account
* Supplier payable account, if needed later

For your immediate need, the most important use is:

> Track how much delivery money remains with staff and how much needs to be topped up again.

## accounts

```text
accounts
- id
- name
- type
- owner_type nullable
- owner_id nullable
- active boolean
- notes
- created_at
- updated_at
```

## account type

Suggested values:

```text
staff_cash
delivery_wallet
third_party_wallet
business_cash
bank
supplier_payable
other
```

## account_entries

Account balance should be derived from ledger entries.

```text
account_entries
- id
- account_id
- amount_delta
- entry_type
- source_type nullable
- source_id nullable
- description
- occurred_at
- created_by
- created_at
```

Positive amounts add to the account.
Negative amounts reduce the account.

Example weekly top-up:

```text
account: Siti Delivery Cash
amount_delta: +300000
entry_type: top_up
description: Weekly delivery money
```

Example delivery deduction:

```text
account: Siti Delivery Cash
amount_delta: -25000
entry_type: delivery_charge
source_type: delivery_charge
source_id: delivery_charges.id
description: Delivery to Ani
```

Current balance:

```text
SUM(account_entries.amount_delta)
```

Do not store account balance as the source of truth.

---

# 11. Supplier Purchases and Fulfillment

Supplier purchases should not require a customer.

They can be standalone, stock-related, dropship-related, or customer-prepacked.

## supplier_purchases

```text
supplier_purchases
- id
- supplier_id
- purchase_date
- status
- notes
- created_by
- created_at
- updated_at
- deleted_at nullable
```

## status

Suggested values:

```text
draft
ordered
confirmed
arrived
delivered_by_supplier
closed
void
```

You can simplify this depending on the supplier flow.

## supplier_purchase_items

```text
supplier_purchase_items
- id
- supplier_purchase_id
- product_id
- quantity
- unit_cost nullable
- destination_type
- customer_id nullable
- notes
- created_at
- updated_at
- deleted_at nullable
```

## destination_type

Suggested values:

```text
stock
customer_direct
customer_prepacked
record_only
unknown
```

This is a UX/helper field. The actual links are created through stock movements or allocations.

## supplier_purchase_allocations

Use this when supplier purchase items are allocated to customer sales lines.

```text
supplier_purchase_allocations
- id
- supplier_purchase_item_id
- sales_line_id
- allocated_quantity
- created_at
- updated_at
- deleted_at nullable
```

This supports:

```text
One purchase item → many customer sales lines
One purchase item → partly stock, partly customer lines
```

---

# 12. Supplier Flow Types

## A. Cisarua direct dropship

Physical flow:

```text
Supplier → Customer
```

Business flow:

```text
Customer buys from you
You send customer details to Cisarua
Cisarua delivers to customer
Cisarua bills you
You bill customer with markup
```

UX:

```text
Create Supplier Fulfillment / Purchase
→ Supplier: Cisarua
→ Type: Direct to customer
→ Add customer/item lines
→ Mark delivered when supplier confirms
→ Items become delivered sales lines
→ Weekly invoice includes them
```

Data result:

```text
supplier_purchase
supplier_purchase_items
sales_lines with source_mode supplier_direct
supplier_purchase_allocations
sales_lines.status = delivered after confirmation
```

No internal delivery is required because your staff did not physically deliver it.

Optionally, for consistent reporting, you may create a delivery-like record with delivery type `supplier_direct`, but this is not necessary at the start.

## B. Ko Sandi customer-prepacked hybrid

Physical flow:

```text
Supplier → You → Customer
```

Supplier packs by customer name.

UX:

```text
Create Supplier Purchase/Fulfillment
→ Supplier: Ko Sandi
→ Type: Sent to us, packed by customer
→ Add customer/item lines
→ Mark arrived
→ Lines become Ready for Delivery
```

Then:

```text
Create Delivery
→ Select customer
→ Add ready Ko Sandi item
→ Add stock/manual items if needed
→ Save delivery
→ Sales lines become delivered
→ Weekly invoice includes them
```

Data result:

```text
supplier_purchase
supplier_purchase_items
sales_lines source_mode supplier_prepacked
sales_lines.status = ready_for_delivery after supplier arrival
delivery_items link to sales_lines when delivered
```

## C. Supplier purchase for stock

Example: Ko Sandi sausages bought for general stock.

UX:

```text
Create Supplier Purchase
→ Supplier: Ko Sandi
→ Product: Sausage
→ Qty: 20
→ Destination: Stock
→ Save / Mark arrived
```

Data result:

```text
supplier_purchase
supplier_purchase_item
stock_movement +20, movement_type purchase_in
```

## D. Standalone supplier purchase / record only

Example: buy from Cisarua just to record purchase, with no customer or stock tracking.

UX:

```text
Create Supplier Purchase
→ Destination: Record only
→ Save
```

Data result:

```text
supplier_purchase
supplier_purchase_item
no sales_line
no stock_movement
```

---

# 13. Stock Tracking

## Rule

Do not store current stock quantity as truth on the product.

Use stock movements.

## stock_movements

```text
stock_movements
- id
- product_id
- quantity_delta
- movement_type
- source_type nullable
- source_id nullable
- occurred_at
- notes
- created_by
- created_at
```

Current stock:

```text
SUM(stock_movements.quantity_delta)
```

## movement_type

Suggested values:

```text
opening_balance
purchase_in
delivery_out
delivery_correction
manual_adjustment
damage
personal_draw
return_in
return_to_supplier
found_stock
correction
```

## Opening stock

When stock tracking begins for a product:

1. Set `products.track_stock = true`.
2. Set `products.stock_tracking_started_at`.
3. Create opening stock movement.

Example:

```text
Product: Ko Sandi Sausage
track_stock: true
stock_tracking_started_at: 2026-05-20

stock_movement:
movement_type: opening_balance
quantity_delta: +20
```

## Stock delivery

When a stock item is delivered:

```text
stock_movement:
quantity_delta: -2
movement_type: delivery_out
source_type: delivery_item
source_id: delivery_item.id
```

## Stock correction after delivery amendment

Prefer append-only correction movement rather than mutating the old movement.

Original:

```text
Eggs -2 delivery_out
```

Correction:

```text
Eggs +1 delivery_correction
```

Net effect:

```text
Eggs -1
```

This preserves the trail.

## Customer-specific supplier packages are usually not stock

Ko Sandi beef packed for Ani should not be treated as general stock.

It should be:

```text
sales_line status: ready_for_delivery
```

not:

```text
stock +1 beef
```

Otherwise the system may incorrectly treat Ani’s package as available for another customer.

---

# 14. Invoices

## Purpose

Customers usually want one invoice at the end of the week.

Invoice generation should collect:

```text
Delivered, uninvoiced sales lines
+
Billable, uninvoiced delivery charges
+
Billable miscellaneous charges
```

## invoices

```text
invoices
- id
- customer_id
- invoice_number nullable
- period_start
- period_end
- invoice_date
- status
- sync_status
- notes
- created_by
- created_at
- updated_at
- deleted_at nullable
```

## invoice status

Suggested values:

```text
draft
issued
paid
void
```

## sync_status

Suggested values:

```text
current
needs_review
```

Use `needs_review` when a linked delivery, sales line, or delivery charge changed after the invoice was generated/issued.

## invoice_items

```text
invoice_items
- id
- invoice_id
- line_type
- description
- product_id nullable
- quantity nullable
- unit_price nullable
- amount
- source_type nullable
- source_id nullable
- created_at
```

## line_type

Suggested values:

```text
product
delivery_charge
misc_charge
adjustment
```

Invoice items should be snapshots.

Do not rely only on live delivery item data.

Example product invoice item:

```text
line_type: product
description: Eggs
product_id: Eggs
quantity: 2
unit_price: 10000
amount: 20000
source_type: sales_line
source_id: sales_line.id
```

Example charge invoice item:

```text
line_type: delivery_charge
description: Paxel delivery fee
amount: 30000
source_type: delivery_charge
source_id: delivery_charge.id
```

---

# 15. Change Logs / Audit Trail

## Purpose

The system should allow convenient amendments, especially before invoicing.

But it should record changes.

## change_logs

```text
change_logs
- id
- entity_type
- entity_id
- action
- field_name nullable
- old_value nullable
- new_value nullable
- changed_by
- changed_at
- reason nullable
```

## action

Suggested values:

```text
created
updated
deleted
restored
voided
```

Examples:

Quantity change:

```text
entity_type: delivery_item
entity_id: 123
action: updated
field_name: quantity
old_value: 3
new_value: 2
```

Item addition:

```text
entity_type: delivery_item
action: created
new_value: full item snapshot
```

Item removal:

```text
entity_type: delivery_item
action: deleted
old_value: full item snapshot
```

Use soft deletes for operational rows where possible.

---

# 16. UX Flow 1: Typical Stock Delivery

Scenario:

```text
Customer orders casually.
Admin records delivery.
Staff later reports quantity correction.
Invoice has not been generated yet.
```

Flow:

```text
Create Delivery
→ Select customer
→ Add stock items
→ Add delivery charge if any
→ Save
```

On save:

```text
Create sales_lines for stock items
Create delivery
Create delivery_items
Create stock_movements negative for stock items
Create delivery_charges if any
Create account_entries if delivery charge uses account
```

Amendment:

```text
Open Delivery Detail
→ Edit item quantity
→ Save amendment
```

If not invoiced:

```text
Low friction.
Show message: This delivery has not been invoiced yet. Changes will affect the next invoice.
```

Stock correction:

```text
Append stock_movement correction if stock item quantity changed.
```

---

# 17. UX Flow 2: Direct Supplier Dropship, e.g. Cisarua

Scenario:

```text
Customer orders from you.
You forward customer names/addresses/items to Cisarua.
Cisarua delivers directly to customers.
Cisarua bills you.
You bill customers at your selling price.
```

Flow:

```text
Create Supplier Fulfillment
→ Supplier: Cisarua
→ Fulfillment Type: Direct to Customer
→ Add customer/item lines
→ Save as requested/ordered
```

Later:

```text
Open Supplier Fulfillment
→ Mark delivered when Cisarua confirms
```

On save/confirm:

```text
Create supplier_purchase
Create supplier_purchase_items
Create sales_lines with source_mode supplier_direct
Create supplier_purchase_allocations
When confirmed delivered: sales_lines.status = delivered
```

Invoice:

```text
Delivered Cisarua sales lines appear in each customer’s weekly invoice.
```

Amendment:

```text
Open Supplier Fulfillment Detail
→ Edit customer line qty/product
→ Save amendment
```

If not invoiced:

```text
Low friction, update sales line and audit log.
```

If already invoiced:

```text
Mark invoice sync_status = needs_review.
Do not automatically mutate issued invoice.
```

---

# 18. UX Flow 3: Supplier-Prepacked Hybrid, e.g. Ko Sandi Daging

Scenario:

```text
Customer orders from you.
You forward grouped order to Ko Sandi by customer name.
Ko Sandi sends packages to you, already packed per customer.
Your staff delivers the package to customers.
```

Flow Part A: Supplier stage

```text
Create Supplier Fulfillment
→ Supplier: Ko Sandi - Daging
→ Fulfillment Type: Sent to us, packed by customer
→ Add customer/item lines
→ Save
```

When goods arrive:

```text
Open Supplier Fulfillment
→ Mark arrived
```

Result:

```text
Customer-specific sales lines become ready_for_delivery.
```

Flow Part B: Final-mile delivery

```text
Create Delivery
→ Select customer
→ View Ready Items for this customer
→ Select Ko Sandi package/items
→ Add stock items if also delivered together
→ Add delivery charges
→ Save
```

Result:

```text
Selected Ko Sandi sales lines become delivered.
Stock items create new delivered sales lines and stock movements.
Delivery can contain mixed sources.
```

---

# 19. UX Flow 4: Mixed Delivery

Scenario:

```text
Staff delivers Ko Sandi package and your own stock in the same trip.
```

Delivery creation screen:

```text
Customer: Ani
Delivered by/method: Staff Siti
Date: Today
```

Section 1:

```text
Ready Items for Ani
[ ] Ko Sandi Beef 1kg
[ ] Ko Sandi Chicken 500g
```

Section 2:

```text
Add stock/manual items
+ Eggs x 2
+ Sausage x 1
```

Section 3:

```text
Delivery charges
Delivery type: Staff Siti
Amount: 25,000
Bill customer: yes
Deduct from account: Siti Delivery Cash
```

Summary:

```text
From Ko Sandi
- Beef 1kg

From Stock
- Eggs x 2
- Sausage x 1

Charges
- Staff Siti delivery fee 25,000
```

On save:

```text
Create delivery
Create delivery_items for ready sales lines
Create new sales_lines for stock/manual items
Create stock_movements for stock items
Create delivery_charges
Create account_entries if needed
Mark all included sales lines delivered
```

---

# 20. UX Flow 5: Weekly Invoice Generation

Scenario:

```text
Customer wants one invoice at the end of the week regardless of number of deliveries.
```

Flow:

```text
Create Weekly Invoice
→ Select customer
→ Select period_start and period_end
→ System shows all uninvoiced delivered items and charges
→ Admin reviews
→ Generate draft invoice
→ Issue invoice when ready
```

Review screen should group by date/source:

```text
May 13 - Stock Delivery
- Eggs x 2
- Milk x 1
- Staff Siti delivery fee 25,000

May 15 - Cisarua Direct
- Organic Kale x 2

May 17 - Ko Sandi / Internal Delivery
- Beef 1kg
- Box 5,000
```

Invoice generation creates snapshot invoice items.

After invoice is issued:

```text
Do not automatically mutate it.
```

If source data changes later:

```text
Invoice sync_status = needs_review
Show warning badge: Invoice may need update
```

Admin options later:

```text
Create adjustment
Void and reissue
Ignore with note
```

---

# 21. UX Flow 6: Delivery Charges and Account Deductions

## JNE / Paxel case

```text
Create Delivery
→ Delivery type: Paxel
→ Charge amount: 30,000
→ Bill customer: yes
→ Deduct from account: no
```

Result:

```text
delivery_charge created
weekly invoice includes Paxel 30,000
no account entry unless you choose to track courier payable/payment
```

## Staff Siti case

```text
Create Delivery
→ Delivery type: Staff Siti
→ Charge amount: 25,000
→ Bill customer: yes
→ Deduct from account: Siti Delivery Cash
```

Result:

```text
delivery_charge created
account_entry -25,000 created
weekly invoice includes Siti delivery fee 25,000
```

## Siti LalaMove case

```text
Create Delivery
→ Delivery type: Siti LalaMove
→ Charge amount: 42,000
→ Bill customer: yes
→ Deduct from account: Siti LalaMove Account
```

Result:

```text
delivery_charge created
account_entry -42,000 created
weekly invoice includes delivery fee 42,000
```

## Account top-up

```text
Accounts
→ Siti Delivery Cash
→ Add Top-Up
→ Amount: 300,000
```

Result:

```text
account_entry +300,000
```

Dashboard can show:

```text
Siti Delivery Cash balance: 85,000
Suggested top-up to 300,000: 215,000
```

---

# 22. UX Flow 7: Stock Purchases and Adjustments

## Purchase into stock

```text
Create Supplier Purchase
→ Supplier: Ko Sandi
→ Product: Sausage
→ Qty: 20
→ Destination: Stock
→ Save / Mark arrived
```

Result:

```text
supplier_purchase created
supplier_purchase_item created
stock_movement +20 purchase_in created
```

## Stock adjustment

```text
Stock
→ Product
→ Add Adjustment
→ Type: damage / personal draw / found stock / correction
→ Qty delta
→ Notes
→ Save
```

Examples:

```text
Damage: Eggs -6
Personal draw: Sausage -2
Found stock: Sausage +3
Correction after count: Beef -1
```

Result:

```text
stock_movement created
```

---

# 23. Admin Dashboard

Home dashboard should show operational buckets, not enterprise order states.

Suggested cards:

```text
Ready for Delivery
- Ani: Ko Sandi Beef 1kg
- Budi: Ko Sandi Chicken 500g

Supplier Actions
- Cisarua: 8 lines waiting for delivery confirmation
- Ko Sandi: 5 customer packages expected

Recently Delivered, Not Invoiced
- 23 delivered items this week
- 7 delivery charges this week

Weekly Invoices
- 12 customers have uninvoiced items

Accounts
- Siti Delivery Cash: 85,000
- Siti LalaMove: 158,000

Stock Alerts
- Sausage: 3 packs remaining

Needs Review
- 2 invoices affected by later corrections
```

---

# 24. Important Screens

## Customer Detail

Show customer activity timeline:

```text
Deliveries
Sales lines
Supplier direct deliveries
Charges
Invoices
Payments later, if added
Notes
Corrections
```

This should answer:

> What happened with this customer?

## Create Delivery

Core sections:

```text
Customer
Date
Delivery type / delivered by
Ready items
Stock/manual items
Delivery charges
Summary
```

## Delivery Detail

Show:

```text
Header info
Items grouped by source
Charges
Invoice status
Account entries
Change history
```

Actions:

```text
Amend item
Remove item
Add item
Edit charge
Void delivery
```

If uninvoiced:

```text
Low-friction amendment.
```

If invoiced:

```text
Show warning and mark invoice needs_review.
```

## Supplier Fulfillment / Purchase Detail

Show:

```text
Supplier
Fulfillment type
Customer lines
Stock lines
Cost summary
Status
Allocations
```

Actions:

```text
Mark ordered
Mark arrived
Mark direct delivered
Amend line
Allocate to customer
Allocate to stock
```

## Weekly Invoice Creation

Show all candidate lines:

```text
Delivered sales lines not yet invoiced
Billable delivery charges not yet invoiced
```

Allow admin to exclude/include if necessary, but default to include all.

## Accounts

Show:

```text
Current balance
Entries
Top-up button
Manual adjustment button
Linked deliveries
```

## Stock

Show:

```text
Current derived stock
Movement history
Opening balance
Adjustment button
Purchase links
Delivery links
```

---

# 25. Amendment Rules

## Before invoice

Allow convenient changes.

Examples:

```text
Delivery qty 3 → 2
Remove forgotten item
Add forgotten delivered item
Change delivery charge
```

System should:

```text
Update current operational state
Append stock/account corrections if needed
Write change_logs
```

## After draft invoice

If invoice is still draft:

Option A:

```text
Allow invoice regeneration/update.
```

Recommended UX:

```text
This delivery is already included in a draft invoice. Update draft invoice?
```

## After issued invoice

Do not auto-mutate invoice.

System should:

```text
Allow source correction
Mark invoice sync_status = needs_review
Show warning badge
```

Admin chooses later:

```text
Create adjustment
Void and reissue
Ignore with note
```

## After paid invoice

Same as issued, but stronger warning.

```text
This invoice is already paid. Correction should usually create an adjustment instead of changing the invoice.
```

---

# 26. Implementation Phases

## Phase 1: Core Sales and Deliveries

Build:

```text
products
suppliers
sales_lines
deliveries
delivery_items
change_logs
```

UX:

```text
Create stock/manual delivery
Delivery detail amendment
Customer activity
Uninvoiced delivered items list
```

Goal:

```text
Admin can record deliveries and corrections.
```

## Phase 2: Weekly Invoices

Build:

```text
invoices
invoice_items
```

UX:

```text
Create weekly invoice
Review uninvoiced delivered items
Generate draft
Issue invoice
Invoice needs_review badge
```

Goal:

```text
Customer can receive one weekly invoice.
```

## Phase 3: Supplier Fulfillment

Build:

```text
supplier_purchases
supplier_purchase_items
supplier_purchase_allocations
```

UX:

```text
Cisarua direct supplier flow
Ko Sandi customer-prepacked flow
Ready items for delivery
Mixed delivery support
```

Goal:

```text
Supplier direct and hybrid workflows work without forcing fake orders.
```

## Phase 4: Delivery Charges and Accounts

Build:

```text
delivery_charges
delivery_types
accounts
account_entries
```

UX:

```text
Add delivery charge
Bill customer toggle
Deduct from account toggle
Account balances
Top-ups
```

Goal:

```text
Delivery costs appear on invoices and staff delivery money is tracked.
```

## Phase 5: Stock Ledger

Build:

```text
stock_movements
product stock settings
```

UX:

```text
Purchase into stock
Stock delivery auto deduction
Stock adjustments
Stock movement history
```

Goal:

```text
Track stock only for items that need tracking.
```

## Phase 6: Polish and Reports

Build:

```text
Dashboard
Search/filtering
Export invoices
Supplier summaries
Customer weekly summaries
Account reports
Stock reports
```

Goal:

```text
Make the system useful for daily operations and review.
```

---

# 27. Final Architecture Rule Summary

```text
Customer is simple.
Sales line is what customer is being sold.
Delivery is what physically happened.
Delivery item can mix sources.
Delivery charge is separate from product items.
Supplier purchase is what you bought, not necessarily what customer ordered.
Supplier allocation links purchase lines to sales lines.
Invoice is a weekly snapshot.
Stock is derived from stock movements.
Account balance is derived from account entries.
Change log records amendments.
```

The core design principle:

> Use lines and ledgers. Do not force the messy business into a rigid order pipeline.
