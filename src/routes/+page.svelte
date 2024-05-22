<script lang="ts">
	import { resolveDebts } from '$lib/index';

	let text = '';
	let submittedText = '';
	let contributionsTableColumns: string[] = [];
	let contributionsTableData: any[][] = [];
	let columnTotals: number[] = [];
	let rowTotals: number[] = [];
	let resolveDebtsResult: string[] = [];
	let netPerPerson: { name: string; amount: number }[] = [];

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
			const res = await fetch('http://localhost:8000/create-contributions-table', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ text })
			});
			const data = await res.json();
			contributionsTableColumns = data.columns;
			contributionsTableData = data.data;
			submittedText = text;
			text = '';
			updateCalculations();
		} catch (error) {
			console.log('Error', error);
			// Handle error here
		}
	}
</script>

<form>
	<textarea bind:value={text} />
	<button on:click={handleSubmit}>Submit</button>
</form>
{#if contributionsTableColumns.length === 0}
	<p>No data</p>
{:else}
	<div>
		<p>You wrote:</p>
		<p>{submittedText}</p>
	</div>
	<div>
		{#if resolveDebtsResult.length === 0}
			<p>No debts to resolve</p>
		{:else}
			<h3>Resolve debts</h3>
			<ol>
				{#each resolveDebtsResult as debt}
					<li>{debt}</li>
				{/each}
			</ol>
		{/if}
	</div>
	<div>
		<h3>Math</h3>
		<table>
			<caption><strong>Contributions</strong></caption>
			<thead>
				<tr>
					<th>{contributionsTableColumns[0]}</th>
					{#each contributionsTableColumns.slice(1) as col}
						<th>{col}</th>
					{/each}
					<th>TOTAL CONTRIBUTION</th>
				</tr>
			</thead>
			<tbody>
				{#each contributionsTableData as row, i}
					<tr>
						{#each row as cell, j}
							{#if j === 0}
								<th>{cell}</th>
							{:else}
								<td>
									<input
										type="number"
										value={cell}
										on:input={(event) => handleCellInputChange(event, i, j)}
									/>
								</td>
							{/if}
						{/each}
						<td>
							<strong>{rowTotals[i]}</strong>
						</td>
					</tr>
				{/each}
				<th>COST</th>
				{#each columnTotals as total}
					<td><strong>{total}</strong></td>
				{/each}
			</tbody>
		</table>
		<div>
			<h4>Net per person</h4>
			<ul>
				{#each netPerPerson as person}
					<li>{person.name}: {person.amount}</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}

<style></style>
