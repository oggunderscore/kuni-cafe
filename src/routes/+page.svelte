<svelte:head>
	<title>Kuni Cafe — Home-based Matcha Cafe</title>
</svelte:head>

<section class="hero">
	<img
		src="/images/kuni_drinks_1.jpg"
		alt="Kuni Cafe matcha drinks"
		class="hero-image"
	/>

	<div class="hero-content">
		<h1 class="hero-title">Welcome to Kuni Cafe</h1>
		<p class="hero-subtitle">Highest quality local matcha served to you</p>
		<p class="hero-location">Home-based matcha cafe in Rowland Heights</p>

		<div class="cta-buttons">
			<a href="/order" class="cta cta-primary">Order Now</a>
		</div>
	</div>
</section>

<style>
	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1.5rem;
		padding: 1rem 0 2rem;
	}

	.hero-image {
		width: 100%;
		max-width: 400px;
		border-radius: 12px;
		object-fit: cover;
		aspect-ratio: 4 / 3;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	}

	.hero-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.hero-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: #1a3f08;
		margin: 0;
	}

	.hero-subtitle {
		font-size: 1.1rem;
		color: #1a3f08;
		margin: 0;
		opacity: 0.95;
		font-weight: 500;
	}

	.hero-location {
		font-size: 0.9375rem;
		color: #374151;
		margin: 0;
		opacity: 0.75;
	}

	.cta-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1rem;
		width: 100%;
		max-width: 280px;
	}

	.cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.875rem 1.5rem;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		min-height: 44px;
		min-width: 44px;
		transition: opacity 0.2s ease, transform 0.2s ease;
	}

	.cta:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.cta:active {
		transform: translateY(0);
	}

	.cta-primary {
		background-color: #1a3f08;
		color: #ffffff;
	}

	@media (min-width: 480px) {
		.hero {
			gap: 2rem;
			padding: 2rem 0 3rem;
		}

		.hero-title {
			font-size: 2rem;
		}

		.hero-subtitle {
			font-size: 1.2rem;
		}

		.cta-buttons {
			flex-direction: row;
			max-width: none;
			justify-content: center;
		}

		.cta {
			padding: 0.875rem 2rem;
		}
	}

	@media (min-width: 768px) {
		.hero {
			padding: 3rem 0 4rem;
		}

		.hero-image {
			max-width: 500px;
		}

		.hero-title {
			font-size: 2.5rem;
		}

		.hero-subtitle {
			font-size: 1.3rem;
		}
	}
</style>
