type SupplierPurchaseWorkflowHint = {
  detail: string;
  summary: string;
  tone: "default" | "warning" | "success";
};

function requiresCustomer(destinationType: string) {
  return (
    destinationType === "customer_direct" ||
    destinationType === "customer_prepacked"
  );
}

export function getSupplierPurchaseStatusWorkflowHint(status: string) {
  switch (status) {
    case "arrived":
      return "Customer prepacked items become delivery-ready. Customer direct items still wait for supplier delivery.";
    case "delivered_by_supplier":
      return "Customer direct items become delivered sales lines. Customer prepacked items still wait for arrival.";
    case "closed":
      return "Customer direct and customer prepacked items both materialize into customer sales lines.";
    case "void":
      return "Customer-linked fulfillment lines from this purchase are removed unless they are already in deliveries.";
    default:
      return "Customer-linked items stay as purchase records only until the purchase reaches an operational status.";
  }
}

export function getSupplierPurchaseItemWorkflowHint(input: {
  customerId: string | null;
  destinationType: string;
  status: string;
}): SupplierPurchaseWorkflowHint {
  if (input.destinationType === "stock") {
    return {
      summary: "Stock only",
      detail: "No customer sales line is created. This stays as stock-side purchasing only.",
      tone: "default",
    };
  }

  if (input.destinationType === "record_only") {
    return {
      summary: "Record only",
      detail: "No customer sales line or delivery queue item is created. This is bookkeeping only.",
      tone: "default",
    };
  }

  if (input.destinationType === "unknown") {
    return {
      summary: "Needs destination",
      detail: "No downstream workflow is created until the destination is clarified.",
      tone: "warning",
    };
  }

  if (requiresCustomer(input.destinationType) && !input.customerId) {
    return {
      summary: "Needs customer",
      detail: "This destination needs a customer before it can create any customer sales line.",
      tone: "warning",
    };
  }

  if (input.destinationType === "customer_direct") {
    if (input.status === "delivered_by_supplier" || input.status === "closed") {
      return {
        summary: "Creates delivered sales line",
        detail:
          "This will create or update a delivered supplier-direct sales line for invoicing and reporting.",
        tone: "success",
      };
    }

    return {
      summary: "Waiting for supplier delivery",
      detail:
        "No sales line is created yet. It will materialize only after the supplier has delivered to the customer.",
      tone: "default",
    };
  }

  if (input.destinationType === "customer_prepacked") {
    if (input.status === "arrived" || input.status === "closed") {
      return {
        summary: "Creates delivery-ready sales line",
        detail:
          "This will create or update a supplier-prepacked sales line that is ready for final delivery.",
        tone: "success",
      };
    }

    return {
      summary: "Waiting for arrival",
      detail:
        "No sales line is created yet. It will materialize after the prepacked goods arrive.",
      tone: "default",
    };
  }

  return {
    summary: "No automatic workflow",
    detail: "This item does not create a downstream customer workflow in the current configuration.",
    tone: "default",
  };
}
