<svelte:head>
	<title>Info — Kuni Cafe</title>
</svelte:head>

<div class="info-page">
	<h1 class="page-title">Info</h1>

	<section class="info-section">
		<h2 class="section-title">Contact Us</h2>
		<p>
			Have a question, issue, or special request? Reach out on Instagram and we'll get back to you.
		</p>
		<a
			href="https://instagram.com/kuni_cafe"
			target="_blank"
			rel="noopener noreferrer"
			class="ig-link"
		>
			@kuni_cafe
		</a>
	</section>

	<section class="info-section">
		<h2 class="section-title">Common Questions</h2>

		<div class="faq-item">
			<h3 class="faq-question">I need to change my order, what do I do?</h3>
			<p>Send us a DM on Instagram with your order ID and what you'd like to change. We'll do our best to accommodate if we haven't started preparing it yet.</p>
		</div>

		<div class="faq-item">
			<h3 class="faq-question">I'm running late for my pickup time.</h3>
			<p>Just send us a quick message so we know. We prepare orders fresh right before your time slot, so a heads up helps us time things right.</p>
		</div>

		<div class="faq-item">
			<h3 class="faq-question">Do you do custom orders or catering?</h3>
			<p>Yes! DM us on Instagram to discuss party-sized desserts, bulk orders, or any custom requests. We ask for at least 1 week notice for larger orders.</p>
		</div>
	</section>

	<section class="info-section">
		<h2 class="section-title">No Ice / Light Ice</h2>
		<p>
			Drinks are carefully crafted with set ratios to maintain quality, balance, and flavor. No ice
			or light ice requests will contain the same amount of liquids as drinks with regular ice.
		</p>
		<p>
			Each drink uses 5g of matcha, which is equivalent to about 2 shots of espresso in strength.
			Extra milk can be added to fill the cup, but this will dilute the matcha, resulting in a
			milkier and less flavorful experience — not recommended, as it alters the intended taste and
			balance.
		</p>
		<p>Matcha is not batch prepped. Each serving is freshly whisked for optimal flavor and color.</p>
	</section>

	<section class="info-section">
		<h2 class="section-title">Late Pickups</h2>
		<p>
			If running late, please send a message. Each order is freshly prepared just before the
			scheduled pickup time. Arriving on time ensures the best taste, quality, and service
			experience. Timely pickups also help keep things running smoothly for everyone.
		</p>
	</section>

	<section class="info-section">
		<h2 class="section-title">Cancellations</h2>
		<p>
			All sales are final. Every order is made specifically for the customer and the time slot is
			reserved upon payment. Refunds are not available for cancelled orders.
		</p>
	</section>

	<section class="info-section">
		<h2 class="section-title">Allergy Notice</h2>
		<p>
			Please inform the owner ahead of time of any food allergies or dietary restrictions. While
			cross-contamination is avoided, this is a home-based cafe and allergens may be present.
		</p>
	</section>
</div>

<style>
	.info-page {
		max-width: 600px;
		margin: 0 auto;
		padding: 1.5rem 1rem;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: #1a3f08;
		margin: 0 0 2rem;
		text-align: center;
	}

	.info-section {
		margin: 0 0 2.5rem;
	}

	.section-title {
		font-size: 1.375rem;
		font-weight: 700;
		color: #1a3f08;
		margin: 0 0 0.75rem;
	}

	.info-section p {
		margin: 0 0 0.625rem;
		font-size: 0.9375rem;
		line-height: 1.7;
		color: #1f2937;
	}

	.info-section p:last-child {
		margin-bottom: 0;
	}

	.ig-link {
		display: inline-block;
		margin-top: 0.375rem;
		font-size: 1rem;
		font-weight: 700;
		color: #1a3f08;
		text-decoration: none;
	}

	.ig-link:hover {
		text-decoration: underline;
	}

	.faq-item {
		margin-bottom: 1.5rem;
	}

	.faq-item:last-child {
		margin-bottom: 0;
	}

	.faq-question {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #030500;
		margin: 0 0 0.25rem;
	}

	@media (min-width: 480px) {
		.info-page {
			padding: 2rem 1.5rem;
		}

		.page-title {
			font-size: 2rem;
		}
	}
</style>
