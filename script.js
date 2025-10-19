// ====== Recipe Finder JavaScript ======

// HTML element references
const searchBtn = document.getElementById("search-btn");
const searchInput = document.getElementById("search-input");
const resultDiv = document.getElementById("result");

// Add Recipe Modal references
const openAddBtn = document.getElementById("open-add-btn");
const closeAddBtn = document.getElementById("close-add-btn");
const saveRecipeBtn = document.getElementById("save-recipe-btn");
const addModal = document.getElementById("add-modal");

// Recipe Input fields
const addName = document.getElementById("add-name");
const addCategory = document.getElementById("add-category");
const addArea = document.getElementById("add-area");
const addImage = document.getElementById("add-image");
const addIngredients = document.getElementById("add-ingredients");
const addInstructions = document.getElementById("add-instructions");

// Local recipes storage
let myRecipes = JSON.parse(localStorage.getItem("myRecipes")) || [];

// ====== SEARCH FUNCTION ======
searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();

  if (!query) {
    alert("Please enter a recipe name!");
    return;
  }

  fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`)
    .then(response => response.json())
    .then(data => {
      resultDiv.innerHTML = "";

      if (!data.meals) {
        resultDiv.innerHTML = `<p>No recipes found for "${query}".</p>`;
        return;
      }

      data.meals.forEach(meal => {
        const recipeCard = document.createElement("div");
        recipeCard.classList.add("recipe");
        recipeCard.innerHTML = `
          <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
          <h3>${meal.strMeal}</h3>
          <p><strong>Category:</strong> ${meal.strCategory}</p>
          <p><strong>Area:</strong> ${meal.strArea}</p>
        `;
        resultDiv.appendChild(recipeCard);
      });
    })
    .catch(error => {
      console.error("Error fetching data:", error);
      resultDiv.innerHTML = `<p>Error loading recipes. Please try again later.</p>`;
    });
});

// ====== ADD RECIPE MODAL ======
openAddBtn.addEventListener("click", () => {
  addModal.classList.remove("hidden");
});

closeAddBtn.addEventListener("click", () => {
  addModal.classList.add("hidden");
});

// ====== SAVE RECIPE ======
saveRecipeBtn.addEventListener("click", () => {
  const name = addName.value.trim();
  const category = addCategory.value.trim();
  const area = addArea.value.trim();
  const image = addImage.value.trim() || "https://via.placeholder.com/300x200";
  const ingredients = addIngredients.value.trim().split("\n").filter(line => line);
  const instructions = addInstructions.value.trim();

  if (!name || !category || !area || !instructions) {
    alert("Please fill out all required fields!");
    return;
  }

  const newRecipe = { name, category, area, image, ingredients, instructions };
  myRecipes.push(newRecipe);
  localStorage.setItem("myRecipes", JSON.stringify(myRecipes));

  alert("✅ Recipe added successfully!");
  addModal.classList.add("hidden");
  clearAddForm();
  showMyRecipes();
});

// ====== Show Saved Recipes ======
function showMyRecipes() {
  resultDiv.innerHTML = "";
  if (myRecipes.length === 0) {
    resultDiv.innerHTML = "<p>No saved recipes yet.</p>";
    return;
  }

  myRecipes.forEach(meal => {
    const recipeCard = document.createElement("div");
    recipeCard.classList.add("recipe");
    recipeCard.innerHTML = `
      <img src="${meal.image}" alt="${meal.name}">
      <h3>${meal.name}</h3>
      <p><strong>Category:</strong> ${meal.category}</p>
      <p><strong>Area:</strong> ${meal.area}</p>
    `;
    resultDiv.appendChild(recipeCard);
  });
}

// ====== Clear Modal Form ======
function clearAddForm() {
  addName.value = "";
  addCategory.value = "";
  addArea.value = "";
  addImage.value = "";
  addIngredients.value = "";
  addInstructions.value = "";
}

// Load saved recipes on page load
document.addEventListener("DOMContentLoaded", showMyRecipes);
