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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText,  setEditText]  = useState('')
  const [editQty,   setEditQty]   = useState('')
  const [newName,   setNewName]   = useState('')
  const [newQty,    setNewQty]    = useState('')
  const [newCat,    setNewCat]    = useState<ShoppingCategory>('other')

  function regenerate() { onItemsChange(generateShoppingList(cuisinePreference, members)) }
  function toggleCheck(id: string) { onItemsChange(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i)) }
  function startEdit(item: ShoppingItem) { setEditingId(item.id); setEditText(item.name); setEditQty(item.quantity) }
  function saveEdit(id: string) { onItemsChange(items.map(i => i.id === id ? { ...i, name: editText, quantity: editQty } : i)); setEditingId(null) }
  function removeItem(id: string) { onItemsChange(items.filter(i => i.id !== id)) }
  function clearChecked() { onItemsChange(items.filter(i => !i.checked)) }

  function addItem() {
    if (!newName.trim()) return
    onItemsChange([...items, { id: `custom_${Date.now()}`, name: newName.trim(), emoji: '🛒', category: newCat, quantity: newQty || '—', checked: false }])
    setNewName(''); setNewQty('')
  }

  const checkedCount   = items.filter(i => i.checked).length
  const uncheckedCount = items.filter(i => !i.checked).length
  const pct = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0

  const categories = Object.keys(SHOPPING_CATEGORY_CONFIG) as ShoppingCategory[]
  const grouped    = categories.map(cat => ({ cat, items: items.filter(i => i.category === cat) })).filter(g => g.items.length > 0)

  return (
    <div className="flex flex-col gap-3">

      {/* Header */}
      <div className="g-card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-sm font-black text-text-primary flex items-center gap-2">🛒 Family Shopping List</h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              {uncheckedCount} remaining · {checkedCount} done · {items.length} total
            </p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {checkedCount > 0 && (
              <button onClick={clearChecked} className="g-btn g-btn-sm"
                style={{ color: 'rgb(252 165 165)', borderColor: 'rgb(239 68 68 / 0.2)' }}>
                🗑️ Clear done
              </button>
            )}
            <button onClick={regenerate} className="g-btn g-btn-emerald g-btn-sm">
              🔄 Regenerate
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {items.length > 0 && (
          <div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(255 255 255 / 0.06)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, rgb(16 185 129), rgb(32 195 190))' }} />
            </div>
            <p className="text-[10px] text-text-muted mt-1 text-right">{pct}% complete</p>
          </div>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="g-card p-10 text-center flex flex-col items-center gap-3">
          <p className="text-4xl">🛒</p>
          <p className="font-black text-text-primary text-sm">No items yet</p>
          <p className="text-xs text-text-muted">Generate a list based on your family's cuisine preference.</p>
          <button onClick={regenerate} className="g-btn g-btn-emerald mt-1">
            Generate Shopping List
          </button>
        </div>
      )}

      {/* Grouped items */}
      {grouped.map(({ cat, items: catItems }) => {
        const cfg = SHOPPING_CATEGORY_CONFIG[cat]
        const remaining = catItems.filter(i => !i.checked).length
        return (
          <div key={cat} className="g-card p-3 flex flex-col gap-2">
            {/* Category header */}
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                <span>{cfg.emoji}</span> {cfg.label}
              </h4>
              <span className="text-[10px] text-text-muted">{remaining} left</span>
            </div>

            <div className="flex flex-col gap-1">
              {catItems.map(item => (
                <div key={item.id}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all"
                  style={{
                    background: item.checked ? 'rgb(255 255 255 / 0.02)' : 'rgb(255 255 255 / 0.03)',
                    opacity: item.checked ? 0.55 : 1,
                  }}>

                  {/* Checkbox */}
                  <button onClick={() => toggleCheck(item.id)}
                    className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all"
                    style={item.checked ? {
                      background: 'rgb(16 185 129)', border: '1px solid rgb(16 185 129)',
                    } : {
                      background: 'transparent', border: '1px solid rgb(255 255 255 / 0.2)',
                    }}>
                    {item.checked && <span className="text-white text-[9px] font-black">✓</span>}
                  </button>

                  {/* Item */}
                  {editingId === item.id ? (
                    <>
                      <input value={editText} onChange={e => setEditText(e.target.value)}
                        className="g-input flex-1 py-1 text-xs" style={{ minHeight: 'unset', height: 28 }} />
                      <input value={editQty}  onChange={e => setEditQty(e.target.value)}
                        placeholder="qty" className="g-input w-16 py-1 text-xs" style={{ minHeight: 'unset', height: 28 }} />
                      <button onClick={() => saveEdit(item.id)}
                        className="text-[11px] font-bold text-emerald-400 flex-shrink-0">Save</button>
                      <button onClick={() => setEditingId(null)}
                        className="text-[11px] text-text-muted flex-shrink-0">✕</button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm flex-shrink-0">{item.emoji}</span>
                      <span className={`flex-1 text-xs font-medium ${item.checked ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                        {item.name}
                      </span>
                      <span className="text-[10px] text-text-muted flex-shrink-0">{item.quantity}</span>
                      <button onClick={() => startEdit(item)}
                        className="text-[10px] text-text-muted hover:text-text-secondary transition-colors flex-shrink-0">✏️</button>
                      <button onClick={() => removeItem(item.id)}
                        className="text-[10px] text-text-muted hover:text-red-400 transition-colors flex-shrink-0">✕</button>
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
        <div className="g-card p-3 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-text-secondary">+ Add custom item</h4>
          <div className="flex gap-2 flex-wrap">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder="Item name…" className="g-input flex-1 min-w-[100px]" />
            <input value={newQty} onChange={e => setNewQty(e.target.value)}
              placeholder="Qty" className="g-input w-16" />
            <select value={newCat} onChange={e => setNewCat(e.target.value as ShoppingCategory)}
              className="g-input w-auto" style={{ cursor: 'pointer' }}>
              {(Object.keys(SHOPPING_CATEGORY_CONFIG) as ShoppingCategory[]).map(c => (
                <option key={c} value={c}>{SHOPPING_CATEGORY_CONFIG[c].label}</option>
              ))}
            </select>
            <button onClick={addItem} className="g-btn g-btn-emerald g-btn-sm px-4">Add</button>
          </div>
        </div>
      )}
    </div>
  )
}
