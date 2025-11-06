import Stripe from "stripe";
import { ENV } from "@/server/_core/env";

const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
});

/**
 * Create a Stripe Product for an offering
 */
export async function createStripeProduct(params: {
  name: string;
  description?: string;
  price: number; // in cents
  stripeAccountId: string;
}): Promise<{ productId: string; priceId: string }> {
  const { name, description, price, stripeAccountId } = params;

  // Create Product
  const product = await stripe.products.create(
    {
      name,
      description: description || undefined,
      metadata: {
        source: "tourismos",
      },
    },
    {
      stripeAccount: stripeAccountId,
    }
  );

  // Create Price for the Product
  const priceObj = await stripe.prices.create(
    {
      product: product.id,
      unit_amount: price,
      currency: "usd",
    },
    {
      stripeAccount: stripeAccountId,
    }
  );

  return {
    productId: product.id,
    priceId: priceObj.id,
  };
}

/**
 * Update a Stripe Product
 */
export async function updateStripeProduct(params: {
  productId: string;
  name?: string;
  description?: string;
  stripeAccountId: string;
}): Promise<void> {
  const { productId, name, description, stripeAccountId } = params;

  const updateData: Stripe.ProductUpdateParams = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description || "";

  if (Object.keys(updateData).length > 0) {
    await stripe.products.update(productId, updateData, {
      stripeAccount: stripeAccountId,
    });
  }
}

/**
 * Create a new Price for an existing Product (when price changes)
 */
export async function createNewPrice(params: {
  productId: string;
  price: number; // in cents
  stripeAccountId: string;
}): Promise<string> {
  const { productId, price, stripeAccountId } = params;

  const priceObj = await stripe.prices.create(
    {
      product: productId,
      unit_amount: price,
      currency: "usd",
    },
    {
      stripeAccount: stripeAccountId,
    }
  );

  return priceObj.id;
}

/**
 * Archive a Stripe Product (when offering is deleted)
 */
export async function archiveStripeProduct(params: {
  productId: string;
  stripeAccountId: string;
}): Promise<void> {
  const { productId, stripeAccountId } = params;

  await stripe.products.update(
    productId,
    { active: false },
    {
      stripeAccount: stripeAccountId,
    }
  );
}
