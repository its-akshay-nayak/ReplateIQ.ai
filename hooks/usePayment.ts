import { useState } from 'react';
import { getPaymentProvider } from '../services/payment';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionTier } from '../types';
import { SUBSCRIPTION_CONFIG } from '../services/subscriptionConfig';

export const usePayment = () => {
    const { user, upgradeTier } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mock UI State
    const [showMockModal, setShowMockModal] = useState(false);
    const [mockDetails, setMockDetails] = useState({ price: 0, planName: '', tier: '' as SubscriptionTier | 'lifetime' });

    const initiateCheckout = async (priceId: string, tierName: SubscriptionTier | 'lifetime') => {
        if (!user) return;

        setError(null);

        // REAL MODE
        if (import.meta.env.VITE_USE_REAL_PAYMENTS === 'true') {
            setIsProcessing(true);
            try {
                const provider = getPaymentProvider();
                const result = await provider.initiateCheckout(priceId, user.id);
                if (!result.success) setError(result.error || "Payment failed");
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsProcessing(false);
            }
        }
        // MOCK MODE
        else {
            // Setup details for the modal
            let price = 0;
            let displayName = '';

            if (tierName === 'lifetime') {
                price = SUBSCRIPTION_CONFIG.FEES?.LIFETIME_ACCESS || 0;
                displayName = 'Lifetime Membership';
            } else {
                const tierConfig = SUBSCRIPTION_CONFIG[tierName as SubscriptionTier];
                price = tierConfig?.price || 0;
                displayName = tierConfig?.name || tierName;
            }

            setMockDetails({ price, planName: displayName, tier: tierName });
            setShowMockModal(true);
        }
    };

    const handleMockSuccess = async () => {
        if (mockDetails.tier) {
            await upgradeTier(mockDetails.tier as any); // Cast because lifetime is specialized in context
        }
        setShowMockModal(false);
    };

    return {
        initiateCheckout,
        isProcessing,
        error,
        // Mock Helpers
        showMockModal,
        setShowMockModal,
        mockDetails,
        handleMockSuccess
    };
};
