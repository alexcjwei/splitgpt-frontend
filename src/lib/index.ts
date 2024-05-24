// place files you want to import through the `$lib` alias in this folder.
export function resolveDebts(people: { name: string; amount: number }[]): string[] {
	const debtors = people.filter((person) => person.amount > 0).sort((a, b) => b.amount - a.amount);
	const creditors = people
		.filter((person) => person.amount < 0)
		.sort((a, b) => a.amount - b.amount);

	const steps = [];

	// Resolve the debts
	console.log(debtors, creditors);
	while (debtors.length > 0 && creditors.length > 0) {
		const debtor = debtors[0];
		const creditor = creditors[0];

		const transactionAmount = Math.min(debtor.amount, -creditor.amount);

		// Record the transaction
		steps.push(`${debtor.name} -> ${transactionAmount} -> ${creditor.name}`);

		// Update the amounts
		debtor.amount -= transactionAmount;
		creditor.amount += transactionAmount;

		// Remove fully settled debts/credits
		if (debtor.amount == 0) {
			debtors.shift();
		}
		if (creditor.amount == 0) {
			creditors.shift();
		}
	}

	return steps;
}
