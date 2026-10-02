export const inventory = Object.freeze([
  Object.freeze({ name: 'Notebook', units: 10 }),
  Object.freeze({ name: 'Pencil', units: 0 }),
  Object.freeze({ name: 'Eraser', units: 4 }),
]);
export function selectInventory(query = '', lowStock = false) {
  const term = query.trim().toLowerCase();
  return inventory.filter(item => item.name.toLowerCase().includes(term) && (!lowStock || item.units <= 2));
}
