<script lang="ts">
	let announcement = $state('');
	let blockedDates = $state<string[]>([]);
	let newBlockedDate = $state('');
	let loading = $state(true);
	let saving = $state(false);
	let message = $state('');

	async function fetchSettings() {
		loading = true;
		try {
			const response = await fetch('/api/admin/settings');
			if (response.ok) {
				const data = await response.json();
				announcement = data.announcement ?? '';
				blockedDates = data.blockedDates ?? [];
			}
		} catch {
			// silently fail
		} finally {
			loading = false;
		}
	}

	async function saveAnnouncement() {
		saving = true;
		message = '';
		try {
			const response = await fetch('/api/admin/settings', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'updateAnnouncement', text: announcement })
			});
			if (response.ok) {
				message = 'Announcement saved';
			}
		} catch {
			message = 'Failed to save';
		} finally {
			saving = false;
			setTimeout(() => { message = ''; }, 3000);
		}
	}

	function addBlockedDate() {
		if (!newBlockedDate || blockedDates.includes(newBlockedDate)) return;
		blockedDates = [...blockedDates, newBlockedDate].sort();
		newBlockedDate = '';
		saveBlockedDates();
	}

	function removeBlockedDate(date: string) {
		blockedDates = blockedDates.filter((d) => d !== date);
		saveBlockedDates();
	}

	async function saveBlockedDates() {
		try {
			await fetch('/api/admin/settings', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'updateBlockedDates', dates: blockedDates })
			});
		} catch {
			// silently fail
		}
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr + 'T00:00:00');
		return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	}

	$effect(() => {
		fetchSettings();
	});
</script>

<div class="site-settings">
	{#if loading}
		<p class="loading-state">Loading settings...</p>
	{:else}
		<!-- Announcement Section -->
		<div class="settings-section">
			<h3 class="settings-title">Announcement</h3>
			<p class="settings-description">This message appears at the top of the order page. Leave empty to hide it.</p>
			<textarea
				class="announcement-input"
				bind:value={announcement}
				placeholder="e.g. We're closed this Saturday! Back next weekend."
				rows="3"
			></textarea>
			<div class="save-row">
				<button class="save-btn" onclick={saveAnnouncement} disabled={saving}>
					{saving ? 'Saving...' : 'Save Announcement'}
				</button>
				{#if message}
					<span class="save-message">{message}</span>
				{/if}
			</div>
		</div>

		<!-- Blocked Dates Section -->
		<div class="settings-section">
			<h3 class="settings-title">Blocked Dates</h3>
			<p class="settings-description">Block specific dates from accepting orders. Customers won't see time slots for these days.</p>

			<div class="add-date-row">
				<input
					type="date"
					class="date-input"
					bind:value={newBlockedDate}
				/>
				<button class="add-date-btn" onclick={addBlockedDate} disabled={!newBlockedDate}>
					Block Date
				</button>
			</div>

			{#if blockedDates.length > 0}
				<ul class="blocked-list">
					{#each blockedDates as date (date)}
						<li class="blocked-item">
							<span>{formatDate(date)}</span>
							<button class="remove-btn" onclick={() => removeBlockedDate(date)} aria-label="Remove {formatDate(date)}">
								Remove
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="empty-state">No dates blocked. All weekends are open for orders.</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.site-settings {
		width: 100%;
	}

	.loading-state,
	.empty-state {
		color: #6b7280;
		font-size: 0.875rem;
		padding: 0.5rem 0;
	}

	.settings-section {
		margin-bottom: 2rem;
	}

	.settings-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: #1a3f08;
		margin: 0 0 0.25rem;
	}

	.settings-description {
		font-size: 0.8125rem;
		color: #6b7280;
		margin: 0 0 0.75rem;
	}

	.announcement-input {
		width: 100%;
		padding: 0.75rem;
		font-size: 0.9375rem;
		border: 1.5px solid #d1d5db;
		border-radius: 0.5rem;
		resize: vertical;
		min-height: 4rem;
		font-family: inherit;
		color: #030500;
		background: #ffffff;
	}

	.announcement-input:focus {
		outline: none;
		border-color: #1a3f08;
	}

	.save-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.save-btn {
		padding: 0.5rem 1.25rem;
		background: #1a3f08;
		color: #ffffff;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		min-height: 44px;
	}

	.save-btn:hover:not(:disabled) {
		background: #122d05;
	}

	.save-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.save-message {
		font-size: 0.8125rem;
		color: #1a3f08;
		font-weight: 500;
	}

	.add-date-row {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.date-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1.5px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		min-height: 44px;
	}

	.date-input:focus {
		outline: none;
		border-color: #1a3f08;
	}

	.add-date-btn {
		padding: 0.5rem 1rem;
		background: #1a3f08;
		color: #ffffff;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		min-height: 44px;
		white-space: nowrap;
	}

	.add-date-btn:hover:not(:disabled) {
		background: #122d05;
	}

	.add-date-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.blocked-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.blocked-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid #f3f4f6;
		font-size: 0.9375rem;
		color: #030500;
	}

	.blocked-item:last-child {
		border-bottom: none;
	}

	.remove-btn {
		padding: 0.25rem 0.75rem;
		background: transparent;
		color: #dc2626;
		border: 1px solid #dc2626;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		min-height: 32px;
	}

	.remove-btn:hover {
		background: #fef2f2;
	}
</style>
