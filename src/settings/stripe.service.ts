import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-10-28.acacia',
    });
  }

  async createPaymentIntent() {
    return this.stripe.paymentIntents.create({
      amount: 2999, // $29.99
      currency: 'usd',
    });
  }
}
