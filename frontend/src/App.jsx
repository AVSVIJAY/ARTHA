import { useEffect, useMemo, useState } from 'react'

const categories = ['All', 'Home', 'Fashion', 'Utilities & Bills', 'Groceries', 'Food & Dining', 'Travel', 'Health & Medical', 'Family', 'Savings', 'Miscellaneous']
const emptyExpenseForm = { description: '', amount: '', category: 'Food & Dining', date: new Date().toISOString().slice(0, 10), note: '' }
const pieColors = ['#849300', '#d98254', '#709bb2', '#a97eb7', '#d6b65e', '#6d9f8a', '#ce8292', '#8f9d6d', '#95816f', '#7f8aaf']

const formatMoney = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0)
const formatDate = (date) => new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' }).format(new Date(`${date}T00:00:00`))
const categoryClass = (category) => category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')
const pointOnCircle = (angle) => {
  const radians = ((angle - 90) * Math.PI) / 180
  return { x: 100 + 80 * Math.cos(radians), y: 100 + 80 * Math.sin(radians) }
}
const slicePath = (startAngle, endAngle) => {
  if (endAngle - startAngle >= 359.99) return 'M 100 20 A 80 80 0 1 1 99.99 20 Z'
  const start = pointOnCircle(endAngle)
  const end = pointOnCircle(startAngle)
  return `M 100 100 L ${start.x} ${start.y} A 80 80 0 ${endAngle - startAngle > 180 ? 1 : 0} 0 ${end.x} ${end.y} Z`
}

