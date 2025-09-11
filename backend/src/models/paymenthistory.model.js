const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer'],
    required: true
  },
  last4: String,               // Derniers 4 chiffres de la carte
  brand: String,              // visa, mastercard, amex, etc.
  expiryMonth: Number,
  expiryYear: Number,
  fingerprint: String,        // Identifiant unique Stripe
  country: String
});

const discountSchema = new mongoose.Schema({
  code: String,
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount']
  },
  value: Number,
  description: String
});

const taxSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['vat', 'sales_tax', 'gst']
  },
  rate: Number,               // Pourcentage
  amount: Number,             // Montant en centimes
  country: String,
  region: String
});

const refundSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    enum: ['requested_by_customer', 'duplicate', 'fraudulent', 'subscription_cancellation', 'other'],
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed'],
    default: 'pending'
  },
  stripeRefundId: String,
  processedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const paymentHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Informations de paiement de base
  amount: {
    type: Number,
    required: true,
    min: 0 // Montant en centimes
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['EUR', 'USD', 'GBP', 'CAD'],
    default: 'EUR'
  },
  status: {
    type: String,
    enum: [
      'pending',           // En attente
      'processing',        // En traitement
      'succeeded',         // Réussi
      'failed',           // Échoué
      'canceled',         // Annulé
      'refunded',         // Remboursé
      'partially_refunded' // Partiellement remboursé
    ],
    required: true,
    index: true
  },
  
  // Type de transaction
  type: {
    type: String,
    enum: ['subscription', 'one_time', 'upgrade', 'downgrade', 'renewal', 'refund'],
    required: true,
    index: true
  },
  
  // Détails de l'abonnement (si applicable)
  subscription: {
    level: {
      type: String,
      enum: ['explore', 'perform', 'pro', 'elite']
    },
    period: {
      type: String,
      enum: ['monthly', 'yearly']
    },
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
    trialEnd: Date,
    previousLevel: String       // Pour les upgrades/downgrades
  },
  
  // Identifiants externes
  stripePaymentIntentId: String,
  stripeInvoiceId: String,
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  stripeSessionId: String,
  
  // Méthode de paiement
  paymentMethod: paymentMethodSchema,
  
  // Détails financiers
  pricing: {
    subtotal: Number,           // Montant avant taxes et remises
    discount: discountSchema,
    tax: taxSchema,
    total: Number              // Montant final
  },
  
  // Remboursements
  refunds: [refundSchema],
  totalRefunded: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Informations sur l'échec (si applicable)
  failureInfo: {
    code: String,
    message: String,
    declineCode: String,
    networkStatus: String,
    reason: String,
    riskLevel: String,
    sellerMessage: String,
    type: String
  },
  
  // Métadonnées
  metadata: {
    userAgent: String,
    ipAddress: String,
    country: String,
    platform: {
      type: String,
      enum: ['web', 'mobile_ios', 'mobile_android']
    },
    referrer: String,
    campaign: String           // Code de campagne marketing
  },
  
  // Dates importantes
  attemptedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  nextRetryAt: Date,
  
  // Gestion des tentatives
  attempts: {
    type: Number,
    default: 1,
    min: 1
  },
  maxAttempts: {
    type: Number,
    default: 3,
    min: 1
  },
  
  // Statut business
  businessStatus: {
    subscriptionActive: Boolean,
    accessGranted: Boolean,
    featuresUnlocked: [String],
    gracePeriodEnd: Date
  },
  
  // Notifications
  notifications: {
    customerNotified: {
      type: Boolean,
      default: false
    },
    adminNotified: {
      type: Boolean,
      default: false
    },
    notificationsSent: [{
      type: {
        type: String,
        enum: ['email', 'sms', 'push', 'webhook']
      },
      status: {
        type: String,
        enum: ['sent', 'delivered', 'failed']
      },
      sentAt: Date,
      error: String
    }]
  },
  
  // Audit et sécurité
  audit: {
    riskScore: Number,          // 0-100
    fraudulent: {
      type: Boolean,
      default: false
    },
    reviewRequired: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    notes: String
  }
}, {
  timestamps: true
});

