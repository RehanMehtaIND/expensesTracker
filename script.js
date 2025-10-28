const desc = document.getElementById('desc')
const amount = document.getElementById('amount')
const category = document.getElementById('category')
const type = document.getElementById('type')
const addBtn = document.getElementById('addBtn')
const list = document.getElementById('transactionList')
const totalIncome = document.getElementById('totalIncome')
const totalExpense = document.getElementById('totalExpense')
const totalBalance = document.getElementById('totalBalance')
const topCategory = document.getElementById('topCategory')
const themeToggle = document.getElementById('themeToggle')
const clearBtn = document.getElementById('clearBtn')
const filterCategory = document.getElementById('filterCategory')
const startDate = document.getElementById('startDate')
const endDate = document.getElementById('endDate')
const monthFilter = document.getElementById('monthFilter')
const editCategoriesBtn = document.getElementById('editCategoriesBtn')
const categoryModal = document.getElementById('categoryModal')
const closeModal = document.getElementById('closeModal')
const categoryList = document.getElementById('categoryList')
const newCategoryInput = document.getElementById('newCategoryInput')
const addCategoryBtn = document.getElementById('addCategoryBtn')

let transactions = JSON.parse(localStorage.getItem('transactions')) || []
let darkMode = JSON.parse(localStorage.getItem('darkMode')) || false
if (darkMode) document.body.classList.add('dark')

let categories = JSON.parse(localStorage.getItem('categories')) || {
  Food: '🍔', Bills: '💡', Travel: '✈️', Shopping: '🛍️', Entertainment: '🎮',
  Savings: '💰', Others: '📦', Family: '👨‍👩‍👧‍👦', Friends: '🤝'
}

const categoryColors = {
  Food: '#ef5350', Bills: '#ab47bc', Travel: '#29b6f6', Shopping: '#5c6bc0',
  Entertainment: '#ffb300', Savings: '#66bb6a', Others: '#8d6e63',
  Family: '#42a5f5', Friends: '#7e57c2'
}

const save = () => localStorage.setItem('transactions', JSON.stringify(transactions))
const saveCategories = () => localStorage.setItem('categories', JSON.stringify(categories))
const round = v => Math.round(v * 100) / 100

const render = () => {
  list.innerHTML = ''
  let filtered = transactions.filter(t => filterCategory.value === 'All' || t.category === filterCategory.value)
  if (startDate.value) filtered = filtered.filter(t => new Date(t.date) >= new Date(startDate.value))
  if (endDate.value) filtered = filtered.filter(t => new Date(t.date) <= new Date(endDate.value))
  if (monthFilter.value) {
    const [year, month] = monthFilter.value.split('-')
    filtered = filtered.filter(t => {
      const d = new Date(t.date)
      return d.getFullYear() == year && (d.getMonth() + 1) == +month
    })
  }

  filtered.forEach((t) => {
    const originalIndex = transactions.indexOf(t)
    const li = document.createElement('li')
    li.className = 'transaction-item'
    const chipColor = categoryColors[t.category] || '#999'
    const icon = categories[t.category] || '📁'
    li.innerHTML = `
      <div class="transaction-info">
        <div class="cat-chip" style="background:${chipColor}">${icon} ${t.category}</div>
        <div>
          <strong>${t.desc}</strong>
          <small style="display:block;opacity:.7">${t.date}</small>
        </div>
      </div>
      <div class="transaction-actions">
        <span style="color:${t.type==='income'?'#4caf50':'#e53935'}">
          ${t.type==='income'?'+':'-'}₹${round(t.amount)}
        </span>
        <button onclick="edit(${originalIndex})">✏️</button>
        <button onclick="del(${originalIndex})">🗑️</button>
      </div>`
    list.appendChild(li)
  })
  updateStats()
  drawCharts()
}

const updateStats = () => {
  const inc = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0)
  const exp = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0)
  totalIncome.textContent = '₹' + round(inc)
  totalExpense.textContent = '₹' + round(exp)
  totalBalance.textContent = '₹' + round(inc - exp)
  const catTotals = {}
  transactions.filter(t => t.type === 'expense').forEach(t => catTotals[t.category] = (catTotals[t.category] || 0) + t.amount)
  const top = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]
  topCategory.textContent = top ? top[0] : '-'
}

const add = () => {
  if (!desc.value || !amount.value) return
  transactions.push({
    desc: desc.value,
    amount: +amount.value,
    category: category.value,
    type: type.value,
    date: new Date().toISOString().split('T')[0]
  })
  save()
  desc.value = ''
  amount.value = ''
  render()
}

const edit = i => {
  const t = transactions[i]
  if (!t) return
  desc.value = t.desc
  amount.value = t.amount
  category.value = t.category in categories ? t.category : 'Others'
  type.value = t.type
  transactions.splice(i, 1)
  save()
  render()
}

