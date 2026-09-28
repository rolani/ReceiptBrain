import { describe, expect, it } from 'vitest';
import {
  buildMerchantReceiptIndex,
  resolveInsightSourceReceiptIds,
  type ReceiptForProvenance,
  type SubscriptionForProvenance,
} from '../../src/domain/insight-provenance.js';

const receipts: ReceiptForProvenance[] = [
  { id: 'r1', merchantName: 'Shoppers Drug Mart' },
  { id: 'r2', merchantName: 'Pacific Fresh Food Market' },
  { id: 'r3', merchantName: 'HubSpot' },
];

const subs: SubscriptionForProvenance[] = [
  {
    id: 'sub1',
    merchantName: 'HubSpot',
    sourceReceiptIds: ['r3'],
  },
];

describe('resolveInsightSourceReceiptIds', () => {
  it('keeps valid AI-provided receipt ids', () => {
    const ids = resolveInsightSourceReceiptIds(
      {
        type: 'optimization_tip',
        title: 'Tip',
        description: 'Desc',
        sourceReceiptIds: ['r1', 'r99'],
      },
      receipts,
      subs,
    );
    expect(ids).toEqual(['r1']);
  });

  it('infers receipts when AI returns empty ids but merchant is named', () => {
    const ids = resolveInsightSourceReceiptIds(
      {
        type: 'optimization_tip',
        title: 'Monitor Spending at Shoppers Drug Mart',
        description: 'You visited often.',
        sourceReceiptIds: [],
      },
      receipts,
      subs,
    );
    expect(ids).toEqual(['r1']);
  });

  it('uses subscription source receipts for subscription_waste', () => {
    const ids = resolveInsightSourceReceiptIds(
      {
        type: 'subscription_waste',
        title: 'Assess HubSpot Subscription Value',
        description: 'Recurring charge detected.',
        sourceReceiptIds: [],
      },
      receipts,
      subs,
    );
    expect(ids).toEqual(['r3']);
  });

  it('falls back to all window receipts for generic insights', () => {
    const ids = resolveInsightSourceReceiptIds(
      {
        type: 'spending_spike',
        title: 'Track Daily Grocery Expenses',
        description: 'Overall grocery spend is elevated.',
        sourceReceiptIds: [],
      },
      receipts,
      subs,
    );
    expect(ids).toEqual(['r1', 'r2', 'r3']);
  });
});

describe('buildMerchantReceiptIndex', () => {
  it('groups receipt ids by merchant name', () => {
    expect(
      buildMerchantReceiptIndex([
        { id: 'a', merchantName: 'Starbucks' },
        { id: 'b', merchantName: 'Starbucks' },
        { id: 'c', merchantName: 'Other' },
      ]),
    ).toEqual(
      new Map([
        ['Starbucks', ['a', 'b']],
        ['Other', ['c']],
      ]),
    );
  });
});
