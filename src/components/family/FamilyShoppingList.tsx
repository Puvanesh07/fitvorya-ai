import { useState } from 'react'
import type { ShoppingItem, ShoppingCategory, FamilyMember, CuisinePreference } from '../../types/family'
import { generateShoppingList, SHOPPING_CATEGORY_CONFIG } from '../../data/familyData'

interface Props {
  items: ShoppingItem[]
  members: FamilyMember[]
  cuisinePreference: CuisinePreference
  onItemsChange: (items: ShoppingItem[]) => void
}

export default function FamilyShoppingList({ items, members, cuisinePreference, onItemsChange }: Props) {
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editText,  setEditText]    = useState('')
  const [editQty,   setEditQty]     = useState('')
  const [newName,   setNewName]     = useState('')
  const [newQty,    setNewQty]      = useState('')
  const [newCat,    setNewCat]      = useState<ShoppingCategory>('other')

  function regenerate() {
    const newItems = generateShoppingList(cuisinePreference, members)
    onItemsChange(newItems)
  }

  function toggleCheck(id: string) {
    onItemsChange(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  }

  function startEdit(item: ShoppingItem) {
    setEditingId(item.id)
    setEditText(item.name)
    setEditQty(item.quantity)
  }

  function saveEdit(id: string) {
    onItemsChange(items.map(i => i.id === id ? { ...i, name: editText, quantity: editQty } : i))
    setEditingId(null)
  }

  function removeItem(id: string) {
    onItemsChange(items.filter(i => i.id !== id))
  }

  function addItem() {
    if (!newName.trim()) return
    const item: ShoppingItem = {
      id:       `custom_${Date.now()}`,
      name:     newName.trim(),
      emoji:    '🛒',
      category: newCat,
      quantity: newQty || '—',
      checked:  false,
    }
    onItemsChange([...items, item])
    setNewName('')
    setNewQty('')
  }

  function clearChecked() {
    onItemsChange(items.filter(i => !i.checked))
  }

  const checkedCount   = items.filter(i => i.checked).length
  const uncheckedCount = items.filter(i => !i.checked).length

  // Group by category
  const categories = Object.keys(SHOPPING_CATEGORY_CONFIG) as ShoppingCategory[]
  const grouped = categories
    .map(cat => ({ cat, items: items.filter(i => i.category === cat) }))
    .filter(g => g.items.length > 0)

  return (
    <div className="flex flex-col gap-4">

      {/* Header actions */}
      <div className="card card-shadow flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-black text-text-primary flex items-center gap-2"><span>🛒</span> Family Shopping List</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {uncheckedCount} remaining · {checkedCount} done · {items.length} total
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {checkedCount > 0 && (
              <button onClick={clearChecked}
                className="px-3 py-2 rounded-xl bg-surface2 border border-border text-xs font-bold text-text-secondary hover:border-red-400 hover:text-red-500 transition-all">
                🗑️ Clear done
              </button>
            )}
            <button onClick={regenerate}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold hover:opacity-90 transition-opacity">
              🔄 Regenerate
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {items.length > 0 && (
          <div>
            <div className="h-2 bg-surface2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${(checkedCount / items.length) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-text-muted mt-1 text-right">{Math.round((checkedCount/items.length)*100)}% complete</p>
          </div>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="card card-shadow text-center py-10">
          <p className="text-5xl mb-3">🛒</p>
          <p className="font-black text-text-primary mb-1">No items yet</p>
          <p className="text-sm text-text-secondary mb-4">Generate a shopping list based on your family's cuisine preference.</p>
          <button onClick={regenerate}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm shadow-lg hover:opacity-90 transition-opacity">
            Generate Shopping List
          </button>
        </div>
      )}

      {/* Grouped items */}
      {grouped.map(({ cat, items: catItems }) => {
        const cfg = SHOPPING_CATEGORY_CONFIG[cat]
        return (
          <div key={cat} className="card card-shadow flex flex-col gap-2">
            <h4 className="font-bold text-text-primary text-sm flex items-center gap-2">
              <span>{cfg.emoji}</span> {cfg.label}
              <span className="ml-auto text-xs text-text-muted font-normal">{catItems.filter(i=>!i.checked).length} left</span>
            </h4>
            <div className="flex flex-col gap-1.5">
              {catItems.map(item => (
                <div key={item.id} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${item.checked ? 'opacity-50' : ''}`}>
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleCheck(item.id)}
                    className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-border hover:border-emerald-400'
                    }`}
                  >
                    {item.checked && <span className="text-white text-xs">✓</span>}
                  </button>

                  {/* Item details */}
                  {editingId === item.id ? (
                    <>
                      <input value={editText} onChange={e => setEditText(e.target.value)} className="flex-1 bg-surface2 border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-400" />
                      <input value={editQty}  onChange={e => setEditQty(e.target.value)}  placeholder="qty" className="w-20 bg-surface2 border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-400" />
                      <button onClick={() => saveEdit(item.id)} className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-text-muted">✕</button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm mr-1">{item.emoji}</span>
                      <span className={`flex-1 text-sm font-medium ${item.checked ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                        {item.name}
                      </span>
                      <span className="text-xs text-text-muted flex-shrink-0">{item.quantity}</span>
                      <button onClick={() => startEdit(item)} className="text-[10px] text-text-muted hover:text-text-secondary transition-colors flex-shrink-0">✏️</button>
                      <button onClick={() => removeItem(item.id)} className="text-[10px] text-text-muted hover:text-red-500 transition-colors flex-shrink-0">✕</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Add custom item */}
      {items.length > 0 && (
        <div className="card card-shadow flex flex-col gap-3">
          <h4 className="font-bold text-text-primary text-sm">+ Add custom item</h4>
          <div className="flex gap-2 flex-wrap">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Item name…" className="flex-1 input py-2 text-sm min-w-[120px]" />
            <input value={newQty}  onChange={e => setNewQty(e.target.value)}  placeholder="Qty" className="w-20 input py-2 text-sm" />
            <select value={newCat} onChange={e => setNewCat(e.target.value as ShoppingCategory)} className="input py-2 text-sm w-auto">
              {(Object.keys(SHOPPING_CATEGORY_CONFIG) as ShoppingCategory[]).map(c => (
                <option key={c} value={c}>{SHOPPING_CATEGORY_CONFIG[c].label}</option>
              ))}
            </select>
            <button onClick={addItem} className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold hover:opacity-90 transition-opacity">
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
