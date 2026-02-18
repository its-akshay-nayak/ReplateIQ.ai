import { SubscriptionTier } from '../types';

export const SUBSCRIPTION_CONFIG = {
    FEES: {
        // LIFETIME_ACCESS: 5.00,
    },
    [SubscriptionTier.FREE]: {
        name: 'Eco-Seed',
        price: 0,
        aiLimit: 3,
        canSellCredits: true,
        features: [
            'Unlimited Community Hub Access',
            'Basic Carbon Tracking',
            '3 AI Food Scans / Day',
            'Marketplace Access'
        ]
    },
    [SubscriptionTier.PRO]: {
        name: 'Eco-Sprout',
        price: 11.99,
        aiLimit: 15,
        canSellCredits: true,
        features: [
            '15 AI Food Scans / Day',
            '"Verified Pro" Profile Badge',
            'Priority Support'
        ]
    },
    [SubscriptionTier.BUSINESS]: {
        name: 'Eco-Harvest',
        price: 19.99,
        aiLimit: 999999, // Effectively unlimited
        canSellCredits: true,
        features: [
            'Unlimited AI Scans & Analysis',
            'Bulk Listing Tools (CSV/Batch)',
            'Business Profile & Branding',
            'All Pro Features Included'
        ]
    }
};
