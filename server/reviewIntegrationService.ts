/**
 * Review Platform Integration Service
 * Integrates with TripAdvisor, Google Reviews, and other review platforms
 */

interface Review {
  id: string;
  platform: 'tripadvisor' | 'google' | 'yelp' | 'other';
  rating: number;
  title?: string;
  text: string;
  authorName: string;
  authorImage?: string;
  date: Date;
  url?: string;
}

/**
 * Fetch reviews from Google My Business
 * Note: Requires Google My Business API credentials
 */
export async function fetchGoogleReviews(placeId: string): Promise<Review[]> {
  // This would use Google Places API to fetch reviews
  // For now, return mock structure
  console.log(`[Reviews] Fetching Google reviews for place: ${placeId}`);
  
  return [];
}

/**
 * Fetch reviews from TripAdvisor
 * Note: Requires TripAdvisor API credentials
 */
export async function fetchTripAdvisorReviews(locationId: string): Promise<Review[]> {
  // This would use TripAdvisor Content API
  console.log(`[Reviews] Fetching TripAdvisor reviews for location: ${locationId}`);
  
  return [];
}

/**
 * Aggregate reviews from all platforms
 */
export async function aggregateReviews(businessId: number, platforms: {
  googlePlaceId?: string;
  tripAdvisorLocationId?: string;
  yelpBusinessId?: string;
}): Promise<{
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  platformBreakdown: Record<string, { count: number; avgRating: number }>;
}> {
  const allReviews: Review[] = [];

  // Fetch from each platform
  if (platforms.googlePlaceId) {
    const googleReviews = await fetchGoogleReviews(platforms.googlePlaceId);
    allReviews.push(...googleReviews);
  }

  if (platforms.tripAdvisorLocationId) {
    const tripAdvisorReviews = await fetchTripAdvisorReviews(platforms.tripAdvisorLocationId);
    allReviews.push(...tripAdvisorReviews);
  }

  // Calculate aggregate stats
  const totalReviews = allReviews.length;
  const averageRating = totalReviews > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  // Platform breakdown
  const platformBreakdown: Record<string, { count: number; avgRating: number }> = {};
  
  ['google', 'tripadvisor', 'yelp'].forEach(platform => {
    const platformReviews = allReviews.filter(r => r.platform === platform);
    if (platformReviews.length > 0) {
      platformBreakdown[platform] = {
        count: platformReviews.length,
        avgRating: platformReviews.reduce((sum, r) => sum + r.rating, 0) / platformReviews.length,
      };
    }
  });

  return {
    reviews: allReviews.sort((a, b) => b.date.getTime() - a.date.getTime()),
    averageRating,
    totalReviews,
    platformBreakdown,
  };
}

/**
 * Generate review widget HTML for embedding on public site
 */
export function generateReviewWidget(reviews: Review[], options: {
  maxReviews?: number;
  showPlatformLogos?: boolean;
  theme?: 'light' | 'dark';
} = {}): string {
  const {
    maxReviews = 5,
    showPlatformLogos = true,
    theme = 'light',
  } = options;

  const displayReviews = reviews.slice(0, maxReviews);
  
  return `
<div class="review-widget theme-${theme}">
  <div class="reviews-container">
    ${displayReviews.map(review => `
      <div class="review-card">
        <div class="review-header">
          <div class="review-author">
            ${review.authorImage ? `<img src="${review.authorImage}" alt="${review.authorName}" class="author-avatar">` : ''}
            <span class="author-name">${review.authorName}</span>
          </div>
          ${showPlatformLogos ? `<span class="platform-badge">${review.platform}</span>` : ''}
        </div>
        <div class="review-rating">
          ${'★'.repeat(Math.floor(review.rating))}${'☆'.repeat(5 - Math.floor(review.rating))}
        </div>
        ${review.title ? `<h4 class="review-title">${review.title}</h4>` : ''}
        <p class="review-text">${review.text}</p>
        <div class="review-footer">
          <span class="review-date">${review.date.toLocaleDateString()}</span>
          ${review.url ? `<a href="${review.url}" target="_blank" rel="noopener">Read more</a>` : ''}
        </div>
      </div>
    `).join('')}
  </div>
</div>
  `.trim();
}

/**
 * Send review request email to customer after booking completion
 */
export async function sendReviewRequest(booking: {
  customerName: string;
  customerEmail: string;
  offeringName: string;
  businessName: string;
  reviewLinks: {
    google?: string;
    tripadvisor?: string;
  };
}): Promise<void> {
  const emailContent = `
Dear ${booking.customerName},

Thank you for choosing ${booking.businessName} for your ${booking.offeringName} experience!

We hope you had a wonderful time. Your feedback helps us improve and helps other travelers discover great experiences.

Would you mind taking a moment to share your thoughts?

${booking.reviewLinks.google ? `📝 Leave a Google Review: ${booking.reviewLinks.google}\n` : ''}
${booking.reviewLinks.tripadvisor ? `📝 Leave a TripAdvisor Review: ${booking.reviewLinks.tripadvisor}\n` : ''}

Your review means the world to us!

Best regards,
${booking.businessName} Team
  `.trim();

  console.log('[Reviews] Review request email:', {
    to: booking.customerEmail,
    subject: `How was your experience with ${booking.businessName}?`,
    content: emailContent,
  });

  // In production, send via email service
}
