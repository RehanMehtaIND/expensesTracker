const desc=document.getElementById('desc')
const amount=document.getElementById('amount')
const category=document.getElementById('category')
const type=document.getElementById('type')
const addBtn=document.getElementById('addBtn')
const list=document.getElementById('transactionList')
const totalIncome=document.getElementById('totalIncome')
const totalExpense=document.getElementById('totalExpense')
const totalBalance=document.getElementById('totalBalance')
const topCategory=document.getElementById('topCategory')
const themeToggle=document.getElementById('themeToggle')
const clearBtn=document.getElementById('clearBtn')
const filterCategory=document.getElementById('filterCategory')
const startDate=document.getElementById('startDate')
const endDate=document.getElementById('endDate')

let transactions=JSON.parse(localStorage.getItem('transactions'))||[]
let darkMode=JSON.parse(localStorage.getItem('darkMode'))||false
if(darkMode)document.body.classList.add('dark')

const categoryIcons={
  Food:'🍔',Bills:'💡',Travel:'✈️',Shopping:'🛍️',Entertainment:'🎮',Savings:'💰',Others:'📦'
}
const categoryColors={
  Food:'#ef5350',Bills:'#ab47bc',Travel:'#29b6f6',Shopping:'#5c6bc0',Entertainment:'#ffb300',Savings:'#66bb6a',Others:'#8d6e63'
}

const save=()=>localStorage.setItem('transactions',JSON.stringify(transactions))
const round = v => Math.round(v * 100) / 100

const render=()=>{
  list.innerHTML=''
  let filtered=transactions.filter(t=>filterCategory.value==='All'||t.category===filterCategory.value)
  if(startDate.value)filtered=filtered.filter(t=>new Date(t.date)>=new Date(startDate.value))
  if(endDate.value)filtered=filtered.filter(t=>new Date(t.date)<=new Date(endDate.value))
  filtered.forEach((t,i)=>{
    const li=document.createElement('li')
    li.className='transaction-item'
    const chipColor=categoryColors[t.category]
    li.innerHTML=`
      <div class="transaction-info">
        <div class="cat-chip" style="background:${chipColor}">${categoryIcons[t.category]} ${t.category}</div>
        <div>
          <strong>${t.desc}</strong>
          <small style="display:block;opacity:.7">${t.date}</small>
        </div>
      </div>
      <div class="transaction-actions">
        <span style="color:${t.type==='income'?'#4caf50':'#e53935'}">${t.type==='income'?'+':'-'}₹${round(t.amount)}</span>
        <button onclick="edit(${i})">✏️</button>
        <button onclick="del(${i})">🗑️</button>
      </div>`
    list.appendChild(li)
  })
  updateStats()
  drawCharts()
}

const updateStats=()=>{
  const inc=transactions.filter(t=>t.type==='income').reduce((a,b)=>a+b.amount,0)
  const exp=transactions.filter(t=>t.type==='expense').reduce((a,b)=>a+b.amount,0)
  totalIncome.textContent='₹'+round(inc)
  totalExpense.textContent='₹'+round(exp)
  totalBalance.textContent='₹'+round(inc-exp)
  const catTotals={}
  transactions.filter(t=>t.type==='expense').forEach(t=>catTotals[t.category]=(catTotals[t.category]||0)+t.amount)
  const top=Object.entries(catTotals).sort((a,b)=>b[1]-a[1])[0]
  topCategory.textContent=top?top[0]:'-'
}

const add=()=>{
  if(!desc.value||!amount.value)return
  transactions.push({desc:desc.value,amount:+amount.value,category:category.value,type:type.value,date:new Date().toISOString().split('T')[0]})
  save()
  desc.value='';amount.value=''
  render()
}

const edit=i=>{
  const t=transactions[i]
  desc.value=t.desc
  amount.value=t.amount
  category.value=t.category
  type.value=t.type
  del(i)
}

const del=i=>{
  if(confirm('Delete this transaction?')){
    transactions.splice(i,1)
    save()
    render()
  }
}

const clearAll=()=>{
  if(confirm('Clear all data?')){
    transactions=[]
    save()
    render()
  }
}

const toggleTheme=()=>{
  document.body.classList.toggle('dark')
  darkMode=document.body.classList.contains('dark')
  localStorage.setItem('darkMode',darkMode)
}

addBtn.onclick=add
clearBtn.onclick=clearAll
themeToggle.onclick=toggleTheme
filterCategory.onchange=render
startDate.onchange=render
endDate.onchange=render

let pieChart,lineChart
const drawCharts=()=>{
  const ctx1=document.getElementById('pieChart')
  const ctx2=document.getElementById('lineChart')
  if(pieChart)pieChart.destroy()
  if(lineChart)lineChart.destroy()
  const cats=[...new Set(transactions.map(t=>t.category))]
  const dataPerCat=cats.map(c=>round(transactions.filter(t=>t.type==='expense'&&t.category===c).reduce((a,b)=>a+b.amount,0)))
  pieChart=new Chart(ctx1,{type:'pie',data:{labels:cats,datasets:[{data:dataPerCat,backgroundColor:cats.map(c=>categoryColors[c])}]}})
  const daily={}
  transactions.forEach(t=>daily[t.date]=(daily[t.date]||0)+(t.type==='income'?t.amount:-t.amount))
  const dates=Object.keys(daily).sort(),vals=dates.map(d=>round(daily[d]))
  lineChart=new Chart(ctx2,{type:'line',data:{labels:dates,datasets:[{label:'Net',data:vals,fill:false,borderColor:'#5c6bc0',tension:.2}]}})
}
render()
