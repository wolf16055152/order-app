export function getCartLineKey(menuItemId, selectedOptionIds) {
  const sorted = [...selectedOptionIds].sort().join(',')
  return `${menuItemId}:${sorted}`
}

export function calcUnitPrice(basePrice, options, selectedOptionIds) {
  return (
    basePrice +
    options
      .filter((o) => selectedOptionIds.includes(o.id))
      .reduce((sum, o) => sum + o.extraPrice, 0)
  )
}

export function normalizeOptionIds(selectedOptionIds) {
  return [...selectedOptionIds].sort()
}

export function buildCartLine(menu, selectedOptionIds) {
  const optionIds = normalizeOptionIds(selectedOptionIds)
  const selectedOptions = menu.options.filter((o) => optionIds.includes(o.id))
  const unitPrice = calcUnitPrice(menu.basePrice, menu.options, optionIds)
  return {
    key: getCartLineKey(menu.id, optionIds),
    menuItemId: menu.id,
    menuName: menu.name,
    selectedOptionIds: optionIds,
    selectedOptionLabels: selectedOptions.map((o) => o.name),
    unitPrice,
    quantity: 1,
    lineTotal: unitPrice,
  }
}

export function addToCartLines(cartLines, newLine) {
  const index = cartLines.findIndex((line) => line.key === newLine.key)
  if (index === -1) {
    return [...cartLines, newLine]
  }
  return cartLines.map((line, i) => {
    if (i !== index) return line
    const quantity = line.quantity + 1
    return {
      ...line,
      quantity,
      lineTotal: line.unitPrice * quantity,
    }
  })
}

export function calcCartTotal(cartLines) {
  return cartLines.reduce((sum, line) => sum + line.lineTotal, 0)
}

export function updateCartLineQuantity(cartLines, key, delta) {
  return cartLines.flatMap((line) => {
    if (line.key !== key) return [line]
    const quantity = line.quantity + delta
    if (quantity <= 0) return []
    return [
      {
        ...line,
        quantity,
        lineTotal: line.unitPrice * quantity,
      },
    ]
  })
}

export function formatCartItemName(line) {
  if (line.selectedOptionLabels.length === 0) return line.menuName
  return `${line.menuName} (${line.selectedOptionLabels.join(', ')})`
}