const del = i => {
  if (confirm('Delete this transaction?')) {
    transactions.splice(i, 1)
    save()
    render()
  }
}

const clearAll = () => {
  if (confirm('Clear all data?')) {
    transactions = []
    save()
    render()
  }
}

const toggleTheme = () => {
  document.body.classList.toggle('dark')
  darkMode = document.body.classList.contains('dark')
  localStorage.setItem('darkMode', JSON.stringify(darkMode))
}

addBtn.onclick = add
clearBtn.onclick = clearAll
themeToggle.onclick = toggleTheme
filterCategory.onchange = render
startDate.onchange = render
endDate.onchange = render
monthFilter.onchange = render

let pieChart, lineChart
const drawCharts = () => {
  const ctx1 = document.getElementById('pieChart')
  const ctx2 = document.getElementById('lineChart')
  if (pieChart) pieChart.destroy()
  if (lineChart) lineChart.destroy()

  const expenseCats = [...new Set(transactions.filter(t => t.type === 'expense').map(t => t.category))]
  if (expenseCats.length === 0) {
    pieChart = new Chart(ctx1, {
      type: 'pie',
      data: { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['#cccccc'] }] }
    })
  } else {
    const dataPerCat = expenseCats.map(c => round(transactions.filter(t => t.type === 'expense' && t.category === c).reduce((a, b) => a + b.amount, 0)))
    pieChart = new Chart(ctx1, {
      type: 'pie',
      data: { labels: expenseCats, datasets: [{ data: dataPerCat, backgroundColor: expenseCats.map(c => categoryColors[c] || '#999') }] }
    })
  }

  const daily = {}
  transactions.forEach(t => daily[t.date] = (daily[t.date] || 0) + (t.type === 'income' ? t.amount : -t.amount))
  const dates = Object.keys(daily).sort()
  const vals = dates.map(d => round(daily[d]))
  if (dates.length === 0) {
    lineChart = new Chart(ctx2, {
      type: 'line',
      data: { labels: ['No Data'], datasets: [{ label: 'Net', data: [0], fill: false, borderColor: '#5c6bc0', tension: .2 }] }
    })
  } else {
    lineChart = new Chart(ctx2, {
      type: 'line',
      data: { labels: dates, datasets: [{ label: 'Net', data: vals, fill: false, borderColor: '#5c6bc0', tension: .2 }] }
    })
  }
}

const openCategoryModal = () => {
  categoryList.innerHTML = ''
  Object.entries(categories).forEach(([name, icon]) => {
    const li = document.createElement('li')
    li.innerHTML = `
      <span>${icon} ${name}</span>
      <div>
        <button onclick="renameCategory('${name}')">✏️</button>
        <button onclick="deleteCategory('${name}')">🗑️</button>
      </div>`
    categoryList.appendChild(li)
  })
  categoryModal.style.display = 'flex'
}

const renameCategory = oldName => {
  const newName = prompt('Rename category:', oldName)
  if (!newName) return
  if (categories[newName]) {
    alert('Category already exists')
    return
  }
  categories[newName] = categories[oldName]
  delete categories[oldName]
  transactions.forEach(t => { if (t.category === oldName) t.category = newName })
  saveCategories()
  save()
  updateCategorySelects()
  openCategoryModal()
}

const deleteCategory = name => {
  if (!confirm(`Delete category "${name}"? All transactions in this category will be moved to "Others".`)) return
  delete categories[name]
  transactions.forEach(t => { if (t.category === name) t.category = 'Others' })
  if (!categories['Others']) categories['Others'] = '📦'
  saveCategories()
  save()
  updateCategorySelects()
  openCategoryModal()
}

const updateCategorySelects = () => {
  category.innerHTML = ''
  filterCategory.innerHTML = '<option value="All">All Categories</option>'
  Object.keys(categories).forEach(c => {
    const opt = document.createElement('option')
    opt.value = c
    opt.textContent = c
    category.appendChild(opt)
    const opt2 = opt.cloneNode(true)
    filterCategory.appendChild(opt2)
  })
}

addCategoryBtn.onclick = () => {
  const name = newCategoryInput.value.trim()
  if (!name) return
  if (categories[name]) {
    alert('Category already exists')
    return
  }
  categories[name] = '📁'
  saveCategories()
  updateCategorySelects()
  openCategoryModal()
  newCategoryInput.value = ''
}

editCategoriesBtn.onclick = openCategoryModal
closeModal.onclick = () => categoryModal.style.display = 'none'

updateCategorySelects()
render()

window.edit = edit
window.del = del
window.renameCategory = renameCategory
window.deleteCategory = deleteCategory
