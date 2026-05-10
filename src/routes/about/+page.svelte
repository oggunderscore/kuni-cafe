<svelte:head>
	<title>About — Kuni Cafe</title>
</svelte:head>

<div class="about-page">
	<h1 class="page-title">About Kuni Cafe</h1>

	<section class="about-section">
		<h2 class="section-title">Who We Are</h2>
		<p>
			Kuni Cafe is a home-based matcha cafe located in Rowland Heights, California. We're open on
			Saturdays and Sundays, serving freshly whisked matcha drinks, handcrafted desserts, and
			good vibes.
		</p>
		<p>
			Every drink is made to order with care — no batch prep, no shortcuts. Just quality matcha
			and a passion for what we do.
		</p>
	</section>

	<section class="about-section">
		<h2 class="section-title">How It Works</h2>
		<p>
			Browse our menu, pick your items, choose a pickup time, and submit your order through the
			website. We'll have everything freshly prepared and ready for you when you arrive.
		</p>
	</section>

	<section class="about-section">
		<h2 class="section-title">Get In Touch</h2>
		<p>
			Have questions or special requests? Reach out to us on Instagram. We'd love to hear from you!
		</p>
	</section>
</div>

<style>
	.about-page {
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

	.about-section {
		margin: 0 0 2.5rem;
	}

	.section-title {
		font-size: 1.375rem;
		font-weight: 700;
		color: #1a3f08;
		margin: 0 0 0.75rem;
	}

	.about-section p {
		margin: 0 0 0.625rem;
		font-size: 0.9375rem;
		line-height: 1.7;
		color: #1f2937;
	}

	.about-section p:last-child {
		margin-bottom: 0;
	}

	@media (min-width: 480px) {
		.about-page {
			padding: 2rem 1.5rem;
		}

		.page-title {
			font-size: 2rem;
		}

		.section-title {
			font-size: 1.125rem;
		}
	}
</style>
