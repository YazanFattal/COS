(function () {
  'use strict';
  const categories = [
    { id: 'rent', label: 'Rent / mortgage', group: 'home', example: 1200 },
    { id: 'utilities', label: 'Utilities', group: 'home', example: 150 },
    { id: 'mobile', label: 'Mobile services', group: 'home', example: 40 },
    { id: 'internet', label: 'Internet', group: 'home', example: 35 },
    { id: 'insurance', label: 'Insurance', group: 'home', example: 100 },
    { id: 'food', label: 'Food & groceries', group: 'life', example: 450 },
    { id: 'transport', label: 'Transportation', group: 'life', example: 200 },
    { id: 'entertainment', label: 'Entertainment & dining', group: 'life', example: 150 },
    { id: 'debt', label: 'Loan / debt payments', group: 'life', example: 100 },
    { id: 'other', label: 'Other expenses', group: 'other', example: 150 }
  ];
  function validateAmount(value, label) {
    if (!Number.isFinite(value) || value < 0 || value > 1e12) throw new Error(label + ' must be between 0 and 1 trillion.');
  }
  function calculateBudget({ salary, incomeType = 'gross', taxMode = 'amount', tax = 0, expenses = [], savings = 0 }) {
    validateAmount(salary, 'Monthly salary'); validateAmount(savings, 'Savings');
    if (!['gross', 'net'].includes(incomeType)) throw new Error('Choose before-tax or after-tax salary.');
    let taxes = 0;
    if (incomeType === 'gross') {
      if (!['amount', 'percent'].includes(taxMode)) throw new Error('Choose a tax amount or percentage.');
      validateAmount(tax, 'Taxes');
      if (taxMode === 'percent' && tax > 100) throw new Error('Tax percentage must be between 0% and 100%.');
      taxes = taxMode === 'percent' ? salary * tax / 100 : tax;
      if (taxes > salary) throw new Error('Taxes cannot exceed your monthly salary. Check your tax amount.');
    }
    if (!Array.isArray(expenses)) throw new Error('Enter your monthly expenses.');
    expenses.forEach(item => validateAmount(item.amount, item.label || 'Expense'));
    const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
    const takehome = salary - taxes, remainingRaw = takehome - expenseTotal - savings;
    const remaining = Math.abs(remainingRaw) < 0.005 ? 0 : remainingRaw;
    return { salary, taxes, takehome, expenseTotal, savings, remaining, annualSavings: savings * 12, savingsRate: takehome > 0 ? savings / takehome * 100 : null };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { calculateBudget };
  if (typeof document === 'undefined') return;
  const $ = id => document.getElementById(id), form = $('budget-form');
  const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: '$', AUD: '$', INR: '₹' };
  let incomeType = 'gross', taxMode = 'amount', customCount = 0, lastResult, liveTimer, toastTimer;
  const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: $('currency').value, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  const readAmount = (id, optional = true) => $(id).value.trim() === '' ? (optional && !$(id).validity.badInput ? 0 : NaN) : Number($(id).value);
  function makeField({ id, label, example }) {
    const field = document.createElement('div');
    const title = document.createElement('label'); title.className = 'field-label'; title.htmlFor = id; title.textContent = label;
    const wrap = document.createElement('div'); wrap.className = 'input-wrap';
    const symbol = document.createElement('span'); symbol.className = 'small-prefix currency-symbol'; symbol.textContent = '$'; symbol.setAttribute('aria-hidden', 'true');
    const input = document.createElement('input'); input.className = 'small-input money-input'; input.id = id; input.type = 'number'; input.inputMode = 'decimal'; input.min = '0'; input.max = '1000000000000'; input.step = 'any'; input.value = String(example); input.placeholder = '0'; input.setAttribute('aria-describedby', 'errors');
    wrap.append(symbol, input); field.append(title, wrap); return field;
  }
  categories.forEach(item => $(item.group + '-fields').append(makeField(item)));
  function updateSymbols() {
    document.querySelectorAll('.currency-symbol').forEach(el => { el.textContent = symbols[$('currency').value]; });
    $('tax-symbol').textContent = taxMode === 'percent' ? '%' : symbols[$('currency').value];
  }
  function notify(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false; toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2600); }
  function readExpenses() {
    return categories.map(item => ({ ...item, amount: readAmount(item.id) })).concat([...document.querySelectorAll('.custom-row')].map(row => ({ id: row.dataset.id, group: 'other', label: row.querySelector('.custom-name').value.trim() || 'Additional expense', amount: readAmount(row.dataset.id) })));
  }
  function setTaxState() {
    $('tax-fields').hidden = incomeType === 'net';
    $('tax').disabled = incomeType === 'net'; $('tax-mode').disabled = incomeType === 'net';
    $('income-hint').textContent = incomeType === 'net' ? 'Enter your take-home pay. Taxes will not be deducted again.' : 'Enter your gross salary. Taxes below will be subtracted.';
    $('tax-label').textContent = taxMode === 'percent' ? 'Tax rate (%)' : 'Monthly taxes'; $('tax').max = taxMode === 'percent' ? '100' : '1000000000000'; updateSymbols();
  }
  function render() {
    document.querySelectorAll('input[type="number"]').forEach(input => input.removeAttribute('aria-invalid'));
    try {
      const expenses = readExpenses(), data = { salary: readAmount('salary', false), incomeType, taxMode, tax: readAmount('tax'), savings: readAmount('savings'), expenses };
      const result = calculateBudget(data); lastResult = { ...result, data, expenses, currency: $('currency').value };
      $('errors').textContent = ''; $('monthly-value').textContent = money(result.remaining);
      const shortfall = result.remaining < 0;
      $('monthly-value').classList.toggle('negative', shortfall);
      $('result-title').textContent = shortfall ? 'Monthly shortfall' : 'Left each month';
      $('balance-summary-label').textContent = shortfall ? 'Budget shortfall' : 'Remaining balance';
      $('result-caption').textContent = 'after taxes, expenses & savings';
      $('budget-warning').hidden = !shortfall;
      $('budget-warning').textContent = 'Your plan is ' + money(Math.abs(result.remaining)) + ' over your monthly income. Adjust expenses or your savings goal to balance it.';
      $('salary-summary-label').textContent = incomeType === 'net' ? 'Salary after tax' : 'Salary before tax';
      const values = { 'salary-value': result.salary, 'tax-value': result.taxes, 'takehome-value': result.takehome, 'expenses-value': result.expenseTotal, 'savings-value': result.savings, 'balance-value': result.remaining, 'annual-savings': result.annualSavings };
      for (const [id, value] of Object.entries(values)) $(id).textContent = (['tax-value', 'expenses-value', 'savings-value'].includes(id) && value > 0 ? '−' : '') + money(value);
      $('savings-rate').textContent = result.savingsRate === null ? '—' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(result.savingsRate) + '%';
      for (const group of ['home', 'life', 'other']) $(group + '-total').textContent = money(expenses.filter(item => item.group === group).reduce((sum, item) => sum + item.amount, 0));
      $('expense-list').replaceChildren();
      for (const item of expenses) {
        const row = document.createElement('div'), label = document.createElement('dt'), value = document.createElement('dd');
        label.textContent = item.label; value.textContent = money(item.amount); row.append(label, value); $('expense-list').append(row);
      }
      const barTotal = Math.max(result.salary, result.taxes + result.expenseTotal + result.savings);
      for (const [name, amount] of Object.entries({ tax: result.taxes, expenses: result.expenseTotal, savings: result.savings, left: Math.max(0, result.remaining) })) $('bar-' + name).style.width = (barTotal > 0 ? amount / barTotal * 100 : 0) + '%';
      $('copy').disabled = false; return true;
    } catch (error) {
      lastResult = null; $('errors').textContent = error.message; $('copy').disabled = true;
      for (const id of ['monthly-value', 'salary-value', 'tax-value', 'takehome-value', 'expenses-value', 'savings-value', 'balance-value', 'annual-savings', 'savings-rate', 'home-total', 'life-total', 'other-total']) $(id).textContent = '—';
      $('monthly-value').classList.remove('negative'); $('result-title').textContent = 'Left each month'; $('result-caption').textContent = 'Check your inputs to see the breakdown'; $('budget-warning').hidden = true; $('expense-list').replaceChildren();
      ['tax','expenses','savings','left'].forEach(name => { $('bar-' + name).style.width = '0%'; });
      document.querySelectorAll('input[type="number"]:not(:disabled)').forEach(input => { if (!input.checkValidity() || !Number.isFinite(readAmount(input.id, input.id !== 'salary'))) input.setAttribute('aria-invalid', 'true'); });
      if (incomeType === 'gross' && readAmount('tax') > readAmount('salary') && taxMode === 'amount') $('tax').setAttribute('aria-invalid', 'true');
      return false;
    }
  }
  $('add-expense').addEventListener('click', () => {
    const id = 'custom-' + (++customCount), row = document.createElement('div'); row.className = 'custom-row'; row.dataset.id = id;
    const nameField = document.createElement('div'), nameLabel = document.createElement('label'), nameInput = document.createElement('input');
    nameLabel.className = 'field-label'; nameLabel.htmlFor = id + '-name'; nameLabel.textContent = 'Expense name'; nameInput.className = 'small-input custom-name'; nameInput.id = id + '-name'; nameInput.maxLength = 60; nameInput.placeholder = 'e.g. Gym'; nameField.append(nameLabel, nameInput);
    const amountField = makeField({ id, label: 'Monthly amount', example: 0 });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-expense'; remove.textContent = '×'; remove.setAttribute('aria-label', 'Remove additional expense ' + customCount);
    remove.addEventListener('click', () => { row.remove(); render(); $('example-label').textContent = 'Your budget · all amounts are monthly'; $('add-expense').focus(); });
    row.append(nameField, amountField, remove); $('custom-fields').append(row); updateSymbols(); render(); nameInput.focus(); $('example-label').textContent = 'Your budget · all amounts are monthly';
  });
  form.addEventListener('input', event => { if (event.target.name === 'income-type') return; $('example-label').textContent = 'Your budget · all amounts are monthly'; clearTimeout(liveTimer); liveTimer = setTimeout(render, 150); });
  form.addEventListener('change', event => {
    if (event.target.name === 'income-type') { incomeType = event.target.value; setTaxState(); render(); }
    if (event.target.id === 'tax-mode') {
      const salary = readAmount('salary', false), old = readAmount('tax');
      $('tax').value = Number.isFinite(old) && Number.isFinite(salary) ? String(Math.round((event.target.value === 'percent' ? (salary > 0 ? old / salary * 100 : 0) : salary * old / 100) * 100) / 100) : '';
      taxMode = event.target.value; setTaxState(); render();
    }
    if (event.target.id === 'currency') { updateSymbols(); render(); }
  });
  form.addEventListener('submit', event => { event.preventDefault(); clearTimeout(liveTimer); if (render()) notify('Your monthly budget is ready.'); else { const invalid = form.querySelector('[aria-invalid="true"]'); if (invalid) invalid.focus(); } });
  function resetBudget(example) {
    clearTimeout(liveTimer); form.reset(); $('custom-fields').replaceChildren(); incomeType = 'gross'; taxMode = 'amount';
    $('salary').value = example ? '5000' : '0'; $('tax').value = example ? '1000' : '0'; $('savings').value = example ? '500' : '0';
    categories.forEach(item => { $(item.id).value = example ? String(item.example) : '0'; });
    $('example-label').textContent = example ? 'Example budget · edit any amount' : 'Your budget · all amounts are monthly'; setTaxState(); render();
    notify(example ? 'Illustrative example loaded.' : 'All budget amounts cleared.');
  }
  $('clear').addEventListener('click', () => resetBudget(false)); $('load-example').addEventListener('click', () => resetBudget(true));
  $('copy').addEventListener('click', async () => {
    clearTimeout(liveTimer); if (!render()) return; const r = lastResult;
    const text = ['COS — Calculation of Salary', 'Monthly budget (' + r.currency + ')', 'Salary ' + (incomeType === 'gross' ? 'before tax' : 'after tax') + ': ' + money(r.salary), 'Taxes deducted: ' + money(r.taxes), 'Take-home pay: ' + money(r.takehome), '', ...r.expenses.map(item => item.label + ': ' + money(item.amount)), 'Total living expenses: ' + money(r.expenseTotal), '', 'Planned monthly savings: ' + money(r.savings), 'Annual savings goal: ' + money(r.annualSavings), 'Remaining monthly balance: ' + money(r.remaining), '', 'Estimate based on entered amounts. No automatic local tax calculation.'].join('\n');
    try { await navigator.clipboard.writeText(text); notify('Full budget breakdown copied.'); } catch { notify('Copy is unavailable in this browser.'); }
  });
  const dialog = $('info-dialog'); $('how-it-works').addEventListener('click', () => dialog.showModal()); $('close-info').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { const rect = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close(); });
  setTaxState(); render();
})();
