import { useEffect, useMemo, useState } from 'react'

const categories = ['All', 'Home', 'Fashion', 'Utilities & Bills', 'Groceries', 'Food & Dining', 'Travel', 'Health & Medical', 'Family', 'Savings', 'Miscellaneous']
const emptyForm = { description: '', amount: '', category: 'Food & Dining', date: new Date().toISOString().slice(0, 10), note: '' }

const formatMoney = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount)
const formatDate = (date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${date}T00:00:00`))

function App() {
  const [expenses, setExpenses] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [form, setForm] = useState(emptyForm)
  const [isFormOpen, setFormOpen] = useState(false)
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadExpenses = async () => {
    setLoading(true)
    try {
      const query = selectedCategory === 'All' ? '' : `?category=${encodeURIComponent(selectedCategory)}`
      const response = await fetch(`/api/expenses${query}`)
      if (!response.ok) throw new Error('Could not load expenses')
      setExpenses(await response.json())
      setError('')
    } catch {
      setError('The API is offline. Start the Java server and refresh this page.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadExpenses() }, [selectedCategory])

  const totals = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    const today = new Date().toISOString().slice(0, 10)
    const thisMonth = expenses.filter((expense) => expense.date.slice(0, 7) === today.slice(0, 7)).reduce((sum, expense) => sum + Number(expense.amount), 0)
    return { total, thisMonth, count: expenses.length }
  }, [expenses])

  const submitExpense = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      })
      if (!response.ok) throw new Error('Could not save expense')
      setForm(emptyForm)
      setFormOpen(false)
      await loadExpenses()
    } catch {
      setError('Could not save the expense. Check that the Java API is running.')
    }
  }

  const removeExpense = async (id) => {
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    await loadExpenses()
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Artha home"><span className="brand-mark">a</span> artha</a>
        <div className="topbar-actions"><span className="status-dot" /> Local workspace <button className="avatar" aria-label="Profile">AV</button></div>
      </header>

      <section className="hero">
        <div><p className="eyebrow">Personal finance / September 2026</p><h1>Make room for<br /><em>what matters.</em></h1><p className="hero-copy">A clear view of the little choices adding up to your life.</p></div>
        <button className="primary-button" onClick={() => setFormOpen(true)}><span>+</span> Add expense</button>
      </section>

      {error && <div className="alert" role="alert">{error}</div>}

      <section className="summary-grid" aria-label="Expense summary">
        <article className="summary-card summary-feature"><span className="card-label">Spent this month</span><strong>{formatMoney(totals.thisMonth)}</strong><span className="trend">↗ Your pace is looking steady</span></article>
        <article className="summary-card"><span className="card-label">All time tracked</span><strong>{formatMoney(totals.total)}</strong><span className="muted">Across {totals.count} {totals.count === 1 ? 'expense' : 'expenses'}</span></article>
        <article className="summary-card"><span className="card-label">Top category</span><strong>{expenses[0]?.category || '—'}</strong><span className="muted">Based on recent activity</span></article>
      </section>

      <section className="expenses-section">
        <div className="section-heading"><div><p className="eyebrow">Your activity</p><h2>Recent expenses</h2></div><span className="expense-count">{expenses.length} entries</span></div>
        <nav className="filters" aria-label="Expense categories">{categories.map((category) => <button key={category} className={selectedCategory === category ? 'filter active' : 'filter'} onClick={() => setSelectedCategory(category)}>{category}</button>)}</nav>
        <div className="expense-list">
          {isLoading ? <p className="empty-state">Loading your expenses...</p> : expenses.length === 0 ? <p className="empty-state">Nothing here yet. Add your first expense to start the picture.</p> : expenses.map((expense) => <article className="expense-row" key={expense.id}><div className={`category-icon ${expense.category.toLowerCase()}`}>{expense.category.slice(0, 1)}</div><div className="expense-main"><h3>{expense.description}</h3><p>{expense.note || expense.category}</p></div><time>{formatDate(expense.date)}</time><strong>{formatMoney(expense.amount)}</strong><button className="delete-button" aria-label={`Delete ${expense.description}`} onClick={() => removeExpense(expense.id)}>×</button></article>)}
        </div>
      </section>

      {isFormOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setFormOpen(false)}><form className="expense-form" onSubmit={submitExpense}><div className="form-header"><div><p className="eyebrow">New entry</p><h2>Add an expense</h2></div><button type="button" className="close-button" onClick={() => setFormOpen(false)}>×</button></div><label>Description<input required maxLength="80" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="e.g. Morning coffee" /></label><div className="form-row"><label>Amount<input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0.00" /></label><label>Date<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label></div><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.slice(1).map((category) => <option key={category}>{category}</option>)}</select></label><label>Note <span>(optional)</span><textarea maxLength="280" rows="3" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Add a little context" /></label><button className="primary-button form-submit" type="submit">Save expense</button></form></div>}
    </main>
  )
}

export default App