// Index composites pour les requêtes courantes
paymentHistorySchema.index({ userId: 1, status: 1 });
paymentHistorySchema.index({ userId: 1, type: 1, createdAt: -1 });
paymentHistorySchema.index({ stripeCustomerId: 1 });
paymentHistorySchema.index({ 'subscription.level': 1, status: 1 });
paymentHistorySchema.index({ createdAt: -1, status: 1 });
paymentHistorySchema.index({ amount: -1, currency: 1 });

// Index pour les recherches administratives
paymentHistorySchema.index({ 'audit.fraudulent': 1 });
paymentHistorySchema.index({ 'audit.reviewRequired': 1 });
paymentHistorySchema.index({ 'metadata.country': 1 });

// Méthodes d'instance
paymentHistorySchema.methods.isSuccessful = function() {
  return this.status === 'succeeded';
};

paymentHistorySchema.methods.canBeRefunded = function() {
  const allowedStatuses = ['succeeded'];
  const maxRefundAge = 90; // 90 jours
  const daysSincePayment = (new Date() - this.createdAt) / (1000 * 60 * 60 * 24);
  
  return allowedStatuses.includes(this.status) && 
         daysSincePayment <= maxRefundAge &&
         this.totalRefunded < this.amount;
};

paymentHistorySchema.methods.getRemainingRefundableAmount = function() {
  return Math.max(0, this.amount - this.totalRefunded);
};

paymentHistorySchema.methods.addRefund = function(refundData) {
  this.refunds.push(refundData);
  this.totalRefunded += refundData.amount;
  
  if (this.totalRefunded >= this.amount) {
    this.status = 'refunded';
  } else if (this.totalRefunded > 0) {
    this.status = 'partially_refunded';
  }
  
  return this.save();
};

paymentHistorySchema.methods.getAmountInEuros = function() {
  if (this.currency === 'EUR') {
    return this.amount / 100;
  }
  
  // TODO: Conversion de devises en temps réel
  const conversionRates = {
    'USD': 0.85,
    'GBP': 1.15,
    'CAD': 0.65
  };
  
  return (this.amount / 100) * (conversionRates[this.currency] || 1);
};

paymentHistorySchema.methods.shouldRetry = function() {
  return this.status === 'failed' && 
         this.attempts < this.maxAttempts &&
         !this.audit.fraudulent &&
         (!this.nextRetryAt || this.nextRetryAt <= new Date());
};

// Méthodes statiques
paymentHistorySchema.statics.getUserPaymentHistory = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'email prenom nom');
};

paymentHistorySchema.statics.getSubscriptionHistory = function(userId, subscriptionLevel = null) {
  const query = { 
    userId, 
    type: { $in: ['subscription', 'renewal', 'upgrade', 'downgrade'] }
  };
  
  if (subscriptionLevel) {
    query['subscription.level'] = subscriptionLevel;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

paymentHistorySchema.statics.getRevenueStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'succeeded'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          currency: '$currency'
        },
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1 }
    }
  ]);
};

paymentHistorySchema.statics.getFailureAnalysis = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: 'failed'
      }
    },
    {
      $group: {
        _id: '$failureInfo.code',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        examples: { $push: { userId: '$userId', amount: '$amount', createdAt: '$createdAt' } }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

paymentHistorySchema.statics.getPendingRefunds = function() {
  return this.find({
    'refunds.status': 'pending'
  }).populate('userId', 'email prenom nom');
};

// Middleware pré-sauvegarde
paymentHistorySchema.pre('save', function(next) {
  // Calculer automatiquement le total avec taxes et remises
  if (this.pricing && this.pricing.subtotal) {
    let total = this.pricing.subtotal;
    
    // Appliquer la remise
    if (this.pricing.discount) {
      if (this.pricing.discount.type === 'percentage') {
        total = total * (1 - this.pricing.discount.value / 100);
      } else {
        total = Math.max(0, total - this.pricing.discount.value);
      }
    }
    
    // Ajouter les taxes
    if (this.pricing.tax && this.pricing.tax.amount) {
      total += this.pricing.tax.amount;
    }
    
    this.pricing.total = Math.round(total);
    this.amount = this.pricing.total;
  }
  
  // Mettre à jour la date de traitement si le statut change vers succeeded
  if (this.isModified('status') && this.status === 'succeeded' && !this.processedAt) {
    this.processedAt = new Date();
  }
  
  next();
});

module.exports = mongoose.model('PaymentHistory', paymentHistorySchema);