<script lang="ts">
	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

	import { resolveDebts } from '$lib/index';
	import Header from '$lib/components/Header.svelte';

	let text = '';
	let submittedText = '';
	let errorMessage = '';
	let contributionsTableColumns: string[] = [];
	let contributionsTableData: any[][] = [];
	let columnTotals: number[] = [];
	let rowTotals: number[] = [];
	let resolveDebtsResult: string[] = [];
	let netPerPerson: { name: string; contributed: number; consumed: number; amount: number }[] = [];

	function updateCalculations() {
		updateTotals();
		updateResolveDebtsResult();
	}

	function updateResolveDebtsResult() {
		const numPeople = contributionsTableData.length;
		const consumptionPerPerson = columnTotals.reduce((acc, val) => acc + val, 0) / numPeople;
		const people = contributionsTableData.map((row, index) => ({
			name: row[0],
			// Divide value evenly amoung everyone for now
			consumed: consumptionPerPerson,
			contributed: rowTotals[index],
			amount: consumptionPerPerson - rowTotals[index]
		}));
		netPerPerson = structuredClone(people);
		resolveDebtsResult = resolveDebts(people);
	}

	function updateTotals() {
		columnTotals = Array(contributionsTableColumns.length - 1).fill(0);

		contributionsTableData.forEach((row) => {
			row.forEach((cell, i) => {
				if (i > 0 && !isNaN(cell)) {
					columnTotals[i - 1] += cell;
				}
			});
		});

		rowTotals = Array(contributionsTableData.length).fill(0);
		contributionsTableData.forEach((row, i) => {
			let rowTotal = 0;
			row.forEach((cell, j) => {
				if (j > 0 && !isNaN(cell)) {
					rowTotal += cell;
				}
			});
			rowTotals[i] = rowTotal;
		});
	}

	function handleCellInputChange(event: any, rowIndex: number, columnIndex: number) {
		const value = parseFloat(event.target.value) || 0;
		contributionsTableData[rowIndex][columnIndex] = value;
		updateCalculations();
	}

	async function handleSubmit() {
		try {
			const res = await fetch(`${apiBaseUrl}/create-contributions-table`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ text })
			});
			const data = await res.json();
			console.log(data);
			if (!res.ok) {
				errorMessage = data.detail;
				return;
			}
			errorMessage = '';
			contributionsTableColumns = data.columns;
			contributionsTableData = data.data;
			submittedText = text;
			text = '';
			updateCalculations();
		} catch (error) {
			errorMessage = 'Unknown error occurred. Please try again later.';
			console.log('Error', error);
			// Handle error here
		}
	}
</script>

<div>
	<Header />
	<form class="flex flex-col items-center p-2 w-1/3 mx-auto">
		<textarea
			name="text"
			bind:value={text}
			required
			class="w-full p-2 mb-4 outline"
			placeholder="Alice bought the unicorn waffle maker for $45, and Bob got the glow-in-the-dark mix for $10."
		/>
		{#if errorMessage}
			<p class="error text-red-500 py-2">{errorMessage}</p>
		{/if}
		<button
			on:click={handleSubmit}
			class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
		>
			Submit
		</button>
	</form>

	{#if contributionsTableColumns.length !== 0}
		<div class="flex flex-col w-1/2 p-2 mx-auto">
			<div class="quote bg-gray-100 p-4 my-4">
				<blockquote class="text-xl italic">{submittedText}</blockquote>
			</div>
			<div>
				{#if resolveDebtsResult.length === 0}
					<p>No debts to resolve</p>
				{:else}
					<h3 class="text-2xl font-bold mt-4"><span>🔀</span> Steps to resolve debts</h3>
					<ol class="list-decimal list-inside">
						{#each resolveDebtsResult as debt}
							<li class="text-lg">{debt}</li>
						{/each}
					</ol>
				{/if}
			</div>
			<div>
				<h3 class="text-2xl font-bold mt-4"><span>🧮</span> Math</h3>
				<p class="text-sm text-gray-500 mb-2">
					Note: You can edit the table below if the model got something wrong.
				</p>
				<table class="border-collapse border border-gray-300">
					<thead>
						<tr>
							<th class="border border-gray-300 p-2">{contributionsTableColumns[0]}</th>
							{#each contributionsTableColumns.slice(1) as col}
								<th class="border border-gray-300 p-2">{col}</th>
							{/each}
							<th class="border border-gray-300 p-2">Total contribution</th>
						</tr>
					</thead>
					<tbody>
						{#each contributionsTableData as row, i}
							<tr>
								{#each row as cell, j}
									{#if j === 0}
										<th class="border border-gray-300 p-2">{cell}</th>
									{:else}
										<td class="border border-gray-300 p-2">
											<input
												type="number"
												value={cell}
												on:input={(event) => handleCellInputChange(event, i, j)}
												class="w-16 p-1 text-center mx-auto"
											/>
										</td>
									{/if}
								{/each}
								<td class="border border-gray-300 p-2">
									<strong>{rowTotals[i]}</strong>
								</td>
							</tr>
						{/each}
						<tr>
							<th class="border border-gray-300 p-2">Total Cost</th>
							{#each columnTotals as total}
								<td class="border border-gray-300 p-2"><strong>{total}</strong></td>
							{/each}
						</tr>
					</tbody>
				</table>
				<div>
					<h3 class="text-2xl font-bold mt-4"><span>💰</span>Net balances</h3>
					<ul class="list-disc list-inside">
						{#each netPerPerson as person}
							<li>
								{person.name}: {person.amount} (paid {person.contributed}, consumed {person.consumed})
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	{/if}
</div>

<style></style>
