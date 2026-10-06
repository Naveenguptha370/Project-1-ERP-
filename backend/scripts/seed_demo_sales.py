"""Add a labelled, idempotent sales pipeline example to the configured database."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app.database.base  # noqa: F401 - register every ORM model
from app.database import SessionLocal
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.product import Product
from app.models.quotation import Quotation
from app.models.sales_order import SalesOrder
from app.schemas.payment import PaymentCreate
from app.schemas.quotation import QuotationCreate, QuotationItemCreate
from app.services import payment_service, quotation_service, sales_order_service


DEMO_EMAIL = "demo.sales@smarterp.local"
DEMO_CUSTOMER_NAME = "Aster Office Solutions (Sample)"
DEMO_MARKERS = {
    "accepted": "SMARTERP_DEMO_SALES_ACCEPTED",
    "sent": "SMARTERP_DEMO_SALES_SENT",
    "rejected": "SMARTERP_DEMO_SALES_REJECTED",
}


def main() -> None:
    with SessionLocal() as db:
        products = {
            product.sku: product
            for product in db.query(Product).filter(
                Product.sku.in_(
                    ["DEMO-LAPTOP-01", "DEMO-MONITOR-01", "DEMO-MOUSE-01", "DEMO-KEYBOARD-01"]
                )
            )
        }
        required_skus = {"DEMO-LAPTOP-01", "DEMO-MONITOR-01", "DEMO-MOUSE-01", "DEMO-KEYBOARD-01"}
        if required_skus - products.keys():
            raise SystemExit(
                "Demo inventory products are missing. Run seed_demo_inventory.py first."
            )

        customer = db.query(Customer).filter(Customer.email == DEMO_EMAIL).first()
        if customer is None:
            customer = Customer(
                name=DEMO_CUSTOMER_NAME,
                company_name="Sample Organization",
                email=DEMO_EMAIL,
                city="Bengaluru",
                country="India",
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)

        quote_definitions = [
            (
                "accepted",
                "Accepted sample quotation converted to an order and partially paid invoice.",
                "DEMO-LAPTOP-01",
                2,
            ),
            (
                "sent",
                "Open sample quotation awaiting customer response.",
                "DEMO-MOUSE-01",
                10,
            ),
            (
                "rejected",
                "Sample quotation marked rejected for pipeline reporting.",
                "DEMO-KEYBOARD-01",
                6,
            ),
        ]

        for marker, note, sku, quantity in quote_definitions:
            quote = db.query(Quotation).filter(Quotation.notes == DEMO_MARKERS[marker]).first()
            if quote is None:
                product = products[sku]
                quote = quotation_service.create_quotation(
                    db,
                    QuotationCreate(
                        customer_id=customer.id,
                        customer_name=customer.name,
                        customer_email=customer.email,
                        issue_date=None,
                        status="Sent" if marker == "sent" else "Draft",
                        notes=DEMO_MARKERS[marker],
                        terms=note,
                        items=[
                            QuotationItemCreate(
                                product_id=product.id,
                                product_name=product.product_name,
                                description="Sample sales transaction",
                                quantity=quantity,
                                unit_price=float(product.selling_price),
                                tax_rate=float(product.tax_percentage),
                            )
                        ],
                    ),
                )

            if marker == "accepted":
                if not quote.sales_order_id:
                    quote = quotation_service.update_quotation_status(db, quote.id, "Accepted")
                    order = quotation_service.convert_to_sales_order(db, quote.id)
                else:
                    order = db.query(SalesOrder).filter(
                        SalesOrder.id == quote.sales_order_id
                    ).first()

                if order is None:
                    raise RuntimeError(
                        f"Sample quotation {quote.quote_number} references a missing sales order."
                    )
                if not order.invoice_id:
                    invoice = sales_order_service.convert_to_invoice(db, order.id)
                else:
                    invoice = db.query(Invoice).filter(Invoice.id == order.invoice_id).first()

                if invoice is None:
                    raise RuntimeError(
                        f"Sample sales order {order.order_number} references a missing invoice."
                    )
                payment_marker = f"{DEMO_MARKERS[marker]}_PAYMENT"
                payment_exists = db.query(Payment).filter(
                    Payment.notes == payment_marker
                ).first()
                if payment_exists is None:
                    payment_service.record_payment(
                        db,
                        PaymentCreate(
                            invoice_id=invoice.id,
                            customer_id=customer.id,
                            customer_name=customer.name,
                            payment_method="Bank Transfer",
                            reference_number="DEMO-UTR-2026-001",
                            amount=round(invoice.total_amount * 0.6, 2),
                            notes=payment_marker,
                        ),
                    )
            elif marker == "rejected" and quote.status != "Rejected":
                quotation_service.update_quotation_status(db, quote.id, "Rejected")

        quote_count = db.query(Quotation).filter(
            Quotation.notes.in_(list(DEMO_MARKERS.values()))
        ).count()
        order_count = db.query(SalesOrder).join(
            Quotation, SalesOrder.quotation_id == Quotation.id
        ).filter(Quotation.notes == DEMO_MARKERS["accepted"]).count()
        invoice_count = db.query(Invoice).join(
            SalesOrder, Invoice.sales_order_id == SalesOrder.id
        ).join(Quotation, SalesOrder.quotation_id == Quotation.id).filter(
            Quotation.notes == DEMO_MARKERS["accepted"]
        ).count()
        payment_count = db.query(Payment).filter(
            Payment.notes == f"{DEMO_MARKERS['accepted']}_PAYMENT"
        ).count()
        print(
            f"Sample sales pipeline ready: {quote_count} quotations, "
            f"{order_count} order, {invoice_count} invoice, and "
            f"{payment_count} payment."
        )


if __name__ == "__main__":
    main()
