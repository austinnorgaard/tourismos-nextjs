/**
 * Customer Loyalty Program Service
 * Points, rewards, tiers, and referral system
 */

interface LoyaltyMember {
  userId: number;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lifetimePoints: number;
  joinDate: Date;
  referralCode: string;
  referredBy?: string;
}

interface LoyaltyReward {
  id: number;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'freebie' | 'upgrade';
  value: number; // Percentage or fixed amount in cents
  expiryDays?: number;
}

interface LoyaltyTransaction {
  id: number;
  userId: number;
  points: number;
  type: 'earn' | 'redeem' | 'expire';
  reason: string;
  bookingId?: number;
  rewardId?: number;
  date: Date;
}

/**
 * Loyalty tier configuration
 */
export const LOYALTY_TIERS = {
  bronze: {
    name: 'Bronze',
    minPoints: 0,
    benefits: ['Earn 1 point per $1 spent', 'Birthday bonus: 50 points'],
    color: '#CD7F32',
  },
  silver: {
    name: 'Silver',
    minPoints: 500,
    benefits: ['Earn 1.25 points per $1 spent', 'Priority support', 'Birthday bonus: 100 points'],
    color: '#C0C0C0',
  },
  gold: {
    name: 'Gold',
    minPoints: 1500,
    benefits: ['Earn 1.5 points per $1 spent', 'Free upgrades', 'Early access to new offerings', 'Birthday bonus: 200 points'],
    color: '#FFD700',
  },
  platinum: {
    name: 'Platinum',
    minPoints: 5000,
    benefits: ['Earn 2 points per $1 spent', 'Exclusive experiences', 'Concierge service', 'Birthday bonus: 500 points'],
    color: '#E5E4E2',
  },
};

/**
 * Available rewards catalog
 */
export const REWARDS_CATALOG: LoyaltyReward[] = [
  {
    id: 1,
    name: '$10 Off',
    description: '$10 discount on your next booking',
    pointsCost: 100,
    type: 'discount',
    value: 1000, // $10 in cents
    expiryDays: 90,
  },
  {
    id: 2,
    name: '$25 Off',
    description: '$25 discount on your next booking',
    pointsCost: 250,
    type: 'discount',
    value: 2500,
    expiryDays: 90,
  },
  {
    id: 3,
    name: '$50 Off',
    description: '$50 discount on your next booking',
    pointsCost: 500,
    type: 'discount',
    value: 5000,
    expiryDays: 90,
  },
  {
    id: 4,
    name: '15% Off',
    description: '15% discount on any booking',
    pointsCost: 300,
    type: 'discount',
    value: 15, // Percentage
    expiryDays: 60,
  },
  {
    id: 5,
    name: '25% Off',
    description: '25% discount on any booking',
    pointsCost: 600,
    type: 'discount',
    value: 25,
    expiryDays: 60,
  },
  {
    id: 6,
    name: 'Free Upgrade',
    description: 'Complimentary upgrade on your next experience',
    pointsCost: 400,
    type: 'upgrade',
    value: 0,
    expiryDays: 90,
  },
  {
    id: 7,
    name: 'Free Add-on',
    description: 'Complimentary add-on service',
    pointsCost: 200,
    type: 'freebie',
    value: 0,
    expiryDays: 90,
  },
];

/**
 * Loyalty Program Service
 */
export class LoyaltyProgramService {
  /**
   * Get or create loyalty member
   */
  async getMember(userId: number): Promise<LoyaltyMember> {
    // In production, fetch from database
    console.log('[Loyalty] Getting member:', userId);

    return {
      userId,
      points: 0,
      tier: 'bronze',
      lifetimePoints: 0,
      joinDate: new Date(),
      referralCode: this.generateReferralCode(),
    };
  }

  /**
   * Award points for booking
   */
  async awardPoints(userId: number, bookingAmount: number, bookingId: number): Promise<number> {
    const member = await this.getMember(userId);
    const multiplier = this.getTierMultiplier(member.tier);
    
    // Base: 1 point per dollar, adjusted by tier multiplier
    const pointsEarned = Math.floor((bookingAmount / 100) * multiplier);

    // Update member points
    member.points += pointsEarned;
    member.lifetimePoints += pointsEarned;

    // Check for tier upgrade
    const newTier = this.calculateTier(member.lifetimePoints);
    if (newTier !== member.tier) {
      console.log(`[Loyalty] User ${userId} upgraded to ${newTier}!`);
      member.tier = newTier;
    }

    // Log transaction
    const transaction: LoyaltyTransaction = {
      id: Date.now(),
      userId,
      points: pointsEarned,
      type: 'earn',
      reason: `Booking #${bookingId}`,
      bookingId,
      date: new Date(),
    };

    console.log('[Loyalty] Awarded points:', transaction);

    // In production, save to database
    return pointsEarned;
  }

