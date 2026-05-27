import { useState } from 'react'
import { formatPrice } from '../utils/formatPrice'

function MenuCard({ menu, onAddToCart }) {
  const [selectedOptionIds, setSelectedOptionIds] = useState([])

  function toggleOption(optionId) {
    setSelectedOptionIds((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId],
    )
  }

  function handleAdd() {
    onAddToCart(menu, selectedOptionIds)
  }

  return (
    <article className="menu-card">
      <div className="menu-card__image" aria-hidden="true" />
      <div className="menu-card__body">
        <h2 className="menu-card__name">{menu.name}</h2>
        <p className="menu-card__price">{formatPrice(menu.basePrice)}</p>
        <p className="menu-card__description">
          {menu.description || '간단한 설명...'}
        </p>
        <fieldset className="menu-card__options">
          <legend className="visually-hidden">{menu.name} 옵션</legend>
          {menu.options.map((option) => (
            <label key={option.id} className="menu-card__option">
              <input
                type="checkbox"
                checked={selectedOptionIds.includes(option.id)}
                onChange={() => toggleOption(option.id)}
              />
              <span>
                {option.name} (+{option.extraPrice.toLocaleString('ko-KR')}원)
              </span>
            </label>
          ))}
        </fieldset>
        <button type="button" className="btn btn--primary" onClick={handleAdd}>
          담기
        </button>
      </div>
    </article>
  )
}

export default MenuCard
