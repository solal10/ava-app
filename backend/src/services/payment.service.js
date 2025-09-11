let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠️ STRIPE_SECRET_KEY non configuré - Paiements désactivés');
}
const User = require('../models/user.model');

// Configuration des prix par abonnement (en centimes)
const SUBSCRIPTION_PRICES = {
  explore: { monthly: 0, yearly: 0 }, // Gratuit
  perform: { monthly: 999, yearly: 9999 }, // 9.99€/mois, 99.99€/an
  pro: { monthly: 1999, yearly: 19999 }, // 19.99€/mois, 199.99€/an
  elite: { monthly: 4999, yearly: 49999 } // 49.99€/mois, 499.99€/an
};

// Métadonnées des abonnements
const SUBSCRIPTION_METADATA = {
  perform: {
    name: 'AVA Perform',
    features: ['Données cardiaques', 'Chat IA illimité', 'Programme personnalisé']
  },
  pro: {
    name: 'AVA Pro',
    features: ['Données cardiaques', 'Niveau de stress', 'Chat IA illimité', 'Programme personnalisé', 'Analyse de performance']
  },
  elite: {
    name: 'AVA Elite',
    features: ['Toutes les fonctionnalités Pro', 'Score nutritionnel', 'Coach personnel']
  }
};

class PaymentService {
  // Créer une session de paiement Stripe Checkout
  async createCheckoutSession(userId, subscriptionLevel, billingPeriod = 'monthly') {
    try {
      if (!stripe) {
        throw new Error('Service de paiement non configuré');
      }
      
      if (!SUBSCRIPTION_PRICES[subscriptionLevel]) {
        throw new Error('Niveau d\'abonnement invalide');
      }

      if (subscriptionLevel === 'explore') {
        throw new Error('L\'abonnement Explore est gratuit');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      const price = SUBSCRIPTION_PRICES[subscriptionLevel][billingPeriod];
      const metadata = SUBSCRIPTION_METADATA[subscriptionLevel];

      // Créer ou récupérer le client Stripe
      let stripeCustomer;
      if (user.stripeCustomerId) {
        stripeCustomer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        stripeCustomer = await stripe.customers.create({
          email: user.email,
          name: `${user.prenom || ''} ${user.nom || ''}`.trim(),
          metadata: {
            userId: userId.toString()
          }
        });

        // Sauvegarder l'ID client Stripe
        user.stripeCustomerId = stripeCustomer.id;
        await user.save();
      }

      // Créer la session de checkout
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomer.id,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: metadata.name,
              description: `Abonnement ${metadata.name} (${billingPeriod === 'monthly' ? 'Mensuel' : 'Annuel'})`,
              metadata: {
                features: metadata.features.join(', ')
              }
            },
            recurring: {
              interval: billingPeriod === 'monthly' ? 'month' : 'year'
            },
            unit_amount: price
          },
          quantity: 1
        }],
        success_url: `${process.env.CORS_ORIGIN}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CORS_ORIGIN}/subscription/cancel`,
        metadata: {
          userId: userId.toString(),
          subscriptionLevel: subscriptionLevel,
          billingPeriod: billingPeriod
        }
      });

      return {
        sessionId: session.id,
        sessionUrl: session.url,
        customerId: stripeCustomer.id
      };

    } catch (error) {
      console.error('Erreur lors de la création de la session de paiement:', error);
      throw error;
    }
  }

  // Gérer le webhook Stripe
  async handleWebhook(body, signature) {
    try {
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!endpointSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET manquant');
      }

      const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
      
      console.log('🎯 Webhook Stripe reçu:', event.type);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;
          
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
          
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object);
          break;
          
        default:
          console.log(`Event type non traité: ${event.type}`);
      }

      return { received: true };

    } catch (error) {
      console.error('Erreur webhook Stripe:', error);
      throw error;
    }
  }

  // Gérer le checkout complété
  async handleCheckoutCompleted(session) {
    try {
      const userId = session.metadata.userId;
      const subscriptionLevel = session.metadata.subscriptionLevel;

      const user = await User.findById(userId);
      if (!user) {
        console.error('Utilisateur non trouvé pour le checkout:', userId);
        return;
      }

      // Mettre à jour l'abonnement utilisateur
      user.subscriptionLevel = subscriptionLevel;
      user.subscriptionStatus = 'active';
      user.stripeSubscriptionId = session.subscription;
      
      await user.save();

      console.log('✅ Abonnement activé:', {
        userId: userId,
        level: subscriptionLevel,
        subscriptionId: session.subscription
      });

    } catch (error) {
      console.error('Erreur handleCheckoutCompleted:', error);
    }
  }

  // Gérer le paiement réussi
  async handlePaymentSucceeded(invoice) {
    try {
      const customerId = invoice.customer;
      const user = await User.findOne({ stripeCustomerId: customerId });
      
      if (!user) {
        console.error('Utilisateur non trouvé pour le customer:', customerId);
        return;
      }

      user.subscriptionStatus = 'active';
      user.lastPaymentDate = new Date();
      
      await user.save();

      console.log('✅ Paiement confirmé:', {
        userId: user._id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency
      });

    } catch (error) {
      console.error('Erreur handlePaymentSucceeded:', error);
    }
  }

  // Gérer l'échec de paiement
  async handlePaymentFailed(invoice) {
    try {
      const customerId = invoice.customer;
      const user = await User.findOne({ stripeCustomerId: customerId });
      
      if (!user) {
        console.error('Utilisateur non trouvé pour le customer:', customerId);
        return;
      }

      user.subscriptionStatus = 'payment_failed';
      await user.save();

      console.log('❌ Échec de paiement:', {
        userId: user._id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency
      });

    } catch (error) {
      console.error('Erreur handlePaymentFailed:', error);
    }
  }

  // Gérer l'annulation d'abonnement
  async handleSubscriptionCanceled(subscription) {
    try {
      const customerId = subscription.customer;
      const user = await User.findOne({ stripeCustomerId: customerId });
      
      if (!user) {
        console.error('Utilisateur non trouvé pour le customer:', customerId);
        return;
      }

      user.subscriptionLevel = 'explore'; // Retour au plan gratuit
      user.subscriptionStatus = 'canceled';
      user.stripeSubscriptionId = null;
      
      await user.save();

      console.log('🚫 Abonnement annulé:', {
        userId: user._id,
        previousLevel: user.subscriptionLevel
      });

    } catch (error) {
      console.error('Erreur handleSubscriptionCanceled:', error);
    }
  }

  // Annuler un abonnement
  async cancelSubscription(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.stripeSubscriptionId) {
        throw new Error('Aucun abonnement actif trouvé');
      }

      await stripe.subscriptions.del(user.stripeSubscriptionId);

      user.subscriptionLevel = 'explore';
      user.subscriptionStatus = 'canceled';
      user.stripeSubscriptionId = null;
      
      await user.save();

      return {
        message: 'Abonnement annulé avec succès',
        subscriptionLevel: 'explore'
      };

    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      throw error;
    }
  }

  // Récupérer l'historique des paiements
  async getPaymentHistory(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.stripeCustomerId) {
        return { invoices: [] };
      }

      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 12 // 12 dernières factures
      });

      const history = invoices.data.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: invoice.status,
        date: new Date(invoice.created * 1000),
        description: invoice.lines.data[0]?.description || 'Abonnement AVA',
        invoiceUrl: invoice.hosted_invoice_url
      }));

      return { invoices: history };

    } catch (error) {
      console.error('Erreur récupération historique:', error);
      throw error;
    }
  }

  // Créer un portail client
  async createPortalSession(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.stripeCustomerId) {
        throw new Error('Aucun client Stripe associé');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.CORS_ORIGIN}/subscription/manage`
      });

      return {
        portalUrl: session.url
      };

    } catch (error) {
      console.error('Erreur création portail client:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();