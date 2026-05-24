"""Pydantic models matching @receiptbrain/contracts.

The shapes are duplicated in TypeScript and Python so each side can validate
independently. The contract test in JS asserts these mirror the Zod schemas.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ExtractedItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    unitPrice: float
    quantity: int = 1
    lineTotal: float
    category: (
        Literal[
            "groceries",
            "dining",
            "transport",
            "software",
            "entertainment",
            "utilities",
            "household",
            "health",
            "travel",
            "other",
        ]
        | None
    ) = None
    confidence: float | None = None


class FieldConfidence(BaseModel):
    merchant: float | None = None
    total: float | None = None
    purchasedAt: float | None = None
    items: float | None = None


class Usage(BaseModel):
    promptTokens: int
    completionTokens: int
    costUsdEstimate: float


class ExtractRequest(BaseModel):
    image_b64: str = Field(..., description="Base64-encoded image bytes")
    promptVersion: str | None = None


class ExtractResponse(BaseModel):
    merchant: str
    rawMerchant: str | None = None
    currency: str
    subtotal: float | None = None
    tax: float | None = None
    tip: float | None = None
    total: float
    purchasedAt: str
    paymentLast4: str | None = None
    items: list[ExtractedItem]
    fieldConfidence: FieldConfidence
    model: str
    promptVersion: str
    usage: Usage


# Recommend
class TopMerchant(BaseModel):
    merchant: str
    spend: float
    visits: int


class MonthlyTotal(BaseModel):
    month: str = Field(pattern=r"^\d{4}-\d{2}$")
    total: float


class RecurringCandidate(BaseModel):
    merchant: str
    amount: float
    interval: Literal["weekly", "monthly", "quarterly", "yearly"]
    lastCharge: str
    occurrences: int


class RecommendSummary(BaseModel):
    topMerchants: list[TopMerchant]
    monthlyTotals: list[MonthlyTotal]
    recurringCandidates: list[RecurringCandidate]


class RecommendRequest(BaseModel):
    windowDays: int = 90
    currency: str
    summary: RecommendSummary


class InsightAction(BaseModel):
    label: str
    kind: Literal["external_link", "in_app", "dismiss"]
    target: str | None = None


class RecommendedInsight(BaseModel):
    type: Literal["cheaper_alternative", "subscription_waste", "spending_spike", "optimization_tip"]
    title: str
    description: str
    estimatedSavings: float | None = None
    currency: str | None = None
    action: InsightAction | None = None
    sourceReceiptIds: list[str] = Field(default_factory=list)
    sourceSubscriptionId: str | None = None
    confidence: float


class RecommendResponse(BaseModel):
    items: list[RecommendedInsight]
    model: str
    promptVersion: str
    usage: Usage
