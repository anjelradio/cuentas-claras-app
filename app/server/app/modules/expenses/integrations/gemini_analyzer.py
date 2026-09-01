import json
import logging
from decimal import Decimal

from google import genai
from google.genai import types

from app.core.config import Settings
from app.modules.expenses.models.enums import ExpenseCategory
from app.modules.expenses.schemas.expense_schemas import ReceiptAnalysisResponse

logger = logging.getLogger(__name__)

GEMINI_RECEIPT_PROMPT = """
Analyze the provided image and determine whether it is a receipt, invoice, commercial bill, or payment ticket containing financial transaction details, OR if it is a photo of products, items, market goods, groceries, activities, or general items.

Return a JSON object matching this schema:
{
  "is_receipt": boolean,
  "name": string or null,
  "description": string or null,
  "amount": number or null,
  "category": string or null,
  "expense_date": string or null
}

Categories must strictly be one of: "food", "lodging", "transport", "shopping", "entertainment", "other".
- "food": food, meals, vegetables, fruits, meat, market groceries, supermarket goods, drinks, cafes, snacks.
- "lodging": hotels, accommodation, lodging supplies.
- "transport": vehicles, taxi, gasoline, bus, plane, tickets, toll.
- "shopping": clothing, accessories, electronics, hardware, personal items, retail items.
- "entertainment": games, tours, recreational activities, parties, cinema.
- "other": other items not fitting above.

Rules:
1. If the image is a PHOTO OF PRODUCTS / MARKET / ITEMS (NOT a printed receipt with financial breakdown/total):
   - Set "is_receipt": false
   - "category": Infer the most appropriate category based on visual content (e.g. if fruits/vegetables/food/drinks -> "food", if clothes/tools -> "shopping", etc.).
   - "name": Suggest a natural, friendly title in Spanish for the purchase (e.g. "Compra de frutas y verduras", "Compra de víveres en el mercado", "Compra de bebidas", "Compras de ropa", "Artículos de ferretería"). Max 60 characters.
   - "description": null
   - "amount": null (since prices are not formally printed on product photos)
   - "expense_date": null

2. If the image IS a RECEIPT / INVOICE / TICKET:
   - Set "is_receipt": true
   - "category": Strictly one of "food", "lodging", "transport", "shopping", "entertainment", "other".
   - "name": A natural, concise title in Spanish for the expense activity (e.g. "Café en El Medievo", "Almuerzo en El Medievo", "Cena en La Pérgola", "Compras en Hipermaxi", "Transporte / Taxi", "Hospedaje en Hotel Central"). Max 60 characters.
   - "description": null (keep null so the user can write custom notes; the receipt image itself is attached).
   - "amount": The final total amount paid as a positive number (float/decimal).
   - "expense_date": The transaction date converted to "YYYY-MM-DD" format if visible on the receipt (e.g. "8/2/2019" -> "2019-02-08"), else null.
"""


class GeminiReceiptAnalyzer:
    def __init__(self, settings: Settings):
        self.api_key = settings.gemini_api_key
        self.model = settings.gemini_model or "gemini-2.0-flash-lite"
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    def analyze_image_bytes(
        self,
        image_bytes: bytes,
        mime_type: str,
        image_url: str,
        receipt_public_id: str | None = None,
    ) -> ReceiptAnalysisResponse:
        """
        Analiza los bytes de la imagen con Gemini y devuelve los datos extraídos estructurados.
        En caso de error o si la API key no está configurada, retorna gracefully con is_receipt=False.
        """
        if not self.client:
            logger.warning("Gemini API key no configurada. Saltando análisis inteligente.")
            return ReceiptAnalysisResponse(
                image_url=image_url,
                receipt_public_id=receipt_public_id,
                is_receipt=False,
            )

        try:
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            
            # Intento con el modelo configurado
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=[image_part, GEMINI_RECEIPT_PROMPT],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1,
                    ),
                )
            except Exception as model_err:
                logger.warning(
                    "Fallo al invocar modelo %s (%s). Intentando con fallback gemini-1.5-flash...",
                    self.model,
                    model_err,
                )
                response = self.client.models.generate_content(
                    model="gemini-1.5-flash",
                    contents=[image_part, GEMINI_RECEIPT_PROMPT],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1,
                    ),
                )

            if not response.text:
                logger.warning("Gemini retornó una respuesta vacía.")
                return ReceiptAnalysisResponse(
                    image_url=image_url,
                    receipt_public_id=receipt_public_id,
                    is_receipt=False,
                )

            data = json.loads(response.text)
            is_receipt = bool(data.get("is_receipt", False))

            name = data.get("name")
            if name and isinstance(name, str):
                name = name.strip()[:100]
            else:
                name = None

            raw_category = data.get("category")
            category = None
            if raw_category:
                try:
                    category = ExpenseCategory(str(raw_category).lower())
                except ValueError:
                    category = ExpenseCategory.OTHER if is_receipt else None

            raw_amount = data.get("amount") if is_receipt else None
            amount = None
            if raw_amount is not None:
                try:
                    amount = Decimal(str(raw_amount)).quantize(Decimal("0.01"))
                    if amount <= Decimal("0.00"):
                        amount = None
                except Exception:
                    amount = None

            expense_date_raw = data.get("expense_date") if is_receipt else None
            expense_date = None
            if expense_date_raw and isinstance(expense_date_raw, str):
                cleaned_date = expense_date_raw.strip().split(" ")[0].split("T")[0]
                for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%d/%m/%y", "%d-%m-%y"):
                    try:
                        from datetime import datetime as dt
                        expense_date = dt.strptime(cleaned_date, fmt).strftime("%Y-%m-%d")
                        break
                    except ValueError:
                        continue

            return ReceiptAnalysisResponse(
                image_url=image_url,
                receipt_public_id=receipt_public_id,
                is_receipt=is_receipt,
                name=name,
                description=None,
                amount=amount,
                category=category,
                expense_date=expense_date,
            )
        except Exception as error:
            logger.error(
                "Error durante el análisis del recibo con Gemini: %s",
                error,
                exc_info=True,
            )
            # Fallback seguro: degradación elegante según requerimiento FR-010
            return ReceiptAnalysisResponse(
                image_url=image_url,
                receipt_public_id=receipt_public_id,
                is_receipt=False,
            )
