import { Router, Request, Response } from 'express';
import { getStripeClient, tierFromPriceId } from '@/services/stripe';
import { prisma } from '@/services/db';
import { logger } from '@/services/logger';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const webhooksRouter = Router();

// POST /api/webhooks/stripe — Stripe subscription lifecycle events
// Must receive raw body — wire in app.ts BEFORE express.json()
webhooksRouter.post('/stripe', async (req: Request, res: Response) => {
  const stripe = getStripeClient();
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
    } else {
      // no webhook secret in dev — parse directly
      event = JSON.parse((req.body as Buffer).toString());
    }
  } catch (err) {
    logger.warn(`Stripe webhook signature failed: ${String(err)}`);
    res.status(400).send('Webhook signature failed');
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as { metadata?: { businessId?: string }; subscription?: string; customer?: string };
        const businessId = session.metadata?.businessId;
        if (!businessId) break;
        // get subscription details
        const sub = await stripe.subscriptions.retrieve(session.subscription as string) as unknown as { id: string; status: string; items: { data: { price: { id: string } }[] } };
        const priceId = sub.items.data[0]?.price?.id;
        const tier = tierFromPriceId(priceId);
        const slot = tier === 'premium' ? 1 : tier === 'featured' ? 2 : null;
        await prisma.business.update({
          where: { id: businessId },
          data: { tier, stripeSubscriptionId: sub.id, stripePriceId: priceId, subscriptionStatus: 'active', featuredSlot: slot } as any,
        });
        logger.info(`Business ${businessId} subscribed to ${tier} (slot ${slot})`);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as { id: string; status: string; customer: string; items: { data: { price: { id: string } }[] } };
        const business = await prisma.business.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (!business) break;
        const priceId = sub.items.data[0]?.price?.id;
        const tier = tierFromPriceId(priceId);
        const slot = tier === 'premium' ? 1 : tier === 'featured' ? 2 : null;
        await prisma.business.update({
          where: { id: business.id },
          data: { tier, stripePriceId: priceId, subscriptionStatus: sub.status, featuredSlot: slot } as any,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as { id: string };
        const business = await prisma.business.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (!business) break;
        await prisma.business.update({
          where: { id: business.id },
          data: { tier: 'free', subscriptionStatus: 'canceled', featuredSlot: null } as any,
        });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as { subscription?: string };
        if (!invoice.subscription) break;
        const business = await prisma.business.findFirst({ where: { stripeSubscriptionId: invoice.subscription as string } });
        if (!business) break;
        await prisma.business.update({ where: { id: business.id }, data: { subscriptionStatus: 'past_due' } as any });
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    logger.error(`Stripe webhook processing error: ${String(err)}`);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