function App() {
  const [expenses, setExpenses] = useState([])
  const [income, setIncome] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm)
  const [incomeAmount, setIncomeAmount] = useState('')
  const [isExpenseFormOpen, setExpenseFormOpen] = useState(false)
  const [isIncomeFormOpen, setIncomeFormOpen] = useState(false)
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hoveredSlice, setHoveredSlice] = useState(null)

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const query = selectedCategory === 'All' ? '' : `?category=${encodeURIComponent(selectedCategory)}`
      const [expensesResponse, incomeResponse] = await Promise.all([fetch(`/api/expenses${query}`), fetch('/api/expenses/income')])
      if (!expensesResponse.ok || !incomeResponse.ok) throw new Error('Could not load your finances')
      setExpenses(await expensesResponse.json())
      setIncome(Number((await incomeResponse.json()).amount))
      setError('')
    } catch {
      setError('The API is offline. Start the Java server and refresh this page.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDashboard() }, [selectedCategory])

  const totals = useMemo(() => {
    const expensesTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    return { expensesTotal, remaining: income - expensesTotal }
  }, [expenses, income])

  const pieSegments = useMemo(() => {
    const grouped = expenses.reduce((result, expense) => ({ ...result, [expense.category]: (result[expense.category] || 0) + Number(expense.amount) }), {})
    const total = Object.values(grouped).reduce((sum, amount) => sum + amount, 0)
    let cursor = 0
    return Object.entries(grouped).map(([category, amount], index) => {
      const startAngle = cursor
      const endAngle = total ? cursor + (amount / total) * 360 : cursor
      cursor = endAngle
      return { category, amount, color: pieColors[index % pieColors.length], path: slicePath(startAngle, endAngle) }
    })
  }, [expenses])

  const submitExpense = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const response = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...expenseForm, amount: Number(expenseForm.amount) }) })
      if (!response.ok) throw new Error()
      setExpenseForm(emptyExpenseForm)
      setExpenseFormOpen(false)
      await loadDashboard()
    } catch {
      setError('Could not save the expense. Check that the Java API is running.')
    }
  }

  const submitIncome = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const response = await fetch('/api/expenses/income', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Number(incomeAmount) }) })
      if (!response.ok) throw new Error()
      setIncome(Number((await response.json()).amount))
      setIncomeAmount('')
      setIncomeFormOpen(false)
    } catch {
      setError('Could not save your income. Check that the Java API is running.')
    }
  }

  const removeExpense = async (id) => {
    const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    if (!response.ok) setError('Could not delete the expense.')
    else await loadDashboard()
  }

  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="/" aria-label="Artha home"><span className="brand-mark">a</span> artha</a><div className="topbar-actions"><span className="status-dot" /> Local workspace <button className="avatar" aria-label="Profile">AV</button></div></header>
    <section className="hero"><div><p className="eyebrow">Personal finance</p><h1>Make room for<br /><em>what matters.</em></h1><p className="hero-copy">Income, spending, and the balance you have left.</p></div><div className="hero-actions"><button className="secondary-button" onClick={() => { setIncomeAmount(income || ''); setIncomeFormOpen(true) }}>+ Add income</button><button className="primary-button" onClick={() => setExpenseFormOpen(true)}><span>+</span> Add expense</button></div></section>
    {error && <div className="alert" role="alert">{error}</div>}
    <section className="summary-grid" aria-label="Finance summary"><article className="summary-card"><span className="card-label">Income</span><strong>{formatMoney(income)}</strong><span className="muted">Your available starting amount</span></article><article className="summary-card"><span className="card-label">Expenses</span><strong>{formatMoney(totals.expensesTotal)}</strong><span className="muted">Across {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}</span></article><article className="summary-card summary-feature"><span className="card-label">Amount left</span><strong>{formatMoney(totals.remaining)}</strong><span className="trend">{totals.remaining >= 0 ? 'Available after expenses' : 'Over your available income'}</span></article></section>
    <section className="expenses-section"><div className="section-heading"><div><p className="eyebrow">Your activity</p><h2>Recent expenses</h2></div><span className="expense-count">{expenses.length} entries</span></div><nav className="filters" aria-label="Expense categories">{categories.map((category) => <button key={category} className={selectedCategory === category ? 'filter active' : 'filter'} onClick={() => setSelectedCategory(category)}>{category}</button>)}</nav><div className="expense-list">{isLoading ? <p className="empty-state">Loading your expenses...</p> : expenses.length === 0 ? <p className="empty-state">Nothing here yet. Add your first expense to start the picture.</p> : expenses.map((expense) => <article className="expense-row" key={expense.id}><div className={`category-icon ${categoryClass(expense.category)}`}>{expense.category.slice(0, 1)}</div><div className="expense-main"><h3>{expense.description}</h3><p>{expense.note || expense.category}</p></div><time>{formatDate(expense.date)}</time><strong>{formatMoney(expense.amount)}</strong><button className="delete-button" aria-label={`Delete ${expense.description}`} onClick={() => removeExpense(expense.id)}>×</button></article>)}</div></section>
    <section className="chart-section"><div><p className="eyebrow">Spending breakdown</p><h2>Expenses by category</h2><p className="chart-copy">Hover a slice to see its amount.</p></div>{pieSegments.length ? <div className="chart-content"><div className="pie-chart"><svg viewBox="0 0 200 200" role="img" aria-label="Expense breakdown by category">{pieSegments.map((slice) => <path key={slice.category} d={slice.path} fill={slice.color} className="pie-slice" onMouseEnter={() => setHoveredSlice(slice)} onMouseLeave={() => setHoveredSlice(null)} />)}</svg><div className="pie-total">{hoveredSlice ? <><span>{hoveredSlice.category}</span><strong>{formatMoney(hoveredSlice.amount)}</strong></> : <><span>Total spent</span><strong>{formatMoney(totals.expensesTotal)}</strong></>}</div></div><div className="chart-legend">{pieSegments.map((slice) => <div className="legend-item" key={slice.category}><span style={{ background: slice.color }} /><span>{slice.category}</span><strong>{formatMoney(slice.amount)}</strong></div>)}</div></div> : <p className="empty-state">Add an expense to see your spending breakdown.</p>}</section>
    {isExpenseFormOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setExpenseFormOpen(false)}><form className="expense-form" onSubmit={submitExpense}><div className="form-header"><div><p className="eyebrow">New entry</p><h2>Add an expense</h2></div><button type="button" className="close-button" onClick={() => setExpenseFormOpen(false)}>×</button></div><label>Description<input required maxLength="80" value={expenseForm.description} onChange={(event) => setExpenseForm({ ...expenseForm, description: event.target.value })} placeholder="e.g. Morning coffee" /></label><div className="form-row"><label>Amount<input required min="0.01" step="0.01" type="number" value={expenseForm.amount} onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })} placeholder="0.00" /></label><label>Date<input required type="date" value={expenseForm.date} onChange={(event) => setExpenseForm({ ...expenseForm, date: event.target.value })} /></label></div><label>Category<select value={expenseForm.category} onChange={(event) => setExpenseForm({ ...expenseForm, category: event.target.value })}>{categories.slice(1).map((category) => <option key={category}>{category}</option>)}</select></label><label>Note <span>(optional)</span><textarea maxLength="280" rows="3" value={expenseForm.note} onChange={(event) => setExpenseForm({ ...expenseForm, note: event.target.value })} placeholder="Add a little context" /></label><button className="primary-button form-submit" type="submit">Save expense</button></form></div>}
    {isIncomeFormOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIncomeFormOpen(false)}><form className="expense-form income-form" onSubmit={submitIncome}><div className="form-header"><div><p className="eyebrow">Available funds</p><h2>Add income</h2></div><button type="button" className="close-button" onClick={() => setIncomeFormOpen(false)}>×</button></div><label>Income amount<input autoFocus required min="0" step="0.01" type="number" value={incomeAmount} onChange={(event) => setIncomeAmount(event.target.value)} placeholder="0.00" /></label><p className="form-help">This sets the income amount used to calculate what remains after expenses.</p><button className="primary-button form-submit" type="submit">Save income</button></form></div>}
  </main>
}

export default App