  /**
   * Redeem reward
   */
  async redeemReward(userId: number, rewardId: number): Promise<{ success: boolean; code: string }> {
    const member = await this.getMember(userId);
    const reward = REWARDS_CATALOG.find(r => r.id === rewardId);

    if (!reward) {
      throw new Error('Reward not found');
    }

    if (member.points < reward.pointsCost) {
      throw new Error('Insufficient points');
    }

    // Deduct points
    member.points -= reward.pointsCost;

    // Generate reward code
    const code = this.generateRewardCode();

    // Log transaction
    const transaction: LoyaltyTransaction = {
      id: Date.now(),
      userId,
      points: -reward.pointsCost,
      type: 'redeem',
      reason: `Redeemed: ${reward.name}`,
      rewardId,
      date: new Date(),
    };

    console.log('[Loyalty] Redeemed reward:', transaction);

    // In production, save to database and create discount code
    return {
      success: true,
      code,
    };
  }

  /**
   * Award referral bonus
   */
  async awardReferralBonus(referrerId: number, newUserId: number): Promise<void> {
    const referrerBonus = 250; // Points for referrer
    const newUserBonus = 100; // Points for new user

    // Award to referrer
    const referrer = await this.getMember(referrerId);
    referrer.points += referrerBonus;
    referrer.lifetimePoints += referrerBonus;

    // Award to new user
    const newUser = await this.getMember(newUserId);
    newUser.points += newUserBonus;
    newUser.lifetimePoints += newUserBonus;

    console.log('[Loyalty] Awarded referral bonuses:', {
      referrer: { userId: referrerId, bonus: referrerBonus },
      newUser: { userId: newUserId, bonus: newUserBonus },
    });

    // In production, save to database
  }

  /**
   * Award birthday bonus
   */
  async awardBirthdayBonus(userId: number): Promise<number> {
    const member = await this.getMember(userId);
    const bonusPoints = this.getTierBirthdayBonus(member.tier);

    member.points += bonusPoints;
    member.lifetimePoints += bonusPoints;

    const transaction: LoyaltyTransaction = {
      id: Date.now(),
      userId,
      points: bonusPoints,
      type: 'earn',
      reason: 'Birthday bonus',
      date: new Date(),
    };

    console.log('[Loyalty] Awarded birthday bonus:', transaction);

    // In production, save to database
    return bonusPoints;
  }

  /**
   * Get member's transaction history
   */
  async getTransactionHistory(userId: number, limit: number = 50): Promise<LoyaltyTransaction[]> {
    console.log('[Loyalty] Getting transaction history for user:', userId);

    // In production, fetch from database
    return [];
  }

  /**
   * Get available rewards for member
   */
  async getAvailableRewards(userId: number): Promise<Array<LoyaltyReward & { canAfford: boolean }>> {
    const member = await this.getMember(userId);

    return REWARDS_CATALOG.map(reward => ({
      ...reward,
      canAfford: member.points >= reward.pointsCost,
    }));
  }

  /**
   * Calculate tier based on lifetime points
   */
  private calculateTier(lifetimePoints: number): LoyaltyMember['tier'] {
    if (lifetimePoints >= LOYALTY_TIERS.platinum.minPoints) return 'platinum';
    if (lifetimePoints >= LOYALTY_TIERS.gold.minPoints) return 'gold';
    if (lifetimePoints >= LOYALTY_TIERS.silver.minPoints) return 'silver';
    return 'bronze';
  }

  /**
   * Get points multiplier for tier
   */
  private getTierMultiplier(tier: LoyaltyMember['tier']): number {
    const multipliers = {
      bronze: 1.0,
      silver: 1.25,
      gold: 1.5,
      platinum: 2.0,
    };
    return multipliers[tier];
  }

  /**
   * Get birthday bonus for tier
   */
  private getTierBirthdayBonus(tier: LoyaltyMember['tier']): number {
    const bonuses = {
      bronze: 50,
      silver: 100,
      gold: 200,
      platinum: 500,
    };
    return bonuses[tier];
  }

  /**
   * Generate unique referral code
   */
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate reward redemption code
   */
  private generateRewardCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'REWARD-';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Calculate points needed for next tier
   */
  getPointsToNextTier(member: LoyaltyMember): number | null {
    const tiers = ['bronze', 'silver', 'gold', 'platinum'] as const;
    const currentIndex = tiers.indexOf(member.tier);
    
    if (currentIndex === tiers.length - 1) {
      return null; // Already at highest tier
    }

    const nextTier = tiers[currentIndex + 1];
    const nextTierMinPoints = LOYALTY_TIERS[nextTier].minPoints;
    
    return nextTierMinPoints - member.lifetimePoints;
  }

  /**
   * Get member's tier progress percentage
   */
  getTierProgress(member: LoyaltyMember): number {
    const tiers = ['bronze', 'silver', 'gold', 'platinum'] as const;
    const currentIndex = tiers.indexOf(member.tier);
    
    if (currentIndex === tiers.length - 1) {
      return 100; // Already at highest tier
    }

    const currentTierMin = LOYALTY_TIERS[member.tier].minPoints;
    const nextTier = tiers[currentIndex + 1];
    const nextTierMin = LOYALTY_TIERS[nextTier].minPoints;
    
    const progress = ((member.lifetimePoints - currentTierMin) / (nextTierMin - currentTierMin)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }
}

/**
 * Helper function to format points display
 */
export function formatPoints(points: number): string {
  return points.toLocaleString() + (points === 1 ? ' point' : ' points');
}

/**
 * Helper function to get tier badge color
 */
export function getTierColor(tier: LoyaltyMember['tier']): string {
  return LOYALTY_TIERS[tier].color;
}
