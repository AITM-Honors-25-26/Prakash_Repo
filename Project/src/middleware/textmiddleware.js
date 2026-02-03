const getMenuData = () => {
  return {
    id: 1,
    name: "Tiramisu",
    price: 12.99,
    category: "Dessert"
  };
};

// Usage
const item = getMenuData();
console.log(item.name); // Output: Tiramisu

export default getMenuData